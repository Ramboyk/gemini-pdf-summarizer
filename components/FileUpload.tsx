"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";
import { UploadedFileState } from "@/types";

interface FileUploadProps {
  uploadedFile: UploadedFileState;
  onFileSelect: (fileState: UploadedFileState) => void;
  onFileRemove: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  uploadedFile,
  onFileSelect,
  onFileRemove,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Lütfen yalnızca geçerli bir PDF dosyası yükleyin.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Dosya boyutu 10 MB'tan büyük olamaz.");
      return;
    }

    onFileSelect({
      file,
      name: file.name,
      size: formatFileSize(file.size),
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-zinc-900">
          PDF Belgesi
        </label>
        <span className="text-xs text-zinc-400">Yalnızca .pdf formatı</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      {!uploadedFile.file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerBrowse}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? "border-indigo-500 bg-indigo-50/60 scale-[0.99]"
              : "border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50/60 bg-zinc-50/30"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isDragOver
                  ? "bg-indigo-100 text-indigo-600"
                  : "bg-zinc-100 text-zinc-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"
              }`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-800">
                <span className="text-indigo-600 underline underline-offset-2">
                  Dosya seçmek için tıklayın
                </span>{" "}
                veya buraya sürükleyip bırakın
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Maksimum dosya boyutu: 10 MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-zinc-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-xs text-zinc-500">{uploadedFile.size}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pl-3">
              <button
                type="button"
                onClick={triggerBrowse}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Değiştir
              </button>
              <button
                type="button"
                onClick={onFileRemove}
                title="Dosyayı kaldır"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200/80 px-3 py-2 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
