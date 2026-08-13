/* i18n.js — 4 种语言切换：简体中文 / 繁体中文 / English / 日本語 */
(function (global) {
  'use strict';

  const LANGS = [
    { id: 'zhCN', label: '简体中文' },
    { id: 'zhTW', label: '繁體中文' },
  ];

  // zhCN / en / ja；zhTW 由 zhCN 经 ZHConv 自动转换
  const DICT = {
    brand:           { zhCN: '每日读经', en: 'Daily Reading', ja: '毎日読経' },
    brandSub:        { zhCN: '2025–2026 · 香港圣公会读经表', en: '2025–2026 · HKSKH Lectionary', ja: '2025–2026 · 香港聖公会 聖餐式・朝夕の祈禱 経課表' },
    navToday:        { zhCN: '今日读经', en: 'Today', ja: '今日の読経' },
    navLesson:       { zhCN: '每日一课', en: 'Daily Lesson', ja: '毎日の学び' },
    navCalendar:     { zhCN: '读经历', en: 'Calendar', ja: '読経暦' },
    navWorship:      { zhCN: '线上崇拜', en: 'Online Worship', ja: 'オンライン礼拝' },
    navAbout:        { zhCN: '本书分析', en: 'About the Book', ja: '本書の解説' },
    viewToggleTitle: { zhCN: '点击切换：自动 / 手机版 / 电脑版', en: 'Click to switch: Auto / Mobile / Desktop', ja: 'クリックで切替：自動 / モバイル / デスクトップ' },
    viewAuto:        { zhCN: '🔄 自动', en: '🔄 Auto', ja: '🔄 自動' },
    viewMobile:      { zhCN: '📱 手机版', en: '📱 Mobile', ja: '📱 モバイル' },
    viewDesktop:     { zhCN: '🖥 电脑版', en: '🖥 Desktop', ja: '🖥 デスクトップ' },
    prevDay:         { zhCN: '‹ 前一日', en: '‹ Prev', ja: '‹ 前日' },
    nextDay:         { zhCN: '后一日 ›', en: 'Next ›', ja: '翌日 ›' },
    todayBtn:        { zhCN: '今天', en: 'Today', ja: '今日' },
    heroTitle:       { zhCN: '今日读经', en: "Today's Reading", ja: '今日の読経' },
    litColor:        { zhCN: '礼仪颜色', en: 'Liturgical color', ja: '典礼色' },
    lunar:           { zhCN: '农历', en: 'Lunar', ja: '旧暦' },
    solarTerm:       { zhCN: '节气', en: 'Solar term', ja: '二十四節気' },
    shareBtn:        { zhCN: '📤 分享卡', en: '📤 Share Card', ja: '📤 シェアカード' },
    shareBtn2:       { zhCN: '📤 生成分享卡', en: '📤 Make Share Card', ja: '📤 シェアカード作成' },
    todayLesson:     { zhCN: '今日经课', en: "Today's Lessons", ja: '今日の経課' },
    noteComplement:  { zhCN: '本主日提供「互补式／半连读式」两套经课，可于每日一课页面查看。', en: 'This Sunday offers both "Complementary" and "Semi-continuous" readings; see the Daily Lesson page.', ja: '本主日は「補完式／半連続式」の二組の経課が提供されています。詳細は毎日の学びで。' },
    enterLesson:     { zhCN: '进入今日一课 →', en: 'Open Today\'s Lesson →', ja: '今日の学びへ →' },
    onlineWorship:   { zhCN: '线上崇拜', en: 'Online Worship', ja: 'オンライン礼拝' },
    viewCalendar:    { zhCN: '查看读经历', en: 'View Calendar', ja: '読経暦を見る' },
    importantFeasts: { zhCN: '重要节期', en: 'Principal Feasts', ja: '主な祝日' },
    learnMore:       { zhCN: '深入了解这本书的内容 →', en: 'Learn more about this book →', ja: '本書の解説へ →' },
    // 季节
    s_将临期: { zhCN: '将临期', en: 'Advent', ja: '待降節' },
    s_圣诞期: { zhCN: '圣诞期', en: 'Christmastide', ja: '降誕節' },
    s_显现期: { zhCN: '显现期', en: 'Epiphany', ja: '顕現節' },
    s_大斋期: { zhCN: '大斋期', en: 'Lent', ja: '大斎節' },
    s_复活期: { zhCN: '复活期', en: 'Easter', ja: '復活節' },
    s_圣灵降临期: { zhCN: '圣灵降临期', en: 'Pentecost', ja: '聖霊降臨節' },
    s_常年期: { zhCN: '常年期', en: 'Ordinary Time', ja: '年間' },
    // 星期
    wd_主日: { zhCN: '主日', en: 'Sunday', ja: '主日' },
    wd_一: { zhCN: '星期一', en: 'Monday', ja: '月曜日' },
    wd_二: { zhCN: '星期二', en: 'Tuesday', ja: '火曜日' },
    wd_三: { zhCN: '星期三', en: 'Wednesday', ja: '水曜日' },
    wd_四: { zhCN: '星期四', en: 'Thursday', ja: '木曜日' },
    wd_五: { zhCN: '星期五', en: 'Friday', ja: '金曜日' },
    wd_六: { zhCN: '星期六', en: 'Saturday', ja: '土曜日' },
    // 经课类型
    r_ot:     { zhCN: '旧约经课', en: 'Old Testament', ja: '旧約聖書' },
    r_psalm:  { zhCN: '诗篇', en: 'Psalm', ja: '詩篇' },
    r_epistle:{ zhCN: '书信经课', en: 'Epistle', ja: '書簡' },
    r_gospel: { zhCN: '福音经课', en: 'Gospel', ja: '福音書' },
    r_morning:{ zhCN: '早祷经课（补充）', en: 'Morning Prayer (additional)', ja: '晨の祈禱（補足）' },
    r_evening:{ zhCN: '晚祷经课（补充）', en: 'Evening Prayer (additional)', ja: '夕の祈禱（補足）' },
    speak:   { zhCN: '🔊 朗读', en: '🔊 Read', ja: '🔊 読み上げ' },
    stop:    { zhCN: '⏹ 停止', en: '⏹ Stop', ja: '⏹ 停止' },
    // 每日一课步骤
    step1: { zhCN: '文本阅读', en: 'Read the Text', ja: '本文を読む' },
    step2: { zhCN: '语音朗读', en: 'Audio Reading', ja: '音声で聞く' },
    step3: { zhCN: '今日释经与属灵教训', en: 'Explanation & Spiritual Lessons', ja: '解説と霊的教訓' },
    step4: { zhCN: '默想与感受回应', en: 'Meditation & Reflection', ja: '黙想と応答' },
    step5: { zhCN: '回应祷文', en: 'Prayer Response', ja: '応答の祈り' },
    step6: { zhCN: '线上崇拜', en: 'Online Worship', ja: 'オンライン礼拝' },
    studyTheme:  { zhCN: '今日主题', en: "Today's Theme", ja: '今日の主題' },
    studyVerse:  { zhCN: '今日金句', en: "Verse of the Day", ja: '今日のみことば' },
    studyOverview:{ zhCN: '经课概览', en: 'Lesson Overview', ja: '経課の概要' },
    studyLessons:{ zhCN: '属灵教训', en: 'Spiritual Lessons', ja: '霊的教訓' },
    reflectIntro:{ zhCN: '安静片刻，用以下问题帮助自己默想今天的经文：', en: 'Take a moment and meditate on today\'s readings with these questions:', ja: '静かに、以下の問いをもって今日の聖句を黙想しましょう：' },
    reflectWrite:{ zhCN: '也可以在这里写下你的读经感受（自动保存在本机浏览器）：', en: 'You may also write down your reflection here (auto-saved in your browser):', ja: 'ここに読経の感想を書けます（ブラウザに自動保存されます）：' },
    reflectPlaceholder:{ zhCN: '写下你今天读经的感受、亮光或回应……', en: 'Write your thoughts, insights or response...', ja: '今日の読経の感想・気づき・応答を書く……' },
    prayerNote:  { zhCN: '你也可以加上自己的祈祷，把今天的领受带到上主面前。', en: 'You may add your own prayer, bringing today\'s insights before the Lord.', ja: 'あなた自身の祈りを加え、今日の気づきを主の御前に持って行きましょう。' },
    worshipIntro:{ zhCN: '按今天的主题与经课，进入圣公会式的线上崇拜：', en: 'Enter the Anglican-style online worship with today\'s theme and lessons:', ja: '今日の主題と経課に従って、聖公会式のオンライン礼拝に入りましょう：' },
    worshipMorning:{ zhCN: '早祷崇拜', en: 'Morning Prayer', ja: '晨の祈禱（礼拝）' },
    worshipEucharist:{ zhCN: '圣餐崇拜', en: 'Holy Communion', ja: '聖餐式' },
    worshipEvening:{ zhCN: '晚祷崇拜', en: 'Evening Prayer', ja: '夕の祈禱（礼拝）' },
    worshipNote: { zhCN: '崇拜流程参考香港圣公会《公祷书》结构，祝文为改写版本。', en: 'The worship order follows the HKSKH Book of Common Prayer; collects are adapted.', ja: '礼拝の順序は香港聖公会『祈祷書』に基づく改作版です。' },
    multimass: { zhCN: '本日有多场崇拜经课：', en: 'Today has several sets of lessons:', ja: '本日は複数の礼拝経課があります：' },
    audioNote: { zhCN: '可选用微软 Edge 神经语音「晓晓 / 云希」：用 Edge 浏览器打开即可直接使用；其他浏览器会自动尝试在线神经语音（需网络），失败则用内置中文语音。', en: 'Use Microsoft Edge neural voices Xiaoxiao / Yunxi: open in Edge for best results; other browsers try online neural voice (needs network) with fallback.', ja: 'Microsoft Edge のニューラル音声（シャオシャオ／ユンシー）を選択可能。Edge 推奨、他ブラウザはオンライン音声を試し失敗時は内蔵音声へ。' },
    altNote: { zhCN: '可选经文（或）', en: 'Alternative reading (or)', ja: '選択可能な聖句（または）' },
    // 崇拜结构
    w_宣召: { zhCN: '宣召', en: 'Opening Sentence', ja: '招詞' },
    w_认罪: { zhCN: '认罪', en: 'Confession', ja: '罪の告白' },
    w_启应: { zhCN: '启应', en: 'Versicles', ja: '唱和' },
    w_诗篇: { zhCN: '诗篇', en: 'Psalm', ja: '詩篇' },
    w_旧约经课: { zhCN: '旧约经课', en: 'First Lesson (OT)', ja: '旧約聖書' },
    w_新约经课: { zhCN: '新约经课', en: 'Second Lesson (NT)', ja: '新約聖書' },
    w_书经课: { zhCN: '书信经课', en: 'Epistle', ja: '書簡' },
    w_福音: { zhCN: '福音', en: 'Gospel', ja: '福音書' },
    w_颂歌: { zhCN: '颂歌', en: 'Canticle', ja: 'カンティクム' },
    w_信经: { zhCN: '信经', en: 'Creed', ja: '信条' },
    w_主祷文: { zhCN: '主祷文', en: 'Lord\'s Prayer', ja: '主の祈り' },
    w_本日祝文: { zhCN: '本日祝文', en: 'Collect of the Day', ja: '本日の集会祈願' },
    w_代祷: { zhCN: '代祷', en: 'Intercessions', ja: '執り成しの祈り' },
    w_祝福: { zhCN: '祝福', en: 'Blessing', ja: '祝福' },
    w_垂怜经: { zhCN: '垂怜经', en: 'Kyrie', ja: 'キリエ' },
    w_荣归主颂: { zhCN: '荣归主颂', en: 'Gloria', ja: '大栄光頌' },
    w_讲道: { zhCN: '讲道', en: 'Sermon', ja: '説教' },
    w_献礼: { zhCN: '献礼', en: 'Offertory', ja: '奉献' },
    w_圣哉颂: { zhCN: '圣哉颂', en: 'Sanctus', ja: 'サンクトゥス' },
    w_祝圣祷文: { zhCN: '祝圣祷文（简短）', en: 'Eucharistic Prayer (brief)', ja: '感謝の祈り（簡短）' },
    w_羔羊颂: { zhCN: '羔羊颂', en: 'Agnus Dei', ja: '神の子羊' },
    w_平安礼: { zhCN: '平安礼', en: 'The Peace', ja: '平和の挨拶' },
    w_领受圣餐: { zhCN: '领受圣餐', en: 'Receiving Communion', ja: '聖餐の拝領' },
    worshipSub: { zhCN: '圣公会《公祷书》早祷结构', en: 'Morning Prayer (BCP order)', ja: '晨の祈禱（祈祷書式）' },
    worshipSubE: { zhCN: '圣公会《公祷书》晚祷结构', en: 'Evening Prayer (BCP order)', ja: '夕の祈禱（祈祷書式）' },
    worshipSubC: { zhCN: '圣公会圣餐崇拜（第二式）结构 · 线上版本以灵里参与', en: 'Holy Communion (Rite II) · participate in spirit', ja: '聖餐式（第2式）・霊において参与' },
    worshipRubric: { zhCN: '本页崇拜流程参考香港圣公会《公祷书》之结构，祝文及祷文为网站改写版本；正式崇拜请以教会颁行之《公祷书》及礼文为准。', en: 'This worship order is adapted from the HKSKH Book of Common Prayer; for official worship use the BCP.', ja: 'この礼拝順序は香港聖公会『祈祷書』を参考にした改作版です。正式な礼拝は教会の祈祷書をご使用ください。' },
    // 读经历
    calTitle: { zhCN: '读经历', en: 'Lectionary Calendar', ja: '読経暦' },
    prevMonth: { zhCN: '‹ 上个月', en: '‹ Prev', ja: '‹ 前月' },
    nextMonth: { zhCN: '下个月 ›', en: 'Next ›', ja: '翌月 ›' },
    calHint: { zhCN: '点击日期进入当日一课', en: 'Click a date to open the day\'s lesson', ja: '日付をクリックして当日の学びへ' },
    legendAdvent: { zhCN: '将临期／大斋期', en: 'Advent / Lent', ja: '待降節／大斎節' },
    legendRed: { zhCN: '殉道／圣灵降临', en: 'Martyrs / Pentecost', ja: '殉教者／聖霊降臨' },
    legendWhite: { zhCN: '节期／圣日', en: 'Festivals / Holy Days', ja: '祝日' },
    legendGreen: { zhCN: '圣灵降临期平日', en: 'Ordinary (Pentecost)', ja: '聖霊降臨節の平日' },
    legendGold: { zhCN: '主要庆节', en: 'Principal Feasts', ja: '主な祝日' },
    legendBlack: { zhCN: '受难日', en: 'Good Friday', ja: '受難日' },
    // 颜色
    c_紫: { zhCN: '紫', en: 'Purple', ja: '紫' },
    c_红: { zhCN: '红', en: 'Red', ja: '赤' },
    c_白: { zhCN: '白', en: 'White', ja: '白' },
    c_绿: { zhCN: '绿', en: 'Green', ja: '緑' },
    c_金: { zhCN: '金', en: 'Gold', ja: '金' },
    'c_金/白': { zhCN: '金/白', en: 'Gold/White', ja: '金／白' },
    c_黑: { zhCN: '黑', en: 'Black', ja: '黒' },
    c_灰: { zhCN: '灰', en: 'Grey', ja: '灰' },
    // 分享卡
    shareTitle: { zhCN: '今日读经分享卡', en: 'Daily Reading Share Card', ja: '今日の読経シェアカード' },
    shareGenerating: { zhCN: '正在生成分享卡…', en: 'Generating share card…', ja: 'シェアカードを作成中…' },
    shareDone: { zhCN: '生成完成，点击保存或长按图片保存。', en: 'Done. Tap Save, or long-press the image.', ja: '作成完了。保存をタップ、または画像を長押し。' },
    shareSave: { zhCN: '💾 保存图片', en: '💾 Save Image', ja: '💾 画像を保存' },
    shareShare: { zhCN: '📤 分享', en: '📤 Share', ja: '📤 共有' },
    shareClose: { zhCN: '关闭', en: 'Close', ja: '閉じる' },
    shareLongpress: { zhCN: '手机用户可长按图片保存到相册。', en: 'On mobile, long-press the image to save.', ja: 'モバイルは画像を長押しして保存。' },
    cardBrand: { zhCN: '每 日 读 经 · 香 港 圣 公 会 读 经 表', en: 'DAILY READING · HKSKH LECTIONARY', ja: '毎日読経・香港聖公会 経課表' },
    cardScan: { zhCN: '扫码阅读今日读经', en: 'Scan to read today\'s reading', ja: 'スキャンして今日の読経' },
    cardFooter: { zhCN: '每日读经 2025–2026 · 经文采用和合本', en: 'Daily Reading 2025–2026 · Chinese Union Version', ja: '毎日読経 2025–2026・和合本訳' },
    cardSection: { zhCN: '今 日 经 课', en: "TODAY'S LESSONS", ja: '今日の経課' },
    cardKeyVerse: { zhCN: '今日金句', en: 'Verse of the Day', ja: '今日のみことば' },
    cardColor: { zhCN: '礼仪颜色', en: 'Liturgical color', ja: '典礼色' },
    w_使徒信经: { zhCN: '使徒信经', en: 'Apostles\' Creed', ja: '使徒信条' },
    w_尼西亚信经: { zhCN: '尼西亚信经', en: 'Nicene Creed', ja: 'ニカイア信条' },
    'w_以色列颂（撒迦利亚颂）': { zhCN: '以色列颂（撒迦利亚颂）', en: 'Canticle: Benedictus', ja: 'ベネディクトゥス' },
    'w_尊主颂（马利亚颂）': { zhCN: '尊主颂（马利亚颂）', en: 'Canticle: Magnificat', ja: 'マニフィカト' },
    w_西面颂: { zhCN: '西面颂', en: 'Canticle: Nunc Dimittis', ja: 'ヌンク・ディミティス' },
    // 语音
    voiceLabel: { zhCN: '朗读语音', en: 'Voice', ja: '音声' },
    voiceAuto: { zhCN: '自动', en: 'Auto', ja: '自動' },
    voiceXiaoxiao: { zhCN: '晓晓（Edge神经语音）', en: 'Xiaoxiao (Edge neural)', ja: 'シャオシャオ' },
    voiceYunxi: { zhCN: '云希（Edge神经语音）', en: 'Yunxi (Edge neural)', ja: 'ユンシー' },
  };

  let lang = 'zhCN';
  try { const s = localStorage.getItem('lang'); if (s === 'zhTW') lang = 'zhTW'; } catch (e) {}

  function setLang(l) {
    // 仅支持简体中文 / 繁体中文（英文、日文版本已移除）
    lang = (l === 'zhTW') ? 'zhTW' : 'zhCN';
    try { localStorage.setItem('lang', lang); } catch (e) {}
    document.documentElement.lang = lang === 'zhTW' ? 'zh-Hant' : 'zh-Hans';
  }
  function getLang() { return lang; }

  function t(key) {
    const m = DICT[key];
    if (!m) return key;
    if (lang === 'zhTW' && global.ZHConv) return global.ZHConv.toTraditional(m.zhCN);
    return m[lang] || m.zhCN;
  }

  // 数据字符串翻译：繁体自动转换；英/日对季节、星期、经课类型做词典替换，其余保留
  const COLOR_MAP = { '紫': 'c_紫', '红': 'c_红', '白': 'c_白', '绿': 'c_绿', '金': 'c_金', '金/白': 'c_金/白', '黑': 'c_黑', '灰': 'c_灰' };
  function tColor(str) {
    if (!str) return str;
    if (lang === 'zhCN') return str;
    if (lang === 'zhTW' && global.ZHConv) return global.ZHConv.toTraditional(str);
    // 处理 绿（白） 等形式
    return str.split('（')[0].split('(')[0].split('/').map(x => {
      const k = COLOR_MAP[x.trim()];
      return k ? DICT[k][lang] : x;
    }).join('/');
  }

  function tData(str) {
    if (!str) return str;
    if (lang === 'zhTW' && global.ZHConv) return global.ZHConv.toTraditional(str);
    if (lang === 'zhCN') return str;
    let out = str;
    // 季节
    for (const k of ['将临期', '圣诞期', '显现期', '大斋期', '复活期', '圣灵降临期', '常年期']) {
      if (out.includes(k)) out = out.split(k).join(DICT['s_' + k][lang]);
    }
    // 星期
    out = out.replace('主日', DICT.wd_主日[lang]);
    // 经课类型
    out = out.replace('旧约经课', DICT.r_ot[lang]).replace('书信经课', DICT.r_epistle[lang])
             .replace('福音经课', DICT.r_gospel[lang]).replace('诗篇', DICT.r_psalm[lang]);
    return out;
  }

  function langLabel(id) {
    const m = LANGS.find(x => x.id === id);
    return m ? m.label : id;
  }

  global.I18N = { LANGS, DICT, setLang, getLang, t, tData, tColor, langLabel };
})(window);
