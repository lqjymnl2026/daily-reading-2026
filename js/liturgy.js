/* liturgy.js — 圣公会崇拜流程（参考香港圣公会《公祷书》结构，祝文为改写版本）
   支持 zhCN / zhTW / en / ja 四种语言 */
(function (global) {
  'use strict';

  function L(item) {
    // 返回当前语言的文本
    const lang = global.I18N ? global.I18N.getLang() : 'zhCN';
    if (lang === 'zhTW' && global.ZHConv) return global.ZHConv.toTraditional(item.zh || item.text);
    if (lang === 'en' && item.en) return item.en;
    if (lang === 'ja' && item.ja) return item.ja;
    return item.zh || item.text;
  }
  function LS(step) {
    // 返回步骤文本（支持多语言字段）
    const lang = global.I18N ? global.I18N.getLang() : 'zhCN';
    if (lang === 'zhTW' && global.ZHConv && step.zh) return global.ZHConv.toTraditional(step.zh);
    if (lang === 'en' && step.en) return step.en;
    if (lang === 'ja' && step.ja) return step.ja;
    return step.zh || step.text || '';
  }
  function heading(h) {
    if (global.I18N) {
      const t = global.I18N.t('w_' + h);
      if (t !== 'w_' + h) return t;
    }
    return h;
  }

  const VERSICLES_M = {
    heading: '启应',
    steps: [
      { who: '主礼', zh: '主啊，求你开启我们的口。', en: 'O Lord, open our lips.', ja: '主よ、われらのくちびるを開きたまえ。' },
      { who: '会众', zh: '我们的口要张开，称赞你。', en: 'And our mouth shall show forth your praise.', ja: 'われらの口はあなたの誉れを語らん。' },
      { who: '主礼', zh: '上主啊，求你快快帮助我们。', en: 'O God, make speed to save us.', ja: '神よ、すみやかにわれらを助けたまえ。' },
      { who: '会众', zh: '上主，求你快快拯救我们。', en: 'O Lord, make haste to help us.', ja: '主よ、すみやかにわれらを救いたまえ。' },
    ],
  };
  const VERSICLES_E = {
    heading: '启应',
    steps: [
      { who: '主礼', zh: '上主啊，求你帮助我们。', en: 'O Lord, support us.', ja: '主よ、われらを支えたまえ。' },
      { who: '会众', zh: '上主，求你速速帮助我们。', en: 'And help us now and ever.', ja: '今もとこしえにも助けたまえ。' },
      { who: '主礼', zh: '愿上主与你们同在。', en: 'The Lord be with you.', ja: '主はあなたがたと共にいます。' },
      { who: '会众', zh: '也与你的心灵同在。', en: 'And with your spirit.', ja: 'あなたの霊と共にいます。' },
    ],
  };

  const CONFESSION = {
    heading: '认罪',
    steps: [
      { who: '主礼', zh: '我们在天上的父，我们得罪了你，也得罪了邻舍。我们心思、言语、行为多有亏欠。求你因圣子耶稣基督的缘故，赦免我们的过犯，洁净我们的心。', en: 'Almighty God, we have sinned against you and against our neighbour in thought, word and deed. For the sake of your Son Jesus Christ, forgive us our sins and cleanse our hearts.', ja: '全能の神よ、われらは思いと言葉と行いとによって、あなたに罪を犯し、隣人に罪を犯しました。み子イエス・キリストのゆえに、われらの罪を赦し、心を清めたまえ。' },
      { who: '会众', zh: '求慈悲的上主，怜悯我们，赦免我们的罪，引导我们走义路。阿们。', en: 'Merciful Lord, have mercy upon us, forgive us our sins and lead us in the way of righteousness. Amen.', ja: 'あわれみ深い主よ、われらをあわれみ、罪を赦し、義の道に導きたまえ。アーメン。' },
      { who: '主礼', zh: '愿全能的上帝，因着他的圣子耶稣基督，怜悯我们，赦免我们的罪，赐给我们平安与力量，去事奉他。阿们。', en: 'May Almighty God, for the sake of his Son Jesus Christ, have mercy upon us, forgive us our sins, and give us peace and strength to serve him. Amen.', ja: '全能の神が、み子イエス・キリストのゆえに、われらをあわれみ、罪を赦し、平安と力とを賜い、仕える者となしたまえ。アーメン。', rubric: true },
    ],
  };

  const APOSTLES_CREED = {
    heading: '使徒信经',
    steps: [
      { who: '会众', zh: '我信上帝，全能的父，创造天地的主。\n我信我主耶稣基督，上帝独生的子；因圣灵感孕，由童贞女马利亚所生；在本丢彼拉多手下受难，被钉于十字架，死了，葬了；降在阴间；第三天从死人中复活；升天，坐在全能父上帝的右边；将来必从那里降临，审判活人、死人。\n我信圣灵；我信圣而公之教会；我信圣徒相通；我信罪得赦免；我信身体复活；我信永生。阿们。', en: 'I believe in God, the Father almighty, creator of heaven and earth.\nI believe in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried; he descended to the dead. On the third day he rose again; he ascended into heaven, he is seated at the right hand of the Father, and he will come to judge the living and the dead.\nI believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and the life everlasting. Amen.', ja: 'われは信ず、全能の父、天と地との造り主なる神を。\nわれは信ず、そのひとり子、われらの主イエス・キリストを。主は聖霊によりてやどり、処女マリヤより生まれ、ポンテオ・ピラトのもとに苦しみを受け、十字架につけられ、死にて葬られ、陰府にくだり、三日目に死人の中よりよみがえり、天にのぼり、全能の父なる神の右に座し、かしこより来たりて、生ける人と死せる人とを審きたまわん。\nわれは信ず、聖霊を、聖なる公同の教会を、聖徒の交わりを、罪のゆるしを、からだのよみがえりを、永遠のいのちを。アーメン。' },
    ],
  };

  const NICENE_CREED = {
    heading: '尼西亚信经',
    steps: [
      { who: '会众', zh: '我信独一上帝，全能的父，创造天地和一切有形无形万物的主。\n我信主耶稣基督，上帝的独生子，在万世以前为父所生……为我们世人，为拯救我们，从天降临，因圣灵由童贞女马利亚取着肉身，成为人；在本丢彼拉多手下为我们钉于十字架，受难，埋葬；照圣经第三天复活；升天，坐在父的右边；将来必在荣耀中再临，审判活人死人。\n我信圣灵，是主，是赐生命者……\n我信使徒所传独一圣而公之教会；我认使徒所传惟一的洗礼，使罪得赦；我望死人复活，并来世生命。阿们。', en: 'We believe in one God, the Father, the Almighty, maker of heaven and earth, of all that is, seen and unseen.\nWe believe in one Lord, Jesus Christ, the only Son of God, eternally begotten of the Father… For us and for our salvation he came down from heaven: by the power of the Holy Spirit he became incarnate from the Virgin Mary, and was made man. For our sake he was crucified under Pontius Pilate; he suffered death and was buried. On the third day he rose again in accordance with the Scriptures; he ascended into heaven and is seated at the right hand of the Father. He will come again in glory to judge the living and the dead, and his kingdom will have no end.\nWe believe in the Holy Spirit, the Lord, the giver of life…\nWe believe in one holy catholic and apostolic Church. We acknowledge one baptism for the forgiveness of sins. We look for the resurrection of the dead, and the life of the world to come. Amen.', ja: 'われらは信ず、全能の父、天と地と、見ゆるもの見えぬもの、すべてのものの造り主なる唯一の神を。\nわれらは信ず、唯一の主イエス・キリストを。神の独り子、永遠に父より生まれ……われら人類のため、われらの救いのために天より下り、聖霊によりて処女マリヤより肉体をとり、人となり、ポンテオ・ピラトのもとにわれらのために十字架につけられ、苦しみを受け、葬られ、聖書のとおり三日目によみがえり、天に昇り、父の右に座し、栄光のうちに再び来たりて、生ける人と死せる人とを審きたまわん。\nわれらは信ず、主にして命の与え主なる聖霊を……\nわれらは信ず、唯一の聖なる公同の使徒的教会を。罪のゆるしのための唯一の洗礼を告白し、死人のよみがえりと来たるべき世のいのちとを待ち望む。アーメン。' },
    ],
  };

  const LORD_PRAYER = {
    heading: '主祷文',
    steps: [
      { who: '会众', zh: '我们在天上的父：愿人都尊你的名为圣。愿你的国降临；愿你的旨意行在地上，如同行在天上。我们日用的饮食，今日赐给我们。免我们的债，如同我们免了人的债。不叫我们遇见试探；救我们脱离凶恶。因为国度、权柄、荣耀，全是你的，直到永远。阿们。', en: 'Our Father in heaven, hallowed be your name, your kingdom come, your will be done, on earth as in heaven. Give us today our daily bread. Forgive us our sins as we forgive those who sin against us. Lead us not into temptation but deliver us from evil. For the kingdom, the power, and the glory are yours, now and for ever. Amen.', ja: '天にいますわれらの父よ。御名があがめられますように。御国が来ますように。みこころが天に行われるとおり、地にも行われますように。われらの日用の糧を今日も与えたまえ。われらに罪を犯す者をゆるしましたように、われらの罪をもゆるしたまえ。われらを試みに導かず、悪より救い出したまえ。国と力と栄えとは、限りなくあなたのものだからです。アーメン。' },
    ],
  };

  const BENEDICTUS = {
    heading: '以色列颂（撒迦利亚颂）',
    steps: [
      { who: '会众', zh: '主以色列的上帝是应当称颂的，因他眷顾他的百姓，为他们施行救赎，在他仆人大卫家中，为我们兴起了拯救的角。……使我们终身在他面前，坦然无惧地用圣洁、公义事奉他。', en: 'Blessed be the Lord, the God of Israel, who has come to his people and set them free. He has raised up for us a mighty saviour, born of the house of his servant David.… free to worship him without fear, holy and righteous in his sight all the days of our life.', ja: 'イスラエルの神なる主はほめたたえられるべきかな。主はその民を顧みて、これを贖い、その僕ダビデの家に、われらのために救いの角を立てられた。……われらは生涯、恐れることなく、聖と義とをもって、御前に仕えることができる。' },
    ],
  };
  const MAGNIFICAT = {
    heading: '尊主颂（马利亚颂）',
    steps: [
      { who: '会众', zh: '我心尊主为大；我灵以上帝我的救主为乐。因为他顾念他使女的卑微；从今以后，万代要称我有福。那有权能的，为我成就了大事；他的名为圣。他怜悯敬畏他的人，直到世世代代。', en: 'My soul proclaims the greatness of the Lord, my spirit rejoices in God my Saviour; for he has looked with favour on his lowly servant. From this day all generations will call me blessed: the Almighty has done great things for me, and holy is his name. He has mercy on those who fear him in every generation.', ja: 'わが魂は主をあがめ、わが霊は救い主なる神を喜ぶ。主はそのはしための卑しさを顧みられたからである。見よ、今より後、すべての世代はわれをさいわいな者と言うであろう。力ある主はわれに大いなることをし給い、その御名は聖である。主のあわれみは代々にわたり、主を畏れる者に及ぶ。' },
    ],
  };
  const NUNC_DIMITTIS = {
    heading: '西面颂',
    steps: [
      { who: '会众', zh: '主啊，如今可以照你的话，释放仆人安然去世；因为我的眼睛已经看见你的救恩，就是你在万民面前所预备的，是照亮外邦人的光，又是你民以色列的荣耀。', en: 'Lord, now you let your servant go in peace: your word has been fulfilled. My own eyes have seen the salvation which you have prepared in the sight of every people: a light to reveal you to the nations and the glory of your people Israel.', ja: '主よ、今こそ、み言葉どおり、あなたの僕を安らかに去らせたまう。われらの目はあなたの救いを見た。それはすべての民の前に備えられ、異邦人を照らす光、御民イスラエルの栄光である。' },
    ],
  };

  const GLORIA = {
    heading: '荣归主颂',
    steps: [
      { who: '会众', zh: '但愿荣耀归于至高之处的上帝，平安归于地上他所喜悦的人。我们赞美你，称颂你，敬拜你，尊崇你，感谢你，因你的大荣耀。主上帝，天上的君王，全能的天父；主耶稣基督，独生的圣子；主上帝，上帝的羔羊，除掉世人罪孽的，求你怜悯我们。', en: 'Glory to God in the highest, and peace to his people on earth. Lord God, heavenly King, almighty God and Father, we worship you, we give you thanks, we praise you for your glory. Lord Jesus Christ, only Son of the Father, Lord God, Lamb of God, you take away the sin of the world: have mercy on us.', ja: 'いと高きところには神に栄光、地にはみ心にかなう人に平和あれ。われらはあなたをほめたたえ、あなたを拝み、あなたの大いなる栄光のためにあなたに感謝する。主なる神、天の王、全能の父なる神。主なる神、神の小羊、世の罪を取り除きたまう者よ、われらをあわれみたまえ。' },
    ],
  };
  const KYRIE = {
    heading: '垂怜经',
    steps: [
      { who: '会众', zh: '上主，求你垂怜。基督，求你垂怜。上主，求你垂怜。', en: 'Lord, have mercy. Christ, have mercy. Lord, have mercy.', ja: '主よ、あわれみたまえ。キリストよ、あわれみたまえ。主よ、あわれみたまえ。' },
    ],
  };
  const SANCTUS = {
    heading: '圣哉颂',
    steps: [
      { who: '会众', zh: '圣哉！圣哉！圣哉！万军之上主，你的荣光充满全地。高高在上和散那。奉主名来的是应当称颂的。高高在上和散那。', en: 'Holy, holy, holy Lord, God of power and might, heaven and earth are full of your glory. Hosanna in the highest. Blessed is he who comes in the name of the Lord. Hosanna in the highest.', ja: '聖なるかな、聖なるかな、聖なるかな、万軍の主。その栄光は天と地に満つ。いと高きところにホサンナ。主の御名によって来たる者はほむべきかな。いと高きところにホサンナ。' },
    ],
  };
  const AGNUS = {
    heading: '羔羊颂',
    steps: [
      { who: '会众', zh: '上帝的羔羊，除去世人罪孽的，求你怜悯我们。上帝的羔羊，除去世人罪孽的，求你赐我们平安。', en: 'Lamb of God, you take away the sins of the world: have mercy on us. Lamb of God, you take away the sins of the world: grant us peace.', ja: '世の罪を取り除く神の小羊よ、われらをあわれみたまえ。世の罪を取り除く神の小羊よ、われらに平和を与えたまえ。' },
    ],
  };
  const PEACE = {
    heading: '平安礼',
    steps: [
      { who: '主礼', zh: '愿主的平安常与你们同在。', en: 'The peace of the Lord be always with you.', ja: '主の平和が常にあなたがたと共にありますように。', rubric: true },
      { who: '会众', zh: '也与你同在。', en: 'And with you.', ja: 'あなたとも共に。' },
    ],
  };

  function collect(day) {
    const season = day.season;
    const lang = global.I18N ? global.I18N.getLang() : 'zhCN';
    const zh = {
      '将临期': '全能的上主，求你在我们心中预备道路，使我们以儆醒的心等候基督的再临，并以悔改与盼望迎接你的国度降临。',
      '圣诞期': '满有恩典的上主，感谢你差遣圣子耶稣基督降世为人，住在我们中间。求你使我们在基督里得着生命与平安，并与人分享这大喜的信息。',
      '显现期': '上主啊，你藉着基督将真光照亮万民。求你引导我们在光中行走，并把你的荣耀显明给我们周围的人。',
      '大斋期': '慈悲的上主，求你藉着圣灵引导我们克己、祷告与施舍，使我们在悔改中归向你，与基督同走十字架的道路。',
      '复活期': '复活的主啊，你胜过死亡，赐下新生命。求你使我们在复活的盼望中满有喜乐，并以更新的生命见证你。',
      '圣灵降临期': '上主啊，求你以圣灵充满我们，使我们在恩典中成长，在爱中合一，忠心作你的见证，直到主再来。',
      '常年期': '上主啊，求你藉着圣言与圣礼喂养我们，使我们在基督里日日成长，活出你所喜悦的生活。',
    };
    const en = {
      '将临期': 'Almighty God, prepare our hearts, that we may watch in hope for the coming of Christ and, with repentance and expectation, welcome your kingdom. Amen.',
      '圣诞期': 'Gracious God, we thank you for sending your Son Jesus Christ to dwell among us. Grant that in him we may find life and peace, and share this good news with all. Amen.',
      '显现期': 'O God, through Christ you have revealed your light to all peoples. Lead us to walk in that light and show your glory to those around us. Amen.',
      '大斋期': 'Merciful God, lead us by your Spirit in self-denial, prayer and generosity, that in repentance we may return to you and walk the way of the cross with Christ. Amen.',
      '复活期': 'Risen Lord, you have conquered death and given us new life. Fill us with the joy of resurrection hope, and make us witnesses of your new creation. Amen.',
      '圣灵降临期': 'O Lord, fill us with your Holy Spirit, that we may grow in grace, be one in love, and bear faithful witness to you until Christ comes again. Amen.',
      '常年期': 'O Lord, feed us with your word and sacraments, that we may grow daily in Christ and live the life you call us to live. Amen.',
    };
    const ja = {
      '将临期': '全能の神よ、われらの心に道を備え、キリストの再臨を待ち望み、悔い改めと希望をもって御国を迎えさせたまえ。アーメン。',
      '圣诞期': '恵み深き神よ、み子イエス・キリストを世に遣わし、われらのうちに宿らせたまいしことを感謝します。キリストにあっていのちと平安を得、この喜びの知らせを分かち合うことができますように。アーメン。',
      '显现期': '神よ、キリストによりてすべての民に真の光を現したまえり。われらをその光のうちに歩ませ、御栄光を周りの人々に示させたまえ。アーメン。',
      '大斋期': 'あわれみ深き神よ、聖霊によりて、われらを節制・祈り・施しに導き、悔い改めて御もとへ帰り、キリストとともに十字架の道を歩ませたまえ。アーメン。',
      '复活期': '復活の主よ、あなたは死に勝ち、新しいいのちを与えました。われらを復活の望みの喜びで満たし、新しくされたいのちをもって証しさせたまえ。アーメン。',
      '圣灵降临期': '主よ、聖霊をもってわれらを満たし、恵みのうちに成長させ、愛のうちに一つとし、主の再臨まで忠実に証しさせたまえ。アーメン。',
      '常年期': '主よ、み言葉と聖礼典をもってわれらを養い、キリストにあって日々成長し、御心にかなういのちを生きたまえ。アーメン。',
    };
    const key = season || '常年期';
    if (lang === 'en') return en[key] || en['常年期'];
    if (lang === 'ja') return ja[key] || ja['常年期'];
    if (lang === 'zhTW' && global.ZHConv) return global.ZHConv.toTraditional(zh[key] || zh['常年期']);
    return zh[key] || zh['常年期'];
  }

  function intercession(day) {
    return {
      heading: '代祷',
      steps: [
        { who: '主礼', zh: '让我们为圣而公之教会、为世界和平、为在上掌权者、为我们所关爱的人，并为一切有需要的人祈祷。', en: 'Let us pray for the holy catholic Church, for the peace of the world, for those in authority, for those we love, and for all in need.', ja: '聖なる公同の教会のため、世界の平和のため、権威ある者のため、愛する者のため、すべての必要を抱える者のために祈りましょう。' },
        { who: '主礼', zh: '上主，求你垂听我们的祷告。', en: 'Lord, hear our prayer.', ja: '主よ、われらの祈りを聞きたまえ。', rubric: true },
        { who: '会众', zh: '也求你按你的旨意，应允我们。', en: 'And grant us what we need according to your will.', ja: 'みこころに従って、われらに必要なものを与えたまえ。' },
      ],
    };
  }

  function blessing() {
    return {
      heading: '祝福',
      steps: [
        { who: '主礼', zh: '愿全能的上帝，圣父、圣子、圣灵，赐福与你们，保守你们直到永远。', en: 'May Almighty God, Father, Son and Holy Spirit, bless you and keep you now and for ever.', ja: '全能の神、父と子と聖霊が、あなたがたを祝福し、今もとこしえにも守りたまわん。' },
        { who: '会众', zh: '阿们。', en: 'Amen.', ja: 'アーメン。' },
      ],
    };
  }

  const MODES = {
    morning: {
      labelKey: 'worshipMorning',
      subKey: 'worshipSub',
      steps: [
        { heading: '宣召', steps: [{ who: '主礼', zh: '我们来到上主面前，以喜乐的心敬拜他；他是我们的磐石，我们的拯救。', en: 'We come before the Lord with joyful hearts; he is our rock and our salvation.', ja: 'われらは喜びの心をもって主のみ前に来たる。主はわれらの岩、われらの救いである。', rubric: true }] },
        CONFESSION,
        VERSICLES_M,
        { heading: '诗篇', reading: 'psalm' },
        { heading: '旧约经课', reading: 'ot' },
        BENEDICTUS,
        { heading: '新约经课', reading: 'epistle' },
        APOSTLES_CREED,
        LORD_PRAYER,
        { heading: '本日祝文', collect: true },
        intercession(null),
        blessing(),
      ],
    },
    evening: {
      labelKey: 'worshipEvening',
      subKey: 'worshipSubE',
      steps: [
        { heading: '宣召', steps: [{ who: '主礼', zh: '主是我们的亮光，我们的拯救；我们还惧怕谁呢？', en: 'The Lord is my light and my salvation; whom shall I fear?', ja: '主はわれらの光、われらの救い。われらは何を恐れよう。', rubric: true }] },
        CONFESSION,
        VERSICLES_E,
        { heading: '诗篇', reading: 'psalm' },
        { heading: '旧约经课', reading: 'ot' },
        MAGNIFICAT,
        { heading: '新约经课', reading: 'epistle' },
        NUNC_DIMITTIS,
        APOSTLES_CREED,
        LORD_PRAYER,
        { heading: '本日祝文', collect: true },
        intercession(null),
        blessing(),
      ],
    },
    eucharist: {
      labelKey: 'worshipEucharist',
      subKey: 'worshipSubC',
      steps: [
        { heading: '宣召', steps: [{ who: '主礼', zh: '我们要称谢上主，因他本为善；他的慈爱永远长存。', en: 'Give thanks to the Lord, for he is good; his mercy endures for ever.', ja: '主に感謝せよ、主は恵み深く、そのいつくしみはとこしえに絶えない。', rubric: true }] },
        CONFESSION,
        KYRIE,
        GLORIA,
        { heading: '本日祝文', collect: true },
        { heading: '旧约经课', reading: 'ot' },
        { heading: '诗篇', reading: 'psalm' },
        { heading: '书经课', reading: 'epistle' },
        { heading: '福音', reading: 'gospel', gospel: true },
        { heading: '讲道', steps: [{ who: '主礼', zh: '（可回到「每日一课」的释经与属灵教训，作为本日信息。）', en: '(You may return to the Daily Lesson page for today\'s message.)', ja: '（「毎日の学び」の解説と霊的教訓を本日のメッセージとすることができます。）', rubric: true }] },
        NICENE_CREED,
        intercession(null),
        PEACE,
        { heading: '献礼', steps: [{ who: '主礼', zh: '万物都从你而来，我们把从你而得的献给你。', en: 'All things come from you, and of your own have we given you.', ja: 'すべてはあなたから出て、われらはあなたのものをあなたに献げます。' }] },
        SANCTUS,
        { heading: '祝圣祷文（简短）', steps: [{ who: '主礼', zh: '慈悲的天父，我们记念你的圣子耶稣基督，在他被卖的那一夜，拿起饼来，祝谢了，擘开，说：「这是我的身体，为你们舍的。」饭后又拿起杯来，说：「这杯是用我的血所立的新约。」主礼人与会众一同献上感谢与赞美。', en: 'Merciful Father, we remember your Son Jesus Christ: on the night he was betrayed he took bread, gave thanks, broke it, and said, "This is my body, given for you." After supper he took the cup and said, "This cup is the new covenant in my blood." With thanksgiving and praise we proclaim the mystery of faith.', ja: 'あわれみ深い父よ、われらはみ子イエス・キリストを記念します。主は裏切られた夜、パンを取り、感謝して裂き、「これはあなたがたのために与えられるわたしのからだである」と言われました。夕食の後、杯を取り、「この杯はわたしの血による新しい契約である」と言われました。われらは感謝と賛美をもって、信仰の奥義を宣べ伝えます。', rubric: true }] },
        LORD_PRAYER,
        AGNUS,
        { heading: '领受圣餐', steps: [{ who: '主礼', zh: '在线上崇拜中，我们以悔改、信心与渴慕的心，在灵里领受基督；并盼望在教会中一同领受圣礼。', en: 'In this online worship, we receive Christ in spirit with repentance, faith and longing, and we look forward to receiving the sacrament together in church.', ja: 'このオンライン礼拝において、われらは悔い改めと信仰と憧れをもって、霊においてキリストを受領し、教会で共に聖礼典を受けることを望みます。', rubric: true }] },
        blessing(),
      ],
    },
  };

  global.Liturgy = { MODES, collect, heading, L, LS };
})(window);
