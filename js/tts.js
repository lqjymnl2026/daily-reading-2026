/* tts.js — 语音朗读引擎
 * 1) 桌面 / iOS：优先使用浏览器内置 Web Speech API（离线、音质好）。
 * 2) Android：Chrome 的 speechSynthesis 依赖系统 TTS 引擎，经常无声，
 *    因此安卓直接改用「在线语音」（Google TTS 回传 mp3）播放。
 * 3) 其他平台若 Web Speech 在 1.2 秒内未开始，也自动回退在线语音。
 */
(function (global) {
  'use strict';

  let speakingFlag = false;
  let webUtterance = null;
  let remoteAudio = null;      // 单一 Audio 元素（重复使用，避免自动播放限制）
  let remoteQueue = [];
  let remoteIndex = 0;
  let onEndCb = null;
  let webFallbackTimer = null;

  function supportsWeb() { return 'speechSynthesis' in window; }
  function isAndroid() { return /Android/i.test(navigator.userAgent); }

  function pickVoice() {
    if (!supportsWeb()) return null;
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.filter(v => /zh|cmn|Chinese/i.test(v.lang) || /Chinese/i.test(v.name));
    if (!zh.length) return null;
    const pref = zh.find(v => /zh[-_]TW/i.test(v.lang) || /zh[-_]CN/i.test(v.lang) || /Chinese.*(Ting-Ting|Yaoyao|Huihui|Xiaoxiao|Meijia)/i.test(v.name));
    return pref || zh[0];
  }

  function stopInternal() {
    if (webFallbackTimer) { clearTimeout(webFallbackTimer); webFallbackTimer = null; }
    if (supportsWeb()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    if (remoteAudio) { try { remoteAudio.pause(); remoteAudio.onended = null; remoteAudio.onerror = null; } catch (e) {} remoteAudio = null; }
    remoteQueue = [];
    remoteIndex = 0;
    webUtterance = null;
    speakingFlag = false;
  }

  function stop() { stopInternal(); }

  function isSpeaking() { return speakingFlag; }

  function speak(text, opts) {
    opts = opts || {};
    const rate = opts.rate || 0.95;
    const onEnd = opts.onEnd || null;
    stopInternal();
    if (!text) { if (onEnd) onEnd(); return; }
    speakingFlag = true;
    onEndCb = onEnd;

    // Android：直接使用在线语音（Web Speech 不可靠）
    if (!supportsWeb() || isAndroid()) {
      startRemote(text);
      return;
    }

    // 其他平台：先试 Web Speech
    const ok = tryWebSpeech(text, rate);
    if (!ok) { startRemote(text); return; }

    // 若 Web Speech 静默失败（speaking 一直为 false），回退在线语音
    webFallbackTimer = setTimeout(() => {
      const s = window.speechSynthesis;
      if (!s || !s.speaking) {
        stopInternal();
        speakingFlag = true;
        onEndCb = onEnd;
        startRemote(text);
      }
    }, 1200);
  }

  function tryWebSpeech(text, rate) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice();
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'zh-CN';
      u.rate = rate;
      u.pitch = 1;
      u.onend = () => {
        if (webFallbackTimer) { clearTimeout(webFallbackTimer); webFallbackTimer = null; }
        speakingFlag = false;
        if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); }
      };
      u.onerror = (ev) => {
        if (ev && ev.error === 'interrupted') return;
        if (webFallbackTimer) { clearTimeout(webFallbackTimer); webFallbackTimer = null; }
        speakingFlag = false;
        if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); }
      };
      webUtterance = u;
      window.speechSynthesis.speak(u);
      try { window.speechSynthesis.resume(); } catch (e) {}
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- 在线语音（Google TTS → mp3） ---------- */

  function remoteUrl(chunk) {
    return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=' + encodeURIComponent(chunk);
  }

  function chunkText(text, max) {
    const out = [];
    let cur = '';
    for (const ch of text) {
      cur += ch;
      if (Array.from(cur).length >= max || /[。！？；!?;]/.test(ch)) {
        out.push(cur);
        cur = '';
      }
    }
    if (cur.trim()) out.push(cur);
    return out;
  }

  function startRemote(text) {
    remoteQueue = chunkText(text, 180);
    remoteIndex = 0;
    playNextRemote();
  }

  function playNextRemote() {
    if (remoteIndex >= remoteQueue.length) {
      speakingFlag = false;
      if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); }
      return;
    }
    const chunk = remoteQueue[remoteIndex++];
    if (!remoteAudio) {
      remoteAudio = new Audio();
    }
    remoteAudio.src = remoteUrl(chunk);
    remoteAudio.onended = () => { playNextRemote(); };
    remoteAudio.onerror = () => {
      // 网络错误：跳过此段或结束
      if (remoteIndex < remoteQueue.length) playNextRemote();
      else { speakingFlag = false; if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); } }
    };
    remoteAudio.play().catch(() => {
      // 自动播放被拒（少见，因由点击触发）
      remoteAudio = null;
      speakingFlag = false;
      if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); }
    });
  }

  // 预热语音清单
  if (supportsWeb()) {
    try {
      window.speechSynthesis.onvoiceschanged = () => {};
      window.speechSynthesis.getVoices();
    } catch (e) {}
  }

  global.TTS = { speak, stop, isSpeaking, pickVoice, supportsWeb, isAndroid };
})(window);
