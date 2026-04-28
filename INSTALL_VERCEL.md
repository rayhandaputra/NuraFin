# Panduan Instalasi di Vercel

Dokumen ini menjelaskan langkah-langkah untuk mendeploy aplikasi Mizanly ke Vercel.

## Prasyarat
1. Akun [Vercel](https://vercel.com).
2. Projek Firebase yang sudah dikonfigurasi (Firestore & Auth).

## Langkah-langkah Deploy

### 1. Persiapkan Repository
Pastikan kode Anda sudah di-push ke repository (GitHub, GitLab, atau Bitbucket).

### 2. Import Projek di Vercel
1. Masuk ke dashboard Vercel.
2. Klik **"Add New"** > **"Project"**.
3. Pilih repository Mizanly Anda.

### 3. Konfigurasi Environment Variables
Aplikasi ini membutuhkan variabel lingkungan agar dapat terhubung dengan Firebase. Di dashboard Vercel, masuk ke bagian **Environment Variables** dan tambahkan variabel berikut:

| Nama Variabel | Sumber Nilai |
| :--- | :--- |
| `GEMINI_API_KEY` | API Key dari Google AI Studio (jika menggunakan fitur AI) |

**Catatan: Konfigurasi Firebase**
Aplikasi ini membaca konfigurasi Firebase dari file `firebase-applet-config.json`. Pastikan file tersebut ada di root direktori projek Anda saat dideploy, atau Anda dapat memodifikasi `app/nexus/firebase.ts` untuk menggunakan variabel lingkungan jika lebih suka menyembunyikan konfigurasi tersebut.

Untuk keamanan tambahan, Anda disarankan menggunakan variabel lingkungan untuk setiap field di Firebase Config:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_ID`

### 4. Build & Deploy
1. Klik **"Deploy"**.
2. Vercel akan secara otomatis mendeteksi framework (Vite/React Router) dan menjalankan perintah build.
3. Tunggu hingga proses selesai.

## Konfigurasi Progressive Web App (PWA)
Aplikasi ini sudah dikonfigurasi sebagai PWA. Setelah dideploy, Anda dapat menginstalnya di perangkat mobile atau desktop melalui menu "Add to Home Screen" di browser.

## Troubleshooting
- Jika aplikasi stuck di "Loading...", pastikan Firebase URL diizinkan di setting Firebase Console (Authorized Domains).
- Periksa tab **Logs** di Vercel jika terjadi error saat build.
