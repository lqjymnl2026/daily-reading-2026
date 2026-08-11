# 每日读经 2025–2026（香港圣公会读经表）— 网站与资料

本专案把《香港圣公会 2026 年读经表（Lectionary 25–26 中文版）》完整数位化，
并建造成一个「每日读经阅读分享」静态网站，提供：

1. **一天一课**：按读经表每一天对应一课（2025-11-30 至 2026-12-31，共 397 天）。
2. **文本阅读**：每课列出圣餐崇拜经课（旧约、诗篇、书信、福音）及早祷／晚祷补充经课，
   并显示公有领域《和合本》经文全文；主日另提供「互补式／半连读式」两套经课。
3. **语音朗读**：每段经文可用浏览器内置中文语音朗读（Web Speech API，无需连网）。
4. **今日释经与属灵教训**：自动生成今日主题、金句、经课概览与属灵教训。
5. **默想与感受回应**：默想问题 + 可编辑的读经感受（储存于本机浏览器）。
6. **线上崇拜**：按圣公会《公祷书》流程编排的早祷、晚祷、圣餐崇拜，
   自动插入当日经课与季节祝文。

## 如何运行

网站是纯静态档案，位于本仓库根目录（`index.html`、`css/`、`js/`、`data/`），并已部署至 GitHub Pages：
**https://lqjymnl2026.github.io/daily-reading-2026/**。

本机预览：因需要 fetch 资料档，请用 HTTP 伺服器开启：

```bash
python3 -m http.server 8000
# 浏览器开启 http://localhost:8000
```

或直接双击 `start.command`（macOS）。

## 目录结构

```
index.html          今日读经
lesson.html         每日一课（?date=YYYY-MM-DD）
calendar.html       读经历
worship.html        线上崇拜（?date=...&mode=morning|eucharist|evening）
about.html          本书分析
css/style.css       样式（礼仪季节配色）
js/                 前端逻辑（refs / bible / tts / commentary / liturgy …）
data/
  lectionary.json   397 天结构化读经资料（从 PDF 解析）
  refbooks.json     书卷名称映射
  bible/*.json      和合本（公有领域）66 卷经文
analysis/           PDF 解析与资料管线脚本（Python）
screenshots/        网站截图
```

## 资料管线

1. `analysis/parse_lectionary.py` — 读取 PDF（旋转横排表格页、去重叠文字层），
   逐行解析出每天的五栏内容（日期／节日、圣餐崇拜、早祷、晚祷、礼仪颜色等）。
2. `analysis/enrich.py` — 清洗与结构化：季节、颜色、农历、节气、
   经课分类（旧约／诗篇／书信／福音）、互补式／半连读式分组。
3. `analysis/parse_refs.py` — 把「赛2：1－5」「诗119：153－末」等经文引用
   解析成具体章节范围（4159/4163 条成功解析）。
4. `analysis/convert_bible.py` — 把公有领域《和合本》转成按书卷的 JSON。

## 版权说明

- 经课引用（书名、章节）取自香港圣公会出版的读经表，仅供个人灵修与研习。
- 经文采用公有领域《和合本》（1919）；读经表原文采用《和合本修订版》，
  两者字句略有差异，请以正式出版之修订版为准。
- 崇拜祝文为参考《公祷书》结构改写的版本，正式崇拜请使用教会颁行礼文。
