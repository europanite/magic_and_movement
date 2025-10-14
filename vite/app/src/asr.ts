export type OnText = (finalText: string, isFinal: boolean) => void;

export function createASR(lang = "en-US") {
  // @ts-expect-error webkit prefix for Chrome
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return { supported: false, start: () => {}, stop: () => {} };

  const rec = new SR();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;

  let onText: OnText | null = null;
  rec.onresult = (e: SpeechRecognitionEvent) => {
    if (!onText) return;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      onText(r[0].transcript.trim(), r.isFinal);
    }
  };

  return {
    supported: true,
    start(cb: OnText) { onText = cb; rec.start(); },
    stop() { rec.stop(); onText = null; }
  };
}
