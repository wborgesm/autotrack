"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image } from "lucide-react";

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSize?: number; // em MB
}

export default function FileUpload({ onUploadComplete, accept = "image/*", maxSize = 10 }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Ficheiro excede o tamanho máximo de ${maxSize} MB.`);
      return;
    }

    // Preview para imagens
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded * 100) / e.total));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        onUploadComplete(data.url);
        setPreview(`https://sistema.autotrack.pt${data.url}`);
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          setError(err.error || "Erro ao enviar ficheiro.");
        } catch {
          setError("Erro ao enviar ficheiro.");
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Erro de rede ao enviar ficheiro.");
    };

    xhr.send(formData);
  }, [maxSize, onUploadComplete]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-3">
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {uploading ? (
          <div className="space-y-3">
            <Upload className="h-10 w-10 text-blue-500 mx-auto animate-pulse" />
            <p className="text-sm text-gray-600 dark:text-gray-400">A enviar...</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500">{progress}%</p>
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-cover" />
            <p className="text-sm text-gray-500">Clique ou arraste para alterar a imagem.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center gap-3">
              <Image className="h-10 w-10 text-gray-400" />
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Arraste um ficheiro ou clique para selecionar
            </p>
            <p className="text-xs text-gray-400">
              {accept === "image/*" ? "Imagens" : "Ficheiros"} até {maxSize} MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/30 p-3 rounded-lg">
          <X className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
