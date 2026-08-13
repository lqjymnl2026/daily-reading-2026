/* Edge TTS 代理 HTTP 服务（零依赖）
 * 启动：node server.mjs  （默认端口 8787）
 * 接口：POST /  { "text": "要朗读的文字", "voice": "zh-CN-XiaoxiaoNeural" }
 * 返回：audio/mpeg（mp3）
 * 用途：让 Chrome / Safari / 手机等所有浏览器都能用上 Edge 神经语音（晓晓/云希）。
 */
import http from 'node:http';
import { synthesize } from './lib/edge-tts-core.mjs';

const PORT = process.env.PORT || 8787;
const ALLOWED_VOICES = {
  xiaoxiao: 'zh-CN-XiaoxiaoNeural',
  yunxi: 'zh-CN-YunxiNeural',
};

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST') { res.writeHead(405, { 'Content-Type': 'text/plain' }); res.end('use POST'); return; }

  let body = '';
  req.on('data', c => { if (body.length < 1e6) body += c; });
  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      const text = String(data.text || '').trim();
      if (!text) { res.writeHead(400, { 'Content-Type': 'text/plain' }); res.end('text required'); return; }
      let voice = ALLOWED_VOICES[data.voice] || data.voice || ALLOWED_VOICES.xiaoxiao;
      if (!/Neural$/.test(voice)) voice = ALLOWED_VOICES.xiaoxiao;
      const audio = await synthesize(text, voice);
      if (!audio.length) throw new Error('未生成音频');
      res.writeHead(200, { 'Content-Type': 'audio/mpeg', 'Content-Length': audio.length, 'Cache-Control': 'no-store' });
      res.end(audio);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Edge TTS 代理错误: ' + e.message);
    }
  });
});

server.listen(PORT, () => console.log('Edge TTS proxy listening on http://localhost:' + PORT));
