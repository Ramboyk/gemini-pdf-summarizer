# Gemini PDF Summarizer

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=flat-square)](./LICENSE)

Gemini PDF Summarizer, PDF belgelerini analiz ederek kısa, orta veya detaylı yapılandırılmış özetler üreten yapay zekâ destekli bir web uygulamasıdır. Next.js, TypeScript ve Google Gemini API ile geliştirilmiştir.

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
- **Güvenli Mimari:** API anahtarı tamamen sunucu tarafında (`process.env`) tutulur; istemciye veya tarayıcıya sızdırılmaz.
- **Tek Tıkla Kopyalama:** Üretilen raporu Markdown formatında panoya aktarma.
- **Belge Analiz İstatistikleri:** Sayfa sayısı, karakter sayısı, seçilen mod ve kelime adedi gösterimi.
- **Responsive Türkçe UI:** Masaüstü ve mobil cihazlarla tam uyumlu, modern ve sade kullanıcı arayüzü.

---

## 📐 Architecture

```text
PDF Upload (Client)
       ↓
Server-Side Text Extraction (API Route)
       ↓
unpdf (WASM / Node.js Runtime)
       ↓
Validation & Normalization
       ↓
Chunking (Metin > 12.000 karakter ise)
       ↓
Gemini API (withRetry & responseSchema)
       ↓
Structured JSON Output
       ↓
Summary UI (Markdown Copy & Statistics)
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

`.env.local` dosyasını açıp kendi Google Gemini API anahtarınızı girin:
```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3.6-flash
```

> **API Key Temini:** [Google AI Studio](https://aistudio.google.com/) üzerinden ücretsiz API anahtarı oluşturabilirsiniz.

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
Çıkarılan metni ve istenen özet derinliğini alarak Gemini API ile yapılandırılmış JSON özet üretir.
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "text": "Analiz edilecek belge metni...",
    "summaryLevel": "short" | "medium" | "detailed"
  }
  ```
- **Gemini Structured Output:**
  ```json
  {
    "summary": "Belgenin ana konusunu ve kilit mesajını aktaran özet.",
    "keyPoints": [
      "Önemli bulgu veya çıkarım 1",
      "Önemli bulgu veya çıkarım 2"
    ],
    "keywords": ["yapay-zeka", "nextjs", "dokuman-analizi"],
    "actionItems": [
      "Belirtilen aksiyon adımı 1"
    ]
  }
  ```

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

## 🛡️ Security

- **Server-Side API Key:** `GEMINI_API_KEY` yalnızca sunucu tarafında Route Handler içinde okunur. İstemci bundle'ına dahil edilmez.
- **Log Hijyeni:** API anahtarları olası hata mesajlarında ve loglarda filtrelenerek gizlenir (`sanitizeErrorMessage`).
- **Git Güvenliği:** `.env.local` dosyası `.gitignore` ile korunmaktadır. Depo içinde hiçbir hassas anahtar barındırılmaz.

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
