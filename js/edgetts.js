/* edgetts.js — Microsoft Edge 在线神经语音（晓晓 / 云希）
 * 通过微软 Read Aloud 接口合成 mp3 并播放。非官方接口，可能因网络/区域不可用；
 * 失败时由 tts.js 自动回退到其他语音。
 */
(function (global) {
  'use strict';

  const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

  function b64FromBytes(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  async function secMsGec() {
    try {
      const unixTicks = Math.floor(Date.now() / 1000) * 10000000 + 116444736000000000;
      const data = new TextEncoder().encode(TRUSTED_CLIENT_TOKEN + unixTicks + 'X' + TRUSTED_CLIENT_TOKEN);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return b64FromBytes(new Uint8Array(hash));
    } catch (e) {
      return null;
    }
  }

  function buildMessage(path, contentType, payload) {
    const head = 'X-Timestamp:' + new Date().toUTCString() + '\r\nContent-Type:' + contentType + '\r\nPath:' + path + '\r\n\r\n';
    return head + payload;
  }

  function splitSentences(text, max) {
    const out = [];
    let cur = '';
    for (const ch of text) {
      cur += ch;
      if (Array.from(cur).length >= max || /[。！？；!?;]/.test(ch)) { out.push(cur); cur = ''; }
    }
    if (cur.trim()) out.push(cur);
    return out;
  }

  /**
   * 合成并播放。opts: { voice, text, rate, onStart, onEnd, onError }
   * 返回可取消的句柄（或 null 表示立即失败）。
   */
  async function synthesize(opts) {
    const voice = opts.voice || 'zh-CN-XiaoxiaoNeural';
    const text = opts.text || '';
    const rate = opts.rate || 1;
    if (!text) { if (opts.onError) opts.onError(); return null; }

    let ws = null;
    let cancelled = false;
    let audioParts = [];
    let finished = false;

    const handle = {
      close() { cancelled = true; try { if (ws) ws.close(); } catch (e) {} },
    };

    try {
      const sec = await secMsGec();
      const qs = 'TrustedClientToken=' + TRUSTED_CLIENT_TOKEN +
        '&ConnectionId=' + (crypto.randomUUID ? crypto.randomUUID() : (Math.random().toString(16).slice(2) + Date.now())) +
        (sec ? '&Sec-MS-GEC=' + encodeURIComponent(sec) + '&Sec-MS-GEC-Version=1-130.0.2849.68' : '');
      const url = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?' + qs;
      ws = new WebSocket(url);
    } catch (e) {
      if (opts.onError) opts.onError();
      return null;
    }

    const timeout = setTimeout(() => { // 15 秒超时
      if (!finished) { finished = true; try { ws.close(); } catch (e) {} if (opts.onError) opts.onError(); }
    }, 15000);

    ws.onopen = () => {
      try {
        ws.send(buildMessage('speech.config', 'application/json; charset=utf-8', JSON.stringify({
          context: { synthesis: { audio: { metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'true' }, outputFormat: 'audio-24khz-48kbitrate-mono-mp3' } } },
        })));
        // 长文本分段合成
        const chunks = splitSentences(text, 200);
        let ci = 0;
        const sendNext = () => {
          if (cancelled || finished) return;
          if (ci >= chunks.length) return;
          const piece = chunks[ci++];
          const rateStr = Math.max(-50, Math.min(50, Math.round((rate - 1) * 100))) + '%';
          const ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>" +
            "<voice name='" + voice + "'><prosody pitch='+0Hz' rate='" + rateStr + "' volume='+0%'>" +
            piece.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') +
            "</prosody></voice></speak>";
          ws.send(buildMessage('ssml', 'application/ssml+xml', ssml));
        };
        sendNext();
        if (opts.onStart) opts.onStart();
      } catch (e) {
        if (!finished) { finished = true; clearTimeout(timeout); try { ws.close(); } catch (e2) {} if (opts.onError) opts.onError(); }
      }
    };

    ws.onmessage = (ev) => {
      if (cancelled) return;
      if (typeof ev.data === 'string') return;
      const buf = ev.data;
      const head = new TextDecoder().decode(buf.slice(0, 60));
      if (head.startsWith('Path:audio')) {
        const sep = new TextEncoder().encode('\r\n\r\n');
        const idx = buf.indexOf(sep);
        if (idx >= 0) audioParts.push(buf.slice(idx + 4));
      } else if (head.includes('turn.end')) {
        clearTimeout(timeout);
        try { ws.close(); } catch (e) {}
        if (finished) return;
        finished = true;
        const blob = new Blob(audioParts, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); if (opts.onEnd) opts.onEnd(); };
        audio.onerror = () => { URL.revokeObjectURL(url); if (opts.onError) opts.onError(); };
        audio.play().catch(() => { if (opts.onError) opts.onError(); });
      }
    };

    ws.onerror = () => {
      if (!finished) { finished = true; clearTimeout(timeout); if (opts.onError) opts.onError(); }
    };
    ws.onclose = () => {};

    return handle;
  }

  global.EdgeTTS = { synthesize };
})(window);
