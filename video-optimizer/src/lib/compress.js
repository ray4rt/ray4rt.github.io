import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { nominalFpsFromFramecrc } from "./fps.js";

/* Batas yang berlaku di aplikasi ini */
export const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

/* FPS: default ikuti file asli. Pilihan 24 / 30 / 60 selalu tersedia; 90 muncul untuk video
   di atas 90 fps. Memilih fps di atas fps asli hanya menggandakan frame (tidak lebih halus). */
export const FPS_STEPS = [24, 30, 60];
export const fpsOptions = (src) => (src && src > 90.5 ? [...FPS_STEPS, 90] : FPS_STEPS);
export const isFpsChange = (src, fps) => typeof fps === "number" && (!src || Math.abs(fps - src) > 0.5);

/* Format keluaran */
export const FORMATS = {
  mp4:  { label: "MP4",  ext: "mp4",  mime: "video/mp4",        codec: "H.264 + AAC", hint: "Paling kompatibel: Instagram, TikTok, YouTube, WhatsApp, semua HP dan komputer." },
  mov:  { label: "MOV",  ext: "mov",  mime: "video/quicktime",  codec: "H.264 + AAC", hint: "Cocok untuk perangkat Apple dan aplikasi edit seperti iMovie atau Final Cut." },
  mkv:  { label: "MKV",  ext: "mkv",  mime: "video/x-matroska", codec: "H.264 + AAC", hint: "Fleksibel untuk arsip dan pemutar PC (VLC). Tidak diterima sebagian besar media sosial." },
  webm: { label: "WebM", ext: "webm", mime: "video/webm",       codec: "VP9 + Opus",  hint: "Untuk web. Proses jauh lebih lama di browser dan tidak diterima Instagram, TikTok, atau WhatsApp." },
};

/* Kecepatan VP9: libvpx sangat lambat di wasm, jadi dipetakan ke cpu-used yang lebih tinggi */
const VP9_SPEED = {
  veryfast: ["-deadline", "realtime", "-cpu-used", "8"],
  fast:     ["-deadline", "good", "-cpu-used", "5"],
  medium:   ["-deadline", "good", "-cpu-used", "3"],
};

function codecArgs({ format, res, quality, speed, rate, mute }) {
  const crf = crfFor(res, quality);
  const a = [];
  if (format === "webm") {
    a.push("-c:v", "libvpx-vp9", ...VP9_SPEED[speed], "-b:v", `${rate}M`, "-crf", String(Math.min(45, crf + 10)), "-pix_fmt", "yuv420p");
    a.push(...(mute ? ["-an"] : ["-c:a", "libopus", "-b:a", "128k", "-ar", "48000"]));
  } else {
    a.push("-c:v", "libx264", "-profile:v", "high", "-preset", speed, "-crf", String(crf),
      "-maxrate", `${rate}M`, "-bufsize", `${rate * 2}M`, "-pix_fmt", "yuv420p");
    a.push(...(mute ? ["-an"] : ["-c:a", "aac", "-b:a", "128k", "-ar", "48000"]));
    if (format !== "mkv") a.push("-movflags", "+faststart");
  }
  return a;
}
export const fmtFps = (n) => String(Math.round(n * 100) / 100);

/* Resolusi = batas sisi PENDEK video, jadi rasio bebas (9:16, 16:9, 1:1, 21:9, dst).
   Video tidak pernah diperbesar dan tidak pernah dipotong. */
export const RESOLUTIONS = {
  hd:   { label: "HD 720p",       short: 720,  crf: 22, maxrate: 6 },
  fhd:  { label: "Full HD 1080p", short: 1080, crf: 21, maxrate: 12 },
  qhd:  { label: "2K 1440p",      short: 1440, crf: 21, maxrate: 20 },
  orig: { label: "Asli",          short: Infinity, crf: 20, maxrate: 24 },
};

export const QUALITY = {
  max:      { label: "Maksimal", offset: -2, hint: "Paling tajam, ukuran terbesar. Cocok untuk visual sinematik atau teks kecil." },
  balanced: { label: "Seimbang", offset: 0,  hint: "Rekomendasi. Tetap HD dengan ukuran wajar untuk hampir semua konten." },
  small:    { label: "Hemat",    offset: 3,  hint: "File lebih kecil dan cepat diunggah. Detail halus sedikit berkurang." },
};

export const SPEEDS = {
  veryfast: { label: "Cepat",  hint: "Proses tercepat, efisiensi ukuran standar." },
  fast:     { label: "Sedang", hint: "Keseimbangan antara waktu proses dan ukuran file." },
  medium:   { label: "Teliti", hint: "Paling efisien, tetapi bisa 2–3× lebih lama di browser." },
};

export const crfFor = (res, quality) =>
  Math.min(30, Math.max(14, RESOLUTIONS[res].crf + QUALITY[quality].offset));

/* Bitrate maksimum (Mbps); fps tinggi diberi ruang lebih besar */
export const rateFor = (res, outFps) =>
  Math.round(RESOLUTIONS[res].maxrate * Math.min(2, Math.max(1, (outFps || 30) / 60)));

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

/* Hitung ukuran keluaran: sisi pendek dibatasi, rasio dijaga, tanpa upscale */
export function targetSize({ width, height }, res) {
  const short = Math.min(width, height);
  const f = Math.min(1, RESOLUTIONS[res].short / short);
  return { w: even(width * f), h: even(height * f), scaled: f < 1 };
}

/* Baca metadata (resolusi & durasi) tanpa memuat ffmpeg */
export function readMeta(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve({ width: v.videoWidth, height: v.videoHeight, duration: v.duration });
      URL.revokeObjectURL(url);
    };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Format video tidak bisa dibaca browser.")); };
    v.src = url;
  });
}

let ffmpeg;
async function getFFmpeg() {
  if (ffmpeg) return ffmpeg;
  const ff = new FFmpeg();
  const base = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
  await ff.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
  });
  ffmpeg = ff;
  return ff;
}

export function cancelCompress() {
  ffmpeg?.terminate();
  ffmpeg = null;
}

/* Beri ffmpeg akses ke file. WORKERFS membaca file langsung (tanpa menyalin ke memori);
   bila tidak tersedia, jatuh ke penyalinan biasa. */
async function useInput(ff, file) {
  const ext = file.name.match(/\.[^.]+$/)?.[0] || ".mp4";
  const name = "input" + ext;
  try {
    try { await ff.createDir("/work"); } catch { /* sudah ada */ }
    await ff.mount("WORKERFS", { files: [new File([file], name, { type: file.type })] }, "/work");
    return {
      path: `/work/${name}`,
      cleanup: async () => {
        try { await ff.unmount("/work"); } catch { /* abaikan */ }
        try { await ff.deleteDir("/work"); } catch { /* abaikan */ }
      },
    };
  } catch {
    await ff.writeFile(name, await fetchFile(file));
    return { path: name, cleanup: async () => { try { await ff.deleteFile(name); } catch { /* abaikan */ } } };
  }
}

/* Baca fps asli. Utama: ukur timestamp tiap frame (stream copy, tanpa decode, cepat) sehingga
   video VFR 60 fps tidak salah terbaca 30. Cadangan: angka fps dari header file. */
async function probeFps(ff, path) {
  let text = "";
  const grab = ({ message }) => { text += message + "\n"; };
  ff.on("log", grab);
  try { await ff.exec(["-hide_banner", "-i", path]); } catch { /* ffmpeg keluar dengan error karena tanpa output; itu normal */ }
  ff.off("log", grab);

  // stream video utama = video pertama yang bukan gambar sampul
  const line = text.split("\n").find((l) => /Stream #0:\d+.*Video:/.test(l) && !/attached pic/.test(l)) || "";
  const idx = line.match(/Stream #0:(\d+)/)?.[1] ?? "0";
  const m = line.match(/(\d+(?:\.\d+)?)\s*fps/) || line.match(/(\d+(?:\.\d+)?)\s*tbr/);
  const header = m ? parseFloat(m[1]) : null;

  let measured = null;
  try {
    const code = await ff.exec(["-hide_banner", "-i", path, "-map", `0:${idx}`, "-t", "60", "-c", "copy", "-f", "framecrc", "fc.txt"]);
    if (code === 0) measured = nominalFpsFromFramecrc(await ff.readFile("fc.txt", "utf8"));
  } catch { /* pakai angka header */ }
  try { await ff.deleteFile("fc.txt"); } catch { /* abaikan */ }

  const v = measured || header;
  const fps = v && v > 0 && v < 1000 ? v : null;

  // Cadangan metadata bila browser tidak bisa membaca file (mis. MKV di Safari/Firefox)
  let width = null, height = null, duration = null;
  const wh = line.match(/,\s*(\d{2,5})x(\d{2,5})/);
  if (wh) { width = +wh[1]; height = +wh[2]; }
  const rot = Math.abs(parseFloat((text.match(/rotation of (-?\d+(?:\.\d+)?) degrees/) || [])[1] || 0));
  if (rot % 180 === 90) [width, height] = [height, width];
  const d = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (d) duration = +d[1] * 3600 + +d[2] * 60 + parseFloat(d[3]);
  return { fps, width, height, duration };
}

/* Auto deteksi FPS (dan metadata cadangan) file asli. Mengembalikan {fps,width,height,duration}. */
export async function detectFps(file) {
  const ff = await getFFmpeg();
  const inp = await useInput(ff, file);
  try { return await probeFps(ff, inp.path); } finally { await inp.cleanup(); }
}

/* fps: "orig" (ikuti asli) atau angka fps tujuan. meta.fps = fps asli hasil deteksi. */
export async function compressVideo(file, { meta, res, quality, speed, fps = "orig", format = "mp4", mute = false, onProgress, onStage }) {
  const r = RESOLUTIONS[res];
  onStage?.("Memuat mesin kompresi…");
  const ff = await getFFmpeg();

  onStage?.("Membaca file video…");
  const inp = await useInput(ff, file);

  const srcFps = meta.fps || null;
  const changed = isFpsChange(srcFps, fps);
  const outFps = changed ? fps : srcFps;
  const F = FORMATS[format];
  const outFile = `out.${F.ext}`;

  const filters = [];
  const { w, h } = targetSize(meta, res);
  if (w !== meta.width || h !== meta.height) filters.push(`scale=${w}:${h}:flags=lanczos`);
  if (changed) filters.push(`fps=${fps}`);

  /* fps tinggi butuh bitrate lebih besar agar tetap tajam */
  const rate = rateFor(res, outFps);

  const handler = ({ progress }) => onProgress?.(Math.min(1, Math.max(0, progress)));
  ff.on("progress", handler);

  onStage?.("Mengompres video…");
  const args = ["-i", inp.path];
  if (filters.length) args.push("-vf", filters.join(","));
  args.push(...codecArgs({ format, res, quality, speed, rate, mute }), outFile);
  let code;
  try { code = await ff.exec(args); } finally { ff.off("progress", handler); }
  if (code !== 0) { await inp.cleanup(); throw new Error("Proses kompresi gagal. Coba format keluaran lain, resolusi lebih rendah, atau file video lain."); }

  const data = await ff.readFile(outFile);
  await inp.cleanup();
  await ff.deleteFile(outFile);
  return new Blob([data.buffer], { type: F.mime });
}
