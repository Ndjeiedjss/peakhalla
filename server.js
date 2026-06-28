const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const PRIMARY_HOST = 'peakhalla.com';
const LEGACY_HOSTS = new Set([
  'peakhalla-tracker-production.up.railway.app'
]);
const API_BASE = process.env.BRAWLHALLA_API_BASE || 'https://api.brawlhalla.com/v1';
const OFFICIAL_ESPORTS_BASE = 'https://www.brawlhalla.com/rankings/esports';
const OFFICIAL_ESPORTS_NEWS_URL = 'https://www.brawlhalla.com/news/esports';
const COMMUNITY_TOURNAMENTS_URL = 'https://www.brawlhalla.com/news/upcoming-community-tournaments';
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
const PROFILE_RESPONSE_TTL_MS = 30 * 60_000;
const PROFILE_DISK_CACHE_MAX_AGE_MS = 6 * 60 * 60_000;
const PROFILE_DISK_CACHE_LIMIT = 200;
const profileSearchResponseCache = new Map();
const aliasSearchWarmups = new Map();
const PROFILE_SEARCH_RESPONSE_TTL_MS = 2 * 60_000;
const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
const DATABASE_PROFILE_MAX_AGE_MS = Number(process.env.DATABASE_PROFILE_MAX_AGE_MS || 30 * 24 * 60 * 60_000);
const DATABASE_DISCOVERY_INTERVAL_MS = Math.max(45_000, Number(process.env.DATABASE_DISCOVERY_INTERVAL_MS || 60_000));
const DATABASE_DISCOVERY_ENABLED = String(process.env.DATABASE_DISCOVERY_ENABLED || '1') !== '0';
const DATABASE_DISCOVERY_BATCH_SIZE = Math.max(1, Math.min(5, Number(process.env.DATABASE_DISCOVERY_BATCH_SIZE || 2)));
const DATABASE_DISCOVERY_MAX_PAGE = Math.max(20, Math.min(500, Number(process.env.DATABASE_DISCOVERY_MAX_PAGE || 100)));
const DATABASE_DISCOVERY_PAGE_SIZE = Math.max(10, Math.min(50, Number(process.env.DATABASE_DISCOVERY_PAGE_SIZE || 25)));
const DATABASE_DISCOVERY_PRIORITY_EVERY = Math.max(5, Math.min(60, Number(process.env.DATABASE_DISCOVERY_PRIORITY_EVERY || 10)));
let dbPool = null;
let dbReady = false;
let dbLastError = null;
let discoveryTimer = null;
let discoveryRunning = false;
let nameHistorySearchCache = { expiresAt: 0, value: null };

app.disable('x-powered-by');
app.set('etag', 'strong');
app.set('trust proxy', true);


function databaseUsesSsl(connectionString) {
  const mode = String(process.env.PGSSLMODE || '').toLowerCase();
  if (mode === 'disable') return false;
  if (mode === 'require' || mode === 'verify-ca' || mode === 'verify-full') return true;
  return !/\.railway\.internal(?::\d+)?\//i.test(connectionString);
}

async function dbQuery(text, params = []) {
  if (!dbReady || !dbPool) return null;
  try {
    return await dbPool.query(text, params);
  } catch (error) {
    dbLastError = error;
    console.warn('PeakHalla database query failed:', error.message);
    return null;
  }
}

async function initDatabase() {
  if (!DATABASE_URL) {
    console.warn('DATABASE_URL is not set. PeakHalla will continue with JSON storage.');
    return false;
  }

  dbPool = new Pool({
    connectionString: DATABASE_URL,
    max: Math.max(2, Math.min(10, Number(process.env.PGPOOL_MAX || 5))),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
    ssl: databaseUsesSsl(DATABASE_URL) ? { rejectUnauthorized: false } : undefined
  });
  dbPool.on('error', (error) => {
    dbLastError = error;
    console.error('PeakHalla PostgreSQL pool error:', error.message);
  });

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        brawlhalla_id BIGINT PRIMARY KEY,
        current_name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        region TEXT,
        rating INTEGER,
        peak_rating INTEGER,
        tier TEXT,
        global_rank INTEGER,
        account_level INTEGER,
        account_xp BIGINT,
        main_legend JSONB,
        guild JSONB,
        profile_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_fetched TIMESTAMPTZ
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_aliases (
        player_id BIGINT NOT NULL,
        alias TEXT NOT NULL,
        alias_normalized TEXT NOT NULL,
        first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        observations INTEGER NOT NULL DEFAULT 1,
        sources JSONB NOT NULL DEFAULT '[]'::jsonb,
        PRIMARY KEY (player_id, alias_normalized)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS player_snapshots (
        player_id BIGINT NOT NULL,
        snapshot_date DATE NOT NULL,
        name TEXT,
        rating INTEGER,
        peak_rating INTEGER,
        global_rank INTEGER,
        games INTEGER,
        wins INTEGER,
        tier TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (player_id, snapshot_date)
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS peakhalla_state (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS players_normalized_name_idx ON players (normalized_name)');
    await client.query('CREATE INDEX IF NOT EXISTS players_rating_idx ON players (rating DESC NULLS LAST)');
    await client.query('CREATE INDEX IF NOT EXISTS aliases_normalized_idx ON player_aliases (alias_normalized)');
    await client.query('CREATE INDEX IF NOT EXISTS aliases_last_seen_idx ON player_aliases (last_seen DESC)');
    await client.query('CREATE INDEX IF NOT EXISTS snapshots_player_date_idx ON player_snapshots (player_id, snapshot_date DESC)');
    await client.query('COMMIT');
    dbReady = true;
    dbLastError = null;

    // Trigram indexes improve partial-name searches. The rest of the schema works
    // even if the managed PostgreSQL plan does not allow this extension.
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      await client.query('CREATE INDEX IF NOT EXISTS players_name_trgm_idx ON players USING gin (normalized_name gin_trgm_ops)');
      await client.query('CREATE INDEX IF NOT EXISTS aliases_name_trgm_idx ON player_aliases USING gin (alias_normalized gin_trgm_ops)');
    } catch (error) {
      console.warn('PostgreSQL trigram search is unavailable; using standard indexes:', error.message);
    }

    console.log('PeakHalla PostgreSQL database is ready.');
    return true;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => null);
    dbLastError = error;
    dbReady = false;
    console.error('Could not initialize PeakHalla PostgreSQL:', error.message);
    return false;
  } finally {
    client.release();
  }
}

async function getDatabaseState(key, fallback = null) {
  const result = await dbQuery('SELECT value FROM peakhalla_state WHERE key = $1', [key]);
  return result?.rows?.[0]?.value ?? fallback;
}

async function setDatabaseState(key, value) {
  return dbQuery(`
    INSERT INTO peakhalla_state (key, value, updated_at)
    VALUES ($1, $2::jsonb, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `, [key, JSON.stringify(value ?? {})]);
}

async function saveAliasesToDatabase(entries, source = 'profile') {
  if (!dbReady || !entries?.length) return;
  const cleanEntries = entries
    .map((entry) => ({ id: Number(entry.id), name: sanitizePlayerName(entry.name) }))
    .filter((entry) => Number.isSafeInteger(entry.id) && entry.id > 0 && isPlausiblePlayerName(entry.name) && !isGeneratedPlayerName(entry.name));
  if (!cleanEntries.length) return;

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    for (const entry of cleanEntries) {
      const normalized = normalizeName(entry.name);
      await client.query(`
        INSERT INTO player_aliases (player_id, alias, alias_normalized, first_seen, last_seen, observations, sources)
        VALUES ($1, $2, $3, NOW(), NOW(), 1, $4::jsonb)
        ON CONFLICT (player_id, alias_normalized) DO UPDATE SET
          alias = EXCLUDED.alias,
          last_seen = NOW(),
          observations = player_aliases.observations + 1,
          sources = (
            SELECT COALESCE(jsonb_agg(DISTINCT value), '[]'::jsonb)
            FROM jsonb_array_elements(player_aliases.sources || EXCLUDED.sources)
          )
      `, [entry.id, entry.name, normalized, JSON.stringify([source])]);
      await client.query(`
        INSERT INTO players (brawlhalla_id, current_name, normalized_name, first_seen, last_seen)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (brawlhalla_id) DO UPDATE SET
          last_seen = GREATEST(players.last_seen, NOW())
      `, [entry.id, entry.name, normalized]);
    }
    await client.query('COMMIT');
    nameHistorySearchCache = { expiresAt: 0, value: null };
    invalidateProfileSearchCacheForNames(cleanEntries.map((entry) => entry.name));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => null);
    dbLastError = error;
    console.warn('Could not save player aliases to PostgreSQL:', error.message);
  } finally {
    client.release();
  }
}

async function saveProfileToDatabase(playerId, payload) {
  if (!dbReady || !payload?.player) return;
  const player = payload.player;
  const id = Number(playerId || player.brawlhalla_id);
  if (!Number.isSafeInteger(id) || id <= 0) return;
  const name = sanitizePlayerName(player.name || `Player ${id}`);
  const updatedAt = player.updated_at && !Number.isNaN(Date.parse(player.updated_at)) ? player.updated_at : new Date().toISOString();
  await dbQuery(`
    INSERT INTO players (
      brawlhalla_id, current_name, normalized_name, region, rating, peak_rating, tier,
      global_rank, account_level, account_xp, main_legend, guild, profile_payload,
      first_seen, last_seen, last_fetched
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb,
      NOW(), NOW(), $14::timestamptz
    )
    ON CONFLICT (brawlhalla_id) DO UPDATE SET
      current_name = CASE WHEN EXCLUDED.current_name ~* '^Player [0-9]+$' THEN players.current_name ELSE EXCLUDED.current_name END,
      normalized_name = CASE WHEN EXCLUDED.current_name ~* '^Player [0-9]+$' THEN players.normalized_name ELSE EXCLUDED.normalized_name END,
      region = COALESCE(NULLIF(EXCLUDED.region, '—'), players.region),
      rating = COALESCE(EXCLUDED.rating, players.rating),
      peak_rating = GREATEST(COALESCE(players.peak_rating, 0), COALESCE(EXCLUDED.peak_rating, 0)),
      tier = COALESCE(NULLIF(EXCLUDED.tier, 'Unranked'), players.tier, EXCLUDED.tier),
      global_rank = COALESCE(EXCLUDED.global_rank, players.global_rank),
      account_level = GREATEST(COALESCE(players.account_level, 0), COALESCE(EXCLUDED.account_level, 0)),
      account_xp = GREATEST(COALESCE(players.account_xp, 0), COALESCE(EXCLUDED.account_xp, 0)),
      main_legend = COALESCE(EXCLUDED.main_legend, players.main_legend),
      guild = COALESCE(EXCLUDED.guild, players.guild),
      profile_payload = EXCLUDED.profile_payload,
      last_seen = NOW(),
      last_fetched = EXCLUDED.last_fetched
  `, [
    id, name, normalizeName(name), player.region || null, numberOrNull(player.rating),
    numberOrNull(player.peak_rating), player.tier || null, numberOrNull(player.global_rank),
    numberOrNull(player.level), numberOrNull(player.account_xp), JSON.stringify(player.main_legend || null),
    JSON.stringify(player.guild || null), JSON.stringify(payload), updatedAt
  ]);
  await saveAliasesToDatabase([{ id, name }], 'profile-database');
}

async function getDatabaseCachedProfileResponse(playerId, maxAgeMs = DATABASE_PROFILE_MAX_AGE_MS) {
  if (!dbReady) return null;
  const result = await dbQuery(`
    SELECT profile_payload, last_fetched
    FROM players
    WHERE brawlhalla_id = $1 AND profile_payload <> '{}'::jsonb
    LIMIT 1
  `, [Number(playerId)]);
  const row = result?.rows?.[0];
  if (!row?.profile_payload?.player) return null;
  const age = Date.now() - new Date(row.last_fetched || 0).getTime();
  if (Number.isFinite(maxAgeMs) && maxAgeMs > 0 && (!Number.isFinite(age) || age > maxAgeMs)) return null;
  profileResponseCache.set(String(playerId), {
    value: row.profile_payload,
    expiresAt: Date.now() + PROFILE_RESPONSE_TTL_MS
  });
  return row.profile_payload;
}

async function getDatabaseKnownNames(playerId) {
  if (!dbReady) return [];
  const result = await dbQuery(`
    SELECT alias AS name, first_seen, last_seen, observations, sources
    FROM player_aliases
    WHERE player_id = $1
    ORDER BY last_seen DESC
    LIMIT 30
  `, [Number(playerId)]);
  return cleanNameHistoryList((result?.rows || []).map((row) => ({
    name: row.name,
    first_seen: row.first_seen,
    last_seen: row.last_seen,
    observations: Number(row.observations || 1),
    sources: Array.isArray(row.sources) ? row.sources : []
  })));
}

async function findDatabaseAliasMatches(query, limit = 12) {
  if (!dbReady) return [];
  const needle = normalizeName(query);
  if (needle.length < 2) return [];
  const like = `%${needle.replace(/[%_]/g, '\\$&')}%`;
  const result = await dbQuery(`
    SELECT
      a.player_id,
      a.alias,
      a.first_seen,
      a.last_seen,
      a.observations,
      a.sources,
      p.current_name,
      p.rating,
      p.peak_rating,
      p.global_rank,
      p.region,
      p.profile_payload
    FROM player_aliases a
    LEFT JOIN players p ON p.brawlhalla_id = a.player_id
    WHERE a.alias_normalized LIKE $1 ESCAPE '\\'
       OR p.normalized_name LIKE $1 ESCAPE '\\'
    ORDER BY
      CASE WHEN a.alias_normalized = $2 OR p.normalized_name = $2 THEN 0
           WHEN a.alias_normalized LIKE $3 ESCAPE '\\' OR p.normalized_name LIKE $3 ESCAPE '\\' THEN 1
           ELSE 2 END,
      CASE WHEN COALESCE(p.rating, 0) > 0 THEN 0 ELSE 1 END,
      COALESCE(p.rating, 0) DESC,
      a.last_seen DESC
    LIMIT $4
  `, [like, needle, `${needle.replace(/[%_]/g, '\\$&')}%`, Math.max(limit * 4, 24)]);
  const grouped = new Map();
  for (const row of result?.rows || []) {
    const id = Number(row.player_id);
    if (!grouped.has(id)) {
      grouped.set(id, {
        id,
        names: [],
        matched_names: [],
        last_seen: 0,
        profile: row.profile_payload?.player ? row.profile_payload : null,
        rating: Number(row.rating || 0),
        peak_rating: Number(row.peak_rating || 0),
        global_rank: Number(row.global_rank || 0),
        region: row.region || null
      });
    }
    const item = grouped.get(id);
    const entry = {
      name: row.alias,
      first_seen: row.first_seen,
      last_seen: row.last_seen,
      observations: Number(row.observations || 1),
      sources: Array.isArray(row.sources) ? row.sources : []
    };
    item.names.push(entry);
    if (normalizeName(row.alias).includes(needle)) item.matched_names.push(row.alias);
    item.last_seen = Math.max(item.last_seen, new Date(row.last_seen).getTime() || 0);
    if (row.current_name && !item.names.some((name) => normalizeName(name.name) === normalizeName(row.current_name))) {
      item.names.unshift({ name: row.current_name, last_seen: row.last_seen, sources: ['database-current'] });
    }
  }
  return [...grouped.values()]
    .sort((a, b) => {
      const aExact = a.names.some((name) => normalizeName(name.name) === needle) ? 1 : 0;
      const bExact = b.names.some((name) => normalizeName(name.name) === needle) ? 1 : 0;
      return bExact - aExact || Number(b.rating || 0) - Number(a.rating || 0) || b.last_seen - a.last_seen;
    })
    .slice(0, limit);
}

async function saveSnapshotToDatabase(playerId, snapshot) {
  if (!dbReady || !snapshot) return;
  await dbQuery(`
    INSERT INTO player_snapshots (
      player_id, snapshot_date, name, rating, peak_rating, global_rank, games, wins, tier, created_at
    ) VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (player_id, snapshot_date) DO UPDATE SET
      name = EXCLUDED.name,
      rating = EXCLUDED.rating,
      peak_rating = EXCLUDED.peak_rating,
      global_rank = EXCLUDED.global_rank,
      games = EXCLUDED.games,
      wins = EXCLUDED.wins,
      tier = EXCLUDED.tier,
      created_at = NOW()
  `, [
    Number(playerId), snapshot.date, snapshot.name || null, numberOrNull(snapshot.rating),
    numberOrNull(snapshot.peak_rating), numberOrNull(snapshot.global_rank), numberOrNull(snapshot.games),
    numberOrNull(snapshot.wins), snapshot.tier || null
  ]);
}

async function saveDiscoveredRankingsToDatabase(rankings = [], source = 'official-discovery') {
  if (!dbReady || !rankings.length) return;
  const aliases = [];
  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    for (const ranking of rankings) {
      for (const player of ranking.players || []) {
        const id = Number(player.id);
        const name = sanitizePlayerName(player.username || player.name || '');
        if (!Number.isSafeInteger(id) || id <= 0 || !isPlausiblePlayerName(name)) continue;
        aliases.push({ id, name });
        await client.query(`
          INSERT INTO players (
            brawlhalla_id, current_name, normalized_name, region, rating, peak_rating, tier,
            global_rank, main_legend, first_seen, last_seen
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,NOW(),NOW())
          ON CONFLICT (brawlhalla_id) DO UPDATE SET
            current_name = EXCLUDED.current_name,
            normalized_name = EXCLUDED.normalized_name,
            region = COALESCE(EXCLUDED.region, players.region),
            rating = COALESCE(EXCLUDED.rating, players.rating),
            peak_rating = GREATEST(COALESCE(players.peak_rating,0), COALESCE(EXCLUDED.peak_rating,0)),
            tier = COALESCE(EXCLUDED.tier, players.tier),
            global_rank = COALESCE(EXCLUDED.global_rank, players.global_rank),
            main_legend = COALESCE(EXCLUDED.main_legend, players.main_legend),
            last_seen = NOW()
        `, [
          id, name, normalizeName(name), ranking.region || null, numberOrNull(ranking.rating),
          numberOrNull(ranking.best_rating ?? ranking.peak_rating), ranking.tier || null,
          numberOrNull(ranking.rank), JSON.stringify(player.main_legend || null)
        ]);
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => null);
    console.warn('Could not save discovered rankings:', error.message);
  } finally {
    client.release();
  }
  await saveAliasesToDatabase(aliases, source);
}

async function importLegacyJsonIntoDatabase() {
  if (!dbReady) return;
  const imported = await getDatabaseState('legacy_json_import_v1', null);
  if (imported?.completed) return;
  console.log('Importing existing PeakHalla JSON cache into PostgreSQL...');
  const [names, profiles, snapshots] = await Promise.all([
    readJson(NAMES_FILE, {}),
    readJson(PROFILE_CACHE_FILE, {}),
    readJson(SNAPSHOTS_FILE, {})
  ]);

  for (const [id, entries] of Object.entries(names)) {
    const aliasEntries = cleanNameHistoryList(entries).map((entry) => ({ id: Number(id), name: entry.name }));
    await saveAliasesToDatabase(aliasEntries, 'legacy-json');
  }
  for (const [id, entry] of Object.entries(profiles)) {
    if (entry?.value?.player) await saveProfileToDatabase(Number(id), entry.value);
  }
  for (const [id, rows] of Object.entries(snapshots)) {
    for (const row of Array.isArray(rows) ? rows.slice(-120) : []) await saveSnapshotToDatabase(Number(id), row);
  }
  await setDatabaseState('legacy_json_import_v1', {
    completed: true,
    imported_at: new Date().toISOString(),
    names: Object.keys(names).length,
    profiles: Object.keys(profiles).length,
    snapshot_players: Object.keys(snapshots).length
  });
  console.log('Existing PeakHalla cache imported into PostgreSQL.');
}

const DISCOVERY_REGIONS = ['ALL', 'EU', 'US-E', 'US-W', 'BRZ', 'SEA', 'AUS', 'JPS', 'SA', 'ME'];
const DISCOVERY_MODES = ['1v1', '2v2'];

function normalizeDiscoveryCursor(value = {}) {
  return {
    region_index: Math.max(0, Number(value.region_index || 0)) % DISCOVERY_REGIONS.length,
    mode_index: Math.max(0, Number(value.mode_index || 0)) % DISCOVERY_MODES.length,
    page: Math.max(1, Math.min(DATABASE_DISCOVERY_MAX_PAGE, Number(value.page || 1))),
    cycles: Math.max(0, Number(value.cycles || 0)),
    pages_scanned_total: Math.max(0, Number(value.pages_scanned_total || 0)),
    players_seen_total: Math.max(0, Number(value.players_seen_total || 0)),
    new_players_total: Math.max(0, Number(value.new_players_total || 0))
  };
}

function nextDiscoveryCursor(cursor, rankingsLength, reportedTotalPages) {
  let nextPage = Number(cursor.page || 1) + 1;
  let nextRegion = Number(cursor.region_index || 0);
  let nextMode = Number(cursor.mode_index || 0);
  const totalPages = Number(reportedTotalPages || 0);
  const pageLimit = totalPages > 0
    ? Math.max(1, Math.min(DATABASE_DISCOVERY_MAX_PAGE, totalPages))
    : DATABASE_DISCOVERY_MAX_PAGE;

  if (nextPage > pageLimit || rankingsLength < Math.min(5, DATABASE_DISCOVERY_PAGE_SIZE)) {
    nextPage = 1;
    nextRegion += 1;
    if (nextRegion >= DISCOVERY_REGIONS.length) {
      nextRegion = 0;
      nextMode = (nextMode + 1) % DISCOVERY_MODES.length;
    }
  }

  return { ...cursor, region_index: nextRegion, mode_index: nextMode, page: nextPage };
}

async function databasePlayerCount() {
  const result = await dbQuery('SELECT COUNT(*)::int AS count FROM players');
  return Number(result?.rows?.[0]?.count || 0);
}

async function fetchDiscoveryPage(region, mode, page) {
  const params = new URLSearchParams({
    page: String(page),
    max_results: String(DATABASE_DISCOVERY_PAGE_SIZE),
    game_mode: mode,
    region,
    order_by: 'rating'
  });
  return apiFetch(`/leaderboard/ranked?${params}`, 30_000);
}

async function runDatabaseDiscoveryCycle() {
  if (!dbReady || !DATABASE_DISCOVERY_ENABLED || discoveryRunning) return;
  discoveryRunning = true;
  const startedAt = Date.now();
  try {
    const previous = normalizeDiscoveryCursor(await getDatabaseState('official_discovery_cursor_v2', null)
      || await getDatabaseState('official_discovery_cursor_v1', null)
      || {});
    let cursor = { ...previous };
    const beforeCount = await databasePlayerCount();
    const pages = [];
    let playersSeen = 0;

    for (let index = 0; index < DATABASE_DISCOVERY_BATCH_SIZE; index += 1) {
      const region = DISCOVERY_REGIONS[cursor.region_index];
      const mode = DISCOVERY_MODES[cursor.mode_index];
      const page = cursor.page;
      const response = await fetchDiscoveryPage(region, mode, page);
      const rankings = Array.isArray(response?.rankings) ? response.rankings : [];
      const pagePlayers = rankings.reduce((sum, item) => sum + (item.players || []).length, 0);
      if (rankings.length) await saveDiscoveredRankingsToDatabase(rankings, `official-${mode}-${region}`);
      pages.push({ region, mode, page, rows: rankings.length, players: pagePlayers });
      playersSeen += pagePlayers;
      cursor = nextDiscoveryCursor(cursor, rankings.length, response?.total_pages ?? response?.totalPages);
      if (index + 1 < DATABASE_DISCOVERY_BATCH_SIZE) await new Promise((resolve) => setTimeout(resolve, 250));
    }

    const cycleNumber = previous.cycles + 1;
    if (cycleNumber % DATABASE_DISCOVERY_PRIORITY_EVERY === 0) {
      const priority = await fetchDiscoveryPage('ALL', '1v1', 1).catch(() => null);
      const rankings = Array.isArray(priority?.rankings) ? priority.rankings : [];
      if (rankings.length) {
        await saveDiscoveredRankingsToDatabase(rankings, 'official-priority-1v1-ALL');
        const priorityPlayers = rankings.reduce((sum, item) => sum + (item.players || []).length, 0);
        playersSeen += priorityPlayers;
        pages.push({ region: 'ALL', mode: '1v1', page: 1, rows: rankings.length, players: priorityPlayers, priority: true });
      }
    }

    const afterCount = await databasePlayerCount();
    const newPlayers = Math.max(0, afterCount - beforeCount);
    const state = {
      ...cursor,
      cycles: cycleNumber,
      pages_scanned_total: previous.pages_scanned_total + pages.length,
      players_seen_total: previous.players_seen_total + playersSeen,
      new_players_total: previous.new_players_total + newPlayers,
      pages,
      last_cycle_players_seen: playersSeen,
      last_cycle_new_players: newPlayers,
      total_players: afterCount,
      duration_ms: Date.now() - startedAt,
      last_success_at: new Date().toISOString(),
      last_error: null
    };
    await setDatabaseState('official_discovery_cursor_v2', state);
  } catch (error) {
    console.warn('PeakHalla background player discovery failed:', error.message);
    const previous = normalizeDiscoveryCursor(await getDatabaseState('official_discovery_cursor_v2', {}));
    await setDatabaseState('official_discovery_cursor_v2', {
      ...previous,
      last_error: error.message,
      last_error_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt
    }).catch(() => null);
  } finally {
    discoveryRunning = false;
  }
}

function scheduleDatabaseDiscovery() {
  if (!dbReady || !DATABASE_DISCOVERY_ENABLED || discoveryTimer) return;
  discoveryTimer = setTimeout(() => {
    runDatabaseDiscoveryCycle().catch(() => null);
    discoveryTimer = setInterval(() => runDatabaseDiscoveryCycle().catch(() => null), DATABASE_DISCOVERY_INTERVAL_MS);
  }, 5_000);
}

// Permanently move every legacy Railway URL to the public PeakHalla domain.
// This keeps page paths and query strings intact for visitors and search engines.
app.use((req, res, next) => {
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '')
    .split(',')[0]
    .trim()
    .split(':')[0]
    .toLowerCase();

  if (LEGACY_HOSTS.has(forwardedHost)) {
    return res.redirect(308, `https://${PRIMARY_HOST}${req.originalUrl}`);
  }

  next();
});

app.use(express.json({ limit: '8mb' }));
app.use((req, res, next) => {
  const isApi = req.path.startsWith('/api/');
  const isHtml = req.path === '/' || req.path.endsWith('.html') || req.path.startsWith('/player/') || req.path.startsWith('/clan/') || req.path === '/queue' || req.path === '/arena' || req.path.startsWith('/esports/');
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

app.get(['/esports/power', '/esports/tournaments'], (_req, res) => {
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
          'User-Agent': 'PeakHalla/7.49'
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
        'User-Agent': 'PeakHalla/7.49'
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
    const normalizedInput = { ...input };
    // Corehalla's tRPC numericLiteralValidator accepts numeric values as strings only.
    // Sending page/playerId/clanId as numbers makes alias searches fail validation silently.
    for (const key of ['page', 'playerId', 'clanId', 'guildId']) {
      if (normalizedInput[key] !== undefined && normalizedInput[key] !== null && normalizedInput[key] !== '') {
        normalizedInput[key] = String(normalizedInput[key]);
      }
    }
    const cacheBust = forceFresh ? `&_=${Date.now()}` : '';
    const attempts = [
      {
        method: 'GET',
        url: `${COREHALLA_TRPC_BASE}/${encodeURIComponent(procedure)}?input=${encodeURIComponent(JSON.stringify({ json: normalizedInput }))}${cacheBust}`
      },
      {
        method: 'GET',
        url: `${COREHALLA_TRPC_BASE}/${encodeURIComponent(procedure)}?batch=1&input=${encodeURIComponent(JSON.stringify({ 0: { json: normalizedInput } }))}${cacheBust}`
      },
      {
        method: 'POST',
        url: `${COREHALLA_TRPC_BASE}/${encodeURIComponent(procedure)}${forceFresh ? `?_=${Date.now()}` : ''}`,
        body: JSON.stringify({ json: normalizedInput })
      },
      {
        method: 'GET',
        url: `${COREHALLA_TRPC_BASE}/${encodeURIComponent(procedure)}?input=${encodeURIComponent(JSON.stringify(normalizedInput))}${cacheBust}`
      }
    ];
    let lastError = null;
    for (const attempt of attempts) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_500);
      try {
        const response = await fetch(attempt.url, {
          method: attempt.method,
          body: attempt.body,
          headers: {
            Accept: 'application/json',
            ...(attempt.body ? { 'Content-Type': 'application/json' } : {}),
            'Cache-Control': 'no-cache, no-store, max-age=0',
            Pragma: 'no-cache',
            'User-Agent': 'PeakHalla/7.49'
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
          if ([400, 404, 405, 415, 422].includes(response.status)) continue;
          throw error;
        }
        const value = unwrapTrpcPayload(body);
        if (value === null || value === undefined) {
          lastError = new Error('Corehalla returned an empty response.');
          continue;
        }
        cache.set(key, { value, expiresAt: Date.now() + ttlMs });
        return value;
      } catch (error) {
        lastError = error;
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

function profileSearchCacheKey(kind, query, region = 'ALL', mode = '1v1') {
  return `${kind}:${normalizeName(query)}:${String(region).toUpperCase()}:${mode}`;
}

function invalidateProfileSearchCacheForNames(names = []) {
  const needles = [...new Set((Array.isArray(names) ? names : [names])
    .map((name) => normalizeName(name))
    .filter((name) => name.length >= 2))];
  if (!needles.length) return;
  for (const key of profileSearchResponseCache.keys()) {
    if (needles.some((needle) => key.includes(`:${needle}:`))) profileSearchResponseCache.delete(key);
  }
}

function getCachedProfileSearch(kind, query, region = 'ALL', mode = '1v1') {
  const key = profileSearchCacheKey(kind, query, region, mode);
  const cached = profileSearchResponseCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    profileSearchResponseCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedProfileSearch(kind, query, region, mode, value) {
  const key = profileSearchCacheKey(kind, query, region, mode);
  const resultCount = (value?.rankings || []).reduce((sum, item) => sum + (item?.players?.length || 0), 0);
  // Never cache an empty player search. A profile may be indexed seconds later
  // after somebody opens it by BH ID, and stale empty results made it look lost.
  if (resultCount <= 0) {
    profileSearchResponseCache.delete(key);
    return value;
  }
  const ttl = PROFILE_SEARCH_RESPONSE_TTL_MS;
  profileSearchResponseCache.set(key, { value, expiresAt: Date.now() + ttl });
  if (profileSearchResponseCache.size > 250) {
    const oldest = profileSearchResponseCache.keys().next().value;
    if (oldest) profileSearchResponseCache.delete(oldest);
  }
  return value;
}

function hasExactAliasMatch(matches, query) {
  const needle = normalizeName(query);
  return (matches || []).some((item) => (item.names || []).some((name) => normalizeName(name?.name) === needle));
}

function warmAliasSearchInBackground(query) {
  const key = normalizeName(query);
  if (key.length < 2 || aliasSearchWarmups.has(key)) return;
  const job = (async () => {
    const matches = await searchCorehallaAliasesBroad(query, 5, false).catch(() => []);
    if (matches.length) await rememberCorehallaAliasMatches(matches).catch(() => null);
    return matches;
  })().finally(() => aliasSearchWarmups.delete(key));
  aliasSearchWarmups.set(key, job);
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
  saveProfileToDatabase(playerId, value).catch(() => null);
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
  const [databaseNames, all] = await Promise.all([
    getDatabaseKnownNames(playerId).catch(() => []),
    readJson(NAMES_FILE, {})
  ]);
  return cleanNameHistoryList([...(databaseNames || []), ...(all[String(playerId)] || [])]);
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
  const payload = await corehallaFetch(
    'searchPlayerAlias',
    { alias: String(alias).trim(), page: Number(page) || 1 },
    3 * 60_000,
    forceFresh
  ).catch(() => null);
  const rows = corehallaRows(payload);
  if (!rows.length) return [];
  return rows.map((item) => {
    const id = Number(item?.playerId ?? item?.player_id ?? item?.brawlhallaId ?? item?.brawlhalla_id ?? item?.id);
    const rawAliases = [
      item?.mainAlias, item?.main_alias, item?.name, item?.alias,
      ...(Array.isArray(item?.otherAliases) ? item.otherAliases : []),
      ...(Array.isArray(item?.other_aliases) ? item.other_aliases : []),
      ...(Array.isArray(item?.aliases) ? item.aliases : [])
    ];
    const aliases = [...new Set(rawAliases.map(cleanAliasForSearch).filter(Boolean))];
    const name = cleanAliasForSearch(item?.mainAlias ?? item?.main_alias ?? item?.name ?? item?.alias)
      || aliases[0] || `Player ${id}`;
    return { id, name, aliases };
  }).filter((item) => Number.isSafeInteger(item.id) && item.id > 0 && item.aliases.length > 0);
}

async function searchCorehallaAliasesBroad(alias, maxPages = 8, forceFresh = false) {
  const needle = normalizeName(alias);
  let firstPage = await searchCorehallaAliases(alias, 1, false).catch(() => []);
  if (!firstPage.length && forceFresh) firstPage = await searchCorehallaAliases(alias, 1, true).catch(() => []);

  const hasStrongMatch = firstPage.some((item) =>
    normalizeName(item.name) === needle || (item.aliases || []).some((name) => normalizeName(name) === needle)
  );
  const extraPages = hasStrongMatch ? [] : Array.from({ length: Math.max(0, Math.min(maxPages, 10) - 1) }, (_, index) => index + 2);
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

async function rememberCorehallaAliasMatches(matches = []) {
  const entries = [];
  for (const match of matches) {
    const id = Number(match?.id);
    if (!Number.isSafeInteger(id) || id <= 0) continue;
    for (const name of [match?.name, ...(match?.aliases || [])]) entries.push({ id, name });
  }
  if (entries.length) await storeObservedNamesBatch(entries, 'corehalla-alias-search').catch(() => null);
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

async function getOfficialEsportsRankings(region, mode, page = 1) {
  const safePage = Math.max(1, Math.min(100, Number(page) || 1));
  const url = `${OFFICIAL_ESPORTS_BASE}/${encodeURIComponent(region)}/${encodeURIComponent(mode)}/${safePage}?sortBy=powerRanking`;
  const html = await htmlFetch(url);
  const pageText = htmlText(html);
  const updatedMatch = pageText.match(/Last updated:\s*(\d{4}-\d{2}-\d{2})/i);
  return {
    page: safePage,
    rankings: parseOfficialPowerRankings(html),
    updated_at: updatedMatch?.[1] || null,
    source_url: url
  };
}

async function getOfficialEsportsWindow(region, mode, page = 1, pageSize = 20) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Math.min(25, Number(pageSize) || 20));
  const start = (safePage - 1) * safeSize;
  const end = start + safeSize;
  const upstreamSize = 25;
  const firstUpstreamPage = Math.floor(start / upstreamSize) + 1;
  const lastUpstreamPage = Math.floor((end - 1) / upstreamSize) + 1;
  const pages = await mapWithConcurrency(
    Array.from({ length: lastUpstreamPage - firstUpstreamPage + 1 }, (_, index) => firstUpstreamPage + index),
    2,
    (upstreamPage) => getOfficialEsportsRankings(region, mode, upstreamPage).catch(() => ({ page: upstreamPage, rankings: [] }))
  );
  const combined = pages.flatMap((item) => item.rankings || []);
  const relativeStart = start - ((firstUpstreamPage - 1) * upstreamSize);
  const rankings = combined.slice(relativeStart, relativeStart + safeSize);
  const lastFetched = pages[pages.length - 1];
  return {
    rankings,
    updated_at: pages.find((item) => item.updated_at)?.updated_at || null,
    source_url: pages[0]?.source_url || `${OFFICIAL_ESPORTS_BASE}/${region}/${mode}/1?sortBy=powerRanking`,
    page: safePage,
    page_size: safeSize,
    has_more: rankings.length === safeSize && Number(lastFetched?.rankings?.length || 0) >= upstreamSize
  };
}

async function searchOfficialEsportsRankings(region, mode, query, maxPages = 12) {
  const needle = normalizeName(query);
  const pages = [];
  for (let start = 1; start <= maxPages; start += 3) {
    const batchNumbers = Array.from({ length: Math.min(3, maxPages - start + 1) }, (_, index) => start + index);
    const batch = await mapWithConcurrency(batchNumbers, 3, (page) =>
      getOfficialEsportsRankings(region, mode, page).catch(() => ({ page, rankings: [] }))
    );
    pages.push(...batch);
    if (batch.some((item) => (item.rankings || []).length < 25)) break;
  }
  const rankings = pages.flatMap((item) => item.rankings || [])
    .filter((item) => normalizeName(item.name).includes(needle))
    .sort((a, b) => {
      const aName = normalizeName(a.name);
      const bName = normalizeName(b.name);
      const aTier = aName === needle ? 0 : aName.startsWith(needle) ? 1 : 2;
      const bTier = bName === needle ? 0 : bName.startsWith(needle) ? 1 : 2;
      return aTier - bTier || Number(a.rank || Infinity) - Number(b.rank || Infinity);
    });
  return {
    rankings: rankings.slice(0, 20),
    updated_at: pages.find((item) => item.updated_at)?.updated_at || null,
    source_url: pages[0]?.source_url || `${OFFICIAL_ESPORTS_BASE}/${region}/${mode}/1?sortBy=powerRanking`,
    page: 1,
    page_size: 20,
    has_more: false,
    searched_pages: pages.length
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
  const version = '7.46.0';
  // User-supplied local portraits are the fastest and most consistent source.
  // The API proxy remains a fallback for future legends not yet in the pack.
  return [
    `/assets/legends/${encodeURIComponent(slug)}.webp?v=${version}`,
    `/assets/legends/${encodeURIComponent(slug)}.png?v=${version}`,
    `/assets/legends/${encodeURIComponent(slug)}.jpg?v=${version}`,
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
          'User-Agent': 'PeakHalla/7.49',
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
        'User-Agent': 'PeakHalla/7.49'
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

  // Corehalla uses `rank` as the clan tier on a clan profile, while ranking
  // rows use it as the leaderboard position. Keep those two concepts separate.
  const rankingRow = Boolean(guild.__ranking_row);
  const rawRank = Number(guild.rank ?? 0) || null;
  const explicitRankValue = guild.xp_rank ?? guild.leaderboard_rank ?? guild.position ?? (rankingRow ? rawRank : null);
  const xpRank = Number(explicitRankValue) || null;
  const rankVerified = Number.isFinite(Number(explicitRankValue)) && Number(explicitRankValue) > 0;
  const tier = Number(
    guild.tier ?? guild.clan_tier ?? guild.guild_tier ?? (!rankingRow ? rawRank : 0)
  ) || null;
  const memberCapacity = Number(
    guild.member_capacity ?? guild.max_members ?? guild.member_limit ?? guild.capacity ?? 200
  ) || 200;

  return {
    guild_id: id,
    name: sanitizePlayerName(guild.name ?? guild.guild_name ?? guild.clan_name ?? `Clan ${id}`),
    create_date: Number(guild.create_date ?? guild.clan_create_date ?? guild.created ?? guild.created_at ?? 0) || null,
    xp: Number(guild.xp ?? guild.clan_xp ?? guild.lifetime_xp ?? 0),
    legacy_xp: Number(guild.legacy_xp || 0),
    notice: String(guild.notice || guild.description || '').trim().slice(0, 240),
    tags: Array.isArray(guild.tags) ? guild.tags.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8) : [],
    discord_invite_code: String(guild.discord_invite_code || '').trim() || null,
    guild_points: Number(guild.guild_points ?? guild.points ?? guild.weekly_points ?? 0),
    rank: xpRank,
    rank_verified: rankVerified,
    tier,
    is_recruiting: Boolean(guild.is_recruiting),
    member_count: Number(guild.member_count ?? guild.members_count ?? guild.clan?.length ?? guild.members?.length ?? 0) || null,
    member_capacity: memberCapacity,
    source: guild.source || null,
    updated_at: new Date().toISOString()
  };
}

function maxPositiveNumber(...values) {
  const numbers = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  return numbers.length ? Math.max(...numbers) : 0;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function sumGuildMemberXp(members = []) {
  return (Array.isArray(members) ? members : []).reduce((total, member) => {
    const xp = Number(member?.xp);
    return total + (Number.isFinite(xp) && xp > 0 ? xp : 0);
  }, 0);
}

function resolveGuildSnapshots(cachedGuild, officialGuild, liveGuild) {
  const merged = mergeGuilds(cachedGuild, liveGuild, officialGuild);
  if (!merged) return null;

  // Lifetime XP and guild tier are monotonic. A slower third-party snapshot
  // must never overwrite a newer official value with a smaller number.
  merged.xp = maxPositiveNumber(cachedGuild?.xp, liveGuild?.xp, officialGuild?.xp);
  merged.tier = maxPositiveNumber(cachedGuild?.tier, liveGuild?.tier, officialGuild?.tier) || null;

  // Prefer the official service for fields that can reset or change, then use
  // the live clan snapshot and disk cache only as fallbacks.
  merged.guild_points = firstFiniteNumber(officialGuild?.guild_points, liveGuild?.guild_points, cachedGuild?.guild_points);
  merged.member_capacity = maxPositiveNumber(officialGuild?.member_capacity, liveGuild?.member_capacity, cachedGuild?.member_capacity, 200);
  merged.create_date = Number(officialGuild?.create_date || liveGuild?.create_date || cachedGuild?.create_date || 0) || null;

  const verifiedRank = [officialGuild, liveGuild, cachedGuild].find((guild) =>
    guild?.rank_verified && Number(guild?.rank) > 0
  );
  merged.rank = verifiedRank ? Number(verifiedRank.rank) : null;
  merged.rank_verified = Boolean(verifiedRank);
  return merged;
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

  // Some upstream guild endpoints can return historical duplicate rows. Keep
  // only the freshest/best row for each Brawlhalla ID before counting members.
  const unique = new Map();
  for (const member of members) {
    const key = Number(member.brawlhalla_id);
    const previous = unique.get(key);
    if (!previous
      || Number(member.join_date || 0) > Number(previous.join_date || 0)
      || Number(member.xp || 0) > Number(previous.xp || 0)) {
      unique.set(key, member);
    }
  }
  return enforceGuildRoleIntegrity([...unique.values()]);
}

function mergeCurrentGuildRoster(currentMembers = [], officialMembers = []) {
  const officialById = new Map((officialMembers || []).map((member) => [Number(member.brawlhalla_id), member]));
  return enforceGuildRoleIntegrity((currentMembers || []).map((current) => {
    const official = officialById.get(Number(current.brawlhalla_id));
    if (!official) return { ...current };
    return {
      ...official,
      ...current,
      // Current snapshot decides membership and role. Official rows only fill
      // fields that are frequently missing from the live roster response.
      rank: current.rank || official.rank,
      name: current.name || official.name,
      join_date: current.join_date || official.join_date || null,
      xp: maxPositiveNumber(current.xp, official.xp),
      guild_points: Number.isFinite(Number(official.guild_points))
        ? Number(official.guild_points)
        : Number(current.guild_points || 0)
    };
  }));
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

  const guilds = all.map((row) => normalizeGuildStats({ ...row, source: 'corehalla', __ranking_row: true })).filter(Boolean);
  const unique = [...new Map(guilds.map((guild) => [guild.guild_id, guild])).values()]
    .sort((a, b) => Number(b.xp || 0) - Number(a.xp || 0) || a.name.localeCompare(b.name));
  const isGlobalBoard = !String(name || '').trim();
  return unique.map((guild, index) => {
    const upstreamRank = guild.rank_verified && Number(guild.rank) > 0 ? Number(guild.rank) : null;
    const boardRank = isGlobalBoard ? index + 1 : null;
    return {
      ...guild,
      rank: upstreamRank || boardRank,
      rank_verified: Boolean(upstreamRank || boardRank)
    };
  });
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
    if (guild) return {
      guild: {
        ...guild,
        member_count: members.length || guild.member_count,
        member_capacity: guild.member_capacity || 200
      },
      members
    };
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
      const key = String(guild.guild_id);
      const previous = data.guilds[key] || {};
      const merged = mergeGuilds(previous, guild) || { ...previous, ...guild };
      merged.xp = maxPositiveNumber(previous.xp, guild.xp);
      merged.tier = maxPositiveNumber(previous.tier, guild.tier) || null;

      const verifiedRank = guild.rank_verified && Number(guild.rank) > 0
        ? guild
        : (previous.rank_verified && Number(previous.rank) > 0 ? previous : null);
      merged.rank = verifiedRank ? Number(verifiedRank.rank) : null;
      merged.rank_verified = Boolean(verifiedRank);
      data.guilds[key] = { ...merged, updated_at: now };
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
    const [officialLifetime, coreStats, legendMap] = await Promise.all([
      apiFetch(`/player/stats?brawlhalla_id=${playerId}&mode=all`, 10 * 60_000).catch(() => null),
      getCorehallaPlayerStats(playerId, false).catch(() => null),
      getLegendMap().catch(() => new Map())
    ]);
    const lifetime = mergeLifetimeStats(officialLifetime || {}, coreStats);
    const mainStats = [...(lifetime?.legends || [])]
      .filter((legend) => Number(legend.games) > 0 || Number(legend.xp) > 0 || Number(legend.level) > 1)
      .sort((a, b) =>
        Number(b.games || 0) - Number(a.games || 0) ||
        Number(b.xp || 0) - Number(a.xp || 0) ||
        Number(b.level || 0) - Number(a.level || 0)
      )[0];
    const summary = makeLegendSummary(mainStats, legendMap.get(Number(mainStats?.legend_id)));
    cache.set(cacheKey, { value: summary || null, expiresAt: now + (summary ? 10 * 60_000 : 60_000) });
    return summary || null;
  } catch {
    return null;
  }
}

async function storeSnapshot(player) {
  const snapshot = {
    date: new Date().toISOString().slice(0, 10),
    name: player.name,
    rating: player.rating ?? null,
    peak_rating: player.peak_rating ?? null,
    global_rank: player.global_rank ?? null,
    games: player.ranked_games ?? null,
    wins: player.ranked_wins ?? null,
    tier: player.tier ?? null
  };
  saveSnapshotToDatabase(player.brawlhalla_id, snapshot).catch(() => null);
  return updateJson(SNAPSHOTS_FILE, {}, (all) => {
    const key = String(player.brawlhalla_id);
    const list = Array.isArray(all[key]) ? all[key] : [];
    const today = snapshot.date;
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

  const result = await updateJson(NAMES_FILE, {}, (all) => {
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
  saveAliasesToDatabase(cleanEntries, source).catch(() => null);
  nameHistorySearchCache = { expiresAt: 0, value: null };
  return result;
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
  const [snapshots, databaseNames] = await Promise.all([
    snapshotNameEntries(playerId),
    getDatabaseKnownNames(playerId).catch(() => [])
  ]);
  return updateJson(NAMES_FILE, {}, (all) => {
    const merged = [...cleanNameHistoryList(all[key]), ...databaseNames, ...snapshots];
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
  const databaseMatches = await findDatabaseAliasMatches(query, limit).catch(() => []);
  if (!nameHistorySearchCache.value || nameHistorySearchCache.expiresAt <= Date.now()) {
    nameHistorySearchCache = {
      value: await readJson(NAMES_FILE, {}),
      expiresAt: Date.now() + 10_000
    };
  }
  const all = nameHistorySearchCache.value || {};
  const fileMatches = [];

  for (const [id, names] of Object.entries(all)) {
    const cleanNames = cleanNameHistoryList(names);
    if (!cleanNames.length) continue;
    const matchedNames = cleanNames.filter((item) => normalizeName(item.name).includes(needle));
    if (!matchedNames.length) continue;
    fileMatches.push({
      id: Number(id),
      names: cleanNames,
      matched_names: matchedNames.map((item) => item.name),
      last_seen: Math.max(...matchedNames.map((item) => new Date(item.last_seen).getTime() || 0))
    });
  }

  const merged = new Map();
  for (const item of [...databaseMatches, ...fileMatches]) {
    const id = Number(item.id);
    const current = merged.get(id);
    if (!current) {
      merged.set(id, { ...item, names: cleanNameHistoryList(item.names), matched_names: [...new Set(item.matched_names || [])] });
      continue;
    }
    current.names = cleanNameHistoryList([...(current.names || []), ...(item.names || [])]);
    current.matched_names = [...new Set([...(current.matched_names || []), ...(item.matched_names || [])])];
    current.last_seen = Math.max(Number(current.last_seen || 0), Number(item.last_seen || 0));
    current.profile ||= item.profile || null;
    current.rating = Math.max(Number(current.rating || 0), Number(item.rating || 0));
  }

  return [...merged.values()]
    .sort((a, b) => {
      const aExact = (a.names || []).some((item) => normalizeName(item.name) === needle) ? 1 : 0;
      const bExact = (b.names || []).some((item) => normalizeName(item.name) === needle) ? 1 : 0;
      return bExact - aExact || Number(b.rating || 0) - Number(a.rating || 0) || b.last_seen - a.last_seen;
    })
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
    const timeoutMs = Number(options.legendTimeoutMs || 900);
    const concurrency = Number(options.legendConcurrency || 8);
    const legendPairs = await mapWithConcurrency(uniqueIds, concurrency, async (id) => [
      id,
      await settleWithin(getMainLegendSummary(id), timeoutMs, null)
    ]);
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


function compactAliasKey(value) {
  return sanitizePlayerName(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
}

function aliasScore(name, query) {
  const candidate = normalizeName(name);
  const needle = normalizeName(query);
  const compactCandidate = compactAliasKey(name);
  const compactNeedle = compactAliasKey(query);
  if (candidate === needle || (compactNeedle && compactCandidate === compactNeedle)) return 1000;
  if (candidate.startsWith(needle) || (compactNeedle && compactCandidate.startsWith(compactNeedle))) {
    return 850 - Math.max(0, compactCandidate.length - compactNeedle.length);
  }
  if (candidate.includes(needle) || (compactNeedle && compactCandidate.includes(compactNeedle))) {
    return 700 - Math.max(0, compactCandidate.indexOf(compactNeedle));
  }
  return 0;
}

function searchRankingScore(ranking, query) {
  const needle = normalizeName(query);
  let best = Number(ranking?.search_score || 0);
  for (const player of ranking?.players || []) {
    const current = normalizeName(player?.username);
    if (current === needle || compactAliasKey(player?.username) === compactAliasKey(query)) best = Math.max(best, 1800);
    else best = Math.max(best, aliasScore(player?.username, query));
    for (const alias of player?.matched_aliases || []) {
      const normalizedAlias = normalizeName(alias);
      if (normalizedAlias === needle || compactAliasKey(alias) === compactAliasKey(query)) best = Math.max(best, 2200);
      else best = Math.max(best, 1200 + aliasScore(alias, query));
    }
  }
  return best;
}

function searchMatchTier(ranking, query) {
  const needle = normalizeName(query);
  const compactNeedle = compactAliasKey(query);
  let tier = 0;
  for (const player of ranking?.players || []) {
    const names = [
      player?.username,
      ...(player?.matched_aliases || []),
      ...(player?.known_names || []).map((item) => typeof item === 'string' ? item : item?.name)
    ];
    for (const rawName of names) {
      const name = normalizeName(rawName);
      const compactName = compactAliasKey(rawName);
      if (!name) continue;
      if (name === needle || (compactNeedle && compactName === compactNeedle)) tier = Math.max(tier, 3);
      else if (name.startsWith(needle) || (compactNeedle && compactName.startsWith(compactNeedle))) tier = Math.max(tier, 2);
      else if (name.includes(needle) || (compactNeedle && compactName.includes(compactNeedle))) tier = Math.max(tier, 1);
    }
  }
  return tier;
}

function sortSearchRankings(rankings, query) {
  return [...rankings].sort((a, b) => {
    const aRating = numberOrZero(a?.rating);
    const bRating = numberOrZero(b?.rating);
    const aRanked = aRating > 0 ? 1 : 0;
    const bRanked = bRating > 0 ? 1 : 0;
    const aRank = Number(a?.rank) > 0 ? Number(a.rank) : Number.POSITIVE_INFINITY;
    const bRank = Number(b?.rank) > 0 ? Number(b.rank) : Number.POSITIVE_INFINITY;
    return searchMatchTier(b, query) - searchMatchTier(a, query) ||
      bRanked - aRanked ||
      bRating - aRating ||
      numberOrZero(b?.best_rating ?? b?.peak_rating) - numberOrZero(a?.best_rating ?? a?.peak_rating) ||
      aRank - bRank ||
      searchRankingScore(b, query) - searchRankingScore(a, query);
  });
}

function candidateSearchScore(candidate, query) {
  const aliases = candidate?.aliases || candidate?.names || [];
  return Math.max(
    aliasScore(candidate?.name || '', query),
    ...aliases.map((item) => aliasScore(typeof item === 'string' ? item : item?.name, query)),
    0
  );
}

function rankingPositionForRegion(rankedSource = {}, requestedRegion = 'ALL') {
  const region = String(requestedRegion || 'ALL').toUpperCase();
  if (region === 'ALL') return numberOrNull(rankedSource?.global_rank ?? rankedSource?.rank);
  const regional = Array.isArray(rankedSource?.region_ranks)
    ? rankedSource.region_ranks.find((item) => String(item?.region || '').toUpperCase() === region)
    : null;
  if (regional) return numberOrNull(regional.rank ?? regional.position);
  const playerRegion = String(rankedSource?.region || '').toUpperCase();
  if (playerRegion === region) return numberOrNull(rankedSource?.region_rank ?? rankedSource?.rank);
  return null;
}

async function buildProfileSearchRanking(candidate, query, options = {}) {
  try {
    const id = Number(candidate?.id);
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    const knownAliases = [...new Set((candidate.aliases || candidate.names || [])
      .map((item) => cleanAliasForSearch(typeof item === 'string' ? item : item?.name))
      .filter(Boolean))];
    const quick = Boolean(options.quick);
    const requestedRegion = allowed(String(options.region || 'ALL').toUpperCase(),
      ['ALL', 'US-E', 'EU', 'SEA', 'BRZ', 'AUS', 'US-W', 'JPS', 'SA', 'ME'], 'ALL');
    const databasePayload = await getDatabaseCachedProfileResponse(id, 0).catch(() => null);
    const cachedPlayer = getCachedProfileResponse(id)?.player || databasePayload?.player || candidate?.profile?.player || null;
    let lifetime = null;
    let ranked = null;
    let legendMap = new Map();

    if (quick && cachedPlayer && !isGeneratedPlayerName(cachedPlayer.name)) {
      const currentName = cleanAliasForSearch(cachedPlayer.name || candidate.name || knownAliases[0]) || `Player ${id}`;
      const matchedAliases = knownAliases.filter((name) => normalizeName(name).includes(normalizeName(query)));
      const scopedRank = rankingPositionForRegion(cachedPlayer, requestedRegion);
      if (requestedRegion === 'ALL' || Number(scopedRank) > 0) {
        const games = numberOrZero(cachedPlayer.ranked_games ?? cachedPlayer.games);
        const wins = numberOrZero(cachedPlayer.ranked_wins ?? cachedPlayer.wins);
        return {
          rank: scopedRank,
          region: requestedRegion === 'ALL' ? (cachedPlayer.region || '—') : requestedRegion,
          rating: numberOrNull(cachedPlayer.rating),
          best_rating: numberOrNull(cachedPlayer.peak_rating ?? cachedPlayer.best_rating),
          tier: cachedPlayer.tier || 'Unranked',
          wins,
          losses: Math.max(0, games - wins),
          games,
          profile_only: !(numberOrZero(cachedPlayer.rating) > 0),
          search_score: Math.max(aliasScore(currentName, query), ...knownAliases.map((name) => aliasScore(name, query)), 0),
          players: [{
            id,
            username: currentName,
            main_legend: cachedPlayer.main_legend || null,
            matched_aliases: matchedAliases,
            known_names: knownAliases.map((name) => ({ name }))
          }],
          database_cached: true
        };
      }
    }

    if (quick) {
      [lifetime, ranked, legendMap] = await Promise.all([
        settleWithin(
          apiFetch(`/player/stats?brawlhalla_id=${id}&mode=all`, 5 * 60_000),
          Number(options.lifetimeTimeoutMs || 1450),
          null
        ),
        settleWithin(
          apiFetch(`/player/stats?brawlhalla_id=${id}&mode=ranked_1v1`, 90_000),
          Number(options.rankTimeoutMs || 1450),
          null
        ),
        settleWithin(getLegendMap(), Number(options.legendMapTimeoutMs || 1000), new Map())
      ]);
    } else {
      [lifetime, ranked, legendMap] = await Promise.all([
        apiFetch(`/player/stats?brawlhalla_id=${id}&mode=all`, 5 * 60_000).catch(() => null),
        apiFetch(`/player/stats?brawlhalla_id=${id}&mode=ranked_1v1`, 90_000).catch(() => null),
        getLegendMap().catch(() => new Map())
      ]);
    }

    const rankedSource = ranked || cachedPlayer || {};
    const currentName = cleanAliasForSearch(ranked?.name || lifetime?.name || cachedPlayer?.name || candidate.name || knownAliases[0]) || `Player ${id}`;
    const mainStats = [...(lifetime?.legends || [])]
      .filter((legend) => numberOrZero(legend.games) > 0 || numberOrZero(legend.xp) > 0 || numberOrZero(legend.level) > 1)
      .sort((a, b) =>
        numberOrZero(b.games) - numberOrZero(a.games) ||
        numberOrZero(b.xp) - numberOrZero(a.xp) ||
        numberOrZero(b.level) - numberOrZero(a.level)
      )[0];
    const quickLifetimeLegend = makeLegendSummary(mainStats, legendMap.get(Number(mainStats?.legend_id)));
    const quickMainLegend = cachedPlayer?.main_legend || quickLifetimeLegend || (quick
      ? await settleWithin(getMainLegendSummary(id), Number(options.legendTimeoutMs || 1300), null)
      : null);
    const matchedAliases = knownAliases.filter((name) => normalizeName(name).includes(normalizeName(query)));
    const rating = numberOrNull(rankedSource?.rating);
    const bestRating = numberOrNull(rankedSource?.best_rating ?? rankedSource?.peak_rating);
    const wins = numberOrZero(rankedSource?.wins ?? rankedSource?.ranked_wins);
    const games = numberOrZero(rankedSource?.games ?? rankedSource?.ranked_games);
    const scopedRank = rankingPositionForRegion(rankedSource, requestedRegion);
    if (requestedRegion !== 'ALL' && !(Number(scopedRank) > 0)) return null;
    return {
      rank: scopedRank,
      region: requestedRegion === 'ALL' ? (rankedSource?.region || '—') : requestedRegion,
      rating,
      best_rating: bestRating,
      tier: rankedSource?.tier || 'Unranked',
      wins,
      losses: Math.max(0, games - wins),
      games,
      profile_only: !(rating > 0),
      search_score: Math.max(aliasScore(currentName, query), ...knownAliases.map((name) => aliasScore(name, query)), 0),
      players: [{
        id,
        username: currentName,
        main_legend: quickMainLegend || null,
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
  res.json({ ok: true, service: 'PeakHalla', version: '7.46.0' });
});

app.get('/api/suggestions', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 40);
    if (query.length < 2) return res.status(400).json({ error: 'Type at least 2 letters.' });
    const region = allowed(String(req.query.region || 'ALL').toUpperCase(),
      ['ALL', 'US-E', 'EU', 'SEA', 'BRZ', 'AUS', 'US-W', 'JPS', 'SA', 'ME'], 'ALL');
    const mode = allowed(String(req.query.mode || '1v1'), ['1v1', '2v2', '3v3'], '1v1');
    const cached = getCachedProfileSearch('suggestions', query, region, mode);
    if (cached) return res.json({ ...cached, cached: true });

    const numericId = query.replace(/^#/, '');
    const isNumeric = /^\d+$/.test(numericId);
    const localMatches = isNumeric ? [] : await findAliasMatches(query, 12).catch(() => []);
    const exactLocal = hasExactAliasMatch(localMatches, query);

    async function fetchOfficial() {
      const params = new URLSearchParams({
        page: '1', max_results: '12', game_mode: mode, region, search: query, order_by: 'rating'
      });
      return apiFetch(`/leaderboard/ranked?${params}`, 30_000).catch(() => ({ rankings: [] }));
    }

    // Local old-name hits return first. A deeper Corehalla lookup continues in
    // the background so the next keystroke or search is instant.
    if (exactLocal) {
      warmAliasSearchInBackground(query);
      const candidates = localMatches.slice(0, 7).map((item) => ({
        id: item.id,
        name: item.names?.[0]?.name,
        aliases: item.names?.map((name) => name.name) || []
      }));
      const profiles = (await mapWithConcurrency(candidates, 7, (item) =>
        buildProfileSearchRanking(item, query, { quick: true, mode, region, rankTimeoutMs: 750, legendTimeoutMs: 650 })
      )).filter(Boolean);
      const payload = { rankings: sortSearchRankings(profiles, query).slice(0, 7), local_alias_hit: true };
      return res.json(setCachedProfileSearch('suggestions', query, region, mode, payload));
    }

    const officialPromise = isNumeric ? Promise.resolve({ rankings: [] }) : fetchOfficial();
    const corePromise = isNumeric ? Promise.resolve([]) : searchCorehallaAliasesBroad(query, 4, false).catch(() => []);
    const esportsPromise = isNumeric ? Promise.resolve(null) : findEsportsPlayerByName(query, '').catch(() => null);
    let [official, coreMatches, esportsMatch] = await Promise.all([
      settleWithin(officialPromise, 1200, null),
      settleWithin(corePromise, 3200, []),
      settleWithin(esportsPromise, 1000, null)
    ]);
    if (!official && !coreMatches.length && !localMatches.length && !esportsMatch) {
      official = await settleWithin(officialPromise, 2200, { rankings: [] });
      coreMatches = await settleWithin(corePromise, 500, []);
    }
    official ||= { rankings: [] };
    warmAliasSearchInBackground(query);
    if (coreMatches.length) await rememberCorehallaAliasMatches(coreMatches).catch(() => null);

    const rankings = await hydrateRankingPlayers(official?.rankings || [], 'suggestion', { includeLegends: true, legendTimeoutMs: 650, legendConcurrency: 10 });
    const existingIds = new Set(rankings.flatMap((item) => (item.players || []).map((player) => Number(player.id))));
    const candidates = [];
    if (isNumeric) candidates.push({ id: Number(numericId), name: `Player ${numericId}`, aliases: [] });
    const esportsBhId = Number(esportsMatch?.player?.brawlhallaId ?? esportsMatch?.player?.brawlhalla_id ?? 0);
    if (esportsBhId > 0 && !existingIds.has(esportsBhId)) candidates.push({ id: esportsBhId, name: esportsMatch?.player?.name || query, aliases: [query] });
    for (const item of coreMatches) if (!existingIds.has(Number(item.id))) candidates.push(item);
    for (const item of localMatches) if (!existingIds.has(Number(item.id))) candidates.push({ id: item.id, name: item.names?.[0]?.name, aliases: item.names?.map((name) => name.name) || [], profile: item.profile || null });

    const uniqueCandidates = [...new Map(candidates.map((item) => [Number(item.id), item])).values()]
      .sort((a, b) => candidateSearchScore(b, query) - candidateSearchScore(a, query))
      .slice(0, 8);
    const profiles = (await mapWithConcurrency(uniqueCandidates, 8, (item) =>
      buildProfileSearchRanking(item, query, { quick: true, mode, region, rankTimeoutMs: 750, legendTimeoutMs: 650 })
    )).filter(Boolean);
    const combined = sortSearchRankings([...profiles, ...rankings], query);
    const payload = {
      rankings: combined.slice(0, 12),
      alias_lookup: coreMatches.length > 0,
      exact_alias_hit: combined.some((ranking) => searchRankingScore(ranking, query) >= 2200)
    };
    res.json(setCachedProfileSearch('suggestions', query, region, mode, payload));
  } catch (error) {
    next(error);
  }
});

app.get('/api/search', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 40);
    if (query.length < 2) return res.status(400).json({ error: 'Type at least 2 letters.' });

    const region = allowed(String(req.query.region || 'ALL').toUpperCase(),
      ['ALL', 'US-E', 'EU', 'SEA', 'BRZ', 'AUS', 'US-W', 'JPS', 'SA', 'ME'], 'ALL');
    const mode = allowed(String(req.query.mode || '1v1'), ['1v1', '2v2', '3v3'], '1v1');
    const cached = getCachedProfileSearch('search', query, region, mode);
    if (cached) return res.json({ ...cached, cached: true });

    const numericId = query.replace(/^#/, '');
    const isNumeric = /^\d+$/.test(numericId);
    const localMatches = isNumeric ? [] : await findAliasMatches(query, 18).catch(() => []);
    const exactLocal = hasExactAliasMatch(localMatches, query);

    // A profile already indexed by PeakHalla should be returned from PostgreSQL
    // immediately, including unranked profiles with no ELO.
    if (!isNumeric && exactLocal) {
      const exactCandidates = localMatches
        .filter((item) => (item.names || []).some((name) => normalizeName(name?.name) === normalizeName(query)))
        .map((item) => ({
          id: item.id,
          name: item.names?.[0]?.name || query,
          aliases: item.names?.map((name) => name.name) || [],
          profile: item.profile || null
        }))
        .slice(0, 8);
      const exactProfiles = (await mapWithConcurrency(exactCandidates, 8, (item) =>
        buildProfileSearchRanking(item, query, {
          quick: true,
          mode,
          region,
          lifetimeTimeoutMs: 450,
          rankTimeoutMs: 450,
          legendMapTimeoutMs: 350,
          legendTimeoutMs: 350
        })
      )).filter(Boolean);
      if (exactProfiles.length) {
        const payload = {
          rankings: sortSearchRankings(exactProfiles, query).slice(0, 24),
          total_pages: 0,
          includes_unranked_profiles: exactProfiles.some((item) => item.profile_only),
          alias_lookup: true,
          exact_alias_hit: true,
          database_first: true
        };
        return res.json(setCachedProfileSearch('search', query, region, mode, payload));
      }
    }

    const params = new URLSearchParams({
      page: '1', max_results: '20', game_mode: mode, region, search: query, order_by: 'rating'
    });

    const officialPromise = isNumeric
      ? Promise.resolve({ rankings: [], total_pages: 0 })
      : apiFetch(`/leaderboard/ranked?${params}`).catch(() => ({ rankings: [], total_pages: 0 }));
    const corePromise = (isNumeric || exactLocal)
      ? Promise.resolve([])
      : searchCorehallaAliasesBroad(query, 4, false).catch(() => []);
    const esportsPromise = isNumeric ? Promise.resolve(null) : findEsportsPlayerByName(query, '').catch(() => null);
    let [official, coreMatches, esportsMatch] = await Promise.all([
      settleWithin(officialPromise, 1700, null),
      settleWithin(corePromise, 3600, []),
      settleWithin(esportsPromise, 1200, null)
    ]);
    if (!official && !coreMatches.length && !localMatches.length && !esportsMatch) {
      official = await settleWithin(officialPromise, 2800, { rankings: [], total_pages: 0 });
      coreMatches = await settleWithin(corePromise, 700, []);
    }
    official ||= { rankings: [], total_pages: 0 };
    if (!isNumeric && !coreMatches.length && !localMatches.length && !(official?.rankings || []).length && !esportsMatch) {
      coreMatches = await settleWithin(searchCorehallaAliasesBroad(query, 10, true), 5_500, []);
    }
    warmAliasSearchInBackground(query);
    if (coreMatches.length) await rememberCorehallaAliasMatches(coreMatches).catch(() => null);

    const hydratedOfficial = await hydrateRankingPlayers(official?.rankings || [], 'search', { includeLegends: true, legendTimeoutMs: 1000, legendConcurrency: 10 });
    const needle = normalizeName(query);
    const officialRankings = hydratedOfficial.filter((item) => (item.players || []).some((player) =>
      normalizeName(player.username).includes(needle)
    ));
    const officialIds = new Set(officialRankings.flatMap((item) => (item.players || []).map((player) => Number(player.id))));

    const candidates = [];
    if (isNumeric) candidates.push({ id: Number(numericId), name: `Player ${numericId}`, aliases: [] });
    const esportsBhId = Number(esportsMatch?.player?.brawlhallaId ?? esportsMatch?.player?.brawlhalla_id ?? 0);
    if (esportsBhId > 0 && !officialIds.has(esportsBhId)) candidates.push({ id: esportsBhId, name: esportsMatch?.player?.name || query, aliases: [query] });
    for (const item of coreMatches) if (!officialIds.has(Number(item.id))) candidates.push(item);
    for (const item of localMatches) if (!officialIds.has(Number(item.id))) candidates.push({ id: item.id, name: item.names?.[0]?.name, aliases: item.names?.map((name) => name.name) || [], profile: item.profile || null });

    const uniqueCandidates = [...new Map(candidates.map((item) => [Number(item.id), item])).values()]
      .sort((a, b) => candidateSearchScore(b, query) - candidateSearchScore(a, query))
      .slice(0, 14);
    const profiles = (await mapWithConcurrency(uniqueCandidates, 8, (item) =>
      buildProfileSearchRanking(item, query, { quick: true, mode, region, rankTimeoutMs: 900, legendTimeoutMs: 700 })
    )).filter(Boolean);

    const combined = sortSearchRankings([...profiles, ...officialRankings], query);
    const payload = {
      rankings: combined.slice(0, 24),
      total_pages: official?.total_pages || 0,
      includes_unranked_profiles: profiles.length > 0,
      alias_lookup: coreMatches.length > 0 || exactLocal,
      exact_alias_hit: combined.some((ranking) => searchRankingScore(ranking, query) >= 2200)
    };
    res.json(setCachedProfileSearch('search', query, region, mode, payload));
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
    const forceFresh = String(req.query.refresh || '') === '1';

    const [officialGuild, officialMembers, currentClan, cached] = await Promise.all([
      forceFresh
        ? apiFetchFresh(`/guild/stats?guild_id=${encodeURIComponent(guildId)}`).then(normalizeGuildStats).catch(() => null)
        : getGuildStats(guildId, 5 * 60_000),
      forceFresh
        ? apiFetchFresh(`/guild/members?guild_id=${encodeURIComponent(guildId)}`).then(normalizeGuildMembers).catch(() => null)
        : getGuildMembers(guildId, 5 * 60_000).catch(() => null),
      getCorehallaClanStats(guildId, forceFresh),
      readGuildCache()
    ]);

    const cachedGuild = cached.guilds.find((item) => Number(item.guild_id) === guildId);
    const currentMembers = Array.isArray(currentClan?.members) ? currentClan.members : [];
    const officialRoster = Array.isArray(officialMembers) ? officialMembers : [];
    const candidateGuild = resolveGuildSnapshots(cachedGuild, officialGuild, currentClan?.guild);
    if (!candidateGuild) return res.status(404).json({ error: 'Clan not found.' });

    const capacity = Math.max(1, Number(candidateGuild.member_capacity || 200));
    // Corehalla's clan profile represents the current roster. The official
    // members endpoint can include departed/historical members, which is why a
    // clan capped at 200 could previously show 331 on PeakHalla.
    let members = [];
    let membersSource = 'unavailable';
    if (currentMembers.length) {
      members = mergeCurrentGuildRoster(currentMembers.slice(0, capacity), officialRoster);
      membersSource = currentMembers.length > capacity
        ? 'current-clan-snapshot-capped-enriched'
        : 'current-clan-snapshot-enriched';
    } else if (officialRoster.length && officialRoster.length <= capacity) {
      members = enforceGuildRoleIntegrity(officialRoster);
      membersSource = 'official-brawlhalla-fallback';
    }

    const currentRosterXp = sumGuildMemberXp(currentMembers);
    const officialRosterXp = sumGuildMemberXp(officialRoster);
    const resolvedLifetimeXp = maxPositiveNumber(
      currentClan?.guild?.xp,
      officialGuild?.xp,
      cachedGuild?.xp,
      candidateGuild.xp,
      currentMembers.length ? currentRosterXp : 0
    );

    let xpRank = candidateGuild.rank_verified && Number(candidateGuild.rank) > 0
      ? Number(candidateGuild.rank)
      : null;
    let xpRankVerified = Boolean(xpRank);
    if (!xpRank && candidateGuild.name) {
      const rankingMatches = await getCorehallaClanRankings(candidateGuild.name, 3, forceFresh).catch(() => []);
      const exact = rankingMatches.find((item) => Number(item.guild_id) === guildId)
        || rankingMatches.find((item) => normalizeName(item.name) === normalizeName(candidateGuild.name));
      if (exact?.rank_verified && Number(exact.rank) > 0) {
        xpRank = Number(exact.rank);
        xpRankVerified = true;
      }
    }

    const fullGuild = {
      ...candidateGuild,
      xp: resolvedLifetimeXp,
      rank: xpRank,
      rank_verified: xpRankVerified,
      member_count: members.length,
      member_capacity: capacity,
      stats_checked_at: new Date().toISOString(),
      roster_checked_at: new Date().toISOString()
    };
    await rememberGuild(fullGuild).catch(() => null);
    res.json({
      guild: fullGuild,
      members,
      members_source: membersSource,
      roster_is_current: membersSource.startsWith('current-clan-snapshot'),
      official_roster_count: officialRoster.length || null,
      stats_sources: {
        official_xp: Number(officialGuild?.xp || 0) || null,
        live_snapshot_xp: Number(currentClan?.guild?.xp || 0) || null,
        cached_xp: Number(cachedGuild?.xp || 0) || null,
        current_roster_xp: currentRosterXp || null,
        official_roster_xp: officialRosterXp || null,
        resolved_xp: resolvedLifetimeXp || null,
        official_tier: Number(officialGuild?.tier || 0) || null,
        live_snapshot_tier: Number(currentClan?.guild?.tier || 0) || null,
        resolved_tier: Number(fullGuild.tier || 0) || null
      },
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


function normalizeTournamentUrl(href, base = 'https://www.brawlhalla.com') {
  try {
    const url = new URL(decodeHtml(href), base);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function inferTournamentRegions(value = '') {
  const text = ` ${String(value).toUpperCase()} `;
  const regions = [];
  const tests = [
    ['MENA', /\bMENA\b|MIDDLE EAST|NORTH AFRICA/],
    ['SEA', /\bSEA\b|SOUTHEAST ASIA/],
    ['NA', /\bNA\b|NORTH AMERICA|UNITED STATES|CANADA/],
    ['SA', /\bSA\b|SOUTH AMERICA|BRAZIL|LATAM/],
    ['EU', /\bEU\b|EUROPE/],
    ['AUS', /\bAUS\b|AUSTRALIA|OCEANIA/],
    ['JPN', /\bJPN\b|\bJAPAN\b/]
  ];
  for (const [code, pattern] of tests) if (pattern.test(text)) regions.push(code);
  return regions.length ? regions : ['GLOBAL'];
}

function inferTournamentModes(value = '') {
  const text = ` ${String(value).toLowerCase()} `;
  const modes = [];
  if (/\b1v1\b|\bsingles?\b|\bsolo\b/.test(text)) modes.push('1v1');
  if (/\b2v2\b|\bdoubles?\b|\bduos?\b|\bteam(?:s)?\b/.test(text)) modes.push('2v2');
  return modes.length ? [...new Set(modes)] : ['1v1', '2v2'];
}

function isoDateFromEnglish(value = '') {
  const match = String(value).match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(20\d{2})\b/i);
  if (!match) return null;
  const date = new Date(`${match[1]} ${match[2]}, ${match[3]} 12:00:00 UTC`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseOfficialEsportsPosts(html = '') {
  const events = [];
  const raw = String(html || '');
  for (const match of raw.matchAll(/<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const url = normalizeTournamentUrl(match[2]);
    if (!url || !/brawlhalla\.com\/news\//i.test(url)) continue;
    const combined = htmlText(match[4]);
    const nearbyStart = Math.max(0, match.index - 120);
    const nearby = htmlText(raw.slice(nearbyStart, match.index + match[0].length));
    const date = isoDateFromEnglish(combined) || isoDateFromEnglish(nearby);
    let name = combined.replace(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/gi, '').trim();
    name = name.replace(/^Announcements?\s*/i, '').replace(/^Esports\s*/i, '').trim();
    if (name.length < 8 || name.length > 180) continue;
    if (!/(championship|tournament|cup|expo|invitational|open|final|series|qualifier|brawl|esports|world championship)/i.test(name)) continue;
    const community = /community|sponsored/i.test(name);
    events.push({
      id: crypto.createHash('sha1').update(url).digest('hex').slice(0, 14),
      name,
      category: community ? 'community' : 'official',
      regions: inferTournamentRegions(name),
      modes: inferTournamentModes(name),
      date,
      note: community ? 'Officially featured community tournament announcement.' : 'Official Brawlhalla esports announcement.',
      source_url: url,
      source: 'Brawlhalla Esports'
    });
  }
  return [...new Map(events.map((event) => [event.source_url, event])).values()];
}

function parseCommunityTournamentArticle(html = '') {
  const events = [];
  const raw = String(html || '');
  const articleDate = isoDateFromEnglish(htmlText(raw));
  for (const match of raw.matchAll(/<a\b([^>]*?)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const url = normalizeTournamentUrl(match[2]);
    if (!url || !/(challengermode\.com|start\.gg)/i.test(url)) continue;
    const name = htmlText(match[4]).trim();
    if (name.length < 3 || name.length > 140) continue;
    const before = htmlText(raw.slice(Math.max(0, match.index - 240), match.index));
    const regionMatch = before.match(/(?:^|\s)(MENA|SEA|NA|SA|EU|AUS|JPN)\s*:\s*$/i);
    const regions = regionMatch ? [regionMatch[1].toUpperCase()] : inferTournamentRegions(`${before} ${name}`);
    events.push({
      id: crypto.createHash('sha1').update(url).digest('hex').slice(0, 14),
      name,
      category: 'community',
      regions,
      modes: inferTournamentModes(`${before} ${name}`),
      date: articleDate,
      note: /sponsored/i.test(before.slice(-100)) ? 'Sponsored community event.' : 'Community tournament featured by Brawlhalla.',
      source_url: url,
      source: /start\.gg/i.test(url) ? 'start.gg' : 'Challengermode'
    });
  }
  return [...new Map(events.map((event) => [event.source_url, event])).values()];
}

function localTournamentDirectory(data = {}) {
  return (data.tournament_series || []).map((event, index) => ({
    id: `local-${index}-${normalizeName(event.name).replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`,
    name: event.name || 'Brawlhalla Tournament',
    category: event.category || (/community/i.test(`${event.type || ''} ${event.note || ''}`) ? 'community' : 'official'),
    regions: Array.isArray(event.regions) && event.regions.length ? event.regions : ['GLOBAL'],
    modes: Array.isArray(event.modes) && event.modes.length ? event.modes : inferTournamentModes(`${event.name || ''} ${event.type || ''} ${event.note || ''}`),
    date: event.date || null,
    note: event.note || event.type || '',
    source_url: event.source_url || '',
    source: event.source || 'PeakHalla tournament directory'
  }));
}

async function getLiveTournamentDirectory(refresh = false) {
  if (refresh) cache.delete(`html:${OFFICIAL_ESPORTS_NEWS_URL}`);

  let newsHtml = '';
  let posts = [];
  try {
    newsHtml = await htmlFetch(OFFICIAL_ESPORTS_NEWS_URL, 15 * 60_000);
    posts = parseOfficialEsportsPosts(newsHtml);
  } catch (error) {
    console.warn('Could not refresh Brawlhalla esports news:', error.message);
  }

  // Always follow the newest Community Tournaments announcement instead of
  // pinning the directory to one month. When Brawlhalla publishes a new post,
  // it becomes the source automatically on the next refresh.
  const latestCommunityPost = posts
    .filter((event) => event.category === 'community')
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0))[0];
  const communityUrl = latestCommunityPost?.source_url || COMMUNITY_TOURNAMENTS_URL;
  if (refresh) cache.delete(`html:${communityUrl}`);

  let community = [];
  try {
    community = parseCommunityTournamentArticle(await htmlFetch(communityUrl, 15 * 60_000));
  } catch (error) {
    console.warn('Could not refresh community tournaments:', error.message);
  }

  return {
    official: posts.filter((event) => event.category === 'official'),
    community,
    community_source_url: communityUrl,
    live: Boolean(newsHtml || community.length)
  };
}

app.get('/api/esports/tournaments', async (req, res) => {
  const type = allowed(String(req.query.type || 'official').toLowerCase(), ['official', 'community'], 'official');
  const region = allowed(String(req.query.region || 'ALL').toUpperCase(), ['ALL', 'NA', 'EU', 'SA', 'SEA', 'MENA', 'AUS', 'JPN'], 'ALL');
  const mode = allowed(String(req.query.mode || 'ALL'), ['ALL', '1v1', '2v2'], 'ALL');
  const refresh = String(req.query.refresh || '') === '1';
  const data = await readJson(ESPORTS_FILE, { tournament_series: [] });
  const local = localTournamentDirectory(data);
  let live = { official: [], community: [], live: false };
  try { live = await getLiveTournamentDirectory(refresh); }
  catch (error) { console.warn('Could not refresh tournament directory:', error.message); }

  const selected = type === 'community' ? live.community : live.official;
  const merged = [...selected, ...local.filter((event) => event.category === type)];
  const unique = [...new Map(merged.map((event) => [event.source_url || `${event.category}:${event.name}`, event])).values()]
    .filter((event) => {
      const regions = Array.isArray(event.regions) && event.regions.length ? event.regions : ['GLOBAL'];
      const modes = Array.isArray(event.modes) && event.modes.length ? event.modes : inferTournamentModes(`${event.name || ''} ${event.note || ''}`);
      const regionMatches = region === 'ALL' ? true : regions.includes(region);
      const modeMatches = mode === 'ALL' ? true : modes.includes(mode);
      return regionMatches && modeMatches;
    })
    .sort((left, right) => {
      const dateDiff = new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime();
      return dateDiff || String(left.name).localeCompare(String(right.name));
    })
    .slice(0, 60);

  res.json({
    type,
    region,
    mode,
    updated_at: new Date().toISOString(),
    live: live.live,
    auto_refresh_seconds: 300,
    events: unique,
    sources: [OFFICIAL_ESPORTS_NEWS_URL, live.community_source_url || COMMUNITY_TOURNAMENTS_URL]
  });
});

app.get('/api/esports', async (req, res) => {
  const region = allowed(String(req.query.region || 'NA').toUpperCase(), ['NA', 'EU', 'SA', 'SEA', 'MENA'], 'NA');
  const mode = allowed(String(req.query.mode || '1v1'), ['1v1', '2v2'], '1v1');
  const page = asInt(req.query.page, 1, 1, 100);
  const query = String(req.query.q || '').trim().slice(0, 80);
  const data = await readJson(ESPORTS_FILE, { rankings: {}, tournament_series: [], featured_champions: [] });
  const localRankings = data.rankings?.[`${region}:${mode}`] || [];

  let official = { rankings: [], updated_at: null, source_url: `${OFFICIAL_ESPORTS_BASE}/${region}/${mode}/1?sortBy=powerRanking`, page, page_size: 20, has_more: false };
  try {
    official = query
      ? await searchOfficialEsportsRankings(region, mode, query)
      : await getOfficialEsportsWindow(region, mode, page, 20);
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

  const fallbackRankings = page === 1
    ? localRankings.filter((item) => !query || normalizeName(item.name).includes(normalizeName(query))).slice(0, 20)
    : [];
  const rankings = official.rankings.length ? official.rankings : fallbackRankings;
  res.json({
    updated_at: official.updated_at || data.updated_at || null,
    source: data.source || 'Official Brawlhalla Esports Power Rankings',
    source_url: official.source_url,
    region,
    mode,
    query,
    page: official.page || page,
    page_size: official.page_size || 20,
    has_more: query ? false : Boolean(official.has_more),
    live: official.rankings.length > 0,
    rankings,
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
  return Number(
    player.id ?? player.brawlhalla_id ?? player.brawlhallaId ?? player.player_id ??
    player.playerId ?? player.bh_id ?? player.bhId ?? 0
  );
}

function playerRefName(player = {}) {
  return String(
    player.username ?? player.name ?? player.player_name ?? player.playerName ??
    player.alias ?? ''
  ).trim();
}

function flatTeamPlayers(team = {}) {
  const firstId = Number(
    team.brawlhalla_id_one ?? team.brawlhallaIdOne ?? team.player_one_id ??
    team.playerOneId ?? team.player1_id ?? team.player1Id ?? team.bh_id_one ?? 0
  );
  const secondId = Number(
    team.brawlhalla_id_two ?? team.brawlhallaIdTwo ?? team.player_two_id ??
    team.playerTwoId ?? team.player2_id ?? team.player2Id ?? team.bh_id_two ?? 0
  );
  if (!(firstId > 0) && !(secondId > 0)) return [];
  return [
    {
      id: firstId,
      username: team.username_one ?? team.usernameOne ?? team.player_one_name ??
        team.playerOneName ?? team.player1_name ?? team.player1Name ?? ''
    },
    {
      id: secondId,
      username: team.username_two ?? team.usernameTwo ?? team.player_two_name ??
        team.playerTwoName ?? team.player2_name ?? team.player2Name ?? ''
    }
  ].filter((player) => Number(player.id) > 0);
}

function teamPlayers(value = {}) {
  const candidates = [
    value.players,
    value.team?.players,
    value.members,
    value.team_members,
    value.teamMembers,
    value.roster
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length >= 2) return candidate;
  }
  return flatTeamPlayers(value);
}

function looksLikeTeamRow(value = {}) {
  const players = teamPlayers(value);
  if (players.length >= 2) return true;
  return [
    'team_rating', 'teamRating', 'team_elo', 'teamElo', 'peak_rating', 'best_rating',
    'team_peak_rating', 'teamPeakRating', 'teamname', 'team_name'
  ].some((key) => value[key] !== undefined);
}

function collectTeamRows(payload, playerId) {
  const rows = [];
  const seenObjects = new Set();
  const seenRows = new Set();
  const numericPlayerId = Number(playerId);

  function pushRow(value) {
    if (!value || typeof value !== 'object' || !looksLikeTeamRow(value)) return;
    const players = teamPlayers(value);
    if (players.length < 2 || !players.some((player) => playerRefId(player) === numericPlayerId)) return;
    const ids = players.map(playerRefId).filter((id) => id > 0).sort((a, b) => a - b);
    const signature = `${ids.join(':')}:${Number(value.rating ?? value.team_rating ?? value.teamRating ?? value.elo ?? value.team_elo ?? 0)}:${Number(value.games ?? value.team_games ?? 0)}`;
    if (seenRows.has(signature)) return;
    seenRows.add(signature);
    rows.push({ ...value, players });
  }

  function visit(value, depth = 0) {
    if (depth > 10 || value == null) return;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    if (typeof value !== 'object' || seenObjects.has(value)) return;
    seenObjects.add(value);
    pushRow(value);
    for (const [key, child] of Object.entries(value)) {
      if (['legends', 'region_ranks', 'regionRanks', 'weapons'].includes(key)) continue;
      if (Array.isArray(child) || (child && typeof child === 'object')) visit(child, depth + 1);
    }
  }

  visit(payload);
  return rows;
}

function normalizeTeamRow(team = {}) {
  const wins = Number(team.wins ?? team.team_wins ?? team.teamWins ?? 0) || 0;
  const explicitLosses = Number(team.losses ?? team.team_losses ?? team.teamLosses);
  const explicitGames = Number(team.games ?? team.team_games ?? team.teamGames ?? team.matches);
  const losses = Number.isFinite(explicitLosses)
    ? Math.max(0, explicitLosses)
    : Math.max(0, (Number.isFinite(explicitGames) ? explicitGames : wins) - wins);
  const games = Number.isFinite(explicitGames) ? Math.max(0, explicitGames) : wins + losses;
  return {
    players: teamPlayers(team),
    rating: Number(team.rating ?? team.team_rating ?? team.teamRating ?? team.elo ?? team.team_elo ?? team.teamElo) || null,
    peak_rating: Number(team.best_rating ?? team.bestRating ?? team.peak_rating ?? team.peakRating ?? team.team_peak_rating ?? team.teamPeakRating ?? team.peak_elo) || null,
    tier: team.tier ?? team.team_tier ?? team.teamTier ?? null,
    rank: Number(team.global_rank ?? team.globalRank ?? team.rank ?? team.team_rank ?? team.teamRank) || null,
    region: team.region ?? team.server ?? team.region_code ?? team.regionCode ?? null,
    wins,
    losses,
    games
  };
}

function teammateRefsFromRows(rows, playerId) {
  const refs = [];
  const numericPlayerId = Number(playerId);
  for (const rawRow of rows) {
    const team = normalizeTeamRow(rawRow);
    const current = team.players.find((player) => playerRefId(player) === numericPlayerId);
    if (!current) continue;
    for (const teammate of team.players) {
      const teammateId = playerRefId(teammate);
      if (!Number.isSafeInteger(teammateId) || teammateId <= 0 || teammateId === numericPlayerId) continue;
      refs.push({
        id: teammateId,
        name: playerRefName(teammate) || `Player ${teammateId}`,
        team_rating: team.rating,
        team_peak_rating: team.peak_rating,
        team_tier: team.tier,
        team_rank: team.rank,
        region: team.region,
        wins: team.wins,
        games: team.games,
        losses: team.losses
      });
    }
  }
  return refs;
}

async function fetchPlayerTeamSources(id, forceFresh = false) {
  const fetchOfficial = (endpoint, ttl = 30_000) => forceFresh
    ? apiFetchFresh(endpoint).catch(() => null)
    : apiFetch(endpoint, ttl).catch(() => null);
  const [teamsPayload, ranked2v2Payload, allStatsPayload, coreStatsPayload] = await Promise.all([
    fetchOfficial(`/player/teams?brawlhalla_id=${id}`, 30_000),
    fetchOfficial(`/player/stats?brawlhalla_id=${id}&mode=ranked_2v2`, 30_000),
    fetchOfficial(`/player/stats?brawlhalla_id=${id}&mode=all`, 5 * 60_000),
    getCorehallaPlayerStats(id, forceFresh).catch(() => null)
  ]);
  return [
    ['official-player-teams', teamsPayload],
    ['official-ranked-2v2', ranked2v2Payload],
    ['official-all-stats', allStatsPayload],
    ['corehalla-player-stats', coreStatsPayload]
  ];
}

app.get('/api/player/:id/portrait', async (req, res, next) => {
  try {
    const id = asInt(req.params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!id) return res.status(400).json({ error: 'Invalid player ID.' });
    const cachedPlayer = getCachedProfileResponse(id)?.player || await getDiskCachedProfileResponse(id).then((payload) => payload?.player || null).catch(() => null);
    const mainLegend = cachedPlayer?.main_legend || await settleWithin(getMainLegendSummary(id), 5_500, null);
    res.setHeader('Cache-Control', mainLegend ? 'private, max-age=600, stale-while-revalidate=3600' : 'no-store');
    res.json({ player_id: id, main_legend: mainLegend || null });
  } catch (error) {
    next(error);
  }
});

app.get('/api/player/:id/teammates', async (req, res, next) => {
  try {
    const id = asInt(req.params.id, 0, 1, Number.MAX_SAFE_INTEGER);
    if (!id) return res.status(400).json({ error: 'Invalid player ID.' });
    const forceFresh = String(req.query.refresh || '') === '1';

    let sources = await fetchPlayerTeamSources(id, forceFresh);
    let collected = sources.flatMap(([source, payload]) => collectTeamRows(payload, id).map((row) => ({ ...row, __source: source })));
    if (!collected.length && !forceFresh) {
      sources = await fetchPlayerTeamSources(id, true);
      collected = sources.flatMap(([source, payload]) => collectTeamRows(payload, id).map((row) => ({ ...row, __source: source })));
    }

    const refs = teammateRefsFromRows(collected, id);
    const bestByPlayer = new Map();
    for (const item of refs) {
      const previous = bestByPlayer.get(item.id);
      const itemScore = Number(item.team_rating || 0) * 10_000 + Number(item.games || 0);
      const previousScore = Number(previous?.team_rating || 0) * 10_000 + Number(previous?.games || 0);
      if (!previous || itemScore > previousScore) bestByPlayer.set(item.id, item);
    }

    const teammates = await mapWithConcurrency([...bestByPlayer.values()], 6, async (item) => {
      const cachedPlayer = getCachedProfileResponse(item.id)?.player || null;
      const mainLegend = cachedPlayer?.main_legend || await settleWithin(getMainLegendSummary(item.id), 2_500, null);
      return {
        ...item,
        name: cachedPlayer?.name || item.name,
        tier: item.team_tier || null,
        main_legend: mainLegend || null
      };
    });

    teammates.sort((a, b) =>
      Number(b.team_rating || 0) - Number(a.team_rating || 0) ||
      Number(b.games || 0) - Number(a.games || 0)
    );
    const usedSources = [...new Set(collected.map((row) => row.__source).filter(Boolean))];
    res.setHeader('Cache-Control', teammates.length ? 'private, max-age=30, stale-while-revalidate=120' : 'no-store');
    res.json({
      player_id: id,
      teammates,
      source: usedSources.join('+') || 'no-current-team-source',
      sources_checked: sources.map(([source, payload]) => ({ source, available: Boolean(payload) })),
      current_season_only: true,
      refreshed: forceFresh
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
    const cachedProfile = fast ? (getCachedProfileResponse(id) || await getDatabaseCachedProfileResponse(id) || await getDiskCachedProfileResponse(id)) : null;
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
      // Clan enrichment must never delay the player profile response.
      getGuildStats(playerGuild.guild_id, GUILD_CACHE_TTL_MS)
        .then((guildSnapshot) => guildSnapshot ? rememberGuild(guildSnapshot) : null)
        .catch(() => null);
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
    if (hasMeaningfulProfileData) {
      setCachedProfileResponse(id, payload);
      // Await one database write so an unranked profile becomes searchable
      // immediately after the first successful profile view.
      await saveProfileToDatabase(id, payload).catch((error) => {
        console.warn(`Could not synchronously index player ${id}:`, error.message);
      });
      invalidateProfileSearchCacheForNames([player.name, ...knownNames.map((item) => item?.name)]);
    }

    res.setHeader('X-Stats-Source', coreStats ? 'Brawlhalla-plus-fresh-Corehalla-highest-progression' : (fast ? 'Brawlhalla-fast' : 'Brawlhalla-live'));
    res.setHeader('X-Stats-Fetched-At', player.updated_at);
    res.setHeader('X-Alias-Refresh', fast ? 'background-pending' : 'automatic-fresh');
    res.json(payload);
  } catch (error) {
    next(error);
  }
});


app.get('/api/system/database', async (_req, res) => {
  const [counts, coverage, discovery] = dbReady ? await Promise.all([
    dbQuery(`
      SELECT
        (SELECT COUNT(*)::int FROM players) AS players,
        (SELECT COUNT(*)::int FROM player_aliases) AS aliases,
        (SELECT COUNT(*)::int FROM player_snapshots) AS snapshots
    `),
    dbQuery(`
      SELECT COALESCE(NULLIF(region, ''), 'UNKNOWN') AS region, COUNT(*)::int AS players
      FROM players
      GROUP BY COALESCE(NULLIF(region, ''), 'UNKNOWN')
      ORDER BY players DESC
      LIMIT 20
    `),
    getDatabaseState('official_discovery_cursor_v2', null)
  ]) : [null, null, null];
  res.json({
    configured: Boolean(DATABASE_URL),
    ready: dbReady,
    counts: counts?.rows?.[0] || { players: 0, aliases: 0, snapshots: 0 },
    discovery_enabled: DATABASE_DISCOVERY_ENABLED,
    discovery_running: discoveryRunning,
    discovery_config: {
      interval_ms: DATABASE_DISCOVERY_INTERVAL_MS,
      batch_size: DATABASE_DISCOVERY_BATCH_SIZE,
      max_page: DATABASE_DISCOVERY_MAX_PAGE,
      page_size: DATABASE_DISCOVERY_PAGE_SIZE,
      regions: DISCOVERY_REGIONS.length,
      modes: DISCOVERY_MODES
    },
    discovery: discovery || null,
    coverage: coverage?.rows || [],
    last_error: dbLastError ? dbLastError.message : null
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = error.name === 'AbortError'
    ? 'Brawlhalla took too long to respond. Try again.'
    : error.message || 'Something went wrong.';
  res.status(status).json({ error: message });
});

async function startServer() {
  try {
    await cleanAllNameHistory();
  } catch (error) {
    console.warn('Could not clean name history on startup:', error.message);
  }

  try {
    const connected = await initDatabase();
    if (connected) {
      await importLegacyJsonIntoDatabase().catch((error) => console.warn('Legacy database import failed:', error.message));
      scheduleDatabaseDiscovery();
    }
  } catch (error) {
    console.warn('PeakHalla database startup failed; continuing with JSON storage:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`PeakHalla running on http://localhost:${PORT}`);
  });
}

async function shutdown() {
  if (discoveryTimer) clearInterval(discoveryTimer);
  if (dbPool) await dbPool.end().catch(() => null);
  process.exit(0);
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

startServer();
