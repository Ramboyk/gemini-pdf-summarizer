"use client";

import React from "react";
import { CheckCircle2, Zap, AlignLeft, BookOpen } from "lucide-react";
import { SummaryLength, SummaryOption } from "@/types";

interface SummaryOptionsProps {
  selectedLength: SummaryLength;
  onChange: (length: SummaryLength) => void;
}

const summaryOptions: (SummaryOption & { icon: React.ReactNode })[] = [
  {
    id: "short",
    label: "Kısa",
    description: "Hızlı okuma için 2-3 kilit madde ve temel ana fikir.",
    badge: "~1 dk okuma",
    icon: <Zap className="w-4 h-4 text-amber-500" />,
  },
  {
    id: "medium",
    label: "Orta",
    description: "Dengeli genel bakış, önemli bulgular ve sonuç çıkarımları.",
    badge: "~3 dk okuma",
    icon: <AlignLeft className="w-4 h-4 text-indigo-500" />,
  },
  {
    id: "detailed",
    label: "Detaylı",
    description: "Bölüm bölüm derinlemesine analiz, tüm önemli detaylar ve veriler.",
    badge: "~5 dk okuma",
    icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
  },
];

export const SummaryOptions: React.FC<SummaryOptionsProps> = ({
  selectedLength,
  onChange,
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-zinc-900">
          Özet Derinliği
        </label>
        <span className="text-xs text-zinc-400">Tercih edilen uzunluk</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryOptions.map((option) => {
          const isSelected = selectedLength === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs"
                  : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    {option.icon}
                    <span className="font-semibold text-sm text-zinc-900">
                      {option.label}
                    </span>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-zinc-300" />
                  )}
                </div>

                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                  {option.description}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                    isSelected
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {option.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
