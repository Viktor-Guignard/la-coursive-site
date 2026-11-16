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
  /* langue : celle du site (site-i18n.js : FR · EN · ES · RU, sélecteur dans la barre du haut) ;
     les traductions des plats sont stockées dans la carte et lues par l'i18n.js de
     carte.vikto-labs.fr (window.CarteI18n). Les textes autour de la carte (titre, note…)
     sont traduits par site-i18n.js. */
  const I18N = window.CarteI18n;
  const SITE = window.SiteI18n;
  let LANG = SITE ? SITE.lang : (I18N ? I18N.preferred() : 'fr');
  let lastPub = null, activeKey = null, nav = null, lastQuery = '';
  const PRICE = p => I18N ? I18N.price(p) : p;
  const T = (k, fr) => SITE ? SITE.t(k) : fr;

  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  const TAG_ICONS = {
    veg:   { key: 'icon-veg.svg',   label: 'Végétarien' },
    gf:    { key: 'icon-gf.svg',    label: 'Sans gluten' },
    new:   { key: 'icon-new.svg',   label: 'Nouveauté' },
    coeur: { key: 'icon-coeur.svg', label: 'Coup de cœur' },
  };
  const tags = b => (b.tags || []).map(t => TAG_ICONS[t]
    ? `<img class="item-tag${t === 'new' ? ' tag-new' : ''}" src="${ASSET_BASE}assets/${TAG_ICONS[t].key}" alt="${I18N ? I18N.ui(LANG, t) : TAG_ICONS[t].label}" title="${I18N ? I18N.ui(LANG, t) : TAG_ICONS[t].label}">` : '').join('');

  /* rend une carte ; renvoie aussi ses catégories (puces) et ses lignes cherchables (recherche) */
  function renderMenu(blocks, menuKey, tabLabel, showTab) {
    const cols = document.createElement('div');
    cols.className = 'menu-cols' + ((blocks || []).filter(b => b.type === 'section').length > 8 ? ' one-col' : '');
    let section = null, wineCols = ['37,5 cl', '50 cl', '75 cl', '150 cl'];
    const sections = [], entries = [];
    let group = menuKey + ':0', groupTitle = showTab ? esc(tabLabel) : '', nGroup = 0, groupHay = '';  // le titre de la catégorie compte aussi (« pizza » → Nos pizzas)
    const open = html => { section = document.createElement('div'); section.className = 'menu-section'; if (html) section.innerHTML = html; cols.appendChild(section); };
    const add = el => { if (!section) open(''); section.appendChild(el); };
    const div = (cls, html) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; return el; };
    const index = (el, ...texts) => entries.push({ group, title: groupTitle, hay: texts.concat(groupHay).filter(Boolean).join(' '), el });

    (blocks || []).forEach(b0 => {
      if (b0.hidden) return;              // plat masqué temporairement : jamais affiché
      const b = I18N ? I18N.view(b0, LANG) : b0;
      if (b.__skip) return;
      switch (b.type) {
        case 'section':
          open(`<h3>${esc(b.fr)}${tags(b)}</h3>`);
          sections.push({ label: String(b.fr || ''), el: section });
          group = menuKey + ':' + (++nGroup);
          groupTitle = (b.fr ? esc(b.fr) : '') + (showTab ? `${b.fr ? ' ' : ''}<span class="tab">${b.fr ? '· ' : ''}${esc(tabLabel)}</span>` : '');
          groupHay = [b.fr, b0.fr].filter(Boolean).join(' ');
          break;
        case 'item': {
          const lines = [b.desc, b.sub].filter(Boolean).map(t => `<span class="sub">${esc(t)}</span>`).join('');
          const el = div('menu-item', `<div class="n">${esc(b.fr)}${tags(b)}${lines}${b.en ? '<span class="en">' + esc(b.en) + '</span>' : ''}</div><div class="dots"></div>${b.price ? '<div class="p' + (String(PRICE(b.price)).length > 10 ? ' long' : '') + '">' + esc(PRICE(b.price)) + '</div>' : ''}`);
          add(el);
          index(el, b.fr, b.desc, b.sub, b.en, b0.fr, b0.desc, b0.sub, b0.en);
          break;
        }
        case 'winehead':
          wineCols = [b.c1, b.c2, b.c3, b.c4];
          break;
        case 'wine': {
          const p = ['p1', 'p2', 'p3', 'p4'].map((f, i) => b[f] ? `<span><small>${esc(wineCols[i] || '')}</small> ${esc(PRICE(b[f]))}</span>` : '').filter(Boolean).join('');
          const el = div('menu-item', `<div class="n">${esc(b.fr)}${tags(b)}${b.desc ? '<span class="sub">' + esc(b.desc) + '</span>' : ''}</div><div class="dots"></div><div class="p wines">${p}</div>`);
          add(el);
          index(el, b.fr, b.desc, b0.fr, b0.desc);
          break;
        }
        case 'formule': {
          const el = div('menu-formule' + (b.heading ? ' heading' : ''), esc(b.text));
          if (b.color) el.style.color = b.color;
          add(el);
          index(el, b.text, b0.text);
          break;
        }
        case 'line': {
          if (b.variant === 'title') open('');
          if (b.variant === 'stars') break;
          const el = div('menu-line v-' + (b.variant || 'main'), esc(b.text) + (b.price ? ' <em>' + esc(PRICE(b.price)) + '</em>' : ''));
          add(el);
          index(el, b.text, b0.text);
          break;
        }
        case 'note':
          add(div('menu-note', esc(b.text)));
          break;
        /* logo, photos, colonnes, bandeaux, en-tête d'affiche : réservés à l'imprimé */
      }
    });
    return { cols, sections, entries };
  }

  function build(pub) {
    lastPub = pub;
    const mount = document.getElementById('menuMount');
    const menus = SHOW.map(k => (pub.menus || []).find(m => m.key === k)).filter(m => m && (m.blocks || []).length);
    if (!menus.length) throw new Error('aucune carte publiée');
    mount.innerHTML = '';
    if (!menus.some(m => m.key === activeKey)) activeKey = menus[0].key;
    /* (la langue se choisit dans la barre du haut, pour tout le site) */
    const tabs = document.createElement('div');
    tabs.className = 'menu-tabs';
    mount.appendChild(tabs);
    /* recherche (toutes les cartes) puis puces des catégories de la carte affichée */
    if (nav) nav.destroy();
    nav = window.MenuNav ? window.MenuNav.create({ lang: LANG, mount, query: lastQuery, onQuery: q => { lastQuery = q; } }) : null;
    if (nav) mount.append(nav.search, nav.chips);
    const rendered = [];
    const panels = menus.map((m, i) => {
      const btn = document.createElement('button');
      const label = I18N ? I18N.menuLabel(m.key, LANG, LABELS[m.key]) : (LABELS[m.key] || m.label || m.key);
      btn.textContent = label;
      btn.className = m.key === activeKey ? 'active' : '';
      tabs.appendChild(btn);
      const r = renderMenu(m.blocks, m.key, label, menus.length > 1);
      rendered.push(r);
      const panel = r.cols;
      panel.style.display = m.key === activeKey ? '' : 'none';
      mount.appendChild(panel);
      btn.addEventListener('click', () => {
        tabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        panels.forEach((p, j) => p.style.display = j === i ? '' : 'none');
        activeKey = m.key;
        if (nav) nav.setSections(r.sections);
      });
      return panel;
    });
    if (menus.length < 2) tabs.style.display = 'none';
    if (nav) {
      mount.appendChild(nav.results);
      nav.setSections(rendered[menus.findIndex(m => m.key === activeKey)].sections);
      nav.setIndex([].concat(...rendered.map(r => r.entries)));
    }
    const dEl = document.getElementById('carteDate');
    if (dEl && pub.updatedAt) { const d = new Date(pub.updatedAt); if (!isNaN(d)) dEl.textContent = T('menu.updated', ' — mise à jour le ') + d.toLocaleDateString(SITE ? SITE.locale : 'fr-FR'); }
  }

  let failed = false;
  function showError() {
    const mount = document.getElementById('menuMount');
    mount.innerHTML = `<div class="menu-error">${esc(T('menu.error', 'La carte complète est disponible ici :'))}<br>
      <a href="${PUBLIC_MENU_URL}?lang=${LANG}" target="_blank" rel="noopener">${esc(T('menu.errorLink', 'Voir la carte ↗'))}</a></div>`;
  }

  /* changement de langue du site : la carte se redessine (onglet et recherche conservés) */
  if (SITE) SITE.onChange(l => {
    LANG = l;
    if (lastPub) { try { build(lastPub); } catch (e) { console.warn('carte indisponible', e); showError(); } }
    else if (failed) showError();
  });

  (async function load() {
    try {
      const res = await fetch(RAW + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('published ' + res.status);
      build(await res.json());
    } catch (err) {
      console.warn('carte indisponible', err);
      failed = true;
      lastPub = null;
      showError();
    }
  })();
})();
