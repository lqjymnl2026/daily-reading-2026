/* Edge TTS 核心：直连微软「大声朗读」WebSocket，带 Edge UA，返回 MP3 音频。
 * 无第三方依赖（Node 内置 tls / crypto）。协议已验证。 */
import tls from 'node:tls';
import crypto from 'node:crypto';

const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const HOST = 'speech.platform.bing.com';
const PATH = '/consumer/speech/synthesize/readaloud/edge/v1';
const UA_EDGE = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0';
const OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3';

function secGec() {
  let t = Date.now() / 1000;
  t += 11644473600; // 1601-01-01 → 1970-01-01 秒数
  t -= t % 300;
  t *= 1e7;
  return crypto.createHash('sha256').update(Math.round(t).toString() + TOKEN).digest('hex').toUpperCase();
}
function connId() { return crypto.randomBytes(16).toString('hex'); }
function dateStr() { return new Date().toUTCString().replace('GMT', 'GMT+0000 (Coordinated Universal Time)'); }
function voiceFull(voice) {
  const m = /^([a-z]{2,})-([A-Za-z0-9]+)-([A-Za-z0-9]+)$/.exec(voice || '');
  if (m && /Neural$/.test(m[3])) return `Microsoft Server Speech Text to Speech Voice (${m[1]}-${m[2]}, ${m[3]})`;
  return voice;
}
function escapeXml(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function mkssml(voice, text) {
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>`
    + `<voice name='${voiceFull(voice)}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`;
}

function frame(opcode, payload) {
  const p = Buffer.from(payload, 'utf8');
  const mask = crypto.randomBytes(4);
  const masked = Buffer.alloc(p.length);
  for (let i = 0; i < p.length; i++) masked[i] = p[i] ^ mask[i % 4];
  let head;
  if (p.length < 126) head = Buffer.from([0x80 | opcode, 0x80 | p.length]);
  else head = Buffer.from([0x80 | opcode, 0x80 | 126, (p.length >> 8) & 0xff, p.length & 0xff]);
  return Buffer.concat([head, mask, masked]);
}

function parseFrames(buf) {
  const out = [];
  let off = 0;
  while (off + 2 <= buf.length) {
    const b0 = buf[off], b1 = buf[off + 1];
    const opcode = b0 & 0x0f;
    let len = b1 & 0x7f, hdr = 2;
    if (len === 126) { len = buf.readUInt16BE(off + 2); hdr = 4; }
    else if (len === 127) { len = Number(buf.readBigUInt64BE(off + 2)); hdr = 10; }
    const masked = (b1 & 0x80) !== 0;
    const maskOff = off + hdr;
    const payloadOff = maskOff + (masked ? 4 : 0);
    if (payloadOff + len > buf.length) break;
    let payload = buf.subarray(payloadOff, payloadOff + len);
    if (masked) {
      const mask = buf.subarray(maskOff, maskOff + 4);
      const u = Buffer.from(payload);
      for (let i = 0; i < len; i++) u[i] ^= mask[i % 4];
      payload = u;
    }
    out.push({ opcode, payload });
    off = payloadOff + len;
  }
  return { frames: out, consumed: off };
}

function synthesizeOnce(text, voice) {
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const url = `${PATH}?TrustedClientToken=${TOKEN}&Sec-MS-GEC=${secGec()}&Sec-MS-GEC-Version=1-143.0.3650.75&ConnectionId=${connId()}`;
    const sock = tls.connect({ host: HOST, port: 443, servername: HOST }, () => {
      sock.write(`GET ${url} HTTP/1.1\r\nHost: ${HOST}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\nUser-Agent: ${UA_EDGE}\r\n\r\n`);
    });
    let handshake = true;
    let buf = Buffer.alloc(0);
    const audio = [];
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; reject(new Error('Edge TTS 超时')); sock.destroy(); } }, 30000);

    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      if (handshake) {
        const idx = buf.indexOf('\r\n\r\n');
        if (idx < 0) return;
        const head = buf.slice(0, idx).toString();
        if (!head.includes('101')) { done = true; clearTimeout(timer); reject(new Error('Edge TTS 握手失败: ' + (head.split('\r\n')[0] || ''))); sock.destroy(); return; }
        buf = buf.slice(idx + 4);
        handshake = false;
        const cfg = 'X-Timestamp:' + dateStr() + '\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"' + OUTPUT_FORMAT + '"}}}}';
        const ssml = mkssml(voice, text);
        const ssmlMsg = 'X-RequestId:' + connId() + '\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:' + dateStr() + 'Z\r\nPath:ssml\r\n\r\n' + ssml;
        sock.write(frame(1, cfg));
        sock.write(frame(1, ssmlMsg));
      }
      const parsed = parseFrames(buf);
      for (const f of parsed.frames) {
        if (f.opcode === 1) {
          const txt = f.payload.toString('utf8');
          if (txt.includes('Path:turn.end')) {
            done = true; clearTimeout(timer);
            if (audio.length) resolve(Buffer.concat(audio));
            else reject(new Error('Edge TTS 未返回音频'));
            sock.destroy();
            return;
          }
        } else if (f.opcode === 2) {
          const p = f.payload;
          if (p.length < 2) continue;
          const headerLen = p.readUInt16BE(0);
          if (headerLen + 2 > p.length) continue;
          const head = p.subarray(2, headerLen + 2).toString();
          if (!head.includes('Path:audio')) continue;
          const data = p.subarray(headerLen + 2);
          if (data.length) audio.push(Buffer.from(data));
        }
      }
      buf = buf.slice(parsed.consumed);
    });
    sock.on('error', (e) => { if (!done) { done = true; clearTimeout(timer); reject(new Error('Edge TTS 连接错误: ' + e.message)); } });
  });
}

function splitChunks(text, maxChars) {
  const out = [];
  let cur = '';
  for (const ch of String(text || '')) {
    cur += ch;
    if (Array.from(cur).length >= maxChars || /[。！？；!?;]/.test(ch)) { out.push(cur); cur = ''; }
  }
  if (cur.trim()) out.push(cur);
  return out.map(s => s.trim()).filter(Boolean);
}

export async function synthesize(text, voice, opts) {
  const chunks = splitChunks(text, (opts && opts.maxChars) || 900);
  if (!chunks.length) return Buffer.alloc(0);
  const parts = [];
  for (const chunk of chunks) parts.push(await synthesizeOnce(chunk, voice));
  return Buffer.concat(parts);
}
