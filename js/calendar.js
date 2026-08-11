(function () {
  'use strict';
  const C = window.Common;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);

  const LEGEND = [
    ['紫', '將臨期／大齋期'], ['紅', '殉道／聖靈降臨'], ['白', '節期／聖日'],
    ['綠', '聖靈降臨期平日'], ['金/白', '主要慶節'], ['黑', '受難日'],
  ];

  function init() {
    C.renderHeader('calendar');
    C.loadData().then(render);
    document.getElementById('prev-month').onclick = () => { cur.setMonth(cur.getMonth() - 1); render(); };
    document.getElementById('next-month').onclick = () => { cur.setMonth(cur.getMonth() + 1); render(); };
  }

  function render() {
    const y = cur.getFullYear(), m = cur.getMonth();
    document.getElementById('month-title').textContent = y + '年' + (m + 1) + '月';
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
      const feast = (day.feast || (day.weekday === '主日' ? '主日' : '')).replace(/（.*$/g, '');
      cells.push(`<div class="${cls.join(' ')}" data-date="${ds}" title="${ds} ${day.feast || ''}">
        ${color ? `<span class="color-dot dot-${color}"></span>` : ''}
        <div class="d">${d}</div>
        <div class="f">${C.esc(feast)}</div>
      </div>`);
    }
    document.getElementById('grid').innerHTML =
      '<div class="dow">日</div><div class="dow">一</div><div class="dow">二</div><div class="dow">三</div><div class="dow">四</div><div class="dow">五</div><div class="dow">六</div>' +
      cells.join('');
    document.querySelectorAll('.cal-cell[data-date]').forEach(el => {
      el.onclick = () => location.href = 'lesson.html?date=' + el.dataset.date;
    });
    document.getElementById('legend').innerHTML = LEGEND.map(([c, n]) =>
      `<span><i style="background:${c === '紫' ? '#5b3a8e' : c === '紅' ? '#b3413d' : c === '白' ? '#d8cfa0' : c === '綠' ? '#2e7d4f' : c === '金/白' ? '#d4af37' : '#333'}"></i>${n}</span>`).join('');
  }

  init();
})();
