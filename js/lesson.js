/* lesson.js — 每日一課 */
(function () {
  'use strict';
  const C = window.Common;

  let day = null;
  let dateStr = null;

  const READING_LABEL = { ot: '舊約經課', psalm: '詩篇', epistle: '書信經課', gospel: '福音經課' };
  const READING_ORDER = ['ot', 'psalm', 'epistle', 'gospel'];

  function init() {
    C.renderHeader('lesson');
    dateStr = new URLSearchParams(location.search).get('date') || C.todayStr();
    C.loadData().then(() => {
      day = C.getDay(dateStr) || C.getDay(C.todayStr());
      if (!day) { document.getElementById('app').innerHTML = '<p>資料載入失敗</p>'; return; }
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
      `禮儀顏色：${day.color || '—'}`,
      day.lunar ? `農曆 ${day.lunar}` : '',
      day.solar_term ? `節氣：${day.solar_term}` : '',
      day.weekday === '主日' ? '主日' : '',
    ].filter(Boolean).map(s => `<span class="chip ${C.colorClass(day.color)}">${C.esc(s)}</span>`).join('');
    const feast = day.feast || (day.weekday === '主日' ? '主日' : '平日');
    document.getElementById('banner').innerHTML = `
      <div class="banner ${C.seasonClass(day.season)}">
        <div class="season">${C.esc(day.season)} · ${C.esc(day.weekday)}</div>
        <h1>${C.esc(C.formatCN(day.date))}</h1>
        <div class="feast">${C.esc(feast)}</div>
        <div class="meta">${chips}</div>
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
    app.innerHTML = '<p style="text-align:center;color:#999">載入中…</p>';
    const commentary = await window.Commentary.generate(day);
    const reflectionKey = 'reflection-' + day.date;
    const saved = localStorage.getItem(reflectionKey) || '';

    const steps = [
      {
        n: 1, title: '文本閱讀', id: 'reading',
        body: renderReading(),
      },
      {
        n: 2, title: '語音朗讀', id: 'audio',
        body: renderAudio(commentary),
      },
      {
        n: 3, title: '今日釋經與屬靈教訓', id: 'study',
        body: renderStudy(commentary),
      },
      {
        n: 4, title: '默想與感受回應', id: 'reflect',
        body: `<p>安靜片刻，用以下問題幫助自己默想今天的經文：</p>
          <ol>${commentary.questions.map(q => `<li>${C.esc(q)}</li>`).join('')}</ol>
          <p>也可以在這裡寫下你的讀經感受（自動儲存在本機瀏覽器）：</p>
          <textarea class="reflect" id="reflect-box" placeholder="寫下你今天讀經的感受、亮光或回應……">${C.esc(saved)}</textarea>`,
      },
      {
        n: 5, title: '回應禱文', id: 'prayer',
        body: `<div class="prayer">${C.esc(commentary.prayer)}</div>
          <p class="note">你也可以加上自己的祈禱，把今天的領受帶到上主面前。</p>`,
      },
      {
        n: 6, title: '線上崇拜', id: 'worship',
        body: `<p>按今天的主題與經課，進入聖公會式的線上崇拜：</p>
          <div class="btnrow">
            <a class="btn primary" href="worship.html?date=${day.date}&mode=morning">早禱崇拜</a>
            <a class="btn" href="worship.html?date=${day.date}&mode=eucharist">聖餐崇拜</a>
            <a class="btn" href="worship.html?date=${day.date}&mode=evening">晚禱崇拜</a>
          </div>
          <p class="note">崇拜流程參考香港聖公會《公禱書》結構，祝文為改寫版本。</p>`,
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

    // reflection autosave
    const box = document.getElementById('reflect-box');
    if (box) box.addEventListener('input', () => localStorage.setItem(reflectionKey, box.value));

    // audio bindings
    document.querySelectorAll('[data-speak-token]').forEach(b => {
      b.addEventListener('click', async () => {
        const token = b.getAttribute('data-speak-token');
        if (window.TTS.isSpeaking()) { window.TTS.stop(); b.textContent = b.getAttribute('data-label') || '🔊 朗讀'; return; }
        b.textContent = '⏹ 停止';
        const res = await window.Bible.resolveRefString(token);
        const text = res.verses.map(v => v.text).join('。');
        if (text) window.TTS.speak(text, { onEnd: () => { b.textContent = b.getAttribute('data-label') || '🔊 朗讀'; } });
        else { b.textContent = b.getAttribute('data-label') || '🔊 朗讀'; }
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
        card.innerHTML = `<p class="rnote">${C.esc(res.note || '暫未收錄經文。')}</p>`;
      }
    }
  }

  function readingCard(opt) {
    const order = READING_ORDER.filter(k => opt[k]);
    const cards = order.map(k => {
      const refs = Array.isArray(opt[k]) ? opt[k] : [opt[k]];
      const refsHtml = refs.map(r => `
        <div class="reading rt-${k}">
          <span class="rtag">${READING_LABEL[k]}</span><span class="rref">${C.esc(r)}</span>
          <button class="btn small speak-btn" data-label="🔊 朗讀" data-speak-token="${C.esc(r)}">🔊 朗讀</button>
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
        `<div class="tab ${i === 0 ? 'active' : ''}" data-opt="${i}">${C.esc(o.label)}</div>`).join('')}</div>`;
      const panels = options.map((o, i) =>
        `<div class="opt-panel ${i === 0 ? '' : 'hidden'}" data-opt="${i}">${readingCard(o)}</div>`).join('');
      return tabs + panels;
    }
    const sections = day.communion.sections && day.communion.sections.length
      ? `<div class="note">本日有多場崇拜經課：${day.communion.sections.map(C.esc).join('、')}</div>` : '';
    const extra = renderDailyOffice();
    return sections + readingCard(options[0]) + extra;
  }

  function renderDailyOffice() {
    const sections = [];
    if (day.morning && day.morning.length) {
      sections.push(`<h3 style="margin-top:1.4rem">早禱經課（補充）</h3>
        ${day.morning.map(r => `<div class="reading rt-morning">
          <span class="rref">${C.esc(r)}</span>
          <button class="btn small" data-speak-token="${C.esc(r)}" data-label="🔊 朗讀">🔊 朗讀</button>
          <div class="rtext" data-ref="${C.esc(r)}"></div>
        </div>`).join('')}`);
    }
    if (day.evening && day.evening.length) {
      sections.push(`<h3 style="margin-top:1.4rem">晚禱經課（補充）</h3>
        ${day.evening.map(r => `<div class="reading rt-evening">
          <span class="rref">${C.esc(r)}</span>
          <button class="btn small" data-speak-token="${C.esc(r)}" data-label="🔊 朗讀">🔊 朗讀</button>
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
      refs.forEach(r => items.push({ label: READING_LABEL[k] + ' ' + r, ref: r }));
    }
    return `<div class="btnrow">
      ${items.map((it, i) =>
        `<button class="btn small" data-speak-token="${C.esc(it.ref)}" data-label="🔊 ${C.esc(it.label)}">🔊 ${C.esc(it.label)}</button>`).join('')}
      </div>
      <p class="note">使用中文語音朗讀：桌面／iOS 用瀏覽器內置語音；<b>Android 自動改用「在線語音」</b>（需網絡）。若仍無聲，請確認裝置已安裝 Google 文字轉語音並下載中文語音。</p>`;
  }

  function renderStudy(commentary) {
    const ov = commentary.overview;
    return `
      <h3>今日主題</h3>
      <div class="keyverse">${C.esc(commentary.theme)}</div>
      ${commentary.keyVerse ? `<h3>今日金句</h3>
        <div class="keyverse">「${C.esc(commentary.keyVerse.text)}」<div style="text-align:right;font-style:normal">—— ${C.esc(commentary.keyVerse.ref)}</div></div>` : ''}
      <h3>經課概覽</h3>
      ${Object.keys(ov).filter(k => ov[k]).map(k =>
        `<div class="reading rt-${k}"><span class="rtag">${READING_LABEL[k]}</span><span class="rtext">${C.esc(ov[k])}</span></div>`).join('')}
      <h3>屬靈教訓</h3>
      <div class="commentary">
        ${commentary.lessons.map(l => `<div class="point"><b>${C.esc(l.title)}</b><br>${C.esc(l.body)}</div>`).join('')}
      </div>`;
  }

  init();
})();
