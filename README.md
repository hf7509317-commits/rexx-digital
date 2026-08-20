# REXX MARKET DIGITAL V2 — STANDALONE TANPA VPS

Versi ini dibuat untuk **Vercel Serverless**. Tidak perlu VPS, Pterodactyl, atau proses Node.js yang hidup 24/7.

## ARSITEKTUR

- Frontend: HTML + CSS + Vanilla JavaScript
- Backend: Vercel Functions (`/api`)
- Pembayaran: Pakasir QRIS API
- Notifikasi: Telegram Bot API
- Penyimpanan order: Upstash Redis REST API
- QR code: package `qrcode`

Vercel Functions menjalankan kode server-side tanpa Anda mengelola server. API key disimpan sebagai Environment Variables server-side, bukan di frontend. 

## 1. SIAPKAN UPSTASH

Buat database Redis Upstash dan ambil:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Penyimpanan ini diperlukan karena Vercel Functions bersifat serverless/stateless; jangan menggunakan `data/orders.json` untuk production.

## 2. DEPLOY KE VERCEL

Upload folder ini ke GitHub lalu import repository tersebut di Vercel, atau deploy dengan Vercel CLI.

Set Environment Variables di:

**Vercel Project → Settings → Environment Variables**

Isi:

```env
PAKASIR_PROJECT=SLUG_PROJECT_KAMU
PAKASIR_API_KEY=API_KEY_KAMU
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=TOKEN_BOT_KAMU
TELEGRAM_CHAT_ID=CHAT_ID_ADMIN
UPSTASH_REDIS_REST_URL=https://xxxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=TOKEN_UPSTASH
```

Jangan memakai prefix `NEXT_PUBLIC_` untuk secret. Setelah mengubah environment variables, lakukan redeploy.

## 3. WEBHOOK PAKASIR

Di proyek Pakasir, set Webhook URL menjadi:

`https://DOMAIN-KAMU/api/pakasir-webhook`

Pakasir mendokumentasikan endpoint QRIS create, transaction detail, dan webhook. Webhook sebaiknya tetap divalidasi menggunakan project, order ID, dan amount.

## 4. ALUR PEMBELIAN

BUYER → PRODUK → CHECKOUT → DATA BUYER → CREATE QRIS PAKASIR → QR DITAMPILKAN → STATUS DICEK → PAKASIR COMPLETED → ORDER DISIMPAN → TELEGRAM ADMIN.

## 5. PENGATURAN TOKO

Edit `config/store.config.js` untuk nama toko, tagline, kategori, kontak admin, prefix order, dan foto profil.

Foto profil: `assets/store-profile.svg`.

## CATATAN

Tidak ada VPS yang diperlukan. Namun tetap ada layanan eksternal yang diperlukan untuk fungsi production: Pakasir untuk pembayaran dan Upstash untuk penyimpanan order. Vercel menangani runtime backend/serverless.
