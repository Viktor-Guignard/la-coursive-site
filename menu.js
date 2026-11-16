/* La carte de la Coursive sur le site vitrine : lit la version PUBLIÉE sur la plateforme
   Vikto Labs (carte.vikto-labs.fr/la-coursive/published.json, CORS ouvert), carte « carte » (cuisine). */

const RAW = 'https://carte.vikto-labs.fr/la-coursive/published.json';
const PUBLIC_MENU_URL = 'https://carte.vikto-labs.fr/la-coursive';
const CARTE_ASSET_BASE = 'https://carte.vikto-labs.fr/la-coursive/';
/* Prix à l'écran : « 23 » sur la carte imprimée → « 23€ » ici, comme les autres cartes. */
function webPrice(p) { p = String(p || '').trim(); return p && !/€/.test(p) && /\d$/.test(p) ? p + '€' : p; }

function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
function assetUrl(src){ return src && !/^https?:/.test(src) ? CARTE_ASSET_BASE + src : (src||''); }

const TAG_ICONS = {
  veg:  { key:'icon-veg.svg',  label:'Végétarien' },
  spec: { key:'icon-spec.svg', label:'Spécialité de la maison' },
};

/* langue des textes de recherche : la carte est bilingue FR / EN */
const NAV_LANG = (() => { const l = (navigator.languages && navigator.languages[0]) || navigator.language || 'fr'; return /^fr/i.test(l) ? 'fr' : 'en'; })();

function renderMenu(blocks, updatedAt){
  const mount = document.getElementById('menuMount');
  mount.innerHTML = '';
  /* recherche dans la carte et puces des catégories (menu-nav.js) */
  const nav = window.MenuNav ? window.MenuNav.create({ lang: NAV_LANG, mount }) : null;
  if(nav) mount.append(nav.search, nav.chips);
  const cols = document.createElement('div');
  cols.className = 'menu-cols';
  mount.appendChild(cols);
  let section = null;
  const sections = [], entries = [];
  let group = 0, groupTitle = '', groupHay = '';  // le titre de la catégorie compte aussi
  const index = (el, ...texts) => entries.push({ group, title: groupTitle, hay: texts.concat(groupHay).filter(Boolean).join(' '), el });
  const openSection = (html) => { section = document.createElement('div'); section.className='menu-section'; if(html) section.innerHTML=html; cols.appendChild(section); };
  openSection('');

  (blocks||[]).forEach(b => {
    if(b.hidden) return;   // plat masqué temporairement : jamais affiché côté client
    switch(b.type){
      case 'section':
        openSection(`<h3>${esc(b.fr)}${b.en!=null&&b.en!=='' ? ' <span class="en">/ '+esc(b.en)+'</span>' : ''}</h3>`);
        sections.push({ label: String((NAV_LANG === 'en' && b.en) || b.fr || ''), el: section });
        group++; groupTitle = section.firstChild ? section.firstChild.innerHTML : ''; groupHay = [b.fr, b.en].filter(Boolean).join(' ');
        break;
      case 'item': {
        const el = document.createElement('div'); el.className='menu-item';
        const tags = (b.tags||[]).map(t => TAG_ICONS[t] ? `<img class="item-tag" src="${assetUrl('assets/'+TAG_ICONS[t].key)}" alt="${TAG_ICONS[t].label}" title="${TAG_ICONS[t].label}">` : '').join('');
        el.innerHTML = `<div class="n">${esc(b.fr)}${tags}${b.en?'<span class="en">'+esc(b.en)+'</span>':''}</div><div class="dots"></div>${b.price?'<div class="p'+(String(webPrice(b.price)).length>10?' long':'')+'">'+esc(webPrice(b.price))+'</div>':''}`;
        section.appendChild(el);
        index(el, b.fr, b.en, b.desc, b.sub);
        break;
      }
      case 'formule': {
        const el = document.createElement('div'); el.className='menu-formule'+(b.heading?' heading':''); el.textContent=b.text;
        if(b.color) el.style.color = b.color;
        section.appendChild(el);
        index(el, b.text);
        break;
      }
      case 'note': {
        const el = document.createElement('div'); el.className='menu-note'; el.textContent=b.text; section.appendChild(el); break;
      }
      case 'image': {
        const el = document.createElement('div'); el.className='menu-image';
        el.innerHTML = `<img src="${assetUrl(b.src)}" style="width:${b.widthPct||45}%" alt="">`;
        section.appendChild(el); break;
      }
    }
  });

  if(nav){
    mount.appendChild(nav.results);
    nav.setSections(sections);
    nav.setIndex(entries);
  }

  const dEl = document.getElementById('carteDate');
  if(dEl && updatedAt){ const d=new Date(updatedAt); if(!isNaN(d)) dEl.textContent = ' — mise à jour le '+d.toLocaleDateString('fr-FR'); }
}

(async function loadMenu(){
  const mount = document.getElementById('menuMount');
  try{
    const res = await fetch(RAW + '?t=' + Date.now(), { cache:'no-store' });
    if(!res.ok) throw new Error('published ' + res.status);
    const pub = await res.json();
    const carte = (pub.menus||[]).find(m => m.key === 'carte');
    if(!carte || !(carte.blocks||[]).length) throw new Error('carte non publiée');
    renderMenu(carte.blocks, pub.updatedAt);
  }catch(err){
    console.warn('carte indisponible', err);
    mount.innerHTML = `<div class="menu-error">La carte complète est disponible ici :<br>
      <a href="${PUBLIC_MENU_URL}" target="_blank" rel="noopener">Voir la carte ↗</a></div>`;
  }
})();
