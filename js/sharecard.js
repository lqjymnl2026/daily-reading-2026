/* sharecard.js — 每日读经分享卡生成（手机屏幕尺寸 1080×1920，每天随经课变化） */
(function (global) {
  'use strict';
  const C = global.Common;
  const QR_PATH = 'assets/qr.png';
  const FONT = '"Noto Serif SC","Source Han Serif SC","PingFang SC","Microsoft YaHei","SimSun",sans-serif';

  const TAG_LABEL = { ot: '旧约经课', psalm: '诗篇', epistle: '书信经课', gospel: '福音经课' };
  const TAG_COLOR = { ot: '#8a6a14', psalm: '#2e7d4f', epistle: '#5b3a8e', gospel: '#b3413d' };
  const ORDER = ['ot', 'psalm', 'epistle', 'gospel'];

  function wrapText(ctx, text, maxWidth, maxLines) {
    const chars = Array.from(text);
    let line = '';
    const lines = [];
    for (const ch of chars) {
      if (line && ctx.measureText(line + ch).width > maxWidth) {
        lines.push(line);
        line = ch;
        if (lines.length >= maxLines) break;
      } else {
        line += ch;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });
  }

  function firstOf(v) { return Array.isArray(v) ? v[0] : v; }

  function lighten(hex, t) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * t);
    const g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * t);
    const b = Math.round((n & 255) + (255 - (n & 255)) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  async function generateCard(day, commentary) {
    const W = 1080, H = 1920;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    const main = C.colorHex(day.color);
    const soft = C.colorHexSoft(day.color);
    const opt = day.communion.options[0] || {};
    const qr = await loadImage(QR_PATH);

    // 背景渐变（随当天礼仪颜色变化）
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, main);
    g.addColorStop(0.35, soft);
    g.addColorStop(0.8, lighten(main, 0.72));
    g.addColorStop(1, '#f6efdf');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 装饰圆
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.beginPath(); ctx.arc(W - 90, 130, 280, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-70, H - 180, 320, 0, Math.PI * 2); ctx.fill();

    // ---------- 顶部（居中） ----------
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.font = '34px ' + FONT;
    ctx.fillText('每 日 读 经 · 香 港 圣 公 会 读 经 表', W / 2, 130);

    ctx.font = '30px ' + FONT;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.fillText((day.season || '') + (day.color ? '  ·  礼仪颜色 ' + day.color : ''), W / 2, 195);

    ctx.font = 'bold 62px ' + FONT;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(C.formatCN(day.date) + ' · ' + C.weekdayCN(day.date), W / 2, 305);

    const feast = day.feast || (day.weekday === '主日' ? '主日' : '平日');
    ctx.font = '40px ' + FONT;
    const feastLines = wrapText(ctx, feast, W - 220, 2);
    feastLines.forEach((ln, i) => ctx.fillText(ln, W / 2, 388 + i * 54));

    // ---------- 白色内容卡 ----------
    const cardX = 70, cardY = 480, cardW = W - 140, cardH = 1000;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.18)';
    ctx.shadowBlur = 28;
    ctx.fillStyle = '#fffdf8';
    roundRect(ctx, cardX, cardY, cardW, cardH, 26);
    ctx.fill();
    ctx.restore();
    // 礼仪颜色描边
    ctx.save();
    ctx.strokeStyle = main;
    ctx.lineWidth = 7;
    roundRect(ctx, cardX, cardY, cardW, cardH, 26);
    ctx.stroke();
    ctx.restore();

    // 今日经课标题（居中）
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8883e';
    ctx.font = 'bold 38px ' + FONT;
    ctx.fillText('今 日 经 课', W / 2, cardY + 76);
    ctx.strokeStyle = '#e2d6c3';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cardX + 60, cardY + 104); ctx.lineTo(cardX + cardW - 60, cardY + 104); ctx.stroke();

    // ---------- 四段经课 ----------
    let y = cardY + 152;
    for (const k of ORDER) {
      const ref = opt[k];
      if (!ref) continue;
      const refStr = firstOf(ref);
      const tag = TAG_LABEL[k];
      const tagC = TAG_COLOR[k];

      // 标签（居中于色块）
      ctx.fillStyle = tagC;
      roundRect(ctx, cardX + 40, y - 34, 172, 60, 12);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = '26px ' + FONT;
      ctx.fillText(tag, cardX + 40 + 86, y + 2);

      // 经文引用（左对齐）
      ctx.textAlign = 'left';
      ctx.fillStyle = '#2c2420';
      ctx.font = '36px ' + FONT;
      const refLines = wrapText(ctx, refStr, cardW - 300, 2);
      refLines.forEach((ln, i) => ctx.fillText(ln, cardX + 260, y + i * 48));
      y += Math.max(refLines.length, 1) * 52 + 30;
    }

    // ---------- 今日金句 ----------
    if (commentary && commentary.keyVerse) {
      y += 16;
      const boxH = 236;
      ctx.fillStyle = lighten(main, 0.82);
      roundRect(ctx, cardX + 40, y - 24, cardW - 80, boxH, 18);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a8883e';
      ctx.font = 'bold 28px ' + FONT;
      ctx.fillText('今日金句', cardX + 64, y + 22);
      ctx.fillStyle = '#3a332c';
      ctx.font = 'italic 30px ' + FONT;
      const kv = '「' + (commentary.keyVerse.text || '') + '」';
      const kvLines = wrapText(ctx, kv, cardW - 150, 3);
      kvLines.forEach((ln, i) => ctx.fillText(ln, cardX + 64, y + 68 + i * 42));
      ctx.fillStyle = '#5c5148';
      ctx.font = '26px ' + FONT;
      ctx.textAlign = 'right';
      ctx.fillText('—— ' + commentary.keyVerse.ref, cardX + cardW - 64, y + boxH - 18);
      y += boxH + 26;
    }

    // ---------- 二维码 ----------
    const qrY = H - 420;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.15)';
    ctx.shadowBlur = 22;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, W / 2 - 210, qrY, 420, 370, 22);
    ctx.fill();
    ctx.restore();
    // 顶部色条（礼仪颜色）
    ctx.save();
    roundRect(ctx, W / 2 - 210, qrY, 420, 16, 10);
    ctx.clip();
    ctx.fillStyle = main;
    ctx.fillRect(W / 2 - 210, qrY, 420, 16);
    ctx.restore();
    roundRect(ctx, W / 2 - 210, qrY + 8, 420, 8, 0);
    ctx.fillStyle = main;
    ctx.fill();
    const qrSize = 240;
    ctx.drawImage(qr, W / 2 - qrSize / 2, qrY + 28, qrSize, qrSize);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2c2420';
    ctx.font = 'bold 30px ' + FONT;
    ctx.fillText('扫码阅读今日读经', W / 2, qrY + 302);
    ctx.fillStyle = '#5c5148';
    ctx.font = '24px ' + FONT;
    ctx.fillText('lqjymnl2026.github.io/daily-reading-2026', W / 2, qrY + 340);

    // ---------- 页脚 ----------
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '24px ' + FONT;
    ctx.fillText('每日读经 2025–2026 · 经文采用和合本', W / 2, H - 26);

    return canvas;
  }

  function saveCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, 'image/png');
  }

  async function openShareModal(day) {
    const modal = document.getElementById('share-modal');
    const img = document.getElementById('share-card-img');
    const saveBtn = document.getElementById('share-save');
    const shareBtn = document.getElementById('share-share');
    const status = document.getElementById('share-status');
    if (!modal) return;
    modal.classList.remove('hidden');
    if (status) status.textContent = '正在生成分享卡…';
    try {
      const commentary = await global.Commentary.generate(day);
      const canvas = await generateCard(day, commentary);
      const dataUrl = canvas.toDataURL('image/png');
      img.src = dataUrl;
      const filename = '每日读经-' + day.date + '.png';
      saveBtn.onclick = () => saveCanvas(canvas, filename);
      shareBtn.onclick = async () => {
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: '每日读经 ' + day.date }); } catch (e) {}
        } else {
          saveCanvas(canvas, filename);
        }
      };
      if (status) status.textContent = '生成完成，点击保存或长按图片保存。';
    } catch (e) {
      if (status) status.textContent = '生成失败：' + e.message;
    }
  }

  function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.add('hidden');
  }

  global.ShareCard = { generateCard, openShareModal, closeShareModal, saveCanvas };
})(window);
