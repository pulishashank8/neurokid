"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
    Plus,
    Calendar as CalendarIcon,
    Trophy,
    Smile,
    Star,
    Sparkles,
    Trash2,
    PartyPopper,
    Medal
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

export function DailyWinsApp() {
    const [wins, setWins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewOpen, setIsNewOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        content: "",
        category: "Milestone",
        mood: 5,
    });

    useEffect(() => {
        fetchWins();
    }, []);

    const fetchWins = async () => {
        try {
            const res = await fetch("/api/daily-wins");
            if (res.ok) {
                const data = await res.json();
                setWins(data.wins || []);
            }
        } catch (error) {
            console.error("Failed to fetch wins", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/daily-wins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    date: new Date().toISOString()
                })
            });

            if (res.ok) {
                toast.success("Daily win recorded! 🎉");
                setIsNewOpen(false);
                setFormData({
                    content: "",
                    category: "Milestone",
                    mood: 5
                });
                fetchWins();
            } else {
                toast.error("Failed to save win");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Milestone': return 'from-amber-400 to-orange-500';
            case 'Behavior': return 'from-purple-400 to-indigo-500';
            case 'Social': return 'from-blue-400 to-cyan-500';
            case 'School': return 'from-emerald-400 to-teal-500';
            case 'Home': return 'from-rose-400 to-pink-500';
            case 'Sensory': return 'from-fuchsia-400 to-magenta-500';
            default: return 'from-slate-400 to-slate-500';
        }
    };

    return (
        <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8 overflow-hidden relative">
            {/* Vibrant Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400 mb-2 flex items-center gap-3">
                            Daily Wins <Trophy className="w-10 h-10 text-amber-500 fill-amber-500 animate-bounce" />
                        </h1>
                        <p className="text-xl text-[var(--muted)] font-medium">Celebrate every victory, big or small ✨</p>
                    </motion.div>

                    <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
                        <DialogTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.05, rotate: 2 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-amber-500/30 transition-all text-lg"
                            >
                                <Plus className="w-6 h-6" />
                                Add Win
                            </motion.button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-white/20">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-center text-amber-600 dark:text-amber-400 flex justify-center items-center gap-2">
                                    <PartyPopper className="w-8 h-8" /> Celebrate a Win!
                                </DialogTitle>
                                <DialogDescription className="text-center text-lg">
                                    What awesome thing happened today?
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">What happened?</label>
                                    <textarea
                                        required
                                        className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 h-32 text-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                                        placeholder="e.g. Tried a new food without fuss!"
                                        value={formData.content}
                                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">Category</label>
                                        <select
                                            className="w-full p-3 rounded-xl border-2 border-slate-100 dark:border-white/10 bg-transparent text-lg focus:ring-amber-500"
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            <option value="Milestone">🏆 Milestone</option>
                                            <option value="Behavior">🧠 Behavior</option>
                                            <option value="Social">👋 Social</option>
                                            <option value="School">🎒 School</option>
                                            <option value="Home">🏠 Home</option>
                                            <option value="Sensory">🌈 Sensory</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold uppercase tracking-wide text-[var(--muted)]">Mood</label>
                                        <div className="flex items-center justify-between border-2 border-slate-100 dark:border-white/10 rounded-xl p-2 bg-slate-50 dark:bg-white/5">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, mood: Math.max(1, formData.mood - 1) })}
                                                className="w-12 h-12 flex items-center justify-center hover:bg-black/5 active:bg-black/10 rounded-xl text-xl font-bold transition-colors"
                                                aria-label="Decrease mood"
                                            >
                                                -
                                            </button>
                                            <div className="font-bold flex items-center gap-2 text-2xl text-amber-500">
                                                {formData.mood} <Star className="w-6 h-6 fill-amber-500" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, mood: Math.min(5, formData.mood + 1) })}
                                                className="w-12 h-12 flex items-center justify-center hover:bg-black/5 active:bg-black/10 rounded-xl text-xl font-bold transition-colors"
                                                aria-label="Increase mood"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 rounded-xl font-bold text-lg shadow-xl shadow-amber-500/30 transition-all"
                                >
                                    Save Win ✨
                                </motion.button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </header>

                {/* Wins List */}
                <div className="space-y-8 pb-20">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-20 h-20 border-8 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-6" />
                            <p className="text-xl font-medium text-[var(--muted)] animate-pulse">Loading amazing moments...</p>
                        </div>
                    ) : wins.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 px-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-3xl border-2 border-amber-100 dark:border-amber-900/30 border-dashed"
                        >
                            <Sparkles className="w-20 h-20 text-amber-400 mx-auto mb-6 animate-pulse" />
                            <h3 className="text-2xl font-bold mb-3 text-amber-900 dark:text-amber-100">No wins recorded yet</h3>
                            <p className="text-[var(--muted)] max-w-sm mx-auto mb-8 text-lg">
                                Every step forward counts. Record your first win today!
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsNewOpen(true)}
                                className="inline-flex items-center gap-2 text-amber-600 font-bold bg-amber-100 dark:bg-amber-900/50 px-6 py-3 rounded-xl hover:bg-amber-200 transition-colors"
                            >
                                Record a win
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
                            <AnimatePresence>
                                {wins.map((win, index) => (
                                    <motion.div
                                        key={win.id}
                                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.4, delay: index * 0.1, type: "spring", bounce: 0.4 }}
                                        whileHover={{ y: -5, scale: 1.02 }}
                                        className="relative overflow-hidden group bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 transition-all"
                                    >
                                        {/* Decorative Background Icon */}
                                        <div className="absolute -top-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 group-hover:rotate-45 duration-500">
                                            <Trophy className="w-40 h-40" />
                                        </div>

                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className={`px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getCategoryColor(win.category)} shadow-md`}>
                                                    {win.category || "General"}
                                                </div>
                                                <span className="text-sm text-[var(--muted)] font-medium bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg">
                                                    {format(new Date(win.date), "MMM d")}
                                                </span>
                                            </div>

                                            <p className="text-2xl text-[var(--foreground)] font-medium leading-relaxed mb-6 flex-grow">
                                                "{win.content}"
                                            </p>

                                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100 dark:border-white/5">
                                                <div className="flex items-center gap-1.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-5 h-5 ${i < (win.mood || 0) ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'text-slate-200 dark:text-slate-700'}`}
                                                        />
                                                    ))}
                                                </div>
                                                {win.mood === 5 && (
                                                    <div className="flex items-center gap-1 text-amber-500 text-sm font-bold">
                                                        <Medal className="w-4 h-4" /> Top Win
                                                    </div>
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
