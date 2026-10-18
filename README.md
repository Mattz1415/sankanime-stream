# ⚡ NexusAnime - Futuristic Anime Streaming Platform

Aplikasi web streaming anime gratis modern dengan **Desain Flutter Futuristik (Cyberpunk Glassmorphism)** yang ditenagai oleh **SankaVollerei REST API**, dibangun menggunakan **Next.js (App Router)** dan siap di-deploy langsung ke **Vercel** (`vercel.app`).

---

## ✨ Fitur Utama

- 🎨 **Desain Flutter Futuristik:**
  - **Floating Glassmorphism Bottom Navigation Bar** bergaya Flutter dengan glowing active indicator dan center Floating Action Button (FAB).
  - **Sliver Cyber Top Bar** dengan efek blur (`backdrop-blur-xl`) dan status koneksi API live.
  - **Flutter Cards** dengan sudut membulat modern (`rounded-flutter`), efek glow neon saat hover, dan ripple tactile feedback.
  - **Futuristic HUD Video Player** dengan mode Bioskop (Theater Mode) dan border beranimasi.
- ⚡ **Integrasi SankaVollerei Anime REST API:**
  - **CORS & Bot Bypass:** Dilengkapi Next.js Proxy Route Handlers (`/api/*`) dengan User-Agent & Header spoofing untuk menghindari proteksi *Plana AI Detector*.
  - **Smart Serverless Caching:** Menggunakan cache in-memory untuk mematuhi rate-limit 45 req/menit dari SankaVollerei API dan mempercepat response time.
- 🎬 **Multi-Server Streaming & Resolusi:**
  - Dukungan berganti server secara langsung (Vidhide, Mega, DesuStream, ODCDN) dan pemilihan resolusi (360p, 480p, 720p).
  - Navigasi Episode Sebelumnya dan Selanjutnya secara mulus.
- 🕒 **Fitur "Lanjut Nonton" & Favorit (Offline Sync):**
  - Riwayat tontonan dan bookmark tersimpan aman di `localStorage` tanpa perlu registrasi akun.
  - Indikator episode yang sudah ditonton langsung di halaman seri.
- 📅 **Jadwal Rilis Anime Terjadwal:**
  - Pemilihan hari (Senin - Minggu) untuk mengecek jadwal rilis episode anime favorit.
- 🔍 **Pencarian Cepat:**
  - Pencarian instan dilengkapi dengan chip rekomendasi anime populer.

---

## 📂 Struktur Direktori Proyek

```
sankanime-stream/
├── app/
│   ├── api/                   # Serverless Proxy API Routes (Bypass CORS & Plana)
│   │   ├── anime/[id]/        # Detail anime endpoint
│   │   ├── complete/          # Anime tamat endpoint
│   │   ├── episode/[id]/      # Streaming episode endpoint
│   │   ├── home/              # Beranda (ongoing + complete)
│   │   ├── ongoing/           # Anime ongoing endpoint
│   │   ├── schedule/          # Jadwal rilis endpoint
│   │   ├── search/            # Pencarian endpoint
│   │   └── server/[id]/       # Stream server link endpoint
│   ├── anime/[id]/            # Halaman detail anime & daftar episode
│   ├── complete/              # Halaman anime tamat
│   ├── ongoing/               # Halaman anime sedang tayang
│   ├── saved/                 # Halaman koleksi favorit & riwayat tontonan
│   ├── schedule/              # Halaman jadwal rilis anime
│   ├── search/                # Halaman pencarian
│   ├── watch/[id]/            # Halaman HUD Video Player & multi-server
│   ├── globals.css            # Custom CSS, Glassmorphism, Neon glow
│   ├── layout.tsx             # Root Layout (Shell navigasi Flutter)
│   └── page.tsx               # Beranda utama & Hero Banner Carousel
├── components/
│   ├── AnimeCard.tsx          # Kartu anime bergaya Flutter
│   ├── CyberNavbar.tsx        # Top App Bar glassmorphism
│   ├── FlutterBottomNav.tsx   # Floating Bottom Navigation Bar
│   ├── HeroBanner.tsx         # Carousel anime unggulan
│   └── LoadingSkeleton.tsx    # Cyber shimmer skeleton
├── lib/
│   ├── clientApi.ts           # Client API fetcher
│   ├── sanka.ts               # SankaVollerei API proxy helper & cache
│   ├── storage.ts             # LocalStorage manager (History & Bookmark)
│   └── types.ts               # TypeScript Interfaces
├── next.config.mjs            # Konfigurasi Next.js & CDN Gambar
├── tailwind.config.js         # Tema neon, cyber colors & Flutter tokens
└── vercel.json                # Konfigurasi Vercel Deployment
```

---

## 🚀 Cara Upload / Deploy ke Vercel (vercel.app)

Project ini 100% siap di-deploy ke **Vercel** tanpa konfigurasi tambahan.

### Cara 1: Menggunakan GitHub (Paling Direkomendasikan & Otomatis)

1. **Inisialisasi Git di folder project:**
   ```bash
   cd ~/sankanime-stream
   git init
   git add .
   git commit -m "feat: initial commit anime streaming app"
   ```

2. **Buat repositori baru di GitHub:**
   - Buka [github.com/new](https://github.com/new) dan buat repository (misal: `nexus-anime-stream`).
   - Hubungkan dan push kode dari Termux / terminal:
     ```bash
     git remote add origin https://github.com/USERNAME_KAMU/nexus-anime-stream.git
     git branch -M main
     git push -u origin main
     ```

3. **Deploy di Vercel:**
   - Kunjungi [vercel.com](https://vercel.com) dan login (bisa login dengan akun GitHub).
   - Klik tombol **"Add New..."** lalu pilih **"Project"**.
   - Pilih repositori `nexus-anime-stream` yang baru saja kamu push.
   - Vercel akan secara otomatis mendeteksi Framework **Next.js**.
   - Klik **"Deploy"**!
   - Dalam ~1 menit, aplikasi kamu sudah tayang di domain publik seperti:
     `https://nexus-anime-stream.vercel.app` 🎉

---

### Cara 2: Deploy Langsung Menggunakan Vercel CLI

Jika ingin langsung deploy dari terminal tanpa GitHub:

1. Di dalam folder `~/sankanime-stream`:
   ```bash
   npx vercel
   ```
2. Ikuti instruksi di layar:
   - Login ke akun Vercel kamu.
   - Konfirmasi pembuatan project baru (tekan `Y`).
   - Tunggu proses upload selesai.
3. Untuk deploy ke production domain:
   ```bash
   npx vercel --prod
   ```

---

## 💻 Penggunaan Lokal (Development)

Untuk menjalankan server pengembangan lokal:
```bash
npm run dev
```
Akses di browser melalui: `http://localhost:3000`

---

## 🛡️ Catatan Teknis SankaVollerei REST API

Endpoint yang digunakan:
- `GET https://www.sankavollerei.web.id/anime/home`
- `GET https://www.sankavollerei.web.id/anime/ongoing-anime`
- `GET https://www.sankavollerei.web.id/anime/complete-anime`
- `GET https://www.sankavollerei.web.id/anime/schedule`
- `GET https://www.sankavollerei.web.id/anime/anime/:slug`
- `GET https://www.sankavollerei.web.id/anime/episode/:slug`
- `GET https://www.sankavollerei.web.id/anime/server/:serverId`
- `GET https://www.sankavollerei.web.id/anime/search/:query`

Semua pemanggilan melewati route Next.js `/api/...` yang menyertakan header browser resmi (`User-Agent`, `Referer`, dan `Accept`) sehingga tidak terblokir oleh *Plana AI Detector*.
