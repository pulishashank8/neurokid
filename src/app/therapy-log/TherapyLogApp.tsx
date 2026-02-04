"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { BackButton } from "@/components/ui/BackButton";
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    Smile,
    AlertCircle,
    Check,
    ChevronRight,
    ClipboardList,
    Search,
    Activity,
    Sparkles
} from "lucide-react";

import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export function TherapyLogApp() {
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewOpen, setIsNewOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Form state
    const [formData, setFormData] = useState({
        childName: "",
        therapistName: "",
        therapyType: "ABA",
        duration: 60,
        mood: 3,
        notes: "",
        wentWell: "",
        toWorkOn: ""
    });

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await fetch("/api/therapy-sessions");
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
            }
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/therapy-sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    sessionDate: date?.toISOString()
                })
            });

            if (res.ok) {
                toast.success("Session logged successfully");
                setIsNewOpen(false);
                setFormData({
                    childName: "",
                    therapistName: "",
                    therapyType: "ABA",
                    duration: 60,
                    mood: 3,
                    notes: "",
                    wentWell: "",
                    toWorkOn: ""
                });
                fetchSessions();
            } else {
                toast.error("Failed to save session");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const getTherapyColor = (type: string) => {
        switch (type) {
            case 'ABA': return 'from-blue-500 to-indigo-600';
            case 'Speech': return 'from-emerald-400 to-teal-500';
            case 'Occupational': return 'from-orange-400 to-amber-500';
            case 'Physical': return 'from-rose-400 to-pink-600';
            case 'Behavioral': return 'from-purple-500 to-violet-600';
            default: return 'from-slate-500 to-slate-700';
        }
    };

    const getTherapyIcon = (type: string) => {
        switch (type) {
            case 'ABA': return '🧩';
            case 'Speech': return '🗣️';
            case 'Occupational': return '🖐️';
            case 'Physical': return '🏃';
            case 'Behavioral': return '🧠';
            case 'Social Skills': return '👥';
            default: return '📝';
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] px-4 pt-24 pb-8 sm:px-6 lg:px-8 overflow-hidden relative">
            {/* Ambient backgrounds */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Back Button */}
                <div className="mb-6">
                    <BackButton fallbackPath="/dashboard" />
                </div>

                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
                            Therapy Log
                        </h1>
                        <p className="text-lg text-[var(--muted)] flex items-center gap-2">
                            Track progress, celebrate growth <Sparkles className="w-4 h-4 text-amber-500" />
                        </p>
                    </motion.div>

                    <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                        <DialogTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/40"
                            >
                                <Plus className="w-5 h-5" />
                                Log New Session
                            </motion.button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Log New Therapy Session</DialogTitle>
                                <DialogDescription>
                                    Record details about today's therapy session.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Child Name</label>
                                        <input
                                            required
                                            className="w-full p-3 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="e.g. Alex"
                                            value={formData.childName}
                                            onChange={e => setFormData({ ...formData, childName: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Therapist Name</label>
                                        <input
                                            required
                                            className="w-full p-3 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="e.g. Dr. Sarah"
                                            value={formData.therapistName}
                                            onChange={e => setFormData({ ...formData, therapistName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Therapy Type</label>
                                        <select
                                            className="w-full p-3 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={formData.therapyType}
                                            onChange={e => setFormData({ ...formData, therapyType: e.target.value })}
                                        >
                                            <option value="ABA">🧩 ABA Therapy</option>
                                            <option value="Speech">🗣️ Speech Therapy</option>
                                            <option value="Occupational">🖐️ Occupational Therapy</option>
                                            <option value="Physical">🏃 Physical Therapy</option>
                                            <option value="Behavioral">🧠 Behavioral Therapy</option>
                                            <option value="Social Skills">👥 Social Skills Group</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Duration (minutes)</label>
                                        <input
                                            type="number"
                                            className="w-full p-3 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500 transition-all"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Mood (1-5)</label>
                                    <div className="flex items-center gap-4">
                                        {[1, 2, 3, 4, 5].map(rating => (
                                            <button
                                                key={rating}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, mood: rating })}
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 transition-all transform hover:scale-110 ${formData.mood === rating
                                                    ? 'bg-blue-100 border-blue-500 text-3xl shadow-lg scale-110'
                                                    : 'bg-transparent border-slate-200 dark:border-slate-700 text-2xl grayscale hover:grayscale-0'
                                                    }`}
                                            >
                                                {rating === 1 ? '😫' : rating === 2 ? '😕' : rating === 3 ? '😐' : rating === 4 ? '🙂' : '😁'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Session Notes</label>
                                    <textarea
                                        className="w-full p-3 rounded-xl border bg-transparent h-24 focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="What happened during the session?"
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">What went well? ✨</label>
                                        <textarea
                                            className="w-full p-3 rounded-xl border bg-transparent h-20 focus:ring-2 focus:ring-green-500 transition-all"
                                            placeholder="Successes..."
                                            value={formData.wentWell}
                                            onChange={e => setFormData({ ...formData, wentWell: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">To work on 🎯</label>
                                        <textarea
                                            className="w-full p-3 rounded-xl border bg-transparent h-20 focus:ring-2 focus:ring-orange-500 transition-all"
                                            placeholder="Challenges..."
                                            value={formData.toWorkOn}
                                            onChange={e => setFormData({ ...formData, toWorkOn: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    Save Session
                                </motion.button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </header>

                {/* Sessions List */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                            <p className="text-[var(--muted)] animate-pulse">Loading sessions...</p>
                        </div>
                    ) : sessions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-white/10 shadow-xl"
                        >
                            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                                📝
                            </div>
                            <h3 className="text-2xl font-bold mb-2">No sessions logged yet</h3>
                            <p className="text-[var(--muted)] max-w-sm mx-auto mb-8 text-lg">
                                Start tracking your therapy journey by logging your first session.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsNewOpen(true)}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                                Log First Session
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="grid gap-6">
                            <AnimatePresence>
                                {sessions.map((session, index) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group relative bg-white dark:bg-slate-900/60 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-lg hover:shadow-2xl hover:border-blue-500/30 transition-all duration-300"
                                    >
                                        {/* Gradient Border Effect on Hover */}
                                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                        <div className="relative z-10">
                                            <div className="flex flex-col sm:flex-row justify-between gap-6 mb-6">
                                                <div className="flex items-start gap-5">
                                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTherapyColor(session.therapyType)} flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                                                        {getTherapyIcon(session.therapyType)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-xl sm:text-2xl mb-1">{session.therapyType} Session</h3>
                                                        <p className="text-[var(--muted)] font-medium text-base">with {session.therapistName}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="flex -space-x-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <div key={i} className={`w-2 h-2 rounded-full ${i < session.mood ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                                                ))}
                                                            </div>
                                                            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest ml-2">Mood</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-left sm:text-right bg-slate-50 dark:bg-black/20 p-4 rounded-xl self-start">
                                                    <div className="font-bold text-lg">{format(new Date(session.sessionDate), "MMM d, yyyy")}</div>
                                                    <div className="text-sm text-[var(--muted)] flex items-center gap-1 sm:justify-end mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {session.duration} minutes
                                                    </div>
                                                </div>
                                            </div>

                                            {session.notes && (
                                                <p className="text-base text-slate-700 dark:text-slate-300 mb-6 leading-relaxed bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                                    {session.notes}
                                                </p>
                                            )}

                                            <div className="flex flex-wrap gap-3">
                                                {session.wentWell && (
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                                        <span className="text-lg">✨</span>
                                                        {session.wentWell}
                                                    </span>
                                                )}
                                                {session.toWorkOn && (
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                                                        <span className="text-lg">🎯</span>
                                                        {session.toWorkOn}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
