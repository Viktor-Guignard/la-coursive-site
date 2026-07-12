/* La carte, en direct depuis l'éditeur (repo la-coursive-carte).
   Lecture publique — aucune clé nécessaire. */

const CARTE_REPO = 'Viktor-Guignard/la-coursive-carte';
const CARTE_API = `https://api.github.com/repos/${CARTE_REPO}/contents/versions`;
const PDF_FALLBACK = 'https://www.meribel-restaurants.com/images/CARTECOURSIVE_2026.pdf';

function b64ToUtf8(b64){
  const bin = atob(b64.replace(/\n/g,''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}

function esc(s){
  const d = document.createElement('div');
  d.textContent = s == null ? '' : s;
  return d.innerHTML;
}

function renderMenu(blocks, versionName){
  const mount = document.getElementById('menuMount');
  mount.innerHTML = '';
  const cols = document.createElement('div');
  cols.className = 'menu-cols';
  mount.appendChild(cols);
  let section = null;

  const openSection = (titleHtml) => {
    section = document.createElement('div');
    section.className = 'menu-section';
    if(titleHtml) section.innerHTML = titleHtml;
    cols.appendChild(section);
  };
  openSection('');

  blocks.forEach(b => {
    switch(b.type){
      case 'section':
        openSection(`<h3>${esc(b.fr)}${b.en ? ' <span class="en">/ ' + esc(b.en) + '</span>' : ''}</h3>`);
        break;
      case 'item': {
        const el = document.createElement('div');
        el.className = 'menu-item';
        el.innerHTML = `
          <div class="n">${esc(b.fr)}<span class="en">${esc(b.en)}</span></div>
          <div class="dots"></div>
          <div class="p">${esc(b.price)}</div>`;
        section.appendChild(el);
        break;
      }
      case 'formule': {
        const el = document.createElement('div');
        el.className = 'menu-formule' + (b.heading ? ' heading' : '');
        el.textContent = b.text;
        section.appendChild(el);
        break;
      }
      case 'note': {
        const el = document.createElement('div');
        el.className = 'menu-note';
        el.textContent = b.text;
        section.appendChild(el);
        break;
      }
      /* header, divider, pagebreak : sans objet sur le site */
    }
  });

  const m = (versionName || '').match(/^carte_(\d{4})-(\d{2})-(\d{2})/);
  if(m) document.getElementById('carteDate').textContent = ` — dernière mise à jour le ${m[3]}/${m[2]}/${m[1]}`;
}

(async function loadMenu(){
  const mount = document.getElementById('menuMount');
  try{
    const res = await fetch(`${CARTE_API}?t=${Date.now()}`, { headers:{ 'Accept':'application/vnd.github+json' } });
    if(!res.ok) throw new Error('list ' + res.status);
    const items = await res.json();
    const versions = items
      .filter(it => it.type === 'file' && it.name.endsWith('.json'))
      .sort((a,b) => b.name.localeCompare(a.name));
    if(!versions.length) throw new Error('no versions');
    const vres = await fetch(`https://api.github.com/repos/${CARTE_REPO}/contents/${versions[0].path}?t=${Date.now()}`, { headers:{ 'Accept':'application/vnd.github+json' } });
    if(!vres.ok) throw new Error('load ' + vres.status);
    const data = JSON.parse(b64ToUtf8((await vres.json()).content));
    const blocks = Array.isArray(data) ? data : data.blocks;
    renderMenu(blocks, versions[0].name.replace(/\.json$/,''));
  }catch(err){
    console.warn('carte indisponible', err);
    mount.innerHTML = `<div class="menu-error">La carte n'a pas pu être chargée pour le moment.<br>
      <a href="${PDF_FALLBACK}" target="_blank" rel="noopener">Consulter la carte en PDF ↗</a></div>`;
  }
})();
