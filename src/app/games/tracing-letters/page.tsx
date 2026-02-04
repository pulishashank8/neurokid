"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

const letters = ["A", "B", "C", "D", "E", "F"];

export default function TracingLettersPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLetter, setCurrentLetter] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw letter outline
    ctx.font = "bold 200px Arial";
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letters[currentLetter], canvas.width / 2, canvas.height / 2);
  };

  useEffect(() => {
    clearCanvas();
  }, [currentLetter]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
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

    ctx.lineCap = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#f97316";
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const nextLetter = () => {
    setCurrentLetter((c) => (c + 1) % letters.length);
  };

  const prevLetter = () => {
    setCurrentLetter((c) => (c - 1 + letters.length) % letters.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 pt-24 pb-8 px-4">
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
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
                <Pencil className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text)]">Tracing Letters</h1>
                <p className="text-sm text-[var(--muted)]">Follow the path to write</p>
              </div>
            </div>

            <button
              onClick={clearCanvas}
              className="p-3 rounded-xl bg-white dark:bg-white/10 border border-orange-200 dark:border-orange-800/30 text-[var(--muted)] hover:text-orange-500 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-orange-200 dark:border-orange-900/40">
          <button
            onClick={prevLetter}
            className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-500 hover:bg-orange-200"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-2xl font-bold text-[var(--text)]">
            Letter: {letters[currentLetter]}
          </span>
          <button
            onClick={nextLetter}
            className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-500 hover:bg-orange-200"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border-4 border-orange-200 dark:border-orange-800/40 bg-white">
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

        <div className="mt-6 p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-orange-100 dark:border-orange-900/30">
          <p className="text-sm text-[var(--muted)] text-center">
            Tip: Use your finger or mouse to trace over the gray letter!
          </p>
        </div>
      </div>
    </div>
  );
}

