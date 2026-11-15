import { useApp } from "../App.tsx";
import { Badge, CheckRow } from "../components/Checks.tsx";

export function Settings() {
  const { health, refreshHealth } = useApp();

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="page-head">
        <div>
          <div className="kicker">Sistem</div>
          <h1>Ayarlar ve teşhis</h1>
          <p className="sub">Ses motorları, FFmpeg, yazı tipleri ve proje deposunun gerçek durumu. Bu değerler çalışma zamanında ölçülür.</p>
        </div>
        <button className="btn" onClick={refreshHealth}>
          Yenile
        </button>
      </div>

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
                <CheckRow ok={Boolean(health.fonts)} title="Yazı tipleri" detail={health.fonts ? `${health.fonts.regular} · ${health.fonts.bold}` : "bulunamadı"} />
              </div>
            </section>
          </div>

          <section className="panel">
            <div className="row" style={{ marginBottom: 6 }}>
              <h2 style={{ margin: 0 }}>Seslendirme motorları</h2>
              <span className="spacer" />
              <Badge tone={health.tts.some((t) => t.available && !t.silent) ? "ok" : "warn"}>
                {health.tts.filter((t) => t.available).length} motor hazır
              </Badge>
            </div>
            {health.tts.map((e) => (
              <div key={e.engine} className="engine-row">
                <span className={`dot ${e.available ? "ok" : e.silent ? "warn" : "err"}`} />
                <div>
                  <div className="engine-name">{e.label}</div>
                  <div className="engine-detail">{e.detail}</div>
                </div>
                <Badge tone={e.available ? "ok" : "warn"}>{e.available ? "hazır" : "kurulu değil"}</Badge>
              </div>
            ))}
            <div className="small" style={{ marginTop: 12 }}>
              Chatterbox Multilingual, yerel bir Python sunucusu (packages/core/scripts/chatterbox_server.py) üzerinden çalışır.
              Model ağırlıkları bu kurulumla birlikte gelmez; ilk kullanımda indirilir. eSpeak NG tamamen çevrimdışıdır ve
              arayüzde robotik ses olarak etiketlenir — otomatik sessiz geçiş yapılmaz.
            </div>
          </section>

          <section className="panel">
            <h2>Bilimsel doğrulama nasıl çalışır?</h2>
            <ol style={{ margin: 0, paddingLeft: 20, color: "var(--muted)", fontSize: 13.5, lineHeight: 1.8 }}>
              <li>Konu, doğrulanmış bilgi kartlarıyla eşleştirilir; eşleşme yoksa video üretilmez.</li>
              <li>Her sahne için kavram + mekanizma bazlı görsel bileşen seçilir (konu adına göre değil).</li>
              <li>Sahne; bileşen uyumu, alan uyumu, mekanizma uyumu, yasaklı kavram ve yanılgı denetimlerinden geçer.</li>
              <li>Herhangi bir hata varsa sahne <strong>reddedilir</strong> ve render kapısı kapanır — yanlış görsel yayınlanmaz.</li>
              <li>Render sonrası FFprobe ile süre, kare sayısı, kodek, ses örnekleme ve senkron ölçülür.</li>
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
