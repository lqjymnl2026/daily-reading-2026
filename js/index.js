(function () {
  'use strict';
  const C = window.Common;
  const I18N = window.I18N;

  function init() {
    document.title = I18N.t('navToday') + ' · ' + I18N.t('brand') + ' 2025–2026';
    C.renderHeader('today');
    C.loadData().then(() => {
      const today = C.getDay(C.todayStr()) || C.getDay('2026-01-01');
      renderHero(today);
      renderToday(today);
      renderQuick();
      const openShare = () => window.ShareCard.openShareModal(today);
      const so = document.getElementById('share-open');
      if (so) so.addEventListener('click', openShare);
      const so2 = document.getElementById('share-open-2');
      if (so2) so2.addEventListener('click', openShare);
      const close = document.getElementById('share-close');
      if (close) close.addEventListener('click', () => window.ShareCard.closeShareModal());
      const overlay = document.getElementById('share-modal');
      if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) window.ShareCard.closeShareModal(); });
    });
  }

  function renderHero(day) {
    const el = document.getElementById('hero');
    el.innerHTML = `
      <div class="banner ${C.seasonClass(day.season)}">
        <div class="season">${C.esc(I18N.tData(day.season))}</div>
        <h1>${C.esc(I18N.t('heroTitle'))}</h1>
        <div class="feast">${C.esc(C.formatCN(day.date))} · ${C.esc(I18N.tData(day.weekday))}${day.feast ? ' · ' + C.esc(I18N.tData(day.feast)) : ''}</div>
        <div class="meta">
          <span class="chip ${C.colorClass(day.color)}">${C.esc(I18N.t('litColor'))}：${C.esc(I18N.tColor(day.color || '—'))}</span>
          ${day.lunar ? `<span class="chip">${C.esc(I18N.t('lunar'))} ${C.esc(I18N.tData(day.lunar))}</span>` : ''}
          <a class="chip chip-read" id="share-open" title="${C.esc(I18N.t('shareTitle'))}">${C.esc(I18N.t('shareBtn'))}</a>
          ${day.solar_term ? `<span class="chip">${C.esc(I18N.t('solarTerm'))}：${C.esc(I18N.tData(day.solar_term))}</span>` : ''}
        </div>
      </div>`;
  }

  function renderToday(day) {
    const opt = day.communion.options[0];
    const order = ['ot', 'psalm', 'epistle', 'gospel'];
    const label = { ot: I18N.t('r_ot'), psalm: I18N.t('r_psalm'), epistle: I18N.t('r_epistle'), gospel: I18N.t('r_gospel') };
    const refs = order.filter(k => opt[k]).map(k => {
      const v = opt[k];
      const r = Array.isArray(v) ? v[0] : v;
      return `<div class="reading rt-${k}"><span class="rtag">${label[k]}</span><span class="rref">${C.esc(I18N.tData(r))}</span></div>`;
    }).join('');
    const el = document.getElementById('today');
    const color = day.color || null;
    const colorShow = color ? `
      <div class="color-show">
        <span class="swatch" style="background:${C.colorHex(color)}"></span>
        <div>
          <div class="cname">${C.esc(I18N.t('litColor'))}：${C.esc(I18N.tColor(color))}</div>
          <div class="cdesc">${C.esc(I18N.tData(C.colorDesc(color) || ''))}${C.esc(day.season ? ' · ' + I18N.tData(day.season) : '')}</div>
        </div>
      </div>
      <div class="color-legend">
        ${Object.entries(C.COLOR_HEX).map(([k, h]) => `<span class="lg"><i style="background:${h}"></i>${C.esc(I18N.tColor(k))}${I18N.tColor(k) === I18N.tColor(color) ? '（' + I18N.t('todayBtn') + '）' : ''}</span>`).join('')}
      </div>` : '';
    el.innerHTML = `
      <section class="card">
        <h2>${C.esc(I18N.t('todayLesson'))}</h2>
        ${colorShow}
        ${refs}
        ${day.communion.options.length > 1 ? '<p class="note">' + C.esc(I18N.t('noteComplement')) + '</p>' : ''}
        <div class="btnrow">
          <a class="btn primary" href="lesson.html?date=${day.date}">${C.esc(I18N.t('enterLesson'))}</a>
          <button class="btn" id="share-open-2">${C.esc(I18N.t('shareBtn2'))}</button>
          <a class="btn" href="worship.html?date=${day.date}&mode=morning">${C.esc(I18N.t('onlineWorship'))}</a>
          <a class="btn" href="calendar.html">${C.esc(I18N.t('viewCalendar'))}</a>
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
    el.innerHTML = `<section class="card"><h2>${C.esc(I18N.t('importantFeasts'))}</h2>
      <table class="stats"><tbody>
        ${days.map(([d, name]) => `<tr><td>${C.esc(d)}</td><td><a href="lesson.html?date=${d}">${C.esc(I18N.tData(name))}</a></td></tr>`).join('')}
      </tbody></table>
      <p><a href="about.html">${C.esc(I18N.t('learnMore'))}</a></p>
    </section>`;
  }

  init();
})();
