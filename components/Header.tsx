"use client";

import React from "react";
import { FileText, Shield, ShieldCheck, LogOut } from "lucide-react";

interface HeaderProps {
  isAdmin?: boolean;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin = false,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Sol Taraf: Logo ve Başlık */}
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

        {/* Sağ Taraf: Admin Durumu / Giriş Butonları */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Yönetici Modu</span>
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Oturumu Kapat"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Çıkış Yap</span>
                </button>
              )}
            </div>
          ) : (
            onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 hover:bg-zinc-50 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
              >
                <Shield className="w-3.5 h-3.5 text-zinc-400" />
                <span>Yönetici Girişi</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
};
