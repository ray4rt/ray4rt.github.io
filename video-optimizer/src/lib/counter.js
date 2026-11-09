// Penghitung total video yang sudah dioptimasi.
// Memakai layanan counter publik Abacus (tanpa akun, CORS terbuka).
// Setiap video yang selesai dikompres menambah hitungan satu.

const BASE = "https://abacus.jasoncameron.dev";
const NAMESPACE = "dzmethod-video-optimizer"; // ganti bila ingin counter baru
const KEY = "video-dioptimasi";

// Angka awal yang ditampilkan. Total = START + hitungan di layanan.
const START = 17859;

const TIMEOUT_MS = 6000;

async function call(path) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(`${BASE}${path}`, { signal: ctrl.signal });
    if (r.status === 404) return 0; // counter belum dibuat, anggap 0
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    return Number(data.value) || 0;
  } finally {
    clearTimeout(t);
  }
}

/** Total video dioptimasi saat ini. Mengembalikan null bila gagal. */
export async function getTotal() {
  try { return START + (await call(`/get/${NAMESPACE}/${KEY}`)); } catch { return null; }
}

/** Catat satu video selesai dioptimasi. Mengembalikan total terbaru, atau null bila gagal. */
export async function countVideo() {
  try { return START + (await call(`/hit/${NAMESPACE}/${KEY}`)); } catch { return null; }
}
