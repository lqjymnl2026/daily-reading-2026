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
    const map = ['日', '一', '二', '三', '四', '五', '六'];
    return '星期' + map[dt.getDay()];
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
  function renderHeader(active) {
    const nav = [
      ['index.html', '今日讀經', 'today'],
      ['lesson.html', '每日一課', 'lesson'],
      ['calendar.html', '讀經曆', 'calendar'],
      ['worship.html', '線上崇拜', 'worship'],
      ['about.html', '本書分析', 'about'],
    ];
    const el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML =
      '<a class="brand" href="index.html">每日讀經<small>2025–2026 · 香港聖公會讀經表</small></a>' +
      '<nav>' + nav.map(([href, label, key]) =>
        `<a href="${href}" class="${key === active ? 'active' : ''}">${label}</a>`).join('') + '</nav>';
  }
  function navDate(dateStr) {
    return `<div class="nav-date">
      <button class="btn small" data-prev>‹ 前一日</button>
      <strong>${formatCN(dateStr)} · ${weekdayCN(dateStr)}</strong>
      <button class="btn small" data-next>後一日 ›</button>
      <button class="btn small" data-today>今天</button>
    </div>`;
  }

  global.Common = { loadData, getDay, todayStr, parseDate, formatCN, weekdayCN, addDays, seasonClass, colorClass, esc, renderHeader, navDate };
})(window);
