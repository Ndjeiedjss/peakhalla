(() => {
  'use strict';

  const config = window.PEAKHALLA_ADS || {};
  const slots = Array.from(document.querySelectorAll('.ph-ad-slot'));
  if (!slots.length) return;

  const provider = String(config.provider || 'off').toLowerCase();
  if (!config.enabled || provider === 'off') {
    slots.forEach((slot) => slot.closest('.ph-ad-wrap')?.setAttribute('hidden', ''));
    return;
  }

  const safeText = (value, fallback = '') => String(value ?? fallback);
  const validUrl = (value) => {
    try {
      const parsed = new URL(String(value), window.location.origin);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
    } catch (_) {
      return '#';
    }
  };

  function sponsorFor(placement) {
    const sponsor = config.sponsor || {};
    return {
      ...(sponsor.default || {}),
      ...((sponsor.placements || {})[placement] || {})
    };
  }

  function renderSponsor(slot) {
    const placement = slot.dataset.adPlacement || 'default';
    const ad = sponsorFor(placement);
    const link = document.createElement('a');
    link.className = 'ph-house-ad';
    link.href = validUrl(ad.url);
    link.target = '_blank';
    link.rel = 'noopener noreferrer sponsored';
    link.setAttribute('aria-label', safeText(ad.title, 'Advertise on PeakHalla'));

    const visual = document.createElement('span');
    visual.className = 'ph-house-ad-visual';
    if (ad.image) {
      visual.classList.add('has-image');
      visual.style.backgroundImage = `url("${String(ad.image).replace(/["\\]/g, '')}")`;
    } else {
      visual.innerHTML = '<b>PH</b><i></i>';
    }

    const copy = document.createElement('span');
    copy.className = 'ph-house-ad-copy';

    const eyebrow = document.createElement('small');
    eyebrow.textContent = safeText(ad.eyebrow, 'ADVERTISING');

    const title = document.createElement('strong');
    title.textContent = safeText(ad.title, 'Advertise on PeakHalla');

    const description = document.createElement('span');
    description.textContent = safeText(ad.description, 'Reach Brawlhalla players and esports fans.');

    copy.append(eyebrow, title, description);

    const cta = document.createElement('span');
    cta.className = 'ph-house-ad-cta';
    cta.innerHTML = `<b>${safeText(ad.cta, 'Book this spot')}</b><i>↗</i>`;

    link.append(visual, copy, cta);
    slot.replaceChildren(link);
    slot.dataset.adState = 'ready';
  }

  let adsenseScriptPromise = null;
  function loadAdSense(client) {
    if (adsenseScriptPromise) return adsenseScriptPromise;
    adsenseScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-peakhalla-adsense]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        if (window.adsbygoogle) resolve();
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.peakhallaAdsense = '1';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return adsenseScriptPromise;
  }

  function validAdSenseClient(value) {
    return /^ca-pub-\d{16}$/.test(String(value || '').trim());
  }

  function validAdSlot(value) {
    return /^\d{6,20}$/.test(String(value || '').trim());
  }

  async function renderAdSense(slot) {
    const placement = slot.dataset.adPlacement || '';
    const adsense = config.adsense || {};
    const client = String(adsense.client || '').trim();
    const adSlot = String((adsense.slots || {})[placement] || '').trim();

    if (!validAdSenseClient(client) || !validAdSlot(adSlot)) {
      renderSponsor(slot);
      return;
    }

    const label = document.createElement('span');
    label.className = 'ph-ad-label';
    label.textContent = 'ADVERTISEMENT';

    const ad = document.createElement('ins');
    ad.className = 'adsbygoogle';
    ad.style.display = 'block';
    ad.dataset.adClient = client;
    ad.dataset.adSlot = adSlot;
    ad.dataset.adFormat = slot.dataset.adFormat === 'rectangle' ? 'rectangle' : 'auto';
    ad.dataset.fullWidthResponsive = 'true';

    slot.replaceChildren(label, ad);
    slot.dataset.adState = 'loading';

    try {
      await loadAdSense(client);
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      slot.dataset.adState = 'ready';
    } catch (_) {
      renderSponsor(slot);
    }
  }

  const renderSlot = (slot) => {
    if (slot.dataset.adState) return;
    if (provider === 'adsense') renderAdSense(slot);
    else renderSponsor(slot);
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        renderSlot(entry.target);
      });
    }, { rootMargin: '500px 0px' });
    slots.forEach((slot) => observer.observe(slot));
  } else {
    slots.forEach(renderSlot);
  }
})();
