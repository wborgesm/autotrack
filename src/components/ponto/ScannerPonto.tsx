"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

export default function ScannerPonto({ usuarioId }: { usuarioId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturando, setCapturando] = useState(false);

  const ligarCamera = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    setStream(s);
    if (videoRef.current) videoRef.current.srcObject = s;
  };

  const desligarCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturar = async () => {
    if (!videoRef.current) return;
    setCapturando(true);
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const fotoBase64 = canvas.toDataURL("image/jpeg");

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const res = await fetch("/api/ponto/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fotoBase64,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          usuarioId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ Ponto registado com sucesso!");
      } else {
        alert("❌ Falha na biometria: " + (data.error || "Rosto não reconhecido"));
      }
      setCapturando(false);
    }, () => {
      alert("❌ Não foi possível obter a localização.");
      setCapturando(false);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 glass rounded-2xl">
      <div className="relative w-64 h-64 overflow-hidden rounded-full border-4 border-blue-500">
        {stream ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-200 dark:bg-gray-700">
            <Camera className="h-10 w-10 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        {!stream ? (
          <Button onClick={ligarCamera} className="bg-blue-600 hover:bg-blue-700">
            <Camera className="mr-2 h-4 w-4" /> Ligar Câmara
          </Button>
        ) : (
          <>
            <Button onClick={capturar} disabled={capturando} className="bg-green-600 hover:bg-green-700">
              {capturando ? "A processar..." : "Bater Ponto"}
            </Button>
            <Button variant="outline" onClick={desligarCamera}>
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
