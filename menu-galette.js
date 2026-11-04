/* La carte de La Galette sur le site vitrine : lit la version PUBLIÉE
   (published.json du repo La-galette) et l'affiche par onglets
   (La carte · Pizzas · À emporter…), comme la carte de la Coursive. */

(function () {
  const OWNER = 'Viktor-Guignard', REPO = 'La-galette', BRANCH = 'main';
  const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/published.json`;
  const PUBLIC_MENU_URL = 'https://viktor-guignard.github.io/La-galette/carte.html';
  const ASSET_BASE = 'https://viktor-guignard.github.io/La-galette/';
  /* cartes montrées sur le site, dans cet ordre (les autres restent sur la page du QR) */
  const SHOW = ['carte', 'pizzas', 'emporter'];
  const LABELS = { carte: 'La carte', pizzas: 'Pizzas', emporter: 'À emporter' };

  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  const TAG_ICONS = {
    veg:   { key: 'icon-veg.svg',   label: 'Végétarien' },
    gf:    { key: 'icon-gf.svg',    label: 'Sans gluten' },
    new:   { key: 'icon-new.svg',   label: 'Nouveauté' },
    coeur: { key: 'icon-coeur.svg', label: 'Coup de cœur' },
  };
  const tags = b => (b.tags || []).map(t => TAG_ICONS[t]
    ? `<img class="item-tag${t === 'new' ? ' tag-new' : ''}" src="${ASSET_BASE}assets/${TAG_ICONS[t].key}" alt="${TAG_ICONS[t].label}" title="${TAG_ICONS[t].label}">` : '').join('');

  function renderMenu(blocks) {
    const cols = document.createElement('div');
    cols.className = 'menu-cols';
    let section = null, wineCols = ['37,5 cl', '50 cl', '75 cl', '150 cl'];
    const open = html => { section = document.createElement('div'); section.className = 'menu-section'; if (html) section.innerHTML = html; cols.appendChild(section); };
    const add = el => { if (!section) open(''); section.appendChild(el); };
    const div = (cls, html) => { const el = document.createElement('div'); el.className = cls; el.innerHTML = html; return el; };

    (blocks || []).forEach(b => {
      if (b.hidden) return;              // plat masqué temporairement : jamais affiché
      switch (b.type) {
        case 'section':
          open(`<h3>${esc(b.fr)}${tags(b)}</h3>`);
          break;
        case 'item': {
          const lines = [b.desc, b.sub].filter(Boolean).map(t => `<span class="sub">${esc(t)}</span>`).join('');
          add(div('menu-item', `<div class="n">${esc(b.fr)}${tags(b)}${lines}${b.en ? '<span class="en">' + esc(b.en) + '</span>' : ''}</div><div class="dots"></div>${b.price ? '<div class="p">' + esc(b.price) + '</div>' : ''}`));
          break;
        }
        case 'winehead':
          wineCols = [b.c1, b.c2, b.c3, b.c4];
          break;
        case 'wine': {
          const p = ['p1', 'p2', 'p3', 'p4'].map((f, i) => b[f] ? `<span><small>${esc(wineCols[i] || '')}</small> ${esc(b[f])}</span>` : '').filter(Boolean).join('');
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
          add(div('menu-line v-' + (b.variant || 'main'), esc(b.text) + (b.price ? ' <em>' + esc(b.price) + '</em>' : '')));
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
    const mount = document.getElementById('menuMount');
    const menus = SHOW.map(k => (pub.menus || []).find(m => m.key === k)).filter(m => m && (m.blocks || []).length);
    if (!menus.length) throw new Error('aucune carte publiée');
    mount.innerHTML = '';
    const tabs = document.createElement('div');
    tabs.className = 'menu-tabs';
    mount.appendChild(tabs);
    const panels = menus.map((m, i) => {
      const btn = document.createElement('button');
      btn.textContent = LABELS[m.key] || m.label || m.key;
      btn.className = i === 0 ? 'active' : '';
      tabs.appendChild(btn);
      const panel = renderMenu(m.blocks);
      panel.style.display = i === 0 ? '' : 'none';
      mount.appendChild(panel);
      btn.addEventListener('click', () => {
        tabs.querySelectorAll('button').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        panels.forEach((p, j) => p.style.display = j === i ? '' : 'none');
      });
      return panel;
    });
    if (menus.length < 2) tabs.style.display = 'none';
    const dEl = document.getElementById('carteDate');
    if (dEl && pub.updatedAt) { const d = new Date(pub.updatedAt); if (!isNaN(d)) dEl.textContent = ' — mise à jour le ' + d.toLocaleDateString('fr-FR'); }
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
