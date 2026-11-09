import { useEffect, useRef, useState } from "react";
import {
  RESOLUTIONS, QUALITY, SPEEDS, FORMATS, MAX_BYTES, crfFor, targetSize, rateFor, fpsOptions, isFpsChange, fmtFps,
  compressVideo, cancelCompress, readMeta, detectFps,
} from "./lib/compress.js";
import { getTotal, countVideo } from "./lib/counter.js";
import {
  IMG_FORMATS, ENHANCE_PRESETS, MAX_IMG_BYTES, MAX_PIXELS, enhanceImage, readImageSize, outputSize,
} from "./lib/enhance.js";

const BASE = import.meta.env.BASE_URL;
const LOGO = `${BASE}logo.png`;
const PROMO_URL = "https://lynk.id/rayden/4xel0ex553q8";
const WA_NUMBER = "6285150872460";
const WA_SHOW = "0851-5087-2460";

const Sticker = ({ n, size = 64, className = "" }) => (
  <img className={`stk ${className}`} src={`${BASE}stickers/s${String(n).padStart(2, "0")}.png`}
       width={size} height={size} alt="" aria-hidden="true" decoding="async" />
);

const bytes = (n) => (n >= 1073741824 ? (n / 1073741824).toFixed(2) + " GB" : (n / 1048576).toFixed(1) + " MB");
const VIDEO_EXT = /\.(mp4|m4v|mov|mkv|webm|avi|3gp|mts|m2ts|ts|flv|wmv|mpg|mpeg)$/i;
const num = (n) => new Intl.NumberFormat("id-ID").format(n);
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const I = {
  upload: "M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3",
  film: "M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M16 9h4M4 15h4M16 15h4",
  download: "M12 4v12m0 0l-4-4m4 4l4-4M4 20h16",
  shield: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6L6 18",
  info: "M12 8h.01M11 12h1v5h1M12 21a9 9 0 100-18 9 9 0 000 18z",
  refresh: "M20 11a8 8 0 10-2.3 5.7M20 4v7h-7",
  menu: "M4 7h16M4 12h16M4 17h16",
  pin: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11zM12 12a2 2 0 100-4 2 2 0 000 4z",
  chat: "M20 12a8 8 0 01-11.6 7.1L4 20l1-4.1A8 8 0 1120 12z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  arrow: "M7 17L17 7M9 7h8v8",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z",
  image: "M4 5h16v14H4zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 17l5-5 4 4 3-3 4 4",
};

const PAGES = [
  ["beranda", "Beranda", 1],
  ["enhance", "Enhance Gambar", 11],
  ["platform", "Preset Sosmed", 9],
  ["cara", "Cara Menggunakan", 24],
  ["tentang", "Tentang", 5],
];
const pageFromHash = () => {
  const h = window.location.hash.replace("#", "");
  return PAGES.some(([k]) => k === h) ? h : "beranda";
};

function Section({ n, title, desc, stk, children }) {
  return (
    <section className="panel">
      <header className="panel-head">
        <span className="step">{n}</span>
        <div>
          <h2>{title}</h2>
          {desc && <p className="muted">{desc}</p>}
        </div>
        {stk && <Sticker n={stk} size={52} className="ph-stk" />}
      </header>
      {children}
    </section>
  );
}

/* ───────────── Header & Footer ───────────── */
function Header({ page, go }) {
  const [open, setOpen] = useState(false);
  const pick = (k) => { setOpen(false); go(k); };
  return (
    <header className="topbar">
      <div className="topbar-in">
        <a className="brand" href="#beranda" onClick={(e) => { e.preventDefault(); pick("beranda"); }}>
          <img className="brand-logo" src={LOGO} alt="Logo" />
          <b>Video Optimizer</b>
        </a>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon d={open ? I.x : I.menu} size={22} />
        </button>
        <nav className={"menu" + (open ? " open" : "")} aria-label="Menu utama">
          {PAGES.map(([k, label, stk]) => (
            <a key={k} href={`#${k}`} className={page === k ? "on" : ""}
               aria-current={page === k ? "page" : undefined}
               onClick={(e) => { e.preventDefault(); pick(k); }}><Sticker n={stk} size={26} className="nav-stk" />{label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <img className="brand-logo" src={LOGO} alt="" />
          <div>
            <b>Video Optimizer</b>
            <p>Kompres video tetap tajam, langsung dari browser. Gratis dan tanpa unggah ke server.</p>
          </div>
        </div>
        <Sticker n={29} size={84} className="foot-stk" />
      </div>
    </footer>
  );
}

/* ───────────── Animasi loading: karakter kesusahan ───────────── */
const STRUGGLE_FRAMES = [15, 18, 26, 15];
const STRUGGLE_SAY = [
  "Aduh, berat banget nih…",
  "Tahan ya, lagi kerja keras!",
  "Pixelnya banyak banget 😵",
  "Ngos-ngosan, tapi pantang menyerah!",
  "Dikit lagi… semangat! 💪",
];

function Struggle() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => x + 1), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="struggle" aria-hidden="true">
      <div className="st-say" key={i}>{STRUGGLE_SAY[i % STRUGGLE_SAY.length]}</div>
      <div className="st-stage">
        <span className="sweat s1" /><span className="sweat s2" /><span className="sweat s3" />
        <span className="dust d1" /><span className="dust d2" />
        <div className="st-body"><Sticker n={STRUGGLE_FRAMES[i % STRUGGLE_FRAMES.length]} size={150} /></div>
      </div>
    </div>
  );
}

/* ───────────── Beranda ───────────── */
function Home({ preset }) {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [srcUrl, setSrcUrl] = useState(null);
  const [res, setRes] = useState("fhd");
  const [quality, setQuality] = useState("balanced");
  const [speed, setSpeed] = useState("veryfast");
  const [fps, setFps] = useState("orig"); // "orig" = ikuti file asli, atau angka fps tujuan
  const [format, setFormat] = useState("mp4");
  const [doneFormat, setDoneFormat] = useState("mp4");
  const [doneRes, setDoneRes] = useState("fhd");
  const [mute, setMute] = useState(false);
  const [fpsState, setFpsState] = useState("idle"); // idle | detecting | done | fail
  const [doneFps, setDoneFps] = useState(null);
  const [drag, setDrag] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | working | done | error
  const [stage, setStage] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [outUrl, setOutUrl] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const cancelled = useRef(false);
  const detectId = useRef(0);
  const inputRef = useRef();
  const [total, setTotal] = useState(null); // total video dioptimasi (null = belum/gagal dimuat)

  useEffect(() => {
    let alive = true;
    getTotal().then((v) => { if (alive && v !== null) setTotal(v); });
    return () => { alive = false; };
  }, []);

  // Preset dari halaman "Preset Sosmed"
  useEffect(() => {
    if (!preset) return;
    setRes(preset.res); setQuality(preset.quality); setFormat(preset.format);
  }, [preset]);

  useEffect(() => () => { srcUrl && URL.revokeObjectURL(srcUrl); }, [srcUrl]);
  useEffect(() => () => { outUrl && URL.revokeObjectURL(outUrl); }, [outUrl]);

  async function pick(f) {
    if (!f) return;
    detectId.current++;
    setError(""); setResult(null); setOutUrl(null); setStatus("idle"); setMeta(null);
    setFps("orig"); setFpsState("idle");
    if (!f.type.startsWith("video/") && !VIDEO_EXT.test(f.name)) return setError("File harus berupa video (MP4, MOV, MKV, WebM, dll).");
    if (f.size > MAX_BYTES) return setError(`Ukuran file ${bytes(f.size)} melebihi batas 200 MB. Potong atau kecilkan video dulu.`);
    setFile(f);
    setSrcUrl(URL.createObjectURL(f));
    let m = null;
    try { m = await readMeta(f); setMeta(m); } catch { /* coba baca lewat ffmpeg di bawah */ }

    // Auto deteksi FPS (dan metadata cadangan bila browser tidak bisa membaca file)
    const id = ++detectId.current;
    setFpsState("detecting");
    try {
      const info = await detectFps(f);
      if (id !== detectId.current) return;
      if (!m) {
        if (!info.width || !info.height) { setFpsState("fail"); setError("Format video tidak bisa dibaca."); return; }
        m = { width: info.width, height: info.height, duration: info.duration || 0 };
      }
      setMeta({ ...m, fps: info.fps });
      setFpsState(info.fps ? "done" : "fail");
    } catch {
      if (id !== detectId.current) return;
      setFpsState("fail");
      if (!m) setError("Format video tidak bisa dibaca.");
    }
  }

  async function start() {
    cancelled.current = false;
    setStatus("working"); setProgress(0); setError(""); setResult(null); setOutUrl(null);
    const t0 = Date.now();
    try {
      const blob = await compressVideo(file, { meta, res, quality, speed, fps, format, mute, onProgress: setProgress, onStage: setStage });
      setResult(blob);
      setOutUrl(URL.createObjectURL(blob));
      setElapsed((Date.now() - t0) / 1000);
      setDoneFps(isFpsChange(meta.fps, fps) ? fps : meta.fps || null);
      setDoneFormat(format);
      setDoneRes(res);
      setStatus("done");
      countVideo().then((v) => { if (v !== null) setTotal(v); });
    } catch (e) {
      if (cancelled.current) { setStatus("idle"); return; }
      setError(e.message); setStatus("error");
    }
  }

  function cancel() { cancelled.current = true; cancelCompress(); setStatus("idle"); }
  function reset() { detectId.current++; setFpsState("idle"); setFps("orig"); setFile(null); setMeta(null); setSrcUrl(null); setResult(null); setOutUrl(null); setStatus("idle"); setError(""); }

  const saved = file && result ? Math.round((1 - result.size / file.size) * 100) : 0;
  const kbps = result && meta?.duration ? Math.round((result.size * 8) / meta.duration / 1000) : null;
  const outName = file ? file.name.replace(/\.[^.]+$/, "") + `-optimized.${FORMATS[doneFormat].ext}` : `optimized.${FORMATS[doneFormat].ext}`;
  const r = RESOLUTIONS[res];
  const out = meta ? targetSize(meta, res) : null;
  const srcFps = meta?.fps || null;
  const fpsOpts = fpsOptions(srcFps);
  const effFps = isFpsChange(srcFps, fps) ? fps : srcFps;
  const raising = typeof fps === "number" && srcFps && fps > srcFps + 0.5;
  const fmt = FORMATS[format];
  const canPreview = typeof document === "undefined" || !!document.createElement("video").canPlayType(FORMATS[doneFormat].mime);
  const willUpscale = meta && Number.isFinite(r.short) && Math.min(meta.width, meta.height) < r.short;

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <span className="pill"><Icon d={I.shield} size={14} /> Diproses di perangkat Anda</span>
          <Sticker n={8} size={118} className="hero-stk" />
        </div>
        <h1>Kompres video, <mark>tetap HD.</mark></h1>
        <p>FPS terdeteksi otomatis dan mengikuti file asli, rasio bebas, tanpa unggah ke server. Cocok untuk Instagram, TikTok, YouTube, dan WhatsApp.</p>
        <div className="chips">
          <span>⚡ Auto deteksi FPS</span><span>📐 Rasio bebas</span><span>🎵 Siap TikTok 720p</span><span>📦 Maks. 200 MB</span>
        </div>
        {total !== null && (
          <div className="counter" aria-live="polite">
            <span className="counter-ic"><Icon d={I.film} size={16} /></span>
            <div><b>{num(total)}</b><small>video sudah dioptimasi</small></div>
          </div>
        )}
      </section>

      <main className="grid">
        <div className="col">
          <Section n="1" stk={19} title="Pilih video" desc="MP4, MOV, MKV, WebM, dan format video umum lainnya. Maksimal 200 MB.">
            {!file ? (
              <div
                className={"drop" + (drag ? " over" : "")}
                onClick={() => inputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
              >
                <Sticker n={19} size={92} className="drop-stk" />
                <b>Ketuk untuk pilih video</b>
                <span className="muted">atau tarik file ke sini</span>
                <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => pick(e.target.files[0])} />
              </div>
            ) : (
              <div className="file">
                <video src={srcUrl} muted controls preload="metadata" />
                <div className="file-info">
                  <b title={file.name}>{file.name}</b>
                  <span className="muted">
                    {bytes(file.size)}
                    {meta && ` · ${meta.width}×${meta.height} · ${clock(meta.duration)}`}
                  </span>
                  <button className="link" onClick={reset} disabled={status === "working"}>
                    <Icon d={I.refresh} size={14} /> Ganti video
                  </button>
                </div>
              </div>
            )}
            {error && status !== "error" && <p className="alert">{error}</p>}
          </Section>

          <Section n="2" stk={13} title="Pengaturan" desc="Rasio asli video selalu dipertahankan, tanpa crop dan tanpa stretch.">
            <label className="field-label">Resolusi maksimal</label>
            <div className="presets">
              {Object.entries(RESOLUTIONS).map(([k, v]) => (
                <button key={k} type="button" className={"preset" + (res === k ? " on" : "")} onClick={() => setRes(k)}>
                  <b>{v.label}</b>
                  <small>{k === "orig" ? "Tidak diturunkan" : `Sisi pendek ${v.short}px`}</small>
                  {k === "fhd" && <em className="tag">Disarankan</em>}
                  {k === "hd" && <em className="tag tt">Untuk TikTok</em>}
                </button>
              ))}
            </div>
            {out && (
              <p className="hint">Hasil: <b>{out.w}×{out.h}</b> (rasio sama dengan video asli)</p>
            )}
            {willUpscale && (
              <p className="note"><Icon d={I.info} size={14} /> Video asli lebih kecil dari {r.short}p. Resolusi tidak akan diperbesar agar tidak buram.</p>
            )}

            <div className={"tt-note" + (res === "hd" ? " ok" : "")}>
              <img src={`${BASE}social/tiktok.png`} width="38" height="38" alt="" />
              <div>
                <b>Upload ke TikTok? Pilih HD 720p</b>
                <span>Saat ini TikTok sedang mengalami bug kompresi, jadi video beresolusi lebih tinggi bisa terlihat lebih pecah setelah diunggah. Pilih opsi 720p agar hasil upload lebih maksimal.</span>
                {res !== "hd"
                  ? <button type="button" className="link" onClick={() => setRes("hd")}><Icon d={I.check} size={14} /> Pakai HD 720p sekarang</button>
                  : <em className="tt-ok"><Icon d={I.check} size={14} /> HD 720p aktif, sudah pas untuk TikTok</em>}
              </div>
            </div>

            <label className="field-label">Frame rate (FPS)</label>
            {!file && <p className="hint">FPS dideteksi otomatis setelah video dipilih. Hasil mengikuti FPS asli dan bisa diturunkan bila perlu.</p>}
            {fpsState === "detecting" && <p className="hint detecting"><span className="mini-ring" /> Mendeteksi FPS video…</p>}
            {fpsState === "fail" && (
              <p className="note"><Icon d={I.info} size={14} /> FPS tidak bisa dideteksi. Hasil akan memakai FPS yang sama dengan video asli.</p>
            )}
            {fpsState !== "detecting" && (
              <>
                {srcFps && <p className="hint">Terdeteksi: <b>{fmtFps(srcFps)} fps</b></p>}
                <div className="seg">
                  <button type="button" className={fps === "orig" ? "on" : ""} onClick={() => setFps("orig")}>{srcFps ? `Asli (${fmtFps(srcFps)})` : "Asli"}</button>
                  {fpsOpts.map((f) => (
                    <button key={f} type="button" className={fps === f ? "on" : ""} onClick={() => setFps(f)}>{f} fps</button>
                  ))}
                </div>
                {raising && (
                  <p className="note"><Icon d={I.info} size={14} /> {fps} fps lebih tinggi dari video asli ({fmtFps(srcFps)} fps). Frame hanya digandakan, jadi gerakan tidak lebih halus dan ukuran file bisa naik. Pakai hanya bila platform tujuan mensyaratkannya.</p>
                )}
                {srcFps >= 100 && (
                  <p className="note"><Icon d={I.info} size={14} /> Video ini {fmtFps(srcFps)} fps. Turunkan ke 60 atau 30 fps bila ingin file jauh lebih kecil dan proses lebih cepat.</p>
                )}
              </>
            )}

            <label className="field-label">Format keluaran</label>
            <div className="seg">
              {Object.entries(FORMATS).map(([k, v]) => (
                <button key={k} type="button" className={format === k ? "on" : ""} onClick={() => setFormat(k)}>{v.label}</button>
              ))}
            </div>
            <p className="hint">{fmt.codec}. {fmt.hint}</p>
            {format === "webm" && (
              <p className="note"><Icon d={I.info} size={14} /> VP9 di browser jauh lebih lambat dari H.264. Untuk video panjang, pilih kecepatan “Cepat” atau gunakan MP4.</p>
            )}

            <label className="field-label">Kualitas</label>
            <div className="seg">
              {Object.entries(QUALITY).map(([k, v]) => (
                <button key={k} type="button" className={quality === k ? "on" : ""} onClick={() => setQuality(k)}>{v.label}</button>
              ))}
            </div>
            <p className="hint">{QUALITY[quality].hint}</p>

            <details className="adv">
              <summary>Pengaturan lanjutan</summary>
              <label className="field-label">Kecepatan proses</label>
              <div className="seg">
                {Object.entries(SPEEDS).map(([k, v]) => (
                  <button key={k} type="button" className={speed === k ? "on" : ""} onClick={() => setSpeed(k)}>{v.label}</button>
                ))}
              </div>
              <p className="hint">{SPEEDS[speed].hint}</p>
              <label className="field-label">Audio</label>
              <div className="seg">
                <button type="button" className={!mute ? "on" : ""} onClick={() => setMute(false)}>Pertahankan suara</button>
                <button type="button" className={mute ? "on" : ""} onClick={() => setMute(true)}>Tanpa suara</button>
              </div>
              <dl className="specs">
                <div><dt>Format</dt><dd>{fmt.label}</dd></div>
                <div><dt>Codec</dt><dd>{fmt.codec}{mute ? " (tanpa audio)" : ""}</dd></div>
                <div><dt>CRF</dt><dd>{format === "webm" ? Math.min(45, crfFor(res, quality) + 10) : crfFor(res, quality)}</dd></div>
                <div><dt>Bitrate maks.</dt><dd>{rateFor(res, effFps)} Mbps</dd></div>
                <div><dt>Frame rate</dt><dd>{effFps ? `${fmtFps(effFps)} fps` : "Sama dengan asli"}</dd></div>
              </dl>
            </details>

            {status !== "working" ? (
              <button className="cta" disabled={!file || !meta || fpsState === "detecting"} onClick={start}>{fpsState === "detecting" ? "Mendeteksi FPS…" : "Optimalkan video"}</button>
            ) : (
              <button className="cta ghost" onClick={cancel}><Icon d={I.x} size={16} /> Batalkan</button>
            )}
          </Section>
        </div>

        <div className="col">
          <Section n="3" stk={17} title="Hasil" desc="Bandingkan hasil dengan video asli sebelum diunduh.">
            {status === "idle" && !result && (
              <div className="empty">
                <Sticker n={6} size={104} className="empty-stk" />
                <p>Hasil kompresi akan muncul di sini.</p>
                <span className="muted">Pilih video lalu ketuk “Optimalkan video”.</span>
              </div>
            )}

            {status === "working" && (
              <div className="working">
                <Struggle />
                <b>{stage}</b>
                <div className="bar"><i style={{ width: `${Math.max(3, progress * 100)}%` }} /></div>
                <span className="muted">{Math.round(progress * 100)}% · Jangan tutup tab ini selama proses berjalan.</span>
              </div>
            )}

            {status === "error" && <p className="alert">{error}</p>}

            {status === "done" && result && (
              <>
                <div className="done-row">
                  <div className="done-badge"><Icon d={I.check} size={16} /> Selesai dalam {clock(elapsed)} · {FORMATS[doneFormat].label}{doneFps ? ` · ${fmtFps(doneFps)} fps` : ""}</div>
                  <Sticker n={22} size={62} className="done-stk" />
                </div>
                <div className="compare">
                  <figure><video src={srcUrl} controls muted /><figcaption>Asli · {bytes(file.size)}</figcaption></figure>
                  <figure><video src={outUrl} controls muted /><figcaption>Hasil · {bytes(result.size)}</figcaption></figure>
                </div>
                <div className="stats">
                  <div><span>Ukuran asli</span><b>{bytes(file.size)}</b></div>
                  <div><span>Ukuran hasil</span><b>{bytes(result.size)}</b></div>
                  <div className={saved > 0 ? "good" : ""}><span>Penghematan</span><b>{saved > 0 ? `${saved}%` : "—"}</b></div>
                  <div><span>Bitrate</span><b>{kbps ? `${(kbps / 1000).toFixed(1)} Mbps` : "—"}</b></div>
                </div>
                {!canPreview && (
                  <p className="note"><Icon d={I.info} size={14} /> Browser ini tidak bisa memutar pratinjau {FORMATS[doneFormat].label}. Hasilnya tetap valid: unduh lalu buka dengan VLC atau pemutar lain.</p>
                )}
                {doneRes !== "hd" && (
                  <p className="note"><Icon d={I.info} size={14} /> Mau upload ke TikTok? Ulangi dengan resolusi HD 720p agar hasil upload lebih maksimal, karena TikTok sedang ada bug kompresi.</p>
                )}
                {doneRes === "hd" && (
                  <p className="note ok"><Icon d={I.check} size={14} /> Hasil 720p, pas untuk diunggah ke TikTok.</p>
                )}
                {saved <= 0 && (
                  <p className="note"><Icon d={I.info} size={14} /> Video asli sudah efisien, sehingga ukurannya tidak berkurang. Coba kualitas “Hemat” bila ingin file lebih kecil.</p>
                )}
                <a className="cta" href={outUrl} download={outName}><Icon d={I.download} size={18} /> Unduh {outName}</a>
              </>
            )}
          </Section>
        </div>
      </main>

    </>
  );
}

/* ───────────── Cara Menggunakan ───────────── */
function HowTo({ go }) {
  const steps = [
    ["Pilih video", "Ketuk kotak unggah lalu pilih video dari galeri atau file. Ukuran maksimal 200 MB."],
    ["Atur resolusi, FPS & kualitas", "Pilih resolusi maksimal (HD, Full HD, 2K, atau Asli). FPS video terdeteksi otomatis dan hasil mengikuti file asli; turunkan bila perlu. Untuk hampir semua kasus, “Full HD” + “Seimbang” sudah pas. Khusus upload ke TikTok, pilih HD 720p."],
    ["Ketuk “Optimalkan video”", "Tunggu sampai selesai dan biarkan tab tetap terbuka. Video 120 fps, misalnya, bisa dibiarkan 120 fps atau diubah ke 60, 30, atau 24 fps. Pilih juga format keluaran: MP4, MOV, MKV, atau WebM."],
    ["Bandingkan lalu unduh", "Putar video asli dan hasil berdampingan, cek penghematan ukurannya, lalu ketuk tombol unduh."],
  ];
  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <span className="pill"><Icon d={I.info} size={14} /> Panduan singkat</span>
          <Sticker n={3} size={118} className="hero-stk" />
        </div>
        <h1>Cara <mark>menggunakan</mark></h1>
        <p>Empat langkah saja, semuanya dilakukan di browser Anda.</p>
      </section>

      <ol className="steps">
        {steps.map(([t, d], i) => (
          <li key={t} className="panel">
            <span className="step big">{i + 1}</span>
            <div><h2>{t}</h2><p className="muted">{d}</p></div>
            <Sticker n={[19, 13, 18, 17][i]} size={56} className="step-stk" />
          </li>
        ))}
      </ol>
      <button className="cta" onClick={() => go("beranda")}>Mulai kompres sekarang</button>

      <section className="panel info">
        <h2>Keterangan</h2>
        <ul className="facts">
          <li><b>Upload ke TikTok? Pilih 720p.</b> Saat ini TikTok sedang mengalami bug kompresi, sehingga video beresolusi lebih tinggi bisa terlihat lebih pecah setelah diunggah. Pilih opsi HD 720p agar hasil upload lebih maksimal. Menu “Preset Sosmed” menyiapkannya sekali ketuk.</li>
          <li><b>Mengapa tetap HD?</b> Aplikasi memakai CRF rendah dan membatasi bitrate sesuai resolusi, sehingga detail terjaga.</li>
          <li><b>FPS mengikuti asli.</b> FPS dideteksi otomatis. Video 24, 30, 60, atau 120 fps tetap sama saat diekspor, kecuali Anda memilih menurunkannya. FPS otomatis tidak pernah dinaikkan; bila Anda memilih fps lebih tinggi dari asli, frame hanya digandakan.</li>
          <li><b>Rasio bebas.</b> Vertikal, lanskap, persegi, atau ultrawide semuanya didukung. Gambar diperkecil proporsional tanpa crop atau stretch.</li>
          <li><b>Resolusi tidak diperbesar.</b> Video kecil dipertahankan apa adanya agar tidak buram.</li>
          <li><b>Siap diputar langsung.</b> Opsi faststart membuat video mulai diputar sebelum selesai diunduh.</li>
          <li><b>Privasi.</b> Seluruh proses berjalan di browser. Hanya mesin kompresi (ffmpeg.wasm) yang diunduh saat pertama kali dipakai.</li>
        </ul>
      </section>

      <section className="panel faq">
        <h2>Pertanyaan umum</h2>
        <details><summary>Kenapa video di TikTok terlihat pecah?</summary>
          <p>TikTok sedang mengalami bug kompresi. Pilih resolusi HD 720p saat mengoptimalkan video, lalu unggah hasilnya agar kualitas di TikTok lebih maksimal.</p></details>
        <details><summary>Apa fungsi menu Enhance Gambar?</summary>
          <p>Untuk memperbesar, mempertajam, mengurangi noise, dan merapikan warna foto langsung di browser. Gambar tidak diunggah ke server.</p></details>
        <details><summary>Berapa lama prosesnya?</summary>
          <p>Bergantung pada durasi dan perangkat. Mesin kompresi berjalan di browser dengan satu thread, jadi video 1–2 menit umumnya butuh beberapa menit. Biarkan tab tetap terbuka.</p></details>
        <details><summary>Mengapa ukuran file hasil kadang tidak mengecil?</summary>
          <p>Jika video asli sudah efisien (misalnya hasil unduhan atau ekspor aplikasi edit), tidak banyak yang bisa dihemat tanpa menurunkan kualitas. Aplikasi ini tidak menurunkan kualitas secara paksa.</p></details>
        <details><summary>Mengapa maksimal 200 MB?</summary>
          <p>Kompresi berjalan di memori browser. Batas 200 MB menjaga proses tetap stabil, terutama di HP.</p></details>
        <details><summary>Format apa yang dihasilkan?</summary>
          <p>Anda bisa memilih MP4, MOV, MKV (semuanya H.264 + AAC), atau WebM (VP9 + Opus). Untuk media sosial, pilih MP4. WebM paling lambat diproses di browser.</p></details>
        <details><summary>Video tidak bisa dibuka atau gagal diproses?</summary>
          <p>Pastikan format didukung browser Anda. Untuk file dengan codec langka (mis. HEVC 10-bit tertentu), konversi dulu ke MP4 H.264.</p></details>
      </section>
    </>
  );
}


/* ───────────── Enhance Gambar ───────────── */
function Compare({ before, after, w, h }) {
  const [p, setP] = useState(50);
  const ratio = w / h;
  return (
    <div className="cmp" style={{ aspectRatio: `${w} / ${h}`, maxWidth: `${Math.round(520 * ratio)}px` }}>
      <img src={after} alt="Hasil enhance" draggable="false" />
      <img className="cmp-top" src={before} alt="Gambar asli" draggable="false" style={{ clipPath: `inset(0 ${100 - p}% 0 0)` }} />
      <i className="cmp-line" style={{ left: `${p}%` }} />
      <span className="cmp-tag l">Asli</span>
      <span className="cmp-tag r">Hasil</span>
      <input type="range" min="0" max="100" value={p} onChange={(e) => setP(+e.target.value)} aria-label="Geser untuk membandingkan asli dan hasil" />
    </div>
  );
}

function Slide({ label, value, set, min = 0, max = 100, unit = "" }) {
  return (
    <label className="slide">
      <span><b>{label}</b><em>{value > 0 && min < 0 ? "+" : ""}{value}{unit}</em></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  );
}

function Enhance() {
  const [file, setFile] = useState(null);
  const [dim, setDim] = useState(null);
  const [srcUrl, setSrcUrl] = useState(null);
  const [preset, setPreset] = useState("auto");
  const [o, setO] = useState({ ...ENHANCE_PRESETS.auto.v });
  const [format, setFormat] = useState("jpeg");
  const [quality, setQuality] = useState(92);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");
  const [res, setRes] = useState(null);
  const [outUrl, setOutUrl] = useState(null);
  const [doneFormat, setDoneFormat] = useState("jpeg");
  const [error, setError] = useState("");
  const inputRef = useRef();

  useEffect(() => () => { srcUrl && URL.revokeObjectURL(srcUrl); }, [srcUrl]);
  useEffect(() => () => { outUrl && URL.revokeObjectURL(outUrl); }, [outUrl]);

  const set = (k) => (v) => { setO((x) => ({ ...x, [k]: v })); setPreset("custom"); };
  const usePreset = (k) => { setPreset(k); setO({ ...ENHANCE_PRESETS[k].v }); };

  async function pickImg(f) {
    if (!f) return;
    setError(""); setRes(null); setOutUrl(null); setDim(null);
    if (!f.type.startsWith("image/")) return setError("File harus berupa gambar (JPG, PNG, atau WebP).");
    if (f.size > MAX_IMG_BYTES) return setError(`Ukuran file ${bytes(f.size)} melebihi batas 30 MB.`);
    try {
      const d = await readImageSize(f);
      setDim(d); setFile(f); setSrcUrl(URL.createObjectURL(f));
      setFormat(f.type === "image/png" ? "png" : "jpeg");
    } catch (e) { setFile(null); setError(e.message); }
  }

  async function run() {
    setBusy(true); setError(""); setRes(null); setOutUrl(null);
    try {
      const r = await enhanceImage(file, { ...o, format, quality }, setStage);
      setRes(r); setOutUrl(URL.createObjectURL(r.blob)); setDoneFormat(format);
    } catch (e) { setError(e.message || "Proses gagal."); }
    finally { setBusy(false); }
  }

  function resetImg() { setFile(null); setDim(null); setSrcUrl(null); setRes(null); setOutUrl(null); setError(""); }

  const target = dim ? outputSize(dim.width, dim.height, o.scale) : null;
  const F = IMG_FORMATS[format];
  const outName = file ? file.name.replace(/\.[^.]+$/, "") + `-enhanced.${IMG_FORMATS[doneFormat].ext}` : "enhanced.jpg";

  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <span className="pill"><Icon d={I.sparkle} size={14} /> Langsung di browser</span>
          <Sticker n={11} size={118} className="hero-stk" />
        </div>
        <h1>Enhance <mark>gambar.</mark></h1>
        <p>Perbesar, pertajam, kurangi noise, dan rapikan warna foto. Tanpa unggah ke server.</p>
        <div className="chips"><span>🔍 Perbesar hingga 4×</span><span>✨ Pertajam</span><span>🎨 Warna otomatis</span></div>
      </section>

      <main className="grid">
        <div className="col">
          <Section n="1" stk={19} title="Pilih gambar" desc="JPG, PNG, atau WebP. Maksimal 30 MB.">
            {!file ? (
              <div
                className={"drop" + (drag ? " over" : "")}
                onClick={() => inputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); pickImg(e.dataTransfer.files[0]); }}
                role="button" tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current.click()}
              >
                <Sticker n={19} size={92} className="drop-stk" />
                <b>Ketuk untuk pilih gambar</b>
                <span className="muted">atau tarik file ke sini</span>
                <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { pickImg(e.target.files[0]); e.target.value = ""; }} />
              </div>
            ) : (
              <div className="file">
                <img className="file-img" src={srcUrl} alt="Gambar yang dipilih" />
                <div className="file-info">
                  <b title={file.name}>{file.name}</b>
                  <span className="muted">{bytes(file.size)}{dim && ` · ${dim.width}×${dim.height}`}</span>
                  <button className="link" onClick={resetImg} disabled={busy}><Icon d={I.refresh} size={14} /> Ganti gambar</button>
                </div>
              </div>
            )}
            {error && <p className="alert">{error}</p>}
          </Section>

          <Section n="2" stk={13} title="Pengaturan" desc="Pilih preset, lalu atur manual bila perlu.">
            <label className="field-label">Preset</label>
            <div className="presets">
              {Object.entries(ENHANCE_PRESETS).map(([k, v]) => (
                <button key={k} type="button" className={"preset" + (preset === k ? " on" : "")} onClick={() => usePreset(k)}>
                  <b>{v.label}</b><small>{v.hint}</small>
                  {k === "auto" && <em className="tag">Disarankan</em>}
                </button>
              ))}
            </div>

            <label className="field-label">Perbesar resolusi</label>
            <div className="seg">
              {[1, 2, 3, 4].map((n) => (
                <button key={n} type="button" className={o.scale === n ? "on" : ""} onClick={() => set("scale")(n)}>{n === 1 ? "Asli" : `${n}×`}</button>
              ))}
            </div>
            {target && (
              <p className="hint">Hasil: <b>{target.w}×{target.h}</b>{target.capped && ` (dibatasi ${MAX_PIXELS / 1e6} megapiksel agar stabil)`}</p>
            )}

            <Slide label="Ketajaman" value={o.sharpen} set={set("sharpen")} />
            <Slide label="Kurangi noise" value={o.denoise} set={set("denoise")} />
            <Slide label="Kecerahan" value={o.bright} set={set("bright")} min={-50} max={50} />
            <Slide label="Kontras" value={o.contrast} set={set("contrast")} min={-50} max={50} />
            <Slide label="Saturasi warna" value={o.sat} set={set("sat")} min={-50} max={50} />

            <label className="check">
              <input type="checkbox" checked={o.auto} onChange={(e) => set("auto")(e.target.checked)} />
              <span><b>Perbaiki pencahayaan otomatis</b><small>Meregangkan bayangan dan highlight agar gambar tidak kusam.</small></span>
            </label>

            <label className="field-label">Format keluaran</label>
            <div className="seg">
              {Object.entries(IMG_FORMATS).map(([k, v]) => (
                <button key={k} type="button" className={format === k ? "on" : ""} onClick={() => setFormat(k)}>{v.label}</button>
              ))}
            </div>
            <p className="hint">{F.hint}</p>
            {format !== "png" && <Slide label="Kualitas simpan" value={quality} set={setQuality} min={60} max={100} unit="%" />}

            <p className="note"><Icon d={I.info} size={14} /> Enhance ini memakai pengolahan gambar klasik, bukan AI. Hasilnya lebih bersih dan tajam, tetapi detail yang memang tidak ada di foto asli tidak bisa dibuat ulang.</p>

            <button className="cta" disabled={!file || busy} onClick={run}>
              <Icon d={I.sparkle} size={18} /> {busy ? "Memproses…" : "Enhance gambar"}
            </button>
          </Section>
        </div>

        <div className="col">
          <Section n="3" stk={17} title="Hasil" desc="Geser garis untuk membandingkan sebelum dan sesudah.">
            {!busy && !res && (
              <div className="empty">
                <Sticker n={6} size={104} className="empty-stk" />
                <p>Hasil enhance akan muncul di sini.</p>
                <span className="muted">Pilih gambar lalu ketuk “Enhance gambar”.</span>
              </div>
            )}
            {busy && (
              <div className="working">
                <Struggle />
                <b>{stage}</b>
                <span className="muted">Jangan tutup tab ini. Gambar besar butuh beberapa detik.</span>
              </div>
            )}
            {!busy && res && (
              <>
                <div className="done-row">
                  <div className="done-badge"><Icon d={I.check} size={16} /> Selesai · {res.width}×{res.height} · {IMG_FORMATS[doneFormat].label}</div>
                  <Sticker n={22} size={62} className="done-stk" />
                </div>
                <Compare before={srcUrl} after={outUrl} w={res.width} h={res.height} />
                <div className="stats">
                  <div><span>Ukuran asli</span><b>{dim.width}×{dim.height}</b></div>
                  <div><span>Ukuran hasil</span><b>{res.width}×{res.height}</b></div>
                  <div><span>Berat file asli</span><b>{bytes(file.size)}</b></div>
                  <div><span>Berat file hasil</span><b>{bytes(res.blob.size)}</b></div>
                </div>
                {res.capped && (
                  <p className="note"><Icon d={I.info} size={14} /> Ukuran hasil dibatasi {MAX_PIXELS / 1e6} megapiksel agar tidak kehabisan memori.</p>
                )}
                <a className="cta" href={outUrl} download={outName}><Icon d={I.download} size={18} /> Unduh {outName}</a>
              </>
            )}
          </Section>
        </div>
      </main>
    </>
  );
}

/* ───────────── Preset Sosmed ───────────── */
const PLATFORMS = [
  {
    k: "tiktok", name: "TikTok", img: "social/tiktok.png", res: "hd", quality: "balanced", format: "mp4",
    spec: "HD 720p · MP4 · Seimbang", star: true,
    tips: ["Pilih HD 720p agar hasil upload lebih maksimal.", "Saat ini TikTok sedang mengalami bug kompresi, jadi video beresolusi lebih tinggi bisa terlihat lebih pecah setelah diunggah.", "Biarkan FPS mengikuti video asli."],
  },
  {
    k: "instagram", name: "Instagram Reels & Story", img: "social/instagram.png", res: "fhd", quality: "balanced", format: "mp4",
    spec: "Full HD 1080p · MP4 · Seimbang",
    tips: ["Video vertikal 9:16 paling pas untuk Reels dan Story.", "Rasio asli dipertahankan, tanpa crop."],
  },
  {
    k: "youtube", name: "YouTube & Shorts", img: "social/youtube.png", round: true, res: "fhd", quality: "max", format: "mp4",
    spec: "Full HD 1080p · MP4 · Maksimal",
    tips: ["Gunakan kualitas Maksimal agar tajam setelah diproses YouTube.", "Pilih 2K bila video asli beresolusi lebih besar dan perangkat kuat."],
  },
  {
    k: "whatsapp", name: "WhatsApp & Status", img: "social/whatsapp.png", res: "hd", quality: "small", format: "mp4",
    spec: "HD 720p · MP4 · Hemat",
    tips: ["Ukuran kecil membuat pengiriman tidak mudah gagal dan hemat kuota."],
  },
  {
    k: "arsip", name: "Arsip & Editing", img: "social/arsip.png", round: true, res: "orig", quality: "max", format: "mkv",
    spec: "Resolusi Asli · MKV · Maksimal",
    tips: ["Tidak menurunkan resolusi. Cocok untuk simpanan atau bahan edit di PC."],
  },
];

function Platforms({ apply }) {
  return (
    <>
      <section className="hero">
        <div className="hero-top">
          <span className="pill"><Icon d={I.target} size={14} /> Sekali ketuk</span>
          <Sticker n={9} size={118} className="hero-stk" />
        </div>
        <h1>Preset <mark>Sosmed</mark></h1>
        <p>Pilih tujuan unggahan, pengaturan terbaiknya langsung disiapkan di Beranda.</p>
      </section>

      <ul className="plat">
        {PLATFORMS.map((p) => (
          <li key={p.k} className={"panel" + (p.star ? " star" : "")}>
            <div className="plat-head">
              {p.img ? <img className={"plat-ic" + (p.round ? " round" : "")} src={`${BASE}${p.img}`} width="46" height="46" alt="" /> : <Sticker n={p.stk} size={46} />}
              <div><h2>{p.name}</h2><span className="spec">{p.spec}</span></div>
              {p.star && <em className="tag in">Penting</em>}
            </div>
            <ul className="facts">
              {p.tips.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <button className="cta" onClick={() => apply({ res: p.res, quality: p.quality, format: p.format })}>
              <Icon d={I.check} size={16} /> Pakai preset {p.name.split(" ")[0]}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ───────────── Tentang ───────────── */
const SOCIALS = [
  ["TikTok", "@ai.agentz", "https://www.tiktok.com/@ai.agentz", "tiktok.png"],
  ["Instagram", "@why_denz", "https://www.instagram.com/why_denz/", "instagram.png"],
  ["Threads", "@why_denz", "https://www.threads.com/@why_denz", "threads.png"],
];

function About() {
  const rows = [
    [I.user, "Nama", "Rayden"],
    [I.clock, "Umur", "Hanya Allah yang tahu"],
    [I.chat, "WhatsApp", <a key="wa" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer">{WA_SHOW}</a>],
    [I.pin, "Alamat", "Menggala, Lampung, Indonesia"],
  ];
  return (
    <>
      <section className="hero center">
        <div className="avatar-wrap">
          <div className="avatar"><img src={LOGO} alt="Foto profil Rayden" /></div>
          <Sticker n={1} size={78} className="avatar-stk" />
        </div>
        <h1>Tentang <mark>Saya</mark></h1>
        <p>Halo, saya Rayden. Senang Anda mampir.</p>
      </section>

      <section className="panel">
        <dl className="profile">
          {rows.map(([ic, k, v]) => (
            <div key={k}>
              <span className="pf-ic"><Icon d={ic} size={18} /></span>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel">
        <header className="panel-head">
          <span className="step"><Icon d={I.target} size={15} /></span>
          <h2>Tujuan web ini</h2>
          <Sticker n={2} size={52} className="ph-stk" />
        </header>
        <p>
          Video Optimizer dibuat supaya siapa pun bisa memperkecil ukuran video tanpa kehilangan ketajamannya,
          tanpa perlu memasang aplikasi, tanpa mendaftar, dan tanpa harus mengunggah video ke server mana pun.
          Semua proses berjalan langsung di browser, jadi privasi tetap aman.
        </p>
        <p>
          Dengan video yang lebih ringan, unggahan ke media sosial jadi lebih cepat, kuota lebih hemat, dan
          pengiriman lewat WhatsApp tidak mudah gagal. Web ini gratis dan akan terus saya perbaiki.
        </p>
        <a className="cta" href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer">
          <Icon d={I.chat} size={18} /> Hubungi lewat WhatsApp
        </a>
      </section>

      <section className="panel">
        <header className="panel-head">
          <span className="step"><Icon d={I.user} size={15} /></span>
          <div>
            <h2>Media sosial</h2>
            <p className="muted">Ikuti dan sapa saya di sini.</p>
          </div>
          <Sticker n={8} size={52} className="ph-stk" />
        </header>
        <ul className="socials">
          {SOCIALS.map(([name, handle, url, img]) => (
            <li key={name}>
              <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${name} ${handle}`}>
                <img src={`${import.meta.env.BASE_URL}social/${img}`} alt="" width="44" height="44" loading="lazy" />
                <span><b>{name}</b><small>{handle}</small></span>
                <Icon d={I.arrow} size={18} />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ───────────── App ───────────── */
export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [preset, setPreset] = useState(null);

  useEffect(() => {
    const on = () => { setPage(pageFromHash()); window.scrollTo({ top: 0 }); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const go = (k) => { window.location.hash = k; };
  const applyPreset = (p) => { setPreset({ ...p, n: Date.now() }); go("beranda"); };
  return (
    <div className="app">
      <Header page={page} go={go} />
      <div className="wrap">
        <a className="promo" href={PROMO_URL} target="_blank" rel="noopener noreferrer"
           aria-label="Mau tahu cara bikin video motion graphic menggunakan Remotion? Cuma pakai ChatGPT dan Claude, gratisan. Klik di sini.">
          <img src={`${BASE}banner.jpg`} width="1400" height="700" alt="Banner tutorial video motion graphic Remotion gratis dengan ChatGPT dan Claude" />
        </a>
        {/* Beranda tetap terpasang agar proses kompresi tidak hilang saat pindah menu */}
        <div hidden={page !== "beranda"}><Home preset={preset} /></div>
        <div hidden={page !== "enhance"}><Enhance /></div>
        {page === "platform" && <Platforms apply={applyPreset} />}
        {page === "cara" && <HowTo go={go} />}
        {page === "tentang" && <About />}
      </div>
      <Footer />
    </div>
  );
}
