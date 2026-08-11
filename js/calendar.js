(function () {
  'use strict';
  const C = window.Common;
  const I18N = window.I18N;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);

  const LEGEND = [
    ['紫', I18N.t('legendAdvent')], ['红', I18N.t('legendRed')], ['白', I18N.t('legendWhite')],
    ['绿', I18N.t('legendGreen')], ['金/白', I18N.t('legendGold')], ['黑', I18N.t('legendBlack')],
  ];
  const DOW = ['日', '一', '二', '三', '四', '五', '六'];

  function monthTitle(y, m) {
    const lang = I18N.getLang();
    if (lang === 'en') return y + ' / ' + (m + 1);
    if (lang === 'ja') return y + '年 ' + (m + 1) + '月';
    return y + '年' + (m + 1) + '月';
  }

  function init() {
    C.renderHeader('calendar');
    const h1 = document.querySelector('main h1');
    if (h1) h1.textContent = I18N.t('calTitle');
    const foot = document.querySelector('footer.site');
    if (foot) foot.textContent = I18N.t('brand') + ' 2025–2026 · ' + I18N.t('calHint');
    document.title = I18N.t('calTitle') + ' · ' + I18N.t('brand') + ' 2025–2026';
    document.getElementById('prev-month').textContent = I18N.t('prevMonth');
    document.getElementById('next-month').textContent = I18N.t('nextMonth');
    C.loadData().then(render);
    document.getElementById('prev-month').onclick = () => { cur.setMonth(cur.getMonth() - 1); render(); };
    document.getElementById('next-month').onclick = () => { cur.setMonth(cur.getMonth() + 1); render(); };
  }

  function render() {
    const y = cur.getFullYear(), m = cur.getMonth();
    document.getElementById('month-title').textContent = monthTitle(y, m);
    const first = new Date(y, m, 1);
    const startDow = first.getDay(); // 0 = Sun
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = C.todayStr();
    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push('<div class="cal-cell empty"></div>');
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      const day = C.getDay(ds);
      const cls = ['cal-cell'];
      if (ds === today) cls.push('today');
      if (!day) { cells.push(`<div class="${cls.join(' ')}"><div class="d">${d}</div></div>`); continue; }
      const color = day.color ? day.color.split('（')[0].replace('/', '\\/') : '';
      const feast = (I18N.tData(day.feast || (day.weekday === '主日' ? I18N.t('wd_主日') : ''))).replace(/（.*$/g, '');
      cells.push(`<div class="${cls.join(' ')}" data-date="${ds}" title="${ds} ${I18N.tData(day.feast || '')}">
        ${color ? `<span class="color-dot dot-${color}"></span>` : ''}
        <div class="d">${d}</div>
        <div class="f">${C.esc(feast)}</div>
      </div>`);
    }
    document.getElementById('grid').innerHTML =
      DOW.map(d => `<div class="dow">${I18N.t('wd_' + d)}</div>`).join('') +
      cells.join('');
    document.querySelectorAll('.cal-cell[data-date]').forEach(el => {
      el.onclick = () => location.href = 'lesson.html?date=' + el.dataset.date;
    });
    const colorMap = { '紫': '#5b3a8e', '红': '#b3413d', '白': '#d8cfa0', '绿': '#2e7d4f', '金/白': '#d4af37', '黑': '#333' };
    document.getElementById('legend').innerHTML = LEGEND.map(([c, n]) =>
      `<span><i style="background:${colorMap[c]}"></i>${I18N.tData(n)}</span>`).join('');
  }

  init();
})();
