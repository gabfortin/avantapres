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

  const PIN_TYPES = {
    vegetalisation: { icon: leafIconSvg, label: 'Végétalisation', emoji: '🌱' },
    'agrandissement-parc': { icon: treeIconSvg, label: 'Agrandissement de parc', emoji: '🌳' },
    'place-ecole': { icon: schoolIconSvg, label: 'Place-école', emoji: '🎓' },
    'panneau-publicitaire': { icon: billboardIconSvg, label: 'Panneau publicitaire', emoji: '📋' }
  };
  const DEFAULT_PIN_TYPE = 'vegetalisation';

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
    map: null
  };

  function init() {
    initMap();
    loadPoints();
    wireStaticUI();
  }

  function initMap() {
    state.map = L.map('map', {
      zoomControl: true,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: true
    }).setView([45.5195, -73.5815], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(state.map);
  }

  async function loadPoints() {
    try {
      const res = await fetch('data/points.json', { cache: 'no-store' });
      const points = await res.json();
      state.points = points;
      renderMarkers(points);
      populateBoroughFilter(points);
      updateStats(points);
    } catch (err) {
      console.error('Impossible de charger data/points.json', err);
    }
  }

  function renderMarkers(points) {
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
          <img class="popup-thumb" src="${pt.after.image}" alt="${pt.title}">
          <div class="popup-body">
            <h3>${pt.title}</h3>
            <p>${pt.borough}</p>
            <button class="popup-btn type-${type}" type="button" data-open="${pt.id}">
              Voir l'avant / après
            </button>
          </div>
        </div>`;

      marker.bindPopup(popupHtml, { closeButton: false, offset: [0, -4] });

      marker.on('popupopen', (e) => {
        const btn = e.popup.getElement().querySelector('[data-open]');
        if (btn) btn.addEventListener('click', () => openDetail(pt.id));
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

  function applyFilter() {
    state.markers.forEach(({ marker, data }) => {
      const show = state.activeBorough === 'all' || data.borough === state.activeBorough;
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

  function wireStaticUI() {
    const toast = document.getElementById('intro-toast');
    setTimeout(() => toast && toast.classList.add('hidden'), 7000);

    document.getElementById('detail-close').addEventListener('click', closeDetail);
    document.getElementById('detail-close-mobile').addEventListener('click', closeDetail);
    document.getElementById('overlay-scrim').addEventListener('click', closeDetail);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDetail();
    });
  }

  function openDetail(id) {
    const entry = state.markers.get(id);
    if (!entry) return;
    const pt = entry.data;

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
      document.getElementById('meta-author').textContent = pt.author;
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
    document.getElementById('detail-panel').classList.remove('open');
    document.getElementById('overlay-scrim').classList.remove('open');
  }

  function buildSlider(root, pt, opts = {}) {
    const showFullscreenBtn = !opts.isFullscreen;
    root.innerHTML = `
      <img class="ba-img ba-after" src="${pt.after.image}" alt="Après — ${pt.title}">
      <img class="ba-img ba-before" src="${pt.before.image}" alt="Avant — ${pt.title}">
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
    let dragging = false;

    function setPosition(pct) {
      const clamped = Math.min(100, Math.max(0, pct));
      before.style.clipPath = `inset(0 ${100 - clamped}% 0 0)`;
      handle.style.left = `${clamped}%`;

      const containerWidth = root.getBoundingClientRect().width;
      const handleX = containerWidth * clamped / 100;
      const rootLeft = root.getBoundingClientRect().left;

      const br = badgeBefore.getBoundingClientRect();
      const ar = badgeAfter.getBoundingClientRect();
      badgeBefore.style.opacity = handleX < br.right - rootLeft ? '0' : '1';
      badgeAfter.style.opacity = handleX > ar.left - rootLeft ? '0' : '1';
    }

    function pctFromEvent(clientX) {
      const rect = root.getBoundingClientRect();
      return ((clientX - rect.left) / rect.width) * 100;
    }

    function onMove(e) {
      if (!dragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(pctFromEvent(clientX));
    }

    function startDrag(e) {
      dragging = true;
      if (e.type === 'mousedown') e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setPosition(pctFromEvent(clientX));
    }

    function stopDrag() { dragging = false; }

    root.addEventListener('mousedown', startDrag);
    root.addEventListener('touchstart', startDrag, { passive: true });

    const ac = new AbortController();
    const { signal } = ac;
    window.addEventListener('mousemove', onMove, { signal });
    window.addEventListener('touchmove', onMove, { passive: true, signal });
    window.addEventListener('mouseup', stopDrag, { signal });
    window.addEventListener('touchend', stopDrag, { signal });

    const observer = new MutationObserver(() => {
      if (!document.body.contains(root)) { ac.abort(); observer.disconnect(); }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    if (showFullscreenBtn) {
      root.querySelector('.ba-fullscreen-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openFullscreenSlider(pt);
      });
    }

    setPosition(50);

    const afterEl = root.querySelector('.ba-after');
    function applyNaturalRatio() {
      if (afterEl.naturalWidth && afterEl.naturalHeight) {
        root.style.aspectRatio = `${afterEl.naturalWidth} / ${afterEl.naturalHeight}`;
      }
    }
    if (afterEl.complete) applyNaturalRatio();
    else afterEl.addEventListener('load', applyNaturalRatio, { once: true });
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

    const afterEl = sliderRoot.querySelector('.ba-after');
    function applyRatio() {
      if (afterEl.naturalWidth && afterEl.naturalHeight) {
        sliderRoot.style.aspectRatio = `${afterEl.naturalWidth} / ${afterEl.naturalHeight}`;
      }
    }
    if (afterEl.complete) applyRatio();
    else afterEl.addEventListener('load', applyRatio, { once: true });

    function close() {
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
