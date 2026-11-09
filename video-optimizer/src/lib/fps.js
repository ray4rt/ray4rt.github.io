/* Hitung FPS nominal (kecepatan frame sebenarnya saat video bergerak) dari keluaran
   `ffmpeg -f framecrc`. Rata-rata header (avg fps) menyesatkan pada video VFR, mis. rekaman
   HP/layar 60 fps yang sering diam, sehingga terbaca 30. Di sini yang dihitung adalah interval
   frame yang rapat saja, jadi bagian diam / frame yang hilang tidak menurunkan hasil. */
const STANDARD = [23.976, 24, 25, 29.97, 30, 48, 50, 59.94, 60, 72, 90, 100, 119.88, 120, 144, 240];

export function snapFps(v) {
  let best = null;
  for (const s of STANDARD) if (Math.abs(v - s) / s <= 0.03 && (best === null || Math.abs(v - s) < Math.abs(v - best))) best = s;
  return best ?? Math.round(v * 100) / 100;
}

export function nominalFpsFromFramecrc(text) {
  const tb = text.match(/#tb 0:\s*(\d+)\/(\d+)/);
  if (!tb) return null;
  const unit = Number(tb[1]) / Number(tb[2]);
  const pts = [];
  for (const line of text.split("\n")) {
    if (!line || line[0] === "#") continue;
    const v = Number(line.split(",")[1]);
    if (Number.isFinite(v)) pts.push(v);
  }
  const sorted = [...new Set(pts)].sort((a, b) => a - b);
  const deltas = [];
  for (let i = 1; i < sorted.length; i++) deltas.push(sorted[i] - sorted[i - 1]);
  if (deltas.length < 6) return null;
  const asc = [...deltas].sort((a, b) => a - b);
  const m = asc[Math.floor(asc.length * 0.25)];
  const fast = deltas.filter((d) => d >= m * 0.5 && d <= m * 1.5); // abaikan glitch timestamp yang terlalu rapat
  const avg = fast.reduce((a, b) => a + b, 0) / fast.length;
  const fps = 1 / (avg * unit);
  return fps > 0 && fps < 1000 ? snapFps(fps) : null;
}
