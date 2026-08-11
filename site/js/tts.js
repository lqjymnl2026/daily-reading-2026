/* tts.js — Web Speech API wrapper for 中文语音朗读 */
(function (global) {
  'use strict';

  let currentUtterance = null;

  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.filter(v => /zh|cmn|Chinese/i.test(v.lang) || /Chinese/i.test(v.name));
    if (!zh.length) return null;
    // prefer zh-TW / zh-CN natural voices
    const pref = zh.find(v => /zh[-_]TW/i.test(v.lang) || /zh[-_]CN/i.test(v.lang) || /Chinese.*(Ting-Ting|Yaoyao|Huihui|Xiaoxiao|Meijia)/i.test(v.name));
    return pref || zh[0];
  }

  function stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    }
  }

  function speak(text, { rate = 0.95, onEnd } = {}) {
    if (!('speechSynthesis' in window)) return;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'zh-CN';
    u.rate = rate;
    u.pitch = 1;
    u.onend = () => { currentUtterance = null; if (onEnd) onEnd(); };
    u.onerror = () => { currentUtterance = null; if (onEnd) onEnd(); };
    currentUtterance = u;
    window.speechSynthesis.speak(u);
  }

  function isSpeaking() {
    return 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }

  // warm up voices
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {};
    try { window.speechSynthesis.getVoices(); } catch (e) {}
  }

  global.TTS = { speak, stop, isSpeaking, pickVoice };
})(window);
