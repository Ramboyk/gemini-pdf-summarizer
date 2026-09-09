"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FileUpload } from "@/components/FileUpload";
import { SummaryOptions } from "@/components/SummaryOptions";
import { SummaryResult } from "@/components/SummaryResult";
import { AdminLoginModal } from "@/components/AdminLoginModal";
import {
  SummaryLength,
  UploadedFileState,
  ExtractPdfResponse,
  GeminiSummaryData,
  SummarizeResponse,
  UsageInfo,
} from "@/types";
import {
  Sparkles,
  RefreshCw,
  Info,
  Check,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Gauge,
} from "lucide-react";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState>({
    file: null,
    name: "",
    size: "",
  });
  const [selectedLength, setSelectedLength] = useState<SummaryLength>("medium");
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    text: string;
    pageCount: number;
    characterCount: number;
    fileName: string;
  } | null>(null);
  const [summaryData, setSummaryData] = useState<GeminiSummaryData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Admin ve Rate Limit Durumları
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  // İlk yüklemede admin oturumunu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAdmin(true);
          }
        }
      } catch {
        // Oturum kontrol hatası sessizce yoksayılır
      }
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      setIsAdmin(false);
    }
  };

  // PDF metnini sunucudan (API route) çıkaran fonksiyon
  const extractPdfText = async (file: File) => {
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      });

      const data: ExtractPdfResponse = await res.json();

      if (!res.ok || !data.success || !data.text) {
        const errorMsg = data.error || "PDF metni çıkarılırken bir hata oluştu.";
        setErrorMessage(errorMsg);
        setExtractedData(null);
        return null;
      }

      const result = {
        text: data.text,
        pageCount: data.pageCount ?? 0,
        characterCount: data.characterCount ?? data.text.length,
        fileName: data.fileName || file.name,
      };

      setExtractedData(result);
      return result;
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Sunucu ile bağlantı kurulurken bir hata oluştu.";
      setErrorMessage(errorMsg);
      setExtractedData(null);
      return null;
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileSelect = async (fileState: UploadedFileState) => {
    setUploadedFile(fileState);
    setSummaryData(null);
    setErrorMessage(null);
    setExtractedData(null);

    if (fileState.file) {
      await extractPdfText(fileState.file);
    }
  };

  const handleFileRemove = () => {
    setUploadedFile({ file: null, name: "", size: "" });
    setExtractedData(null);
    setSummaryData(null);
    setErrorMessage(null);
  };

  // Google Gemini API çağrısı ile gerçek yapılandırılmış özet üretme
  const handleSummarize = async () => {
    if (!uploadedFile.file) {
      setErrorMessage("Lütfen özetleme yapabilmek için önce bir PDF dosyası seçin.");
      return;
    }

    if (!extractedData || !extractedData.text) {
      setErrorMessage("PDF metin çıkarma işlemi henüz tamamlanmadı. Lütfen bekleyin.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: extractedData.text,
          summaryLevel: selectedLength,
        }),
      });

      const result: SummarizeResponse = await res.json();

      if (!res.ok || !result.success || !result.data) {
        setErrorMessage(
          result.error || "Özet oluşturulurken bir hata meydana geldi. Lütfen tekrar deneyin."
        );
        return;
      }

      // Başarılı yanıtta kullanım kotası ve admin durumunu güncelle
      if (result.admin) {
        setIsAdmin(true);
      } else if (result.usage) {
        setUsage(result.usage);
      }

      setSummaryData(result.data);
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Özetleme servisi ile bağlantı kurulurken bir hata oluştu.";
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUploadedFile({ file: null, name: "", size: "" });
    setExtractedData(null);
    setSummaryData(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900 selection:bg-indigo-500 selection:text-white">
      {/* Üst Menü / Header */}
      <Header
        isAdmin={isAdmin}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Admin Giriş Modalı */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => setIsAdmin(true)}
      />

      {/* Ana İçerik */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Tanıtım / Karşılama Banner */}
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
            PDF Belgelerinizi Saniyeler İçinde Özetleyin
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 mt-2">
            Belgenizi yükleyin, ihtiyacınıza uygun derinliği seçin ve tek tıkla
            anlaşılır özetler elde edin.
          </p>
        </div>

        {/* 2 Kolonlu Responsive Grid Yapısı */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sol Kolon: Yükleme & Ayarlar (5 / 12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
              {/* PDF Yükleme Bölümü */}
              <FileUpload
                uploadedFile={uploadedFile}
                onFileSelect={handleFileSelect}
                onFileRemove={handleFileRemove}
              />

              {/* Çıkarım Durum Bildirimi */}
              {isExtracting && (
                <div className="flex items-center gap-2.5 p-3 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-2xl animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                  <span>PDF belgesinden metin çıkarılıyor...</span>
                </div>
              )}

              {extractedData && !isExtracting && (
                <div className="flex items-center justify-between p-3 text-xs text-emerald-800 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                  <div className="flex items-center gap-1.5 font-medium truncate mr-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Metin başarıyla çıkarıldı</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md shrink-0">
                    {extractedData.pageCount} sayfa • {extractedData.characterCount.toLocaleString()} krk.
                  </span>
                </div>
              )}

              {/* Özet Derinliği Seçenekleri */}
              <SummaryOptions
                selectedLength={selectedLength}
                onChange={setSelectedLength}
              />

              {/* Kota ve Kullanım Durum Bildirimi */}
              {isAdmin ? (
                <div className="flex items-center gap-2.5 p-3 text-xs text-indigo-800 bg-indigo-50/90 border border-indigo-200/80 rounded-2xl shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-medium">
                    Yönetici modu — kullanım limiti uygulanmıyor.
                  </span>
                </div>
              ) : usage !== null ? (
                <div className="flex items-center justify-between p-3 text-xs text-zinc-700 bg-zinc-50 border border-zinc-200/80 rounded-2xl">
                  <div className="flex items-center gap-2 font-medium">
                    <Gauge className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      Bugün <strong className="text-indigo-600 font-semibold">{usage.remaining}</strong> ücretsiz özetleme hakkınız kaldı.
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-semibold">
                    {usage.dailyLimit - usage.remaining} / {usage.dailyLimit}
                  </span>
                </div>
              ) : null}

              {/* Hata Bildirimi */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3.5 text-xs text-rose-900 bg-rose-50/90 border border-rose-200/80 rounded-2xl">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Eylem Butonları */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={isLoading || isExtracting || !extractedData}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-semibold text-sm transition-all duration-200 shadow-sm ${
                    isLoading || isExtracting || !extractedData
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200/80"
                      : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white shadow-indigo-100 shadow-lg cursor-pointer"
                  }`}
                >
                  {isLoading || isExtracting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isLoading
                    ? "Özetleniyor..."
                    : isExtracting
                    ? "Metin Çıkarılıyor..."
                    : "PDF'yi Özetle"}
                </button>

                {(uploadedFile.file || summaryData) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Formu Sıfırla"
                    className="p-3.5 rounded-2xl border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bilgilendirme Kutucuğu */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex items-start gap-3 text-xs text-zinc-600">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                <strong>Not:</strong> Google Gemini API entegrasyonu aktiftir. Belgenizden
                çıkarılan metin seçtiğiniz derinliğe (Kısa, Orta, Detaylı) göre analiz edilir ve
                yapılandırılmış olarak (Genel Özet, Önemli Noktalar, Anahtar Kelimeler ve Eylem Adımları) sunulur.
              </p>
            </div>
          </div>

          {/* Sağ Kolon: Özet Sonuç Alanı (7 / 12) */}
          <div className="lg:col-span-7 min-h-[420px] lg:min-h-[540px] flex flex-col">
            <SummaryResult
              summaryData={summaryData}
              isLoading={isLoading}
              summaryLength={selectedLength}
              fileName={uploadedFile.name}
              pageCount={extractedData?.pageCount}
              characterCount={extractedData?.characterCount}
            />
          </div>
        </div>
      </main>

      {/* Alt Bilgi / Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <p>© 2026 Gemini PDF Summarizer. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-zinc-800 cursor-pointer">Gizlilik</span>
            <span>•</span>
            <span className="hover:text-zinc-800 cursor-pointer">Kullanım Şartları</span>
            <span>•</span>
            <span className="text-zinc-400">Next.js 16 + Tailwind CSS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
