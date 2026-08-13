/* tts.js — 语音朗读引擎
 * 1) 本地通道：Web Speech API（Microsoft Edge 内置晓晓/云希神经语音优先；其他浏览器用内置中文语音）
 * 2) 安卓 / 回退：在线语音（Google TTS mp3）
 * 3) 可选「晓晓 / 云希」：优先本地 Edge 神经语音，否则尝试 Edge 在线神经语音（edgetts.js），
 *    再失败则回退默认中文语音。
 */
(function (global) {
  'use strict';

  const EDGE_NEURAL = [
    { key: 'xiaoxiao', voice: 'zh-CN-XiaoxiaoNeural', label: '晓晓' },
    { key: 'yunxi', voice: 'zh-CN-YunxiNeural', label: '云希' },
  ];

  let speakingFlag = false;
  let webUtterance = null;
  let remoteAudio = null;      // 单 Audio 元素（复用，避免自动播放限制）
  let remoteQueue = [];
  let remoteIndex = 0;
  let onEndCb = null;
  let webFallbackTimer = null;
  let edgeWs = null;

  function supportsWeb() { return 'speechSynthesis' in window; }
  function isAndroid() { return /Android/i.test(navigator.userAgent); }
  function preferredVoiceKey() {
    try { const v = localStorage.getItem('tts-voice'); return (v === 'xiaoxiao' || v === 'yunxi') ? v : 'auto'; } catch (e) { return 'auto'; }
  }

  function getZhVoices() {
    if (!supportsWeb()) return [];
    const vs = window.speechSynthesis.getVoices();
    return vs.filter(v => /zh|cmn|Chinese/i.test(v.lang) || /Chinese/i.test(v.name));
  }

  function findEdgeVoice(key) {
    const vs = getZhVoices();
    if (!vs.length) return null;
    const target = EDGE_NEURAL.find(e => e.key === key);
    if (!target) return null;
    // Edge 内置神经语音名形如 "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)"
    const shortName = target.voice.replace(/Neural$/, '').split('-')[2] || target.label; // Xiaoxiao / Yunxi
    return vs.find(v => new RegExp(shortName, 'i').test(v.name))
        || vs.find(v => new RegExp(target.label, 'i').test(v.name))
        || null;
  }

  function pickVoice(pref) {
    const vs = getZhVoices();
    if (!vs.length) return null;
    if (pref === 'xiaoxiao' || pref === 'yunxi') {
      const edge = findEdgeVoice(pref);
      if (edge) return edge;
    }
    const natural = vs.find(v => /xiaoxiao|yunxi|xiaoyi|yunjian|natural|online/i.test(v.name));
    if (natural) return natural;
    const zhcn = vs.find(v => /zh[-_]CN/i.test(v.lang));
    if (zhcn) return zhcn;
    const zhtw = vs.find(v => /zh[-_]TW/i.test(v.lang));
    return zhtw || vs[0];
  }

  function stopInternal() {
    if (webFallbackTimer) { clearTimeout(webFallbackTimer); webFallbackTimer = null; }
    if (supportsWeb()) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    if (remoteAudio) { try { remoteAudio.pause(); remoteAudio.onended = null; remoteAudio.onerror = null; } catch (e) {} remoteAudio = null; }
    remoteQueue = []; remoteIndex = 0;
    webUtterance = null;
    if (edgeWs) { try { edgeWs.close(); } catch (e) {} edgeWs = null; }
    speakingFlag = false;
  }

  function stop() { stopInternal(); }
  function isSpeaking() { return speakingFlag; }

  function speak(text, opts) {
    opts = opts || {};
    const rate = opts.rate || 0.95;
    const onEnd = opts.onEnd || null;
    const voice = opts.voice || preferredVoiceKey();
    stopInternal();
    if (!text) { if (onEnd) onEnd(); return; }
    speakingFlag = true;
    onEndCb = onEnd;

    // 在线语音（安卓）或用户选了 Edge 在线神经语音
    const needOnline = !supportsWeb() || isAndroid();

    if (voice === 'xiaoxiao' || voice === 'yunxi') {
      const local = findEdgeVoice(voice);
      if (local) { // Edge 内置神经语音（最佳，离线）
        if (tryWebSpeech(text, rate, local)) return;
      }
      // 尝试 Edge 在线神经语音
      if (global.EdgeTTS && global.EdgeTTS.synthesize) {
        const ok = tryEdgeOnline(voice, text, rate);
        if (ok) return;
      }
      // 回退：普通 Web Speech / 在线
      if (needOnline) { startRemote(text); return; }
      if (tryWebSpeech(text, rate, pickVoice(voice))) return;
      startRemote(text);
      return;
    }

    // 默认/自动
    if (needOnline) { startRemote(text); return; }
    const ok = tryWebSpeech(text, rate, pickVoice('auto'));
    if (!ok) { startRemote(text); return; }
    webFallbackTimer = setTimeout(() => {
      const s = window.speechSynthesis;
      if (!s || !s.speaking) {
        stopInternal();
        speakingFlag = true; onEndCb = onEnd;
        startRemote(text);
      }
    }, 1200);
  }

  function tryWebSpeech(text, rate, voice) {
    try {
      const u = new SpeechSynthesisUtterance(text);
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

  /* ---------- Edge 在线神经语音（edgetts.js） ---------- */
  function tryEdgeOnline(voiceKey, text, rate) {
    const target = EDGE_NEURAL.find(e => e.key === voiceKey);
    if (!target) return false;
    let handled = false;
    const finish = (ok) => {
      if (handled) return; handled = true;
      if (ok) { speakingFlag = false; if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); } }
      else {
        // 回退默认
        stopInternal();
        speakingFlag = true; onEndCb = onEndCb;
        if (!supportsWeb() || isAndroid()) { startRemote(text); return; }
        if (!tryWebSpeech(text, rate, pickVoice('auto'))) startRemote(text);
      }
    };
    edgeWs = global.EdgeTTS.synthesize({
      voice: target.voice,
      text: text,
      rate: rate,
      onStart: () => {},
      onEnd: () => finish(true),
      onError: () => finish(false),
    });
    return edgeWs !== null;
  }

  /* ---------- 在线语音（Google TTS → mp3） ---------- */
  function remoteUrl(chunk) {
    return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=zh-CN&q=' + encodeURIComponent(chunk);
  }
  function chunkText(text, max) {
    const out = []; let cur = '';
    for (const ch of text) {
      cur += ch;
      if (Array.from(cur).length >= max || /[。！？；!?;]/.test(ch)) { out.push(cur); cur = ''; }
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
    if (!remoteAudio) remoteAudio = new Audio();
    remoteAudio.src = remoteUrl(chunk);
    remoteAudio.onended = () => { playNextRemote(); };
    remoteAudio.onerror = () => {
      if (remoteIndex < remoteQueue.length) playNextRemote();
      else { speakingFlag = false; if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); } }
    };
    remoteAudio.play().catch(() => {
      remoteAudio = null; speakingFlag = false;
      if (onEndCb) { const cb = onEndCb; onEndCb = null; cb(); }
    });
  }

  // 预暖语音列表
  if (supportsWeb()) {
    try { window.speechSynthesis.onvoiceschanged = () => {}; window.speechSynthesis.getVoices(); } catch (e) {}
  }

  global.TTS = { speak, stop, isSpeaking, pickVoice, supportsWeb, isAndroid, getZhVoices, findEdgeVoice, preferredVoiceKey, EDGE_NEURAL };
})(window);
