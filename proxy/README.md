# Edge TTS 代理（晓晓 / 云希）

微软 Edge「大声朗读」接口只接受**带 Edge 标识（Edg/）的 User-Agent**，
普通浏览器（Chrome / Safari / 手机）无法修改该请求头，所以需要一个小代理转发。

网站 `js/edge-tts.js` 支持两种模式：
- 不配置代理 → 直接连接（**仅 Edge 浏览器可用**，因微软接口校验 `Edg/` UA）；
- 填入代理地址 → 所有浏览器（Chrome/Safari/手机等）都可用。

启用代理二选一：
- 改代码：编辑 `js/edge-tts.js` 顶部 `const PROXY_URL = 'https://...'`；
- 不改代码：在页面加载前设置 `window.EDGE_TTS_PROXY = 'https://...'`（例如在浏览器控制台执行后刷新，或通过浏览器扩展注入）。

## 启用代理（3 选 1）

### 方式 A：Vercel（免费，推荐，约 3 分钟）
1. 在 [vercel.com](https://vercel.com) 用 GitHub 登录；
2. 新建项目 → Import 本仓库 → Framework Preset 选 Other；
3. 部署完成后得到网址 `https://xxx.vercel.app`；
4. 在网站 `js/edge-tts.js` 顶部把 `PROXY_URL` 填成：
   `https://xxx.vercel.app/api/edge-tts`
   （本仓库已含 `proxy/api/edge-tts.mjs`，Vercel 会自动识别）

### 方式 B：Render / Railway / Fly 等任意 Node 托管
1. 把本 `proxy/` 目录作为项目，启动命令 `node server.mjs`；
2. 填 `PORT` 环境变量（Render 会自动注入）；
3. 把得到的网址填入 `PROXY_URL`。

### 方式 C：自己电脑临时运行
```bash
cd proxy && node server.mjs
# 代理地址 http://localhost:8787
```

## 接口
```
POST /   （Vercel 是 POST /api/edge-tts）
{ "text": "要朗读的文字", "voice": "zh-CN-XiaoxiaoNeural" | "zh-CN-YunxiNeural" }
→ 200 audio/mpeg
```

已配置 CORS（`Access-Control-Allow-Origin: *`），网站可直接调用。
