"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trees } from "lucide-react";

export default function ZenGardenPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sand color background
    ctx.fillStyle = "#D4B896";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some texture
    for (let i = 0; i < 1000; i++) {
      ctx.fillStyle = `rgba(139, 119, 101, ${Math.random() * 0.1})`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2
      );
    }
  };

  useEffect(() => {
    clearCanvas();
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    // Draw zen lines
    ctx.lineCap = "round";
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = "#C4A876";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Add inner darker line for depth
    ctx.lineWidth = brushSize * 0.4;
    ctx.strokeStyle = "#8B7765";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 dark:from-amber-950/20 dark:to-stone-950/20 pt-24 pb-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--text)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-stone-500 flex items-center justify-center shadow-lg">
                <Trees className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Zen Garden</h1>
                <p className="text-sm text-[var(--muted)]">Draw in the sand to relax</p>
              </div>
            </div>

            <button
              onClick={clearCanvas}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-amber-200 dark:border-amber-800/30 text-[var(--muted)] hover:text-amber-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 rounded-xl bg-white dark:bg-white/5 border border-amber-200 dark:border-amber-900/40">
          <label className="text-sm font-medium text-[var(--text)] block mb-2">
            Brush Size: {brushSize}
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <div className="rounded-2xl overflow-hidden border-4 border-amber-200 dark:border-amber-800/40 shadow-xl">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full touch-none cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
          />
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-amber-100 dark:border-amber-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            🧘 Take a deep breath. Draw slowly. Feel calm.
          </p>
        </div>
      </div>
    </div>
  );
}

