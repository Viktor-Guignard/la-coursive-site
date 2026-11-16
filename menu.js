/* La carte de la Coursive sur le site vitrine : lit la version PUBLIÉE sur la plateforme
   Vikto Labs (carte.vikto-labs.fr/la-coursive/published.json, CORS ouvert), carte « carte » (cuisine).
   Langue : celle du site (site-i18n.js, FR · EN · ES · RU). En français, la carte bilingue
   (nom français + ligne anglaise) ; dans une autre langue, les traductions publiées avec la carte
   (blocs .tr.en/.tr.es/.tr.ru, lues par l'i18n.js de carte.vikto-labs.fr : window.CarteI18n),
   le français quand une traduction manque. */

(function () {
  const RAW = 'https://carte.vikto-labs.fr/la-coursive/published.json';
  const PUBLIC_MENU_URL = 'https://carte.vikto-labs.fr/la-coursive';
  const CARTE_ASSET_BASE = 'https://carte.vikto-labs.fr/la-coursive/';
  const I18N = window.CarteI18n;
  const SITE = window.SiteI18n;
  let LANG = SITE ? SITE.lang : 'fr';
  const T = (k, fr) => SITE ? SITE.t(k) : fr;

  /* Prix à l'écran : « 23 » sur la carte imprimée → « 23€ » ici, comme les autres cartes ;
     « Petit 17 / Grand 22 » : Petit et Grand dans la langue du site. */
  function webPrice(p) {
    p = String(p || '').trim();
    if (p && !/€/.test(p) && /\d$/.test(p)) p += '€';
    if (LANG !== 'fr') p = p.replace(/\bPetit\b/g, T('menu.size.small', 'Petit')).replace(/\bGrand\b/g, T('menu.size.large', 'Grand'));
    return p;
  }

  function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function assetUrl(src) { return src && !/^https?:/.test(src) ? CARTE_ASSET_BASE + src : (src || ''); }

  const TAG_ICONS = { veg: 'icon-veg.svg', spec: 'icon-spec.svg' };
  const tagLabel = t => t === 'veg' && I18N && LANG !== 'fr' ? I18N.ui(LANG, 'veg') : T('menu.tag.' + t, t === 'veg' ? 'Végétarien' : 'Spécialité de la maison');

  let lastBlocks = null, lastUpdated = null, nav = null, lastQuery = '', failed = false;

  function renderMenu(blocks, updatedAt) {
    lastBlocks = blocks; lastUpdated = updatedAt;
    const mount = document.getElementById('menuMount');
    mount.innerHTML = '';
    /* recherche dans la carte et puces des catégories (menu-nav.js), dans la langue du site */
    if (nav) nav.destroy();
    nav = window.MenuNav ? window.MenuNav.create({ lang: LANG, mount, query: lastQuery, onQuery: q => { lastQuery = q; } }) : null;
    if (nav) mount.append(nav.search, nav.chips);
    const cols = document.createElement('div');
    cols.className = 'menu-cols';
    mount.appendChild(cols);
    let section = null;
    const sections = [], entries = [];
    let group = 0, groupTitle = '', groupHay = '';  // le titre de la catégorie compte aussi
    const index = (el, ...texts) => entries.push({ group, title: groupTitle, hay: texts.concat(groupHay).filter(Boolean).join(' '), el });
    const openSection = (html) => { section = document.createElement('div'); section.className = 'menu-section'; if (html) section.innerHTML = html; cols.appendChild(section); };
    openSection('');

    (blocks || []).forEach(b0 => {
      if (b0.hidden) return;   // plat masqué temporairement : jamais affiché côté client
      /* bloc dans la langue du site (en français : tel quel, avec la ligne anglaise) ;
         pas encore traduit dans cette langue : en français (avec sa ligne anglaise) */
      const translated = LANG === 'fr' || (b0.tr && b0.tr[LANG] && Object.keys(b0.tr[LANG]).some(k => b0.tr[LANG][k]));
      const b = I18N ? I18N.view(b0, translated ? LANG : 'fr') : b0;
      if (b.__skip) return;
      switch (b.type) {
        case 'section':
          openSection(`<h3>${esc(b.fr)}${b.en != null && b.en !== '' ? ' <span class="en">/ ' + esc(b.en) + '</span>' : ''}</h3>`);
          sections.push({ label: String(b.fr || ''), el: section });
          group++; groupTitle = section.firstChild ? section.firstChild.innerHTML : ''; groupHay = [b.fr, b.en, b0.fr, b0.en].filter(Boolean).join(' ');
          break;
        case 'item': {
          const el = document.createElement('div'); el.className = 'menu-item';
          const tags = (b.tags || []).map(t => TAG_ICONS[t] ? `<img class="item-tag" src="${assetUrl('assets/' + TAG_ICONS[t])}" alt="${esc(tagLabel(t))}" title="${esc(tagLabel(t))}">` : '').join('');
          /* hors du français : la description traduite (ligne anglaise imprimée, traduite) */
          const lines = LANG === 'fr' || !translated ? '' : [b.desc, b.sub].filter(Boolean).map(t => `<span class="sub">${esc(t)}</span>`).join('');
          /* « Petit 17 / Grand 22€ » : passe à la ligne au « / » seulement */
          const price = b.price ? webPrice(b.price) : '';
          const priceHtml = price.split(' / ').map(s => '<span class="pp">' + esc(s) + '</span>').join(' / ');
          el.innerHTML = `<div class="n">${esc(b.fr)}${tags}${lines}${b.en ? '<span class="en">' + esc(b.en) + '</span>' : ''}</div><div class="dots"></div>${price ? '<div class="p' + (price.length > 10 ? ' long' : '') + '">' + priceHtml + '</div>' : ''}`;
          section.appendChild(el);
          /* on retrouve un plat aussi par son nom français ou anglais */
          index(el, b.fr, b.en, b.desc, b.sub, b0.fr, b0.en, b0.desc, b0.sub);
          break;
        }
        case 'formule': {
          const el = document.createElement('div'); el.className = 'menu-formule' + (b.heading ? ' heading' : ''); el.textContent = b.text;
          if (b.color) el.style.color = b.color;
          section.appendChild(el);
          index(el, b.text, b0.text);
          break;
        }
        case 'note': {
          const el = document.createElement('div'); el.className = 'menu-note'; el.textContent = b.text; section.appendChild(el); break;
        }
        case 'image': {
          const el = document.createElement('div'); el.className = 'menu-image';
          el.innerHTML = `<img src="${assetUrl(b.src)}" style="width:${b.widthPct || 45}%" alt="">`;
          section.appendChild(el); break;
        }
      }
    });

    if (nav) {
      mount.appendChild(nav.results);
      nav.setSections(sections);
      nav.setIndex(entries);
    }

    const dEl = document.getElementById('carteDate');
    if (dEl && updatedAt) { const d = new Date(updatedAt); if (!isNaN(d)) dEl.textContent = T('menu.updated', ' — mise à jour le ') + d.toLocaleDateString(SITE ? SITE.locale : 'fr-FR'); }
  }

  function showError() {
    const mount = document.getElementById('menuMount');
    mount.innerHTML = `<div class="menu-error">${esc(T('menu.error', 'La carte complète est disponible ici :'))}<br>
      <a href="${PUBLIC_MENU_URL}?lang=${LANG}" target="_blank" rel="noopener">${esc(T('menu.errorLink', 'Voir la carte ↗'))}</a></div>`;
  }

  /* changement de langue du site : la carte se redessine (recherche en cours conservée) */
  if (SITE) SITE.onChange(l => {
    LANG = l;
    if (lastBlocks) { try { renderMenu(lastBlocks, lastUpdated); } catch (e) { console.warn('carte indisponible', e); showError(); } }
    else if (failed) showError();
  });

  (async function loadMenu() {
    try {
      const res = await fetch(RAW + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('published ' + res.status);
      const pub = await res.json();
      const carte = (pub.menus || []).find(m => m.key === 'carte');
      if (!carte || !(carte.blocks || []).length) throw new Error('carte non publiée');
      renderMenu(carte.blocks, pub.updatedAt);
    } catch (err) {
      console.warn('carte indisponible', err);
      failed = true;
      lastBlocks = null;
      showError();
    }
  })();
})();
