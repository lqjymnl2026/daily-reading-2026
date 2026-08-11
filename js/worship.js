(function () {
  'use strict';
  const C = window.Common;
  const I18N = window.I18N;
  let day = null;
  let dateStr = null;
  let mode = 'morning';

  function init() {
    document.title = I18N.t('navWorship') + ' · ' + I18N.t('brand') + ' 2025–2026';
    C.renderHeader('worship');
    const params = new URLSearchParams(location.search);
    dateStr = params.get('date') || C.todayStr();
    mode = params.get('mode') || 'morning';
    const noteEl = document.getElementById('worship-note');
    if (noteEl) noteEl.textContent = I18N.t('worshipRubric');
    C.loadData().then(() => {
      day = C.getDay(dateStr) || C.getDay(C.todayStr());
      renderBanner();
      renderNav();
      renderModes();
      renderLiturgy();
    });
  }

  function renderBanner() {
    const feast = I18N.tData(day.feast) || (day.weekday === '主日' ? '主日' : '平日');
    document.getElementById('banner').innerHTML = `
      <div class="banner ${C.seasonClass(day.season)}">
        <div class="season">${C.esc(I18N.t('navWorship'))} · ${C.esc(I18N.tData(day.season))}</div>
        <h1>${C.esc(C.formatCN(day.date))} · ${C.esc(feast)}</h1>
        <div class="meta"><span class="chip ${C.colorClass(day.color)}">${C.esc(I18N.t('litColor'))}：${C.esc(I18N.tColor(day.color || '—'))}</span></div>
      </div>`;
  }

  function renderNav() {
    const prev = C.addDays(dateStr, -1);
    const next = C.addDays(dateStr, 1);
    const el = document.getElementById('navdate');
    el.innerHTML = C.navDate(dateStr);
    el.querySelector('[data-prev]').onclick = () => location.href = `worship.html?date=${prev}&mode=${mode}`;
    el.querySelector('[data-next]').onclick = () => location.href = `worship.html?date=${next}&mode=${mode}`;
    el.querySelector('[data-today]').onclick = () => location.href = `worship.html?date=${C.todayStr()}&mode=${mode}`;
  }

  function renderModes() {
    const el = document.getElementById('modes');
    const keys = ['morning', 'eucharist', 'evening'];
    el.innerHTML = keys.map(k =>
      `<div class="tab ${k === mode ? 'active' : ''}" data-mode="${k}">${C.esc(I18N.t(window.Liturgy.MODES[k].labelKey))}</div>`).join('');
    el.querySelectorAll('.tab').forEach(t => {
      t.onclick = () => { mode = t.dataset.mode; history.replaceState(null, '', `worship.html?date=${dateStr}&mode=${mode}`); renderLiturgy(); renderModes(); };
    });
  }

  async function renderLiturgy() {
    const root = document.getElementById('liturgy');
    const def = window.Liturgy.MODES[mode];
    const opt = day.communion.options[0];
    const collect = window.Liturgy.collect(day);

    let html = `<h2 style="color:var(--gold)">${C.esc(I18N.t(def.labelKey))}</h2>
      <p class="note">${C.esc(I18N.t(def.subKey))}</p>`;

    for (const step of def.steps) {
      html += `<div class="worship-step">
        <div class="who">${C.esc(window.Liturgy.heading(step.heading))}</div>`;
      if (step.collect) {
        html += `<div class="text">${C.esc(collect)}</div>`;
      } else if (step.reading) {
        const refs = [];
        if (step.reading === 'psalm') refs.push(opt.psalm);
        else if (step.reading === 'ot') refs.push(opt.ot);
        else if (step.reading === 'epistle') refs.push(opt.epistle);
        else if (step.reading === 'gospel') refs.push(opt.gospel);
        const rr = refs.filter(Boolean);
        if (rr.length) {
          for (const r of (Array.isArray(rr[0]) ? rr[0] : rr)) {
            html += `<div class="text"><b>${C.esc(I18N.tData(r))}</b>
              <button class="btn small speak-btn" data-label="🔊" data-speak-token="${C.esc(r)}">🔊</button>
              <div data-ref="${C.esc(r)}"></div></div>`;
          }
        } else {
          html += `<div class="rubric">${C.esc(I18N.tData('（本日此类经课未有指定）'))}</div>`;
        }
      } else if (step.steps) {
        for (const s of step.steps) {
          html += `<div class="text ${s.rubric ? 'rubric' : ''}"><span class="${s.who === '会众' ? 'resp' : 'leader'}">${C.esc(window.Liturgy.LS(s))}</span></div>`;
        }
      }
      html += `</div>`;
    }

    root.innerHTML = html;

    // render bible texts
    const cards = root.querySelectorAll('[data-ref]');
    for (const card of cards) {
      const refStr = card.getAttribute('data-ref');
      const res = await window.Bible.resolveRefString(refStr);
      if (res.verses.length) {
        card.innerHTML = res.verses.map(v => `<p class="verse ${v.optional ? 'optional' : ''}" style="margin:.15rem 0"><sup>${C.esc(v.num)}</sup>${C.esc(v.text)}</p>`).join('');
      } else {
        card.innerHTML = `<span class="rubric">${C.esc(res.note || '')}</span>`;
      }
    }

    // audio
    root.querySelectorAll('[data-speak-token]').forEach(b => {
      b.addEventListener('click', async () => {
        const res = await window.Bible.resolveRefString(b.getAttribute('data-speak-token'));
        const text = res.verses.map(v => v.text).join('');
        if (window.TTS.isSpeaking()) { window.TTS.stop(); b.textContent = '🔊'; return; }
        b.textContent = '⏹';
        window.TTS.speak(text, { onEnd: () => { b.textContent = '🔊'; } });
      });
    });
  }

  init();
})();
