/* lesson.js — 每日一课 */
(function () {
  'use strict';
  const C = window.Common;
  const I18N = window.I18N;

  let day = null;
  let dateStr = null;

  const READING_LABEL = { ot: I18N.t('r_ot'), psalm: I18N.t('r_psalm'), epistle: I18N.t('r_epistle'), gospel: I18N.t('r_gospel') };
  const READING_ORDER = ['ot', 'psalm', 'epistle', 'gospel'];

  function init() {
    document.title = I18N.t('navLesson') + ' · ' + I18N.t('brand') + ' 2025–2026';
    C.renderHeader('lesson');
    dateStr = new URLSearchParams(location.search).get('date') || C.todayStr();
    C.loadData().then(() => {
      day = C.getDay(dateStr) || C.getDay(C.todayStr());
      if (!day) { document.getElementById('app').innerHTML = '<p>资料载入失败</p>'; return; }
      render();
    });
  }

  function render() {
    renderBanner();
    renderNav();
    renderSteps();
  }

  function renderBanner() {
    const colors = day.colors_extra && day.colors_extra.length ? [...day.colors_extra, day.color] : [day.color];
    const chips = [
      `${I18N.t('litColor')}：${I18N.tColor(day.color || '—')}`,
      day.lunar ? `${I18N.t('lunar')} ${I18N.tData(day.lunar)}` : '',
      day.solar_term ? `${I18N.t('solarTerm')}：${I18N.tData(day.solar_term)}` : '',
      day.weekday === '主日' ? I18N.t('wd_主日') : '',
    ].filter(Boolean).map(s => `<span class="chip ${C.colorClass(day.color)}">${C.esc(s)}</span>`).join('');
    const feast = I18N.tData(day.feast) || (day.weekday === '主日' ? I18N.t('wd_主日') : '');
    document.getElementById('banner').innerHTML = `
      <div class="banner ${C.seasonClass(day.season)}">
        <div class="season">${C.esc(I18N.tData(day.season))} · ${C.esc(I18N.tData(day.weekday))}</div>
        <h1>${C.esc(C.formatCN(day.date))}</h1>
        <div class="feast">${C.esc(feast)}</div>
        <div class="meta">${chips}
          <a class="chip chip-read" id="share-open" title="${C.esc(I18N.t('shareTitle'))}">${C.esc(I18N.t('shareBtn'))}</a>
        </div>
      </div>`;
  }

  function renderNav() {
    const prev = C.addDays(dateStr, -1);
    const next = C.addDays(dateStr, 1);
    const el = document.getElementById('navdate');
    el.innerHTML = C.navDate(dateStr);
    el.querySelector('[data-prev]').onclick = () => location.href = 'lesson.html?date=' + prev;
    el.querySelector('[data-next]').onclick = () => location.href = 'lesson.html?date=' + next;
    el.querySelector('[data-today]').onclick = () => location.href = 'lesson.html?date=' + C.todayStr();
  }

  async function renderSteps() {
    const app = document.getElementById('steps');
    app.innerHTML = '<p style="text-align:center;color:#999">载入中…</p>';
    const commentary = await window.Commentary.generate(day);
    const reflectionKey = 'reflection-' + day.date;
    const saved = localStorage.getItem(reflectionKey) || '';

    const steps = [
      {
        n: 1, title: I18N.t('step1'), id: 'reading',
        body: renderReading(),
      },
      {
        n: 2, title: I18N.t('step2'), id: 'audio',
        body: renderAudio(commentary),
      },
      {
        n: 3, title: I18N.t('step3'), id: 'study',
        body: renderStudy(commentary),
      },
      {
        n: 4, title: I18N.t('step4'), id: 'reflect',
        body: `<p>${C.esc(I18N.t('reflectIntro'))}</p>
          <ol>${commentary.questions.map(q => `<li>${C.esc(q)}</li>`).join('')}</ol>
          <p>${C.esc(I18N.t('reflectWrite'))}</p>
          <textarea class="reflect" id="reflect-box" placeholder="${C.esc(I18N.t('reflectPlaceholder'))}">${C.esc(saved)}</textarea>`,
      },
      {
        n: 5, title: I18N.t('step5'), id: 'prayer',
        body: `<div class="prayer">${C.esc(commentary.prayer)}</div>
          <p class="note">${C.esc(I18N.t('prayerNote'))}</p>`,
      },
      {
        n: 6, title: I18N.t('step6'), id: 'worship',
        body: `<p>${C.esc(I18N.t('worshipIntro'))}</p>
          <div class="btnrow">
            <a class="btn primary" href="worship.html?date=${day.date}&mode=morning">${C.esc(I18N.t('worshipMorning'))}</a>
            <a class="btn" href="worship.html?date=${day.date}&mode=eucharist">${C.esc(I18N.t('worshipEucharist'))}</a>
            <a class="btn" href="worship.html?date=${day.date}&mode=evening">${C.esc(I18N.t('worshipEvening'))}</a>
          </div>
          <p class="note">${C.esc(I18N.t('worshipNote'))}</p>`,
      },
    ];

    app.innerHTML = steps.map(s => `
      <section class="card step" id="step-${s.id}">
        <div class="step-title"><span class="section-num">${s.n}</span>${C.esc(s.title)}</div>
        <div class="step-body" data-body="${s.id}"></div>
      </section>`).join('');

    steps.forEach(s => {
      document.querySelector(`[data-body="${s.id}"]`).innerHTML = s.body;
    });

    // share card
    const so = document.getElementById('share-open');
    if (so) so.addEventListener('click', () => window.ShareCard.openShareModal(day));
    const sc = document.getElementById('share-close');
    if (sc) sc.addEventListener('click', () => window.ShareCard.closeShareModal());
    const ov = document.getElementById('share-modal');
    if (ov) ov.addEventListener('click', (e) => { if (e.target === ov) window.ShareCard.closeShareModal(); });

    // reflection autosave
    const box = document.getElementById('reflect-box');
    if (box) box.addEventListener('input', () => localStorage.setItem(reflectionKey, box.value));

    // audio bindings
    document.querySelectorAll('[data-speak-token]').forEach(b => {
      b.addEventListener('click', async () => {
        const token = b.getAttribute('data-speak-token');
        if (window.TTS.isSpeaking()) { window.TTS.stop(); b.textContent = b.getAttribute('data-label') || '🔊 朗读'; return; }
        b.textContent = '⏹ 停止';
        const res = await window.Bible.resolveRefString(token);
        const text = res.verses.map(v => v.text).join('。');
        if (text) window.TTS.speak(text, { onEnd: () => { b.textContent = b.getAttribute('data-label') || '🔊 朗读'; } });
        else { b.textContent = b.getAttribute('data-label') || '🔊 朗读'; }
      });
    });

    // option tabs
    document.querySelectorAll('.tab[data-opt]').forEach(t => {
      t.addEventListener('click', () => {
        document.querySelectorAll('.tab[data-opt]').forEach(x => x.classList.toggle('active', x === t));
        document.querySelectorAll('.opt-panel').forEach(p => p.classList.toggle('hidden', p.dataset.opt !== t.dataset.opt));
      });
    });

    // Bible text lazy render
    renderBibleTexts();
  }

  async function renderBibleTexts() {
    const cards = document.querySelectorAll('[data-ref]');
    for (const card of cards) {
      const refStr = card.getAttribute('data-ref');
      const res = await window.Bible.resolveRefString(refStr);
      if (res.verses.length) {
        card.innerHTML = res.verses.map(v =>
          `<p class="verse ${v.optional ? 'optional' : ''}"><sup>${C.esc(v.num)}</sup>${C.esc(v.text)}</p>`).join('');
      } else {
        card.innerHTML = `<p class="rnote">${C.esc(I18N.tData(res.note || '暂未收录经文。'))}</p>`;
      }
    }
  }

  function readingCard(opt) {
    const order = READING_ORDER.filter(k => opt[k]);
    const cards = order.map(k => {
      const refs = Array.isArray(opt[k]) ? opt[k] : [opt[k]];
      const refsHtml = refs.map(r => `
        <div class="reading rt-${k}">
          <span class="rtag">${READING_LABEL[k]}</span><span class="rref">${C.esc(I18N.tData(r))}</span>
          <button class="btn small speak-btn" data-label="${C.esc(I18N.t('speak'))}" data-speak-token="${C.esc(r)}">${C.esc(I18N.t('speak'))}</button>
          <div class="rtext" data-ref="${C.esc(r)}"></div>
        </div>`).join('');
      return refsHtml;
    }).join('');
    return cards;
  }

  function renderReading() {
    const options = day.communion.options;
    if (options.length > 1) {
      const tabs = `<div class="tabs">${options.map((o, i) =>
        `<div class="tab ${i === 0 ? 'active' : ''}" data-opt="${i}">${C.esc(I18N.tData(o.label))}</div>`).join('')}</div>`;
      const panels = options.map((o, i) =>
        `<div class="opt-panel ${i === 0 ? '' : 'hidden'}" data-opt="${i}">${readingCard(o)}</div>`).join('');
      return tabs + panels;
    }
    const sections = day.communion.sections && day.communion.sections.length
      ? `<div class="note">${C.esc(I18N.t('multimass'))}${day.communion.sections.map(s => C.esc(I18N.tData(s))).join('、')}</div>` : '';
    const extra = renderDailyOffice();
    return sections + readingCard(options[0]) + extra;
  }

  function renderDailyOffice() {
    const sections = [];
    if (day.morning && day.morning.length) {
      sections.push(`<h3 style="margin-top:1.4rem">${C.esc(I18N.t('r_morning'))}</h3>
        ${day.morning.map(r => `<div class="reading rt-morning">
          <span class="rref">${C.esc(I18N.tData(r))}</span>
          <button class="btn small" data-speak-token="${C.esc(r)}" data-label="${C.esc(I18N.t('speak'))}">${C.esc(I18N.t('speak'))}</button>
          <div class="rtext" data-ref="${C.esc(r)}"></div>
        </div>`).join('')}`);
    }
    if (day.evening && day.evening.length) {
      sections.push(`<h3 style="margin-top:1.4rem">${C.esc(I18N.t('r_evening'))}</h3>
        ${day.evening.map(r => `<div class="reading rt-evening">
          <span class="rref">${C.esc(I18N.tData(r))}</span>
          <button class="btn small" data-speak-token="${C.esc(r)}" data-label="${C.esc(I18N.t('speak'))}">${C.esc(I18N.t('speak'))}</button>
          <div class="rtext" data-ref="${C.esc(r)}"></div>
        </div>`).join('')}`);
    }
    return sections.join('');
  }

  function renderAudio() {
    const opts = day.communion.options;
    const primary = opts[0];
    const items = [];
    for (const k of READING_ORDER) {
      const v = primary[k];
      if (!v) continue;
      const refs = Array.isArray(v) ? v : [v];
      refs.forEach(r => items.push({ label: READING_LABEL[k] + ' ' + I18N.tData(r), ref: r }));
    }
    return `<div class="btnrow">
      ${items.map((it, i) =>
        `<button class="btn small" data-speak-token="${C.esc(it.ref)}" data-label="🔊 ${C.esc(it.label)}">🔊 ${C.esc(it.label)}</button>`).join('')}
      </div>
      <p class="note">${C.esc(I18N.t('audioNote'))}</p>`;
  }

  function renderStudy(commentary) {
    const ov = commentary.overview;
    return `
      <h3>${C.esc(I18N.t('studyTheme'))}</h3>
      <div class="keyverse">${C.esc(commentary.theme)}</div>
      ${commentary.keyVerse ? `<h3>${C.esc(I18N.t('studyVerse'))}</h3>
        <div class="keyverse">「${C.esc(commentary.keyVerse.text)}」<div style="text-align:right;font-style:normal">—— ${C.esc(commentary.keyVerse.ref)}</div></div>` : ''}
      <h3>${C.esc(I18N.t('studyOverview'))}</h3>
      ${Object.keys(ov).filter(k => ov[k]).map(k =>
        `<div class="reading rt-${k}"><span class="rtag">${READING_LABEL[k]}</span><span class="rtext">${C.esc(ov[k])}</span></div>`).join('')}
      <h3>${C.esc(I18N.t('studyLessons'))}</h3>
      <div class="commentary">
        ${commentary.lessons.map(l => `<div class="point"><b>${C.esc(l.title)}</b><br>${C.esc(l.body)}</div>`).join('')}
      </div>`;
  }

  init();
})();
