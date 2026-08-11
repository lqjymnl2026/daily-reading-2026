/* refs.js — lectionary reference parser (JS port of analysis/parse_refs.py) */
(function (global) {
  'use strict';

  const SHORT = {
    '創':'gn','出':'ex','利':'lv','民':'nm','申':'dt','書':'js','士':'jud','得':'rt',
    '撒上':'1sm','撒下':'2sm','王上':'1kgs','王下':'2kgs','代上':'1ch','代下':'2ch',
    '拉':'ezr','尼':'ne','斯':'et','伯':'job','詩':'ps','箴':'prv','傳':'ec','歌':'so',
    '賽':'is','耶':'jr','哀':'lm','結':'ez','但':'dn','何':'ho','珥':'jl','摩':'am',
    '俄':'ob','拿':'jn','彌':'mi','鴻':'na','哈':'hk','番':'zp','該':'hg','亞':'zc',
    '瑪':'ml','太':'mt','可':'mk','路':'lk','約':'jo','徒':'act','羅':'rm','林前':'1co',
    '林後':'2co','加':'gl','弗':'eph','腓':'ph','西':'cl','帖前':'1ts','帖後':'2ts',
    '提前':'1tm','提後':'2tm','多':'tt','門':'phm','來':'hb','彼前':'1pe','彼後':'2pe',
    '約一':'1jo','約二':'2jo','約三':'3jo','猶':'jd','啟':'re',
    '多比':'to','滴':'jdt','便':'sir','所':'wis','拉上':'1esd','拉下':'2esd','巴':'bar',
    '耶信':'epjr','禱':'prma','童':'3song','蘇':'sus','勒':'bel','斯補':'addest',
    '馬一':'1ma','馬二':'2ma'
  };
  const FULL = {
    '創世記':'gn','出埃及記':'ex','利未記':'lv','民數記':'nm','申命記':'dt',
    '約書亞記':'js','士師記':'jud','路得記':'rt','撒母耳記上':'1sm','撒母耳記下':'2sm',
    '列王紀上':'1kgs','列王紀下':'2kgs','歷代志上':'1ch','歷代志下':'2ch',
    '以斯拉記':'ezr','尼希米記':'ne','以斯帖記':'et','約伯記':'job','詩篇':'ps',
    '箴言':'prv','傳道書':'ec','雅歌':'so','以賽亞書':'is','耶利米書':'jr',
    '耶利米哀歌':'lm','以西結書':'ez','但以理書':'dn','何西阿書':'ho','約珥書':'jl',
    '阿摩司書':'am','俄巴底亞書':'ob','約拿書':'jn','彌迦書':'mi','那鴻書':'na',
    '哈巴谷書':'hk','西番雅書':'zp','哈該書':'hg','撒迦利亞書':'zc','瑪拉基書':'ml',
    '馬太福音':'mt','馬可福音':'mk','路加福音':'lk','約翰福音':'jo','使徒行傳':'act',
    '羅馬書':'rm','哥林多前書':'1co','哥林多後書':'2co','加拉太書':'gl','以弗所書':'eph',
    '腓立比書':'ph','歌羅西書':'cl','帖撒羅尼迦前書':'1ts','帖撒羅尼迦後書':'2ts',
    '提摩太前書':'1tm','提摩太後書':'2tm','提多書':'tt','腓利門書':'phm','希伯來書':'hb',
    '雅各書':'jm','彼得前書':'1pe','彼得後書':'2pe','約翰壹書':'1jo','約翰貳書':'2jo',
    '約翰參書':'3jo','猶大書':'jd','啟示錄':'re',
    '多比傳':'to','猶滴傳':'jdt','便西拉智訓':'sir','所羅門智訓':'wis',
    '以斯拉續編上卷':'1esd','以斯拉續編下卷':'2esd','巴錄書':'bar','耶利米書信':'epjr',
    '瑪拿西禱言':'prma','三童歌':'3song','蘇撒拿傳':'sus','彼勒與大龍':'bel',
    '以斯帖補編':'addest','馬加比一書':'1ma','馬加比二書':'2ma'
  };
  const ALIAS = { '約壹':'1jo', '約貳':'2jo', '約參':'3jo' };
  const AMBIG = { '雅': [['jm', 5], ['so', 8]] };
  const ZH = {
    'gn':'創世記','ex':'出埃及記','lv':'利未記','nm':'民數記','dt':'申命記','js':'約書亞記',
    'jud':'士師記','rt':'路得記','1sm':'撒母耳記上','2sm':'撒母耳記下','1kgs':'列王紀上',
    '2kgs':'列王紀下','1ch':'歷代志上','2ch':'歷代志下','ezr':'以斯拉記','ne':'尼希米記',
    'et':'以斯帖記','job':'約伯記','ps':'詩篇','prv':'箴言','ec':'傳道書','so':'雅歌',
    'is':'以賽亞書','jr':'耶利米書','lm':'耶利米哀歌','ez':'以西結書','dn':'但以理書',
    'ho':'何西阿書','jl':'約珥書','am':'阿摩司書','ob':'俄巴底亞書','jn':'約拿書',
    'mi':'彌迦書','na':'那鴻書','hk':'哈巴谷書','zp':'西番雅書','hg':'哈該書','zc':'撒迦利亞書',
    'ml':'瑪拉基書','mt':'馬太福音','mk':'馬可福音','lk':'路加福音','jo':'約翰福音',
    'act':'使徒行傳','rm':'羅馬書','1co':'哥林多前書','2co':'哥林多後書','gl':'加拉太書',
    'eph':'以弗所書','ph':'腓立比書','cl':'歌羅西書','1ts':'帖撒羅尼迦前書','2ts':'帖撒羅尼迦後書',
    '1tm':'提摩太前書','2tm':'提摩太後書','tt':'提多書','phm':'腓利門書','hb':'希伯來書',
    'jm':'雅各書','1pe':'彼得前書','2pe':'彼得後書','1jo':'約翰壹書','2jo':'約翰貳書',
    '3jo':'約翰參書','jd':'猶大書','re':'啟示錄',
    'to':'多比傳','jdt':'猶滴傳','sir':'便西拉智訓','wis':'所羅門智訓','1esd':'以斯拉續編上卷',
    '2esd':'以斯拉續編下卷','bar':'巴錄書','epjr':'耶利米書信','prma':'瑪拿西禱言',
    '3song':'三童歌','sus':'蘇撒拿傳','bel':'彼勒與大龍','addest':'以斯帖補編',
    '1ma':'馬加比一書','2ma':'馬加比二書'
  };
  const SINGLE_CHAPTER = ['2jo', '3jo', 'jd', 'phm', '3song', 'prma', 'sus', 'bel'];

  function splitBook(ref) {
    const names = Object.keys(FULL).concat(Object.keys(ALIAS)).concat(Object.keys(SHORT)).concat(Object.keys(AMBIG));
    names.sort((a, b) => b.length - a.length);
    for (const name of names) {
      if (!ref.startsWith(name)) continue;
      if (FULL[name] !== undefined) return [name, FULL[name], ref.slice(name.length)];
      if (ALIAS[name] !== undefined) return [name, ALIAS[name], ref.slice(name.length)];
      if (SHORT[name] !== undefined) return [name, SHORT[name], ref.slice(name.length)];
      if (AMBIG[name] !== undefined) return [name, AMBIG[name][0][0], ref.slice(name.length)];
    }
    return [null, null, null];
  }

  function resolveAmbig(book, abbr, chapter) {
    if (AMBIG[book]) {
      for (const [cand, chapters] of AMBIG[book]) {
        if (cand === abbr) continue;
        if (chapters != null && chapter != null && chapter > chapters) continue;
        return cand;
      }
    }
    return abbr;
  }

  function parseVerseGroup(g, chapter) {
    g = g.trim();
    if (!g) return null;
    let opt = false;
    if (g.startsWith('[') && g.endsWith(']')) { opt = true; g = g.slice(1, -1); }
    let m = g.match(/^（(\d+)）$/);
    if (m) { const v = +m[1]; return [{ chapter: v, start: 1, start_half: null, end: null, end_half: null, end_chapter: v, optional: true }]; }
    m = g.match(/^(\d+)(上|下)?－(\d+)(上|下)?：(\d+)(上|下)?$/);
    if (m) return [{ chapter, start: +m[1], start_half: m[2], end: +m[5], end_half: m[6], end_chapter: +m[3], optional: opt }];
    m = g.match(/^(\d+)(上|下)?－(\d+)(上|下)?：末$/);
    if (m) return [{ chapter, start: +m[1], start_half: m[2], end: null, end_half: null, end_chapter: +m[3], optional: opt }];
    m = g.match(/^(\d+)(上|下)?－(\d+)(上|下)?$/);
    if (m) return [{ chapter, start: +m[1], start_half: m[2], end: +m[3], end_half: m[4], end_chapter: chapter, optional: opt }];
    m = g.match(/^(\d+)(上|下)?－末$/);
    if (m) return [{ chapter, start: +m[1], start_half: m[2], end: null, end_half: null, end_chapter: chapter, optional: opt }];
    m = g.match(/^(\d+)(上|下)?$/);
    if (m) { const v = +m[1]; return [{ chapter, start: v, start_half: m[2], end: v, end_half: m[2], end_chapter: chapter, optional: opt }]; }
    return null;
  }

  function parseVerses(seg, chapter) {
    const tokens = seg.split(/(\[[^\]]+\])/);
    const out = [];
    for (let t of tokens) {
      if (!t) continue;
      if (t.startsWith('[')) {
        const inner = t.slice(1, -1);
        let rng;
        const m = inner.match(/^(\d+)：/);
        if (m) {
          const ch2 = +m[1];
          rng = parseVerses(inner.slice(m[0].length), ch2);
          if (rng == null) return null;
          for (const s of rng) s.optional = true;
          out.push(...rng);
          continue;
        }
        rng = parseVerseGroup(t, chapter);
        if (rng == null) return null;
        out.push(...rng);
      } else {
        const groups = t.split(/[、，]/);
        for (let g of groups) {
          g = g.trim();
          if (!g) continue;
          if (/[－-]$/.test(g)) { g = g.slice(0, -1); if (!g) continue; }
          const gm = g.match(/^(\d+)：/);
          if (gm) {
            const ch2 = +gm[1];
            const sub = parseVerses(g.slice(gm[0].length), ch2);
            if (sub == null) return null;
            out.push(...sub);
            continue;
          }
          const rng = parseVerseGroup(g, chapter);
          if (rng == null) return null;
          out.push(...rng);
        }
      }
    }
    return out;
  }

  function parseChapter(book, abbr, rest) {
    rest = rest.trim().replace(/[†‡]/g, '').replace(/:/g, '：').replace(/\./g, '：');
    if (rest.startsWith('：')) rest = rest.slice(1);
    if (rest === '') {
      abbr = resolveAmbig(book, abbr, null);
      return [{ book: abbr, book_disp: ZH[abbr] || book, chapter: 1, start: 1, end: null, end_chapter: null, start_half: null, end_half: null, optional: false, whole_book: true }];
    }
    let m = rest.match(/^(\d+)章$/);
    if (m) { const ch = +m[1]; abbr = resolveAmbig(book, abbr, ch); return [{ book: abbr, book_disp: ZH[abbr] || book, chapter: ch, start: 1, end: null, end_chapter: ch, start_half: null, end_half: null, optional: false }]; }
    m = rest.match(/^(\d+)－(\d+)章$/);
    if (m) { const c1 = +m[1], c2 = +m[2]; abbr = resolveAmbig(book, abbr, c2); return [{ book: abbr, book_disp: ZH[abbr] || book, chapter: c1, start: 1, end: null, end_chapter: c2, start_half: null, end_half: null, optional: false }]; }
    // pure bracketed
    m = rest.match(/^\[([^\]]+)\]$/);
    if (m) {
      const inner = m[1];
      if (/^\d+：/.test(inner)) {
        const mm = inner.match(/^(\d+)：/);
        const ch = +mm[1];
        const rngs = parseVerses(inner.slice(mm[0].length), ch);
        if (rngs == null) return null;
        return rngs.map(r => ({ book: abbr, book_disp: ZH[abbr] || book, chapter: r.chapter, start: r.start, end: r.end, end_chapter: r.end_chapter, start_half: r.start_half, end_half: r.end_half, optional: true }));
      }
      if (/^\d+$/.test(inner)) {
        const v = +inner;
        return [{ book: abbr, book_disp: ZH[abbr] || book, chapter: v, start: 1, end: null, end_chapter: v, start_half: null, end_half: null, optional: true }];
      }
      if (/[、，；]/.test(inner) && /^[\d、，；]+$/.test(inner)) {
        const out = [];
        for (const sub of inner.split(/[、，；]/)) {
          if (!sub) continue;
          if (!/^\d+$/.test(sub)) return null;
          const v = +sub;
          out.push({ book: abbr, book_disp: ZH[abbr] || book, chapter: v, start: 1, end: null, end_chapter: v, start_half: null, end_half: null, optional: true });
        }
        return out;
      }
      return null;
    }
    // whole psalm numbers
    if (/^[\[\]（()\d、，；]+$/.test(rest) || /^（\d+）$/.test(rest)) {
      const out = [];
      const tokens = rest.match(/\[[^\]]+\]|（\d+）|\d+/g) || [];
      for (let g of tokens) {
        g = g.trim();
        if (!g) continue;
        let opt = false;
        if (g.startsWith('[') && g.endsWith(']')) {
          opt = true; g = g.slice(1, -1);
          if (/：/.test(g)) {
            const mm = g.match(/^(\d+)：/);
            if (!mm) return null;
            const ch = +mm[1];
            const rngs = parseVerses(g.slice(mm[0].length), ch);
            if (rngs == null) return null;
            for (const r of rngs) { r.optional = true; out.push({ book: abbr, book_disp: ZH[abbr] || book, ...r }); }
            continue;
          }
          for (const sub of g.split(/[、，；]/)) {
            if (!sub) continue;
            if (!/^\d+$/.test(sub)) return null;
            const v = +sub;
            out.push({ book: abbr, book_disp: ZH[abbr] || book, chapter: v, start: 1, end: null, end_chapter: v, start_half: null, end_half: null, optional: true });
          }
          continue;
        }
        if (/^（\d+）$/.test(g)) { opt = true; g = g.slice(1, -1); }
        if (!/^\d+$/.test(g)) return null;
        const v = +g;
        out.push({ book: abbr, book_disp: ZH[abbr] || book, chapter: v, start: 1, end: null, end_chapter: v, start_half: null, end_half: null, optional: opt });
      }
      return out;
    }
    // psalm mixes: 詩113、147：12－末 or 詩142；[143：1－11]
    if (abbr === 'ps' && /[、，；]/.test(rest) && !/^[\[\]（()\d、，；]+$/.test(rest) && !/^\d+：/.test(rest)) {
      const out = [];
      for (let g of rest.split(/[、，；]/)) {
        g = g.trim();
        if (!g) continue;
        let opt = false;
        if (g.startsWith('[') && g.endsWith(']')) { opt = true; g = g.slice(1, -1); }
        if (/^\d+$/.test(g)) {
          const v = +g;
          out.push({ book: abbr, book_disp: ZH[abbr] || book, chapter: v, start: 1, end: null, end_chapter: v, start_half: null, end_half: null, optional: opt });
        } else {
          const mm = g.match(/^(\d+)：/);
          if (!mm) return null;
          const ch = +mm[1];
          const rngs = parseVerses(g.slice(mm[0].length), ch);
          if (rngs == null) return null;
          for (const r of rngs) { r.optional = r.optional || opt; out.push({ book: abbr, book_disp: ZH[abbr] || book, ...r }); }
        }
      }
      return out;
    }
    // single-chapter books
    if (/^\d/.test(rest) && SINGLE_CHAPTER.indexOf(abbr) >= 0) {
      const rngs = parseVerses(rest, 1);
      if (rngs == null) return null;
      return rngs.map(r => ({ book: abbr, book_disp: ZH[abbr] || book, ...r }));
    }
    m = rest.match(/^(\d+)：/);
    if (!m) return null;
    const chapter = +m[1];
    const seg = rest.slice(m[0].length);
    abbr = resolveAmbig(book, abbr, chapter);
    const rngs = parseVerses(seg, chapter);
    if (rngs == null) return null;
    return rngs.map(r => ({ book: abbr, book_disp: ZH[abbr] || book, ...r }));
  }

  function parseSegment(seg, prev) {
    let alts = [];
    const m = seg.match(/[（(]或[^）)]*[）)]$/);
    if (m) {
      const main = seg.slice(0, m.index).trim();
      let alt = seg.slice(m.index + 1, seg.length - 1).trim();
      alts = main.split('或');
      alts.push(alt.startsWith('或') ? alt.slice(1).trim() : alt);
    } else {
      alts = seg.split('或');
    }
    const results = [];
    let curPrev = prev;
    for (let a of alts) {
      a = a.trim();
      if (!a) continue;
      let [book, abbr, rest] = splitBook(a);
      if (book == null) {
        if (curPrev != null) { book = curPrev[0]; abbr = curPrev[1]; rest = a; }
        else return [null, curPrev];
      } else {
        curPrev = [book, abbr];
      }
      const rngs = parseChapter(book, abbr, rest);
      if (rngs == null) return [null, curPrev];
      results.push(rngs);
    }
    if (!results.length) return [null, curPrev];
    const flat = [];
    results.forEach((rngs, i) => {
      for (const r of rngs) { r.alt = i > 0; flat.push(r); }
    });
    return [flat, curPrev];
  }

  function splitSemicolon(s) {
    const out = [];
    let cur = '', depth = 0;
    for (const ch of s) {
      if (ch === '[') depth++;
      else if (ch === ']') depth--;
      if (ch === '；' && depth === 0) { out.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }

  function parseRef(ref) {
    ref = ref.trim();
    if (ref.startsWith('或')) ref = ref.slice(1).trim();
    const isYa = ref.startsWith('雅') && !ref.startsWith('雅歌') && !ref.startsWith('雅各書');
    const chapters = (ref.match(/\d+/g) || []).map(Number);
    const yaResolve = (isYa && chapters.length && Math.max(...chapters) > 5) ? 'so' : null;
    const passages = [];
    let prev = null;
    for (let u of splitSemicolon(ref)) {
      u = u.trim();
      if (!u) continue;
      for (let p of u.split('及')) {
        p = p.trim();
        if (!p) continue;
        const [rngs, newPrev] = parseSegment(p, prev);
        prev = newPrev;
        if (rngs == null) return null;
        passages.push(...rngs);
      }
    }
    if (yaResolve) {
      for (const r of passages) {
        if (r.book === 'jm' || r.book === 'so') { r.book = yaResolve; r.book_disp = ZH[yaResolve]; }
      }
    }
    if (!passages.length) return null;
    return passages;
  }

  global.RefParser = { parseRef, splitBook, ZH };
})(window);
