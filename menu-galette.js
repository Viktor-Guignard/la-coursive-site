/* La carte de La Galette sur le site vitrine : lit la version PUBLIÉE
   (published.json servi par carte.vikto-labs.fr, la même que celle du QR code)
   et l'affiche par onglets (La carte · Pizzas · À emporter…), comme la carte de la Coursive. */

(function () {
  const CARTE = 'https://carte.vikto-labs.fr/la-galette';
  const RAW = CARTE + '/published.json';
  const PUBLIC_MENU_URL = CARTE;
  const ASSET_BASE = CARTE + '/';
  /* cartes montrées sur le site, dans cet ordre (les autres restent sur la page du QR) */
  const SHOW = ['carte', 'pizzas', 'emporter'];
  const LABELS = { carte: 'La carte', pizzas: 'Pizzas', emporter: 'À emporter' };
  /* langue du visiteur, parmi celles du restaurant (i18n.js de carte.vikto-labs.fr :
     FR · EN · ES · RU pour La Galette), mémorisée ; traductions stockées dans la carte */
  const I18N = window.CarteI18n;
  let LANG = I18N ? I18N.preferred() : 'fr';
  let lastPub = null, activeKey = null;
  const PRICE = p => I18N ? I18N.price(p) : p;
  /* textes de la section « La carte » du site */
  const PAGE = {
    fr: { kicker: 'La carte', title: 'Savoyard, pizzas, galettes & crêpes', note: 'Carte tenue à jour par la maison', net: 'Prix nets, service compris.', all: 'Ouvrir la carte sur mon téléphone ↗', updated: ' — mise à jour le ' },
    en: { kicker: 'The menu', title: 'Savoyard dishes, pizzas, galettes & crêpes', note: 'Menu kept up to date by the house', net: 'Net prices, service included.', all: 'Open the menu on my phone ↗', updated: ' — updated on ' },
    it: { kicker: 'Il menu', title: 'Cucina savoiarda, pizze, galette e crêpe', note: 'Menu aggiornato dalla casa', net: 'Prezzi netti, servizio incluso.', all: 'Apri il menu sul telefono ↗', updated: ' — aggiornato il ' },
    de: { kicker: 'Die Speisekarte', title: 'Savoyardische Küche, Pizzen, Galettes & Crêpes', note: 'Vom Haus aktuell gehalten', net: 'Nettopreise, Service inbegriffen.', all: 'Speisekarte auf dem Handy öffnen ↗', updated: ' — aktualisiert am ' },
    es: { kicker: 'La carta', title: 'Cocina saboyana, pizzas, galettes y crêpes', note: 'La casa mantiene la carta al día', net: 'Precios netos, servicio incluido.', all: 'Abrir la carta en mi móvil ↗', updated: ' — actualizada el ' },
    ru: { kicker: 'Меню', title: 'Савойская кухня, пицца, галеты и блинчики', note: 'Меню регулярно обновляется рестораном', net: 'Цены указаны с учётом обслуживания.', all: 'Открыть меню на телефоне ↗', updated: ' — обновлено ' },
  };
  const DATE_LOCALES = { fr: 'fr-FR', en: 'en-GB', it: 'it-IT', de: 'de-DE', es: 'es-ES', ru: 'ru-RU' };

  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  const TAG_ICONS = {
    veg:   { key: 'icon-veg.svg',   label: 'Végétarien' },
    gf:    { key: 'icon-gf.svg',    label: 'Sans gluten' },
    new:   { key: 'icon-new.svg',   label: 'Nouveauté' },
    coeur: { key: 'icon-coeur.svg', label: 'Coup de cœur' },
  };
  const tags = b => (b.tags || []).map(t => TAG_ICONS[t]
    ? `<img class="item-tag${t === 'new' ? ' tag-new' : ''}" src="${ASSET_BASE}assets/${TAG_ICONS[t].key}" alt="${I18N ? I18N.ui(LANG, t) : TAG_ICONS[t].label}" title="${I18N ? I18N.ui(LANG, t) : TAG_ICONS[t].label}">` : '').join('');

  function renderMenu(blocks) {
    const cols = document.createElement('div');
    cols.className = 'menu-cols' + ((blocks || []).filter(b => b.type === 'section').length > 8 ? ' one-col' : '');
    let section = null, wineCols = ['37,5 cl', '50 cl', '75 cl', '150 cl'];
    const open = html => { section = document.createElement('div'); section.className = 'menu-section'; if (html) section.innerHTML = html; cols.appendChild(section); };
    const add = el => { if (!section) open(''); section.appendChild(el); };
    const div = (cls, html) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; return el; };

    (blocks || []).forEach(b0 => {
      if (b0.hidden) return;              // plat masqué temporairement : jamais affiché
      const b = I18N ? I18N.view(b0, LANG) : b0;
      if (b.__skip) return;
      switch (b.type) {
        case 'section':
          open(`<h3>${esc(b.fr)}${tags(b)}</h3>`);
          break;
        case 'item': {
          const lines = [b.desc, b.sub].filter(Boolean).map(t => `<span class="sub">${esc(t)}</span>`).join('');
          add(div('menu-item', `<div class="n">${esc(b.fr)}${tags(b)}${lines}${b.en ? '<span class="en">' + esc(b.en) + '</span>' : ''}</div><div class="dots"></div>${b.price ? '<div class="p' + (String(PRICE(b.price)).length > 10 ? ' long' : '') + '">' + esc(PRICE(b.price)) + '</div>' : ''}`));
          break;
        }
        case 'winehead':
          wineCols = [b.c1, b.c2, b.c3, b.c4];
          break;
        case 'wine': {
          const p = ['p1', 'p2', 'p3', 'p4'].map((f, i) => b[f] ? `<span><small>${esc(wineCols[i] || '')}</small> ${esc(PRICE(b[f]))}</span>` : '').filter(Boolean).join('');
          add(div('menu-item', `<div class="n">${esc(b.fr)}${tags(b)}${b.desc ? '<span class="sub">' + esc(b.desc) + '</span>' : ''}</div><div class="dots"></div><div class="p wines">${p}</div>`));
          break;
        }
        case 'formule': {
          const el = div('menu-formule' + (b.heading ? ' heading' : ''), esc(b.text));
          if (b.color) el.style.color = b.color;
          add(el);
          break;
        }
        case 'line':
          if (b.variant === 'title') open('');
          if (b.variant === 'stars') break;
          add(div('menu-line v-' + (b.variant || 'main'), esc(b.text) + (b.price ? ' <em>' + esc(PRICE(b.price)) + '</em>' : '')));
          break;
        case 'note':
          add(div('menu-note', esc(b.text)));
          break;
        /* logo, photos, colonnes, bandeaux, en-tête d'affiche : réservés à l'imprimé */
      }
    });
    return cols;
  }

  function build(pub) {
    lastPub = pub;
    const mount = document.getElementById('menuMount');
    const P = PAGE[LANG] || PAGE.fr;
    document.querySelectorAll('#carte [data-i18n]').forEach(el => { if (P[el.dataset.i18n]) el.textContent = P[el.dataset.i18n]; });
    /* langue de la section (césure, lecteurs d'écran) ; le reste de la page reste en français */
    const sec = document.getElementById('carte');
    if (sec) sec.lang = LANG;
    const menus = SHOW.map(k => (pub.menus || []).find(m => m.key === k)).filter(m => m && (m.blocks || []).length);
    if (!menus.length) throw new Error('aucune carte publiée');
    mount.innerHTML = '';
    if (!menus.some(m => m.key === activeKey)) activeKey = menus[0].key;
    /* drapeaux de langue */
    if (I18N) {
      const langs = document.createElement('div');
      langs.className = 'menu-langs';
      I18N.LANGS.forEach(l => {
        const b = document.createElement('button');
        b.innerHTML = `<span>${l.flag}</span> ${l.short}`;
        b.title = l.label;
        b.className = l.code === LANG ? 'active' : '';
        b.onclick = () => { if (l.code !== LANG) { LANG = l.code; I18N.remember(LANG); build(lastPub); } };
        langs.appendChild(b);
      });
      mount.appendChild(langs);
    }
    const tabs = document.createElement('div');
    tabs.className = 'menu-tabs';
    mount.appendChild(tabs);
    const panels = menus.map((m, i) => {
      const btn = document.createElement('button');
      btn.textContent = I18N ? I18N.menuLabel(m.key, LANG, LABELS[m.key]) : (LABELS[m.key] || m.label || m.key);
      btn.className = m.key === activeKey ? 'active' : '';
      tabs.appendChild(btn);
      const panel = renderMenu(m.blocks);
      panel.style.display = m.key === activeKey ? '' : 'none';
      mount.appendChild(panel);
      btn.addEventListener('click', () => {
        tabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        panels.forEach((p, j) => p.style.display = j === i ? '' : 'none');
        activeKey = m.key;
      });
      return panel;
    });
    if (menus.length < 2) tabs.style.display = 'none';
    const dEl = document.getElementById('carteDate');
    if (dEl && pub.updatedAt) { const d = new Date(pub.updatedAt); if (!isNaN(d)) dEl.textContent = (PAGE[LANG] || PAGE.fr).updated + d.toLocaleDateString(DATE_LOCALES[LANG] || 'fr-FR'); }
  }

  (async function load() {
    const mount = document.getElementById('menuMount');
    try {
      const res = await fetch(RAW + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('published ' + res.status);
      build(await res.json());
    } catch (err) {
      console.warn('carte indisponible', err);
      mount.innerHTML = `<div class="menu-error">La carte complète est disponible ici :<br>
        <a href="${PUBLIC_MENU_URL}" target="_blank" rel="noopener">Voir la carte ↗</a></div>`;
    }
  })();
})();
