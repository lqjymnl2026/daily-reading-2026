/* bible.js — load per-book 和合本 text and resolve parsed refs into verse strings */
(function (global) {
  'use strict';

  const cache = {};       // abbr -> [[verse,...], ...] chapters
  const pending = {};     // abbr -> Promise

  function loadBook(abbr) {
    if (cache[abbr]) return Promise.resolve(cache[abbr]);
    if (pending[abbr]) return pending[abbr];
    // apocrypha books have no bundled text
    const apoc = ['to','jdt','sir','wis','1esd','2esd','bar','epjr','prma','3song','sus','bel','addest','1ma','2ma'];
    if (apoc.indexOf(abbr) >= 0) return Promise.resolve(null);
    pending[abbr] = fetch(`data/bible/${abbr}.json`)
      .then(r => { if (!r.ok) throw new Error('no book ' + abbr); return r.json(); })
      .then(chs => { cache[abbr] = chs; return chs; })
      .finally(() => { delete pending[abbr]; });
    return pending[abbr];
  }

  function verseCount(chs, chapter) {
    if (!chs || !chs[chapter - 1]) return 0;
    return chs[chapter - 1].length;
  }

  function splitHalf(text, half) {
    if (!half) return text;
    // split the verse text roughly in half by characters
    const chars = Array.from(text);
    const mid = Math.floor(chars.length / 2);
    if (half === '上') return chars.slice(0, mid).join('');
    if (half === '下') return chars.slice(mid).join('');
    return text;
  }

  /**
   * Resolve a parsed passage (from RefParser.parseRef) to verse strings.
   * Returns { verses: [ {num, text, optional} ], note: string|null }
   */
  async function resolvePassage(passage) {
    const { book, chapter, start, end, end_chapter, start_half, end_half, optional, whole_book } = passage;
    const chs = await loadBook(book);
    if (!chs) return { verses: [], note: '次經書卷：此網站暫未收錄經文全文，請參考《次經全書》或線上聖經。' };
    const out = [];
    let c = chapter;
    if (whole_book) {
      // all chapters, first verse of each chapter as representative
      for (let i = 0; i < chs.length; i++) {
        const v = chs[i][0];
        if (v) out.push({ num: `${i + 1}：1`, text: v, optional: false });
      }
      return { verses: out, note: '整卷書卷：此處顯示每章首節作為代表。' };
    }
    const cEnd = end_chapter != null ? end_chapter : chapter;
    for (let cc = chapter; cc <= cEnd; cc++) {
      const chVerses = chs[cc - 1];
      if (!chVerses) break;
      const vStart = (cc === chapter) ? start : 1;
      const vEnd = (cc === cEnd && end != null) ? end : chVerses.length;
      for (let v = vStart; v <= vEnd; v++) {
        const raw = chVerses[v - 1];
        if (raw == null) continue;
        let text = raw;
        let half = null;
        if (cc === cEnd && v === vEnd) {
          half = end_half || (cc === chapter && v === vStart ? start_half : null);
        } else if (cc === chapter && v === vStart && start_half) {
          half = start_half;
        }
        text = splitHalf(raw, half);
        out.push({ num: `${cc}：${v}`, text, optional: !!optional });
      }
    }
    return { verses: out, note: null };
  }

  /** Resolve a whole ref string (e.g. "賽2：1－5") into verses. */
  async function resolveRefString(refStr) {
    const passages = global.RefParser.parseRef(refStr);
    if (!passages) {
      const parenAlt = refStr.match(/^（或(.+)）$/);
      if (parenAlt) {
        return { verses: [], note: '可選經文（或）：「' + parenAlt[1] + '」，與本日對應經課二選一使用。', passages: null };
      }
      return { verses: [], note: '此條為註記／替代選項，請參照讀經表使用：' + refStr, passages: null };
    }
    const all = [];
    let note = null;
    for (const p of passages) {
      const res = await resolvePassage(p);
      if (res.note && !note) note = res.note;
      all.push(...res.verses);
    }
    return { verses: all, note, passages };
  }

  global.Bible = { loadBook, resolvePassage, resolveRefString, verseCount };
})(window);
