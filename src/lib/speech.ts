export function speakZh(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.92;
  const voices = window.speechSynthesis.getVoices();
  const chinese = voices.find((voice) => {
    const lang = voice.lang.toLowerCase();
    return lang.startsWith("zh-tw") || lang.startsWith("zh-hant") || lang.includes("taiwan");
  }) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"));
  if (chinese) utterance.voice = chinese;
  window.speechSynthesis.speak(utterance);
}
