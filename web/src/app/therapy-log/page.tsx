"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  ThumbsUp, 
  Target, 
  Smile, 
  Trash2, 
  X,
  ClipboardList,
  ChevronDown
} from "lucide-react";

type TherapyType = "ABA" | "OCCUPATIONAL" | "SPEECH" | "BEHAVIORAL" | "PLAY" | "SOCIAL_SKILLS" | "PHYSICAL" | "OTHER";

interface TherapySession {
  id: string;
  childName: string;
  therapistName: string;
  therapyType: TherapyType;
  sessionDate: string;
  duration: number;
  notes: string | null;
  wentWell: string | null;
  toWorkOn: string | null;
  mood: number | null;
  createdAt: string;
}

const THERAPY_TYPES: { value: TherapyType; label: string; color: string }[] = [
  { value: "ABA", label: "ABA Therapy", color: "bg-blue-500" },
  { value: "SPEECH", label: "Speech Therapy", color: "bg-emerald-500" },
  { value: "OCCUPATIONAL", label: "Occupational Therapy", color: "bg-purple-500" },
  { value: "BEHAVIORAL", label: "Behavioral Therapy", color: "bg-amber-500" },
  { value: "PLAY", label: "Play Therapy", color: "bg-pink-500" },
  { value: "SOCIAL_SKILLS", label: "Social Skills", color: "bg-teal-500" },
  { value: "PHYSICAL", label: "Physical Therapy", color: "bg-orange-500" },
  { value: "OTHER", label: "Other", color: "bg-gray-500" },
];

const MOODS = [
  { value: 1, emoji: "😢", label: "Very Difficult" },
  { value: 2, emoji: "😕", label: "Challenging" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great!" },
];

export default function TherapyLogPage() {
  const router = useRouter();
  const { status } = useSession();
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    childName: "",
    therapistName: "",
    therapyType: "ABA" as TherapyType,
    sessionDate: new Date().toISOString().split("T")[0],
    duration: 60,
    notes: "",
    wentWell: "",
    toWorkOn: "",
    mood: 3,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/therapy-log");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSessions();
    }
  }, [status]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/therapy-sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await fetchSessions();
        setShowForm(false);
        setForm({
          childName: form.childName,
          therapistName: form.therapistName,
          therapyType: form.therapyType,
          sessionDate: new Date().toISOString().split("T")[0],
          duration: 60,
          notes: "",
          wentWell: "",
          toWorkOn: "",
          mood: 3,
        });
      }
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      const res = await fetch(`/api/therapy-sessions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions(sessions.filter((s) => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const getTherapyTypeInfo = (type: TherapyType) => {
    return THERAPY_TYPES.find((t) => t.value === type) || THERAPY_TYPES[7];
  };

  const getMoodInfo = (mood: number | null) => {
    return MOODS.find((m) => m.value === mood) || MOODS[2];
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--background)]">
        <div className="w-12 h-12 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold mb-2">
              <ClipboardList className="w-4 h-4" />
              Track Progress
            </div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Therapy Session Log</h1>
            <p className="text-[var(--muted)] mt-1">Keep track of all therapy sessions in one place</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Log Session
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl">
              <div className="sticky top-0 flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--surface)]">
                <h2 className="text-xl font-bold text-[var(--text)]">Log Therapy Session</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg hover:bg-[var(--surface2)] text-[var(--muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Child's Name
                    </label>
                    <input
                      type="text"
                      value={form.childName}
                      onChange={(e) => setForm({ ...form, childName: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Enter child's name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Therapist Name
                    </label>
                    <input
                      type="text"
                      value={form.therapistName}
                      onChange={(e) => setForm({ ...form, therapistName: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="Enter therapist's name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    Therapy Type
                  </label>
                  <div className="relative">
                    <select
                      value={form.therapyType}
                      onChange={(e) => setForm({ ...form, therapyType: e.target.value as TherapyType })}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    >
                      {THERAPY_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted)] pointer-events-none" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={form.sessionDate}
                      onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text)] mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                      min="15"
                      max="240"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <Smile className="w-4 h-4 inline mr-2" />
                    How did it go?
                  </label>
                  <div className="flex justify-between gap-2">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.value}
                        type="button"
                        onClick={() => setForm({ ...form, mood: mood.value })}
                        className={`flex-1 py-3 rounded-xl text-2xl transition-all ${
                          form.mood === mood.value
                            ? "bg-[var(--primary)] shadow-lg scale-105"
                            : "bg-[var(--surface2)] hover:bg-[var(--surface2)]/80"
                        }`}
                        title={mood.label}
                      >
                        {mood.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <ThumbsUp className="w-4 h-4 inline mr-2" />
                    What went well?
                  </label>
                  <textarea
                    value={form.wentWell}
                    onChange={(e) => setForm({ ...form, wentWell: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Successes, breakthroughs, positive moments..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <Target className="w-4 h-4 inline mr-2" />
                    Areas to work on
                  </label>
                  <textarea
                    value={form.toWorkOn}
                    onChange={(e) => setForm({ ...form, toWorkOn: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Goals for next session, challenges to address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text)] mb-2">
                    <FileText className="w-4 h-4 inline mr-2" />
                    Additional Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="Any other observations or notes..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-5 py-3 rounded-xl bg-[var(--surface2)] text-[var(--text)] font-medium hover:bg-[var(--surface2)]/80 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-5 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 disabled:opacity-50 transition-all"
                  >
                    {saving ? "Saving..." : "Save Session"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--surface2)] flex items-center justify-center">
              <ClipboardList className="w-10 h-10 text-[var(--muted)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--text)] mb-2">No sessions logged yet</h3>
            <p className="text-[var(--muted)] mb-6">Start tracking your child's therapy progress</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-semibold shadow-lg shadow-[var(--primary)]/25 hover:shadow-[var(--primary)]/40 transition-all"
            >
              <Plus className="w-5 h-5" />
              Log Your First Session
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const typeInfo = getTherapyTypeInfo(session.therapyType);
              const moodInfo = getMoodInfo(session.mood);
              const date = new Date(session.sessionDate);

              return (
                <div
                  key={session.id}
                  className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 shadow-premium hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${typeInfo.color} flex items-center justify-center text-white text-xl`}>
                        {moodInfo.emoji}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[var(--text)]">{session.childName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          with {session.therapistName} • {session.duration} min
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-[var(--muted)]">
                        <div className="font-medium text-[var(--text)]">
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                        <div>{date.getFullYear()}</div>
                      </div>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"
                        title="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(session.wentWell || session.toWorkOn || session.notes) && (
                    <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                      {session.wentWell && (
                        <div className="flex gap-3">
                          <ThumbsUp className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">What went well</p>
                            <p className="text-sm text-[var(--text)]">{session.wentWell}</p>
                          </div>
                        </div>
                      )}
                      {session.toWorkOn && (
                        <div className="flex gap-3">
                          <Target className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-0.5">To work on</p>
                            <p className="text-sm text-[var(--text)]">{session.toWorkOn}</p>
                          </div>
                        </div>
                      )}
                      {session.notes && (
                        <div className="flex gap-3">
                          <FileText className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-0.5">Notes</p>
                            <p className="text-sm text-[var(--text)]">{session.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-200 dark:border-blue-900/20 p-5">
          <p className="text-sm text-blue-800 dark:text-blue-200/80 text-center">
            <strong>Tip:</strong> Regular logging helps you track progress and share insights with your child's care team.
          </p>
        </div>
      </div>
    </div>
  );
}
