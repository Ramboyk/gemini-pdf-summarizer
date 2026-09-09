"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  FileText,
  Bot,
  Clock,
  CheckCircle2,
  Tag,
  ListChecks,
  BarChart3,
} from "lucide-react";
import { SummaryLength, GeminiSummaryData } from "@/types";

interface SummaryResultProps {
  summaryData: GeminiSummaryData | null;
  isLoading: boolean;
  summaryLength: SummaryLength;
  fileName?: string;
  pageCount?: number;
  characterCount?: number;
}

export const SummaryResult: React.FC<SummaryResultProps> = ({
  summaryData,
  isLoading,
  summaryLength,
  fileName,
  pageCount,
  characterCount,
}) => {
  const [copied, setCopied] = useState(false);

  const getLengthLabel = (length: SummaryLength) => {
    switch (length) {
      case "short":
        return "Kısa Özet";
      case "medium":
        return "Orta Özet";
      case "detailed":
        return "Detaylı Özet";
    }
  };

  const totalWords = summaryData?.summary
    ? summaryData.summary.split(/\s+/).filter(Boolean).length
    : 0;

  const handleCopy = () => {
    if (!summaryData) return;

    let markdown = `# Belge Özeti${fileName ? `: ${fileName}` : ""}\n\n`;

    // Belge İstatistikleri satırı
    const stats: string[] = [];
    if (pageCount && pageCount > 0) stats.push(`${pageCount} sayfa`);
    if (characterCount && characterCount > 0)
      stats.push(`${characterCount.toLocaleString("tr-TR")} karakter`);
    stats.push(getLengthLabel(summaryLength));
    if (totalWords > 0) stats.push(`${totalWords} kelime`);
    if (stats.length > 0) {
      markdown += `> ${stats.join(" • ")}\n\n`;
    }

    markdown += `## Genel Özet\n${summaryData.summary}\n\n`;

    if (summaryData.keyPoints && summaryData.keyPoints.length > 0) {
      markdown += `## Önemli Noktalar\n`;
      summaryData.keyPoints.forEach((point) => {
        markdown += `• ${point}\n`;
      });
      markdown += `\n`;
    }

    if (summaryData.keywords && summaryData.keywords.length > 0) {
      markdown += `## Anahtar Kelimeler\n`;
      markdown += summaryData.keywords.map((kw) => `#${kw}`).join(" ") + `\n\n`;
    }

    if (summaryData.actionItems && summaryData.actionItems.length > 0) {
      markdown += `## Eylem Adımları\n`;
      summaryData.actionItems.forEach((action) => {
        markdown += `- [ ] ${action}\n`;
      });
    }

    navigator.clipboard.writeText(markdown.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // İstatistik satırı oluşturma
  const statParts: string[] = [];
  if (pageCount && pageCount > 0) {
    statParts.push(`${pageCount} sayfa`);
  }
  if (characterCount && characterCount > 0) {
    statParts.push(`${characterCount.toLocaleString("tr-TR")} karakter`);
  }
  statParts.push(getLengthLabel(summaryLength));
  if (totalWords > 0) {
    statParts.push(`${totalWords} kelime`);
  }

  return (
    <div className="w-full h-full bg-white border border-zinc-200 rounded-3xl flex flex-col shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Özet Çıktı Alanı
            </h3>
            <p className="text-xs text-zinc-500">
              {summaryData ? getLengthLabel(summaryLength) : "Sonuç bekleniyor"}
            </p>
          </div>
        </div>

        {summaryData && !isLoading && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 bg-white border border-zinc-200 px-3.5 py-2 rounded-xl hover:bg-zinc-50 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Raporu Kopyala</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 flex flex-col overflow-y-auto">
        {isLoading ? (
          /* Loading Skeleton State */
          <div className="space-y-6 animate-pulse my-auto py-6">
            <div className="h-9 bg-zinc-100 rounded-xl w-full" />
            
            <div className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-3">
              <div className="h-4 bg-zinc-200 rounded w-1/4" />
              <div className="h-3.5 bg-zinc-200/80 rounded w-full" />
              <div className="h-3.5 bg-zinc-200/80 rounded w-5/6" />
              <div className="h-3.5 bg-zinc-200/80 rounded w-4/6" />
            </div>

            <div className="p-5 border border-zinc-100 rounded-2xl bg-zinc-50/50 space-y-3">
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="space-y-2">
                <div className="h-3.5 bg-zinc-200/80 rounded w-full" />
                <div className="h-3.5 bg-zinc-200/80 rounded w-11/12" />
                <div className="h-3.5 bg-zinc-200/80 rounded w-4/5" />
              </div>
            </div>

            <p className="text-xs text-center text-indigo-600 pt-2 flex items-center justify-center gap-2 font-medium">
              <Clock className="w-4 h-4 animate-spin text-indigo-600" />
              Gemini belgenizi analiz ediyor ve özet üretiyor...
            </p>
          </div>
        ) : summaryData ? (
          /* Structured Summary Display */
          <div className="space-y-5 flex-1">
            {/* 1. İstatistik Satırı & Dosya Bilgisi */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 bg-zinc-50 border border-zinc-200/70 rounded-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-zinc-800 truncate">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate max-w-xs">{fileName || "Belge"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium shrink-0">
                <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                <span>{statParts.join(" • ")}</span>
              </div>
            </div>

            {/* 2. Bölüm: Genel Özet */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Genel Özet</span>
              </div>
              <div className="prose prose-sm max-w-none text-zinc-700 leading-relaxed whitespace-pre-line text-sm sm:text-[15px]">
                {summaryData.summary}
              </div>
            </div>

            {/* 3. Bölüm: Önemli Noktalar */}
            {summaryData.keyPoints && summaryData.keyPoints.length > 0 && (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Önemli Noktalar ({summaryData.keyPoints.length})</span>
                </div>
                <ul className="space-y-2.5 pt-1">
                  {summaryData.keyPoints.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-xs sm:text-sm text-zinc-700 leading-normal"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold shrink-0 mt-0.5 border border-emerald-200/60">
                        {index + 1}
                      </span>
                      <span className="flex-1 pt-0.5">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Bölüm: Anahtar Kelimeler */}
            {summaryData.keywords && summaryData.keywords.length > 0 && (
              <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Anahtar Kelimeler</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {summaryData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-xl bg-indigo-50/80 text-indigo-700 border border-indigo-100 hover:bg-indigo-100/70 transition-colors"
                    >
                      <span>#</span>
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Bölüm: Eylem Adımları (Yalnızca varsa gösterilir) */}
            {summaryData.actionItems && summaryData.actionItems.length > 0 && (
              <div className="bg-amber-50/40 border border-amber-200/70 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950 uppercase tracking-wider">
                  <ListChecks className="w-4 h-4 text-amber-700" />
                  <span>Eylem Adımları & Tavsiyeler ({summaryData.actionItems.length})</span>
                </div>
                <ul className="space-y-2 pt-1">
                  {summaryData.actionItems.map((action, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-amber-950 leading-normal"
                    >
                      <span className="w-4 h-4 rounded border border-amber-400 bg-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-amber-700">
                        ✓
                      </span>
                      <span className="flex-1">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Clean Empty State */
          <div className="my-auto py-12 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-100/80 border border-zinc-200/60 flex items-center justify-center text-zinc-400 mb-4 shadow-2xs">
              <Bot className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h4 className="text-base font-semibold text-zinc-800 mb-1">
              Henüz bir özet oluşturulmadı
            </h4>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
              Sol taraftaki alandan bir PDF belgesi yükleyin, istediğiniz özet
              derinliğini belirleyin ve <strong>&quot;PDF&apos;yi Özetle&quot;</strong> butonuna
              tıklayın.
            </p>

            <div className="grid grid-cols-3 gap-2 max-w-xs w-full text-[11px] text-zinc-500">
              <div className="border border-dashed border-zinc-200 rounded-xl p-2.5 bg-zinc-50/60 font-medium">
                1. PDF Yükle
              </div>
              <div className="border border-dashed border-zinc-200 rounded-xl p-2.5 bg-zinc-50/60 font-medium">
                2. Modu Seç
              </div>
              <div className="border border-dashed border-zinc-200 rounded-xl p-2.5 bg-zinc-50/60 font-medium">
                3. Özeti Al
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1.5 text-zinc-500 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Google Gemini AI Destekli
        </span>
        <span>
          {summaryData
            ? `${summaryData.keyPoints?.length ?? 0} kilit nokta • ${summaryData.keywords?.length ?? 0} etiket`
            : "0 kelime"}
        </span>
      </div>
    </div>
  );
};
