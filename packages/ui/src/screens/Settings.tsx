import { useEffect, useRef, useState } from "react";
import { useApp } from "../App.tsx";
import { api } from "../api.ts";
import { Badge, CheckRow } from "../components/Checks.tsx";
import {
  DEFAULT_SETTINGS,
  LANGUAGE_LEVEL_INFO,
  loadSettings,
  saveSettings,
  type LanguageLevelId,
  type QualityId,
  type StudioSettings,
  type VisualComplexityId,
} from "../settings.ts";

const STATE_LABEL: Record<string, { text: string; tone: "ok" | "warn" | "err" | "info" | "neutral" }> = {
  ready: { text: "hazır", tone: "ok" },
  downloading: { text: "model indiriliyor", tone: "warn" },
  unavailable: { text: "kullanılamıyor", tone: "err" },
  fallback: { text: "yedek etkin", tone: "info" },
};

export function Settings() {
  const { health, refreshHealth, toast } = useApp();
  const [settings, setSettings] = useState<StudioSettings>(() => loadSettings());
  const [preview, setPreview] = useState<{ url: string; engine: string; duration: number } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  function update<K extends keyof StudioSettings>(key: K, value: StudioSettings[K]) {
    setSettings((cur) => ({ ...cur, [key]: value }));
  }

  async function playPreview() {
    setPreviewing(true);
    setPreviewError(null);
    try {
      const res = await fetch("/api/tts/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engine: settings.engine,
          voice: settings.voice,
          rate: settings.rate,
          chatterboxUrl: settings.chatterboxUrl,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
        throw new Error([body.error, body.detail].filter(Boolean).join(" — ") || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (preview) URL.revokeObjectURL(preview.url);
      setPreview({ url, engine: res.headers.get("x-tts-engine") ?? settings.engine, duration: Number(res.headers.get("x-tts-duration") ?? 0) });
      window.setTimeout(() => {
        void audioRef.current?.play().catch(() => undefined);
      }, 60);
      toast(`Örnek ses üretildi (${settings.engine}).`);
    } catch (e) {
      setPreviewError((e as Error).message);
    } finally {
      setPreviewing(false);
    }
  }

  const engines = health?.tts ?? [];
  const selectedEngine = engines.find((e) => e.engine === settings.engine);
  const readyCount = engines.filter((e) => e.available && !e.silent).length;

  return (
    <div className="stack" style={{ gap: 22 }}>
      <div className="page-head">
        <div>
          <div className="kicker">Ayarlar</div>
          <h1>Varsayılanlar ve teşhis</h1>
          <p className="sub">
            Bu değerler yeni videolarda kullanılır; her proje kendi ayarlarını saklar. Motor durumları çalışma zamanında
            ölçülür — burada gösterilen her şey gerçekten denetlenir.
          </p>
        </div>
        <div className="row">
          <button
            className="btn ghost small"
            onClick={() => {
              setSettings({ ...DEFAULT_SETTINGS });
              toast("Varsayılanlara dönüldü (Sade dil).");
            }}
          >
            Varsayılanlar
          </button>
          <button className="btn" onClick={refreshHealth}>
            Durumu yenile
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Video varsayılanları</h2>
            <span className="small">Değişiklikler anında saklanır.</span>
          </div>
          <Badge tone="ok">kaydedildi</Badge>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Dil karmaşıklığı</div>
            <div className="setting-desc">Varsayılan her zaman Sade. Ayrıntılı bile ders anlatımına dönüşmez.</div>
          </div>
          <div className="seg">
            {LANGUAGE_LEVEL_INFO.map((l) => (
              <button
                key={l.id}
                className={`seg-item ${settings.languageLevel === l.id ? "active" : ""}`}
                onClick={() => update("languageLevel", l.id as LanguageLevelId)}
                title={l.desc}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Hedef süre</div>
            <div className="setting-desc">Sahne sayısı bu bütçeye göre seçilir; anlatım süresi ölçülen sesten doğrulanır.</div>
          </div>
          <div className="chips">
            {[20, 30, 45, 60].map((d) => (
              <button
                key={d}
                className={`chip ${settings.targetDurationSec === d ? "active" : ""}`}
                onClick={() => update("targetDurationSec", d)}
              >
                {d} sn
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Görsel karmaşıklık</div>
            <div className="setting-desc">Az etiket = tek fikir. Zengin seçimi etiket sayısını artırır, sahne sayısını değil.</div>
          </div>
          <div className="seg">
            {[
              { id: "sade", label: "Sade" },
              { id: "dengeli", label: "Dengeli" },
              { id: "zengin", label: "Zengin" },
            ].map((v) => (
              <button
                key={v.id}
                className={`seg-item ${settings.visualComplexity === v.id ? "active" : ""}`}
                onClick={() => update("visualComplexity", v.id as VisualComplexityId)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Altyazı</div>
            <div className="setting-desc">Altyazı zamanlaması ifade bazında tahmin edilir ve .srt olarak da dışa aktarılır.</div>
          </div>
          <div className="seg">
            <button className={`seg-item ${settings.subtitles ? "active" : ""}`} onClick={() => update("subtitles", true)}>
              Açık
            </button>
            <button className={`seg-item ${!settings.subtitles ? "active" : ""}`} onClick={() => update("subtitles", false)}>
              Kapalı
            </button>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Dışa aktarma kalitesi</div>
            <div className="setting-desc">Taslak 540p hızlı bakış içindir; nihai çıktı 1080×1920 dikey.</div>
          </div>
          <div className="seg">
            {[
              { id: "draft", label: "Taslak" },
              { id: "standard", label: "Standart" },
              { id: "high", label: "Yüksek" },
            ].map((q) => (
              <button
                key={q.id}
                className={`seg-item ${settings.quality === q.id ? "active" : ""}`}
                onClick={() => update("quality", q.id as QualityId)}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">En-boy oranı</div>
            <div className="setting-desc">Motor şu an yalnızca 9:16 üretiyor; desteklenmeyen oran seçeneği gösterilmez.</div>
          </div>
          <div className="chips">
            <button className="chip active">9:16 dikey</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Seslendirme</h2>
            <span className="small">Önizlemeyi dinlemeden hiçbir motor "hazır" sayılmaz.</span>
          </div>
          <Badge tone={readyCount ? "ok" : "warn"}>{readyCount} motor hazır</Badge>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Motor</div>
            <div className="setting-desc">Chatterbox kurulamazsa eSpeak NG yedeği kullanılır ve arayüzde öyle etiketlenir.</div>
          </div>
          <div className="stack">
            <select className="select" value={settings.engine} onChange={(e) => update("engine", e.target.value)}>
              {(engines.length ? engines : [{ engine: "espeak", label: "eSpeak NG", available: false, detail: "", silent: false, state: "unavailable" }]).map((e) => (
                <option key={e.engine} value={e.engine}>
                  {e.label}
                  {e.available ? "" : " — kullanılamıyor"}
                </option>
              ))}
            </select>
            {selectedEngine && (
              <div className="small">
                <Badge tone={STATE_LABEL[selectedEngine.state]?.tone ?? "neutral"}>
                  {STATE_LABEL[selectedEngine.state]?.text ?? selectedEngine.state}
                </Badge>{" "}
                {selectedEngine.detail}
              </div>
            )}
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Ses / konuşmacı</div>
            <div className="setting-desc">eSpeak için "tr", "tr+f2" gibi varyantlar; Chatterbox için referans ses dosyası yolu.</div>
          </div>
          <div className="field-row">
            <input className="input" value={settings.voice} onChange={(e) => update("voice", e.target.value)} />
            <div className="field">
              <span className="label">Hız (kelime/dk)</span>
              <input
                className="input"
                value={settings.rate}
                inputMode="numeric"
                onChange={(e) => update("rate", Number(e.target.value.replace(/[^0-9]/g, "")) || 165)}
              />
            </div>
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Chatterbox sunucu adresi</div>
            <div className="setting-desc">
              python packages/core/scripts/chatterbox_server.py — ilk çalıştırmada model ağırlıkları indirilir (~2 GB).
            </div>
          </div>
          <input
            className="input"
            value={settings.chatterboxUrl}
            onChange={(e) => update("chatterboxUrl", e.target.value)}
          />
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Ses önizlemesi</div>
            <div className="setting-desc">Seçili motorla kısa bir Türkçe cümle üretilir; dosya gerçekten sentezlenir.</div>
          </div>
          <div className="stack">
            <div className="row">
              <button className="btn" onClick={() => void playPreview()} disabled={previewing}>
                {previewing ? "Üretiliyor…" : "Örneği dinle"}
              </button>
              {preview && (
                <span className="small">
                  {preview.engine} · {preview.duration.toFixed(2)} sn
                </span>
              )}
            </div>
            {preview && <audio ref={audioRef} src={preview.url} controls style={{ width: "100%" }} />}
            {previewError && <div className="error-box">{previewError}</div>}
          </div>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-name">Motor durumları</div>
            <div className="setting-desc">Kurulu / indiriliyor / kullanılamıyor / yedek etkin — dördü ayrı gösterilir.</div>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            {engines.map((e) => (
              <div key={e.engine} className={`engine-row ${e.state === "unavailable" ? "fallback" : ""}`}>
                <span className={`dot ${e.available ? "ok" : e.state === "downloading" ? "warn" : "err"}`} />
                <div style={{ flex: 1 }}>
                  <div className="engine-name">{e.label}</div>
                  <div className="engine-detail">{e.detail}</div>
                </div>
                <Badge tone={STATE_LABEL[e.state]?.tone ?? "neutral"}>{STATE_LABEL[e.state]?.text ?? e.state}</Badge>
              </div>
            ))}
            {!engines.length && <div className="small">Servise bağlanılamadı; motor durumu okunamıyor.</div>}
          </div>
        </div>
      </section>

      {!health ? (
        <div className="error-box">
          <div className="title">Yerel servise bağlanılamadı</div>
          <div>Nedenmiş Studio arka plan servisi çalışmıyor olabilir. Uygulamayı yeniden başlatın.</div>
        </div>
      ) : (
        <>
          <div className="grid two">
            <section className="panel">
              <h2>Sistem</h2>
              <dl className="kv">
                <dt>Sürüm</dt>
                <dd>{health.version}</dd>
                <dt>Platform</dt>
                <dd>{health.platform}</dd>
                <dt>Node</dt>
                <dd>{health.node}</dd>
                <dt>CPU / RAM</dt>
                <dd>
                  {health.cpus} çekirdek · {health.memoryGb} GB
                </dd>
                <dt>Proje deposu</dt>
                <dd>{health.db === "sqlite" ? "SQLite (node:sqlite)" : "JSON dosyası"}</dd>
                <dt>Veri klasörü</dt>
                <dd className="mono">{health.dataDir}</dd>
              </dl>
            </section>

            <section className="panel">
              <h2>Araçlar</h2>
              <div className="stack" style={{ gap: 2 }}>
                <CheckRow ok={Boolean(health.ffmpeg)} title="FFmpeg" detail={health.ffmpeg ?? "bulunamadı"} />
                <CheckRow ok={Boolean(health.ffprobe)} title="FFprobe" detail={health.ffprobe ?? "bulunamadı"} />
                <CheckRow
                  ok={Boolean(health.fonts)}
                  title="Yazı tipleri"
                  detail={health.fonts ? `${health.fonts.regular} · ${health.fonts.bold}` : "bulunamadı"}
                />
              </div>
            </section>
          </div>

          <section className="panel">
            <h2>Bilimsel doğrulama nasıl çalışır?</h2>
            <ol style={{ margin: 0, paddingLeft: 20, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.8 }}>
              <li>Konu, doğrulanmış bilgi kartlarıyla eşleştirilir; eşleşme yoksa video üretilmez.</li>
              <li>Her sahne için kavram + mekanizma bazlı görsel bileşen seçilir (konu adına göre değil).</li>
              <li>Sahne; bileşen uyumu, alan uyumu, mekanizma uyumu, yasaklı kavram ve yanılgı denetimlerinden geçer.</li>
              <li>Anlatım sade dille yeniden yazılır; kavram bağı bilimsel metin üzerinden denetlenir, doğruluk kaybı olmaz.</li>
              <li>Herhangi bir hata varsa sahne <strong>reddedilir</strong> ve render kapısı kapanır — yanlış görsel yayınlanmaz.</li>
              <li>Render sonrası FFprobe ile süre, kare sayısı, kodek, ses örnekleme ve senkron ölçülür.</li>
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
