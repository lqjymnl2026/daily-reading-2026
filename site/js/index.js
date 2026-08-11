(function () {
  'use strict';
  const C = window.Common;

  function init() {
    C.renderHeader('today');
    C.loadData().then(() => {
      const today = C.getDay(C.todayStr()) || C.getDay('2026-01-01');
      renderHero(today);
      renderToday(today);
      renderQuick();
    });
  }

  function renderHero(day) {
    const el = document.getElementById('hero');
    el.innerHTML = `
      <div class="banner ${C.seasonClass(day.season)}">
        <div class="season">${C.esc(day.season)}</div>
        <h1>今日讀經</h1>
        <div class="feast">${C.esc(C.formatCN(day.date))} · ${C.esc(day.weekday)}${day.feast ? ' · ' + C.esc(day.feast) : ''}</div>
        <div class="meta">
          <span class="chip ${C.colorClass(day.color)}">禮儀顏色：${C.esc(day.color || '—')}</span>
          ${day.lunar ? `<span class="chip">農曆 ${C.esc(day.lunar)}</span>` : ''}
          ${day.solar_term ? `<span class="chip">節氣：${C.esc(day.solar_term)}</span>` : ''}
        </div>
      </div>`;
  }

  function renderToday(day) {
    const opt = day.communion.options[0];
    const order = ['ot', 'psalm', 'epistle', 'gospel'];
    const label = { ot: '舊約經課', psalm: '詩篇', epistle: '書信', gospel: '福音' };
    const refs = order.filter(k => opt[k]).map(k => {
      const v = opt[k];
      const r = Array.isArray(v) ? v[0] : v;
      return `<div class="reading rt-${k}"><span class="rtag">${label[k]}</span><span class="rref">${C.esc(r)}</span></div>`;
    }).join('');
    const el = document.getElementById('today');
    el.innerHTML = `
      <section class="card">
        <h2>今日經課</h2>
        ${refs}
        ${day.communion.options.length > 1 ? '<p class="note">本主日提供「互補式／半連讀式」兩套經課，可於每日一課頁面查看。</p>' : ''}
        <div class="btnrow">
          <a class="btn primary" href="lesson.html?date=${day.date}">進入今日一課 →</a>
          <a class="btn" href="worship.html?date=${day.date}&mode=morning">線上崇拜</a>
          <a class="btn" href="calendar.html">查看讀經曆</a>
        </div>
      </section>`;
  }

  function renderQuick() {
    const el = document.getElementById('quick');
    const days = [
      ['2025-11-30', '將臨期第一主日（甲年開始）'],
      ['2025-12-25', '救主聖誕日'],
      ['2026-02-18', '大齋首日'],
      ['2026-04-05', '救主復活日'],
      ['2026-05-24', '聖靈降臨日'],
      ['2026-11-29', '將臨期第一主日（乙年開始）'],
    ];
    el.innerHTML = `<section class="card"><h2>重要節期</h2>
      <table class="stats"><tbody>
        ${days.map(([d, name]) => `<tr><td>${C.esc(d)}</td><td><a href="lesson.html?date=${d}">${C.esc(name)}</a></td></tr>`).join('')}
      </tbody></table>
      <p><a href="about.html">深入了解這本讀經表的內容 →</a></p>
    </section>`;
  }

  init();
})();
