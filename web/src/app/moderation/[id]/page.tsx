"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ReportDetail {
  id: string;
  reason: string;
  description?: string;
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
  targetTitle?: string;
  targetContent?: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: { id: string; username: string | null } | null;
}

interface ActionResponse {
  success: boolean;
  message?: string;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reportId, setReportId] = useState<string>("");
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  const canModerate = (session?.user as any)?.roles?.includes("MODERATOR") || (session?.user as any)?.roles?.includes("ADMIN");

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setReportId(id);
    })();
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/moderation");
    }
  }, [status, router]);

  useEffect(() => {
    if (!canModerate || !reportId) return;

    async function loadReport() {
      setLoading(true);
      const res = await fetch(`/api/mod/reports/${reportId}`);
      if (res.ok) {
        const json = await res.json();
        setReport(json);
      } else {
        setFeedback({ type: "error", message: "Failed to load report" });
      }
      setLoading(false);
    }

    loadReport();
  }, [reportId, canModerate]);

  const handleAction = async (action: string, payload?: any) => {
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/mod/actions/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, targetId: report?.targetId }),
      });
      const json = (await res.json()) as ActionResponse;
      
      if (res.ok) {
        setFeedback({ type: "success", message: json.message || `${action} completed` });
        setTimeout(() => router.push("/moderation"), 2000);
      } else {
        setFeedback({ type: "error", message: json.message || `${action} failed` });
      }
    } catch (err) {
      console.error("Moderation action failed:", err);
      setFeedback({ type: "error", message: "Action failed" });
    }
    setActionInProgress(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/mod/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      
      if (res.ok) {
        setReport((prev) => prev ? { ...prev, status: newStatus as any } : null);
        setFeedback({ type: "success", message: "Report status updated" });
      } else {
        setFeedback({ type: "error", message: json.message || "Status update failed" });
      }
    } catch (err) {
      console.error("Status update failed:", err);
      setFeedback({ type: "error", message: "Status update failed" });
    }
    setActionInProgress(false);
  };

  if (status === "loading" || loading) return <div className="p-6">Loading...</div>;
  if (!canModerate) return <div className="p-6 text-red-600">Access denied. Moderator/Admin only.</div>;
  if (!report) return <div className="p-6">Report not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/moderation" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Reports
        </Link>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{report.reason}</h1>
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 text-sm rounded-full font-semibold ${
                  report.status === "OPEN" ? "bg-red-100 text-red-800" :
                  report.status === "UNDER_REVIEW" ? "bg-yellow-100 text-yellow-800" :
                  report.status === "RESOLVED" ? "bg-green-100 text-green-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {report.status}
                </span>
                <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                  {report.targetType}
                </span>
              </div>
            </div>
            <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleString()}</span>
          </div>

          <div className="border-t pt-4">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Report Reason</h3>
              <p className="text-gray-700">{report.reason}</p>
            </div>

            {report.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-1">Details</h3>
                <p className="text-gray-700">{report.description}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-1">Reporter</h3>
              <p className="text-gray-700">{report.reporter?.username || "Anonymous"}</p>
            </div>

            {report.targetContent && (
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded p-3">
                <h3 className="font-semibold text-gray-900 mb-2">Reported Content</h3>
                <p className="text-gray-700">{report.targetContent}</p>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`mb-4 p-3 rounded ${
            feedback.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Moderation Actions</h2>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleStatusUpdate("UNDER_REVIEW")}
              disabled={actionInProgress || report.status === "UNDER_REVIEW"}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:bg-gray-300"
            >
              Mark as Under Review
            </button>
            <button
              onClick={() => handleStatusUpdate("RESOLVED")}
              disabled={actionInProgress || report.status === "RESOLVED"}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              Mark as Resolved
            </button>
            <button
              onClick={() => handleStatusUpdate("DISMISSED")}
              disabled={actionInProgress || report.status === "DISMISSED"}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300"
            >
              Dismiss Report
            </button>
          </div>

          {report.targetType !== "USER" && (
            <>
              <h3 className="font-semibold mb-3 text-gray-900">Content Moderation</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => handleAction("remove")}
                  disabled={actionInProgress}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
                >
                  Remove Content
                </button>
                <button
                  onClick={() => handleAction("lock")}
                  disabled={actionInProgress}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-300"
                >
                  Lock {report.targetType === "POST" ? "Post" : "Comment"}
                </button>
              </div>
            </>
          )}

          {report.targetType === "USER" && (
            <>
              <h3 className="font-semibold mb-3 text-gray-900">User Moderation</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleAction("suspend")}
                  disabled={actionInProgress}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-300"
                >
                  Suspend User
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
