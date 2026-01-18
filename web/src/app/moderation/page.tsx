"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SessionWithRoles {
  user?: {
    roles?: string[];
  };
}

interface ReportListItem {
  id: string;
  reason: string;
  description?: string;
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
  createdAt: string;
  reporter: { id: string; username: string | null } | null;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-red-100 text-red-800";
    case "UNDER_REVIEW":
      return "bg-yellow-100 text-yellow-800";
    case "RESOLVED":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function ModerationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("OPEN");
  const [filterType, setFilterType] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const sessionWithRoles = session as SessionWithRoles | null;
  const userRoles = sessionWithRoles?.user?.roles || [];
  const canModerate = userRoles.includes("MODERATOR") || userRoles.includes("ADMIN");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/moderation");
    }
  }, [status, router]);

  useEffect(() => {
    if (!canModerate) return;
    
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterType) params.append("targetType", filterType);
      
      const res = await fetch(`/api/mod/reports?${params.toString()}`);
      const json = await res.json();
      setReports(json.reports || []);
      setLoading(false);
    }
    load();
  }, [filterStatus, filterType, canModerate]);

  if (status === "loading") return <div className="p-6">Loading...</div>;
  if (!canModerate) return <div className="p-6 text-red-600">Access denied. Moderator/Admin only.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Moderation Dashboard</h1>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">All Types</option>
            <option value="POST">Posts</option>
            <option value="COMMENT">Comments</option>
            <option value="USER">Users</option>
          </select>
        </div>

        {/* Reports List */}
        {loading && (
          <div className="text-center py-8 text-gray-600">Loading reports...</div>
        )}
        
        {!loading && reports.length === 0 && (
          <div className="text-center py-8 text-gray-500">No reports found.</div>
        )}
        
        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link key={report.id} href={`/moderation/${report.id}`}>
                <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-gray-300 cursor-pointer transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(report.status)}`}>
                        {report.status}
                      </span>
                      <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {report.targetType}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <p className="font-semibold text-gray-900 mb-1">{report.reason}</p>
                  {report.description && (
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{report.description}</p>
                  )}
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Reporter: {report.reporter?.username || "Anonymous"}</span>
                    <span className="text-blue-600 hover:text-blue-800">View details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
