/* Site en quatre langues : FR (texte des pages HTML) · EN · ES · RU,
   les langues des cartes et des drapeaux imprimés sur les supports des restaurants.

   - Le français reste écrit dans les pages HTML (source, lisible sans JavaScript).
   - Les autres langues sont ici, une clé par texte :
       <h1 data-i18n="home.h1">…</h1>                      contenu (HTML permis : <br>, <strong>)
       <img data-i18n-attr="alt:coursive.alt.bar">           attribut(s), « attr:clé; attr2:clé2 »
   - Langue : ?lang=xx, sinon le choix mémorisé (localStorage « carte_lang », la même clé que
     la carte de La Galette), sinon la langue du navigateur (fr/en/es/ru ; toute autre → en).
   - Le sélecteur (drapeaux + codes) est ajouté dans la barre du haut de chaque page.
   - Les cartes (menu.js, menu-galette.js) écoutent SiteI18n.onChange et se redessinent.
   Chargé dans <head>, sans defer, avant les scripts des cartes. */

(function () {
  /* drapeaux en SVG (les drapeaux emoji ne s'affichent pas sous Windows) */
  const svg = s => 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" preserveAspectRatio="none">' + s + '</svg>');
  const FLAGS = {
    fr: svg('<rect width="30" height="20" fill="#fff"/><rect width="10" height="20" fill="#002654"/><rect x="20" width="10" height="20" fill="#ce1126"/>'),
    en: svg('<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.6"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6"/><path d="M15 0v20M0 10h30" stroke="#c8102e" stroke-width="3.4"/>'),
    es: svg('<rect width="30" height="20" fill="#aa151b"/><rect y="5" width="30" height="10" fill="#f1bf00"/>'),
    ru: svg('<rect width="30" height="20" fill="#fff"/><rect y="6.67" width="30" height="6.67" fill="#0039a6"/><rect y="13.33" width="30" height="6.67" fill="#d52b1e"/>'),
  };
  const LANGS = [
    { code: 'fr', short: 'FR', label: 'Français', locale: 'fr-FR' },
    { code: 'en', short: 'EN', label: 'English', locale: 'en-GB' },
    { code: 'es', short: 'ES', label: 'Español', locale: 'es-ES' },
    { code: 'ru', short: 'RU', label: 'Русский', locale: 'ru-RU' },
  ];
  LANGS.forEach(l => { l.flag = FLAGS[l.code]; });
  const CODES = LANGS.map(l => l.code);
  const STORE = 'carte_lang';

  /* ------------------------------------------------------------------
     Dictionnaire. « fr » ne contient que les textes écrits par les scripts
     (les textes français des pages sont lus dans le HTML).
     ------------------------------------------------------------------ */
  const DICT = {
    fr: {
      'lang.choose': 'Langue',
      'menu.updated': ' — mise à jour le ',
      'menu.error': 'La carte complète est disponible ici :',
      'menu.errorLink': 'Voir la carte ↗',
      'menu.tag.veg': 'Végétarien',
      'menu.tag.spec': 'Spécialité de la maison',
      'menu.size.small': 'Petit',
      'menu.size.large': 'Grand',
    },
    en: {
      'lang.choose': 'Language',
      'menu.updated': ' — updated on ',
      'menu.error': 'The full menu is available here:',
      'menu.errorLink': 'See the menu ↗',
      'menu.tag.veg': 'Vegetarian',
      'menu.tag.spec': 'House speciality',
      'menu.size.small': 'Small',
      'menu.size.large': 'Large',

      /* commun */
      'nav.home': 'Home',
      'nav.menu': 'Menu',
      'kicker.house': 'The restaurant',
      'kicker.booking': 'Bookings',
      'btn.seeMenu': 'See the menu',
      'carte.kicker': 'The menu',
      'carte.net': 'Net prices, service included.',
      'menu.loading': 'Loading the menu…',
      'contact.phoneOnly': 'Bookings by phone only:',
      'contact.address': 'Address',
      'contact.directions': 'Directions ↗',
      'foot.base': 'Méribel Restaurants — two houses, one standard of excellence.',
      'foot.photos': 'Photographs © Alexandre Gallego',

      /* accueil */
      'home.title': 'Méribel Restaurants — La Coursive des Alpes · La Galette',
      'home.desc': 'Two restaurants, two atmospheres in the centre of Méribel: La Coursive des Alpes (restaurant & lounge bar) and La Galette (Savoyard cuisine, pizzeria, crêperie).',
      'home.kicker': 'Méribel · Savoie',
      'home.h1': 'Two restaurants,<br>two atmospheres',
      'home.sub': 'Two personalities, two reasons to visit — in the heart of the resort.',
      'home.coursive.type': 'Restaurant · Lounge bar',
      'home.coursive.desc': 'The new surprise in the centre of Méribel, set in the former cinema: homemade cooking by chef Laurent Hillairet and a cosy bar.',
      'home.galette.type': 'Savoyard · Pizzeria · Crêperie',
      'home.galette.desc': 'Our Savoyard specialities, pizzas, galettes and crêpes, in a traditional setting with a warm, welcoming atmosphere.',
      'home.go': 'Discover →',

      /* La Galette */
      'galette.title': 'La Galette — Savoyard Restaurant, Pizzeria & Crêperie, Méribel',
      'galette.desc': 'La Galette in Méribel: Savoyard specialities, pizzas, galettes and crêpes in a typically Savoyard setting. Bookings: 04 79 08 53 90.',
      'galette.logo': 'La Galette — Savoyard restaurant, pizzeria, crêperie',
      'galette.h1': 'The Savoyard spirit,<br>all day long',
      'galette.sub': 'Savoyard specialities, pizzas, galettes and crêpes — in a traditional setting with a welcoming atmosphere.',
      'galette.h2': 'Something to delight every palate',
      'galette.p': 'Ideally located in the centre of Méribel, <strong>La Galette</strong> offers a rich and varied menu in a typically Savoyard setting. At any time of day, <strong>Valérie and Christophe</strong> invite you to discover the house <strong>Savoyard specialities</strong>, pizzas, galettes and crêpes, in a relaxed and welcoming atmosphere.',
      'galette.btn.phone': 'The menu on my phone ↗',
      'galette.carte.title': 'Savoyard dishes, pizzas, galettes &amp; crêpes',
      'galette.carte.note': 'Menu kept up to date by the restaurant',
      'galette.carte.all': 'Open the menu on my phone ↗',
      'galette.contact.h2': 'See you soon<br>at La Galette',
      'galette.question': 'Any questions?',
      'galette.takeaway.h3': 'On the go',
      'galette.takeaway.p': 'Takeaway menu available — order by phone.',

      /* La Coursive */
      'coursive.title': 'La Coursive des Alpes — Restaurant & Lounge Bar, Méribel',
      'coursive.desc': 'Restaurant and lounge bar in the centre of Méribel, set in the former cinema. Homemade cooking by chef Laurent Hillairet, cosy bar, private hire. Bookings: 04 79 06 44 97.',
      'coursive.logo': 'La Coursive des Alpes — Restaurant, Lounge Bar',
      'coursive.h1': 'The new surprise<br>in the heart of Méribel',
      'coursive.sub': 'Restaurant &amp; lounge bar in the former cinema — homemade cooking, mountain spirit and soaring ceilings.',
      'coursive.book': 'Book',
      'coursive.h2': 'A former cinema<br>turned foodie hideaway',
      'coursive.p1': 'Where films were once screened, tables are now laid. <strong>La Coursive des Alpes</strong> has moved into the former cinema in the centre of Méribel, with its spectacular ceiling height.',
      'coursive.p2': 'On the ground floor, the <strong>cosy bar</strong>: velvet armchairs, wood panelling and signature cocktails by the fire. Upstairs, the <strong>restaurant</strong>, where chef <strong>Laurent Hillairet</strong> serves generous, entirely homemade cooking — from the truffle croque to seven-hour slow-cooked beef.',
      'coursive.privat': '✦ Private hire available for your events — get in touch.',
      'coursive.alt.salon': 'The lounge and its velvet armchairs',
      'coursive.alt.bar': 'The wood-panelled bar',
      'coursive.alt.salle': 'The upstairs dining room',
      'coursive.carte.title': 'Everything is homemade',
      'coursive.carte.note': 'The restaurant updates this menu live',
      'coursive.carte.all': 'See the full menu — wines, cocktails, drinks ↗',
      'coursive.gal.kicker': 'The atmosphere',
      'coursive.gal.h2': 'Velvet, natural wood &amp; beautifully plated dishes',
      'coursive.alt.duo1': 'The ground-floor lounge, the wine cellar and the mezzanine',
      'coursive.alt.duo2': 'A table laid upstairs, in front of the mural',
      'coursive.credit': 'Photo credit: labon3',
      'coursive.alt.s1': 'Tables laid for dinner',
      'coursive.alt.s2': 'Signature cocktails',
      'coursive.alt.s3': 'The lounge',
      'coursive.alt.s4': 'A dish by the chef',
      'coursive.alt.s5': 'The mezzanine',
      'coursive.alt.s6': 'Homemade dessert',
      'coursive.alt.s7': 'The fireside corner',
      'coursive.alt.s8': 'Cocktails at the bar',
      'coursive.alt.s9': 'A plated dish',
      'coursive.contact.h2': 'See you soon<br>at La Coursive',
      'coursive.email': 'Email',
      'coursive.follow': 'Follow us',
      'coursive.events': 'Events',
      'coursive.events.p': 'The bar or the restaurant can be booked for private events — call us for details.',
      'coursive.foot.base': 'La Coursive des Alpes — by chef Laurent Hillairet',
    },
    es: {
      'lang.choose': 'Idioma',
      'menu.updated': ' — actualizada el ',
      'menu.error': 'La carta completa está disponible aquí:',
      'menu.errorLink': 'Ver la carta ↗',
      'menu.tag.veg': 'Vegetariano',
      'menu.tag.spec': 'Especialidad de la casa',
      'menu.size.small': 'Pequeño',
      'menu.size.large': 'Grande',

      'nav.home': 'Inicio',
      'nav.menu': 'Menú',
      'kicker.house': 'La casa',
      'kicker.booking': 'Reservas',
      'btn.seeMenu': 'Ver la carta',
      'carte.kicker': 'La carta',
      'carte.net': 'Precios netos, servicio incluido.',
      'menu.loading': 'Cargando la carta…',
      'contact.phoneOnly': 'Reservas solo por teléfono:',
      'contact.address': 'Dirección',
      'contact.directions': 'Cómo llegar ↗',
      'foot.base': 'Méribel Restaurants — dos casas, una misma exigencia.',
      'foot.photos': 'Fotografías © Alexandre Gallego',

      'home.title': 'Méribel Restaurants — La Coursive des Alpes · La Galette',
      'home.desc': 'Dos restaurantes, dos ambientes en el centro de Méribel: La Coursive des Alpes (restaurante y lounge bar) y La Galette (cocina saboyana, pizzería, crepería).',
      'home.kicker': 'Méribel · Saboya',
      'home.h1': 'Dos restaurantes,<br>dos ambientes',
      'home.sub': 'Dos personalidades, dos motivos para venir, en pleno corazón de la estación.',
      'home.coursive.type': 'Restaurante · Lounge bar',
      'home.coursive.desc': 'La nueva sorpresa del centro de Méribel, en el antiguo cine: cocina casera del chef Laurent Hillairet y un bar acogedor.',
      'home.galette.type': 'Saboyano · Pizzería · Crepería',
      'home.galette.desc': 'Las especialidades saboyanas de la casa, pizzas, galettes y crêpes, en un marco típico y un ambiente acogedor.',
      'home.go': 'Descubrir →',

      'galette.title': 'La Galette — Restaurante saboyano, pizzería y crepería, Méribel',
      'galette.desc': 'La Galette en Méribel: especialidades saboyanas, pizzas, galettes y crêpes en un marco típicamente saboyano. Reservas: 04 79 08 53 90.',
      'galette.logo': 'La Galette — restaurante saboyano, pizzería, crepería',
      'galette.h1': 'El espíritu saboyano,<br>a cualquier hora',
      'galette.sub': 'Especialidades saboyanas, pizzas, galettes y crêpes, en un marco típico y un ambiente acogedor.',
      'galette.h2': 'Para el deleite de todos los paladares',
      'galette.p': 'Idealmente situada en el centro de Méribel, <strong>La Galette</strong> ofrece una carta rica y variada en un marco típicamente saboyano. A cualquier hora del día, <strong>Valérie y Christophe</strong> le invitan a descubrir las <strong>especialidades saboyanas</strong> de la casa, las pizzas, las galettes y las crêpes, en un ambiente sencillo y acogedor.',
      'galette.btn.phone': 'La carta en mi móvil ↗',
      'galette.carte.title': 'Cocina saboyana, pizzas, galettes y crêpes',
      'galette.carte.note': 'La casa mantiene la carta al día',
      'galette.carte.all': 'Abrir la carta en mi móvil ↗',
      'galette.contact.h2': '¡Hasta muy pronto<br>en La Galette!',
      'galette.question': '¿Alguna pregunta?',
      'galette.takeaway.h3': 'Para llevar',
      'galette.takeaway.p': 'Carta para llevar disponible: haga su pedido por teléfono.',

      'coursive.title': 'La Coursive des Alpes — Restaurante y lounge bar, Méribel',
      'coursive.desc': 'Restaurante y lounge bar en el centro de Méribel, en el antiguo cine. Cocina casera del chef Laurent Hillairet, bar acogedor, eventos privados. Reservas: 04 79 06 44 97.',
      'coursive.logo': 'La Coursive des Alpes — Restaurante, Lounge Bar',
      'coursive.h1': 'La nueva sorpresa<br>del centro de Méribel',
      'coursive.sub': 'Restaurante y lounge bar en el antiguo cine: cocina casera, espíritu de montaña y techos altísimos.',
      'coursive.book': 'Reservar',
      'coursive.h2': 'Un antiguo cine<br>convertido en refugio gourmet',
      'coursive.p1': 'Donde antes se proyectaban películas, hoy se ponen las mesas. <strong>La Coursive des Alpes</strong> se ha instalado en el antiguo cine del centro de Méribel, con sus espectaculares techos altos.',
      'coursive.p2': 'En la planta baja, el <strong>bar acogedor</strong>: sillones de terciopelo, revestimientos de madera y cócteles de autor junto a la chimenea. En la planta superior, el <strong>comedor del restaurante</strong>, donde el chef <strong>Laurent Hillairet</strong> defiende una cocina generosa y totalmente casera, del croque trufado al buey confitado durante siete horas.',
      'coursive.privat': '✦ Posibilidad de reservar el local en exclusiva para sus eventos: contáctenos.',
      'coursive.alt.salon': 'El salón y sus sillones de terciopelo',
      'coursive.alt.bar': 'La barra con revestimientos de madera',
      'coursive.alt.salle': 'El comedor del restaurante, en la planta superior',
      'coursive.carte.title': 'Todo es casero',
      'coursive.carte.note': 'La casa actualiza la carta en directo',
      'coursive.carte.all': 'Ver toda la carta: vinos, cócteles, bebidas ↗',
      'coursive.gal.kicker': 'El ambiente',
      'coursive.gal.h2': 'Terciopelo, madera natural y platos cuidadosamente presentados',
      'coursive.alt.duo1': 'El salón de la planta baja, la cava de vinos y el entresuelo',
      'coursive.alt.duo2': 'Una mesa puesta en la planta superior, frente al fresco',
      'coursive.credit': 'Foto: labon3',
      'coursive.alt.s1': 'Mesas puestas',
      'coursive.alt.s2': 'Cócteles de autor',
      'coursive.alt.s3': 'El salón lounge',
      'coursive.alt.s4': 'Un plato del chef',
      'coursive.alt.s5': 'El entresuelo',
      'coursive.alt.s6': 'Postre casero',
      'coursive.alt.s7': 'El rincón de la chimenea',
      'coursive.alt.s8': 'Cócteles en la barra',
      'coursive.alt.s9': 'Un plato emplatado',
      'coursive.contact.h2': '¡Hasta muy pronto<br>en La Coursive!',
      'coursive.email': 'Correo electrónico',
      'coursive.follow': 'Síganos',
      'coursive.events': 'Eventos',
      'coursive.events.p': 'Posibilidad de reservar el bar o el restaurante en exclusiva: infórmese por teléfono.',
      'coursive.foot.base': 'La Coursive des Alpes — por el chef Laurent Hillairet',
    },
    ru: {
      'lang.choose': 'Язык',
      'menu.updated': ' — обновлено ',
      'menu.error': 'Полное меню доступно здесь:',
      'menu.errorLink': 'Смотреть меню ↗',
      'menu.tag.veg': 'Вегетарианское',
      'menu.tag.spec': 'Фирменное блюдо',
      'menu.size.small': 'Малая',
      'menu.size.large': 'Большая',

      'nav.home': 'Главная',
      'nav.menu': 'Меню',
      'kicker.house': 'О ресторане',
      'kicker.booking': 'Бронирование',
      'btn.seeMenu': 'Смотреть меню',
      'carte.kicker': 'Меню',
      'carte.net': 'Цены указаны с учётом обслуживания.',
      'menu.loading': 'Загрузка меню…',
      'contact.phoneOnly': 'Бронирование только по телефону:',
      'contact.address': 'Адрес',
      'contact.directions': 'Маршрут ↗',
      'foot.base': 'Méribel Restaurants — два ресторана, одни и те же высокие стандарты.',
      'foot.photos': 'Фотографии © Alexandre Gallego',

      'home.title': 'Méribel Restaurants — La Coursive des Alpes · La Galette',
      'home.desc': 'Два ресторана, две атмосферы в центре Мерибеля: La Coursive des Alpes (ресторан и лаунж-бар) и La Galette (савойская кухня, пиццерия, блинная).',
      'home.kicker': 'Мерибель · Савойя',
      'home.h1': 'Два ресторана —<br>две атмосферы',
      'home.sub': 'Два характера, два повода заглянуть — в самом сердце курорта.',
      'home.coursive.type': 'Ресторан · Лаунж-бар',
      'home.coursive.desc': 'Новое открытие в центре Мерибеля, в здании бывшего кинотеатра: блюда собственного приготовления от шеф-повара Laurent Hillairet и уютный бар.',
      'home.galette.type': 'Савойская кухня · Пиццерия · Блинная',
      'home.galette.desc': 'Фирменные савойские блюда, пицца, галеты и блины — в традиционном интерьере и гостеприимной атмосфере.',
      'home.go': 'Подробнее →',

      'galette.title': 'La Galette — савойский ресторан, пиццерия и блинная, Мерибель',
      'galette.desc': 'La Galette в Мерибеле: савойские блюда, пицца, галеты и блины в типично савойском интерьере. Бронирование: 04 79 08 53 90.',
      'galette.logo': 'La Galette — савойский ресторан, пиццерия, блинная',
      'galette.h1': 'Савойский дух —<br>в любое время дня',
      'galette.sub': 'Савойские блюда, пицца, галеты и блины — в традиционном интерьере и гостеприимной атмосфере.',
      'galette.h2': 'Чтобы порадовать любой вкус',
      'galette.p': '<strong>La Galette</strong> расположена в самом центре Мерибеля и предлагает богатое и разнообразное меню в типично савойском интерьере. В любое время дня <strong>Валери и Кристоф</strong> познакомят вас с фирменными <strong>савойскими блюдами</strong>, пиццей, галетами и блинами — в простой и гостеприимной атмосфере.',
      'galette.btn.phone': 'Меню на моём телефоне ↗',
      'galette.carte.title': 'Савойская кухня, пицца, галеты и блины',
      'galette.carte.note': 'Меню регулярно обновляется рестораном',
      'galette.carte.all': 'Открыть меню на телефоне ↗',
      'galette.contact.h2': 'До скорой встречи<br>в La Galette',
      'galette.question': 'Есть вопросы?',
      'galette.takeaway.h3': 'Навынос',
      'galette.takeaway.p': 'Есть меню навынос — заказывайте по телефону.',

      'coursive.title': 'La Coursive des Alpes — ресторан и лаунж-бар, Мерибель',
      'coursive.desc': 'Ресторан и лаунж-бар в центре Мерибеля, в здании бывшего кинотеатра. Блюда собственного приготовления от шеф-повара Laurent Hillairet, уютный бар, аренда для мероприятий. Бронирование: 04 79 06 44 97.',
      'coursive.logo': 'La Coursive des Alpes — ресторан, лаунж-бар',
      'coursive.h1': 'Новое открытие<br>в центре Мерибеля',
      'coursive.sub': 'Ресторан и лаунж-бар в бывшем кинотеатре — блюда собственного приготовления, горный дух и высокие потолки.',
      'coursive.book': 'Забронировать',
      'coursive.h2': 'Бывший кинотеатр —<br>теперь место для гурманов',
      'coursive.p1': 'Там, где когда-то показывали фильмы, сегодня накрывают столы. <strong>La Coursive des Alpes</strong> разместился в бывшем кинотеатре в центре Мерибеля, с его впечатляюще высокими потолками.',
      'coursive.p2': 'На первом этаже — <strong>уютный бар</strong>: бархатные кресла, деревянные панели и авторские коктейли у камина. Этажом выше — <strong>зал ресторана</strong>, где шеф-повар <strong>Laurent Hillairet</strong> готовит щедрые блюда, полностью собственного приготовления, — от крок-месье с трюфелем до говядины конфи, томлённой семь часов.',
      'coursive.privat': '✦ Возможна аренда зала для ваших мероприятий — свяжитесь с нами.',
      'coursive.alt.salon': 'Гостиная с бархатными креслами',
      'coursive.alt.bar': 'Бар, отделанный деревом',
      'coursive.alt.salle': 'Зал ресторана на втором этаже',
      'coursive.carte.title': 'Всё готовим сами',
      'coursive.carte.note': 'Ресторан обновляет меню в реальном времени',
      'coursive.carte.all': 'Всё меню — вина, коктейли, напитки ↗',
      'coursive.gal.kicker': 'Атмосфера',
      'coursive.gal.h2': 'Бархат, натуральное дерево и красивая подача',
      'coursive.alt.duo1': 'Гостиная на первом этаже, винный шкаф и антресоль',
      'coursive.alt.duo2': 'Сервированный стол на втором этаже, на фоне фрески',
      'coursive.credit': 'Фото: labon3',
      'coursive.alt.s1': 'Сервированные столы',
      'coursive.alt.s2': 'Авторские коктейли',
      'coursive.alt.s3': 'Лаунж-зона',
      'coursive.alt.s4': 'Блюдо от шефа',
      'coursive.alt.s5': 'Антресоль',
      'coursive.alt.s6': 'Домашний десерт',
      'coursive.alt.s7': 'Уголок у камина',
      'coursive.alt.s8': 'Коктейли в баре',
      'coursive.alt.s9': 'Подача блюда',
      'coursive.contact.h2': 'До скорой встречи<br>в La Coursive',
      'coursive.email': 'Эл. почта',
      'coursive.follow': 'Мы в соцсетях',
      'coursive.events': 'Мероприятия',
      'coursive.events.p': 'Бар или ресторан можно арендовать для частных мероприятий — подробности по телефону.',
      'coursive.foot.base': 'La Coursive des Alpes — шеф-повар Laurent Hillairet',
    },
  };

  /* ------------------------------------------------------------------
     Langue de la visite
     ------------------------------------------------------------------ */
  let storageOK = false;
  try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); storageOK = true; } catch (e) { /* bloqué */ }
  const norm = c => String(c || '').toLowerCase().slice(0, 2);
  let urlLang = null;
  try { const q = norm(new URLSearchParams(location.search).get('lang')); if (CODES.includes(q)) urlLang = q; } catch (e) { }
  function browserLang() {
    const n = norm(navigator.language || (navigator.languages && navigator.languages[0]));
    return CODES.includes(n) ? n : 'en';
  }
  function saved() { try { const s = localStorage.getItem(STORE); return CODES.includes(s) ? s : null; } catch (e) { return null; } }
  let lang = urlLang || saved() || browserLang();

  const root = document.documentElement;
  root.lang = lang;
  /* autre langue que le français : la page reste invisible le temps de la traduire
     (quelques millisecondes ; jamais plus de 1,5 s même en cas d'erreur) */
  if (lang !== 'fr') {
    const st = document.createElement('style');
    st.id = 'i18n-wait';
    st.textContent = 'html.i18n-wait body{opacity:0}';
    document.head.appendChild(st);
    root.classList.add('i18n-wait');
    setTimeout(reveal, 1500);
  }
  function reveal() { root.classList.remove('i18n-wait'); }

  /* ------------------------------------------------------------------
     Traduction de la page
     ------------------------------------------------------------------ */
  const ORIG = new WeakMap();   // élément -> { html, attrs:{} } : le français d'origine
  const orig = el => { let o = ORIG.get(el); if (!o) { o = { html: null, attrs: {} }; ORIG.set(el, o); } return o; };
  const has = (l, k) => !!DICT[l] && Object.prototype.hasOwnProperty.call(DICT[l], k);
  /* texte d'une clé dans la langue en cours (repli : français, puis la clé) */
  function t(key, l) {
    l = l || lang;
    if (has(l, key)) return DICT[l][key];
    if (has('fr', key)) return DICT.fr[key];
    return key;
  }
  const attrPairs = el => String(el.getAttribute('data-i18n-attr') || '').split(';').map(s => s.split(':').map(x => x.trim())).filter(p => p[0] && p[1]);

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const k = el.getAttribute('data-i18n');
      const o = orig(el);
      const text = el.tagName === 'TITLE';
      if (o.html == null) o.html = text ? el.textContent : el.innerHTML;
      const v = lang === 'fr' || !has(lang, k) ? o.html : DICT[lang][k];
      if (text) { if (el.textContent !== v) el.textContent = v; }
      else if (el.innerHTML !== v) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const o = orig(el);
      attrPairs(el).forEach(([a, k]) => {
        if (!(a in o.attrs)) o.attrs[a] = el.getAttribute(a) || '';
        el.setAttribute(a, lang === 'fr' || !has(lang, k) ? o.attrs[a] : DICT[lang][k]);
      });
    });
    root.lang = lang;
    decorateLinks();
    renderSwitch();
  }

  /* liens : la carte des clients (carte.vikto-labs.fr) s'ouvre dans la même langue ;
     les pages du site gardent ?lang= quand la langue vient de l'adresse ou ne peut
     pas être mémorisée */
  function decorateLinks() {
    const keep = !!urlLang || !storageOK;
    document.querySelectorAll('a[href]').forEach(a => {
      if (a.closest('.lang-switch')) return;
      if (!a.hasAttribute('data-href')) a.setAttribute('data-href', a.getAttribute('href'));
      const base = a.getAttribute('data-href');
      let u;
      try { u = new URL(base, location.href); } catch (e) { return; }
      const external = /(^|\.)carte\.vikto-labs\.fr$/.test(u.hostname);
      const page = u.origin === location.origin && /(\.html|\/)$/.test(u.pathname) && !/^#/.test(base);
      if (external || (page && keep)) {
        u.searchParams.set('lang', lang);
        a.setAttribute('href', external ? u.href : u.pathname + u.search + u.hash);
      } else if (a.getAttribute('href') !== base) a.setAttribute('href', base);
    });
  }

  /* ------------------------------------------------------------------
     Sélecteur de langue (barre du haut)
     ------------------------------------------------------------------ */
  let sw = null;
  function flagImg(l) { const i = document.createElement('img'); i.className = 'flag'; i.src = l.flag; i.alt = ''; i.width = 20; i.height = 14; return i; }
  function buildSwitch() {
    const nav = document.getElementById('nav');
    if (!nav) return null;
    const box = document.createElement('div');
    box.className = 'lang-switch';
    const cur = document.createElement('button');
    cur.type = 'button';
    cur.className = 'lang-current';
    cur.setAttribute('aria-haspopup', 'true');
    cur.setAttribute('aria-expanded', 'false');
    const list = document.createElement('ul');
    list.className = 'lang-list';
    list.id = 'lang-list';
    cur.setAttribute('aria-controls', list.id);
    LANGS.forEach(l => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '?lang=' + l.code;
      a.hreflang = l.code;
      a.lang = l.code;
      a.title = l.label;
      a.dataset.lang = l.code;
      a.append(flagImg(l));
      const code = document.createElement('span'); code.className = 'code'; code.textContent = l.short;
      const name = document.createElement('span'); name.className = 'name'; name.textContent = l.label;
      a.append(code, name);
      a.addEventListener('click', e => { e.preventDefault(); close(); set(l.code); });
      li.appendChild(a);
      list.appendChild(li);
    });
    box.append(cur, list);
    const open = () => { box.classList.add('open'); cur.setAttribute('aria-expanded', 'true'); };
    function close() { box.classList.remove('open'); cur.setAttribute('aria-expanded', 'false'); }
    cur.addEventListener('click', e => {
      e.stopPropagation();
      if (box.classList.contains('open')) close();
      else { nav.classList.remove('open'); open(); const a = list.querySelector('[aria-current]'); if (a) a.focus(); }
    });
    document.addEventListener('click', e => { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && box.classList.contains('open')) { close(); cur.focus(); } });
    const cta = nav.querySelector('.nav-cta');
    nav.insertBefore(box, cta || null);
    return box;
  }
  function renderSwitch() {
    if (!sw) sw = buildSwitch();
    if (!sw) return;
    const L = LANGS.find(l => l.code === lang);
    const cur = sw.querySelector('.lang-current');
    cur.innerHTML = '';
    cur.append(flagImg(L));
    const c = document.createElement('span'); c.textContent = L.short;
    cur.append(c);
    cur.insertAdjacentHTML('beforeend', '<svg class="caret" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>');
    cur.setAttribute('aria-label', t('lang.choose') + ' : ' + L.label);
    sw.querySelector('.lang-list').setAttribute('aria-label', t('lang.choose'));
    sw.querySelectorAll('.lang-list a').forEach(a => {
      if (a.dataset.lang === lang) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }

  /* ------------------------------------------------------------------
     Changement de langue
     ------------------------------------------------------------------ */
  const listeners = [];
  function set(code) {
    code = norm(code);
    if (!CODES.includes(code)) return;
    try { localStorage.setItem(STORE, code); } catch (e) { }
    if (urlLang) {
      urlLang = code;
      try { const u = new URL(location.href); u.searchParams.set('lang', code); history.replaceState(history.state, '', u.href); } catch (e) { }
    }
    if (code === lang) return;
    lang = code;
    apply();
    listeners.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
  }

  function start() { apply(); reveal(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.SiteI18n = {
    LANGS, DICT,
    get lang() { return lang; },
    get locale() { return (LANGS.find(l => l.code === lang) || LANGS[0]).locale; },
    t, set, apply,
    onChange(fn) { listeners.push(fn); },
  };
})();
