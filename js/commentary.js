/* commentary.js — generate 今日主题 / 经课概览 / 属灵教训 / 默想问题 / 回应祷文 */
(function (global) {
  'use strict';

  const THEMES = [
    { kw: ['信心', '信靠'], label: '信心与信靠', q: '今天的信息如何邀请你在生活中更加信靠上主？' },
    { kw: ['盼望', '希望'], label: '盼望', q: '这份盼望如何改变你面对今天困难的眼光？' },
    { kw: ['爱', '彼此相爱', '慈爱'], label: '爱与恩慈', q: '上主对你的爱，可以怎样藉著你流向身边的人？' },
    { kw: ['恩典', '怜悯', '饶恕', '赦免'], label: '恩典与赦免', q: '你今天需要领受或给予怎样的赦免与恩典？' },
    { kw: ['悔改', '回转'], label: '悔改与更新', q: '有甚么需要回转归向神的地方，是你今天愿意面对的？' },
    { kw: ['应许', '约', '盟约'], label: '应许与盟约', q: '上主的应许如何成为你今天稳妥的根基？' },
    { kw: ['平安', '和睦'], label: '平安', q: '你心中有哪一份不安，需要交托给赐平安的主？' },
    { kw: ['喜乐', '欢喜', '赞美'], label: '喜乐与赞美', q: '今天你可以在哪一件小事上，向主发出感恩与赞美？' },
    { kw: ['公义', '审判', '公平'], label: '公义与审判', q: '我们既蒙怜悯，又当如何在生活中活出公义与正直？' },
    { kw: ['圣灵', '灵'], label: '圣灵的工作', q: '你如何敏锐地回应圣灵今天的引导与提醒？' },
    { kw: ['见证', '宣扬', '传', '福音'], label: '见证与宣教', q: '今天有谁需要从你身上看见基督的见证？' },
    { kw: ['跟随', '作门徒', '舍己', '背起'], label: '跟随与舍己', q: '跟随基督的代价，今天具体呈现在你生命的哪一方面？' },
    { kw: ['永生', '复活', '生命'], label: '永生与生命', q: '基督所赐的丰盛生命，如何在你今天的生活中显明？' },
    { kw: ['谦卑', '仆人'], label: '谦卑与服事', q: '你可以在今天以仆人的心去服事哪一个人？' },
    { kw: ['祷告', '祈求'], label: '祷告的生活', q: '你的祷告生活有甚么需要被更新或坚固的地方？' },
    { kw: ['光', '黑暗'], label: '光与黑暗', q: '你生命中有哪些角落仍藏在黑暗中，需要主的真光照亮？' },
    { kw: ['牧', '羊', '引导', '道路'], label: '引导与牧养', q: '你愿意在今天跟随好牧人的声音，走上祂的道路吗？' },
    { kw: ['恐惧', '惧怕', '惊惶'], label: '除去惧怕', q: '主说「不要惧怕」，你今天最需要把哪份惧怕交给祂？' },
    { kw: ['祭', '献上', '奉献'], label: '献上与敬拜', q: '你今天可以将甚么作为活祭献给上主？' },
    { kw: ['身体', '肢体', '教会', '合一'], label: '合一与教会', q: '你如何在教会肢体中实践彼此相爱与合一？' },
  ];

  const SEASON_NOTES = {
    '将临期': { theme: '等候与盼望', prayer: '全能的上主，求祢在我们心中预备道路，使我们以儆醒的心等候基督的再临，并以悔改与盼望迎接祢的国度降临。' },
    '圣诞期': { theme: '道成肉身', prayer: '满有恩典的上主，感谢祢差遣圣子耶稣基督降世为人，住在我们中间。求祢使我们在基督里得著生命与平安，并与人分享这大喜的信息。' },
    '显现期': { theme: '主的光显现', prayer: '上主啊，祢藉著基督将真光照亮万民。求祢引导我们在光中行走，并把祢的荣耀显明给我们周围的人。' },
    '大斋期': { theme: '悔改与预备', prayer: '慈悲的上主，求祢藉著圣灵引导我们克己、祷告与施舍，使我们在悔改中归向祢，与基督同走十字架的道路。' },
    '复活期': { theme: '复活与盼望', prayer: '复活的主啊，祢胜过死亡，赐下新生命。求祢使我们在复活的盼望中满有喜乐，并以更新的生命见证祢。' },
    '圣灵降临期': { theme: '圣灵与成长', prayer: '上主啊，求祢以圣灵充满我们，使我们在恩典中成长，在爱中合一，忠心作祢的见证，直到主再来。' },
    '常年期': { theme: '在基督里成长', prayer: '上主啊，求祢藉著圣言与圣礼喂养我们，使我们在基督里日日成长，活出祢所喜悦的生活。' },
  };

  async function textOf(refStr) {
    const res = await global.Bible.resolveRefString(refStr);
    return res.verses.map(v => v.text).join('');
  }

  function detectThemes(texts) {
    const all = texts.join(' ');
    const found = [];
    for (const t of THEMES) {
      if (t.kw.some(k => all.includes(k))) found.push(t);
    }
    return found;
  }

  function summary(refStr, text) {
    if (!text) return '';
    const n = Array.from(text).length;
    return n > 40 ? text.slice(0, 40) + '……' : text;
  }

  async function generate(day, optIndex = 0) {
    const opt = day.communion.options[optIndex] || day.communion.options[0];
    const season = day.season;
    const sNote = SEASON_NOTES[season] || SEASON_NOTES['常年期'];

    const otText = opt.ot ? await textOf(Array.isArray(opt.ot) ? opt.ot[0] : opt.ot) : '';
    const psText = opt.psalm ? await textOf(Array.isArray(opt.psalm) ? opt.psalm[0] : opt.psalm) : '';
    const epText = opt.epistle ? await textOf(Array.isArray(opt.epistle) ? opt.epistle[0] : opt.epistle) : '';
    const gsText = opt.gospel ? await textOf(Array.isArray(opt.gospel) ? opt.gospel[0] : opt.gospel) : '';

    const themes = detectThemes([otText, psText, epText, gsText]);
    const topThemes = themes.slice(0, 3);

    // 今日主题
    let theme;
    if (day.feast && !day.feast.includes('主日')) {
      theme = day.feast.replace(/（.*?）/g, '');
    } else if (topThemes.length) {
      theme = sNote.theme + '：' + topThemes.map(t => t.label).join('、');
    } else {
      theme = sNote.theme;
    }

    // 属灵教训
    const lessons = [];
    if (gsText) {
      const g = topThemes[0];
      lessons.push({
        title: g ? '在基督里活出「' + g.label + '」' : '以基督为中心的生活',
        body: '今日福音提醒我们，信仰不是抽象的知识，而是具体的生命回应。愿我们不单听道，更行道，使基督的话住在我们里面，成为每日生活的力量与方向。',
      });
    }
    if (otText || epText) {
      const g2 = topThemes[1] || topThemes[0];
      lessons.push({
        title: g2 ? '从圣言中领受「' + g2.label + '」' : '扎根于上主的话语',
        body: '旧约与书信中的经文，让我们看见上主在历史中不断施恩与引导。祂的应许跨越世代，今天仍然向我们说话，邀请我们以信心回应。',
      });
    }
    lessons.push({
      title: '在「' + season + '」中继续前行',
      body: '这一天，我们被安置在教会礼仪年的节奏中。让我们在群体中彼此守望、代祷，并在日常生活中活出与所蒙之恩相称的生命。',
    });

    // 默想问题
    const questions = [];
    if (opt.gospel) questions.push('福音经课中，耶稣（或上主）对你有甚么直接的邀请或挑战？');
    if (opt.epistle) questions.push('书信中对基督徒群体有甚么吩咐？你的生命有哪些地方需要调整？');
    if (opt.ot) questions.push('旧约经课如何帮助你更认识上主的属性与作为？');
    if (opt.psalm) questions.push('诗篇的祷告，有哪一句最能表达你今天的心境？试著用自己的话向上主祈祷。');
    questions.push('今天有甚么可以具体实践的「一件事」，使信仰落实在生活中？');

    // 回应祷文
    let prayer = sNote.prayer;
    const feastPrayer = day.feast.includes('圣餐') ? '' : '';
    if (day.feast && /圣(诞|安德烈|多马|司提反|约翰|彼得|保罗|路加|马太|马可|抹大拉|雅各|巴拿巴|安得烈|腓力|多马)/.test(day.feast)) {
      prayer = '满有恩典的上主，感谢祢在圣徒生命中显出祢的荣耀。求祢使我们效法他们的信心与忠心，在我们的日子里也竭力见证基督。' + prayer;
    }

    // 金句 (shortest verse from gospel/psalm)
    let keyVerse = null;
    for (const src of [opt.gospel, opt.epistle, opt.psalm, opt.ot]) {
      if (!src) continue;
      const r = Array.isArray(src) ? src[0] : src;
      const res = await global.Bible.resolveRefString(r);
      const v = res.verses.find(x => Array.from(x.text).length > 6 && Array.from(x.text).length < 60);
      if (v) { keyVerse = { ref: global.RefParser.ZH[res.passages[0].book] + ' ' + v.num, text: v.text }; break; }
    }

    const tr = s => (global.I18N ? global.I18N.tData(s) : s);
    return {
      theme: tr(theme),
      overview: {
        ot: otText ? tr(summary(opt.ot, otText)) : null,
        psalm: psText ? tr(summary(opt.psalm, psText)) : null,
        epistle: epText ? tr(summary(opt.epistle, epText)) : null,
        gospel: gsText ? tr(summary(opt.gospel, gsText)) : null,
      },
      lessons: lessons.map(l => ({ title: tr(l.title), body: tr(l.body) })),
      questions: questions.map(tr),
      prayer: tr(prayer),
      keyVerse: keyVerse ? { ref: tr(keyVerse.ref), text: tr(keyVerse.text) } : null,
      seasonNote: tr(sNote.theme),
    };
  }

  global.Commentary = { generate };
})(window);
