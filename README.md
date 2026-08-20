# IMGIVO — YouTube Video & Audio Dönüştürücü

IMGIVO, YouTube videolarını yüksek kalitede MP4 (1080p, 720p, 480p, 360p) veya MP3 (320kbps, 192kbps, 128kbps) formatlarına dönüştüren ve doğrudan indirilmesini sağlayan full-stack web uygulamasıdır.

## 🚀 Özellikler

- **Gerçek Zamanlı Medya İşleme**: `yt-dlp` ve `FFmpeg` altyapısıyla sunucu tarafında gerçek dönüştürme ve birleştirme.
- **Akıllı Format Tespiti**: Videonun desteklediği gerçek çözünürlükleri ve ses kalitelerini tespit eder.
- **Canlı İlerleme Durumu**: İndirme hızı, kalan süre (ETA) ve aşamalı işlem takibi.
- **Güvenlik & Gizlilik**: Helmet, CORS, Rate Limiting, Path Traversal koruması ve geçici disk dosyalarının otomatik temizliği.
- **Modern & Responsive Tasarım**: Dark / Midnight tema, glassmorphism efektleri ve tüm ekran boyutları (360px - 1440px+) ile kusursuz uyum.
- **İstatistik & Yönetim**: Toplam/başarılı/başarısız dönüşümler, sistem sağlık kontrolü ve disk temizleme paneli.

---

## 🛠️ Teknoloji Yığını

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Node.js, Express, TypeScript (tsx), Zod
- **Medya İşleme**: yt-dlp, FFmpeg
- **Konteyner & Dağıtım**: Docker, Railway

---

## 📦 Kurulum ve Yerel Geliştirme

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Uygulama `http://localhost:3000` adresinde çalışacaktır.

3. **Production Build & Test:**
   ```bash
   npm run build
   npm start
   ```

---

## ☁️ Railway Üzerinde Deploy Adımları

IMGIVO, Railway üzerinde tek bir Docker servisi olarak sorunsuz çalışacak şekilde tasarlanmıştır:

1. **GitHub Deponuzu Railway'e Bağlayın**:
   - [Railway Dashboard](https://railway.app)'a gidin.
   - **"New Project"** -> **"Deploy from GitHub repo"** seçeneğini seçin.
   - IMGIVO reposunu seçin.

2. **Otomatik Docker Tespiti**:
   - Railway, kök dizindeki `Dockerfile` dosyasını otomatik olarak algılar ve Node.js + FFmpeg + yt-dlp bağımlılıklarını kurarak derler.

3. **Ortam Değişkenleri (Variables)**:
   Railway dashboard üzerindeki **Variables** sekmesine `.env.example` dosyasındaki değişkenleri ekleyebilirsiniz:
   - `PORT`: (Railway tarafından otomatik sağlanır)
   - `NODE_ENV`: `production`
   - `MAX_DOWNLOAD_SIZE_MB`: `500`
   - `JOB_EXPIRATION_MINUTES`: `30`
   - `RATE_LIMIT_WINDOW_MS`: `60000`
   - `RATE_LIMIT_MAX_REQUESTS`: `60`

4. **Yayında**:
   - Railway otomatik bir domain tahsis eder (örn. `imgivo.up.railway.app`).

---

## 🔌 API Uç Noktaları

| Metot | Uç Nokta | Açıklama |
|---|---|---|
| `POST` | `/api/analyze` | Video URL'sini doğrular ve başlık, thumbnail, çözünürlükleri döner. |
| `POST` | `/api/download` | Dönüştürme işlemini başlatır ve benzersiz `jobId` üretir. |
| `GET` | `/api/jobs/:jobId` | İşlemin anlık ilerleme ve durumunu döner. |
| `GET` | `/api/download/:jobId` | Hazırlanan MP4 veya MP3 dosyasını doğrudan indirir. |
| `GET` | `/api/health` | yt-dlp ve FFmpeg bağımlılıklarının sağlık durumunu döner. |
| `GET` | `/api/admin/stats` | Sunucu dönüşüm istatistikleri ve disk kullanımını döner. |
| `POST` | `/api/admin/cleanup` | Süresi dolmuş geçici dosyaları diskten temizler. |

---

## ⚖️ Yasal Uyarı
Bu uygulama yalnızca indirme hakkına sahip olduğunuz, açık lisanslı veya kişisel kullanım kapsamındaki içerikler için kullanılmalıdır. DRM korumalı içeriklerin indirilmesini desteklemez.
