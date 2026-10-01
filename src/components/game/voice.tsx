import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Captions, CaptionsOff, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { LANGS } from "../../locales/resources";
import { useMissionStore, type Lang } from "../../stores/mission-store";

type VState = "idle" | "playing" | "paused";

// Browser SpeechSynthesis voice (§9). State is driven only by real utterance events — never faked.
export function useVoice() {
  const lang = useMissionStore((s) => s.lang), muted = useMissionStore((s) => s.muted);
  const [state, setState] = useState<VState>("idle");
  const [problem, setProblem] = useState<"unsupported" | "noVoice" | null>(null);
  const last = useRef("");
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => { if (supported) window.speechSynthesis.cancel(); setState("idle"); }, [supported]);
  const speak = useCallback((text: string) => {
    last.current = text;
    if (!supported) { setProblem("unsupported"); return; }
    window.speechSynthesis.cancel(); setState("idle");
    if (muted) return;
    const code = LANGS.find((l) => l.id === lang)!.speech;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === code) ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voices.length && !voice && lang !== "en") { setProblem("noVoice"); return; }
    setProblem(null);
    const u = new SpeechSynthesisUtterance(text); u.lang = code; if (voice) u.voice = voice; u.rate = 0.98;
    u.onstart = () => setState("playing"); u.onend = () => setState("idle"); u.onerror = () => setState("idle");
    u.onpause = () => setState("paused"); u.onresume = () => setState("playing");
    window.speechSynthesis.speak(u);
  }, [lang, muted, supported]);
  const pause = () => { if (supported) window.speechSynthesis.pause(); setState("paused"); };
  const resume = () => { if (supported) window.speechSynthesis.resume(); setState("playing"); };
  const replay = () => speak(last.current);

  useEffect(() => stop, [stop]);
  useEffect(() => { if (muted) stop(); }, [muted, stop]);
  useEffect(() => { stop(); setProblem(null); }, [lang, stop]);
  return { state, problem, speak, pause, resume, replay, stop };
}

export function VoiceBar({ text, voice }: { text: string; voice: ReturnType<typeof useVoice> }) {
  const { t } = useTranslation();
  const s = useMissionStore();
  const v = voice;
  return (
    <div className="mf-voice">
      <div className="mf-voice-controls">
        {v.state === "playing" ? <button onClick={v.pause} aria-label={t("ui.voice.pause")}><Pause size={18} /></button>
          : v.state === "paused" ? <button onClick={v.resume} aria-label={t("ui.voice.resume")}><Play size={18} /></button>
          : <button onClick={() => v.speak(text)} aria-label={t("ui.voice.play")} disabled={s.muted}><Play size={18} /></button>}
        <button onClick={v.replay} aria-label={t("ui.voice.replay")} disabled={s.muted}><RotateCcw size={18} /></button>
        <button onClick={() => s.set({ muted: !s.muted })} aria-label={s.muted ? t("ui.voice.unmute") : t("ui.voice.mute")}>{s.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <button onClick={() => s.set({ captions: !s.captions })} aria-label={s.captions ? t("ui.voice.captionsOff") : t("ui.voice.captionsOn")}>{s.captions ? <Captions size={18} /> : <CaptionsOff size={18} />}</button>
        <select aria-label={t("ui.voice.language")} value={s.lang} onChange={(e) => s.set({ lang: e.target.value as Lang })}>{LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}</select>
        {v.state !== "idle" && <span className="mf-voice-state">{v.state === "playing" ? t("ui.voice.speaking") : t("ui.voice.paused")}</span>}
      </div>
      {v.problem && <p className="mf-voice-note">{t(`ui.voice.${v.problem}`)}</p>}
      {(s.captions || v.problem || s.muted) && <p className="mf-caption">{text}</p>}
    </div>
  );
}
