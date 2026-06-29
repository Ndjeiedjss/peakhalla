(() => {
  const root = document.querySelector('#arena-global-account');
  if (!root) return;

  const loginLink = root.querySelector('#arena-global-login');
  const userWrap = root.querySelector('#arena-global-user');
  const profileLink = root.querySelector('#arena-global-profile');
  const avatar = root.querySelector('#arena-global-avatar');
  const username = root.querySelector('#arena-global-username');
  const bell = root.querySelector('#arena-notification-button');
  const count = root.querySelector('#arena-notification-count');
  const panel = root.querySelector('#arena-notification-panel');
  const list = root.querySelector('#arena-notification-list');
  const markAll = root.querySelector('#arena-notification-read-all');
  const logout = root.querySelector('#arena-global-logout');
  let currentUser = null;
  let open = false;
  let loading = false;
  let pollTimer = null;

  const isArabic = () => document.documentElement.lang === 'ar' || document.documentElement.dir === 'rtl';
  const text = (en, ar) => isArabic() ? ar : en;
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const initials = (name) => String(name || 'P').trim().slice(0, 1).toUpperCase();
  const avatarMarkup = (user) => user?.avatar_url
    ? `<img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(user.username || 'Player')}">`
    : `<span>${escapeHtml(initials(user?.username))}</span>`;

  async function request(url, options = {}) {
    const response = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Cache-Control': 'no-cache', ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }

  function relativeTime(value) {
    const time = new Date(value).getTime();
    if (!Number.isFinite(time)) return '';
    const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
    if (seconds < 60) return text('now', 'الآن');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return text(`${minutes}m`, `قبل ${minutes} د`);
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return text(`${hours}h`, `قبل ${hours} س`);
    const days = Math.floor(hours / 24);
    return text(`${days}d`, `قبل ${days} ي`);
  }

  function setUnread(value) {
    const unread = Math.max(0, Number(value || 0));
    count.textContent = unread > 99 ? '99+' : String(unread);
    count.hidden = unread < 1;
    bell.classList.toggle('has-unread', unread > 0);
  }

  function renderAccount(user, unread = 0) {
    currentUser = user || null;
    root.hidden = !currentUser;
    // Keep the guest Arena shortcut hidden; the main Arena Wall nav link remains available.
    loginLink.hidden = true;
    userWrap.hidden = !currentUser;
    if (!currentUser) {
      panel.hidden = true;
      open = false;
      setUnread(0);
      return;
    }
    profileLink.href = `/arena/profile/${encodeURIComponent(currentUser.username)}`;
    profileLink.setAttribute('aria-label', text(`Open ${currentUser.username}'s Arena profile`, `فتح ملف ${currentUser.username}`));
    avatar.innerHTML = avatarMarkup(currentUser);
    username.textContent = currentUser.username;
    setUnread(unread);
  }

  function notificationText(item) {
    const actor = item.actor?.username || text('Someone', 'شخص');
    if (item.type === 'reply') return text(`${actor} replied to your comment`, `رد ${actor} على تعليقك`);
    return text(`${actor} commented on your post`, `علّق ${actor} على منشورك`);
  }

  function renderNotifications(items = []) {
    if (!items.length) {
      list.innerHTML = `<div class="arena-notification-empty"><span>✓</span><strong>${text('You are all caught up', 'ما عندك إشعارات جديدة')}</strong></div>`;
      return;
    }
    list.innerHTML = items.map((item) => {
      const target = item.post_id ? `/arena#arena-post-${encodeURIComponent(item.post_id)}` : '/arena';
      return `<a class="arena-notification-item ${item.is_read ? '' : 'is-unread'}" href="${target}" data-notification-id="${escapeHtml(item.id)}">
        <span class="arena-notification-avatar">${avatarMarkup(item.actor || {})}</span>
        <span class="arena-notification-copy"><strong>${escapeHtml(notificationText(item))}</strong><small>${escapeHtml(relativeTime(item.created_at))}</small></span>
        ${item.is_read ? '' : '<i></i>'}
      </a>`;
    }).join('');
  }

  async function loadMe() {
    try {
      const data = await request('/api/arena/me');
      renderAccount(data.user || null, data.unread_notifications || 0);
      return data.user || null;
    } catch {
      renderAccount(null, 0);
      return null;
    }
  }

  async function loadNotifications() {
    if (!currentUser || loading) return;
    loading = true;
    list.innerHTML = `<div class="arena-notification-loading"><span></span><b>${text('Loading…', 'جاري التحميل…')}</b></div>`;
    try {
      const data = await request('/api/arena/notifications?limit=25');
      renderNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch (error) {
      list.innerHTML = `<div class="arena-notification-empty"><strong>${escapeHtml(error.message)}</strong></div>`;
    } finally {
      loading = false;
    }
  }

  async function markNotifications(ids = []) {
    if (!currentUser) return;
    await request('/api/arena/notifications/read', { method: 'POST', body: JSON.stringify(ids.length ? { ids } : {}) }).catch(() => null);
    if (!ids.length) {
      setUnread(0);
      list.querySelectorAll('.is-unread').forEach((item) => item.classList.remove('is-unread'));
    }
  }

  function setPanel(next) {
    open = Boolean(next && currentUser);
    panel.hidden = !open;
    bell.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
    if (open) loadNotifications();
  }

  bell.addEventListener('click', (event) => {
    event.stopPropagation();
    setPanel(!open);
  });
  markAll.addEventListener('click', async () => {
    await markNotifications();
  });
  list.addEventListener('click', (event) => {
    const item = event.target.closest('[data-notification-id]');
    if (item) markNotifications([item.dataset.notificationId]);
  });
  logout.addEventListener('click', async () => {
    await request('/api/arena/logout', { method: 'POST', body: '{}' }).catch(() => null);
    renderAccount(null, 0);
    window.dispatchEvent(new CustomEvent('arena-account-changed', { detail: { user: null, unread: 0 } }));
    if (/^\/arena(?:\/|$)/.test(location.pathname)) location.href = '/arena';
  });
  document.addEventListener('click', (event) => {
    if (open && !root.contains(event.target)) setPanel(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setPanel(false);
  });
  window.addEventListener('arena-account-changed', (event) => {
    const detail = event.detail || {};
    if (Object.prototype.hasOwnProperty.call(detail, 'user')) {
      renderAccount(detail.user || null, detail.unread || 0);
    }
    // Verify the cookie-backed session immediately without requiring a refresh.
    window.setTimeout(loadMe, 0);
  });

  function startPolling() {
    clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (!document.hidden && currentUser) loadMe();
    }, 45_000);
  }

  loadMe();
  startPolling();
})();
