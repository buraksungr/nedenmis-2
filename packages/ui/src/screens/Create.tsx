import { useEffect, useState } from "react";
import { api, ApiError } from "../api.ts";
import { navigate, useApp } from "../App.tsx";
import { LANGUAGE_LEVEL_INFO, loadSettings, type LanguageLevelId, type VisualComplexityId } from "../settings.ts";

const DURATIONS = [20, 30, 45, 60];

export function Create() {
  const { health, toast } = useApp();
  const settings = loadSettings();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState<LanguageLevelId>(settings.languageLevel);
  const [visualComplexity, setVisualComplexity] = useState<VisualComplexityId>(settings.visualComplexity);
  const [subtitles, setSubtitles] = useState(settings.subtitles);
  const [duration, setDuration] = useState<number>(settings.targetDurationSec);
  const [custom, setCustom] = useState("");
  const [quality, setQuality] = useState<"draft" | "standard" | "high">(settings.quality);
  const [engine, setEngine] = useState(settings.engine);
  const [advanced, setAdvanced] = useState(false);
  const [voice, setVoice] = useState(settings.voice);
  const [rate, setRate] = useState(settings.rate);
  const [chatterboxUrl, setChatterboxUrl] = useState(settings.chatterboxUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; hint?: string; detail?: string } | null>(null);
  const [suggestions, setSuggestions] = useState<{ topic: string }[]>([]);

  useEffect(() => {
    api
      .topics()
      .then((r) => setSuggestions(r.topics.slice(0, 8)))
      .catch(() => setSuggestions([]));
  }, []);

  const effectiveDuration = custom ? Number(custom) : duration;

  async function start() {
    setError(null);
    if (topic.trim().length < 5) {
      setError({ message: "Konu çok kısa", hint: "En az birkaç kelimelik bir soru yazın. Örnek: “Elmas neden kolay kırılmaz?”" });
      return;
    }
    if (!Number.isFinite(effectiveDuration) || effectiveDuration < 20 || effectiveDuration > 300) {
      setError({ message: "Süre geçersiz", hint: "20–300 saniye arasında bir süre seçin." });
      return;
    }
    setBusy(true);
    try {
      const { project } = await api.create({
        topic: topic.trim(),
        targetDurationSec: effectiveDuration,
        quality,
        languageLevel: level,
        visualComplexity,
        subtitles,
        narration: { engine, voice, rate, chatterboxUrl },
      });
      const q = project.scriptQuality;
      toast(
        `Plan hazır: ${project.scenes.length} sahne · senaryo ${q ? `${q.score}/100` : "—"} · doğrulama ${
          project.validation?.status === "approved" ? "onaylı" : "reddedildi"
        }.`,
      );
      navigate(`/studio/${project.id}`);
    } catch (e) {
      const err = e as ApiError;
      setError({ message: err.message, hint: err.hint, detail: typeof err.detail === "string" ? err.detail : undefined });
    } finally {
      setBusy(false);
    }
  }

  const engines = health?.tts ?? [];

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="hero-card">
        <div className="kicker">Bilimsel doğruluk önce gelir</div>
        <h1 className="hero-title">
          Bir soru yazın, <em>kanıtlı</em> bir video üretilsin.
        </h1>
        <p className="sub">
          Konu, doğrulanmış bilgi kartlarıyla eşleştirilir; senaryo ölçülen ses süresine göre kurulur ve her sahnenin görseli
          içerikle uyum açısından denetlenir. Uygun görsel yoksa sahne <strong>reddedilir</strong> — yanlış animasyon gösterilmez.
        </p>

        <div className="hero-grid" style={{ marginTop: 24 }}>
          <div className="stack">
            <div className="field">
              <span className="label">Video konusu</span>
              <div className="topic-row">
                <input
                  className="input hero"
                  placeholder="Elmas neden kolay kırılmaz?"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void start();
                  }}
                />
                <button className="btn primary" onClick={() => void start()} disabled={busy}>
                  {busy ? "Planlanıyor…" : "Planla"}
                </button>
              </div>
            </div>
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map((s) => (
                  <button key={s.topic} className="suggestion" onClick={() => setTopic(s.topic)}>
                    {s.topic}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ul className="hint-list">
            <li>
              <span className="tick">✓</span> Türkçe anlatım, ölçülen ses süresine göre zamanlanır; sessizce kısaltılmaz.
            </li>
            <li>
              <span className="tick">✓</span> Sahne görselleri konu + mekanizma eşleşmesine göre seçilir, denetlenir.
            </li>
            <li>
              <span className="tick">✓</span> 1080×1920, 30 fps, H.264 + AAC 48 kHz çıktı; FFprobe ile doğrulanır.
            </li>
          </ul>
        </div>
      </div>

      <div className="grid two">
        <section className="panel">
          <h2>Anlatım dili</h2>
          <span className="small" style={{ display: "block", marginBottom: 14 }}>
            Karmaşık konular sade Türkçeyle anlatılır; bilimsel doğruluk korunur. Varsayılan: Sade.
          </span>
          <div className="lang-options">
            {LANGUAGE_LEVEL_INFO.map((l) => (
              <button key={l.id} className={`option ${level === l.id ? "active" : ""}`} onClick={() => setLevel(l.id)}>
                <div className="option-title">{l.label}</div>
                <div className="option-desc">{l.desc}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Süre ve kalite</h2>
          <div className="stack">
            <div className="field">
              <span className="label">Hedef süre (saniye)</span>
              <div className="chips">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    className={`chip ${!custom && duration === d ? "active" : ""}`}
                    onClick={() => {
                      setDuration(d);
                      setCustom("");
                    }}
                  >
                    {d} sn
                  </button>
                ))}
                <input
                  className="input"
                  style={{ width: 110, padding: "8px 12px" }}
                  placeholder="Özel"
                  value={custom}
                  inputMode="numeric"
                  onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
                />
              </div>
              <span className="small">
                Hedef {custom || duration} sn. Anlatım süresi ±%5 toleransla doğrulanır; anlatım uzarsa video kırpılmaz, süre yeniden ayarlanır.
              </span>
            </div>

            <div className="field">
              <span className="label">Çıktı kalitesi</span>
              <div className="chips">
                {[
                  { id: "draft", label: "Taslak (hızlı, 540p)" },
                  { id: "standard", label: "Standart (1080p)" },
                  { id: "high", label: "Yüksek (1080p, yavaş)" },
                ].map((q) => (
                  <button key={q.id} className={`chip ${quality === q.id ? "active" : ""}`} onClick={() => setQuality(q.id as typeof quality)}>
                    {q.label}
                  </button>
                ))}
              </div>
              <span className="small">Nihai videolar her zaman 1080×1920 dikey formattadır; Taslak yalnızca hızlı bakış içindir.</span>
            </div>

            <div className="field">
              <span className="label">Görsel karmaşıklık</span>
              <div className="chips">
                {[
                  { id: "sade", label: "Sade (az etiket)" },
                  { id: "dengeli", label: "Dengeli" },
                  { id: "zengin", label: "Zengin" },
                ].map((v) => (
                  <button
                    key={v.id}
                    className={`chip ${visualComplexity === v.id ? "active" : ""}`}
                    onClick={() => setVisualComplexity(v.id as VisualComplexityId)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <span className="small">Her sahnede tek ana fikir; sade seçimde en fazla iki etiket gösterilir.</span>
            </div>

            <div className="field">
              <span className="label">Altyazı</span>
              <div className="chips">
                <button className={`chip ${subtitles ? "active" : ""}`} onClick={() => setSubtitles(true)}>
                  Açık
                </button>
                <button className={`chip ${!subtitles ? "active" : ""}`} onClick={() => setSubtitles(false)}>
                  Kapalı
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Seslendirme</h2>
          <div className="stack">
            <div className="field">
              <span className="label">Motor</span>
              <select className="select" value={engine} onChange={(e) => setEngine(e.target.value)}>
                {(engines.length ? engines : [{ engine: "espeak", label: "eSpeak NG", available: true, detail: "", silent: false }]).map((e) => (
                  <option key={e.engine} value={e.engine}>
                    {e.label} {e.available ? "" : "— kurulu değil"}
                  </option>
                ))}
              </select>
              <span className="small">
                {engines.find((e) => e.engine === engine)?.detail ?? "Chatterbox Multilingual yerel sunucu üzerinden çalışır; eSpeak NG çevrimdışı yedektir."}
              </span>
            </div>

            <button className="btn ghost small" onClick={() => setAdvanced((a) => !a)} style={{ justifySelf: "start" }}>
              {advanced ? "Gelişmiş ayarları kapat" : "Gelişmiş ayarlar"}
            </button>

            {advanced && (
              <div className="stack">
                <div className="row">
                  <div className="field" style={{ flex: 1 }}>
                    <span className="label">Ses / dil</span>
                    <input className="input" value={voice} onChange={(e) => setVoice(e.target.value)} />
                  </div>
                  <div className="field" style={{ width: 130 }}>
                    <span className="label">Hız (wpm)</span>
                    <input className="input" value={rate} inputMode="numeric" onChange={(e) => setRate(Number(e.target.value.replace(/[^0-9]/g, "")) || 165)} />
                  </div>
                </div>
                {engine === "chatterbox" && (
                  <div className="field">
                    <span className="label">Chatterbox sunucu adresi</span>
                    <input className="input" value={chatterboxUrl} onChange={(e) => setChatterboxUrl(e.target.value)} />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {error && (
        <div className="error-box">
          <div className="title">{error.message}</div>
          {error.hint && <div>{error.hint}</div>}
          {error.detail && <div className="detail mono">{error.detail}</div>}
        </div>
      )}
    </div>
  );
}
