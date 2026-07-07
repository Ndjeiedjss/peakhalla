(() => {
  const list = document.getElementById('content-list');
  const updated = document.getElementById('content-updated');
  if (!list) return;

  const maps = location.pathname.replace(/\/$/, '') === '/maps';
  const endpoint = maps ? '/api/others/maps' : '/api/others/patches';
  const fallbackLabel = maps ? 'MAP' : 'PATCH';
  const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  function normalizedDate(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return new Date(value < 10_000_000_000 ? value * 1000 : value);
    }
    const raw = String(value || '').trim();
    if (/^\d{10,13}$/.test(raw)) {
      const numeric = Number(raw);
      return new Date(raw.length === 10 ? numeric * 1000 : numeric);
    }
    return new Date(raw);
  }

  const dateLabel = (value) => {
    const date = normalizedDate(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  function card(item) {
    const label = maps ? (item.category || 'Map mod') : (item.source || 'Official patch');
    const patchNumber = String(item.title || '').match(/Patch\s*([0-9.]+)/i)?.[1];
    const itemFallback = maps ? 'MAP' : (patchNumber || fallbackLabel);
    const media = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || itemFallback)}" loading="lazy" decoding="async">`
      : '';
    const date = dateLabel(item.date);
    return `<a class="content-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"><div class="content-card-media${media ? '' : ' is-fallback'}" data-fallback-label="${escapeHtml(itemFallback)}">${media}</div><div class="content-card-body"><small>${escapeHtml(label)}</small><h3>${escapeHtml(item.title)}</h3>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}<span>${date ? `${escapeHtml(date)} · ` : ''}Open source ↗</span></div></a>`;
  }

  function activateImageFallbacks() {
    list.querySelectorAll('.content-card-media img').forEach((image) => {
      const showFallback = () => image.closest('.content-card-media')?.classList.add('is-fallback');
      image.addEventListener('error', showFallback, { once: true });
      if (image.complete && image.naturalWidth === 0) showFallback();
    });
  }

  fetch(endpoint, { headers: { accept: 'application/json' } })
    .then((response) => {
      if (!response.ok) throw new Error('Could not load');
      return response.json();
    })
    .then((data) => {
      const items = Array.isArray(data.items) ? data.items : [];
      list.innerHTML = items.length
        ? items.map(card).join('')
        : '<div class="content-loading"><strong>No items available right now.</strong></div>';
      activateImageFallbacks();
      if (updated) updated.textContent = data.updated_at ? `Updated ${dateLabel(data.updated_at)}` : '';
    })
    .catch(() => {
      list.innerHTML = '<div class="content-loading"><strong>Source is temporarily unavailable. Try again shortly.</strong></div>';
      if (updated) updated.textContent = 'Source temporarily unavailable';
    });
})();
