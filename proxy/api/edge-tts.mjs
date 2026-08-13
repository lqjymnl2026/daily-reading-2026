/* Vercel Serverless 函数版 Edge TTS 代理
 * 部署到 Vercel：把本 proxy/ 目录作为项目根（或把 api/ 放入现成项目），
 * 用 Vercel 导入 Git 仓库即可自动识别 api/*.mjs。
 * 接口：POST /api/edge-tts  { "text": "...", "voice": "zh-CN-XiaoxiaoNeural" } → audio/mpeg
 */
import { synthesize } from '../lib/edge-tts-core.mjs';

const ALLOWED_VOICES = {
  xiaoxiao: 'zh-CN-XiaoxiaoNeural',
  yunxi: 'zh-CN-YunxiNeural',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).end('use POST'); return; }

  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    const text = String(data.text || '').trim();
    if (!text) { res.status(400).end('text required'); return; }
    let voice = ALLOWED_VOICES[data.voice] || data.voice || ALLOWED_VOICES.xiaoxiao;
    if (!/Neural$/.test(voice)) voice = ALLOWED_VOICES.xiaoxiao;
    const audio = await synthesize(text, voice);
    if (!audio.length) throw new Error('未生成音频');
    res.status(200).setHeader('Content-Type', 'audio/mpeg').setHeader('Cache-Control', 'no-store').send(audio);
  } catch (e) {
    res.status(502).setHeader('Content-Type', 'text/plain; charset=utf-8').send('Edge TTS 代理错误: ' + e.message);
  }
}
