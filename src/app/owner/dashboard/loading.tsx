export default function OwnerDashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-400 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}
