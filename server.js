const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.BRAWLHALLA_API_BASE || 'https://api.brawlhalla.com/v1';
const OFFICIAL_ESPORTS_BASE = 'https://www.brawlhalla.com/rankings/esports';
const OFFICIAL_LEGENDS_BASE = 'https://www.brawlhalla.com/legends';
const BRAWLTOOLS_API_BASE = process.env.BRAWLTOOLS_API_BASE || 'https://api.brawltools.com/v2';
const COREHALLA_TRPC_BASE = process.env.COREHALLA_TRPC_BASE || 'https://corehalla.com/api/trpc';
const DATA_DIR = path.join(__dirname, 'data');
const SNAPSHOTS_FILE = path.join(DATA_DIR, 'snapshots.json');
const NAMES_FILE = path.join(DATA_DIR, 'name-history.json');
const PROFILE_CACHE_FILE = path.join(DATA_DIR, 'profile-cache.json');
const ESPORTS_FILE = path.join(DATA_DIR, 'esports.json');
const QUEUE_ACTIVITY_FILE = path.join(DATA_DIR, 'queue-activity.json');
const GUILDS_FILE = path.join(DATA_DIR, 'guild-cache.json');
const WALL_USERS_FILE = path.join(DATA_DIR, 'arena-users.json');
const WALL_POSTS_FILE = path.join(DATA_DIR, 'arena-posts.json');
const WALL_UPLOADS_DIR = path.join(__dirname, 'uploads', 'arena');
const WALL_SESSION_SECRET = process.env.WALL_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const WALL_SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const WALL_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const WALL_MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const wallRateLimits = new Map();
const cache = new Map();
const apiInFlight = new Map();
const corehallaInFlight = new Map();
const imageCache = new Map();
const fileQueues = new Map();
const queueTrackers = new Map();
const profileResponseCache = new Map();
const PROFILE_RESPONSE_TTL_MS = 6 * 60 * 60_000;
const PROFILE_DISK_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60_000;
const PROFILE_DISK_CACHE_LIMIT = 200;

app.disable('x-powered-by');
app.set('etag', 'strong');
app.use(express.json({ limit: '8mb' }));
app.use((req, res, next) => {
  const isApi = req.path.startsWith('/api/');
  const isHtml = req.path === '/' || req.path.endsWith('.html') || req.path.startsWith('/player/') || req.path.startsWith('/clan/') || req.path === '/queue' || req.path === '/arena';
  const isVersionedAsset = /\.(?:js|css|svg|png|webp|jpg|jpeg|gif|ico)$/i.test(req.path);
  if (isApi || isHtml) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else if (isVersionedAsset) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  maxAge: '1y',
  immutable: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  }
}));
app.use('/uploads/arena', express.static(WALL_UPLOADS_DIR, { etag: true, maxAge: '30d', immutable: true }));

app.get('/player/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/clan/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/queue', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/arena', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


function asInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function allowed(value, values, fallback) {
  return values.includes(value) ? value : fallback;
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase();
}


function sanitizePlayerName(value) {
  return String(value || '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function balancedPair(value, open, close) {
  let depth = 0;
  for (const char of value) {
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

const RESERVED_PROFILE_LABELS = new Set([
  'menu', 'home', 'profile', 'club', 'meta', 'overview', 'ranked', 'legends', 'weapons',
  'settings', 'search', 'share', 'stats', 'statistics', 'account', 'player', 'players',
  'main', 'main legends', 'main weapons', 'game time', 'account xp', 'account level',
  'sign in', 'sign in to add favorites', 'favorites', 'history', 'identity', 'known names',
  'events', 'overview', 'details', 'matches', 'rank', 'career', 'leaderboard', 'tournaments',
  'power ranking', 'followers', 'following', 'social', 'socials', 'about', 'help', 'contact',
  'privacy', 'terms', 'discord', 'twitter', 'twitch', 'youtube', 'steam', 'platform', 'region'
]);

function isPlausiblePlayerName(value) {
  const clean = sanitizePlayerName(value);
  if (clean.length < 2 || clean.length > 32) return false;
  if (!/[\p{L}\p{N}]/u.test(clean)) return false;
  if (!/^[\p{L}\p{N}\p{M} ._\-|\[\]()'!?#@+~]+$/u.test(clean)) return false;
  if (!balancedPair(clean, '[', ']') || !balancedPair(clean, '(', ')')) return false;
  if (/\b(function|return|const|let|var|undefined|null|document|window|onclick|className)\b/i.test(clean)) return false;
  if (/=>|==|!=|&&|\|\||[{};:=<>]/.test(clean)) return false;
  const punctuation = (clean.match(/[^\p{L}\p{N}\p{M}\s]/gu) || []).length;
  if (punctuation / Math.max(clean.length, 1) > 0.35) return false;
  if (RESERVED_PROFILE_LABELS.has(normalizeName(clean))) return false;
  return true;
}

function isGeneratedPlayerName(value) {
  return /^Player\s+\d+$/i.test(sanitizePlayerName(value));
}

function cleanNameHistoryList(list = []) {
  const seen = new Set();
  return (Array.isArray(list) ? list : [])
    .map((item) => ({
      ...item,
      name: sanitizePlayerName(item?.name),
      sources: Array.isArray(item?.sources) ? item.sources.filter(Boolean) : []
    }))
    .filter((item) => isPlausiblePlayerName(item.name) && !isGeneratedPlayerName(item.name))
    // Old builds scraped navigation labels from third-party HTML. Entries that
    // exist only because of that unreliable scraper are intentionally removed.
    .filter((item) => !(item.sources.length && item.sources.every((source) => source === 'external-profile')))
    .filter((item) => {
      const key = normalizeName(item.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.last_seen || 0) - new Date(a.last_seen || 0))
    .slice(0, 30);
}

async function brawlToolsFetch(endpoint, ttlMs = 15 * 60_000) {
  const key = `brawltools:${endpoint}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${BRAWLTOOLS_API_BASE}${endpoint}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Nad-BH-Tracker/5.5'
      },
      signal: controller.signal
    });

    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { message: text || 'Invalid esports API response' };
    }

    if (!response.ok) {
      const error = new Error(body?.message || `Esports API error (${response.status})`);
      error.status = response.status;
      throw error;
    }

    cache.set(key, { value: body, expiresAt: now + ttlMs });
    return body;
  } finally {
    clearTimeout(timeout);
  }
}

async function apiFetch(endpoint, ttlMs = 60_000) {
  const now = Date.now();
  const cached = cache.get(endpoint);
  if (cached && cached.expiresAt > now) return cached.value;
  if (apiInFlight.has(endpoint)) return apiInFlight.get(endpoint);

  const task = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6_000);
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PeakHalla/7.26'
        },
        signal: controller.signal
      });

      const text = await response.text();
      let body;
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = { message: text || 'Invalid API response' };
      }

      if (!response.ok) {
        const error = new Error(body?.message || `Brawlhalla API error (${response.status})`);
        error.status = response.status;
        throw error;
      }

      cache.set(endpoint, { value: body, expiresAt: Date.now() + ttlMs });
      return body;
    } finally {
      clearTimeout(timeout);
    }
  })();

  apiInFlight.set(endpoint, task);
  try { return await task; }
  finally { apiInFlight.delete(endpoint); }
}


async function apiFetchFresh(endpoint) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    cache.delete(endpoint);
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
        'User-Agent': 'PeakHalla/7.26'
      },
      cache: 'no-store',
      signal: controller.signal
    });
    const text = await response.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { message: text || 'Invalid API response' };
    }
    if (!response.ok) {
      const error = new Error(body?.message || `Brawlhalla API error (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}


function unwrapTrpcPayload(body) {
  const candidate = Array.isArray(body) ? body[0] : body;
  return candidate?.result?.data?.json ?? candidate?.result?.data ?? candidate?.json ?? candidate ?? null;
}

async function corehallaFetch(procedure, input = {}, ttlMs = 5 * 60_000, forceFresh = false) {
  const key = `corehalla:${procedure}:${JSON.stringify(input)}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (!forceFresh && cached && cached.expiresAt > now) return cached.value;
  const inFlightKey = `${key}:${forceFresh ? 'fresh' : 'normal'}`;
  if (corehallaInFlight.has(inFlightKey)) return corehallaInFlight.get(inFlightKey);

  const task = (async () => {
    const payloads = [{ json: input }, input];
    let lastError = null;
    for (const payload of payloads) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6_000);
      try {
        const encodedInput = encodeURIComponent(JSON.stringify(payload));
        const cacheBust = forceFresh ? `&_=${Date.now()}` : '';
        const url = `${COREHALLA_TRPC_BASE}/${encodeURIComponent(procedure)}?input=${encodedInput}${cacheBust}`;
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache, no-store, max-age=0',
            Pragma: 'no-cache',
            'User-Agent': 'PeakHalla/7.26'
          },
          cache: 'no-store',
          signal: controller.signal
        });
        const raw = await response.text();
        let body;
        try { body = raw ? JSON.parse(raw) : null; }
        catch { body = null; }
        if (!response.ok) {
          const error = new Error(body?.error?.json?.message || body?.message || `Corehalla data error (${response.status})`);
          error.status = response.status;
          lastError = error;
          if (response.status === 400 || response.status === 422) continue;
          throw error;
        }
        const value = unwrapTrpcPayload(body);
        cache.set(key, { value, expiresAt: Date.now() + ttlMs });
        return value;
      } catch (error) {
        lastError = error;
        if (error.name === 'AbortError') break;
      } finally {
        clearTimeout(timeout);
      }
    }
    throw lastError || new Error('Corehalla data is unavailable.');
  })();

  corehallaInFlight.set(inFlightKey, task);
  try { return await task; }
  finally { corehallaInFlight.delete(inFlightKey); }
}

function extractCorehallaStats(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const candidates = [payload, payload.player, payload.stats, payload.playerStats, payload.data];
  return candidates.find((item) => item && typeof item === 'object' && (
    item.brawlhalla_id !== undefined || item.brawlhallaId !== undefined ||
    item.xp !== undefined || item.level !== undefined || Array.isArray(item.legends)
  )) || null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function settleWithin(promise, timeoutMs, fallback) {
  return Promise.race([
    Promise.resolve(promise).catch(() => fallback),
    wait(timeoutMs).then(() => fallback)
  ]);
}

function getCachedProfileResponse(playerId) {
  const key = String(playerId);
  const cached = profileResponseCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    profileResponseCache.delete(key);
    return null;
  }
  return cached.value;
}

async function getDiskCachedProfileResponse(playerId) {
  const all = await readJson(PROFILE_CACHE_FILE, {});
  const entry = all[String(playerId)];
  if (!entry?.value) return null;
  const age = Date.now() - Number(entry.saved_at || 0);
  if (!Number.isFinite(age) || age > PROFILE_DISK_CACHE_MAX_AGE_MS) return null;
  profileResponseCache.set(String(playerId), {
    value: entry.value,
    expiresAt: Date.now() + PROFILE_RESPONSE_TTL_MS
  });
  return entry.value;
}

function persistProfileResponse(playerId, value) {
  updateJson(PROFILE_CACHE_FILE, {}, (all) => {
    all[String(playerId)] = { saved_at: Date.now(), value };
    const entries = Object.entries(all)
      .sort((a, b) => Number(b[1]?.saved_at || 0) - Number(a[1]?.saved_at || 0))
      .slice(0, PROFILE_DISK_CACHE_LIMIT);
    for (const key of Object.keys(all)) delete all[key];
    for (const [key, entry] of entries) all[key] = entry;
  }).catch(() => null);
}

function setCachedProfileResponse(playerId, value) {
  profileResponseCache.set(String(playerId), {
    value,
    expiresAt: Date.now() + PROFILE_RESPONSE_TTL_MS
  });
  persistProfileResponse(playerId, value);
}

async function peekKnownNames(playerId) {
  const all = await readJson(NAMES_FILE, {});
  return cleanNameHistoryList(all[String(playerId)]);
}

async function readSnapshotHistory(playerId) {
  const all = await readJson(SNAPSHOTS_FILE, {});
  return Array.isArray(all[String(playerId)]) ? all[String(playerId)] : [];
}

async function getCorehallaPlayerStats(playerId, forceFresh = false) {
  const variants = [String(playerId), Number(playerId)].map((value) =>
    corehallaFetch('getPlayerStats', { playerId: value }, 2 * 60_000, forceFresh).catch(() => null)
  );
  const payloads = await Promise.all(variants);
  for (const payload of payloads) {
    const stats = extractCorehallaStats(payload);
    if (stats) return stats;
  }
  return null;
}

async function getCorehallaPlayerAliases(playerId, forceFresh = false) {
  const variants = [String(playerId), Number(playerId)].map((value) =>
    corehallaFetch('getPlayerAliases', { playerId: value }, 15 * 60_000, forceFresh).catch(() => null)
  );
  const payloads = await Promise.all(variants);
  const aliases = [];
  for (const payload of payloads) {
    const raw = Array.isArray(payload) ? payload : (payload?.aliases || payload?.data || []);
    for (const item of raw) {
      const name = cleanAliasForSearch(typeof item === 'string' ? item : item?.alias || item?.name);
      if (name) aliases.push(name);
    }
  }
  return [...new Set(aliases)];
}

function corehallaRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.players)) return payload.players;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function cleanAliasForSearch(value) {
  const clean = sanitizePlayerName(value);
  if (!clean || clean.length > 32 || isGeneratedPlayerName(clean)) return '';
  return clean;
}

async function searchCorehallaAliases(alias, page = 1, forceFresh = false) {
  const pageValues = [String(page), Number(page)];
  for (const pageValue of pageValues) {
    const payload = await corehallaFetch(
      'searchPlayerAlias',
      { alias: String(alias).trim(), page: pageValue },
      3 * 60_000,
      forceFresh
    ).catch(() => null);
    const rows = corehallaRows(payload);
    if (!rows.length) continue;

    return rows.map((item) => {
      const id = Number(item?.playerId ?? item?.player_id ?? item?.brawlhallaId ?? item?.brawlhalla_id ?? item?.id);
      const rawAliases = [
        item?.mainAlias,
        item?.main_alias,
        item?.name,
        item?.alias,
        ...(Array.isArray(item?.otherAliases) ? item.otherAliases : []),
        ...(Array.isArray(item?.other_aliases) ? item.other_aliases : []),
        ...(Array.isArray(item?.aliases) ? item.aliases : [])
      ];
      const aliases = [...new Set(rawAliases.map(cleanAliasForSearch).filter(Boolean))];
      // Corehalla can legitimately return a current alias with one character.
      // Do not discard that player when the searched old alias is valid.
      const name = cleanAliasForSearch(item?.mainAlias ?? item?.main_alias ?? item?.name ?? item?.alias)
        || aliases[0]
        || `Player ${id}`;
      return { id, name, aliases };
    }).filter((item) => Number.isSafeInteger(item.id) && item.id > 0 && item.aliases.length > 0);
  }
  return [];
}

async function searchCorehallaAliasesBroad(alias, maxPages = 8, forceFresh = false) {
  const needle = normalizeName(alias);
  let firstPage = await searchCorehallaAliases(alias, 1, false).catch(() => []);
  if (!firstPage.length && forceFresh) firstPage = await searchCorehallaAliases(alias, 1, true).catch(() => []);

  const hasStrongMatch = firstPage.some((item) =>
    normalizeName(item.name) === needle || (item.aliases || []).some((name) => normalizeName(name) === needle)
  );
  const extraPages = hasStrongMatch ? [] : Array.from({ length: Math.max(0, Math.min(maxPages, 5) - 1) }, (_, index) => index + 2);
  const extraRows = extraPages.length
    ? (await Promise.all(extraPages.map((page) => searchCorehallaAliases(alias, page, forceFresh).catch(() => [])))).flat()
    : [];

  const merged = new Map();
  for (const item of [...firstPage, ...extraRows]) {
    const current = merged.get(Number(item.id));
    if (!current) merged.set(Number(item.id), { ...item, aliases: [...item.aliases] });
    else {
      current.aliases = [...new Set([...(current.aliases || []), ...(item.aliases || [])])];
      if ((!current.name || /^Player \d+$/.test(current.name)) && item.name) current.name = item.name;
    }
  }
  return [...merged.values()].sort((a, b) => {
    const score = (item) => Math.max(aliasScore(item.name, needle), ...(item.aliases || []).map((name) => aliasScore(name, needle)), 0);
    return score(b) - score(a);
  });
}

function legacyField(source, ...keys) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') return source[key];
  }
  return null;
}

function normalizeLegacyLegend(legend = {}) {
  return {
    ...legend,
    legend_id: Number(legacyField(legend, 'legend_id', 'legendId', 'id')),
    games: legacyField(legend, 'games'),
    wins: legacyField(legend, 'wins'),
    level: legacyField(legend, 'level'),
    xp: legacyField(legend, 'xp'),
    xp_percentage: legacyField(legend, 'xp_percentage', 'xpPercentage'),
    match_time: legacyField(legend, 'match_time', 'matchtime', 'matchTime'),
    kos: legacyField(legend, 'kos'),
    falls: legacyField(legend, 'falls'),
    suicides: legacyField(legend, 'suicides'),
    team_kos: legacyField(legend, 'team_kos', 'teamkos', 'teamKos'),
    damage_dealt: legacyField(legend, 'damage_dealt', 'damagedealt', 'damageDealt'),
    damage_taken: legacyField(legend, 'damage_taken', 'damagetaken', 'damageTaken'),
    damage_unarmed: legacyField(legend, 'damage_unarmed', 'damageunarmed', 'damageUnarmed'),
    damage_thrown_item: legacyField(legend, 'damage_thrown_item', 'damagethrownitem', 'damageThrownItem'),
    damage_gadgets: legacyField(legend, 'damage_gadgets', 'damagegadgets', 'damageGadgets'),
    damage_weapon_one: legacyField(legend, 'damage_weapon_one', 'damageweaponone', 'damageWeaponOne'),
    damage_weapon_two: legacyField(legend, 'damage_weapon_two', 'damageweapontwo', 'damageWeaponTwo'),
    ko_unarmed: legacyField(legend, 'ko_unarmed', 'kounarmed', 'koUnarmed'),
    ko_gadgets: legacyField(legend, 'ko_gadgets', 'kogadgets', 'koGadgets'),
    ko_weapon_one: legacyField(legend, 'ko_weapon_one', 'koweaponone', 'koWeaponOne'),
    ko_weapon_two: legacyField(legend, 'ko_weapon_two', 'koweapontwo', 'koWeaponTwo'),
    time_held_weapon_one: legacyField(legend, 'time_held_weapon_one', 'timeheldweaponone', 'timeHeldWeaponOne'),
    time_held_weapon_two: legacyField(legend, 'time_held_weapon_two', 'timeheldweapontwo', 'timeHeldWeaponTwo')
  };
}

function hasReportedValue(value) {
  return value !== null && value !== undefined && value !== '';
}

function preferLiveValue(liveValue, fallbackValue) {
  return hasReportedValue(liveValue) ? liveValue : fallbackValue;
}

// Account and legend XP/levels are lifetime progression values and never
// decrease. When providers disagree, keep the highest reported value so an
// older cache or compatibility endpoint can never overwrite newer progress.
function highestProgressValue(...values) {
  const reported = values
    .filter(hasReportedValue)
    .map((value) => Number(value))
    .filter(Number.isFinite);
  return reported.length ? Math.max(...reported) : null;
}

function progressPercentageForBestXp(live = {}, fallback = {}) {
  const liveXp = Number(live?.xp);
  const fallbackXp = Number(fallback?.xp);
  if (Number.isFinite(fallbackXp) && (!Number.isFinite(liveXp) || fallbackXp > liveXp)) {
    return preferLiveValue(fallback?.xp_percentage, live?.xp_percentage);
  }
  return preferLiveValue(live?.xp_percentage, fallback?.xp_percentage);
}

function mergeLifetimeStats(v1 = {}, legacy = null) {
  if (!legacy) return v1 || {};

  const legacyLegends = new Map((legacy.legends || []).map((legend) => {
    const normalized = normalizeLegacyLegend(legend);
    return [Number(normalized.legend_id), normalized];
  }));
  const v1Legends = new Map((v1?.legends || []).map((legend) => [Number(legend.legend_id), legend]));
  const ids = new Set([...v1Legends.keys(), ...legacyLegends.keys()]);

  const legends = [...ids].map((id) => {
    const live = v1Legends.get(id) || {};
    const old = legacyLegends.get(id) || {};
    const merged = { ...old, ...live, legend_id: id };

    // Keep the newest progression regardless of which provider returned it.
    // Levels and XP only move upward, so the highest valid value is the safe
    // choice when Brawlhalla's compatibility endpoint and Corehalla disagree.
    merged.level = highestProgressValue(live.level, old.level);
    merged.xp = highestProgressValue(live.xp, old.xp);
    merged.xp_percentage = progressPercentageForBestXp(live, old);

    // Keep legacy match time only as a compatibility fallback, since some
    // accounts receive a more complete value there.
    merged.match_time = preferLiveValue(live.match_time, old.match_time);

    const fallbackFields = [
      'games','wins','kos','falls','suicides','team_kos','damage_dealt','damage_taken',
      'damage_unarmed','damage_thrown_item','damage_gadgets','damage_weapon_one',
      'damage_weapon_two','ko_unarmed','ko_gadgets','ko_weapon_one','ko_weapon_two',
      'time_held_weapon_one','time_held_weapon_two'
    ];
    for (const field of fallbackFields) {
      merged[field] = preferLiveValue(live[field], old[field]);
    }
    return merged;
  });

  return {
    ...legacy,
    ...v1,
    name: preferLiveValue(v1?.name, legacy.name),
    brawlhalla_id: preferLiveValue(v1?.brawlhalla_id, legacy.brawlhalla_id ?? legacy.brawlhallaId),
    level: highestProgressValue(v1?.level, legacyField(legacy, 'level')),
    xp: highestProgressValue(v1?.xp, legacyField(legacy, 'xp')),
    xp_percentage: progressPercentageForBestXp(v1, {
      xp: legacyField(legacy, 'xp'),
      xp_percentage: legacyField(legacy, 'xp_percentage', 'xpPercentage')
    }),
    games: preferLiveValue(v1?.games, legacyField(legacy, 'games')),
    wins: preferLiveValue(v1?.wins, legacyField(legacy, 'wins')),
    legends
  };
}


async function htmlFetch(url, ttlMs = 15 * 60_000) {
  const key = `html:${url}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'Nad-BH-Tracker/5.5'
      },
      signal: controller.signal
    });
    if (!response.ok) {
      const error = new Error(`Official rankings error (${response.status})`);
      error.status = response.status;
      throw error;
    }
    const html = await response.text();
    cache.set(key, { value: html, expiresAt: now + ttlMs });
    return html;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function htmlText(fragment) {
  return decodeHtml(String(fragment || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}


function extractExternalAliases(html, _playerId, currentName = '') {
  const aliases = new Set();
  const pushAlias = (value) => {
    const clean = sanitizePlayerName(decodeHtml(value));
    if (!isPlausiblePlayerName(clean)) return;
    if (normalizeName(clean) === normalizeName(currentName)) return;
    aliases.add(clean);
  };

  const raw = String(html || '');

  // Only trust explicit alias fields embedded in structured page data.
  // We intentionally do NOT scrape visible buttons/menus because those were
  // previously saved as fake old names (for example: Menu, Home, Profile).
  const patterns = [
    /"aliases"\s*:\s*\[(.*?)\]/gis,
    /"previousNames"\s*:\s*\[(.*?)\]/gis,
    /"knownNames"\s*:\s*\[(.*?)\]/gis,
    /"formerNames"\s*:\s*\[(.*?)\]/gis
  ];

  for (const pattern of patterns) {
    for (const match of raw.matchAll(pattern)) {
      for (const alias of match[1].matchAll(/"((?:\\.|[^"\\]){2,64})"/g)) {
        try { pushAlias(JSON.parse(`"${alias[1]}"`)); } catch { pushAlias(alias[1]); }
      }
    }
  }

  return [...aliases].slice(0, 8);
}

async function getExternalProfileAliases(_playerId, _currentName = '') {
  // The official gameplay API does not expose a complete rename history.
  // We only show names this tracker has directly observed from official
  // player/ranking responses and daily snapshots. Third-party HTML scraping
  // was removed because it could mistake navigation labels for usernames.
  return [];
}

function parseOfficialPowerRankings(html) {
  const rankings = [];
  const rowMatches = String(html || '').matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const rowMatch of rowMatches) {
    const rawCells = [...rowMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)];
    if (rawCells.length < 6) continue;
    const cells = rawCells.map((match) => htmlText(match[1]));
    const earningsIndex = cells.findIndex((cell) => /\$\s*[\d,.]+/.test(cell));
    if (earningsIndex < 1) continue;

    let rank = null;
    for (let index = 0; index < earningsIndex; index += 1) {
      const match = cells[index].match(/^#?\s*(\d+)$/);
      if (match) {
        rank = Number(match[1]);
        break;
      }
    }

    let name = '';
    for (let index = earningsIndex - 1; index >= 0; index -= 1) {
      const candidate = cells[index].trim();
      if (!candidate || /^#?\s*\d+$/.test(candidate)) continue;
      if (/^(rank|name|earnings|top\s*8|top\s*32|medals?)$/i.test(candidate)) continue;
      name = candidate;
      break;
    }

    const earningsMatch = cells[earningsIndex].match(/\$\s*([\d,]+(?:\.\d+)?)/);
    const metrics = cells.slice(earningsIndex + 1)
      .flatMap((cell) => (cell.match(/\d+(?:\.\d+)?/g) || []).map(Number));

    if (!rank || !name || !earningsMatch || metrics.length < 5) continue;
    rankings.push({
      rank,
      name,
      earnings: Number(earningsMatch[1].replace(/,/g, '')),
      top8: Number(metrics[0] || 0),
      top32: Number(metrics[1] || 0),
      gold: Number(metrics[2] || 0),
      silver: Number(metrics[3] || 0),
      bronze: Number(metrics[4] || 0)
    });
  }

  return rankings.filter((item, index, all) =>
    all.findIndex((other) => other.rank === item.rank && normalizeName(other.name) === normalizeName(item.name)) === index
  );
}

async function getOfficialEsportsRankings(region, mode) {
  const url = `${OFFICIAL_ESPORTS_BASE}/${encodeURIComponent(region)}/${encodeURIComponent(mode)}/1?sortBy=powerRanking`;
  const html = await htmlFetch(url);
  const pageText = htmlText(html);
  const updatedMatch = pageText.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/i);
  return {
    rankings: parseOfficialPowerRankings(html),
    updated_at: updatedMatch?.[1] || null,
    source_url: url
  };
}

async function readJson(file, fallback = {}) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2));
  await fs.rename(tmp, file);
}

function updateJson(file, fallback, mutator) {
  const previous = fileQueues.get(file) || Promise.resolve();
  const task = previous
    .catch(() => undefined)
    .then(async () => {
      const current = await readJson(file, fallback);
      const result = await mutator(current);
      await writeJson(file, current);
      return result;
    });
  fileQueues.set(file, task);
  return task;
}

async function mapWithConcurrency(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return output;
}

function legendSlug(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function legendWikiName(name) {
  const clean = String(name || '').trim();
  if (clean === 'Bodvar') return 'Bödvar';
  return clean;
}

function legendImageCandidates(name) {
  const clean = String(name || '').trim();
  const slug = legendSlug(clean);
  if (!clean || !slug) return [];
  const version = '7.26.0';
  // User-supplied local portraits are the fastest and most consistent source.
  // The API proxy remains a fallback for future legends not yet in the pack.
  return [
    `/assets/legends/${encodeURIComponent(slug)}.webp?v=${version}`,
    `/api/legend-image/${encodeURIComponent(clean)}?v=${version}`,
    `/api/legend-art/${encodeURIComponent(clean)}?v=${version}`
  ];
}

function legendImageUrl(name) {
  return legendImageCandidates(name)[0] || null;
}

async function fetchLegendArtwork(name) {
  const slug = legendSlug(name);
  if (!slug) return null;
  const cacheKey = `portrait:${slug}`;
  const now = Date.now();
  const cached = imageCache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached;

  const cleanName = String(name || '').trim();
  const wikiName = legendWikiName(cleanName);
  const compactName = cleanName.replace(/\s+/g, '');
  const filenames = [
    `Portrait ${cleanName}.png`,
    `Portrait ${compactName}.png`,
    `Portrait ${wikiName}.png`,
    `Legends Portrait ${cleanName}.png`,
    `Official Artwork ${cleanName}.png`,
    `${cleanName}.png`
  ];
  const urls = [...new Set(filenames)].map((filename) =>
    `https://brawlhalla.wiki.gg/wiki/Special:Redirect/file/${encodeURIComponent(filename)}`
  );

  for (const url of urls) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'User-Agent': 'PeakHalla/7.26',
          Referer: 'https://brawlhalla.wiki.gg/'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      if (!response.ok) continue;
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length) continue;
      const value = { buffer, contentType, expiresAt: now + 7 * 24 * 60 * 60_000 };
      imageCache.set(cacheKey, value);
      return value;
    } catch {
      // Try the next portrait source.
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

async function fetchOfficialLegendImage(name) {
  const slug = legendSlug(name);
  if (!slug) return null;
  const now = Date.now();
  const cached = imageCache.get(slug);
  if (cached && cached.expiresAt > now) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const pageResponse = await fetch(`${OFFICIAL_LEGENDS_BASE}/${encodeURIComponent(slug)}`, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': 'PeakHalla/7.26'
      },
      signal: controller.signal
    });
    if (!pageResponse.ok) return null;
    const html = await pageResponse.text();
    const candidates = [...html.matchAll(/https:\/\/cms\.brawlhalla\.com\/c\/uploads\/[^"'<>\s]+\.(?:png|webp|jpe?g)/gi)]
      .map((match) => match[0].replace(/&amp;/g, '&'));
    const splashUrl = candidates.find((url) => /splash/i.test(url)) || candidates[0];
    if (!splashUrl) return null;

    const imageResponse = await fetch(splashUrl, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: 'https://www.brawlhalla.com/'
      },
      signal: controller.signal
    });
    if (!imageResponse.ok) return null;
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const value = { buffer, contentType, expiresAt: now + 24 * 60 * 60_000 };
    imageCache.set(slug, value);
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}



const GUILD_CACHE_TTL_MS = 30 * 60_000;
const GUILD_DISCOVERY_LIMIT = 72;
let guildRefreshPromise = null;

const GUILD_ROLE_ORDER = Object.freeze({ Recruit: 0, Member: 1, Officer: 2, Leader: 3 });

function canonicalGuildRole(value) {
  const key = normalizeName(value).replace(/[^a-z]/g, '');
  if (['leader', 'owner', 'founder'].includes(key)) return 'Leader';
  if (['officer', 'admin', 'administrator', 'coleader', 'coowner', 'moderator'].includes(key)) return 'Officer';
  if (key.includes('recruit')) return 'Recruit';
  return 'Member';
}

function enforceGuildRoleIntegrity(members = []) {
  const clean = members.map((member) => ({ ...member, rank: canonicalGuildRole(member.rank) }));
  const leaders = clean.filter((member) => member.rank === 'Leader')
    .sort((a, b) => {
      const aJoin = Number(a.join_date || Number.MAX_SAFE_INTEGER);
      const bJoin = Number(b.join_date || Number.MAX_SAFE_INTEGER);
      return aJoin - bJoin || Number(b.xp || 0) - Number(a.xp || 0);
    });
  if (leaders.length > 1) {
    const keepId = Number(leaders[0].brawlhalla_id);
    for (const member of clean) {
      if (member.rank === 'Leader' && Number(member.brawlhalla_id) !== keepId) member.rank = 'Officer';
    }
  } else if (!leaders.length && clean.length) {
    const leader = [...clean].sort((a, b) => {
      const aJoin = Number(a.join_date || Number.MAX_SAFE_INTEGER);
      const bJoin = Number(b.join_date || Number.MAX_SAFE_INTEGER);
      return aJoin - bJoin || Number(b.xp || 0) - Number(a.xp || 0);
    })[0];
    leader.rank = 'Leader';
  }
  return clean.sort((a, b) =>
    (GUILD_ROLE_ORDER[a.rank] ?? 1) - (GUILD_ROLE_ORDER[b.rank] ?? 1)
    || Number(b.guild_points || 0) - Number(a.guild_points || 0)
    || Number(b.xp || 0) - Number(a.xp || 0)
    || a.name.localeCompare(b.name)
  );
}

function normalizeGuildStats(payload = {}) {
  const guild = payload?.guild || payload || {};
  const id = Number(
    guild.guild_id ?? guild.clan_id ?? guild.guildId ?? guild.clanId ?? guild.id ?? 0
  );
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return {
    guild_id: id,
    name: sanitizePlayerName(guild.name ?? guild.guild_name ?? guild.clan_name ?? `Clan ${id}`),
    create_date: Number(guild.create_date ?? guild.clan_create_date ?? guild.created ?? guild.created_at ?? 0) || null,
    xp: Number(guild.xp ?? guild.clan_xp ?? guild.lifetime_xp ?? 0),
    legacy_xp: Number(guild.legacy_xp || 0),
    notice: String(guild.notice || guild.description || '').trim().slice(0, 240),
    tags: Array.isArray(guild.tags) ? guild.tags.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8) : [],
    discord_invite_code: String(guild.discord_invite_code || '').trim() || null,
    guild_points: Number(guild.guild_points ?? guild.points ?? 0),
    rank: Number(guild.rank ?? guild.position ?? 0) || null,
    is_recruiting: Boolean(guild.is_recruiting),
    member_count: Number(guild.member_count ?? guild.members_count ?? guild.clan?.length ?? guild.members?.length ?? 0) || null,
    source: guild.source || null,
    updated_at: new Date().toISOString()
  };
}

function normalizeGuildPlayer(payload = {}) {
  const guild = payload?.guild || payload || {};
  const id = Number(guild.guild_id ?? guild.clan_id ?? guild.id ?? 0);
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return {
    guild_id: id,
    guild_name: sanitizePlayerName(guild.guild_name ?? guild.clan_name ?? guild.name ?? `Clan ${id}`),
    personal_xp: Number(guild.personal_xp || guild.xp || 0),
    personal_xp_this_week: Number(guild.personal_xp_this_week || 0),
    personal_points: Number(guild.personal_points || guild.guild_points || 0),
    join_date: Number(guild.join_date || 0) || null,
    rank: canonicalGuildRole(guild.rank)
  };
}

function normalizeGuildMembers(payload = {}) {
  const rows = Array.isArray(payload)
    ? payload
    : (payload?.guild_members || payload?.members || payload?.clan || payload?.guild?.members || payload?.guild?.clan || []);
  const members = rows.map((item) => ({
    brawlhalla_id: Number(item?.brawlhalla_id ?? item?.player_id ?? item?.playerId ?? item?.id ?? 0),
    name: sanitizePlayerName(item?.name ?? item?.alias ?? `Player ${item?.brawlhalla_id || item?.id || ''}`),
    rank: canonicalGuildRole(item?.rank ?? item?.role),
    join_date: Number(item?.join_date ?? item?.joined ?? 0) || null,
    xp: Number(item?.xp ?? item?.personal_xp ?? 0),
    guild_points: Number(item?.guild_points ?? item?.personal_points ?? 0)
  })).filter((item) => Number.isSafeInteger(item.brawlhalla_id) && item.brawlhalla_id > 0);
  return enforceGuildRoleIntegrity(members);
}

async function getPlayerGuild(playerId, ttlMs = 10 * 60_000) {
  const payload = await apiFetch(`/player/guild?brawlhalla_id=${encodeURIComponent(playerId)}`, ttlMs).catch(() => null);
  return normalizeGuildPlayer(payload);
}

async function getGuildStats(guildId, ttlMs = GUILD_CACHE_TTL_MS) {
  const payload = await apiFetch(`/guild/stats?guild_id=${encodeURIComponent(guildId)}`, ttlMs).catch(() => null);
  return normalizeGuildStats(payload);
}

async function getGuildMembers(guildId, ttlMs = 10 * 60_000) {
  const payload = await apiFetch(`/guild/members?guild_id=${encodeURIComponent(guildId)}`, ttlMs);
  return normalizeGuildMembers(payload);
}

async function getCorehallaClanRankings(name = '', maxPages = 2, forceFresh = false) {
  const all = [];
  for (let page = 1; page <= Math.max(1, maxPages); page += 1) {
    let payload = await corehallaFetch(
      'getClansRankings',
      { name: String(name || ''), page: String(page) },
      GUILD_CACHE_TTL_MS,
      forceFresh
    ).catch(() => null);
    let rows = corehallaRows(payload);
    if (!rows.length) {
      payload = await corehallaFetch(
        'getClansRankings',
        { name: String(name || ''), page: Number(page) },
        GUILD_CACHE_TTL_MS,
        forceFresh
      ).catch(() => null);
      rows = corehallaRows(payload);
    }
    if (!rows.length) break;
    all.push(...rows);
  }

  const guilds = all.map((row) => normalizeGuildStats({ ...row, source: 'corehalla' })).filter(Boolean);
  const unique = [...new Map(guilds.map((guild) => [guild.guild_id, guild])).values()]
    .sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0) || a.name.localeCompare(b.name));
  return unique.map((guild, index) => ({ ...guild, rank: index + 1 }));
}

async function getCorehallaClanStats(guildId, forceFresh = false) {
  const variants = [String(guildId), Number(guildId)];
  for (const clanId of variants) {
    const payload = await corehallaFetch(
      'getClanStats',
      { clanId },
      10 * 60_000,
      forceFresh
    ).catch(() => null);
    if (!payload) continue;
    const guild = normalizeGuildStats({ ...payload, source: 'corehalla' });
    const members = normalizeGuildMembers(payload);
    if (guild) return { guild: { ...guild, member_count: guild.member_count || members.length }, members };
  }
  return null;
}

function mergeGuilds(...values) {
  const guilds = values.filter(Boolean);
  if (!guilds.length) return null;
  const merged = { ...guilds[0] };
  for (const guild of guilds.slice(1)) {
    for (const [key, value] of Object.entries(guild)) {
      if (value !== null && value !== undefined && value !== '' && value !== 0 && value !== false) merged[key] = value;
    }
  }
  return merged;
}

async function rememberGuilds(guilds = []) {
  const valid = guilds.filter((guild) => Number(guild?.guild_id) > 0);
  if (!valid.length) return;
  await updateJson(GUILDS_FILE, { updated_at: null, guilds: {} }, (data) => {
    if (!data.guilds || typeof data.guilds !== 'object') data.guilds = {};
    const now = new Date().toISOString();
    for (const guild of valid) {
      data.guilds[String(guild.guild_id)] = { ...(data.guilds[String(guild.guild_id)] || {}), ...guild, updated_at: now };
    }
    data.updated_at = now;
    return data;
  });
}

async function rememberGuild(guild) {
  return rememberGuilds(guild ? [guild] : []);
}

async function readGuildCache() {
  const data = await readJson(GUILDS_FILE, { updated_at: null, guilds: {} });
  const guilds = Object.values(data?.guilds || {}).filter((guild) => Number(guild?.guild_id) > 0);
  return { updated_at: data?.updated_at || null, guilds };
}

async function discoverOfficialGuilds() {
  const pages = [1, 2];
  const boards = await Promise.all(pages.map((page) => {
    const params = new URLSearchParams({ page: String(page), max_results: '40', game_mode: '1v1', region: 'ALL', order_by: 'rating' });
    return apiFetch(`/leaderboard/ranked?${params}`, 5 * 60_000).catch(() => ({ rankings: [] }));
  }));
  const playerIds = [...new Set(boards.flatMap((board) =>
    (board?.rankings || []).flatMap((entry) => (entry.players || []).map((player) => Number(player.id)).filter(Boolean))
  ))].slice(0, GUILD_DISCOVERY_LIMIT);
  const playerGuilds = (await mapWithConcurrency(playerIds, 12, (id) => getPlayerGuild(id, GUILD_CACHE_TTL_MS))).filter(Boolean);
  const guildIds = [...new Set(playerGuilds.map((item) => Number(item.guild_id)).filter(Boolean))];
  return (await mapWithConcurrency(guildIds, 10, (id) => getGuildStats(id, GUILD_CACHE_TTL_MS))).filter(Boolean);
}

async function refreshTopGuilds(options = {}) {
  if (guildRefreshPromise) return guildRefreshPromise;
  guildRefreshPromise = (async () => {
    const query = String(options.query || '');
    const corehalla = await getCorehallaClanRankings(query, query ? 3 : 2, Boolean(options.force)).catch(() => []);
    if (corehalla.length) {
      await rememberGuilds(corehalla).catch(() => null);
      return corehalla;
    }
    const official = await discoverOfficialGuilds();
    const sorted = official
      .sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0) || a.name.localeCompare(b.name))
      .map((guild, index) => ({ ...guild, rank: index + 1 }));
    await rememberGuilds(sorted).catch(() => null);
    return sorted;
  })().finally(() => { guildRefreshPromise = null; });
  return guildRefreshPromise;
}

async function topGuilds({ force = false, query = '' } = {}) {
  const normalizedQuery = normalizeName(query);
  if (normalizedQuery) {
    const guilds = await refreshTopGuilds({ force, query });
    return { guilds, updated_at: new Date().toISOString(), stale: false };
  }

  const cached = await readGuildCache();
  const age = cached.updated_at ? Date.now() - new Date(cached.updated_at).getTime() : Infinity;
  const sorted = [...cached.guilds]
    .sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0) || a.name.localeCompare(b.name))
    .map((guild, index) => ({ ...guild, rank: index + 1 }));
  if (!force && sorted.length >= 12 && age < GUILD_CACHE_TTL_MS) {
    return { guilds: sorted, updated_at: cached.updated_at, stale: false };
  }
  if (!force && sorted.length) {
    refreshTopGuilds({ force: false }).catch(() => null);
    return { guilds: sorted, updated_at: cached.updated_at, stale: true };
  }
  const guilds = await refreshTopGuilds({ force });
  return { guilds, updated_at: new Date().toISOString(), stale: false };
}

function calculateWinRate(wins, games) {
  if (!games) return 0;
  return Number(((wins / games) * 100).toFixed(1));
}

const CANONICAL_WEAPON_NAMES = {
  hammer: 'Hammer',
  sword: 'Sword',
  blaster: 'Blasters',
  blasters: 'Blasters',
  pistol: 'Blasters',
  pistols: 'Blasters',
  lance: 'Rocket Lance',
  rocketlance: 'Rocket Lance',
  rocketlances: 'Rocket Lance',
  spear: 'Spear',
  katar: 'Katars',
  katars: 'Katars',
  axe: 'Axe',
  bow: 'Bow',
  gauntlet: 'Gauntlets',
  gauntlets: 'Gauntlets',
  scythe: 'Scythe',
  cannon: 'Cannon',
  orb: 'Orb',
  greatsword: 'Greatsword',
  greatswords: 'Greatsword',
  boot: 'Battle Boots',
  boots: 'Battle Boots',
  battleboot: 'Battle Boots',
  battleboots: 'Battle Boots',
  chakram: 'Chakram',
  chakrams: 'Chakram'
};

function canonicalWeaponName(name = '') {
  const raw = String(name || '').trim();
  if (!raw || raw === '—') return raw || '—';
  const key = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return CANONICAL_WEAPON_NAMES[key] || raw;
}

async function getLegendMap() {
  const response = await apiFetch('/static/legends?page=1&max_results=100', 24 * 60 * 60 * 1000);
  return new Map((response?.legends || []).map((legend) => [Number(legend.legend_id), {
    ...legend,
    weapon_one: canonicalWeaponName(legend.weapon_one),
    weapon_two: canonicalWeaponName(legend.weapon_two)
  }]));
}

function makeLegendSummary(statsLegend, staticLegend = {}) {
  if (!statsLegend) return null;
  const name = staticLegend.bio_name || staticLegend.legend_name || `Legend ${statsLegend.legend_id}`;
  return {
    legend_id: statsLegend.legend_id,
    name,
    games: statsLegend.games || 0,
    wins: statsLegend.wins || 0,
    level: statsLegend.level ?? null,
    weapon_one: staticLegend.weapon_one || '—',
    weapon_two: staticLegend.weapon_two || '—',
    image_url: legendImageUrl(name),
    image_candidates: legendImageCandidates(name)
  };
}


function numberOrZero(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeXpPercentage(value) {
  const numeric = numberOrNull(value);
  if (numeric === null) return null;
  const percent = numeric <= 1 ? numeric * 100 : numeric;
  return Number(Math.max(0, Math.min(100, percent)).toFixed(2));
}

function safeRatio(numerator, denominator, precision = 2) {
  const bottom = numberOrZero(denominator);
  if (!bottom) return null;
  return Number((numberOrZero(numerator) / bottom).toFixed(precision));
}

function formatGameTime(seconds) {
  const total = Math.max(0, Math.round(numberOrZero(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function buildTopLegends(lifetimeLegends = [], legendMap = new Map(), limit = 3) {
  return [...(lifetimeLegends || [])]
    .filter((legend) => numberOrZero(legend.games) > 0)
    .sort((a, b) => numberOrZero(b.games) - numberOrZero(a.games))
    .slice(0, limit)
    .map((legend) => makeLegendSummary(legend, legendMap.get(Number(legend.legend_id))));
}

function buildMainWeapons(lifetimeLegends = [], legendMap = new Map(), limit = 3) {
  const totals = new Map();

  for (const legend of lifetimeLegends || []) {
    const staticLegend = legendMap.get(Number(legend.legend_id)) || {};
    const weaponStats = [
      {
        name: staticLegend.weapon_one,
        damage: numberOrZero(legend.damage_weapon_one),
        kos: numberOrZero(legend.ko_weapon_one),
        time_held_seconds: numberOrZero(legend.time_held_weapon_one)
      },
      {
        name: staticLegend.weapon_two,
        damage: numberOrZero(legend.damage_weapon_two),
        kos: numberOrZero(legend.ko_weapon_two),
        time_held_seconds: numberOrZero(legend.time_held_weapon_two)
      }
    ];

    for (const weapon of weaponStats) {
      const name = String(weapon.name || '').trim();
      if (!name) continue;
      const current = totals.get(name) || {
        name,
        damage: 0,
        kos: 0,
        time_held_seconds: 0,
        legends_used: 0
      };
      current.damage += weapon.damage;
      current.kos += weapon.kos;
      current.time_held_seconds += weapon.time_held_seconds;
      if (numberOrZero(legend.games) > 0) current.legends_used += 1;
      totals.set(name, current);
    }
  }

  return [...totals.values()]
    .map((weapon) => ({
      ...weapon,
      time_held_display: formatGameTime(weapon.time_held_seconds)
    }))
    .sort((a, b) =>
      (b.time_held_seconds - a.time_held_seconds) ||
      (b.damage - a.damage) ||
      (b.kos - a.kos) ||
      a.name.localeCompare(b.name)
    )
    .slice(0, limit);
}

function buildLifetimeLegendStats(lifetimeLegends = [], rankedLegends = [], legendMap = new Map()) {
  const lifetimeById = new Map((lifetimeLegends || []).map((legend) => [Number(legend.legend_id), legend]));
  const rankedById = new Map((rankedLegends || []).map((legend) => [Number(legend.legend_id), legend]));

  return [...legendMap.values()].map((staticLegend) => {
    const id = Number(staticLegend.legend_id);
    const life = lifetimeById.get(id) || {};
    const ranked = rankedById.get(id) || {};
    const name = staticLegend.bio_name || staticLegend.legend_name || `Legend ${id}`;
    const games = numberOrZero(life.games);
    const wins = numberOrZero(life.wins);
    const kos = numberOrZero(life.kos);
    const falls = numberOrZero(life.falls);
    const damageDealt = numberOrZero(life.damage_dealt);
    const damageTaken = numberOrZero(life.damage_taken);
    const matchTime = numberOrZero(life.match_time);

    return {
      legend_id: id,
      name,
      image_url: legendImageUrl(name),
      image_candidates: legendImageCandidates(name),
      weapon_one: staticLegend.weapon_one || '—',
      weapon_two: staticLegend.weapon_two || '—',
      games,
      wins,
      losses: Math.max(0, games - wins),
      win_rate: calculateWinRate(wins, games),
      damage_dealt: damageDealt,
      damage_taken: damageTaken,
      damage_ratio: safeRatio(damageDealt, damageTaken),
      kos,
      falls,
      kd_ratio: safeRatio(kos, falls),
      suicides: numberOrZero(life.suicides),
      team_kos: numberOrZero(life.team_kos),
      match_time_seconds: matchTime,
      match_time_display: formatGameTime(matchTime),
      damage_unarmed: numberOrZero(life.damage_unarmed),
      damage_thrown_item: numberOrZero(life.damage_thrown_item),
      damage_gadgets: numberOrZero(life.damage_gadgets),
      ko_unarmed: numberOrZero(life.ko_unarmed),
      ko_gadgets: numberOrZero(life.ko_gadgets),
      xp: numberOrNull(life.xp),
      level: numberOrNull(life.level),
      xp_percentage: normalizeXpPercentage(life.xp_percentage),
      weapon_one_stats: {
        name: staticLegend.weapon_one || '—',
        damage: numberOrZero(life.damage_weapon_one),
        kos: numberOrZero(life.ko_weapon_one),
        time_held_seconds: numberOrZero(life.time_held_weapon_one),
        time_held_display: formatGameTime(life.time_held_weapon_one)
      },
      weapon_two_stats: {
        name: staticLegend.weapon_two || '—',
        damage: numberOrZero(life.damage_weapon_two),
        kos: numberOrZero(life.ko_weapon_two),
        time_held_seconds: numberOrZero(life.time_held_weapon_two),
        time_held_display: formatGameTime(life.time_held_weapon_two)
      },
      ranked: {
        games: numberOrZero(ranked.games),
        wins: numberOrZero(ranked.wins),
        rating: numberOrNull(ranked.rating),
        peak_rating: numberOrNull(ranked.best_rating ?? ranked.peak_rating),
        tier: ranked.tier || null
      }
    };
  }).sort((a, b) => (b.games - a.games) || a.name.localeCompare(b.name));
}

function buildLifetimeTotals(lifetime = {}) {
  const legends = lifetime?.legends || [];
  const sum = (field) => legends.reduce((total, legend) => total + numberOrZero(legend[field]), 0);
  const games = numberOrZero(lifetime.games);
  const wins = numberOrZero(lifetime.wins);
  const kos = sum('kos');
  const falls = sum('falls');
  const damageDealt = sum('damage_dealt');
  const damageTaken = sum('damage_taken');
  const matchTime = sum('match_time');

  return {
    games,
    wins,
    losses: Math.max(0, games - wins),
    win_rate: calculateWinRate(wins, games),
    account_xp: numberOrNull(lifetime.xp),
    account_level: numberOrNull(lifetime.level),
    account_xp_percentage: normalizeXpPercentage(lifetime.xp_percentage),
    match_time_seconds: matchTime,
    match_time_display: formatGameTime(matchTime),
    kos,
    falls,
    kd_ratio: safeRatio(kos, falls),
    damage_dealt: damageDealt,
    damage_taken: damageTaken,
    damage_ratio: safeRatio(damageDealt, damageTaken),
    suicides: sum('suicides'),
    team_kos: sum('team_kos'),
    damage_unarmed: sum('damage_unarmed'),
    damage_thrown_item: sum('damage_thrown_item'),
    damage_gadgets: sum('damage_gadgets'),
    ko_unarmed: sum('ko_unarmed'),
    ko_gadgets: sum('ko_gadgets'),
    damage_bomb: numberOrZero(lifetime.damage_bomb),
    damage_mine: numberOrZero(lifetime.damage_mine),
    damage_spikeball: numberOrZero(lifetime.damage_spikeball),
    damage_sidekick: numberOrZero(lifetime.damage_sidekick),
    hit_snowball: numberOrZero(lifetime.hit_snowball),
    ko_bomb: numberOrZero(lifetime.ko_bomb),
    ko_mine: numberOrZero(lifetime.ko_mine),
    ko_sidekick: numberOrZero(lifetime.ko_sidekick),
    ko_snowball: numberOrZero(lifetime.ko_snowball),
    ko_spikeball: numberOrZero(lifetime.ko_spikeball)
  };
}

async function getMainLegendSummary(playerId) {
  const cacheKey = `main-legend:${playerId}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.value;

  try {
    const [lifetime, legendMap] = await Promise.all([
      apiFetch(`/player/stats?brawlhalla_id=${playerId}&mode=all`, 10 * 60_000),
      getLegendMap()
    ]);
    const mainStats = [...(lifetime?.legends || [])]
      .filter((legend) => Number(legend.games) > 0)
      .sort((a, b) => Number(b.games) - Number(a.games))[0];
    const summary = makeLegendSummary(mainStats, legendMap.get(Number(mainStats?.legend_id)));
    cache.set(cacheKey, { value: summary, expiresAt: now + 10 * 60_000 });
    return summary;
  } catch {
    return null;
  }
}

async function storeSnapshot(player) {
  return updateJson(SNAPSHOTS_FILE, {}, (all) => {
    const key = String(player.brawlhalla_id);
    const list = Array.isArray(all[key]) ? all[key] : [];
    const today = new Date().toISOString().slice(0, 10);
    const snapshot = {
      date: today,
      name: player.name,
      rating: player.rating ?? null,
      peak_rating: player.peak_rating ?? null,
      global_rank: player.global_rank ?? null,
      games: player.ranked_games ?? null,
      wins: player.ranked_wins ?? null,
      tier: player.tier ?? null
    };
    const index = list.findIndex((item) => item.date === today);
    if (index >= 0) list[index] = snapshot;
    else list.push(snapshot);
    all[key] = list.slice(-120);
    return all[key];
  });
}

async function storeObservedNamesBatch(entries, source = 'profile') {
  const cleanEntries = entries
    .map((entry) => ({ id: Number(entry.id), name: sanitizePlayerName(entry.name) }))
    .filter((entry) => Number.isSafeInteger(entry.id) && entry.id > 0 && isPlausiblePlayerName(entry.name) && !isGeneratedPlayerName(entry.name));
  if (!cleanEntries.length) return {};

  return updateJson(NAMES_FILE, {}, (all) => {
    const now = new Date().toISOString();
    const touched = {};

    for (const entry of cleanEntries) {
      const key = String(entry.id);
      const list = cleanNameHistoryList(all[key]);
      const normalized = normalizeName(entry.name);
      const existing = list.find((item) => normalizeName(item.name) === normalized);
      if (existing) {
        existing.name = entry.name;
        existing.last_seen = now;
        existing.observations = Number(existing.observations || 1) + 1;
        existing.sources = [...new Set([...(existing.sources || []), source])];
      } else {
        list.push({
          name: entry.name,
          first_seen: now,
          last_seen: now,
          observations: 1,
          sources: [source]
        });
      }
      all[key] = cleanNameHistoryList(list);
      touched[key] = all[key];
    }

    return touched;
  });
}

async function snapshotNameEntries(playerId) {
  const snapshots = await readJson(SNAPSHOTS_FILE, {});
  const rows = Array.isArray(snapshots[String(playerId)]) ? snapshots[String(playerId)] : [];
  const byName = new Map();
  for (const row of rows) {
    const name = sanitizePlayerName(row?.name);
    if (!isPlausiblePlayerName(name) || isGeneratedPlayerName(name)) continue;
    const date = String(row?.date || '').trim();
    const seenAt = date ? `${date}T12:00:00.000Z` : new Date().toISOString();
    const key = normalizeName(name);
    const current = byName.get(key);
    if (!current) {
      byName.set(key, { name, first_seen: seenAt, last_seen: seenAt, observations: 1, sources: ['snapshot'] });
    } else {
      if (new Date(seenAt) < new Date(current.first_seen)) current.first_seen = seenAt;
      if (new Date(seenAt) > new Date(current.last_seen)) current.last_seen = seenAt;
      current.observations += 1;
    }
  }
  return [...byName.values()];
}

async function readKnownNames(playerId) {
  const key = String(playerId);
  const snapshots = await snapshotNameEntries(playerId);
  return updateJson(NAMES_FILE, {}, (all) => {
    const merged = [...cleanNameHistoryList(all[key]), ...snapshots];
    const cleaned = cleanNameHistoryList(merged);
    all[key] = cleaned;
    return cleaned;
  });
}


async function cleanAllNameHistory() {
  return updateJson(NAMES_FILE, {}, (all) => {
    for (const key of Object.keys(all)) {
      const cleaned = cleanNameHistoryList(all[key]);
      if (cleaned.length) all[key] = cleaned;
      else delete all[key];
    }
    return all;
  });
}

async function findAliasMatches(query, limit = 8) {
  const needle = normalizeName(query);
  if (needle.length < 2) return [];
  const all = await readJson(NAMES_FILE, {});
  const matches = [];

  for (const [id, names] of Object.entries(all)) {
    const cleanNames = cleanNameHistoryList(names);
    if (!cleanNames.length) continue;
    const matchedNames = cleanNames.filter((item) => normalizeName(item.name).includes(needle));
    if (!matchedNames.length) continue;
    matches.push({
      id: Number(id),
      names: cleanNames,
      matched_names: matchedNames.map((item) => item.name),
      last_seen: Math.max(...matchedNames.map((item) => new Date(item.last_seen).getTime() || 0))
    });
  }

  return matches
    .sort((a, b) => b.last_seen - a.last_seen)
    .slice(0, limit);
}

async function hydrateRankingPlayers(rankings, source, options = {}) {
  const includeLegends = options.includeLegends !== false;
  const playerRefs = [];
  for (const ranking of rankings) {
    for (const player of ranking.players || []) {
      if (player?.id) playerRefs.push({ id: player.id, name: player.username });
    }
  }

  await storeObservedNamesBatch(playerRefs, source);
  const namesDb = await readJson(NAMES_FILE, {});
  const legendById = new Map();
  if (includeLegends) {
    const uniqueIds = [...new Set(playerRefs.map((player) => Number(player.id)).filter(Boolean))];
    const legendPairs = await mapWithConcurrency(uniqueIds, 6, async (id) => [id, await getMainLegendSummary(id)]);
    for (const pair of legendPairs) legendById.set(pair[0], pair[1]);
  }

  return rankings.map((ranking) => ({
    ...ranking,
    players: (ranking.players || []).map((player) => ({
      ...player,
      main_legend: legendById.get(Number(player.id)) || player.main_legend || null,
      known_names: cleanNameHistoryList(namesDb[String(player.id)])
    }))
  }));
}

async function buildAliasRanking(match, context) {
  try {
    const lifetime = await apiFetch(`/player/stats?brawlhalla_id=${match.id}&mode=all`, 10 * 60_000);
    const currentName = lifetime?.name || match.names?.[0]?.name || `Player ${match.id}`;
    const params = new URLSearchParams({
      page: '1',
      max_results: '20',
      game_mode: context.mode,
      region: context.region,
      search: currentName,
      order_by: 'rating'
    });
    const lookup = await apiFetch(`/leaderboard/ranked?${params}`, 60_000);
    const ranking = (lookup?.rankings || []).find((item) =>
      (item.players || []).some((player) => Number(player.id) === Number(match.id))
    );
    if (!ranking) return null;

    const [hydrated] = await hydrateRankingPlayers([ranking], 'alias-search');
    hydrated.history_match = true;
    hydrated.players = (hydrated.players || []).map((player) => Number(player.id) === Number(match.id)
      ? { ...player, matched_aliases: match.matched_names }
      : player);
    return hydrated;
  } catch {
    return null;
  }
}


function aliasScore(name, query) {
  const candidate = normalizeName(name);
  const needle = normalizeName(query);
  if (candidate === needle) return 1000;
  if (candidate.startsWith(needle)) return 850 - Math.max(0, candidate.length - needle.length);
  if (candidate.includes(needle)) return 700 - candidate.indexOf(needle);
  return 0;
}

async function buildProfileSearchRanking(candidate, query, options = {}) {
  try {
    const id = Number(candidate?.id);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    const knownAliases = [...new Set((candidate.aliases || candidate.names || [])
      .map((item) => cleanAliasForSearch(typeof item === 'string' ? item : item?.name))
      .filter(Boolean))];
    const quick = Boolean(options.quick);
    let lifetime = null;
    let legendMap = new Map();
    if (!quick) {
      [lifetime, legendMap] = await Promise.all([
        apiFetch(`/player/stats?brawlhalla_id=${id}&mode=all`, 5 * 60_000).catch(() => null),
        getLegendMap().catch(() => new Map())
      ]);
    }

    const currentName = cleanAliasForSearch(lifetime?.name || candidate.name || knownAliases[0]) || `Player ${id}`;
    const mainStats = [...(lifetime?.legends || [])]
      .filter((legend) => numberOrZero(legend.games) > 0)
      .sort((a, b) => numberOrZero(b.games) - numberOrZero(a.games))[0];
    const matchedAliases = knownAliases.filter((name) => normalizeName(name).includes(normalizeName(query)));
    return {
      rank: null,
      region: '—',
      rating: null,
      best_rating: null,
      tier: 'Unranked',
      wins: 0,
      losses: 0,
      games: 0,
      profile_only: true,
      search_score: Math.max(aliasScore(currentName, query), ...knownAliases.map((name) => aliasScore(name, query)), 0),
      players: [{
        id,
        username: currentName,
        main_legend: makeLegendSummary(mainStats, legendMap.get(Number(mainStats?.legend_id))),
        matched_aliases: matchedAliases,
        known_names: knownAliases.map((name) => ({ name }))
      }]
    };
  } catch {
    return null;
  }
}

function mergeKnownNameEntries(currentName, coreAliases = [], localEntries = []) {
  const now = new Date().toISOString();
  const merged = [];
  const seen = new Set();
  const push = (entry, source, index = 0) => {
    const name = sanitizePlayerName(typeof entry === 'string' ? entry : entry?.name);
    const key = normalizeName(name);
    const isCurrent = key === normalizeName(currentName);
    if (!(isCurrent ? Boolean(cleanAliasForSearch(name)) : isPlausiblePlayerName(name))) return;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({
      name,
      first_seen: typeof entry === 'object' && entry?.first_seen ? entry.first_seen : null,
      last_seen: typeof entry === 'object' && entry?.last_seen ? entry.last_seen : null,
      source,
      order: index,
      is_current: key === normalizeName(currentName)
    });
  };
  push(currentName, 'current', -1);
  coreAliases.forEach((name, index) => push(name, 'corehalla', index));
  localEntries.forEach((entry, index) => push(entry, 'tracker', index + coreAliases.length));
  return merged.map((entry) => ({
    ...entry,
    first_seen: entry.first_seen || (entry.is_current ? now : null),
    last_seen: entry.last_seen || (entry.is_current ? now : null)
  }));
}


function cleanCompetitiveName(value) {
  const original = String(value || '').replace(/\s+/g, ' ').trim();
  if (!original) return '';
  const afterTeamTag = original.includes('|') ? original.split('|').pop().trim() : original;
  return afterTeamTag
    .replace(/^\[[^\]]+\]\s*/, '')
    .replace(/^[^A-Za-z0-9\p{L}]+/u, '')
    .replace(/[^A-Za-z0-9_ .\p{L}\p{N}]+$/gu, '')
    .trim();
}

function esportsSearchTerms(value) {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  const cleaned = cleanCompetitiveName(raw);
  const chunks = [cleaned, raw, ...raw.split(/[|/\\•·—–-]+/u)];
  const terms = [];

  for (const chunk of chunks) {
    const matches = String(chunk || '').match(/[\p{L}\p{N}_.]+/gu) || [];
    for (const match of matches) {
      const term = match.replace(/^\.+|\.+$/g, '').trim();
      if (term.length >= 2 && !terms.some((item) => item.toLowerCase() === term.toLowerCase())) {
        terms.push(term);
      }
    }
  }

  return terms.slice(0, 8);
}

function esportsPlayerId(searchResult) {
  const player = searchResult?.player || {};
  return Number(player.playerId ?? player.smashId ?? player.id ?? player.sggPlayerId ?? 0);
}

function esportsNameScore(searchResult, requestedName, region) {
  const candidate = normalizeName(searchResult?.player?.name);
  const requested = normalizeName(requestedName);
  const cleaned = normalizeName(cleanCompetitiveName(requestedName));
  if (!candidate) return -1;

  let score = 0;
  if (candidate === requested) score += 120;
  if (candidate === cleaned) score += 140;
  if (cleaned && candidate.includes(cleaned)) score += 70;
  if (cleaned && cleaned.includes(candidate)) score += 55;
  if (requested && candidate.includes(requested)) score += 50;
  if (region && String(searchResult?.region || '').toUpperCase() === String(region).toUpperCase()) score += 15;
  if (Number.isFinite(esportsPlayerId(searchResult)) && esportsPlayerId(searchResult) > 0) score += 5;
  return score;
}

async function findEsportsPlayerByName(name, region) {
  const terms = esportsSearchTerms(name);
  const matches = [];
  let lastTemporaryError = null;

  for (const term of terms) {
    try {
      const params = new URLSearchParams({ query: term, maxResults: '25' });
      const response = await brawlToolsFetch(`/player/search?${params}`, 30 * 60_000);
      for (const item of response?.searchPlayers || []) {
        const id = esportsPlayerId(item);
        if (!id) continue;
        matches.push({ ...item, esports_player_id: id });
      }
    } catch (error) {
      // Some regional ranking names contain team tags or decorative symbols.
      // The esports search endpoint only accepts word characters and dots,
      // so skip rejected variants and continue with the sanitized candidates.
      if (error.status === 400 || error.status === 422) continue;
      lastTemporaryError = error;
    }
  }

  if (!matches.length && lastTemporaryError) throw lastTemporaryError;

  const unique = [...new Map(matches.map((item) => [item.esports_player_id, item])).values()];
  const best = unique
    .map((item) => ({ item, score: esportsNameScore(item, name, region) }))
    .sort((a, b) => b.score - a.score)[0];
  return best && best.score >= 45 ? best.item : null;
}

function tournamentSourceUrl(tournament = {}) {
  if (tournament.slug) return `https://www.start.gg/${String(tournament.slug).replace(/^\/+/, '')}`;
  const host = String(tournament.host || '').toLowerCase();
  const id = tournament.id || tournament.tournamentId;
  if (id && host.includes('challenger')) {
    return `https://www.challengermode.com/s/Brawlhalla/tournaments/${encodeURIComponent(id)}`;
  }
  return null;
}

async function getEsportsPlacements(playerId, gameMode) {
  const placements = [];
  let nextToken = null;

  for (let page = 0; page < 4; page += 1) {
    const params = new URLSearchParams({
      playerIds: String(playerId),
      gameMode: String(gameMode),
      isOfficial: 'true',
      maxResults: '50'
    });
    if (nextToken) params.set('nextToken', nextToken);

    const response = await brawlToolsFetch(`/player/placement?${params}`, 30 * 60_000);
    placements.push(...(response?.playerPlacements || []));
    nextToken = response?.nextToken || null;
    if (!nextToken) break;
  }

  return placements.map((item) => ({
    placement: Number(item.placement) || null,
    mode: gameMode === 2 ? '2v2' : '1v1',
    tournament: {
      ...(item.tournament || {}),
      source_url: tournamentSourceUrl(item.tournament || {})
    }
  }));
}

function summarizePlacements(placements) {
  const valid = placements.filter((item) => Number.isFinite(Number(item.placement)));
  return {
    events: valid.length,
    titles: valid.filter((item) => Number(item.placement) === 1).length,
    podiums: valid.filter((item) => Number(item.placement) <= 3).length,
    top8: valid.filter((item) => Number(item.placement) <= 8).length,
    top32: valid.filter((item) => Number(item.placement) <= 32).length,
    best_placement: valid.length ? Math.min(...valid.map((item) => Number(item.placement))) : null
  };
}


function parseCookies(header = '') {
  const cookies = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function wallUsername(value) {
  return String(value || '').normalize('NFKC').trim();
}

function wallUsernameKey(value) {
  return wallUsername(value).toLowerCase();
}

function validWallUsername(value) {
  const clean = wallUsername(value);
  return /^[\p{L}\p{N}_.-]{3,24}$/u.test(clean);
}

function wallPasswordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function wallPasswordMatches(password, user = {}) {
  try {
    const derived = crypto.scryptSync(String(password), String(user.password_salt || ''), 64);
    const stored = Buffer.from(String(user.password_hash || ''), 'hex');
    return stored.length === derived.length && crypto.timingSafeEqual(stored, derived);
  } catch {
    return false;
  }
}

function wallSignSession(userId, expiresAt = Date.now() + WALL_SESSION_MAX_AGE) {
  const payload = `${userId}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', WALL_SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function wallSessionUserId(req) {
  const token = parseCookies(req.headers.cookie || '').arena_session;
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  if (!/^[-a-zA-Z0-9_]+$/.test(userId) || Number(expiresAt) < Date.now()) return null;
  const expected = crypto.createHmac('sha256', WALL_SESSION_SECRET).update(`${userId}.${expiresAt}`).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  return userId;
}

function wallSetSessionCookie(req, res, userId) {
  const token = wallSignSession(userId);
  const secure = req.secure || String(req.headers['x-forwarded-proto'] || '').includes('https');
  res.setHeader('Set-Cookie', `arena_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(WALL_SESSION_MAX_AGE / 1000)}${secure ? '; Secure' : ''}`);
}

function wallClearSessionCookie(req, res) {
  const secure = req.secure || String(req.headers['x-forwarded-proto'] || '').includes('https');
  res.setHeader('Set-Cookie', `arena_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`);
}

function wallRateLimit(req, bucket, limit, windowMs) {
  const key = `${bucket}:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  const now = Date.now();
  const recent = (wallRateLimits.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  wallRateLimits.set(key, recent);
  return true;
}

async function wallCurrentUser(req) {
  const id = wallSessionUserId(req);
  if (!id) return null;
  const users = await readJson(WALL_USERS_FILE, {});
  const user = Object.values(users).find((item) => item.id === id);
  return user ? wallPublicUser(user) : null;
}

function wallPublicUser(user = {}) {
  return {
    id: user.id,
    username: user.username,
    bio: String(user.bio || '').slice(0, 160),
    avatar_url: user.avatar_url || null,
    created_at: user.created_at,
    updated_at: user.updated_at || user.created_at
  };
}

function wallUserMap(users = {}) {
  return new Map(Object.values(users || {}).filter(Boolean).map((user) => [String(user.id), user]));
}

function wallReactionSummary(reactions = {}, viewerId = null) {
  const entries = Object.entries(reactions && typeof reactions === 'object' ? reactions : {});
  return {
    likes: entries.filter(([, value]) => value === 'like').length,
    dislikes: entries.filter(([, value]) => value === 'dislike').length,
    viewer_reaction: viewerId ? (reactions?.[viewerId] || null) : null
  };
}

function wallPublicPost(post = {}, viewerId = null, usersById = new Map()) {
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const author = usersById.get(String(post.user_id)) || { id: post.user_id, username: post.username };
  return {
    id: post.id,
    user_id: post.user_id,
    username: author.username || post.username,
    author: wallPublicUser(author),
    caption: post.caption || '',
    image_url: post.image_url,
    created_at: post.created_at,
    updated_at: post.updated_at || null,
    is_owner: Boolean(viewerId && String(viewerId) === String(post.user_id)),
    reactions: wallReactionSummary(post.reactions || {}, viewerId),
    comments: comments.map((comment) => {
      const commentAuthor = usersById.get(String(comment.user_id)) || { id: comment.user_id, username: comment.username };
      return {
        id: comment.id,
        user_id: comment.user_id,
        username: commentAuthor.username || comment.username,
        author: wallPublicUser(commentAuthor),
        text: comment.text,
        parent_id: comment.parent_id || null,
        created_at: comment.created_at,
        updated_at: comment.updated_at || null,
        is_owner: Boolean(viewerId && String(viewerId) === String(comment.user_id))
      };
    })
  };
}

function parseArenaImage(dataUrl = '', maxBytes = WALL_MAX_IMAGE_BYTES, label = 'Screenshot') {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw Object.assign(new Error('Choose a PNG, JPG, or WebP screenshot.'), { status: 400 });
  const type = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > maxBytes) throw Object.assign(new Error(`${label} is too large.`), { status: 400 });
  const valid = type === 'png'
    ? buffer.slice(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))
    : type === 'jpeg'
      ? buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP';
  if (!valid) throw Object.assign(new Error('The uploaded file is not a valid image.'), { status: 400 });
  return { buffer, extension: type === 'jpeg' ? 'jpg' : type };
}

async function removeArenaUpload(urlValue) {
  const prefix = '/uploads/arena/';
  const value = String(urlValue || '');
  if (!value.startsWith(prefix)) return;
  const relative = value.slice(prefix.length).replace(/\\/g, '/');
  const target = path.resolve(WALL_UPLOADS_DIR, relative);
  const base = path.resolve(WALL_UPLOADS_DIR) + path.sep;
  if (!target.startsWith(base)) return;
  await fs.unlink(target).catch(() => undefined);
}

async function wallRequireUser(req, res) {
  const user = await wallCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sign in with your Arena Wall username first.' });
    return null;
  }
  return user;
}


const QUEUE_REGIONS = ['US-E', 'EU', 'SEA', 'BRZ', 'AUS', 'US-W', 'JPS', 'SA', 'ME'];
const QUEUE_MODES = ['1v1', '2v2', '3v3'];
const QUEUE_TOP_LIMIT = 500;
const QUEUE_ACTIVITY_WINDOW_MS = 10 * 60_000;
const QUEUE_SCAN_INTERVAL_MS = 90_000;
const QUEUE_TRACKER_IDLE_MS = 30 * 60_000;

function queueComboKey(region, mode) {
  return `${region}:${mode}`;
}

function queueEntryKey(ranking = {}) {
  const ids = (ranking.players || [])
    .map((player) => Number(player?.id))
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .sort((a, b) => a - b);
  if (ids.length) return ids.join('-');
  return (ranking.players || [])
    .map((player) => normalizeName(player?.username))
    .filter(Boolean)
    .sort()
    .join('|');
}

function queueSnapshotEntry(ranking = {}) {
  const wins = Number(ranking.wins || 0);
  const losses = Number(ranking.losses || 0);
  return {
    key: queueEntryKey(ranking),
    players: (ranking.players || []).map((player) => ({
      id: Number(player?.id) || null,
      username: String(player?.username || 'Unknown')
    })),
    rank: Number(ranking.rank) || null,
    rating: Number(ranking.rating) || null,
    best_rating: Number(ranking.best_rating) || null,
    wins,
    losses,
    games: wins + losses,
    region: ranking.region || null,
    tier: ranking.tier || null
  };
}

async function fetchQueueLeaderboard(region, mode) {
  const makeEndpoint = (page) => {
    const params = new URLSearchParams({
      page: String(page),
      max_results: '50',
      game_mode: mode,
      region,
      order_by: 'rating'
    });
    return `/leaderboard/ranked?${params}`;
  };

  const first = await apiFetchFresh(makeEndpoint(1));
  const totalPages = Math.min(10, Math.max(1, Number(first?.total_pages || 1)));
  const pages = totalPages > 1
    ? await mapWithConcurrency(Array.from({ length: totalPages - 1 }, (_, index) => index + 2), 3, async (page) => apiFetchFresh(makeEndpoint(page)))
    : [];
  return [first, ...pages]
    .flatMap((page) => page?.rankings || [])
    .slice(0, QUEUE_TOP_LIMIT)
    .map(queueSnapshotEntry)
    .filter((entry) => entry.key && entry.players.length);
}

async function loadPersistedQueueTracker(region, mode) {
  const data = await readJson(QUEUE_ACTIVITY_FILE, {});
  const stored = data[queueComboKey(region, mode)] || {};
  return {
    snapshot: new Map((stored.snapshot || []).map((entry) => [entry.key, entry])),
    activity: new Map((stored.activity || []).map((entry) => [entry.key, entry])),
    last_scan_at: stored.last_scan_at || null
  };
}

async function persistQueueTracker(tracker) {
  const payload = {
    snapshot: [...tracker.snapshot.values()],
    activity: [...tracker.activity.values()],
    last_scan_at: tracker.last_scan_at
  };
  await updateJson(QUEUE_ACTIVITY_FILE, {}, (all) => {
    all[tracker.key] = payload;
    return payload;
  });
}

function queueHasRankedActivity(previous, current) {
  if (!previous) return false;
  const gamesDelta = Number(current.games || 0) - Number(previous.games || 0);
  const winsDelta = Number(current.wins || 0) - Number(previous.wins || 0);
  const lossesDelta = Number(current.losses || 0) - Number(previous.losses || 0);
  return gamesDelta > 0 || winsDelta > 0 || lossesDelta > 0;
}

function queueActivityRecord(previous, current, now) {
  return {
    ...current,
    detected_at: now,
    last_activity_at: now,
    delta_games: Math.max(0, Number(current.games || 0) - Number(previous.games || 0)),
    delta_wins: Math.max(0, Number(current.wins || 0) - Number(previous.wins || 0)),
    delta_losses: Math.max(0, Number(current.losses || 0) - Number(previous.losses || 0)),
    delta_elo: Number(current.rating || 0) - Number(previous.rating || 0)
  };
}

async function scanQueueTracker(tracker) {
  if (tracker.scanPromise) return tracker.scanPromise;
  tracker.scanPromise = (async () => {
    tracker.status = 'scanning';
    tracker.error = null;
    const now = Date.now();
    try {
      const hadBaseline = tracker.snapshot.size > 0;
      const currentEntries = await fetchQueueLeaderboard(tracker.region, tracker.mode);
      const currentSnapshot = new Map(currentEntries.map((entry) => [entry.key, entry]));
      for (const current of currentEntries) {
        const previous = tracker.snapshot.get(current.key);
        if (queueHasRankedActivity(previous, current)) {
          tracker.activity.set(current.key, queueActivityRecord(previous, current, now));
        } else if (tracker.activity.has(current.key)) {
          tracker.activity.set(current.key, { ...tracker.activity.get(current.key), ...current });
        }
      }
      for (const [key, activity] of tracker.activity) {
        if ((now - Number(activity.last_activity_at || 0)) > QUEUE_ACTIVITY_WINDOW_MS) {
          tracker.activity.delete(key);
        }
      }
      tracker.snapshot = currentSnapshot;
      tracker.last_scan_at = now;
      tracker.refresh_delay_ms = hadBaseline ? QUEUE_SCAN_INTERVAL_MS : 30_000;
      tracker.next_scan_at = now + tracker.refresh_delay_ms;
      tracker.status = 'ready';
      await persistQueueTracker(tracker);
    } catch (error) {
      tracker.status = tracker.last_scan_at ? 'stale' : 'error';
      tracker.error = error.message || 'Queue scan failed';
      tracker.refresh_delay_ms = QUEUE_SCAN_INTERVAL_MS;
      tracker.next_scan_at = Date.now() + tracker.refresh_delay_ms;
      console.warn(`Queue scan failed for ${tracker.key}:`, tracker.error);
    } finally {
      tracker.scanPromise = null;
      if (tracker.timer) clearTimeout(tracker.timer);
      if ((Date.now() - tracker.last_requested_at) < QUEUE_TRACKER_IDLE_MS) {
        tracker.timer = setTimeout(() => scanQueueTracker(tracker), tracker.refresh_delay_ms || QUEUE_SCAN_INTERVAL_MS);
        tracker.timer.unref?.();
      }
    }
    return tracker;
  })();
  return tracker.scanPromise;
}

async function ensureQueueTracker(region, mode) {
  const key = queueComboKey(region, mode);
  let tracker = queueTrackers.get(key);
  if (!tracker) {
    const persisted = await loadPersistedQueueTracker(region, mode);
    tracker = {
      key,
      region,
      mode,
      snapshot: persisted.snapshot,
      activity: persisted.activity,
      last_scan_at: persisted.last_scan_at,
      next_scan_at: null,
      last_requested_at: Date.now(),
      status: persisted.last_scan_at ? 'stale' : 'warming',
      error: null,
      timer: null,
      scanPromise: null,
      refresh_delay_ms: QUEUE_SCAN_INTERVAL_MS
    };
    queueTrackers.set(key, tracker);
  }
  tracker.last_requested_at = Date.now();
  const now = Date.now();
  const scanAge = tracker.last_scan_at ? now - tracker.last_scan_at : Infinity;
  const scanDue = !tracker.last_scan_at || (tracker.next_scan_at ? now >= tracker.next_scan_at : scanAge > QUEUE_SCAN_INTERVAL_MS);
  if (!tracker.scanPromise && scanDue) await scanQueueTracker(tracker);
  return tracker;
}

async function hydrateQueueActivity(entries) {
  const playerIds = [...new Set(entries.flatMap((entry) => (entry.players || []).map((player) => Number(player.id)).filter(Boolean)))];
  const legendPairs = await mapWithConcurrency(playerIds, 6, async (id) => [id, await getMainLegendSummary(id)]);
  const legendById = new Map(legendPairs);
  return entries.map((entry) => ({
    ...entry,
    players: (entry.players || []).map((player) => ({
      ...player,
      main_legend: legendById.get(Number(player.id)) || null
    }))
  }));
}

app.get('/api/legend-art/:name', async (req, res) => {
  const name = String(req.params.name || '').trim().slice(0, 50);
  if (!name) return res.status(404).end();
  const image = await fetchLegendArtwork(name);
  if (!image) return res.status(404).end();
  res.setHeader('Content-Type', image.contentType);
  res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
  res.send(image.buffer);
});

app.get('/api/legend-image/:name', async (req, res) => {
  const name = String(req.params.name || '').trim().slice(0, 50);
  if (!name) return res.status(404).end();
  // Prefer the transparent legend portrait. The official splash is only a
  // fallback, because it is often cropped or blurry inside small cards.
  const image = await fetchLegendArtwork(name) || await fetchOfficialLegendImage(name);
  if (!image) return res.status(404).end();
  res.setHeader('Content-Type', image.contentType);
  res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=2592000');
  res.send(image.buffer);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'PeakHalla', version: '7.26.0' });
});

app.get('/api/suggestions', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 40);
    if (query.length < 2) return res.status(400).json({ error: 'Type at least 2 letters.' });
    const region = 'ALL';
    const mode = allowed(String(req.query.mode || '1v1'), ['1v1', '2v2', '3v3'], '1v1');

    async function fetchMatches(search) {
      const params = new URLSearchParams({
        page: '1', max_results: '12', game_mode: mode, region, search, order_by: 'rating'
      });
      return apiFetch(`/leaderboard/ranked?${params}`, 30_000).catch(() => ({ rankings: [] }));
    }

    const numericId = query.replace(/^#/, '');
    const quickLocalMatches = /^\d+$/.test(numericId) ? [] : await findAliasMatches(query, 7).catch(() => []);
    const exactLocalMatches = quickLocalMatches.filter((item) => (item.names || []).some((name) => normalizeName(name?.name) === normalizeName(query)));
    if (exactLocalMatches.length) {
      const localCandidates = exactLocalMatches.map((item) => ({ id: item.id, name: item.names?.[0]?.name, aliases: item.names?.map((name) => name.name) || [] }));
      const localProfiles = (await mapWithConcurrency(localCandidates, 7, (item) => buildProfileSearchRanking(item, query, { quick: true }))).filter(Boolean);
      if (localProfiles.length) return res.json({ rankings: localProfiles.slice(0, 7), local_alias_hit: true });
    }
    const [official, coreMatches, localMatches, esportsMatch] = await Promise.all([
      /^\d+$/.test(numericId) ? Promise.resolve({ rankings: [] }) : settleWithin(fetchMatches(query), 1600, { rankings: [] }),
      /^\d+$/.test(numericId) ? Promise.resolve([]) : settleWithin(searchCorehallaAliasesBroad(query, 4, true), 8000, []),
      findAliasMatches(query, 8).catch(() => []),
      /^\d+$/.test(numericId) ? Promise.resolve(null) : settleWithin(findEsportsPlayerByName(query, ''), 2600, null)
    ]);
    const rankings = await hydrateRankingPlayers(official?.rankings || [], 'suggestion', { includeLegends: false });
    const existingIds = new Set(rankings.flatMap((item) => (item.players || []).map((player) => Number(player.id))));
    const candidates = [];
    if (/^\d+$/.test(numericId)) candidates.push({ id: Number(numericId), name: `Player ${numericId}`, aliases: [] });
    const esportsBhId = Number(esportsMatch?.player?.brawlhallaId ?? esportsMatch?.player?.brawlhalla_id ?? 0);
    if (esportsBhId > 0 && !existingIds.has(esportsBhId)) candidates.push({ id: esportsBhId, name: esportsMatch?.player?.name || query, aliases: [query] });
    for (const item of coreMatches) if (!existingIds.has(Number(item.id))) candidates.push(item);
    for (const item of localMatches) if (!existingIds.has(Number(item.id))) candidates.push({ id: item.id, name: item.names?.[0]?.name, aliases: item.names?.map((name) => name.name) || [] });
    const uniqueCandidates = [...new Map(candidates.map((item) => [Number(item.id), item])).values()].slice(0, 7);
    const profiles = (await mapWithConcurrency(uniqueCandidates, 6, (item) => buildProfileSearchRanking(item, query, { quick: true }))).filter(Boolean);
    res.json({ rankings: [...rankings, ...profiles].slice(0, 12) });
  } catch (error) {
    next(error);
  }
});

app.get('/api/search', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 40);
    if (query.length < 2) return res.status(400).json({ error: 'Type at least 2 letters.' });

    const region = 'ALL';
    const mode = allowed(String(req.query.mode || '1v1'), ['1v1', '2v2', '3v3'], '1v1');
    const params = new URLSearchParams({
      page: '1', max_results: '20', game_mode: mode, region, search: query, order_by: 'rating'
    });
    const numericId = query.replace(/^#/, '');
    const [official, coreMatches, localMatches, esportsMatch] = await Promise.all([
      /^\d+$/.test(numericId) ? Promise.resolve({ rankings: [], total_pages: 0 }) : settleWithin(apiFetch(`/leaderboard/ranked?${params}`), 3500, { rankings: [], total_pages: 0 }),
      /^\d+$/.test(numericId) ? Promise.resolve([]) : settleWithin(searchCorehallaAliasesBroad(query, 5, true), 11000, []),
      findAliasMatches(query, 12).catch(() => []),
      /^\d+$/.test(numericId) ? Promise.resolve(null) : settleWithin(findEsportsPlayerByName(query, ''), 3500, null)
    ]);
    const hydratedOfficial = await hydrateRankingPlayers(official?.rankings || [], 'search', { includeLegends: false });
    const needle = normalizeName(query);
    const officialRankings = hydratedOfficial.filter((item) => (item.players || []).some((player) =>
      normalizeName(player.username).includes(needle)
    ));
    const officialIds = new Set(officialRankings.flatMap((item) => (item.players || []).map((player) => Number(player.id))));

    const candidates = [];
    if (/^\d+$/.test(numericId)) candidates.push({ id: Number(numericId), name: `Player ${numericId}`, aliases: [] });
    const esportsBhId = Number(esportsMatch?.player?.brawlhallaId ?? esportsMatch?.player?.brawlhalla_id ?? 0);
    if (esportsBhId > 0 && !officialIds.has(esportsBhId)) candidates.push({ id: esportsBhId, name: esportsMatch?.player?.name || query, aliases: [query] });
    for (const item of coreMatches) if (!officialIds.has(Number(item.id))) candidates.push(item);
    for (const item of localMatches) if (!officialIds.has(Number(item.id))) candidates.push({ id: item.id, name: item.names?.[0]?.name, aliases: item.names?.map((name) => name.name) || [] });
    const uniqueCandidates = [...new Map(candidates.map((item) => [Number(item.id), item])).values()].slice(0, 12);
    const profiles = (await mapWithConcurrency(uniqueCandidates, 8, (item) => buildProfileSearchRanking(item, query, { quick: true }))).filter(Boolean)
      .sort((a, b) => Number(b.search_score || 0) - Number(a.search_score || 0));

    res.json({
      rankings: [...officialRankings, ...profiles].slice(0, 24),
      total_pages: official?.total_pages || 0,
      includes_unranked_profiles: profiles.length > 0
    });
  } catch (error) {
    next(error);
  }
});


app.get('/api/clans/top', async (req, res, next) => {
  try {
    const query = normalizeName(String(req.query.q || '').slice(0, 60));
    const limit = asInt(req.query.limit, 18, 1, 40);
    const force = String(req.query.refresh || '') === '1';
    const data = await topGuilds({ force, query });
    const guilds = query
      ? data.guilds.filter((guild) => normalizeName(guild.name).includes(query) || String(guild.guild_id) === query)
      : data.guilds;
    res.json({
      guilds: guilds.slice(0, limit),
      updated_at: data.updated_at,
      stale: data.stale,
      discovery: 'Top clans ordered by lifetime XP.'
    });
  } catch (error) { next(error); }
});

app.get('/api/clans/:id', async (req, res, next) => {
  try {
    const guildId = asInt(req.params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!guildId) return res.status(400).json({ error: 'Invalid guild ID.' });
    const [officialGuild, officialMembers, legacy, cached] = await Promise.all([
      getGuildStats(guildId, 5 * 60_000),
      getGuildMembers(guildId, 5 * 60_000).catch(() => null),
      getCorehallaClanStats(guildId, false),
      readGuildCache()
    ]);
    const officialRosterAvailable = Array.isArray(officialMembers);
    const members = enforceGuildRoleIntegrity(officialRosterAvailable ? officialMembers : (legacy?.members || []));
    const cachedGuild = cached.guilds.find((item) => Number(item.guild_id) === guildId);
    const guild = mergeGuilds(legacy?.guild, cachedGuild, officialGuild);
    if (!guild) return res.status(404).json({ error: 'Clan not found.' });
    const fullGuild = {
      ...guild,
      member_count: officialRosterAvailable ? members.length : (guild.member_count ?? members.length)
    };
    await rememberGuild(fullGuild).catch(() => null);
    res.json({
      guild: fullGuild,
      members,
      members_source: officialRosterAvailable ? 'official-brawlhalla' : 'fallback-cache',
      role_order: ['Recruit', 'Member', 'Officer', 'Leader'],
      role_integrity: { leader_count: members.filter((member) => member.rank === 'Leader').length }
    });
  } catch (error) { next(error); }
});

app.get('/api/leaderboard', async (req, res, next) => {
  try {
    const page = asInt(req.query.page, 1, 1, 1000);
    const region = allowed(String(req.query.region || 'ALL').toUpperCase(),
      ['ALL', 'US-E', 'EU', 'SEA', 'BRZ', 'AUS', 'US-W', 'JPS', 'SA', 'ME'], 'ALL');
    const mode = allowed(String(req.query.mode || '1v1'), ['1v1', '2v2', '3v3'], '1v1');
    const orderBy = allowed(String(req.query.order_by || 'rating'),
      ['rating', 'best_rating', 'wl_ratio', 'wins', 'games'], 'rating');
    const params = new URLSearchParams({
      page: String(page), max_results: '20', game_mode: mode, region, order_by: orderBy
    });

    const data = await apiFetch(`/leaderboard/ranked?${params}`);
    const rankings = await hydrateRankingPlayers(data?.rankings || [], 'leaderboard');
    res.json({ ...data, rankings });
  } catch (error) {
    next(error);
  }
});


app.get('/api/queue/activity', async (req, res, next) => {
  try {
    const region = allowed(String(req.query.region || 'ME').toUpperCase(), QUEUE_REGIONS, 'ME');
    const mode = allowed(String(req.query.mode || '1v1'), QUEUE_MODES, '1v1');
    const tracker = await ensureQueueTracker(region, mode);
    const now = Date.now();
    for (const [key, activity] of tracker.activity) {
      if ((now - Number(activity.last_activity_at || 0)) > QUEUE_ACTIVITY_WINDOW_MS) tracker.activity.delete(key);
    }
    const rawPlayers = [...tracker.activity.values()]
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(a.rank || Infinity) - Number(b.rank || Infinity) || Number(b.last_activity_at || 0) - Number(a.last_activity_at || 0))
      .slice(0, 80);
    const players = await hydrateQueueActivity(rawPlayers);
    res.json({
      region,
      mode,
      status: tracker.status,
      error: tracker.error,
      top_limit: QUEUE_TOP_LIMIT,
      activity_window_minutes: QUEUE_ACTIVITY_WINDOW_MS / 60_000,
      tracked_count: tracker.snapshot.size,
      active_count: players.length,
      last_scan_at: tracker.last_scan_at,
      next_scan_at: tracker.next_scan_at,
      warming_up: tracker.snapshot.size > 0 && !tracker.last_scan_at ? true : (!tracker.last_scan_at || (tracker.snapshot.size > 0 && tracker.activity.size === 0 && tracker.status === 'warming')),
      players
    });
  } catch (error) {
    next(error);
  }
});


app.get('/api/arena/me', async (req, res) => {
  res.json({ user: await wallCurrentUser(req) });
});

app.post('/api/arena/register', async (req, res, next) => {
  try {
    if (!wallRateLimit(req, 'arena-register', 8, 10 * 60_000)) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    const username = wallUsername(req.body?.username);
    const password = String(req.body?.password || '');
    if (!validWallUsername(username)) return res.status(400).json({ error: 'Username must be 3–24 letters, numbers, dots, dashes, or underscores.' });
    if (password.length < 6 || password.length > 72) return res.status(400).json({ error: 'Password must be 6–72 characters.' });
    const key = wallUsernameKey(username);
    const created = await updateJson(WALL_USERS_FILE, {}, (users) => {
      if (users[key]) return null;
      const secret = wallPasswordHash(password);
      const now = new Date().toISOString();
      const user = { id: crypto.randomUUID(), username, password_salt: secret.salt, password_hash: secret.hash, bio: '', avatar_url: null, created_at: now, updated_at: now };
      users[key] = user;
      return user;
    });
    if (!created) return res.status(409).json({ error: 'That username is already taken.' });
    wallSetSessionCookie(req, res, created.id);
    res.status(201).json({ user: wallPublicUser(created) });
  } catch (error) { next(error); }
});

app.post('/api/arena/login', async (req, res, next) => {
  try {
    if (!wallRateLimit(req, 'arena-login', 12, 10 * 60_000)) return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    const username = wallUsername(req.body?.username);
    const password = String(req.body?.password || '');
    const users = await readJson(WALL_USERS_FILE, {});
    const user = users[wallUsernameKey(username)];
    if (!user || !wallPasswordMatches(password, user)) return res.status(401).json({ error: 'Username or password is incorrect.' });
    wallSetSessionCookie(req, res, user.id);
    res.json({ user: wallPublicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/arena/logout', async (req, res) => {
  wallClearSessionCookie(req, res);
  res.json({ ok: true });
});

app.get('/api/arena/posts', async (req, res) => {
  const [posts, users, viewer] = await Promise.all([
    readJson(WALL_POSTS_FILE, []),
    readJson(WALL_USERS_FILE, {}),
    wallCurrentUser(req)
  ]);
  const usersById = wallUserMap(users);
  res.json({ posts: (Array.isArray(posts) ? posts : []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 80).map((post) => wallPublicPost(post, viewer?.id || null, usersById)) });
});

app.get('/api/arena/profiles/:username', async (req, res) => {
  const username = wallUsername(req.params.username);
  const [users, posts] = await Promise.all([readJson(WALL_USERS_FILE, {}), readJson(WALL_POSTS_FILE, [])]);
  const user = users[wallUsernameKey(username)];
  if (!user) return res.status(404).json({ error: 'Profile not found.' });
  const safePosts = Array.isArray(posts) ? posts : [];
  const postCount = safePosts.filter((post) => String(post.user_id) === String(user.id)).length;
  const commentCount = safePosts.reduce((total, post) => total + (Array.isArray(post.comments) ? post.comments.filter((comment) => String(comment.user_id) === String(user.id)).length : 0), 0);
  res.json({ profile: { ...wallPublicUser(user), post_count: postCount, comment_count: commentCount } });
});

app.patch('/api/arena/profile', async (req, res, next) => {
  try {
    const viewer = await wallRequireUser(req, res);
    if (!viewer) return;
    const bio = String(req.body?.bio || '').trim().slice(0, 160);
    const removeAvatar = Boolean(req.body?.remove_avatar);
    const avatarData = req.body?.avatar_data ? String(req.body.avatar_data) : '';
    let newAvatarUrl = null;
    let oldAvatarUrl = null;

    if (avatarData) {
      const image = parseArenaImage(avatarData, WALL_MAX_AVATAR_BYTES, 'Avatar');
      await fs.mkdir(path.join(WALL_UPLOADS_DIR, 'avatars'), { recursive: true });
      const filename = `avatar-${viewer.id}-${Date.now()}.${image.extension}`;
      await fs.writeFile(path.join(WALL_UPLOADS_DIR, 'avatars', filename), image.buffer, { flag: 'wx' });
      newAvatarUrl = `/uploads/arena/avatars/${filename}`;
    }

    const updated = await updateJson(WALL_USERS_FILE, {}, (users) => {
      const key = Object.keys(users).find((item) => String(users[item]?.id) === String(viewer.id));
      if (!key) return null;
      const user = users[key];
      oldAvatarUrl = user.avatar_url || null;
      user.bio = bio;
      if (newAvatarUrl) user.avatar_url = newAvatarUrl;
      else if (removeAvatar) user.avatar_url = null;
      user.updated_at = new Date().toISOString();
      return user;
    });
    if (!updated) return res.status(404).json({ error: 'Profile not found.' });
    if ((newAvatarUrl || removeAvatar) && oldAvatarUrl && oldAvatarUrl !== updated.avatar_url) await removeArenaUpload(oldAvatarUrl);
    res.json({ user: wallPublicUser(updated) });
  } catch (error) { next(error); }
});

app.post('/api/arena/posts', async (req, res, next) => {
  try {
    const user = await wallRequireUser(req, res);
    if (!user) return;
    if (!wallRateLimit(req, `arena-post:${user.id}`, 12, 60 * 60_000)) return res.status(429).json({ error: 'Post limit reached. Try again later.' });
    const caption = String(req.body?.caption || '').trim().slice(0, 500);
    const image = parseArenaImage(req.body?.image_data);
    await fs.mkdir(WALL_UPLOADS_DIR, { recursive: true });
    const filename = `${Date.now()}-${crypto.randomUUID()}.${image.extension}`;
    await fs.writeFile(path.join(WALL_UPLOADS_DIR, filename), image.buffer, { flag: 'wx' });
    const post = {
      id: crypto.randomUUID(), user_id: user.id, username: user.username,
      caption, image_url: `/uploads/arena/${filename}`, created_at: new Date().toISOString(), updated_at: null, reactions: {}, comments: []
    };
    await updateJson(WALL_POSTS_FILE, [], (posts) => {
      if (!Array.isArray(posts)) posts = [];
      posts.unshift(post);
      if (posts.length > 300) posts.length = 300;
      return post;
    });
    const users = await readJson(WALL_USERS_FILE, {});
    res.status(201).json({ post: wallPublicPost(post, user.id, wallUserMap(users)) });
  } catch (error) { next(error); }
});

app.patch('/api/arena/posts/:id', async (req, res, next) => {
  let newImageUrl = null;
  try {
    const user = await wallRequireUser(req, res);
    if (!user) return;
    const postId = String(req.params.id || '');
    const caption = String(req.body?.caption || '').trim().slice(0, 500);
    const currentPosts = await readJson(WALL_POSTS_FILE, []);
    const currentPost = Array.isArray(currentPosts) ? currentPosts.find((item) => item.id === postId) : null;
    if (!currentPost) return res.status(404).json({ error: 'Post not found.' });
    if (String(currentPost.user_id) !== String(user.id)) return res.status(403).json({ error: 'You can only edit your own posts.' });

    if (req.body?.image_data) {
      const image = parseArenaImage(req.body.image_data);
      await fs.mkdir(WALL_UPLOADS_DIR, { recursive: true });
      const filename = `${Date.now()}-${crypto.randomUUID()}.${image.extension}`;
      await fs.writeFile(path.join(WALL_UPLOADS_DIR, filename), image.buffer, { flag: 'wx' });
      newImageUrl = `/uploads/arena/${filename}`;
    }

    let oldImageUrl = null;
    const post = await updateJson(WALL_POSTS_FILE, [], (posts) => {
      if (!Array.isArray(posts)) return null;
      const found = posts.find((item) => item.id === postId);
      if (!found) return null;
      if (String(found.user_id) !== String(user.id)) return { forbidden: true };
      oldImageUrl = found.image_url || null;
      found.caption = caption;
      if (newImageUrl) found.image_url = newImageUrl;
      found.updated_at = new Date().toISOString();
      return found;
    });
    if (!post) {
      if (newImageUrl) await removeArenaUpload(newImageUrl);
      return res.status(404).json({ error: 'Post not found.' });
    }
    if (post.forbidden) {
      if (newImageUrl) await removeArenaUpload(newImageUrl);
      return res.status(403).json({ error: 'You can only edit your own posts.' });
    }
    if (newImageUrl && oldImageUrl && oldImageUrl !== newImageUrl) await removeArenaUpload(oldImageUrl);
    const users = await readJson(WALL_USERS_FILE, {});
    res.json({ post: wallPublicPost(post, user.id, wallUserMap(users)) });
  } catch (error) {
    if (newImageUrl) await removeArenaUpload(newImageUrl);
    next(error);
  }
});

app.delete('/api/arena/posts/:id', async (req, res, next) => {
  try {
    const user = await wallRequireUser(req, res);
    if (!user) return;
    const postId = String(req.params.id || '');
    let removed = null;
    const result = await updateJson(WALL_POSTS_FILE, [], (posts) => {
      if (!Array.isArray(posts)) return null;
      const index = posts.findIndex((item) => item.id === postId);
      if (index < 0) return null;
      if (String(posts[index].user_id) !== String(user.id)) return { forbidden: true };
      removed = posts.splice(index, 1)[0];
      return { ok: true };
    });
    if (!result) return res.status(404).json({ error: 'Post not found.' });
    if (result.forbidden) return res.status(403).json({ error: 'You can only delete your own posts.' });
    await removeArenaUpload(removed?.image_url);
    res.json({ ok: true });
  } catch (error) { next(error); }
});

app.post('/api/arena/posts/:id/reaction', async (req, res, next) => {
  try {
    const user = await wallRequireUser(req, res);
    if (!user) return;
    const postId = String(req.params.id || '');
    const requested = ['like', 'dislike'].includes(req.body?.reaction) ? req.body.reaction : null;
    const post = await updateJson(WALL_POSTS_FILE, [], (posts) => {
      if (!Array.isArray(posts)) return null;
      const found = posts.find((item) => item.id === postId);
      if (!found) return null;
      found.reactions = found.reactions && typeof found.reactions === 'object' ? found.reactions : {};
      if (!requested || found.reactions[user.id] === requested) delete found.reactions[user.id];
      else found.reactions[user.id] = requested;
      return found;
    });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    const users = await readJson(WALL_USERS_FILE, {});
    res.json({ post: wallPublicPost(post, user.id, wallUserMap(users)) });
  } catch (error) { next(error); }
});

app.post('/api/arena/posts/:id/comments', async (req, res, next) => {
  try {
    const user = await wallRequireUser(req, res);
    if (!user) return;
    if (!wallRateLimit(req, `arena-comment:${user.id}`, 80, 60 * 60_000)) return res.status(429).json({ error: 'Comment limit reached. Try again later.' });
    const postId = String(req.params.id || '');
    const textValue = String(req.body?.text || '').trim().slice(0, 500);
    const parentId = req.body?.parent_id ? String(req.body.parent_id) : null;
    if (!textValue) return res.status(400).json({ error: 'Write a comment first.' });
    const result = await updateJson(WALL_POSTS_FILE, [], (posts) => {
      if (!Array.isArray(posts)) return null;
      const post = posts.find((item) => item.id === postId);
      if (!post) return null;
      post.comments = Array.isArray(post.comments) ? post.comments : [];
      let safeParentId = null;
      if (parentId) {
        const parent = post.comments.find((item) => item.id === parentId);
        if (parent) safeParentId = parent.parent_id || parent.id;
      }
      const comment = { id: crypto.randomUUID(), user_id: user.id, username: user.username, text: textValue, parent_id: safeParentId, created_at: new Date().toISOString(), updated_at: null };
      post.comments.push(comment);
      return { post, comment };
    });
    if (!result) return res.status(404).json({ error: 'Post not found.' });
    const users = await readJson(WALL_USERS_FILE, {});
    res.status(201).json({ post: wallPublicPost(result.post, user.id, wallUserMap(users)) });
  } catch (error) { next(error); }
});

app.patch('/api/arena/posts/:postId/comments/:commentId', async (req, res, next) => {
  try {
    const user = await wallRequireUser(req, res);
    if (!user) return;
    const textValue = String(req.body?.text || '').trim().slice(0, 500);
    if (!textValue) return res.status(400).json({ error: 'Comment cannot be empty.' });
    const result = await updateJson(WALL_POSTS_FILE, [], (posts) => {
      const post = Array.isArray(posts) ? posts.find((item) => item.id === String(req.params.postId || '')) : null;
      if (!post) return null;
      const comment = (post.comments || []).find((item) => item.id === String(req.params.commentId || ''));
      if (!comment) return null;
      if (String(comment.user_id) !== String(user.id)) return { forbidden: true };
      comment.text = textValue;
      comment.updated_at = new Date().toISOString();
      return { post };
    });
    if (!result) return res.status(404).json({ error: 'Comment not found.' });
    if (result.forbidden) return res.status(403).json({ error: 'You can only edit your own comments.' });
    const users = await readJson(WALL_USERS_FILE, {});
    res.json({ post: wallPublicPost(result.post, user.id, wallUserMap(users)) });
  } catch (error) { next(error); }
});

app.delete('/api/arena/posts/:postId/comments/:commentId', async (req, res, next) => {
  try {
    const user = await wallRequireUser(req, res);
    if (!user) return;
    const result = await updateJson(WALL_POSTS_FILE, [], (posts) => {
      const post = Array.isArray(posts) ? posts.find((item) => item.id === String(req.params.postId || '')) : null;
      if (!post) return null;
      const comments = Array.isArray(post.comments) ? post.comments : [];
      const comment = comments.find((item) => item.id === String(req.params.commentId || ''));
      if (!comment) return null;
      if (String(comment.user_id) !== String(user.id)) return { forbidden: true };
      const targetId = comment.id;
      post.comments = comments.filter((item) => item.id !== targetId && item.parent_id !== targetId);
      return { post };
    });
    if (!result) return res.status(404).json({ error: 'Comment not found.' });
    if (result.forbidden) return res.status(403).json({ error: 'You can only delete your own comments.' });
    const users = await readJson(WALL_USERS_FILE, {});
    res.json({ post: wallPublicPost(result.post, user.id, wallUserMap(users)) });
  } catch (error) { next(error); }
});

app.get('/api/esports', async (req, res) => {
  const region = allowed(String(req.query.region || 'NA').toUpperCase(), ['NA', 'EU', 'SA', 'SEA', 'MENA'], 'NA');
  const mode = allowed(String(req.query.mode || '1v1'), ['1v1', '2v2'], '1v1');
  const data = await readJson(ESPORTS_FILE, { rankings: {}, tournament_series: [], featured_champions: [] });
  const localRankings = data.rankings?.[`${region}:${mode}`] || [];

  let official = { rankings: [], updated_at: null, source_url: `${OFFICIAL_ESPORTS_BASE}/${region}/${mode}/1?sortBy=powerRanking` };
  try {
    official = await getOfficialEsportsRankings(region, mode);
  } catch (error) {
    console.warn(`Could not refresh official ${region} ${mode} rankings:`, error.message);
  }

  const tournamentSeries = (data.tournament_series || []).filter((event) => {
    const regions = Array.isArray(event.regions) && event.regions.length ? event.regions : ['GLOBAL'];
    const modes = Array.isArray(event.modes) && event.modes.length ? event.modes : ['1v1', '2v2'];
    const regionMatches = region === 'MENA'
      ? regions.includes('MENA')
      : regions.includes('GLOBAL') || regions.includes(region);
    return regionMatches && modes.includes(mode);
  });

  res.json({
    updated_at: official.updated_at || data.updated_at || null,
    source: data.source || 'Official Brawlhalla Esports Power Rankings',
    source_url: official.source_url,
    region,
    mode,
    live: official.rankings.length > 0,
    rankings: official.rankings.length ? official.rankings : localRankings,
    tournament_series: tournamentSeries,
    featured_champions: data.featured_champions || []
  });
});


app.get('/api/esports/player', async (req, res, next) => {
  try {
    const name = String(req.query.name || '').trim().slice(0, 80);
    const region = String(req.query.region || '').trim().toUpperCase().slice(0, 10);
    if (name.length < 2) return res.status(400).json({ error: 'Type a player name.' });

    const searchResult = await findEsportsPlayerByName(name, region);
    if (!searchResult) return res.status(404).json({ error: 'No esports tournament profile was found for this player.' });

    const playerId = searchResult.esports_player_id;
    const [detailsResult, singles, doubles] = await Promise.all([
      brawlToolsFetch(`/player/${encodeURIComponent(playerId)}`, 60 * 60_000).catch(() => null),
      getEsportsPlacements(playerId, 1),
      getEsportsPlacements(playerId, 2)
    ]);

    const player = detailsResult?.player || searchResult.player || {};
    const seen = new Set();
    const placements = [...singles, ...doubles]
      .filter((item) => {
        const tournament = item.tournament || {};
        const key = [item.mode, tournament.slug || tournament.id || tournament.tournamentName, tournament.eventName, item.placement].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Number(b.tournament?.startTime || 0) - Number(a.tournament?.startTime || 0));

    res.json({
      player: {
        id: playerId,
        name: player.name || searchResult.player?.name || name,
        region: searchResult.region || region || null,
        country: player.country || null,
        twitch: player.twitch || searchResult.player?.twitch || null,
        twitter: player.twitter || searchResult.player?.twitter || null,
        earnings: Number(searchResult.earnings || 0),
        pr1v1: searchResult.pr1v1 ?? null,
        pr2v2: searchResult.pr2v2 ?? null
      },
      summary: summarizePlacements(placements),
      placements,
      source: 'Brawlhalla Esports Stats API',
      source_url: 'https://www.docs.brawltools.com/v2/requests/player/placement/'
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/player/:id/history', async (req, res) => {
  const id = asInt(req.params.id, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!id) return res.status(400).json({ error: 'Invalid player ID.' });
  const snapshots = await readJson(SNAPSHOTS_FILE, {});
  const names = await readKnownNames(id);
  res.json({ history: snapshots[String(id)] || [], names });
});



function playerRefId(player = {}) {
  return Number(player.id ?? player.brawlhalla_id ?? player.brawlhallaId ?? player.player_id ?? 0);
}

function playerRefName(player = {}) {
  return String(player.username ?? player.name ?? player.player_name ?? '').trim();
}

function collectTeamRows(payload, playerId) {
  const rows = [];
  const seenObjects = new Set();

  function visit(value, depth = 0) {
    if (depth > 7 || value == null) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    if (typeof value !== 'object' || seenObjects.has(value)) return;
    seenObjects.add(value);

    const players = Array.isArray(value.players)
      ? value.players
      : Array.isArray(value.team?.players)
        ? value.team.players
        : Array.isArray(value.members)
          ? value.members
          : null;

    if (players?.length >= 2 && players.some((player) => playerRefId(player) === Number(playerId))) {
      rows.push({ ...value, players });
    }

    for (const [key, child] of Object.entries(value)) {
      if (['legends', 'region_ranks'].includes(key)) continue;
      if (Array.isArray(child) || (child && typeof child === 'object')) visit(child, depth + 1);
    }
  }

  visit(payload);
  return rows;
}

function normalizeTeamRow(team = {}) {
  return {
    players: Array.isArray(team.players) ? team.players : [],
    rating: Number(team.rating ?? team.team_rating ?? team.elo ?? team.team_elo) || null,
    peak_rating: Number(team.best_rating ?? team.peak_rating ?? team.team_peak_rating ?? team.peak_elo) || null,
    tier: team.tier ?? team.team_tier ?? null,
    rank: Number(team.rank ?? team.team_rank) || null,
    region: team.region ?? team.server ?? null,
    wins: Number(team.wins ?? team.team_wins) || 0,
    losses: Number(team.losses ?? team.team_losses) || 0
  };
}

app.get('/api/player/:id/teammates', async (req, res, next) => {
  try {
    const id = asInt(req.params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!id) return res.status(400).json({ error: 'Invalid player ID.' });

    const teamsResponse = await apiFetch(`/player/teams?brawlhalla_id=${id}`, 60_000).catch(() => null);
    const teams = Array.isArray(teamsResponse?.teams?.ranked_2v2)
      ? teamsResponse.teams.ranked_2v2
      : Array.isArray(teamsResponse?.ranked_2v2)
        ? teamsResponse.ranked_2v2
        : [];

    const refs = teams.map((team) => {
      const firstId = Number(team.brawlhalla_id_one || 0);
      const secondId = Number(team.brawlhalla_id_two || 0);
      const teammateId = firstId === id ? secondId : firstId;
      const teammateName = firstId === id ? team.username_two : team.username_one;
      const regionRank = Array.isArray(team.region_ranks)
        ? team.region_ranks.find((rank) => String(rank.region).toUpperCase() === String(team.region).toUpperCase())?.rank
        : null;
      return {
        id: teammateId,
        name: teammateName || `Player ${teammateId}`,
        team_rating: Number(team.rating) || null,
        team_peak_rating: Number(team.peak_rating) || null,
        team_tier: team.tier || null,
        team_rank: Number(team.global_rank || regionRank) || null,
        region: team.region || null,
        wins: Number(team.wins) || 0,
        games: Number(team.games) || 0,
        losses: Math.max(0, Number(team.games || 0) - Number(team.wins || 0))
      };
    }).filter((item) => Number.isSafeInteger(item.id) && item.id > 0 && item.id !== id);

    const bestByPlayer = new Map();
    for (const item of refs) {
      const previous = bestByPlayer.get(item.id);
      if (!previous || Number(item.team_rating || 0) > Number(previous.team_rating || 0)) bestByPlayer.set(item.id, item);
    }

    const teammates = await mapWithConcurrency([...bestByPlayer.values()], 5, async (item) => {
      const [lifetimePlayer, mainLegend] = await Promise.all([
        apiFetch(`/player/stats?brawlhalla_id=${item.id}&mode=all`, 120_000).catch(() => null),
        getMainLegendSummary(item.id)
      ]);
      return {
        ...item,
        name: lifetimePlayer?.name || item.name,
        tier: item.team_tier || null,
        main_legend: mainLegend || null
      };
    });

    teammates.sort((a, b) => Number(b.team_rating || 0) - Number(a.team_rating || 0));
    res.json({
      player_id: id,
      teammates,
      source: 'official-player-teams',
      current_season_only: true
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/player/:id', async (req, res, next) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const id = asInt(req.params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!id) return res.status(400).json({ error: 'Invalid player ID.' });
    const forceFresh = String(req.query.refresh || '') === '1';
    const live = String(req.query.live || '') === '1' && !forceFresh;
    const fast = String(req.query.fast || '') === '1' && !forceFresh && !live;
    const cachedProfile = fast ? (getCachedProfileResponse(id) || await getDiskCachedProfileResponse(id)) : null;
    if (cachedProfile) {
      res.setHeader('X-Profile-Cache', 'hit');
      return res.json({ ...cachedProfile, background_refresh_recommended: true });
    }

    const localNamesSeedPromise = fast ? peekKnownNames(id).catch(() => []) : readKnownNames(id).catch(() => []);
    const fetches = fast
      ? [
          settleWithin(apiFetch(`/player/stats?brawlhalla_id=${id}&mode=all`, 5 * 60_000), 1600, null),
          settleWithin(apiFetch(`/player/stats?brawlhalla_id=${id}&mode=ranked_1v1`, 5 * 60_000), 1600, null),
          settleWithin(getLegendMap(), 1600, new Map()),
          Promise.resolve(null),
          Promise.resolve([]),
          localNamesSeedPromise,
          settleWithin(getPlayerGuild(id, 10 * 60_000), 1200, null)
        ]
      : [
          (forceFresh ? apiFetchFresh(`/player/stats?brawlhalla_id=${id}&mode=all`) : apiFetch(`/player/stats?brawlhalla_id=${id}&mode=all`, 60_000)).catch(() => null),
          (forceFresh ? apiFetchFresh(`/player/stats?brawlhalla_id=${id}&mode=ranked_1v1`) : apiFetch(`/player/stats?brawlhalla_id=${id}&mode=ranked_1v1`, 60_000)).catch(() => null),
          getLegendMap().catch(() => new Map()),
          getCorehallaPlayerStats(id, forceFresh).catch(() => null),
          getCorehallaPlayerAliases(id, forceFresh).catch(() => []),
          localNamesSeedPromise,
          getPlayerGuild(id, 10 * 60_000).catch(() => null)
        ];
    const [v1Lifetime, ranked, legendMap, coreStats, coreAliases, localNamesSeed, playerGuild] = await Promise.all(fetches);

    const lifetime = mergeLifetimeStats(v1Lifetime || {}, coreStats);
    const lifetimeByLegend = new Map((lifetime?.legends || []).map((legend) => [Number(legend.legend_id), legend]));
    const rankedLegends = (ranked?.legends || [])
      .filter((legend) => numberOrZero(legend.games) > 0)
      .map((legend) => {
        const staticLegend = legendMap.get(Number(legend.legend_id)) || {};
        const lifeLegend = lifetimeByLegend.get(Number(legend.legend_id)) || {};
        const name = staticLegend.bio_name || staticLegend.legend_name || `Legend ${legend.legend_id}`;
        return {
          ...legend,
          name,
          peak_rating: numberOrNull(legend.best_rating ?? legend.peak_rating),
          image_url: legendImageUrl(name),
          image_candidates: legendImageCandidates(name),
          weapon_one: staticLegend.weapon_one || '—',
          weapon_two: staticLegend.weapon_two || '—',
          level: numberOrNull(lifeLegend.level),
          lifetime_games: numberOrZero(lifeLegend.games),
          lifetime_wins: numberOrZero(lifeLegend.wins),
          win_rate: calculateWinRate(legend.wins, legend.games)
        };
      })
      .sort((a, b) => numberOrZero(b.games) - numberOrZero(a.games));

    const mainLifeLegend = [...(lifetime?.legends || [])]
      .filter((legend) => numberOrZero(legend.games) > 0)
      .sort((a, b) => numberOrZero(b.games) - numberOrZero(a.games))[0];

    const lifetimeTotals = buildLifetimeTotals(lifetime);
    const lifetimeLegends = buildLifetimeLegendStats(lifetime?.legends || [], ranked?.legends || [], legendMap);
    const playerName = sanitizePlayerName(ranked?.name || lifetime?.name || coreStats?.name || localNamesSeed?.[0]?.name || `Player ${id}`);

    const player = {
      brawlhalla_id: id,
      name: playerName,
      level: numberOrNull(lifetime?.level),
      xp_percentage: normalizeXpPercentage(lifetime?.xp_percentage),
      account_xp: numberOrNull(lifetime?.xp),
      game_time_seconds: lifetimeTotals.match_time_seconds,
      game_time_display: lifetimeTotals.match_time_display,
      game_time_estimated: false,
      lifetime_games: numberOrZero(lifetime?.games),
      lifetime_wins: numberOrZero(lifetime?.wins),
      lifetime_win_rate: calculateWinRate(lifetime?.wins, lifetime?.games),
      rating: numberOrNull(ranked?.rating),
      peak_rating: numberOrNull(ranked?.best_rating ?? ranked?.peak_rating),
      tier: ranked?.tier || 'Unranked',
      region: ranked?.region || '—',
      global_rank: numberOrNull(ranked?.global_rank),
      region_ranks: ranked?.region_ranks || [],
      ranked_games: numberOrZero(ranked?.games),
      ranked_wins: numberOrZero(ranked?.wins),
      ranked_win_rate: calculateWinRate(ranked?.wins, ranked?.games),
      main_legend: makeLegendSummary(mainLifeLegend, legendMap.get(Number(mainLifeLegend?.legend_id))),
      top_legends: buildTopLegends(lifetime?.legends || [], legendMap, 3),
      main_weapons: buildMainWeapons(lifetime?.legends || [], legendMap, 3),
      lifetime_totals: lifetimeTotals,
      lifetime_legends: lifetimeLegends,
      legends: rankedLegends,
      guild: playerGuild,
      data_quality: {
        source: coreStats ? 'Fresh Brawlhalla + fresh Corehalla progression (highest XP/level wins)' : (fast ? 'Fast Brawlhalla profile · background refresh pending' : 'Live Brawlhalla stats'),
        corehalla_enriched: Boolean(coreStats),
        live_fetch: !fast,
        fetched_at: new Date().toISOString(),
        account_xp_reported: numberOrNull(lifetime?.xp) !== null,
        account_level_reported: numberOrNull(lifetime?.level) !== null,
        legends_with_level: lifetimeLegends.filter((legend) => legend.level !== null).length,
        legends_with_xp: lifetimeLegends.filter((legend) => legend.xp !== null).length,
        played_legends: lifetimeLegends.filter((legend) => legend.games > 0).length,
        progression_basis: coreStats ? 'Highest current account and legend XP/level reported by Brawlhalla or Corehalla' : 'Brawlhalla-reported account and legend progression',
        game_time_basis: coreStats ? 'Live Brawlhalla match time with Corehalla fallback for missing fields' : 'Sum of Brawlhalla per-legend match_time fields'
      },
      updated_at: new Date().toISOString()
    };

    if (playerGuild?.guild_id) {
      const guildSnapshot = await getGuildStats(playerGuild.guild_id, GUILD_CACHE_TTL_MS).catch(() => null);
      if (guildSnapshot) rememberGuild(guildSnapshot).catch(() => null);
    }
    if (fast) storeObservedNamesBatch([{ id, name: player.name }], 'profile-fast').catch(() => null);
    else await storeObservedNamesBatch([{ id, name: player.name }], 'profile');
    const history = fast ? await readSnapshotHistory(id) : await storeSnapshot(player);
    const localNames = localNamesSeed;
    const knownNames = mergeKnownNameEntries(player.name, coreAliases, localNames);
    const payload = { player, history, known_names: knownNames, background_refresh_recommended: fast };
    const hasMeaningfulProfileData = Boolean(
      v1Lifetime || ranked || coreStats ||
      !isGeneratedPlayerName(player.name) ||
      numberOrZero(player.account_xp) > 0 ||
      numberOrZero(player.lifetime_games) > 0 ||
      numberOrZero(player.rating) > 0
    );
    if (hasMeaningfulProfileData) setCachedProfileResponse(id, payload);

    res.setHeader('X-Stats-Source', coreStats ? 'Brawlhalla-plus-fresh-Corehalla-highest-progression' : (fast ? 'Brawlhalla-fast' : 'Brawlhalla-live'));
    res.setHeader('X-Stats-Fetched-At', player.updated_at);
    res.setHeader('X-Alias-Refresh', fast ? 'background-pending' : 'automatic-fresh');
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = error.name === 'AbortError'
    ? 'Brawlhalla took too long to respond. Try again.'
    : error.message || 'Something went wrong.';
  res.status(status).json({ error: message });
});

function windowlessWarmGuilds() {
  setTimeout(() => refreshTopGuilds().catch((error) => console.warn('Guild discovery warmup failed:', error.message)), 2500);
}

async function startServer() {
  try {
    await cleanAllNameHistory();
  } catch (error) {
    console.warn('Could not clean name history on startup:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`PeakHalla running on http://localhost:${PORT}`);
    windowlessWarmGuilds();
  });
}

startServer();
