/* commentary.js — generate 今日主題 / 經課概覽 / 屬靈教訓 / 默想問題 / 回應禱文 */
(function (global) {
  'use strict';

  const THEMES = [
    { kw: ['信心', '信靠'], label: '信心與信靠', q: '今天的信息如何邀請你在生活中更加信靠上主？' },
    { kw: ['盼望', '希望'], label: '盼望', q: '這份盼望如何改變你面對今天困難的眼光？' },
    { kw: ['愛', '彼此相愛', '慈愛'], label: '愛與恩慈', q: '上主對你的愛，可以怎樣藉著你流向身邊的人？' },
    { kw: ['恩典', '憐憫', '饒恕', '赦免'], label: '恩典與赦免', q: '你今天需要領受或給予怎樣的赦免與恩典？' },
    { kw: ['悔改', '回轉'], label: '悔改與更新', q: '有甚麼需要回轉歸向神的地方，是你今天願意面對的？' },
    { kw: ['應許', '約', '盟約'], label: '應許與盟約', q: '上主的應許如何成為你今天穩妥的根基？' },
    { kw: ['平安', '和睦'], label: '平安', q: '你心中有哪一份不安，需要交託給賜平安的主？' },
    { kw: ['喜樂', '歡喜', '讚美'], label: '喜樂與讚美', q: '今天你可以在哪一件小事上，向主發出感恩與讚美？' },
    { kw: ['公義', '審判', '公平'], label: '公義與審判', q: '我們既蒙憐憫，又當如何在生活中活出公義與正直？' },
    { kw: ['聖靈', '靈'], label: '聖靈的工作', q: '你如何敏銳地回應聖靈今天的引導與提醒？' },
    { kw: ['見證', '宣揚', '傳', '福音'], label: '見證與宣教', q: '今天有誰需要從你身上看見基督的見證？' },
    { kw: ['跟隨', '作門徒', '捨己', '背起'], label: '跟隨與捨己', q: '跟隨基督的代價，今天具體呈現在你生命的哪一方面？' },
    { kw: ['永生', '復活', '生命'], label: '永生與生命', q: '基督所賜的豐盛生命，如何在你今天的生活中顯明？' },
    { kw: ['謙卑', '僕人'], label: '謙卑與服事', q: '你可以在今天以僕人的心去服事哪一個人？' },
    { kw: ['禱告', '祈求'], label: '禱告的生活', q: '你的禱告生活有甚麼需要被更新或堅固的地方？' },
    { kw: ['光', '黑暗'], label: '光與黑暗', q: '你生命中有哪些角落仍藏在黑暗中，需要主的真光照亮？' },
    { kw: ['牧', '羊', '引導', '道路'], label: '引導與牧養', q: '你願意在今天跟隨好牧人的聲音，走上祂的道路嗎？' },
    { kw: ['恐懼', '懼怕', '驚惶'], label: '除去懼怕', q: '主說「不要懼怕」，你今天最需要把哪份懼怕交給祂？' },
    { kw: ['祭', '獻上', '奉獻'], label: '獻上與敬拜', q: '你今天可以將甚麼作為活祭獻給上主？' },
    { kw: ['身體', '肢體', '教會', '合一'], label: '合一與教會', q: '你如何在教會肢體中實踐彼此相愛與合一？' },
  ];

  const SEASON_NOTES = {
    '將臨期': { theme: '等候與盼望', prayer: '全能的上主，求祢在我們心中預備道路，使我們以儆醒的心等候基督的再臨，並以悔改與盼望迎接祢的國度降臨。' },
    '聖誕期': { theme: '道成肉身', prayer: '滿有恩典的上主，感謝祢差遣聖子耶穌基督降世為人，住在我們中間。求祢使我們在基督裏得著生命與平安，並與人分享這大喜的信息。' },
    '顯現期': { theme: '主的光顯現', prayer: '上主啊，祢藉著基督將真光照亮萬民。求祢引導我們在光中行走，並把祢的榮耀顯明給我們周圍的人。' },
    '大齋期': { theme: '悔改與預備', prayer: '慈悲的上主，求祢藉著聖靈引導我們克己、禱告與施捨，使我們在悔改中歸向祢，與基督同走十字架的道路。' },
    '復活期': { theme: '復活與盼望', prayer: '復活的主啊，祢勝過死亡，賜下新生命。求祢使我們在復活的盼望中滿有喜樂，並以更新的生命見證祢。' },
    '聖靈降臨期': { theme: '聖靈與成長', prayer: '上主啊，求祢以聖靈充滿我們，使我們在恩典中成長，在愛中合一，忠心作祢的見證，直到主再來。' },
    '常年期': { theme: '在基督裏成長', prayer: '上主啊，求祢藉著聖言與聖禮餵養我們，使我們在基督裏日日成長，活出祢所喜悅的生活。' },
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

    // 今日主題
    let theme;
    if (day.feast && !day.feast.includes('主日')) {
      theme = day.feast.replace(/（.*?）/g, '');
    } else if (topThemes.length) {
      theme = sNote.theme + '：' + topThemes.map(t => t.label).join('、');
    } else {
      theme = sNote.theme;
    }

    // 屬靈教訓
    const lessons = [];
    if (gsText) {
      const g = topThemes[0];
      lessons.push({
        title: g ? '在基督裏活出「' + g.label + '」' : '以基督為中心的生活',
        body: '今日福音提醒我們，信仰不是抽象的知識，而是具體的生命回應。願我們不單聽道，更行道，使基督的話住在我們裏面，成為每日生活的力量與方向。',
      });
    }
    if (otText || epText) {
      const g2 = topThemes[1] || topThemes[0];
      lessons.push({
        title: g2 ? '從聖言中領受「' + g2.label + '」' : '扎根於上主的話語',
        body: '舊約與書信中的經文，讓我們看見上主在歷史中不斷施恩與引導。祂的應許跨越世代，今天仍然向我們說話，邀請我們以信心回應。',
      });
    }
    lessons.push({
      title: '在「' + season + '」中繼續前行',
      body: '這一天，我們被安置在教會禮儀年的節奏中。讓我們在群體中彼此守望、代禱，並在日常生活中活出與所蒙之恩相稱的生命。',
    });

    // 默想問題
    const questions = [];
    if (opt.gospel) questions.push('福音經課中，耶穌（或上主）對你有甚麼直接的邀請或挑戰？');
    if (opt.epistle) questions.push('書信中對基督徒群體有甚麼吩咐？你的生命有哪些地方需要調整？');
    if (opt.ot) questions.push('舊約經課如何幫助你更認識上主的屬性與作為？');
    if (opt.psalm) questions.push('詩篇的禱告，有哪一句最能表達你今天的心境？試著用自己的話向上主祈禱。');
    questions.push('今天有甚麼可以具體實踐的「一件事」，使信仰落實在生活中？');

    // 回應禱文
    let prayer = sNote.prayer;
    const feastPrayer = day.feast.includes('聖餐') ? '' : '';
    if (day.feast && /聖(誕|安德烈|多馬|司提反|約翰|彼得|保羅|路加|馬太|馬可|抹大拉|雅各|巴拿巴|安得烈|腓力|多馬)/.test(day.feast)) {
      prayer = '滿有恩典的上主，感謝祢在聖徒生命中顯出祢的榮耀。求祢使我們效法他們的信心與忠心，在我們的日子裏也竭力見證基督。' + prayer;
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

    return {
      theme,
      overview: {
        ot: otText ? summary(opt.ot, otText) : null,
        psalm: psText ? summary(opt.psalm, psText) : null,
        epistle: epText ? summary(opt.epistle, epText) : null,
        gospel: gsText ? summary(opt.gospel, gsText) : null,
      },
      lessons,
      questions,
      prayer,
      keyVerse,
      seasonNote: sNote.theme,
    };
  }

  global.Commentary = { generate };
})(window);
