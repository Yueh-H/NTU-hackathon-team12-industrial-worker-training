export function speakId(text: string): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = 0.88;
  const voices = window.speechSynthesis.getVoices();
  const indonesian = voices.find((voice) => voice.lang.toLowerCase().startsWith("id"));
  if (indonesian) utterance.voice = indonesian;
  window.speechSynthesis.speak(utterance);
}
