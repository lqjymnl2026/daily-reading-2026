/* refs.js — lectionary reference parser (JS port of analysis/parse_refs.py) */
(function (global) {
  'use strict';

  const SHORT = {
    '创':'gn','出':'ex','利':'lv','民':'nm','申':'dt','书':'js','士':'jud','得':'rt',
    '撒上':'1sm','撒下':'2sm','王上':'1kgs','王下':'2kgs','代上':'1ch','代下':'2ch',
    '拉':'ezr','尼':'ne','斯':'et','伯':'job','诗':'ps','箴':'prv','传':'ec','歌':'so',
    '赛':'is','耶':'jr','哀':'lm','结':'ez','但':'dn','何':'ho','珥':'jl','摩':'am',
    '俄':'ob','拿':'jn','弥':'mi','鸿':'na','哈':'hk','番':'zp','该':'hg','亚':'zc',
    '玛':'ml','太':'mt','可':'mk','路':'lk','约':'jo','徒':'act','罗':'rm','林前':'1co',
    '林后':'2co','加':'gl','弗':'eph','腓':'ph','西':'cl','帖前':'1ts','帖后':'2ts',
    '提前':'1tm','提后':'2tm','多':'tt','门':'phm','来':'hb','彼前':'1pe','彼后':'2pe',
    '约一':'1jo','约二':'2jo','约三':'3jo','犹':'jd','启':'re',
    '多比':'to','滴':'jdt','便':'sir','所':'wis','拉上':'1esd','拉下':'2esd','巴':'bar',
    '耶信':'epjr','祷':'prma','童':'3song','苏':'sus','勒':'bel','斯补':'addest',
    '马一':'1ma','马二':'2ma'
  };
  const FULL = {
    '创世记':'gn','出埃及记':'ex','利未记':'lv','民数记':'nm','申命记':'dt',
    '约书亚记':'js','士师记':'jud','路得记':'rt','撒母耳记上':'1sm','撒母耳记下':'2sm',
    '列王纪上':'1kgs','列王纪下':'2kgs','历代志上':'1ch','历代志下':'2ch',
    '以斯拉记':'ezr','尼希米记':'ne','以斯帖记':'et','约伯记':'job','诗篇':'ps',
    '箴言':'prv','传道书':'ec','雅歌':'so','以赛亚书':'is','耶利米书':'jr',
    '耶利米哀歌':'lm','以西结书':'ez','但以理书':'dn','何西阿书':'ho','约珥书':'jl',
    '阿摩司书':'am','俄巴底亚书':'ob','约拿书':'jn','弥迦书':'mi','那鸿书':'na',
    '哈巴谷书':'hk','西番雅书':'zp','哈该书':'hg','撒迦利亚书':'zc','玛拉基书':'ml',
    '马太福音':'mt','马可福音':'mk','路加福音':'lk','约翰福音':'jo','使徒行传':'act',
    '罗马书':'rm','哥林多前书':'1co','哥林多后书':'2co','加拉太书':'gl','以弗所书':'eph',
    '腓立比书':'ph','歌罗西书':'cl','帖撒罗尼迦前书':'1ts','帖撒罗尼迦后书':'2ts',
    '提摩太前书':'1tm','提摩太后书':'2tm','提多书':'tt','腓利门书':'phm','希伯来书':'hb',
    '雅各书':'jm','彼得前书':'1pe','彼得后书':'2pe','约翰壹书':'1jo','约翰贰书':'2jo',
    '约翰参书':'3jo','犹大书':'jd','启示录':'re',
    '多比传':'to','犹滴传':'jdt','便西拉智训':'sir','所罗门智训':'wis',
    '以斯拉续编上卷':'1esd','以斯拉续编下卷':'2esd','巴录书':'bar','耶利米书信':'epjr',
    '玛拿西祷言':'prma','三童歌':'3song','苏撒拿传':'sus','彼勒与大龙':'bel',
    '以斯帖补编':'addest','马加比一书':'1ma','马加比二书':'2ma'
  };
  const ALIAS = { '约壹':'1jo', '约贰':'2jo', '约参':'3jo' };
  const AMBIG = { '雅': [['jm', 5], ['so', 8]] };
  const ZH = {
    'gn':'创世记','ex':'出埃及记','lv':'利未记','nm':'民数记','dt':'申命记','js':'约书亚记',
    'jud':'士师记','rt':'路得记','1sm':'撒母耳记上','2sm':'撒母耳记下','1kgs':'列王纪上',
    '2kgs':'列王纪下','1ch':'历代志上','2ch':'历代志下','ezr':'以斯拉记','ne':'尼希米记',
    'et':'以斯帖记','job':'约伯记','ps':'诗篇','prv':'箴言','ec':'传道书','so':'雅歌',
    'is':'以赛亚书','jr':'耶利米书','lm':'耶利米哀歌','ez':'以西结书','dn':'但以理书',
    'ho':'何西阿书','jl':'约珥书','am':'阿摩司书','ob':'俄巴底亚书','jn':'约拿书',
    'mi':'弥迦书','na':'那鸿书','hk':'哈巴谷书','zp':'西番雅书','hg':'哈该书','zc':'撒迦利亚书',
    'ml':'玛拉基书','mt':'马太福音','mk':'马可福音','lk':'路加福音','jo':'约翰福音',
    'act':'使徒行传','rm':'罗马书','1co':'哥林多前书','2co':'哥林多后书','gl':'加拉太书',
    'eph':'以弗所书','ph':'腓立比书','cl':'歌罗西书','1ts':'帖撒罗尼迦前书','2ts':'帖撒罗尼迦后书',
    '1tm':'提摩太前书','2tm':'提摩太后书','tt':'提多书','phm':'腓利门书','hb':'希伯来书',
    'jm':'雅各书','1pe':'彼得前书','2pe':'彼得后书','1jo':'约翰壹书','2jo':'约翰贰书',
    '3jo':'约翰参书','jd':'犹大书','re':'启示录',
    'to':'多比传','jdt':'犹滴传','sir':'便西拉智训','wis':'所罗门智训','1esd':'以斯拉续编上卷',
    '2esd':'以斯拉续编下卷','bar':'巴录书','epjr':'耶利米书信','prma':'玛拿西祷言',
    '3song':'三童歌','sus':'苏撒拿传','bel':'彼勒与大龙','addest':'以斯帖补编',
    '1ma':'马加比一书','2ma':'马加比二书'
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
    // psalm mixes: 诗113、147：12－末 or 诗142；[143：1－11]
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
    // parenthesised alternative marker like （或9：1－8）
    const parenAlt = ref.match(/^（或(.+)）$/);
    if (parenAlt) ref = parenAlt[1];
    if (ref.startsWith('或')) ref = ref.slice(1).trim();
    const isYa = ref.startsWith('雅') && !ref.startsWith('雅歌') && !ref.startsWith('雅各书');
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
