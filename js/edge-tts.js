/* edge-tts.js — 微软 Edge 神经语音（浏览器直连在线 TTS）
 * 协议参考 @edge-tts/universal（AGPL-3.0）：
 *   wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1
 * 支持 晓晓 zh-CN-XiaoxiaoNeural（女）／云希 zh-CN-YunxiNeural（男）等神经语音。
 */
(function (global) {
  'use strict';

  const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
  const CHROMIUM_VERSION = '143.0.3650.75';
  const SEC_MS_GEC_VERSION = '1-' + CHROMIUM_VERSION;
  const WIN_EPOCH = 11644473600; // 1601-01-01 到 1970-01-01 的秒数
  const BASE_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
  const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

  /* 可选：Edge TTS 代理地址（让 Chrome/Safari/手机等所有浏览器都能用神经语音）。
   * 留空 = 仅 Edge 浏览器可直连；填写后优先走代理（部署方式见 proxy/README.md）。
   * 也可以不改代码：在页面加载前设置 window.EDGE_TTS_PROXY = 'https://你的代理/...' 即可覆盖。 */
  const PROXY_URL = '';
  const EFFECTIVE_PROXY = (typeof global.EDGE_TTS_PROXY === 'string' && global.EDGE_TTS_PROXY)
    ? global.EDGE_TTS_PROXY : PROXY_URL;

  const activeSockets = new Set();
  let canceled = false;

  const VOICES = {
    xiaoxiao: 'zh-CN-XiaoxiaoNeural',
    yunxi: 'zh-CN-YunxiNeural',
  };

  function connectId() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  function dateToString() {
    return new Date().toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)');
  }

  function escapeXml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  /* Sec-MS-GEC：微软 Edge「大声朗读」接口要求的时间令牌 */
  async function generateSecMsGec() {
    let ticks = Date.now() / 1000;
    ticks += WIN_EPOCH;
    ticks -= ticks % 300; // 按 300 秒取整
    ticks *= 1e7;         // 100ns 单位
    return sha256Hex(Math.round(ticks).toString() + TRUSTED_CLIENT_TOKEN);
  }

  /* zh-CN-XiaoxiaoNeural → Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural) */
  function toVoiceFull(voice) {
    const m = /^([a-z]{2,})-([A-Za-z0-9]+)-([A-Za-z0-9]+)$/.exec(voice || '');
    if (m && /Neural$/.test(m[3])) {
      return 'Microsoft Server Speech Text to Speech Voice (' + m[1] + '-' + m[2] + ', ' + m[3] + ')';
    }
    return voice;
  }

  function mkssml(voiceFull, text) {
    return "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>"
      + "<voice name='" + voiceFull + "'>"
      + "<prosody pitch='+0Hz' rate='+0%' volume='+0%'>"
      + text
      + '</prosody></voice></speak>';
  }

  function getPath(head) {
    for (const line of head.split('\r\n')) {
      if (line.indexOf('Path:') === 0) return line.slice(5).trim();
    }
    return null;
  }

  /* 按句切分，单次合成不超过 maxChars 字符（远低于接口字节上限） */
  function splitChunks(text, maxChars) {
    const out = [];
    let cur = '';
    for (const ch of String(text || '')) {
      cur += ch;
      if (Array.from(cur).length >= maxChars || /[。！？；!?;]/.test(ch)) {
        out.push(cur);
        cur = '';
      }
    }
    if (cur.trim()) out.push(cur);
    return out.map(s => s.trim()).filter(Boolean);
  }

  function synthesizeChunk(text, voice, opts) {
    opts = opts || {};
    return new Promise((resolve, reject) => {
      let ws = null;
      let settled = false;
      const audioParts = [];
      let total = 0;

      function fail(err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (ws) { try { activeSockets.delete(ws); ws.close(); } catch (e) {} }
        reject(err);
      }

      const timer = setTimeout(() => fail(new Error('Edge TTS 超时')), 30000);

      (async () => {
        const secMsGec = await generateSecMsGec();
        const url = BASE_URL
          + '?TrustedClientToken=' + TRUSTED_CLIENT_TOKEN
          + '&Sec-MS-GEC=' + secMsGec
          + '&Sec-MS-GEC-Version=' + SEC_MS_GEC_VERSION
          + '&ConnectionId=' + connectId();

        ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';
        activeSockets.add(ws);

        ws.onopen = () => {
          ws.send('X-Timestamp:' + dateToString() + '\r\n'
            + 'Content-Type:application/json; charset=utf-8\r\n'
            + 'Path:speech.config\r\n\r\n'
            + '{"context":{"synthesis":{"audio":{"metadataoptions":{'
            + '"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},'
            + '"outputFormat":"' + OUTPUT_FORMAT + '"}}}}');
          ws.send('X-RequestId:' + connectId() + '\r\n'
            + 'Content-Type:application/ssml+xml\r\n'
            + 'X-Timestamp:' + dateToString() + 'Z\r\n'
            + 'Path:ssml\r\n\r\n'
            + mkssml(toVoiceFull(voice), escapeXml(text)));
        };

        ws.onmessage = (ev) => {
          if (typeof ev.data === 'string') {
            const idx = ev.data.indexOf('\r\n\r\n');
            const head = idx >= 0 ? ev.data.slice(0, idx) : ev.data;
            if (getPath(head) === 'turn.end') {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              if (ws) { try { activeSockets.delete(ws); ws.close(); } catch (e) {} }
              if (total > 0) resolve(new Blob(audioParts, { type: 'audio/mpeg' }));
              else reject(new Error('Edge TTS 未返回音频'));
            }
          } else {
            const buf = new Uint8Array(ev.data);
            if (buf.length < 2) return;
            const headerLen = (buf[0] << 8) | buf[1];
            if (headerLen + 2 > buf.length) return;
            const headStr = new TextDecoder().decode(buf.subarray(2, headerLen + 2));
            if (getPath(headStr) !== 'audio') return;
            const data = buf.subarray(headerLen + 2);
            if (data.length) { audioParts.push(data); total += data.length; }
          }
        };

        ws.onerror = () => fail(new Error('Edge TTS 连接失败（网络或令牌）'));
        ws.onclose = () => {
          if (!settled) {
            fail(canceled ? new Error('Edge TTS 已取消') : new Error('Edge TTS 连接关闭'));
          }
        };
      })().catch(fail);
    });
  }

  async function synthesizeViaProxy(text, voice) {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(text || ''), voice: voice || VOICES.xiaoxiao }),
    });
    if (!res.ok) throw new Error('Edge TTS 代理错误 ' + res.status);
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) throw new Error('Edge TTS 代理未返回音频');
    return new Blob([buf], { type: 'audio/mpeg' });
  }

  async function synthesize(text, voice, opts) {
    opts = opts || {};
    if (EFFECTIVE_PROXY) return synthesizeViaProxy(text, voice, opts);
    const chunks = splitChunks(text, opts.maxChars || 900);
    if (!chunks.length) return new Blob([], { type: 'audio/mpeg' });
    const parts = [];
    for (const chunk of chunks) {
      parts.push(await synthesizeChunk(chunk, voice, opts));
    }
    return new Blob(parts, { type: 'audio/mpeg' });
  }

  /* 停止时关闭所有活动连接 */
  function cancel() {
    canceled = true;
    activeSockets.forEach(ws => { try { ws.close(); } catch (e) {} });
    activeSockets.clear();
    setTimeout(() => { canceled = false; }, 0);
  }

  global.EdgeTTS = { synthesize, cancel, VOICES };
})(window);
