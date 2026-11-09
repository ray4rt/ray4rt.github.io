/* Enhance gambar langsung di browser (Canvas, tanpa unggah, tanpa dependensi).
   Alur: kurangi noise -> perbesar bertahap (kualitas tinggi) -> koreksi warna/kontras -> pertajam.
   Catatan: ini peningkatan klasik (bukan AI), jadi hasilnya lebih bersih dan tajam,
   tetapi detail yang memang tidak ada di foto asli tidak bisa "diciptakan". */

export const MAX_IMG_BYTES = 30 * 1024 * 1024; // 30 MB
export const MAX_PIXELS = 12_000_000;          // batas aman memori, termasuk di HP

export const IMG_FORMATS = {
  jpeg: { label: "JPG",  ext: "jpg",  mime: "image/jpeg", hint: "Ukuran paling kecil. Cocok untuk foto dan unggahan media sosial." },
  png:  { label: "PNG",  ext: "png",  mime: "image/png",  hint: "Tanpa kehilangan kualitas, ukuran lebih besar. Cocok untuk teks dan grafis." },
  webp: { label: "WebP", ext: "webp", mime: "image/webp", hint: "Kecil dan tajam, tetapi tidak diterima semua aplikasi." },
};

export const ENHANCE_PRESETS = {
  auto:  { label: "Otomatis",       hint: "Seimbang untuk kebanyakan foto.",              v: { scale: 2, sharpen: 50, denoise: 20, auto: true,  bright: 0, contrast: 5,  sat: 8 } },
  blur:  { label: "Foto Buram",     hint: "Pertajam lebih kuat dan redam bintik noise.",  v: { scale: 2, sharpen: 75, denoise: 35, auto: true,  bright: 0, contrast: 8,  sat: 5 } },
  text:  { label: "Teks / Dokumen", hint: "Garis huruf tegas dan latar lebih bersih.",    v: { scale: 2, sharpen: 85, denoise: 0,  auto: true,  bright: 5, contrast: 25, sat: -20 } },
  vivid: { label: "Warna Hidup",    hint: "Warna dan kontras lebih hidup, ukuran tetap.", v: { scale: 1, sharpen: 35, denoise: 10, auto: true,  bright: 0, contrast: 12, sat: 25 } },
};

const tick = () => new Promise((r) => setTimeout(r, 0));
const clamp8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

/* Ukuran gambar tanpa memproses */
export async function readImageSize(file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { throw new Error("Gambar tidak bisa dibaca browser. Gunakan JPG, PNG, atau WebP."); }
  const size = { width: bmp.width, height: bmp.height };
  bmp.close?.();
  return size;
}

/* Hitung ukuran keluaran dengan batas piksel */
export function outputSize(w, h, scale) {
  let f = scale;
  let capped = false;
  if (w * h * f * f > MAX_PIXELS) { f = Math.sqrt(MAX_PIXELS / (w * h)); capped = true; }
  return { w: Math.max(1, Math.round(w * f)), h: Math.max(1, Math.round(h * f)), f, capped };
}

/* ── Kurangi noise: filter bilateral 3x3 (menjaga tepi) ── */
function denoise(img, amount) {
  const { data, width: w, height: h } = img;
  const sigma = 8 + amount * 0.55;
  const inv = 1 / (2 * sigma * sigma);
  const lut = new Float32Array(256);
  for (let d = 0; d < 256; d++) lut[d] = Math.exp(-d * d * inv);
  const passes = amount > 60 ? 2 : 1;
  let src = data;
  for (let p = 0; p < passes; p++) {
    const out = new Uint8ClampedArray(src.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const r0 = src[i], g0 = src[i + 1], b0 = src[i + 2];
        let ws = 0, ar = 0, ag = 0, ab = 0;
        for (let dy = -1; dy <= 1; dy++) {
          const yy = y + dy < 0 ? 0 : y + dy >= h ? h - 1 : y + dy;
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx < 0 ? 0 : x + dx >= w ? w - 1 : x + dx;
            const j = (yy * w + xx) * 4;
            const r = src[j], g = src[j + 1], b = src[j + 2];
            const d = ((Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0)) / 3) | 0;
            const wt = lut[d];
            ws += wt; ar += r * wt; ag += g * wt; ab += b * wt;
          }
        }
        out[i] = ar / ws; out[i + 1] = ag / ws; out[i + 2] = ab / ws; out[i + 3] = src[i + 3];
      }
    }
    src = out;
  }
  // campur dengan asli sesuai kekuatan
  const mix = Math.min(1, 0.35 + amount / 100);
  for (let i = 0; i < data.length; i += 4) {
    data[i]     = data[i]     + (src[i]     - data[i])     * mix;
    data[i + 1] = data[i + 1] + (src[i + 1] - data[i + 1]) * mix;
    data[i + 2] = data[i + 2] + (src[i + 2] - data[i + 2]) * mix;
  }
}

/* ── Koreksi tonal: auto-levels + kecerahan + kontras (LUT), lalu saturasi ── */
function tone(img, { auto, bright, contrast, sat }) {
  const { data } = img;
  let lo = 0, hi = 255;
  if (auto) {
    const hist = new Uint32Array(256);
    for (let i = 0; i < data.length; i += 4) hist[(data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8]++;
    const total = data.length / 4;
    let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= total * 0.005) { lo = v; break; } }
    acc = 0;
    for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= total * 0.005) { hi = v; break; } }
    if (hi - lo < 40) { lo = 0; hi = 255; } // gambar sudah datar/gelap total: jangan diregangkan
  }
  const cf = 1 + contrast / 100;
  const bo = bright * 1.5;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let o = v;
    if (auto && (lo > 0 || hi < 255)) {
      const st = ((v - lo) * 255) / (hi - lo);
      o = v + (clamp8(st) - v) * 0.7;
    }
    o = (o - 128) * cf + 128 + bo;
    lut[v] = o;
  }
  const sf = 1 + sat / 100;
  const doSat = sat !== 0;
  for (let i = 0; i < data.length; i += 4) {
    let r = lut[data[i]], g = lut[data[i + 1]], b = lut[data[i + 2]];
    if (doSat) {
      const gray = (r * 77 + g * 150 + b * 29) / 256;
      r = gray + (r - gray) * sf; g = gray + (g - gray) * sf; b = gray + (b - gray) * sf;
    }
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
}

/* ── Blur kotak (3x lewat = hampir Gaussian) untuk unsharp mask ── */
function blurH(src, dst, w, h, r) {
  const d = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const base = y * w * 4;
    let s0 = 0, s1 = 0, s2 = 0;
    for (let k = -r; k <= r; k++) {
      const x = k < 0 ? 0 : k >= w ? w - 1 : k;
      const i = base + x * 4;
      s0 += src[i]; s1 += src[i + 1]; s2 += src[i + 2];
    }
    for (let x = 0; x < w; x++) {
      const o = base + x * 4;
      dst[o] = s0 / d; dst[o + 1] = s1 / d; dst[o + 2] = s2 / d;
      const a = base + Math.min(x + r + 1, w - 1) * 4;
      const b = base + Math.max(x - r, 0) * 4;
      s0 += src[a] - src[b]; s1 += src[a + 1] - src[b + 1]; s2 += src[a + 2] - src[b + 2];
    }
  }
}
function blurV(src, dst, w, h, r) {
  const d = 2 * r + 1;
  const sum = new Float32Array(w * 3);
  for (let k = -r; k <= r; k++) {
    const y = k < 0 ? 0 : k >= h ? h - 1 : k;
    const base = y * w * 4;
    for (let x = 0; x < w; x++) {
      const i = base + x * 4;
      sum[x * 3] += src[i]; sum[x * 3 + 1] += src[i + 1]; sum[x * 3 + 2] += src[i + 2];
    }
  }
  for (let y = 0; y < h; y++) {
    const base = y * w * 4;
    const ia = Math.min(y + r + 1, h - 1) * w * 4;
    const ib = Math.max(y - r, 0) * w * 4;
    for (let x = 0; x < w; x++) {
      const o = base + x * 4, s = x * 3;
      dst[o] = sum[s] / d; dst[o + 1] = sum[s + 1] / d; dst[o + 2] = sum[s + 2] / d;
      const a = ia + x * 4, b = ib + x * 4;
      sum[s] += src[a] - src[b]; sum[s + 1] += src[a + 1] - src[b + 1]; sum[s + 2] += src[a + 2] - src[b + 2];
    }
  }
}

/* ── Unsharp mask pada luminans (tidak menambah noise warna) ── */
function sharpen(img, amount, radius) {
  const { data, width: w, height: h } = img;
  const a = new Uint8ClampedArray(data);
  const b = new Uint8ClampedArray(data.length);
  for (let p = 0; p < 3; p++) { blurH(a, b, w, h, radius); blurV(b, a, w, h, radius); }
  const k = (amount / 100) * 1.4;
  const thr = 2;
  for (let i = 0; i < data.length; i += 4) {
    const l0 = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
    const l1 = (a[i] * 77 + a[i + 1] * 150 + a[i + 2] * 29) >> 8;
    let diff = l0 - l1;
    if (diff > -thr && diff < thr) continue;
    diff *= k;
    data[i] += diff; data[i + 1] += diff; data[i + 2] += diff;
  }
}

/* Jalankan seluruh proses. opts: scale, sharpen, denoise, auto, bright, contrast, sat, format, quality */
export async function enhanceImage(file, opts, onStage) {
  const { scale, format = "jpeg", quality = 92 } = opts;
  onStage?.("Membaca gambar…");
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch { throw new Error("Gambar tidak bisa dibaca browser. Gunakan JPG, PNG, atau WebP."); }

  const { w: ow, h: oh, f, capped } = outputSize(bmp.width, bmp.height, scale);
  const flat = format === "jpeg";

  // 1) kanvas sumber (ukuran asli, atau lebih kecil bila melewati batas piksel)
  const sw = capped && f < 1 ? ow : bmp.width;
  const sh = capped && f < 1 ? oh : bmp.height;
  let cur = document.createElement("canvas");
  cur.width = sw; cur.height = sh;
  let ctx = cur.getContext("2d", { willReadFrequently: true });
  if (flat) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, sw, sh); }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bmp, 0, 0, sw, sh);
  bmp.close?.();

  // 2) kurangi noise di ukuran kecil (lebih cepat dan lebih efektif)
  if (opts.denoise > 0) {
    onStage?.("Mengurangi noise…"); await tick();
    const img = ctx.getImageData(0, 0, sw, sh);
    denoise(img, opts.denoise);
    ctx.putImageData(img, 0, 0);
  }

  // 3) perbesar bertahap (maks 2x per langkah agar tetap halus)
  if (ow > sw || oh > sh) {
    onStage?.("Memperbesar resolusi…"); await tick();
    while (cur.width < ow || cur.height < oh) {
      const nw = Math.min(ow, cur.width * 2), nh = Math.min(oh, cur.height * 2);
      const next = document.createElement("canvas");
      next.width = nw; next.height = nh;
      const nctx = next.getContext("2d", { willReadFrequently: true });
      nctx.imageSmoothingEnabled = true; nctx.imageSmoothingQuality = "high";
      nctx.drawImage(cur, 0, 0, nw, nh);
      cur = next; ctx = nctx;
      await tick();
    }
  }

  // 4) warna & kontras, lalu 5) ketajaman
  const needTone = opts.auto || opts.bright || opts.contrast || opts.sat;
  const needSharp = opts.sharpen > 0;
  if (needTone || needSharp) {
    const img = ctx.getImageData(0, 0, cur.width, cur.height);
    if (needTone) { onStage?.("Menyesuaikan warna & kontras…"); await tick(); tone(img, opts); }
    if (needSharp) {
      onStage?.("Mempertajam detail…"); await tick();
      const radius = Math.max(1, Math.round(0.8 + (cur.width / Math.max(1, sw)) * 0.6));
      sharpen(img, opts.sharpen, radius);
    }
    ctx.putImageData(img, 0, 0);
  }

  onStage?.("Menyimpan hasil…"); await tick();
  const F = IMG_FORMATS[format];
  const blob = await new Promise((res) => cur.toBlob(res, F.mime, format === "png" ? undefined : quality / 100));
  if (!blob) throw new Error("Gagal menyimpan hasil. Coba format lain atau gambar yang lebih kecil.");
  return { blob, width: cur.width, height: cur.height, capped };
}
