/* common.js — shared helpers */
(function (global) {
  'use strict';

  const DATA_URL = 'data/lectionary.json';
  let lectionary = null;
  const byDate = {};

  function loadData() {
    if (lectionary) return Promise.resolve(lectionary);
    return fetch(DATA_URL).then(r => r.json()).then(arr => {
      lectionary = arr;
      for (const d of arr) byDate[d.date] = d;
      return arr;
    });
  }
  function getDay(dateStr) { return byDate[dateStr] || null; }
  function todayStr() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }
  function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function formatCN(s) {
    const dt = parseDate(s);
    return dt.getFullYear() + '年' + (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
  }
  function weekdayCN(s) {
    const dt = parseDate(s);
    const map = ['主日', '一', '二', '三', '四', '五', '六'];
    return I18N.t('wd_' + map[dt.getDay()]);
  }
  function addDays(s, n) {
    const dt = parseDate(s);
    dt.setDate(dt.getDate() + n);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }
  function seasonClass(season) { return 'season-' + season; }
  function colorClass(color) {
    if (!color) return '';
    return 'color-' + color.split('（')[0].replace('/', '\\/');
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  const COLOR_HEX = {
    '紫': '#5b3a8e', '红': '#b3413d', '白': '#b9a86f', '绿': '#2e7d4f',
    '金': '#b8860b', '金/白': '#c9a227', '黑': '#3a3a3a', '灰': '#888888',
  };
  const COLOR_HEX_SOFT = {
    '紫': '#7a5db0', '红': '#c95a54', '白': '#d3c79b', '绿': '#3f9c67',
    '金': '#c9a227', '金/白': '#d4b83a', '黑': '#555555', '灰': '#aaaaaa',
  };
  const COLOR_DESC = {
    '紫': '将临期、大斋期', '红': '殉道者、圣灵降临日等', '白': '节期、圣日',
    '绿': '圣灵降临期平日', '金': '主要庆节', '金/白': '救主圣诞、复活等大节',
    '黑': '耶稣受难日', '灰': '平日',
  };
  function colorBase(color) { return color ? String(color).split('（')[0].split('(')[0].trim() : null; }
  function colorHex(color) { const b = colorBase(color); return (b && COLOR_HEX[b]) || '#2c2420'; }
  function colorHexSoft(color) { const b = colorBase(color); return (b && COLOR_HEX_SOFT[b]) || '#3d322a'; }
  function colorDesc(color) { const b = colorBase(color); return (b && COLOR_DESC[b]) || ''; }

  const I18N = global.I18N;
  I18N.setLang(I18N.getLang());

  // 繁体模式下，把静态 HTML（页脚、静态正文）转为繁体，避免残留简体
  (function localizeStaticText() {
    if (I18N.getLang() !== 'zhTW' || !global.ZHConv) return;
    const conv = global.ZHConv.toTraditional;
    function walk(root) {
      const kids = Array.from(root.childNodes);
      for (const k of kids) {
        if (k.nodeType === 3) { k.nodeValue = conv(k.nodeValue); continue; }
        if (k.nodeType === 1 && k.tagName !== 'SCRIPT' && k.tagName !== 'STYLE' && k.tagName !== 'NOSCRIPT') walk(k);
      }
    }
    document.querySelectorAll('footer.site, main').forEach(walk);
  })();

  const VIEW_KEY = 'view-mode';
  const VIEW_ORDER = ['auto', 'mobile', 'desktop'];
  function viewLabel(mode) {
    if (mode === 'mobile') return I18N.t('viewMobile');
    if (mode === 'desktop') return I18N.t('viewDesktop');
    return I18N.t('viewAuto');
  }
  function applyViewMode() {
    let mode = 'auto';
    try { mode = localStorage.getItem(VIEW_KEY) || 'auto'; } catch (e) {}
    const el = document.documentElement;
    el.classList.remove('force-mobile', 'force-desktop');
    if (mode === 'mobile') el.classList.add('force-mobile');
    if (mode === 'desktop') el.classList.add('force-desktop');
    const btn = document.getElementById('view-toggle');
    if (btn) btn.textContent = viewLabel(mode);
    return mode;
  }
  function cycleViewMode() {
    const cur = applyViewMode();
    const next = VIEW_ORDER[(VIEW_ORDER.indexOf(cur) + 1) % VIEW_ORDER.length];
    try { localStorage.setItem(VIEW_KEY, next); } catch (e) {}
    applyViewMode();
  }

  function renderHeader(active) {
    const nav = [
      ['index.html', I18N.t('navToday'), 'today'],
      ['lesson.html', I18N.t('navLesson'), 'lesson'],
      ['calendar.html', I18N.t('navCalendar'), 'calendar'],
      ['worship.html', I18N.t('navWorship'), 'worship'],
      ['about.html', I18N.t('navAbout'), 'about'],
    ];
    const el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML =
      '<a class="brand" href="index.html">' + I18N.t('brand') + '<small>' + I18N.t('brandSub') + '</small><span class="theme-dot" id="theme-dot" title="' + I18N.t('litColor') + '"></span></a>' +
      '<nav>' + nav.map(([href, label, key]) =>
        `<a href="${href}" class="${key === active ? 'active' : ''}">${label}</a>`).join('') + '</nav>' +
      '<button class="view-toggle" id="view-toggle" title="' + I18N.t('viewToggleTitle') + '">' + viewLabel(applyViewMode()) + '</button>' +
      '<select class="lang-select" id="lang-select" title="Language / 语言">' +
        I18N.LANGS.map(l => `<option value="${l.id}" ${l.id === I18N.getLang() ? 'selected' : ''}>${I18N.langLabel(l.id)}</option>`).join('') +
      '</select>';
    el.querySelector('#view-toggle').addEventListener('click', cycleViewMode);
    el.querySelector('#lang-select').addEventListener('change', (e) => {
      I18N.setLang(e.target.value);
      location.reload();
    });
    applyViewMode();
    // 全站导航主题色 = 今日礼仪颜色
    loadData().then(() => {
      const day = byDate[todayStr()];
      const color = (day && day.color) || null;
      el.style.setProperty('--theme-main', colorHex(color));
      el.style.setProperty('--theme-soft', colorHexSoft(color));
      const dot = document.getElementById('theme-dot');
      if (dot) { dot.style.background = colorHex(color); dot.title = (day ? (day.color || '') + ' · ' + I18N.t('litColor') : I18N.t('litColor')); }
    });
  }
  function navDate(dateStr) {
    return `<div class="nav-date">
      <button class="btn small" data-prev>${I18N.t('prevDay')}</button>
      <strong>${formatCN(dateStr)} · ${weekdayCN(dateStr)}</strong>
      <button class="btn small" data-next>${I18N.t('nextDay')}</button>
      <button class="btn small" data-today>${I18N.t('todayBtn')}</button>
    </div>`;
  }

  global.Common = { loadData, getDay, todayStr, parseDate, formatCN, weekdayCN, addDays, seasonClass, colorClass, esc, renderHeader, navDate, colorBase, colorHex, colorHexSoft, colorDesc, COLOR_HEX, COLOR_DESC, applyViewMode, cycleViewMode, viewLabel };
})(window);
