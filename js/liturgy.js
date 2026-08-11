/* liturgy.js — 圣公会崇拜流程（参考香港圣公会《公祷书》结构，祝文为改写版本） */
(function (global) {
  'use strict';

  const VERSICLES_M = [
    { who: '主礼', text: '主啊，求祢开启我们的口。' },
    { who: '会众', text: '我们的口要张开，称赞祢。' },
    { who: '主礼', text: '上主啊，求祢快快帮助我们。' },
    { who: '会众', text: '上主，求祢快快拯救我们。' },
  ];
  const VERSICLES_E = [
    { who: '主礼', text: '上主啊，求祢帮助我们。' },
    { who: '会众', text: '上主，求祢速速帮助我们。' },
    { who: '主礼', text: '愿上主与你们同在。' },
    { who: '会众', text: '也与你的心灵同在。' },
  ];

  const CONFESSION = {
    heading: '认罪',
    steps: [
      { who: '主礼', text: '我们在天上的父，我们得罪了祢，也得罪了邻舍。我们心思、言语、行为多有亏欠。求祢因圣子耶稣基督的缘故，赦免我们的过犯，洁净我们的心。' },
      { who: '会众', text: '求慈悲的上主，怜悯我们，赦免我们的罪，引导我们走义路。阿们。' },
      { who: '主礼', text: '愿全能的上帝，因著祂的圣子耶稣基督，怜悯我们，赦免我们的罪，赐给我们平安与力量，去事奉祂。阿们。', rubric: true },
    ],
  };

  const APOSTLES_CREED = {
    heading: '使徒信经',
    steps: [
      { who: '会众', text: '我信上帝，全能的父，创造天地的主。\n我信我主耶稣基督，上帝独生的子；因圣灵感孕，由童贞女马利亚所生；在本丢彼拉多手下受难，被钉于十字架，死了，葬了；降在阴间；第三天从死人中复活；升天，坐在全能父上帝的右边；将来必从那里降临，审判活人、死人。\n我信圣灵；我信圣而公之教会；我信圣徒相通；我信罪得赦免；我信身体复活；我信永生。阿们。' },
    ],
  };

  const NICENE_CREED = {
    heading: '尼西亚信经',
    steps: [
      { who: '会众', text: '我信独一上帝，全能的父，创造天地和一切有形无形万物的主。\n我信主耶稣基督，上帝的独生子，在万世以前为父所生，出于上帝而为上帝，出于光而为光，出于真上帝而为真上帝，受生而非被造，与父一体，万物都藉著祂受造；为我们世人，为拯救我们，从天降临，因圣灵由童贞女马利亚取著肉身，成为人；在本丢彼拉多手下为我们钉于十字架，受难，埋葬；照圣经第三天复活；升天，坐在父的右边；将来必在荣耀中再临，审判活人死人，祂的国度无穷无尽。\n我信圣灵，是主，是赐生命者，从父和子而出，与父、子同受敬拜，同受尊荣；祂曾藉众先知说话。\n我信使徒所传独一圣而公之教会；我认使徒所传惟一的洗礼，使罪得赦；我望死人复活，并来世生命。阿们。' },
    ],
  };

  const LORD_PRAYER = {
    heading: '主祷文',
    steps: [
      { who: '会众', text: '我们在天上的父：愿人都尊祢的名为圣。愿祢的国降临；愿祢的旨意行在地上，如同行在天上。我们日用的饮食，今日赐给我们。免我们的债，如同我们免了人的债。不叫我们遇见试探；救我们脱离凶恶。因为国度、权柄、荣耀，全是祢的，直到永远。阿们。' },
    ],
  };

  const BENEDICTUS = {
    heading: '以色列颂（撒迦利亚颂）',
    steps: [{ who: '会众', text: '主以色列的上帝是应当称颂的，因祂眷顾祂的百姓，为他们施行救赎，在祂仆人大卫家中，为我们兴起了拯救的角。……使我们终身在祂面前，坦然无惧地用圣洁、公义事奉祂。' }],
  };
  const MAGNIFICAT = {
    heading: '尊主颂（马利亚颂）',
    steps: [{ who: '会众', text: '我心尊主为大；我灵以上帝我的救主为乐。因为祂顾念祂使女的卑微；从今以后，万代要称我有福。那有权能的，为我成就了大事；祂的名为圣。祂怜悯敬畏祂的人，直到世世代代。' }],
  };
  const NUNC_DIMITTIS = {
    heading: '西面颂',
    steps: [{ who: '会众', text: '主啊，如今可以照祢的话，释放仆人安然去世；因为我的眼睛已经看见祢的救恩，就是祢在万民面前所预备的，是照亮外邦人的光，又是祢民以色列的荣耀。' }],
  };

  const GLORIA = {
    heading: '荣归主颂',
    steps: [{ who: '会众', text: '但愿荣耀归于至高之处的上帝，平安归于地上祂所喜悦的人。我们赞美祢，称颂祢，敬拜祢，尊崇祢，感谢祢，因祢的大荣耀。主上帝，天上的君王，全能的天父；主耶稣基督，独生的圣子；主上帝，上帝的羔羊，除掉世人罪孽的，求祢怜悯我们。' }],
  };
  const KYRIE = {
    heading: '垂怜经',
    steps: [{ who: '会众', text: '上主，求祢垂怜。基督，求祢垂怜。上主，求祢垂怜。' }],
  };
  const SANCTUS = {
    heading: '圣哉颂',
    steps: [{ who: '会众', text: '圣哉！圣哉！圣哉！万军之上主，祢的荣光充满全地。高高在上和散那。奉主名来的是应当称颂的。高高在上和散那。' }],
  };
  const AGNUS = {
    heading: '羔羊颂',
    steps: [{ who: '会众', text: '上帝的羔羊，除去世人罪孽的，求祢怜悯我们。上帝的羔羊，除去世人罪孽的，求祢赐我们平安。' }],
  };

  const PEACE = {
    heading: '平安礼',
    steps: [{ who: '主礼', text: '愿主的平安常与你们同在。', rubric: true }, { who: '会众', text: '也与你同在。' }],
  };

  function collect(day) {
    const season = day.season;
    const collectText = {
      '将临期': '全能的上主，求祢在我们心中预备道路，使我们以儆醒的心等候基督的再临，并以悔改与盼望迎接祢的国度降临。',
      '圣诞期': '满有恩典的上主，感谢祢差遣圣子耶稣基督降世为人，住在我们中间。求祢使我们在基督里得著生命与平安，并与人分享这大喜的信息。',
      '显现期': '上主啊，祢藉著基督将真光照亮万民。求祢引导我们在光中行走，并把祢的荣耀显明给我们周围的人。',
      '大斋期': '慈悲的上主，求祢藉著圣灵引导我们克己、祷告与施舍，使我们在悔改中归向祢，与基督同走十字架的道路。',
      '复活期': '复活的主啊，祢胜过死亡，赐下新生命。求祢使我们在复活的盼望中满有喜乐，并以更新的生命见证祢。',
      '圣灵降临期': '上主啊，求祢以圣灵充满我们，使我们在恩典中成长，在爱中合一，忠心作祢的见证，直到主再来。',
      '常年期': '上主啊，求祢藉著圣言与圣礼喂养我们，使我们在基督里日日成长，活出祢所喜悦的生活。',
    };
    return collectText[season] || collectText['常年期'];
  }

  function intercession(day) {
    return {
      heading: '代祷',
      steps: [
        { who: '主礼', text: '让我们为圣而公之教会、为世界和平、为在上掌权者、为我们所关爱的人，并为一切有需要的人祈祷。' },
        { who: '主礼', text: '上主，求祢垂听我们的祷告。', rubric: true },
        { who: '会众', text: '也求祢按祢的旨意，应允我们。' },
      ],
    };
  }

  function blessing() {
    return {
      heading: '祝福',
      steps: [
        { who: '主礼', text: '愿全能的上帝，圣父、圣子、圣灵，赐福与你们，保守你们直到永远。' },
        { who: '会众', text: '阿们。' },
      ],
    };
  }

  const MODES = {
    morning: {
      label: '早祷崇拜',
      sub: '圣公会《公祷书》早祷结构',
      steps: [
        { heading: '宣召', steps: [{ who: '主礼', text: '我们来到上主面前，以喜乐的心敬拜祂；祂是我们的磐石，我们的拯救。', rubric: true }] },
        CONFESSION,
        { heading: '启应', steps: VERSICLES_M },
        { heading: '诗篇', reading: 'psalm' },
        { heading: '旧约经课', reading: 'ot' },
        BENEDICTUS,
        { heading: '新约经课', reading: 'epistle' },
        APOSTLES_CREED,
        LORD_PRAYER,
        { heading: '本日祝文', collect: true },
        intercession,
        blessing,
      ],
    },
    evening: {
      label: '晚祷崇拜',
      sub: '圣公会《公祷书》晚祷结构',
      steps: [
        { heading: '宣召', steps: [{ who: '主礼', text: '主是我们的亮光，我们的拯救；我们还惧怕谁呢？', rubric: true }] },
        CONFESSION,
        { heading: '启应', steps: VERSICLES_E },
        { heading: '诗篇', reading: 'psalm' },
        { heading: '旧约经课', reading: 'ot' },
        MAGNIFICAT,
        { heading: '新约经课', reading: 'epistle' },
        NUNC_DIMITTIS,
        APOSTLES_CREED,
        LORD_PRAYER,
        { heading: '本日祝文', collect: true },
        intercession,
        blessing,
      ],
    },
    eucharist: {
      label: '圣餐崇拜',
      sub: '圣公会圣餐崇拜（第二式）结构 · 线上版本以灵里参与',
      steps: [
        { heading: '宣召', steps: [{ who: '主礼', text: '我们要称谢上主，因祂本为善；祂的慈爱永远长存。', rubric: true }] },
        CONFESSION,
        KYRIE,
        GLORIA,
        { heading: '本日祝文', collect: true },
        { heading: '旧约经课', reading: 'ot' },
        { heading: '诗篇', reading: 'psalm' },
        { heading: '书信经课', reading: 'epistle' },
        { heading: '福音', reading: 'gospel', gospel: true },
        { heading: '讲道', steps: [{ who: '主礼', text: '（可回到「每日一课」的释经与属灵教训，作为本日信息。）', rubric: true }] },
        NICENE_CREED,
        intercession,
        PEACE,
        { heading: '献礼', steps: [{ who: '主礼', text: '万物都从祢而来，我们把从祢而得的献给祢。' }] },
        SANCTUS,
        { heading: '祝圣祷文（简短）', steps: [{ who: '主礼', text: '慈悲的天父，我们记念祢的圣子耶稣基督，在祂被卖的那一夜，拿起饼来，祝谢了，擘开，说：「这是我的身体，为你们舍的。」饭后又拿起杯来，说：「这杯是用我的血所立的新约。」主礼人与会众一同献上感谢与赞美。', rubric: true }] },
        LORD_PRAYER,
        AGNUS,
        { heading: '领受圣餐', steps: [{ who: '主礼', text: '在线上崇拜中，我们以悔改、信心与渴慕的心，在灵里领受基督；并盼望在教会中一同领受圣礼。', rubric: true }] },
        blessing,
      ],
    },
  };

  global.Liturgy = { MODES, collect };
})(window);
