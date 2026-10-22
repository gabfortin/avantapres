(function () {
  'use strict';

  const MONTHS_FR = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  function formatDate(isoMonth) {
    if (!isoMonth) return '';
    const [y, m] = isoMonth.split('-').map(Number);
    if (!m) return String(y);
    return `${MONTHS_FR[m - 1]} ${y}`;
  }

  function clamp01(n) {
    return Math.min(1, Math.max(0, n));
  }

  function leafIconSvg(color) {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4C10 4 4 10 4 18c0 1.1.9 2 2 2 8 0 14-6 14-16Z" fill="${color}"/>
      <path d="M6 20 18 6" stroke="rgba(255,255,255,0.55)" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`;
  }

  function schoolIconSvg(color) {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3 2 8l10 5 10-5-10-5Z" fill="${color}"/>
      <path d="M6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M21 9v5.5" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  }

  function billboardIconSvg(color) {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4.5" width="18" height="10" rx="1.4" fill="${color}"/>
      <path d="M12 14.5V20M8 20h8" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;
  }

  function treeIconSvg(color) {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2 5 12.5h3.2L4 20h7v2h2v-2h7l-4.2-7.5H19L12 2Z" fill="${color}"/>
    </svg>`;
  }

  function pedestrianIconSvg(color) {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="13" cy="3.4" r="2" fill="${color}"/>
      <path d="M10.5 6.2 13.6 6 16 8.3l-1.2 1.3-1.7-1.6-.3 3 2.6 2 1 5.6-1.7.3-.9-4.9-1.7-1.3-.6 1.6.4 5-1.7.2-.5-5.6.9-4.7-1.7 1.6-1.9 2-1-1.3 2.5-2.6Z" fill="${color}"/>
    </svg>`;
  }

  function trafficCalmingIconSvg(color) {
    return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 20 8 5h8l6 15" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M5 20c2-6 5-9 7-9s5 3 7 9" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  const PIN_TYPES = {
    vegetalisation: { icon: leafIconSvg, label: 'Végétalisation', emoji: '🌱' },
    'agrandissement-parc': { icon: treeIconSvg, label: 'Agrandissement de parc', emoji: '🌳' },
    'place-ecole': { icon: schoolIconSvg, label: 'Place-école', emoji: '🎓' },
    'panneau-publicitaire': { icon: billboardIconSvg, label: 'Panneau publicitaire', emoji: '📋' },
    'espace-pieton': { icon: pedestrianIconSvg, label: 'Espace piéton', emoji: '🚶' },
    'apaisement-de-circulation': { icon: trafficCalmingIconSvg, label: 'Apaisement de la circulation', emoji: '🚧' }
  };
  const DEFAULT_PIN_TYPE = 'vegetalisation';

  const AUTHOR_LINKS = {
    'gabriel fortin': 'https://gabfortin.com',
    'alex norris': 'https://projetmontreal.org/equipe/alexander-norris',
    'christopher mccray': 'https://linktr.ee/chrismccray'
  };

  function pinTypeOf(pt) {
    if (pt.type && !PIN_TYPES[pt.type]) {
      console.warn(
        `data/points.json: type "${pt.type}" inconnu pour le point "${pt.id}" ` +
        `(valeurs valides : ${Object.keys(PIN_TYPES).join(', ')}). ` +
        `Affiché en "${DEFAULT_PIN_TYPE}" par défaut.`
      );
    }
    return PIN_TYPES[pt.type] ? pt.type : DEFAULT_PIN_TYPE;
  }

  const state = {
    points: [],
    markers: new Map(),
    activeBorough: 'all',
    activeTypes: new Set(),
    map: null,
    openPoint: null,
    lqip: {}
  };

  function lqipFor(src) {
    return state.lqip[src];
  }

  function progressiveImgAttrs(cls, src, alt) {
    const meta = lqipFor(src);
    const initial = meta ? meta.src : src;
    return `class="${cls} progressive-img" src="${initial}" data-full-src="${src}" alt="${alt}" decoding="async"`;
  }

  function hydrateProgressiveImages(root) {
    root.querySelectorAll('.progressive-img[data-full-src]').forEach((img) => {
      if (img.dataset.hydrating) return;
      img.dataset.hydrating = '1';
      const full = img.dataset.fullSrc;
      const loader = new Image();
      loader.onload = () => {
        img.src = full;
        img.classList.add('loaded');
      };
      loader.onerror = () => img.classList.add('loaded');
      loader.src = full;
    });
  }

  function init() {
    initMap();
    loadPoints();
    wireStaticUI();
  }

  function initMap() {
    state.map = L.map('map', {
      zoomControl: false,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: false
    }).setView([45.5195, -73.5815], 15);

    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    L.control.attribution({ position: 'bottomright' }).addTo(state.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
      maxZoom: 19,
      className: 'map-tiles-muted'
    }).addTo(state.map);
  }

  async function loadPoints() {
    const status = document.getElementById('map-status');
    const statusText = document.getElementById('map-status-text');

    try {
      const [res, lqipRes] = await Promise.all([
        fetch('data/points.json', { cache: 'no-store' }),
        fetch('data/image-lqip.json', { cache: 'no-store' }).catch(() => null)
      ]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (lqipRes && lqipRes.ok) {
        try { state.lqip = await lqipRes.json(); } catch (err) { /* placeholders optional */ }
      }
      const points = await res.json();
      state.points = points;
      renderMarkers(points);
      populateBoroughFilter(points);
      populateTypeSidebar(points);
      updateStats(points);
      status.classList.add('hidden');
      openFromUrl();
    } catch (err) {
      console.error('Impossible de charger data/points.json', err);
      status.classList.remove('hidden');
      status.classList.add('error');
      statusText.textContent = 'Impossible de charger les lieux. ';
      const retry = document.createElement('button');
      retry.className = 'map-status-retry';
      retry.type = 'button';
      retry.textContent = 'Réessayer';
      retry.addEventListener('click', () => {
        status.classList.remove('error');
        statusText.textContent = 'Chargement des lieux…';
        retry.remove();
        loadPoints();
      });
      statusText.after(retry);
    }
  }

  function renderMarkers(points) {
    // Leaflet's popup pane lives inside .leaflet-map-pane, which has its own
    // position+z-index+transform and therefore its own stacking context —
    // no z-index on the popup can ever escape above the floating header,
    // which lives outside that context. Pan the map instead, so a popup
    // never opens underneath the header/sidebar in the first place.
    const headerClearance = Math.ceil(document.querySelector('.site-header').getBoundingClientRect().bottom) + 16;

    points.forEach((pt) => {
      const type = pinTypeOf(pt);
      const icon = L.divIcon({
        className: '',
        html: `<div class="growth-marker type-${type}">
                 <div class="ring"></div>
                 <div class="pin">${PIN_TYPES[type].icon('#ffffff')}</div>
               </div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 30],
        popupAnchor: [0, -28]
      });

      const marker = L.marker([pt.lat, pt.lng], { icon }).addTo(state.map);

      const popupHtml = `
        <div class="popup-card">
          <img ${progressiveImgAttrs('popup-thumb', pt.after.image, pt.title)}>
          <div class="popup-body">
            <h3>${pt.title}</h3>
            <p>${pt.borough}</p>
            <button class="popup-btn type-${type}" type="button" data-open="${pt.id}">
              Voir l'avant / après
            </button>
          </div>
        </div>`;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -4],
        autoPanPaddingTopLeft: L.point(20, headerClearance),
        autoPanPaddingBottomRight: L.point(20, 20)
      });

      marker.on('popupopen', (e) => {
        const el = e.popup.getElement();
        const btn = el.querySelector('[data-open]');
        if (btn) btn.addEventListener('click', () => openDetail(pt.id));
        hydrateProgressiveImages(el);
      });

      state.markers.set(pt.id, { marker, data: pt });
    });
  }

  function populateBoroughFilter(points) {
    const select = document.getElementById('borough-select');
    const boroughs = Array.from(new Set(points.map((p) => p.borough))).sort();
    boroughs.forEach((b) => {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = b;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      state.activeBorough = select.value;
      applyFilter();
    });
  }

  function populateTypeSidebar(points) {
    const list = document.getElementById('type-sidebar-list');
    const typesPresent = Object.keys(PIN_TYPES).filter((key) =>
      points.some((p) => pinTypeOf(p) === key)
    );

    state.activeTypes = new Set(typesPresent);

    typesPresent.forEach((key) => {
      const info = PIN_TYPES[key];
      const count = points.filter((p) => pinTypeOf(p) === key).length;

      const label = document.createElement('label');
      label.className = `type-sidebar-item type-${key}`;
      label.innerHTML = `
        <input type="checkbox" checked data-type="${key}">
        <span class="type-sidebar-swatch">${info.icon('#ffffff')}</span>
        <span class="type-sidebar-label">${info.label}</span>
        <span class="type-sidebar-count">${count}</span>
      `;
      list.appendChild(label);
    });

    list.addEventListener('change', (e) => {
      const checkbox = e.target.closest('input[data-type]');
      if (!checkbox) return;
      const type = checkbox.dataset.type;
      const item = checkbox.closest('.type-sidebar-item');
      if (checkbox.checked) {
        state.activeTypes.add(type);
        item.classList.remove('disabled');
      } else {
        state.activeTypes.delete(type);
        item.classList.add('disabled');
      }
      applyFilter();
    });
  }

  function applyFilter() {
    state.markers.forEach(({ marker, data }) => {
      const boroughMatch = state.activeBorough === 'all' || data.borough === state.activeBorough;
      const typeMatch = state.activeTypes.has(pinTypeOf(data));
      const show = boroughMatch && typeMatch;
      const has = state.map.hasLayer(marker);
      if (show && !has) marker.addTo(state.map);
      if (!show && has) state.map.removeLayer(marker);
    });
  }

  function updateStats(points) {
    document.getElementById('stat-count').textContent = points.length;
    const boroughs = new Set(points.map((p) => p.borough));
    document.getElementById('stat-boroughs').textContent = boroughs.size;
  }

  const MISSION_BANNER_KEY = 'avantapres:mission-banner-dismissed';

  function wireMissionBanner() {
    const banner = document.getElementById('mission-banner');
    if (!banner) return;

    try {
      if (localStorage.getItem(MISSION_BANNER_KEY)) {
        banner.classList.add('hidden');
        return;
      }
    } catch (err) { /* localStorage indisponible (navigation privée, etc.) */ }

    document.getElementById('mission-banner-close').addEventListener('click', () => {
      banner.classList.add('hidden');
      try { localStorage.setItem(MISSION_BANNER_KEY, '1'); } catch (err) { /* ignore */ }
    });
  }

  function wireAboutModal() {
    const overlay = document.getElementById('about-overlay');
    const openBtn = document.getElementById('about-btn');
    const closeBtn = document.getElementById('about-modal-close');
    if (!overlay || !openBtn) return;

    function open() { overlay.classList.add('open'); }
    function close() { overlay.classList.remove('open'); }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  }

  function wireStaticUI() {
    wireMissionBanner();
    wireAboutModal();

    const toast = document.getElementById('intro-toast');
    setTimeout(() => toast && toast.classList.add('hidden'), 7000);

    document.getElementById('detail-close').addEventListener('click', closeDetail);
    document.getElementById('detail-close-mobile').addEventListener('click', closeDetail);
    document.getElementById('overlay-scrim').addEventListener('click', closeDetail);
    document.getElementById('detail-share').addEventListener('click', shareCurrent);

    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('type-sidebar-close').addEventListener('click', closeSidebar);
    document.getElementById('type-sidebar-scrim').addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeDetail();
        closeSidebar();
      }
    });
  }

  function isMobileLayout() {
    return window.matchMedia('(max-width: 760px)').matches;
  }

  function openSidebar() {
    if (isMobileLayout()) {
      document.getElementById('type-sidebar').classList.add('open');
      document.getElementById('type-sidebar-scrim').classList.add('open');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    document.getElementById('sidebar-toggle').setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    if (isMobileLayout()) {
      document.getElementById('type-sidebar').classList.remove('open');
      document.getElementById('type-sidebar-scrim').classList.remove('open');
    } else {
      document.body.classList.add('sidebar-collapsed');
    }
    document.getElementById('sidebar-toggle').setAttribute('aria-expanded', 'false');
  }

  function toggleSidebar() {
    const isOpen = isMobileLayout()
      ? document.getElementById('type-sidebar').classList.contains('open')
      : !document.body.classList.contains('sidebar-collapsed');
    if (isOpen) closeSidebar();
    else openSidebar();
  }

  const URL_PARAM = 'lieu';
  const DEFAULT_TITLE = document.title;

  function pointUrl(id) {
    const url = new URL(window.location.href);
    url.hash = '';
    if (id) url.searchParams.set(URL_PARAM, id);
    else url.searchParams.delete(URL_PARAM);
    return url.toString();
  }

  // Lien partagé : la page statique lieu/<id>/ porte l'aperçu (image, titre)
  // propre au lieu pour les réseaux sociaux, puis redirige vers ?lieu=<id>.
  function shareUrl(id) {
    return new URL(`lieu/${encodeURIComponent(id)}/`, window.location.href.split(/[?#]/)[0]).toString();
  }

  function syncUrl(id) {
    const next = pointUrl(id);
    if (next !== window.location.href) history.replaceState(null, '', next);
  }

  function openFromUrl() {
    const id = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (!id) return;
    const entry = state.markers.get(id);
    if (!entry) {
      syncUrl(null);
      return;
    }
    state.map.setView(entry.marker.getLatLng(), 17, { animate: false });
    openDetail(id);
  }

  async function shareCurrent() {
    const pt = state.openPoint;
    if (!pt) return;
    const url = shareUrl(pt.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${pt.title} — Avant / Après`, url });
      } catch (err) { /* partage annulé */ }
      return;
    }
    const btn = document.getElementById('detail-share');
    const label = btn.querySelector('.detail-share-label');
    try {
      await navigator.clipboard.writeText(url);
      label.textContent = 'Lien copié !';
    } catch (err) {
      window.prompt('Copiez ce lien :', url);
      return;
    }
    clearTimeout(btn._resetTimer);
    btn._resetTimer = setTimeout(() => { label.textContent = 'Partager'; }, 2000);
  }

  function openDetail(id) {
    const entry = state.markers.get(id);
    if (!entry) return;
    const pt = entry.data;
    state.openPoint = pt;
    syncUrl(pt.id);
    document.title = `${pt.title} — Avant / Après`;

    const panel = document.getElementById('detail-panel');
    const scrim = document.getElementById('overlay-scrim');

    const type = pinTypeOf(pt);
    const eyebrow = document.getElementById('detail-eyebrow');
    eyebrow.textContent = `${PIN_TYPES[type].emoji} ${PIN_TYPES[type].label}`;
    eyebrow.className = `detail-eyebrow type-${type}`;

    document.getElementById('detail-title').textContent = pt.title;
    document.getElementById('detail-borough').textContent = pt.borough;
    document.getElementById('detail-desc').textContent = pt.description;
    document.getElementById('meta-before-date').textContent = formatDate(pt.before.date);
    document.getElementById('meta-after-date').textContent = formatDate(pt.after.date);

    const authorRow = document.getElementById('meta-author-row');
    if (pt.author) {
      const authorEl = document.getElementById('meta-author');
      const href = AUTHOR_LINKS[pt.author.trim().toLowerCase()];
      authorEl.textContent = '';
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = pt.author;
        authorEl.appendChild(link);
      } else {
        authorEl.textContent = pt.author;
      }
      authorRow.style.display = '';
    } else {
      authorRow.style.display = 'none';
    }

    const sliderRoot = document.getElementById('ba-slider');
    buildSlider(sliderRoot, pt);

    panel.classList.add('open');
    scrim.classList.add('open');

    const toast = document.getElementById('intro-toast');
    if (toast) toast.classList.add('hidden');
  }

  function closeDetail() {
    if (state.openPoint) {
      state.openPoint = null;
      syncUrl(null);
      document.title = DEFAULT_TITLE;
    }
    document.getElementById('detail-panel').classList.remove('open');
    document.getElementById('overlay-scrim').classList.remove('open');
  }

  const BADGE_FADE_RANGE = 40;

  function buildSlider(root, pt, opts = {}) {
    if (root._sliderAbort) root._sliderAbort.abort();

    const showFullscreenBtn = !opts.isFullscreen;
    root.innerHTML = `
      <img ${progressiveImgAttrs('ba-img ba-after', pt.after.image, `Après — ${pt.title}`)}>
      <img class="ba-watermark" src="assets/img/pm.png" alt="" aria-hidden="true">
      <img ${progressiveImgAttrs('ba-img ba-before', pt.before.image, `Avant — ${pt.title}`)}>
      <span class="ba-badge ba-badge-before">Avant · ${formatDate(pt.before.date)}</span>
      <span class="ba-badge ba-badge-after">Après · ${formatDate(pt.after.date)}</span>
      <div class="ba-handle">
        <div class="ba-handle-line"></div>
        <div class="ba-handle-circle">
          <svg viewBox="0 0 24 24" fill="none"><path d="M8 6 3 12l5 6M16 6l5 6-5 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
      </div>
      ${showFullscreenBtn ? `<button class="ba-fullscreen-btn" aria-label="Plein écran">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
        </svg>
      </button>` : ''}`;

    const before = root.querySelector('.ba-before');
    const handle = root.querySelector('.ba-handle');
    const badgeBefore = root.querySelector('.ba-badge-before');
    const badgeAfter = root.querySelector('.ba-badge-after');

    let rect = null;
    let brWidth = 0;
    let arWidth = 0;
    let pendingPct = null;
    let rafId = null;
    let currentPct = 50;

    function measure() {
      rect = root.getBoundingClientRect();
      brWidth = badgeBefore.getBoundingClientRect().width;
      arWidth = badgeAfter.getBoundingClientRect().width;
    }

    function applyPosition(pct) {
      currentPct = Math.min(100, Math.max(0, pct));
      before.style.clipPath = `inset(0 ${100 - currentPct}% 0 0)`;
      handle.style.left = `${currentPct}%`;

      // Fade each date badge out over BADGE_FADE_RANGE px as the handle
      // approaches/covers it, instead of snapping to hidden at a fixed point.
      const handleX = rect.width * currentPct / 100;
      const beforeSafe = brWidth + 12;
      const afterSafe = rect.width - arWidth - 12;
      badgeBefore.style.opacity = String(clamp01((handleX - beforeSafe) / BADGE_FADE_RANGE));
      badgeAfter.style.opacity = String(clamp01((afterSafe - handleX) / BADGE_FADE_RANGE));
    }

    function setPosition(pct) {
      measure();
      applyPosition(pct);
    }

    function onResize() {
      measure();
      applyPosition(currentPct);
    }

    function schedulePosition(pct) {
      pendingPct = pct;
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (pendingPct !== null) applyPosition(pendingPct);
      });
    }

    function pctFromClientX(clientX) {
      return ((clientX - rect.left) / rect.width) * 100;
    }

    const ac = new AbortController();
    const { signal } = ac;
    root._sliderAbort = ac;

    function onPointerDown(e) {
      // Pointer capture retargets the subsequent click to `root`, so a press
      // starting on the fullscreen button would never reach its own click
      // handler — let that button handle its own clicks instead of starting
      // a drag.
      if (e.target.closest('.ba-fullscreen-btn')) return;

      root.setPointerCapture(e.pointerId);
      measure();
      applyPosition(pctFromClientX(e.clientX));
      root.addEventListener('pointermove', onPointerMove, { signal });
      root.addEventListener('pointerup', onPointerUp, { signal });
      root.addEventListener('pointercancel', onPointerUp, { signal });
    }

    function onPointerMove(e) {
      schedulePosition(pctFromClientX(e.clientX));
    }

    function onPointerUp(e) {
      root.releasePointerCapture(e.pointerId);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerUp);
    }

    root.addEventListener('pointerdown', onPointerDown, { signal });
    window.addEventListener('resize', onResize, { signal });

    signal.addEventListener('abort', () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    });

    if (showFullscreenBtn) {
      root.querySelector('.ba-fullscreen-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openFullscreenSlider(pt);
      }, { signal });
    }

    setPosition(50);
    hydrateProgressiveImages(root);

    if (opts.isFullscreen) applyFullscreenFit(root, pt);
    else applyCombinedAspectRatio(root, pt);
  }

  // Match the container to the smaller photo's format so both images share
  // the same crop shape — the larger one gets cropped (via object-fit:
  // cover) to fit, the smaller one is never touched.
  function smallerDimsRatio(afterDim, beforeDim) {
    if (!afterDim || !beforeDim) return null;
    const afterArea = afterDim.w * afterDim.h;
    const beforeArea = beforeDim.w * beforeDim.h;
    const smaller = afterArea <= beforeArea ? afterDim : beforeDim;
    return smaller.w / smaller.h;
  }

  function smallerImageRatio(afterEl, beforeEl) {
    if (!afterEl.naturalWidth || !beforeEl.naturalWidth) return null;
    return smallerDimsRatio(
      { w: afterEl.naturalWidth, h: afterEl.naturalHeight },
      { w: beforeEl.naturalWidth, h: beforeEl.naturalHeight }
    );
  }

  // Resolves the comparison aspect ratio instantly from the LQIP manifest
  // (which already knows each photo's real dimensions) when available,
  // falling back to waiting on the actual <img> elements otherwise.
  function resolveComparisonRatio(root, pt, cb) {
    const ratio = smallerDimsRatio(lqipFor(pt.after.image), lqipFor(pt.before.image));
    if (ratio) { cb(ratio); return; }

    const afterEl = root.querySelector('.ba-after');
    const beforeEl = root.querySelector('.ba-before');
    function update() {
      const r = smallerImageRatio(afterEl, beforeEl);
      if (r) cb(r);
    }
    [afterEl, beforeEl].forEach((img) => {
      if (img.complete) update();
      else img.addEventListener('load', update, { once: true });
    });
  }

  function applyCombinedAspectRatio(root, pt) {
    resolveComparisonRatio(root, pt, (ratio) => {
      root.style.aspectRatio = String(ratio);
    });
  }

  function applyFullscreenFit(root, pt) {
    resolveComparisonRatio(root, pt, (ratio) => {
      const isMobile = window.innerWidth <= 760;
      const maxWidth = isMobile
        ? window.innerWidth * 0.96
        : Math.min(window.innerWidth * 0.92, 1100);
      const maxHeight = isMobile
        ? Math.min(window.innerHeight * 0.6, 420)
        : Math.min(window.innerHeight * 0.8, 820);

      let width = maxWidth;
      let height = width / ratio;
      if (height > maxHeight) {
        height = maxHeight;
        width = height * ratio;
      }

      root.style.width = `${Math.round(width)}px`;
      root.style.height = `${Math.round(height)}px`;

      // The slider was measured (handle position, badge fade) at its
      // pre-fit size — often 0×0, before this explicit width/height landed.
      // Re-trigger that measurement now that the real box size is known.
      window.dispatchEvent(new Event('resize'));
    });
  }

  function openFullscreenSlider(pt) {
    const overlay = document.createElement('div');
    overlay.className = 'ba-fullscreen-overlay';
    overlay.innerHTML = `
      <div class="ba-fullscreen-inner">
        <div class="ba-slider ba-slider-fs"></div>
        <div class="ba-fullscreen-title">${pt.title}</div>
        <button class="ba-fullscreen-close" aria-label="Fermer">✕</button>
      </div>`;
    document.body.appendChild(overlay);

    const sliderRoot = overlay.querySelector('.ba-slider-fs');
    buildSlider(sliderRoot, pt, { isFullscreen: true });

    function close() {
      if (sliderRoot._sliderAbort) sliderRoot._sliderAbort.abort();
      overlay.classList.remove('open');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      document.removeEventListener('keydown', onKey);
    }

    function onKey(e) { if (e.key === 'Escape') close(); }

    overlay.querySelector('.ba-fullscreen-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(() => overlay.classList.add('open'));
  }

  document.addEventListener('DOMContentLoaded', init);
})();
