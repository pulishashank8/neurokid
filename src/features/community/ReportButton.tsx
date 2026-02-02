"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import toast from "react-hot-toast";

interface ReportButtonProps {
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const reasons = [
    { value: "SPAM", label: "Spam or advertising" },
    { value: "HARASSMENT", label: "Harassment or bullying" },
    { value: "MISINFORMATION", label: "Misinformation" },
    { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
    { value: "HATE_SPEECH", label: "Hate speech" },
    { value: "OTHER", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Report submission failed");
      }

      toast.success(data.message, {
        style: {
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        },
      });
      setShowDialog(false);
      setReason("");
      setDetails("");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to submit report";
      toast.error(message);
      console.error("Error submitting report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="p-2.5 rounded-xl bg-[var(--surface2)] text-[var(--muted)] hover:bg-red-500/10 hover:text-red-500 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Report content"
        title="Report"
      >
        <Flag className="w-5 h-5" />
      </button>

      {showDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-up"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="bg-[var(--surface)] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-[var(--border)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <button
              onClick={() => setShowDialog(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)] transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Flag className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text)]">
                  Report {targetType.toLowerCase()}
                </h2>
                <p className="text-sm text-[var(--muted)]">Help us keep the community safe</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[var(--surface2)] border-2 border-[var(--border)] rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                  required
                >
                  <option value="">Select a reason...</option>
                  {reasons.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide any additional context..."
                  className="w-full px-4 py-3 bg-[var(--surface2)] border-2 border-[var(--border)] rounded-xl text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] resize-none min-h-[100px] transition-colors"
                  maxLength={1000}
                />
                <p className="text-xs text-[var(--muted)] mt-1 text-right">
                  {details.length}/1000
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--surface2)]/80 font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !reason}
                  className="flex-1 py-3.5 px-6 rounded-xl bg-red-500 text-white hover:bg-red-600 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-premium shadow-lg shadow-red-500/20"
                >
                  {isLoading ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
