(() => {
  const list = document.getElementById('content-list');
  const updated = document.getElementById('content-updated');
  if (!list) return;
  const maps = location.pathname.replace(/\/$/,'') === '/maps';
  const endpoint = maps ? '/api/others/maps' : '/api/others/patches';
  const escapeHtml = (value='') => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateLabel = (value) => { const d=new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); };
  function card(item) {
    const label = maps ? (item.category || 'Map mod') : (item.source || 'Official patch');
    const media = item.image ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<b>${maps ? 'MAP' : (String(item.title).match(/Patch\s*([0-9.]+)/i)?.[1] || 'PATCH')}</b>`;
    return `<a class="content-card" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer"><div class="content-card-media">${media}</div><div class="content-card-body"><small>${escapeHtml(label)}</small><h3>${escapeHtml(item.title)}</h3>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}<span>${escapeHtml(dateLabel(item.date))} · Open source ↗</span></div></a>`;
  }
  fetch(endpoint, { headers: { accept:'application/json' } }).then(r => { if(!r.ok) throw new Error('Could not load'); return r.json(); }).then(data => {
    const items = Array.isArray(data.items) ? data.items : [];
    list.innerHTML = items.length ? items.map(card).join('') : '<div class="content-loading"><strong>No items available right now.</strong></div>';
    if (updated) updated.textContent = data.updated_at ? `Updated ${dateLabel(data.updated_at)}` : '';
  }).catch(() => { list.innerHTML='<div class="content-loading"><strong>Source is temporarily unavailable. Try again shortly.</strong></div>'; if(updated) updated.textContent='Source temporarily unavailable'; });
})();