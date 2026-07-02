# Handbook Kesiapan Akreditasi RS — RSP CPL USU

Web app statis (vanilla HTML/CSS/JS, tanpa framework) berisi sarikan handbook
kesiapan akreditasi rumah sakit berbasis peran, untuk orientasi internal seluruh
personel RS.

## Fitur
- **Pencarian kata kunci** lintas seluruh konten (profesi + bagian umum).
- **Checklist self-assessment** per profesi dan pada bagian umum; status
  disimpan di `localStorage` per perangkat, dengan tombol reset.
- **Mode cetak** per profesi / bagian umum (print-friendly).
- **Responsif** / mobile-friendly.

## Struktur
```
.
├── index.html        # Kerangka tunggal: header + pencarian, area konten, footer
├── content.json      # SATU-SATUNYA sumber data — cukup edit ini untuk update konten
├── assets/
│   ├── styles.css    # Gaya + @media print + responsif
│   └── app.js        # Routing hash, render, pencarian, checklist localStorage
└── README.md
```

Rute (hash-based, tetap statis):
- `#/` — beranda (pilih profesi + bagian umum)
- `#/profesi/<id>` — handbook profesi (tab: Kompetensi / Bukti / Surveior / Checklist)
- `#/umum` — kelompok standar, SKP, PROGNAS, skoring, checklist umum
- `#/cari?q=<kata>` — hasil pencarian

## Menjalankan secara lokal
Aplikasi membaca `content.json` via `fetch`, jadi harus dilayani lewat HTTP
(bukan `file://`). Contoh:
```bash
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Hosting
Cukup unggah seluruh berkas apa adanya ke **GitHub Pages** atau server statis
internal RS. Tidak ada proses build.

## Memperbarui konten
Semua teks berasal dari `content.json`. Ubah nilainya (tugas inti, poin
standar, bukti, pertanyaan surveior, dsb.) tanpa menyentuh HTML/JS. Struktur
per profesi: `id`, `judul`, `ruang`, `standar[]`, `tugasInti[]`,
`poin[]` (blok `{std, isi[]}`), `bukti[]`, `surveior[]`.

## Catatan sumber & batasan
Isi adalah **sarikan** dari Standar Akreditasi Rumah Sakit (KMK RI No.
HK.01.07/MENKES/1596/2024) dan Instrumen Survei Akreditasi Rumah Sakit (Kepdirjen
Yankes No. HK.02.02/D/47104/2024, 30 Desember 2024) untuk orientasi internal —
**bukan pengganti** teks standar/instrumen asli beserta Elemen Penilaian (EP),
maksud-tujuan, dan daftar kelengkapan bukti yang lengkap. Nomor EP spesifik
sengaja tidak dicantumkan karena perlu verifikasi langsung dari dokumen resmi.
Disclaimer ini tampil di footer setiap halaman aplikasi.

Checklist tersimpan **lokal di perangkat masing-masing** (localStorage), tidak
terpusat dan tidak terkirim ke server.
