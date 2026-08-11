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
        <h1>今日读经</h1>
        <div class="feast">${C.esc(C.formatCN(day.date))} · ${C.esc(day.weekday)}${day.feast ? ' · ' + C.esc(day.feast) : ''}</div>
        <div class="meta">
          <span class="chip ${C.colorClass(day.color)}">礼仪颜色：${C.esc(day.color || '—')}</span>
          ${day.lunar ? `<span class="chip">农历 ${C.esc(day.lunar)}</span>` : ''}
          <a class="chip chip-read" href="lesson.html?date=${day.date}" title="进入今日读经一课">我要读经</a>
          ${day.solar_term ? `<span class="chip">节气：${C.esc(day.solar_term)}</span>` : ''}
        </div>
      </div>`;
  }

  function renderToday(day) {
    const opt = day.communion.options[0];
    const order = ['ot', 'psalm', 'epistle', 'gospel'];
    const label = { ot: '旧约经课', psalm: '诗篇', epistle: '书信', gospel: '福音' };
    const refs = order.filter(k => opt[k]).map(k => {
      const v = opt[k];
      const r = Array.isArray(v) ? v[0] : v;
      return `<div class="reading rt-${k}"><span class="rtag">${label[k]}</span><span class="rref">${C.esc(r)}</span></div>`;
    }).join('');
    const el = document.getElementById('today');
    const color = day.color || null;
    const colorShow = color ? `
      <div class="color-show">
        <span class="swatch" style="background:${C.colorHex(color)}"></span>
        <div>
          <div class="cname">礼仪颜色：${C.esc(color)}</div>
          <div class="cdesc">${C.esc(C.colorDesc(color) || '当日崇拜主题所用礼仪颜色')}${C.esc(day.season ? ' · ' + day.season : '')}</div>
        </div>
      </div>
      <div class="color-legend">
        ${Object.entries(C.COLOR_HEX).map(([k, h]) => `<span class="lg"><i style="background:${h}"></i>${C.esc(k)}${k === color ? '（今日）' : ''}</span>`).join('')}
      </div>` : '';
    el.innerHTML = `
      <section class="card">
        <h2>今日经课</h2>
        ${colorShow}
        ${refs}
        ${day.communion.options.length > 1 ? '<p class="note">本主日提供「互补式／半连读式」两套经课，可于每日一课页面查看。</p>' : ''}
        <div class="btnrow">
          <a class="btn primary" href="lesson.html?date=${day.date}">进入今日一课 →</a>
          <a class="btn" href="worship.html?date=${day.date}&mode=morning">线上崇拜</a>
          <a class="btn" href="calendar.html">查看读经历</a>
        </div>
      </section>`;
  }

  function renderQuick() {
    const el = document.getElementById('quick');
    const days = [
      ['2025-11-30', '将临期第一主日（甲年开始）'],
      ['2025-12-25', '救主圣诞日'],
      ['2026-02-18', '大斋首日'],
      ['2026-04-05', '救主复活日'],
      ['2026-05-24', '圣灵降临日'],
      ['2026-11-29', '将临期第一主日（乙年开始）'],
    ];
    el.innerHTML = `<section class="card"><h2>重要节期</h2>
      <table class="stats"><tbody>
        ${days.map(([d, name]) => `<tr><td>${C.esc(d)}</td><td><a href="lesson.html?date=${d}">${C.esc(name)}</a></td></tr>`).join('')}
      </tbody></table>
      <p><a href="about.html">深入了解这本读经表的内容 →</a></p>
    </section>`;
  }

  init();
})();
