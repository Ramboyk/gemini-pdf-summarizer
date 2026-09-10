# Gemini PDF Summarizer

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-v1.0_MVP-success?style=flat-square)](#)

Gemini PDF Summarizer, PDF belgelerini analiz ederek kısa, orta veya detaylı yapılandırılmış özetler üreten yapay zekâ destekli bir web uygulamasıdır. Next.js, TypeScript ve Google Gemini API ile geliştirilmiştir.

---

## Canlı Demo

[Uygulamayı Canlı Görüntüle](https://gemini-pdf-summarizer-rho.vercel.app/)

---

## 📸 Demo

Uygulama, yüklenen PDF belgesini analiz ederek şu yapılandırılmış bölümleri üretir:
- **Genel Özet:** Belgenin ana temasını ve bağlamını aktaran akıcı özet.
- **Önemli Noktalar:** Maddeler halinde kilit bulgular ve temel çıkarımlar.
- **Anahtar Kelimeler:** Konuyu özetleyen etiketler.
- **Eylem Adımları:** Belgeden tespit edilen somut aksiyon maddeleri (varsa).

![Gemini PDF Summarizer](./public/screenshots/app.png)

---

## ✨ Features

- **Modern Dosya Yükleme:** Sürükle-bırak ve dosya seçici desteği (maksimum 10 MB).
- **Server-Side PDF Text Extraction:** İstemci tarafını yormadan, sunucuda izole metin ayrıştırma (`unpdf`).
- **Esnek Özet Seviyeleri:** İhtiyaca göre seçilebilen **Kısa**, **Orta** ve **Detaylı** modlar.
- **Structured Gemini Output:** Google Gemini API üzerinden garantili JSON şeması ile tutarlı veri yapısı.
- **Long-Document Chunking:** 12.000 karakterden uzun belgelerde paragraf duyarlı map-reduce sentezleme.
- **Resilient Retry Mekanizması:** 503, 429 ve geçici network kesintilerinde otomatik exponential backoff (2s, 4s, 8s).
- **Kota ve Rate Limiting Koruması:** Upstash Redis ile IP ve global günlük kullanım kotaları (kamuya açık demo koruması).
- **Yönetici Test Modu:** Proje sahibinin kullanım limitlerinden etkilenmeden uygulamayı test etmesini sağlayan güvenli admin oturumu.
- **Güvenli Mimari:** API anahtarları tamamen sunucu tarafında (`process.env`) tutulur; istemciye veya tarayıcıya sızdırılmaz.
- **Tek Tıkla Kopyalama:** Üretilen raporu Markdown formatında panoya aktarma.
- **Belge Analiz İstatistikleri:** Sayfa sayısı, karakter sayısı, seçilen mod ve kelime adedi gösterimi.
- **Responsive Türkçe UI:** Masaüstü ve mobil cihazlarla tam uyumlu, modern kullanıcı arayüzü.

---

## 📐 Architecture

```text
PDF Upload & Summary Request (Client)
       ↓
Server-Side Rate Limit & Admin Verification (Upstash Redis)
       ↓
Server-Side Text Extraction (unpdf / WASM)
       ↓
Validation & Normalization
       ↓
Chunking (Metin > 12.000 karakter ise)
       ↓
Gemini API (withRetry & responseSchema)
       ↓
Structured JSON Output
       ↓
Summary UI (Markdown Copy, Statistics & Usage Counter)
```

### Uzun Belgelerde Map-Reduce Sentezleme
- **12.000 karakter ve altı:** Metin doğrudan tek bir Gemini API çağrısıyla nihai JSON şemasında özetlenir.
- **12.000 karakter üzeri:** Belge, paragraf ve cümle bütünlüğü korunarak ~10.000 karakterlik parçalara (`overlap: 500`) bölünür. Her parça bağımsız olarak özetlenir (Map) ve ardından bu ara özetler birleştirilerek final sentezi üretilir (Reduce). Her aşama bağımsız retry mekanizmasıyla korunur.

---

## 🛠 Tech Stack

| Teknoloji | Sürüm | Açıklama |
| :--- | :--- | :--- |
| **[Next.js](https://nextjs.org/)** | `16.3.4` | App Router, Server-side API routes & Turbopack |
| **[React](https://react.dev/)** | `19.2.8` | UI bileşen mimarisi |
| **[TypeScript](https://www.typescriptlang.org/)** | `^5` | Statik tip denetimi ve güvenli veri modelleri |
| **[Tailwind CSS](https://tailwindcss.com/)** | `^4` | Modern CSS stillendirme |
| **[@google/genai](https://www.npmjs.com/package/@google/genai)** | `^2.21.0` | Resmi Google Gemini SDK |
| **[@upstash/redis](https://upstash.com/)** | `^1.38.4` | Rate limiting ve kota yönetimi için serverless Redis |
| **[unpdf](https://unjs.io/packages/unpdf)** | `^1.8.1` | Native canvas bağımlılığı olmayan modern PDF ayrıştırıcı |
| **[lucide-react](https://lucide.dev/)** | `^1.43.0` | Minimalist ikon seti |

---

## 🚀 Getting Started

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/Ramboyk/gemini-pdf-summarizer.git
cd gemini-pdf-summarizer
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Tanımlayın
```bash
cp .env.example .env.local
```

`.env.local` dosyasını açıp gerekli ortam değişkenlerini girin:
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.6-flash

UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

IP_DAILY_LIMIT=3
GLOBAL_DAILY_LIMIT=20

ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me
ADMIN_SESSION_SECRET=replace_with_a_long_random_secret
```

> **API Key Temini:** [Google AI Studio](https://aistudio.google.com/) üzerinden ücretsiz Gemini API anahtarı oluşturabilirsiniz.
> **Redis Temini:** [Upstash](https://upstash.com/) üzerinden ücretsiz serverless Redis veritabanı açabilirsiniz.

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔐 Environment Variables

| Değişken | Açıklama | Varsayılan |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API anahtarı (**Zorunlu**, sunucu tarafı) | - |
| `GEMINI_MODEL` | Kullanılacak Gemini modeli | `gemini-3.6-flash` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL endpoint'i | - |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST erişim belirteci (token) | - |
| `IP_DAILY_LIMIT` | IP başına günlük başarılı özetleme limiti | `3` |
| `GLOBAL_DAILY_LIMIT` | Uygulama geneli günlük başarılı özetleme limiti | `20` |
| `ADMIN_USERNAME` | Yönetici modu giriş kullanıcı adı | `admin` |
| `ADMIN_PASSWORD` | Yönetici modu giriş şifresi | `change_me` |
| `ADMIN_SESSION_SECRET` | Admin oturumu imzalama anahtarı (HMAC SHA-256) | - |

---

## 🔌 API Endpoints

### 1. `POST /api/extract-pdf`
PDF dosyasını alır, boyutunu ve içeriğini doğrular, sunucuda metne dönüştürür.
- **Content-Type:** `multipart/form-data`
- **Body:** `file` (PDF dosyası, maksimum 10 MB)
- **Response:**
  ```json
  {
    "success": true,
    "fileName": "dokuman.pdf",
    "pageCount": 12,
    "characterCount": 24500,
    "text": "..."
  }
  ```

### 2. `POST /api/summarize`
Çıkarılan metni ve istenen özet derinliğini alarak Gemini API ile yapılandırılmış JSON özet üretir. Rate limit kontrolleri bu uç noktada işletilir.
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "text": "Analiz edilecek belge metni...",
    "summaryLevel": "short" | "medium" | "detailed"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "summary": "Belgenin ana konusunu ve kilit mesajını aktaran özet.",
      "keyPoints": [
        "Önemli bulgu veya çıkarım 1",
        "Önemli bulgu veya çıkarım 2"
      ],
      "keywords": ["yapay-zeka", "nextjs", "dokuman-analizi"],
      "actionItems": [
        "Belirtilen aksiyon adımı 1"
      ]
    },
    "usage": {
      "dailyLimit": 3,
      "remaining": 2
    }
  }
  ```

### 3. `POST /api/admin/login`
Yönetici kimlik bilgilerini doğrular ve güvenli, HTTP-only bir oturum çerezi oluşturur.
- **Body:** `{ "username": "...", "password": "..." }`

### 4. `POST /api/admin/logout`
Mevcut yönetici oturumunu sonlandırır ve çerezi temizler.

### 5. `GET /api/admin/session`
Mevcut istekteki yönetici oturumunun geçerliliğini doğrular.

---

## 🔁 Retry & Long Document Handling

- **Hata Yönetimi ve Retry:** API isteklerinde `503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`, `500`, `502`, `504` ve geçici bağlantı kesintilerinde otomatik exponential backoff uygulanır:
  - 1. Deneme Sonrası: **2 saniye**
  - 2. Deneme Sonrası: **4 saniye**
  - 3. Deneme Sonrası: **8 saniye**
  - Toplam 3 retry (ilk çağrı ile birlikte toplam 4 deneme).
- **Kalıcı Hatalar:** `400`, `401`, `403`, `404` ve geçersiz istek durumlarında retry yapılmaz, anında açıklayıcı hata dönülür.
- **Kullanıcı Bildirimi:** Tüm denemeler sonuçsuz kalırsa kullanıcıya servis yoğunluğu uyarısı gösterilir.

---

## ⏱️ Rate Limiting

Uygulamanın kamuya açık public demosunu ve API kaynaklarını korumak amacıyla Upstash Redis üzerinden günlük kotalar uygulanır:

- **Normal Kullanıcılar:**
  - **IP Başına Günlük Kota:** 3 başarılı özet
  - **Uygulama Geneli Günlük Kota:** 20 başarılı özet
  - Kotalar yalnızca başarılı özetleme işlemlerinde eksilir; başarısız istekler kullanıcının hakkını tüketmez.
- **Admin Modu:**
  - Doğrulanmış yönetici oturumuna sahip isteklerde rate limit uygulanmaz.
  - Yönetici modu, proje sahibinin demo kullanım limitlerinden etkilenmeden uygulamayı test etmesini sağlar.

---

## 🛡️ Security

- **Server-Side API Key & Secrets:** `GEMINI_API_KEY`, Redis tokenları ve admin kimlik bilgileri yalnızca sunucu tarafında okunur; istemci tarafına asla sızdırılmaz.
- **Güvenli Kimlik Doğrulama:** Yönetici doğrulamalarında zamanlama saldırılarına (timing attacks) karşı `crypto.timingSafeEqual` kullanılır. Oturumlar HMAC SHA-256 ile imzalanır ve `httpOnly`, `sameSite=lax`, `secure` çerezlerde saklanır.
- **IP Gizliliği:** Rate limit için istemci IP adresleri açık metin olarak değil, SHA-256 ile tek yönlü hashlenerek Redis'te tutulur.
- **Log Hijyeni:** Hata mesajlarında ve sunucu loglarında hassas anahtarlar filtrelenerek maskelenir (`sanitizeErrorMessage`).
- **Git Güvenliği:** `.env.local` dosyası `.gitignore` ile korunmaktadır. Depoda hiçbir gerçek secret veya credential yer almaz.

---

## ⚠️ Known Limitations

- **Maksimum Dosya Boyutu:** 10 MB sınırı uygulanmaktadır.
- **OCR Eksikliği:** Yalnızca taranmış görsel/fotoğraf içeren ve metin katmanı bulunmayan PDF belgelerinde doğrudan metin çıkarılamaz.
- **Büyük Belgeler:** 12.000 karakterden uzun dokümanlar chunking nedeniyle birden fazla API çağrısı oluşturabilir.
- **Servis Kotası:** Gemini API kota veya servis yoğunluğu durumlarında geçici gecikmeler yaşanabilir.

---

## 🗺️ Roadmap

- [ ] **OCR Entegrasyonu:** Taranmış ve metin içermeyen PDF'ler için görüntüden metin tanıma.
- [ ] **PDF Q&A:** Özetlenen belge üzerinden etkileşimli soru-cevap sohbeti.
- [ ] **Çoklu Belge Karşılaştırma:** Birden fazla PDF'yi karşılaştırmalı analiz etme.
- [ ] **Özet Geçmişi:** Geçmiş özetleri tarayıcı yerel hafızasında saklama.
- [ ] **Kullanıcı Kimlik Doğrulama:** Firebase veya Supabase ile kullanıcı hesapları.
- [ ] **Export Seçenekleri:** Özetleri PDF veya DOCX olarak indirme.
- [ ] **Dil Seçimi:** Çok dilli özetleme desteği.
- [ ] **Model Seçimi:** Arayüz üzerinden farklı Gemini modelleri seçebilme.

---

## 📄 License

Bu proje [MIT Lisansı](./LICENSE) kapsamında sunulmaktadır.
