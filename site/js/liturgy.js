/* liturgy.js — 聖公會崇拜流程（參考香港聖公會《公禱書》結構，祝文為改寫版本） */
(function (global) {
  'use strict';

  const VERSICLES_M = [
    { who: '主禮', text: '主啊，求祢開啟我們的口。' },
    { who: '會眾', text: '我們的口要張開，稱讚祢。' },
    { who: '主禮', text: '上主啊，求祢快快幫助我們。' },
    { who: '會眾', text: '上主，求祢快快拯救我們。' },
  ];
  const VERSICLES_E = [
    { who: '主禮', text: '上主啊，求祢幫助我們。' },
    { who: '會眾', text: '上主，求祢速速幫助我們。' },
    { who: '主禮', text: '願上主與你們同在。' },
    { who: '會眾', text: '也與你的心靈同在。' },
  ];

  const CONFESSION = {
    heading: '認罪',
    steps: [
      { who: '主禮', text: '我們在天上的父，我們得罪了祢，也得罪了鄰舍。我們心思、言語、行為多有虧欠。求祢因聖子耶穌基督的緣故，赦免我們的過犯，潔淨我們的心。' },
      { who: '會眾', text: '求慈悲的上主，憐憫我們，赦免我們的罪，引導我們走義路。阿們。' },
      { who: '主禮', text: '願全能的上帝，因著祂的聖子耶穌基督，憐憫我們，赦免我們的罪，賜給我們平安與力量，去事奉祂。阿們。', rubric: true },
    ],
  };

  const APOSTLES_CREED = {
    heading: '使徒信經',
    steps: [
      { who: '會眾', text: '我信上帝，全能的父，創造天地的主。\n我信我主耶穌基督，上帝獨生的子；因聖靈感孕，由童貞女馬利亞所生；在本丟彼拉多手下受難，被釘於十字架，死了，葬了；降在陰間；第三天從死人中復活；升天，坐在全能父上帝的右邊；將來必從那裡降臨，審判活人、死人。\n我信聖靈；我信聖而公之教會；我信聖徒相通；我信罪得赦免；我信身體復活；我信永生。阿們。' },
    ],
  };

  const NICENE_CREED = {
    heading: '尼西亞信經',
    steps: [
      { who: '會眾', text: '我信獨一上帝，全能的父，創造天地和一切有形無形萬物的主。\n我信主耶穌基督，上帝的獨生子，在萬世以前為父所生，出於上帝而為上帝，出於光而為光，出於真上帝而為真上帝，受生而非被造，與父一體，萬物都藉著祂受造；為我們世人，為拯救我們，從天降臨，因聖靈由童貞女馬利亞取著肉身，成為人；在本丟彼拉多手下為我們釘於十字架，受難，埋葬；照聖經第三天復活；升天，坐在父的右邊；將來必在榮耀中再臨，審判活人死人，祂的國度無窮無盡。\n我信聖靈，是主，是賜生命者，從父和子而出，與父、子同受敬拜，同受尊榮；祂曾藉眾先知說話。\n我信使徒所傳獨一聖而公之教會；我認使徒所傳惟一的洗禮，使罪得赦；我望死人復活，並來世生命。阿們。' },
    ],
  };

  const LORD_PRAYER = {
    heading: '主禱文',
    steps: [
      { who: '會眾', text: '我們在天上的父：願人都尊祢的名為聖。願祢的國降臨；願祢的旨意行在地上，如同行在天上。我們日用的飲食，今日賜給我們。免我們的債，如同我們免了人的債。不叫我們遇見試探；救我們脫離兇惡。因為國度、權柄、榮耀，全是祢的，直到永遠。阿們。' },
    ],
  };

  const BENEDICTUS = {
    heading: '以色列頌（撒迦利亞頌）',
    steps: [{ who: '會眾', text: '主以色列的上帝是應當稱頌的，因祂眷顧祂的百姓，為他們施行救贖，在祂僕人大衛家中，為我們興起了拯救的角。……使我們終身在祂面前，坦然無懼地用聖潔、公義事奉祂。' }],
  };
  const MAGNIFICAT = {
    heading: '尊主頌（馬利亞頌）',
    steps: [{ who: '會眾', text: '我心尊主為大；我靈以上帝我的救主為樂。因為祂顧念祂使女的卑微；從今以後，萬代要稱我有福。那有權能的，為我成就了大事；祂的名為聖。祂憐憫敬畏祂的人，直到世世代代。' }],
  };
  const NUNC_DIMITTIS = {
    heading: '西面頌',
    steps: [{ who: '會眾', text: '主啊，如今可以照祢的話，釋放僕人安然去世；因為我的眼睛已經看見祢的救恩，就是祢在萬民面前所預備的，是照亮外邦人的光，又是祢民以色列的榮耀。' }],
  };

  const GLORIA = {
    heading: '榮歸主頌',
    steps: [{ who: '會眾', text: '但願榮耀歸於至高之處的上帝，平安歸於地上祂所喜悅的人。我們讚美祢，稱頌祢，敬拜祢，尊崇祢，感謝祢，因祢的大榮耀。主上帝，天上的君王，全能的天父；主耶穌基督，獨生的聖子；主上帝，上帝的羔羊，除掉世人罪孽的，求祢憐憫我們。' }],
  };
  const KYRIE = {
    heading: '垂憐經',
    steps: [{ who: '會眾', text: '上主，求祢垂憐。基督，求祢垂憐。上主，求祢垂憐。' }],
  };
  const SANCTUS = {
    heading: '聖哉頌',
    steps: [{ who: '會眾', text: '聖哉！聖哉！聖哉！萬軍之上主，祢的榮光充滿全地。高高在上和散那。奉主名來的是應當稱頌的。高高在上和散那。' }],
  };
  const AGNUS = {
    heading: '羔羊頌',
    steps: [{ who: '會眾', text: '上帝的羔羊，除去世人罪孽的，求祢憐憫我們。上帝的羔羊，除去世人罪孽的，求祢賜我們平安。' }],
  };

  const PEACE = {
    heading: '平安禮',
    steps: [{ who: '主禮', text: '願主的平安常與你們同在。', rubric: true }, { who: '會眾', text: '也與你同在。' }],
  };

  function collect(day) {
    const season = day.season;
    const collectText = {
      '將臨期': '全能的上主，求祢在我們心中預備道路，使我們以儆醒的心等候基督的再臨，並以悔改與盼望迎接祢的國度降臨。',
      '聖誕期': '滿有恩典的上主，感謝祢差遣聖子耶穌基督降世為人，住在我們中間。求祢使我們在基督裏得著生命與平安，並與人分享這大喜的信息。',
      '顯現期': '上主啊，祢藉著基督將真光照亮萬民。求祢引導我們在光中行走，並把祢的榮耀顯明給我們周圍的人。',
      '大齋期': '慈悲的上主，求祢藉著聖靈引導我們克己、禱告與施捨，使我們在悔改中歸向祢，與基督同走十字架的道路。',
      '復活期': '復活的主啊，祢勝過死亡，賜下新生命。求祢使我們在復活的盼望中滿有喜樂，並以更新的生命見證祢。',
      '聖靈降臨期': '上主啊，求祢以聖靈充滿我們，使我們在恩典中成長，在愛中合一，忠心作祢的見證，直到主再來。',
      '常年期': '上主啊，求祢藉著聖言與聖禮餵養我們，使我們在基督裏日日成長，活出祢所喜悅的生活。',
    };
    return collectText[season] || collectText['常年期'];
  }

  function intercession(day) {
    return {
      heading: '代禱',
      steps: [
        { who: '主禮', text: '讓我們為聖而公之教會、為世界和平、為在上掌權者、為我們所關愛的人，並為一切有需要的人祈禱。' },
        { who: '主禮', text: '上主，求祢垂聽我們的禱告。', rubric: true },
        { who: '會眾', text: '也求祢按祢的旨意，應允我們。' },
      ],
    };
  }

  function blessing() {
    return {
      heading: '祝福',
      steps: [
        { who: '主禮', text: '願全能的上帝，聖父、聖子、聖靈，賜福與你們，保守你們直到永遠。' },
        { who: '會眾', text: '阿們。' },
      ],
    };
  }

  const MODES = {
    morning: {
      label: '早禱崇拜',
      sub: '聖公會《公禱書》早禱結構',
      steps: [
        { heading: '宣召', steps: [{ who: '主禮', text: '我們來到上主面前，以喜樂的心敬拜祂；祂是我們的磐石，我們的拯救。', rubric: true }] },
        CONFESSION,
        { heading: '啟應', steps: VERSICLES_M },
        { heading: '詩篇', reading: 'psalm' },
        { heading: '舊約經課', reading: 'ot' },
        BENEDICTUS,
        { heading: '新約經課', reading: 'epistle' },
        APOSTLES_CREED,
        LORD_PRAYER,
        { heading: '本日祝文', collect: true },
        intercession,
        blessing,
      ],
    },
    evening: {
      label: '晚禱崇拜',
      sub: '聖公會《公禱書》晚禱結構',
      steps: [
        { heading: '宣召', steps: [{ who: '主禮', text: '主是我們的亮光，我們的拯救；我們還懼怕誰呢？', rubric: true }] },
        CONFESSION,
        { heading: '啟應', steps: VERSICLES_E },
        { heading: '詩篇', reading: 'psalm' },
        { heading: '舊約經課', reading: 'ot' },
        MAGNIFICAT,
        { heading: '新約經課', reading: 'epistle' },
        NUNC_DIMITTIS,
        APOSTLES_CREED,
        LORD_PRAYER,
        { heading: '本日祝文', collect: true },
        intercession,
        blessing,
      ],
    },
    eucharist: {
      label: '聖餐崇拜',
      sub: '聖公會聖餐崇拜（第二式）結構 · 線上版本以靈裡參與',
      steps: [
        { heading: '宣召', steps: [{ who: '主禮', text: '我們要稱謝上主，因祂本為善；祂的慈愛永遠長存。', rubric: true }] },
        CONFESSION,
        KYRIE,
        GLORIA,
        { heading: '本日祝文', collect: true },
        { heading: '舊約經課', reading: 'ot' },
        { heading: '詩篇', reading: 'psalm' },
        { heading: '書信經課', reading: 'epistle' },
        { heading: '福音', reading: 'gospel', gospel: true },
        { heading: '講道', steps: [{ who: '主禮', text: '（可回到「每日一課」的釋經與屬靈教訓，作為本日信息。）', rubric: true }] },
        NICENE_CREED,
        intercession,
        PEACE,
        { heading: '獻禮', steps: [{ who: '主禮', text: '萬物都從祢而來，我們把從祢而得的獻給祢。' }] },
        SANCTUS,
        { heading: '祝聖禱文（簡短）', steps: [{ who: '主禮', text: '慈悲的天父，我們記念祢的聖子耶穌基督，在祂被賣的那一夜，拿起餅來，祝謝了，擘開，說：「這是我的身體，為你們捨的。」飯後又拿起杯來，說：「這杯是用我的血所立的新約。」主禮人與會眾一同獻上感謝與讚美。', rubric: true }] },
        LORD_PRAYER,
        AGNUS,
        { heading: '領受聖餐', steps: [{ who: '主禮', text: '在線上崇拜中，我們以悔改、信心與渴慕的心，在靈裡領受基督；並盼望在教會中一同領受聖禮。', rubric: true }] },
        blessing,
      ],
    },
  };

  global.Liturgy = { MODES, collect };
})(window);
