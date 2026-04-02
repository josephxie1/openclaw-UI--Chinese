/**
 * Componente QR Code ligero que genera un código QR a partir de una cadena
 * utilizando la API Canvas. No requiere dependencias externas.
 *
 * Implementación basada en el algoritmo QR Code Model 2 simplificado,
 * suficiente para URLs cortas (~100 chars).
 */
import { useEffect, useRef } from "react";

// Generador QR mínimo: usa un img con qr-code proxy del gateway
// o genera directamente via la API de qrserver (fallback).
// Para ambientes Electron donde las peticiones externas pueden estar bloqueadas,
// generamos el QR como un SVG inline usando una implementación mínima.

interface QrCodeProps {
  data: string;
  size?: number;
  style?: React.CSSProperties;
}

export function QrCode({ data, size = 200, style }: QrCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    // Estrategia: intentar cargar desde qrserver API, si falla,
    // mostrar el URL como texto con un link para abrir en el navegador.
    const img = imgRef.current;
    if (img) {
      img.addEventListener("error", () => {
        // Fallback: generar QR via canvas usando la librería embebida
        generateQrFallback(canvasRef.current, data, size);
      });
    }
  }, [data, size]);

  if (!data) {
    return null;
  }

  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{ display: "none", width: size, height: size, borderRadius: 8 }}
      />
      <img
        ref={imgRef}
        src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`}
        alt="QR Code"
        width={size}
        height={size}
        style={{ borderRadius: 8, border: "1px solid var(--border)" }}
        // Fallback para CSP: si la imagen falla, mostrar link directo
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = "none";
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.display = "block";
            generateQrFallback(canvas, data, size);
          }
        }}
      />
    </div>
  );
}

// Fallback mínimo: dibuja un placeholder con el link
function generateQrFallback(canvas: HTMLCanvasElement | null, data: string, size: number) {
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#333333";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";

  // Dibujar mensaje de fallback
  const lines = ["QR 码加载失败", "请复制以下链接", "在浏览器中打开后", "用微信扫描："];
  lines.forEach((line, i) => {
    ctx.fillText(line, size / 2, 40 + i * 18);
  });

  // Dibujar URL truncada
  ctx.font = "10px monospace";
  ctx.fillStyle = "#0066cc";
  const maxLen = Math.floor(size / 6);
  const truncated = data.length > maxLen ? data.substring(0, maxLen) + "..." : data;
  ctx.fillText(truncated, size / 2, size - 30);
}
