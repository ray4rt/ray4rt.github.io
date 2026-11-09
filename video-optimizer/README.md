# Video Optimizer

Kompres video tetap HD untuk media sosial. Semua proses berjalan di browser (ffmpeg.wasm), file tidak diunggah ke server.

## Menjalankan lewat terminal
Butuh Node.js 18+ dan npm.
```bash
npm install          # sekali saja
npm run dev          # http://localhost:5173
npm run dev -- --host   # akses dari HP di Wi-Fi yang sama
npm run build        # hasil di dist/, siap di-hosting statis
npm run preview      # uji hasil build di http://localhost:4173
```

## Fitur
- Tema mobile: hijau muda, kuning muda, putih, dengan bayangan hitam
- Menu header: Beranda, Enhance Gambar, Preset Sosmed, Cara Menggunakan, Tentang
- Resolusi maksimal: HD 720p / Full HD 1080p / 2K 1440p / Asli (tidak pernah diperbesar)
- Rasio bebas: rasio asli video dipertahankan, tanpa crop dan tanpa stretch
- Frame rate: otomatis terdeteksi dan mengikuti asli; pilihan 24 / 30 / 60 fps (plus 90 untuk video >90 fps)
- Format keluaran: MP4, MOV, MKV (H.264 + AAC) dan WebM (VP9 + Opus)
- Opsi hapus audio (tanpa suara)
- Metadata cadangan lewat ffmpeg bila browser tidak bisa membaca file (mis. MKV)
- Batas ukuran file 200 MB
- Kualitas: Maksimal / Seimbang / Hemat, plus kecepatan proses (lanjutan)
- Perbandingan asli vs hasil, statistik ukuran, bitrate, dan penghematan
- Catatan TikTok: untuk upload ke TikTok pilih HD 720p (TikTok sedang ada bug kompresi). Tampil di pengaturan resolusi, hasil, Cara Menggunakan, dan Preset Sosmed
- Enhance Gambar: perbesar 1×–4×, pertajam (unsharp mask), kurangi noise, auto pencahayaan, kecerahan/kontras/saturasi, ekspor JPG/PNG/WebP, perbandingan geser. Pengolahan klasik di Canvas (bukan AI), maks. 12 megapiksel
- Preset Sosmed: pengaturan siap pakai untuk TikTok, Instagram, YouTube, WhatsApp, dan arsip (otomatis mengisi Beranda)

## Banner & stiker
- Banner promo di bagian atas semua halaman: `public/banner.jpg`, tautan diatur lewat `PROMO_URL` di `src/App.jsx`.
- 30 stiker kawaii ada di `public/stickers/s01.png` sampai `s30.png`, dipakai di menu, judul halaman, dan footer.
- Animasi karakter kesusahan saat kompres ada di komponen `Struggle` (`src/App.jsx`); gayanya di `src/styles.css`.

## Aset
Logo dan favicon ada di `public/` (`logo.png`, `favicon.png`, `favicon.ico`, `apple-touch-icon.png`).
Foto oval di halaman Tentang memakai `public/logo.png`; ganti file itu untuk mengganti foto.

## Catatan
- ffmpeg.wasm berjalan single-thread; video panjang butuh waktu lebih lama.
- Mesin kompresi diunduh dari unpkg.com saat pertama kali dipakai.
