(function () {
  var STORAGE_KEY = 'fr_lang';
  var LANGS = ['es', 'en', 'fr'];
  var LABELS = { es: 'ES', en: 'EN', fr: 'FR' };

  function getLang() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (stored && LANGS.indexOf(stored) !== -1) return stored;
    return 'es';
  }

  function injectStyles() {
    if (document.getElementById('i18n-switch-styles')) return;
    var style = document.createElement('style');
    style.id = 'i18n-switch-styles';
    style.textContent =
      '.i18n-switch{display:flex;align-items:center;gap:2px;}' +
      '.i18n-switch button{font-family:"Plus Jakarta Sans",sans-serif;font-size:12px;font-weight:700;' +
      'letter-spacing:0.3px;background:none;border:none;cursor:pointer;padding:6px 7px;border-radius:6px;' +
      'color:inherit;opacity:0.5;transition:all 0.2s;}' +
      '.i18n-switch button:hover{opacity:0.9;}' +
      '.i18n-switch button.active{opacity:1;}' +
      '.i18n-switch--dark{color:#ffffff;}' +
      '.i18n-switch--dark button.active{background:rgba(255,255,255,0.16);}' +
      '.i18n-switch--light{color:#0A2540;}' +
      '.i18n-switch--light button.active{background:rgba(10,37,64,0.08);}' +
      '.i18n-switch-sep{opacity:0.3;font-size:11px;}';
    document.head.appendChild(style);
  }

  function renderSwitch(container, current) {
    container.innerHTML = '';
    container.classList.add('i18n-switch');
    LANGS.forEach(function (lang, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = LABELS[lang];
      btn.setAttribute('data-lang', lang);
      btn.setAttribute('aria-label', LABELS[lang]);
      if (lang === current) btn.classList.add('active');
      btn.addEventListener('click', function () { setLang(lang); });
      container.appendChild(btn);
      if (i < LANGS.length - 1) {
        var sep = document.createElement('span');
        sep.className = 'i18n-switch-sep';
        sep.textContent = '/';
        container.appendChild(sep);
      }
    });
  }

  function applyTranslations(lang) {
    var dict = (window.I18N_DATA && window.I18N_DATA[lang]) || {};
    document.documentElement.lang = lang;
    if (dict.__pageTitle) document.title = dict.__pageTitle;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] != null) el.setAttribute('placeholder', dict[key]);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria');
      if (dict[key] != null) el.setAttribute('aria-label', dict[key]);
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-alt');
      if (dict[key] != null) el.setAttribute('alt', dict[key]);
    });

    document.querySelectorAll('.i18n-switch').forEach(function (container) {
      container.querySelectorAll('button').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      });
    });

    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: lang, dict: dict } }));
  }

  function setLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    applyTranslations(lang);
  }

  function init() {
    injectStyles();
    var lang = getLang();
    document.querySelectorAll('.lang-switch').forEach(function (container) {
      renderSwitch(container, lang);
    });
    applyTranslations(lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.I18N = { setLang: setLang, getLang: getLang, applyTranslations: applyTranslations };
})();
