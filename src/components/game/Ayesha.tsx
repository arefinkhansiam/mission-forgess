import { useTranslation } from "react-i18next";
import { LANGS } from "../../locales/resources";
import { useMissionStore } from "../../stores/mission-store";
import { useVoice, VoiceBar } from "./voice";

import mentorDoctorImg from "../../assets/mentor-doctor.jpg";

export function AyeshaAvatar({ className = "mf-ayesha-avatar", alt = "Dr. Ayesha" }: { className?: string; alt?: string }) {
  return <img src={mentorDoctorImg} alt={alt} className={className} loading="lazy" />;
}

// Contextual guide (§8): appears once per phase where a decision matters, never permanently on screen.
const CONTEXT: Record<string, "build" | "launch"> = { build: "build" };

export function Ayesha() {
  const { t } = useTranslation();
  const s = useMissionStore(); const voice = useVoice();
  const ctx = CONTEXT[s.phase];
  if (!ctx || s.learn || s.ayeshaSeen.includes(ctx) || s.phase === "build") return null;
  const text = t(`ayeshaTips.${ctx}`);
  const rtl = LANGS.find((l) => l.id === s.lang && "rtl" in l);
  return (
    <aside className="mf-ayesha" dir={rtl ? "rtl" : "ltr"} aria-label={t("ui.ayesha.name")}>
      <div className="mf-ayesha-head"><AyeshaAvatar /><div><b>{t("ui.ayesha.name")}</b><small>{t("ui.ayesha.role")}</small></div></div>
      <VoiceBar text={text} voice={voice} />
      <button className="mf-primary" onClick={() => { voice.stop(); s.set({ ayeshaSeen: [...s.ayeshaSeen, ctx] }); }}>{t("ui.ayesha.dismiss")}</button>
    </aside>
  );
}
