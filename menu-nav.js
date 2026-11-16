/* Navigation dans la carte du site vitrine (La Coursive et La Galette) :
   un champ de recherche (toutes les cartes, sans tenir compte des accents ni des majuscules)
   et une rangée de puces, une par catégorie de la carte affichée, qui suit le défilement.
   Utilisé par menu.js et menu-galette.js : window.MenuNav.create({...}). */

(function () {
  const TEXTS = {
    fr: { search: 'Rechercher un plat…', label: 'Rechercher dans la carte', clear: 'Effacer la recherche', none: 'Aucun résultat', cats: 'Catégories de la carte', count: n => n + (n > 1 ? ' résultats' : ' résultat') },
    en: { search: 'Search for a dish…', label: 'Search the menu', clear: 'Clear search', none: 'No results', cats: 'Menu categories', count: n => n + (n > 1 ? ' results' : ' result') },
    it: { search: 'Cerca un piatto…', label: 'Cerca nel menu', clear: 'Cancella la ricerca', none: 'Nessun risultato', cats: 'Categorie del menu', count: n => n + (n > 1 ? ' risultati' : ' risultato') },
    de: { search: 'Gericht suchen…', label: 'Speisekarte durchsuchen', clear: 'Suche löschen', none: 'Keine Ergebnisse', cats: 'Kategorien der Speisekarte', count: n => n + (n > 1 ? ' Ergebnisse' : ' Ergebnis') },
    es: { search: 'Buscar un plato…', label: 'Buscar en la carta', clear: 'Borrar la búsqueda', none: 'Sin resultados', cats: 'Categorías de la carta', count: n => n + (n > 1 ? ' resultados' : ' resultado') },
    ru: { search: 'Найти блюдо…', label: 'Поиск по меню', clear: 'Очистить поиск', none: 'Ничего не найдено', cats: 'Разделы меню', count: n => 'Найдено: ' + n },
  };

  /* texte comparable : minuscules, sans accents (é → e, ё → е), ligatures dépliées */
  function norm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[\s ]+/g, ' ').trim();
  }
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* « instant » et non « auto » : html{scroll-behavior:smooth} rendrait « auto » animé */
  const scrollMode = () => reduceMotion() ? 'instant' : 'smooth';
  const navHeight = () => { const n = document.getElementById('nav'); return n ? n.getBoundingClientRect().height : 0; };
  let uid = 0;

  function create(opts) {
    const T = TEXTS[opts.lang] || TEXTS.fr;
    const mount = opts.mount;
    const id = 'menu-search-' + (++uid);
    let index = [], sections = [], chipBtns = [], io = null, lockScroll = false, lockTimer = 0, activeIdx = -1, timer = 0;

    /* ---- recherche ---- */
    const search = document.createElement('div');
    search.className = 'menu-search';
    search.setAttribute('role', 'search');
    search.innerHTML =
      `<label class="menu-search-label" for="${id}">${T.label}</label>` +
      `<svg class="menu-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>` +
      `<input id="${id}" type="search" autocomplete="off" spellcheck="false" enterkeyhint="search">` +
      `<button type="button" class="menu-search-clear" hidden>×</button>`;
    const input = search.querySelector('input');
    const clearBtn = search.querySelector('.menu-search-clear');
    input.placeholder = T.search;
    clearBtn.setAttribute('aria-label', T.clear);
    clearBtn.title = T.clear;

    const results = document.createElement('div');
    results.className = 'menu-results';
    const status = document.createElement('p');
    status.className = 'menu-results-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const list = document.createElement('div');
    results.append(status, list);

    function run(q) {
      const terms = norm(q).split(' ').filter(Boolean);
      clearBtn.hidden = !q;
      list.innerHTML = '';
      if (!terms.length) {
        mount.classList.remove('is-searching');
        status.textContent = '';
        if (opts.onQuery) opts.onQuery('');
        refreshChips();
        return;
      }
      mount.classList.add('is-searching');
      if (opts.onQuery) opts.onQuery(q);
      const hits = index.filter(e => terms.every(t => e.hay.includes(t)));
      status.textContent = hits.length ? T.count(hits.length) : '';
      if (!hits.length) {
        const none = document.createElement('p');
        none.className = 'menu-noresult';
        none.textContent = T.none;
        list.appendChild(none);
        return;
      }
      let key = null, sec = null;
      hits.forEach(e => {
        if (e.group !== key) {
          key = e.group;
          sec = document.createElement('div');
          sec.className = 'menu-section';
          if (e.title) { const h = document.createElement('h3'); h.innerHTML = e.title; sec.appendChild(h); }
          list.appendChild(sec);
        }
        sec.appendChild(e.el.cloneNode(true));
      });
    }
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => run(input.value), 120); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; run(''); }
      if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); run(input.value); }
    });
    input.addEventListener('search', () => { clearTimeout(timer); run(input.value); });
    clearBtn.addEventListener('click', () => { input.value = ''; run(''); input.focus(); });

    /* ---- puces de catégories ---- */
    const chips = document.createElement('nav');
    chips.className = 'menu-chips';
    chips.setAttribute('aria-label', T.cats);

    const stickyTop = () => navHeight();
    function setTopVar() { document.documentElement.style.setProperty('--menu-chips-top', Math.round(stickyTop()) + 'px'); }
    const offset = () => stickyTop() + (chips.offsetHeight || 0) + 10;

    function setActive(i, reveal) {
      if (i === activeIdx || !chipBtns[i]) return;
      activeIdx = i;
      chipBtns.forEach((b, j) => { b.classList.toggle('active', j === i); if (j === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (reveal !== false) {
        const b = chipBtns[i];
        const left = b.offsetLeft - (chips.clientWidth - b.offsetWidth) / 2;
        chips.scrollTo({ left: Math.max(0, left), behavior: scrollMode() });
      }
    }

    function goTo(i) {
      const s = sections[i];
      if (!s) return;
      setActive(i);
      lockScroll = true;
      clearTimeout(lockTimer);
      const unlock = () => { lockScroll = false; clearTimeout(lockTimer); };
      if ('onscrollend' in window) window.addEventListener('scrollend', unlock, { once: true });
      lockTimer = setTimeout(unlock, 1200);
      const y = s.el.getBoundingClientRect().top + window.scrollY - offset();
      window.scrollTo({ top: Math.max(0, y), behavior: scrollMode() });
      /* clavier / lecteur d'écran : le focus suit, sans second défilement */
      const h = s.el.querySelector('h3') || s.el;
      if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
      h.focus({ preventScroll: true });
    }

    const visible = new Set();
    function observe() {
      if (io) io.disconnect();
      visible.clear();
      if (!('IntersectionObserver' in window) || sections.length < 2) return;
      io = new IntersectionObserver(entries => {
        entries.forEach(en => { if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target); });
        if (lockScroll) return;
        const i = sections.findIndex(s => visible.has(s.el));
        if (i >= 0) setActive(i);
      }, { rootMargin: `-${Math.round(offset())}px 0px -55% 0px`, threshold: 0 });
      sections.forEach(s => io.observe(s.el));
    }

    function setSections(list) {
      /* titres vides ou en double : une seule puce, vers la première occurrence */
      const seen = new Set();
      sections = (list || []).filter(s => {
        const k = norm(s.label);
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      chips.innerHTML = '';
      activeIdx = -1;
      chipBtns = sections.map((s, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        /* puce courte : sans les précisions entre parenthèses (« (min 2 personnes) ») */
        b.textContent = (s.label.replace(/\s*\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()) || s.label.trim();
        b.addEventListener('click', () => goTo(i));
        chips.appendChild(b);
        return b;
      });
      chips.hidden = sections.length < 2;
      chips.scrollLeft = 0;
      setTopVar();
      if (chipBtns.length) setActive(0, false);
      requestAnimationFrame(observe);
    }
    function refreshChips() { requestAnimationFrame(observe); }

    let rz = 0;
    const onResize = () => { clearTimeout(rz); rz = setTimeout(() => { setTopVar(); observe(); }, 150); };
    window.addEventListener('resize', onResize);

    return {
      search, chips, results,
      setSections,
      /* entrées : [{ group, title (html du titre de groupe), hay (texte à chercher), el (élément affiché) }] */
      setIndex(entries) {
        index = (entries || []).map(e => Object.assign({}, e, { hay: norm(e.hay) }));
        if (opts.query) { input.value = opts.query; run(opts.query); }
      },
      destroy() { if (io) io.disconnect(); window.removeEventListener('resize', onResize); clearTimeout(timer); clearTimeout(lockTimer); },
    };
  }

  window.MenuNav = { create, norm };
})();
