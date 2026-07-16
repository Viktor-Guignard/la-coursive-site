/* La carte de la Coursive sur le site vitrine : lit la version PUBLIÉE
   (published.json du repo la-coursive-carte), carte « carte » (cuisine). */

const OWNER = 'Viktor-Guignard', REPO = 'la-coursive-carte', BRANCH = 'main';
const RAW = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/published.json`;
const PUBLIC_MENU_URL = 'https://viktor-guignard.github.io/la-coursive-carte/carte.html';
const CARTE_ASSET_BASE = 'https://viktor-guignard.github.io/la-coursive-carte/';

function esc(s){ const d=document.createElement('div'); d.textContent=s==null?'':s; return d.innerHTML; }
function assetUrl(src){ return src && !/^https?:/.test(src) ? CARTE_ASSET_BASE + src : (src||''); }

const TAG_ICONS = {
  veg:  { key:'icon-veg.svg',  label:'Végétarien' },
  spec: { key:'icon-spec.svg', label:'Spécialité de la maison' },
};

function renderMenu(blocks, updatedAt){
  const mount = document.getElementById('menuMount');
  mount.innerHTML = '';
  const cols = document.createElement('div');
  cols.className = 'menu-cols';
  mount.appendChild(cols);
  let section = null;
  const openSection = (html) => { section = document.createElement('div'); section.className='menu-section'; if(html) section.innerHTML=html; cols.appendChild(section); };
  openSection('');

  (blocks||[]).forEach(b => {
    switch(b.type){
      case 'section':
        openSection(`<h3>${esc(b.fr)}${b.en!=null&&b.en!=='' ? ' <span class="en">/ '+esc(b.en)+'</span>' : ''}</h3>`);
        break;
      case 'item': {
        const el = document.createElement('div'); el.className='menu-item';
        const tags = (b.tags||[]).map(t => TAG_ICONS[t] ? `<img class="item-tag" src="${assetUrl('assets/'+TAG_ICONS[t].key)}" alt="${TAG_ICONS[t].label}" title="${TAG_ICONS[t].label}">` : '').join('');
        el.innerHTML = `<div class="n">${esc(b.fr)}${tags}${b.en?'<span class="en">'+esc(b.en)+'</span>':''}</div><div class="dots"></div>${b.price?'<div class="p">'+esc(b.price)+'</div>':''}`;
        section.appendChild(el); break;
      }
      case 'formule': {
        const el = document.createElement('div'); el.className='menu-formule'+(b.heading?' heading':''); el.textContent=b.text;
        if(b.color) el.style.color = b.color;
        section.appendChild(el); break;
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
