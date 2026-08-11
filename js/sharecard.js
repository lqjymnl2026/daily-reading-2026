/* sharecard.js — 每日读经分享卡生成（手机屏幕尺寸 1080×1920，每天随经课变化） */
(function (global) {
  'use strict';
  const C = global.Common;
  const I18N = global.I18N;
  const QR_PATH = 'assets/qr.png';
  const FONT = '"Noto Serif SC","Source Han Serif SC","PingFang SC","Microsoft YaHei","SimSun",sans-serif';

  const TAG_LABEL = { ot: I18N.t('r_ot'), psalm: I18N.t('r_psalm'), epistle: I18N.t('r_epistle'), gospel: I18N.t('r_gospel') };
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
    ctx.fillText(I18N.t('cardBrand'), W / 2, 130);

    ctx.font = '30px ' + FONT;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.fillText((I18N.tData(day.season || '')) + (day.color ? '  ·  ' + I18N.t('cardColor') + ' ' + I18N.tColor(day.color) : ''), W / 2, 195);

    ctx.font = 'bold 62px ' + FONT;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(C.formatCN(day.date) + ' · ' + C.weekdayCN(day.date), W / 2, 305);

    const feast = I18N.tData(day.feast) || (day.weekday === '主日' ? I18N.t('wd_主日') : '');
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

    // ---------- 白框内容：上下左右居中 ----------
    const innerX = cardX + 80;
    const innerW = cardW - 160;
    const labelW = 220;          // 类别标签宽度
    const labelGap = 26;         // 标签与经文的间距
    const refW = innerW - labelW - labelGap;

    // 计算每行经课（标签 + 经文）
    const readingItems = ORDER.filter(k => opt[k]).map(k => {
      const refStr = I18N.tData(firstOf(opt[k]));
      ctx.font = '32px ' + FONT;
      const lines = wrapText(ctx, refStr, refW, 2);
      return { k, refStr, lines };
    });

    // 今日金句：每行 12 字、左对齐、框高自适应
    const kvObj = (commentary && commentary.keyVerse) ? commentary.keyVerse : null;
    let kvLines = [];
    let kvBoxH = 0;
    if (kvObj) {
      const chars = Array.from(kvObj.text || '');
      for (let i = 0; i < chars.length; i += 12) kvLines.push(chars.slice(i, i + 12).join(''));
      if (kvLines.length > 5) kvLines = kvLines.slice(0, 5);
      if (kvLines.length) kvLines[0] = '「' + kvLines[0];
      if (kvLines.length) kvLines[kvLines.length - 1] = kvLines[kvLines.length - 1] + '」';
      kvBoxH = 96 + kvLines.length * 44;
    }

    // 内容总高度（用于垂直居中）
    let contentH = 0;
    contentH += 56;              // 今日经课标题
    contentH += 44;              // 分隔线
    for (const it of readingItems) {
      contentH += Math.max(it.lines.length, 1) * 44 + 32;
    }
    if (kvLines.length) contentH += 28 + kvBoxH;

    let y = cardY + Math.max(36, (cardH - contentH) / 2) + 6;

    // 今日经课标题（居中）
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8883e';
    ctx.font = 'bold 38px ' + FONT;
    ctx.fillText(I18N.t('cardSection'), W / 2, y + 36);
    y += 56;
    ctx.strokeStyle = '#e2d6c3';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 180, y + 6); ctx.lineTo(W / 2 + 180, y + 6); ctx.stroke();
    y += 44;

    // 经课行：标签 + 经文 同行，整块水平居中
    const rowStartX = W / 2 - innerW / 2;
    for (const it of readingItems) {
      const lines = it.lines;
      // 标签（左对齐，颜色加粗）
      ctx.textAlign = 'left';
      ctx.fillStyle = TAG_COLOR[it.k];
      ctx.font = 'bold 30px ' + FONT;
      ctx.fillText(TAG_LABEL[it.k], rowStartX + 24, y + 32);
      // 经文（左对齐，深色）
      ctx.fillStyle = '#2c2420';
      ctx.font = '32px ' + FONT;
      lines.forEach((ln, i) => ctx.fillText(ln, rowStartX + labelW + labelGap, y + 32 + i * 44));
      y += Math.max(lines.length, 1) * 44 + 32;
    }

    // 绘制今日金句框
    if (kvObj) {
      y += 28;
      const boxX = rowStartX, boxW = innerW, boxH = kvBoxH;
      ctx.fillStyle = lighten(main, 0.82);
      roundRect(ctx, boxX, y - 22, boxW, boxH, 18);
      ctx.fill();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#a8883e';
      ctx.font = 'bold 28px ' + FONT;
      ctx.fillText(I18N.t('cardKeyVerse'), boxX + 24, y + 22);
      ctx.fillStyle = '#3a332c';
      ctx.font = '30px ' + FONT;
      kvLines.forEach((ln, i) => ctx.fillText(ln, boxX + 24, y + 58 + i * 44));
      ctx.fillStyle = '#5c5148';
      ctx.font = '26px ' + FONT;
      ctx.textAlign = 'right';
      ctx.fillText('—— ' + kvObj.ref, boxX + boxW - 24, y + boxH - 44);
      y += boxH + 28;
    }

    // ---------- 二维码（无链接文字） ----------
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
    const qrSize = 240;
    ctx.drawImage(qr, W / 2 - qrSize / 2, qrY + 30, qrSize, qrSize);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2c2420';
    ctx.font = 'bold 30px ' + FONT;
    ctx.fillText(I18N.t('cardScan'), W / 2, qrY + 308);

    // ---------- 页脚 ----------
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '24px ' + FONT;
    ctx.fillText(I18N.t('cardFooter'), W / 2, H - 26);

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
    const h3 = modal.querySelector('h3');
    if (h3) h3.textContent = I18N.t('shareTitle');
    if (saveBtn) saveBtn.textContent = I18N.t('shareSave');
    if (shareBtn) shareBtn.textContent = I18N.t('shareShare');
    const closeBtn = document.getElementById('share-close');
    if (closeBtn) closeBtn.textContent = I18N.t('shareClose');
    const lp = document.getElementById('share-longpress');
    if (lp) lp.textContent = I18N.t('shareLongpress');
    modal.classList.remove('hidden');
    if (status) status.textContent = I18N.t('shareGenerating');
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
      if (status) status.textContent = I18N.t('shareDone');
    } catch (e) {
      if (status) status.textContent = I18N.tData('生成失败：') + e.message;
    }
  }

  function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) modal.classList.add('hidden');
  }

  global.ShareCard = { generateCard, openShareModal, closeShareModal, saveCanvas };
})(window);
