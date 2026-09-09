import React from "react";
import { Sparkles, FileText } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <header className="w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-zinc-900 tracking-tight">
                Gemini PDF Summarizer
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200/80">
                v1.0
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">
              Yapay zeka destekli akıllı belge özetleme asistanı
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
