"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
    BookOpen,
    Sparkles,
    Play,
    Pause,
    Volume2,
    Music,
    Send,
    Loader2,
    Dice5,
    Grid,
    X,
    ChevronLeft,
    ChevronRight,
    Heart,
    Filter
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useSpeechSynthesis } from "@/features/aac/hooks/useSpeechSynthesis";
import { POPULAR_RHYMES, RHYME_LANGUAGES, type Rhyme } from "@/features/stories/rhymes-data";

// AWS Polly Voice options for TTS
const VOICE_OPTIONS = [
    // Child voices (US)
    { id: "Ivy", label: "Ivy", description: "Child Girl (US)", emoji: "👧", previewText: "Hi there! I'm Ivy, a friendly kid just like you! Let's have an adventure together!", useBrowser: false },
    { id: "Justin", label: "Justin", description: "Child Boy (US)", emoji: "👦", previewText: "Hey! I'm Justin! I love reading stories about dragons and superheroes!", useBrowser: false },
    { id: "Kevin", label: "Kevin", description: "Child Boy (US)", emoji: "🧒", previewText: "Hello! I'm Kevin! Want to hear an amazing story? Let's go!", useBrowser: false },
    // Indian voices
    { id: "Kajal", label: "Kajal", description: "Hindi (India)", emoji: "🇮🇳", previewText: "नमस्ते! मैं काजल हूं। आज मैं आपको एक मज़ेदार कहानी सुनाऊंगी!", useBrowser: false },
    { id: "Kajal-en", label: "Kajal", description: "Indian English", emoji: "🇮🇳", previewText: "Hello! I'm Kajal. I speak English with an Indian accent. Let me tell you a wonderful story!", useBrowser: false },
    { id: "Telugu", label: "Telugu", description: "Telugu (Browser)", emoji: "🇮🇳", previewText: "నమస్కారం! నేను మీకు ఒక అద్భుతమైన కథ చెప్తాను!", useBrowser: true, langCode: "te-IN" },
    // Adult voices (US)
    { id: "Joanna", label: "Joanna", description: "Friendly Female (US)", emoji: "👩", previewText: "Hello! I'm Joanna. I'll read you a wonderful bedtime story tonight.", useBrowser: false },
    { id: "Matthew", label: "Matthew", description: "Warm Male (US)", emoji: "👨", previewText: "Hey there! I'm Matthew. Get cozy and let me tell you an amazing tale.", useBrowser: false },
    { id: "Salli", label: "Salli", description: "Gentle Female (US)", emoji: "👩‍🦰", previewText: "Hi sweetie! I'm Salli. Let's explore magical worlds together!", useBrowser: false },
] as const;

type VoiceId = typeof VOICE_OPTIONS[number]["id"];

const RANDOM_STORY_TOPICS = [
    "a brave space explorer on Mars",
    "a magical forest where animals talk",
    "a friendly dragon who loves baking cookies",
    "a secret underground city of cats",
    "a time-traveling toaster",
    "a superhero who protects local parks",
    "a giant whale who sings to the moon",
    "a classroom of robots learning to paint",
    "a kingdom where it rains marshmallows",
    "a tiny mouse who builds a rocket ship"
];

export function StoryAssistant() {
    const [topic, setTopic] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [story, setStory] = useState("");
    const [volume, setVolume] = useState(1);
    const [autoPlay, setAutoPlay] = useState(false);
    const [showRhymeGallery, setShowRhymeGallery] = useState(false);
    const [rhymeLanguageFilter, setRhymeLanguageFilter] = useState<string>("All");
    const [savedRhymeIds, setSavedRhymeIds] = useState<Set<string>>(new Set());
    const [showLikedRhymesOnly, setShowLikedRhymesOnly] = useState(false);
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<string>("Ivy");
    const [showVoiceMenu, setShowVoiceMenu] = useState(false);
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const voiceMenuRef = useRef<HTMLDivElement>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    const { data: session } = useSession();

    const SAVED_RHYMES_STORAGE_KEY = "neurokid_saved_rhyme_ids";

    const getLocalSavedRhymeIds = useCallback((): Set<string> => {
        if (typeof window === "undefined") return new Set();
        try {
            const raw = window.localStorage.getItem(SAVED_RHYMES_STORAGE_KEY);
            const arr = raw ? (JSON.parse(raw) as string[]) : [];
            return new Set(Array.isArray(arr) ? arr : []);
        } catch {
            return new Set();
        }
    }, []);

    const setLocalSavedRhymeIds = useCallback((ids: Set<string>) => {
        try {
            window.localStorage.setItem(SAVED_RHYMES_STORAGE_KEY, JSON.stringify([...ids]));
        } catch {
            // ignore
        }
    }, []);

    const fetchSavedRhymeIds = useCallback(async () => {
        const fromLocal = getLocalSavedRhymeIds();
        if (!session?.user) {
            setSavedRhymeIds(fromLocal);
            return;
        }
        try {
            const res = await fetch("/api/rhymes/save");
            const data = await res.json();
            const fromApi = data.savedIds && Array.isArray(data.savedIds) ? new Set(data.savedIds) : new Set<string>();
            setSavedRhymeIds(new Set([...fromApi, ...fromLocal]));
        } catch {
            setSavedRhymeIds(fromLocal);
        }
    }, [session?.user, getLocalSavedRhymeIds]);

    // Fetch saved rhyme IDs when modal opens and user is logged in
    useEffect(() => {
        if (!showRhymeGallery || !session?.user) return;
        fetchSavedRhymeIds();
    }, [showRhymeGallery, session?.user, fetchSavedRhymeIds]);

    // AWS Polly State
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const pollyAudioRef = useRef<HTMLAudioElement | null>(null);


    const { speak, cancel, isSpeaking, currentWordIndex } = useSpeechSynthesis({
        volume,
        pitch: 1,
        rate: 0.85,
    });

    // Stop video when speaking starts, stop speaking when video starts
    useEffect(() => {
        if (activeVideoId) cancel();
    }, [activeVideoId, cancel]);

    // Close voice menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (voiceMenuRef.current && !voiceMenuRef.current.contains(event.target as Node)) {
                setShowVoiceMenu(false);
            }
        };
        if (showVoiceMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showVoiceMenu]);

    useEffect(() => {
        if (isSpeaking) setActiveVideoId(null);
    }, [isSpeaking]);

    // Preview voice function using AWS Polly or Browser Speech
    const previewVoice = async (voiceId: VoiceId) => {
        // Stop any current preview or story playback
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }
        if (typeof window !== "undefined") {
            window.speechSynthesis.cancel();
        }
        cancel();

        setPreviewingVoice(voiceId);

        const voice = VOICE_OPTIONS.find(v => v.id === voiceId);
        if (!voice) {
            setPreviewingVoice(null);
            return;
        }

        // Use browser speech synthesis for Telugu
        if (voice.useBrowser && typeof window !== "undefined") {
            const utterance = new SpeechSynthesisUtterance(voice.previewText);
            utterance.lang = voice.langCode || "te-IN";
            utterance.rate = 0.85;
            utterance.volume = volume;

            const voices = window.speechSynthesis.getVoices();
            const teluguVoice = voices.find(v =>
                v.lang.startsWith("te") || v.name.toLowerCase().includes("telugu")
            );
            if (teluguVoice) {
                utterance.voice = teluguVoice;
            }

            utterance.onend = () => setPreviewingVoice(null);
            utterance.onerror = () => setPreviewingVoice(null);

            window.speechSynthesis.speak(utterance);
            return;
        }

        // Use AWS Polly for other voices
        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: voice.previewText,
                    voice: voiceId,
                }),
            });

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = new Audio(audioUrl);
                previewAudioRef.current = audio;
                audio.volume = volume;

                audio.onended = () => {
                    setPreviewingVoice(null);
                    URL.revokeObjectURL(audioUrl);
                    previewAudioRef.current = null;
                };

                audio.onerror = () => {
                    setPreviewingVoice(null);
                    URL.revokeObjectURL(audioUrl);
                    previewAudioRef.current = null;
                };

                await audio.play();
            } else {
                setPreviewingVoice(null);
            }
        } catch (error) {
            console.error("Voice preview failed:", error);
            setPreviewingVoice(null);
        }
    };

    // Stop preview when menu closes
    useEffect(() => {
        if (!showVoiceMenu && previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
            setPreviewingVoice(null);
        }
    }, [showVoiceMenu]);

    const words = useMemo(() => {
        if (!story) return [];
        return story.split(/\s+/);
    }, [story]);

    const generateStory = async (customTopic?: string) => {
        // If customTopic is empty (Surprise Me case), use the generic trigger
        const userPrompt = customTopic || topic || "Tell me a completely random, amazing story";
        const promptLower = userPrompt.toLowerCase();

        // Detect requested language for explicit instruction (entire story must be in that language)
        const langInstruction = promptLower.match(/\btelugu\b/i)
            ? "Write the ENTIRE story in Telugu. Use ONLY English/Latin letters. Every single word must be Telugu—e.g. 'Anaganagaa oka roju... Amma, ela unnaru?' NO English narrative."
            : promptLower.match(/\bhindi\b/i)
                ? "Write the ENTIRE story in Hindi. Use ONLY English/Latin letters. Every single word must be Hindi—e.g. 'Ek samay ki baat hai... Maa, aap kaise hain?' NO English narrative."
                : promptLower.match(/\bspanish\b/i)
                    ? "Write the ENTIRE story in Spanish. Use Latin letters. Every word must be Spanish. NO English narrative."
                    : promptLower.match(/\bmarathi\b|\btamil\b/i)
                        ? "Write the ENTIRE story in the requested language. Use ONLY English/Latin letters. Every word must be in that language. NO English narrative."
                        : null;

        setIsGenerating(true);
        setStory("");
        setActiveVideoId(null);
        cancel();
        if (pollyAudioRef.current) {
            pollyAudioRef.current.pause();
            pollyAudioRef.current = null;
        }

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    conversationType: "story",
                    messages: [
                        {
                            role: "system",
                            content: `You are "StoryWeaver", a world-renowned children's book author fluent in English, Hindi, Telugu, Spanish, Marathi, Tamil, and other languages.

**HARD RULES (NEVER VIOLATE):**
1. **Islam/Islamic content (STRICT REFUSAL):** Do not write, mention, or show anything related to Islam, Muslim, Mohammed (or Muhammad), Quran, or Islamic religion. If the user asks for such content, do NOT give any story. Instead, tell them: "Please search for different kinds of content, or try clicking 'Surprise Me' for fun general stories."
2. **DEFAULT = GENERAL STORIES ONLY:** Do not give religious or controversial stories unless the user explicitly searches for them. By default, give only general stories (adventures, animals, fantasy, etc.).
3. **RELIGIOUS STORIES - ONLY WHEN EXPLICITLY REQUESTED:** Hinduism, Christianity, Judaism, Buddhism, Sikhism, and Jainism stories may be given ONLY when the user explicitly searches for them (e.g. "Ramayana", "Jesus story", "Buddha", "Guru Nanak", "Mahavira"). Islam is never allowed, even if requested. All other religions: only when specifically asked.
4. **DEFAULT LANGUAGE = ENGLISH:** If the user does NOT explicitly mention a language (e.g. "Telugu lo", "Hindi me", "in Spanish"), write ONLY in English. "Surprise Me", "King", "elephant story", generic topics—ALL must be in English only.

**WHEN TO USE ANOTHER LANGUAGE:** Only when the user EXPLICITLY asks for it (e.g. "Telugu lo elephant", "Hindi me Ramayana", "Spanish me dog"). Then write the ENTIRE story in that language using English/Latin letters.

**WRONG (NEVER DO THIS):** Writing in English with a few Telugu/Hindi words like "Once upon a time in a village there lived a girl named Siri. Amma said..." — This is WRONG. That is mostly English.

**RIGHT (when language IS specified):** When user explicitly asks for Telugu/Hindi/Spanish/etc., write the ENTIRE story in that language. Use ONLY English/Latin letters.
- **Telugu example:** "Anaganagaa oka roju, rendu pedda nadiyulu madhya unnna chinna ooru lo, Siri ane chinna ammayi undedi. Amma, nenu ela unnanu? Tinnara?"
- **Hindi example:** "Ek samay ki baat hai, do nadiyon ke beech ek chhote gaon mein Siri naam ki ek ladki rehti thi. Maa, aap kaise hain? Aapne khaana khaya?"

**SUMMARY:** No language specified OR Surprise Me → English only. Language explicitly mentioned → that language in English/Latin letters.

**YOUR GOAL:** Write a rich, immersive story based on the user's topic in the correct language.

**STORYTELLING RULES (STRICT):**
1.  **Length & Depth:** The story MUST be substantial (approx. 800-1000 words) to provide a solid 4-5 minute reading/listening experience. Use dialogue and descriptive world-building.
2.  **Expertise (Mythology & Faith):** When the user explicitly requests them, you can tell stories from Hinduism (Ramayana, Mahabharata), Christianity (Jesus, Bible stories, Christmas), Judaism, Buddhism (Buddha), Sikhism (Guru Nanak), and Jainism (Mahavira)—with great respect and magical detail. Never Islam. Only when specifically asked.
3.  **Kids Version Only:** Every story—especially mythological or religious ones—MUST be a **version for kids**. Focus on wonder, kindness, and positive messages.
4.  **Structure:**
    *   **The Hook:** Start with "Once upon a time..." (or equivalent in requested language: Telugu "Anaganagaa oka roju...", Hindi "Ek samay ki baat hai...", Spanish "Érase una vez...", etc.—always in English/Latin letters with correct phonetic spelling for that language)
    *   **The Journey:** The main character must face obstacles and meet interesting friends.
    *   **The Climax:** A moment of excitement or big decision.
    *   **The Resolution:** A warm, happy ending with a clear moral about kindness, courage, or friendship.
5.  **Style:** Use sensory details (sights, sounds, smells). Be funny, whimsical, and heartwarming.
6.  **Classic & Epic Tales:** If the user asks for a known story (e.g., "Cinderella") or an epic (e.g., "Ramayana"), retell it faithfully but with your own magical descriptive flair.
7.  **New Stories:** If the user gives a simple topic (e.g., "Dog"), invent a specific character and write that specific adventure.

**FORMATTING:**
*   Use short paragraphs (easier to read).
*   Use **bold** for emphasis on sound effects.

**TONE:** Enthusiastic, gentle, and child-safe.

**Topic:** ${userPrompt}
`
                        },
                        {
                            role: "user",
                            content: langInstruction
                                ? `${langInstruction}\n\nWrite the full story now based on: ${userPrompt}. Make it long and beautiful (800-1000 words).`
                                : `Write the full story now. Make it long and beautiful.`
                        }
                    ]
                })
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || data.message || "Story generation failed.");
                return;
            }
            const jobId = data.jobId;
            if (!jobId) {
                toast.error("Invalid response from server.");
                return;
            }
            const maxAttempts = 120;
            const pollInterval = 1500;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const pollRes = await fetch(`/api/ai/jobs/${jobId}`, { credentials: "include" });
                const pollData = await pollRes.json();
                if (pollData.status === "completed" && pollData.result) {
                    setStory(pollData.result);
                    if (autoPlay) setTimeout(() => speak(pollData.result), 500);
                    return;
                }
                if (pollData.status === "failed") {
                    toast.error(pollData.error || "Story generation failed.");
                    return;
                }
                await new Promise((r) => setTimeout(r, pollInterval));
            }
            toast.error("Response is taking too long. Please try again.");
        } catch (error) {
            console.error("Story gen failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const playStoryAudio = async (storyText: string) => {
        if (!storyText) return;

        // Stop any existing audio
        cancel();
        if (pollyAudioRef.current) {
            pollyAudioRef.current.pause();
            pollyAudioRef.current = null;
        }
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current = null;
        }
        if (typeof window !== "undefined") {
            window.speechSynthesis.cancel();
        }

        setIsLoadingAudio(true);

        // Check if selected voice uses browser speech synthesis (e.g., Telugu)
        const voiceOption = VOICE_OPTIONS.find(v => v.id === selectedVoice);
        if (voiceOption?.useBrowser && typeof window !== "undefined") {
            try {
                const utterance = new SpeechSynthesisUtterance(storyText);
                utterance.lang = voiceOption.langCode || "te-IN";
                utterance.rate = 0.85;
                utterance.volume = volume;

                // Try to find a matching voice
                const voices = window.speechSynthesis.getVoices();
                const teluguVoice = voices.find(v =>
                    v.lang.startsWith("te") || v.name.toLowerCase().includes("telugu")
                );
                if (teluguVoice) {
                    utterance.voice = teluguVoice;
                }

                utterance.onend = () => setIsLoadingAudio(false);
                utterance.onerror = () => {
                    setIsLoadingAudio(false);
                    toast.error("Browser voice not available. Try a different voice.");
                };

                window.speechSynthesis.speak(utterance);
                setIsLoadingAudio(false);
            } catch (err) {
                console.error("Browser TTS error:", err);
                toast.error("Couldn't play Telugu voice. Please try another voice.");
                setIsLoadingAudio(false);
            }
            return;
        }

        // Use AWS Polly for other voices
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: storyText, voice: selectedVoice }),
            });

            if (!res.ok) {
                const errText = await res.text();
                console.error("TTS API ERROR RESPONSE:", errText);
                throw new Error(errText);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio();

            // MOBILE FIX: Set src and load before setting other properties
            audio.src = url;
            audio.volume = volume;

            // Preload audio (critical for mobile)
            audio.load();

            pollyAudioRef.current = audio;

            audio.oncanplaythrough = () => {
                // Preload complete, ready for play()
            };

            audio.onended = () => {
                setIsLoadingAudio(false);
                URL.revokeObjectURL(url);
                pollyAudioRef.current = null;
            };

            audio.onerror = (e) => {
                console.error("Polly audio error on mobile:", e);
                setIsLoadingAudio(false);
                URL.revokeObjectURL(url);
                pollyAudioRef.current = null;
                toast.error("Couldn't play audio. Please try again.");
            };

            // MOBILE FIX: Handle play promise properly
            try {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    await playPromise;
                } else {
                    setIsLoadingAudio(false);
                }
            } catch (playError: any) {
                console.error("Play failed:", playError);
                setIsLoadingAudio(false);

                // More helpful error message based on error type
                if (playError.name === "NotAllowedError") {
                    toast.error("Please tap the button to play audio");
                } else if (playError.name === "NotSupportedError") {
                    toast.error("Audio format not supported on this device");
                } else {
                    toast.error("Couldn't play audio. Please try again.");
                }

                URL.revokeObjectURL(url);
                pollyAudioRef.current = null;
            }
        } catch (err) {
            console.error("Polly playback error:", err);
            toast.error("Oops! Couldn't generate the voice. Please try again.");
            setIsLoadingAudio(false);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const playRhyme = (rhyme: Rhyme) => {
        cancel(); // Stop any TTS
        if (pollyAudioRef.current) {
            pollyAudioRef.current.pause();
            pollyAudioRef.current = null;
        }
        if (rhyme.youtubeId) {
            setActiveVideoId(rhyme.youtubeId);
        } else {
            // Fallback for custom text-only rhymes (though all listed should have IDs)
            setStory(rhyme.text);
            setTimeout(() => speak(rhyme.text), 100);
        }
    };

    const toggleSaveRhyme = async (e: React.MouseEvent, rhymeId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!session?.user) {
            window.location.href = "/login?callbackUrl=/stories";
            return;
        }
        const nextSet = new Set(savedRhymeIds);
        const willBeSaved = !nextSet.has(rhymeId);
        if (willBeSaved) nextSet.add(rhymeId);
        else nextSet.delete(rhymeId);

        setSavedRhymeIds(nextSet);
        setLocalSavedRhymeIds(nextSet);

        try {
            const res = await fetch("/api/rhymes/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rhymeId }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.success("Saved to Liked (this device)");
                return;
            }

            if (data.saved !== undefined) {
                setSavedRhymeIds((prev) => {
                    const next = new Set(prev);
                    if (data.saved) next.add(rhymeId);
                    else next.delete(rhymeId);
                    setLocalSavedRhymeIds(next);
                    return next;
                });
                toast.success(data.saved ? "Saved to Liked" : "Removed from Liked");
            }
        } catch (err) {
            console.error("Error toggling save rhyme:", err);
            toast.success("Saved to Liked (this device)");
        }
    };

    const playRandomRhyme = () => {
        const random = POPULAR_RHYMES[Math.floor(Math.random() * POPULAR_RHYMES.length)];
        playRhyme(random);
    };

    const filteredRhymes = useMemo(() => {
        return POPULAR_RHYMES.filter((r) => {
            if (showLikedRhymesOnly && !savedRhymeIds.has(r.id)) return false;
            if (rhymeLanguageFilter !== "All" && r.language !== rhymeLanguageFilter) return false;
            return true;
        });
    }, [rhymeLanguageFilter, showLikedRhymesOnly, savedRhymeIds]);

    const generateRandomStory = () => {
        // Rich prompt seeds to ensure variety in "Surprise Me"
        const seeds = [
            "A dinosaur who loved to dance ballet",
            "The robot who wanted to grow a flower garden",
            "A magical train that travels to the moon",
            "The squirrel who became detective of the forest",
            "A cloud that tasted like cotton candy",
            "The little fish who was afraid of water",
            "A secret door in the library",
            "The cat who could talk to birds",
            "The cat who could talk to birds"
        ];
        const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
        setTopic(randomSeed);
        generateStory(randomSeed);
    };

    return (
        <div className="flex flex-col gap-6 h-full min-h-[500px] relative">
            {/* Rhymes Modal: Select a song from selected rhyme */}
            {showRhymeGallery && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[var(--surface)] w-full max-w-5xl h-[85vh] rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface2)]">
                            <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] flex items-center gap-3">
                                <Music className="text-emerald-500 w-8 h-8 shrink-0" />
                                Select a song from selected rhyme
                            </h2>
                            <button
                                onClick={() => setShowRhymeGallery(false)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        {/* Language filter + Show liked only */}
                        <div className="px-6 py-4 border-b border-[var(--border)] flex flex-wrap items-center gap-3 bg-[var(--background)]">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-[var(--muted)]" />
                                <select
                                    value={rhymeLanguageFilter}
                                    onChange={(e) => setRhymeLanguageFilter(e.target.value)}
                                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                                >
                                    {RHYME_LANGUAGES.map((lang) => (
                                        <option key={lang} value={lang}>{lang}</option>
                                    ))}
                                </select>
                            </div>
                            {session?.user && (
                                <button
                                    type="button"
                                    onClick={() => setShowLikedRhymesOnly((v) => !v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${showLikedRhymesOnly ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-rose-500"}`}
                                >
                                    <Heart className={`w-4 h-4 ${showLikedRhymesOnly ? "fill-current" : ""}`} />
                                    Liked only
                                </button>
                            )}
                            <span className="text-sm text-[var(--muted)] ml-auto">
                                {filteredRhymes.length} rhyme{filteredRhymes.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredRhymes.map((r) => {
                                    const isSaved = savedRhymeIds.has(r.id);
                                    return (
                                        <div
                                            key={r.id}
                                            className="relative flex flex-col items-center gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-emerald-500 hover:shadow-lg transition-all group"
                                        >
                                            {session?.user && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => toggleSaveRhyme(e, r.id)}
                                                    className={`absolute top-3 right-3 z-10 p-2 rounded-lg transition-all ${isSaved ? "bg-rose-50 dark:bg-rose-900/30 text-rose-500" : "bg-[var(--surface2)] text-[var(--muted)] hover:bg-rose-50 hover:text-rose-500"}`}
                                                    aria-label={isSaved ? "Unsave rhyme" : "Save rhyme"}
                                                >
                                                    <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => playRhyme(r)}
                                                className="flex flex-col items-center gap-3 w-full"
                                            >
                                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
                                                    {r.icon}
                                                </div>
                                                <span className="font-bold text-sm text-[var(--text)] text-center line-clamp-2">{r.title}</span>
                                                {r.language && (
                                                    <span className="text-[10px] text-[var(--muted)]">{r.language}</span>
                                                )}
                                                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                                                    Play Video
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            {filteredRhymes.length === 0 && (
                                <p className="text-center text-[var(--muted)] py-8">
                                    {showLikedRhymesOnly ? "No liked rhymes yet. Like some to see them here." : "No rhymes match this filter."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Player Modal */}
            {activeVideoId && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative flex flex-col">
                        <div className="aspect-video w-full relative bg-black">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                            />
                        </div>
                        <div className="p-4 flex flex-wrap justify-between items-center bg-[var(--surface)] gap-4">
                            <div className="text-white font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                Now Playing
                            </div>

                            {/* Kid-Friendly Navigation Buttons */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => {
                                        const currentIndex = POPULAR_RHYMES.findIndex(r => r.youtubeId === activeVideoId);
                                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : POPULAR_RHYMES.length - 1;
                                        setActiveVideoId(POPULAR_RHYMES[prevIndex].youtubeId!);
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all font-black text-lg border-b-4 border-orange-600"
                                    title="Previous Video"
                                >
                                    <ChevronLeft className="w-8 h-8 stroke-[4]" />
                                    PREV
                                </button>

                                <button
                                    onClick={() => {
                                        const currentIndex = POPULAR_RHYMES.findIndex(r => r.youtubeId === activeVideoId);
                                        const nextIndex = currentIndex < POPULAR_RHYMES.length - 1 ? currentIndex + 1 : 0;
                                        setActiveVideoId(POPULAR_RHYMES[nextIndex].youtubeId!);
                                    }}
                                    className="flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all font-black text-lg border-b-4 border-blue-700"
                                    title="Next Video"
                                >
                                    NEXT
                                    <ChevronRight className="w-8 h-8 stroke-[4]" />
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActiveVideoId(null)}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
                                >
                                    Close Player
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Story Controls */}
                <div className="bg-[var(--surface2)]/50 p-5 rounded-3xl border border-[var(--border)] flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-[var(--muted)] flex items-center gap-2 uppercase tracking-widest">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            Story Mode
                        </label>
                        <button
                            onClick={generateRandomStory}
                            className="group flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-600 text-white text-[10px] font-black rounded-full shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_25px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20"
                        >
                            <Dice5 className="w-3.5 h-3.5 group-hover:rotate-[360deg] transition-transform duration-700" />
                            <span className="uppercase tracking-widest">Surprise Me</span>
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. King, Telugu lo elephant, Hindi me Ramayana, Spanish me dog..."
                            className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                            onKeyPress={(e) => e.key === "Enter" && generateStory()}
                        />
                        <button
                            onClick={() => generateStory()}
                            disabled={isGenerating || !topic.trim()}
                            className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full transition-all shadow-[0_4px_15px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_25px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:shadow-none"
                        >
                            {isGenerating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Rhyme Controls */}
                <div className="bg-[var(--surface2)]/50 p-5 rounded-3xl border border-[var(--border)] flex flex-col gap-4 shadow-sm">
                    <label className="text-xs font-black text-[var(--muted)] flex items-center gap-2 uppercase tracking-widest">
                        <Music className="w-4 h-4 text-emerald-500" />
                        Rhyme Mode (with Music)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={playRandomRhyme}
                            className="group flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl hover:from-emerald-400 hover:to-teal-600 active:scale-95 transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.5)] border border-white/20"
                        >
                            <Dice5 className="w-8 h-8 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Play Random</span>
                        </button>
                        <button
                            onClick={() => setShowRhymeGallery(true)}
                            className="group flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-2xl hover:border-emerald-500 hover:text-emerald-600 active:scale-95 transition-all shadow-sm hover:shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                        >
                            <Grid className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest">200+ Songs Gallery</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Playback Settings Overlay at Bottom */}
            <div className={`sticky bottom-2 z-30 flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6 py-3 md:py-4 bg-[var(--surface)]/80 backdrop-blur-xl rounded-2xl md:rounded-full border border-[var(--border)] shadow-2xl mb-2 mx-2 md:mx-4 transition-all ${!story && !activeVideoId ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
                <div className="flex items-center gap-4 w-full md:w-auto md:flex-1 md:max-w-md">
                    <Volume2 className="w-5 h-5 text-[var(--muted)] flex-shrink-0" />
                    <input
                        type="text"
                        style={{ display: 'none' }}
                        tabIndex={-1}
                    />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="flex-1 accent-purple-600 h-1.5 md:h-2 rounded-full bg-[var(--border)] cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-center gap-4 w-full md:w-auto flex-wrap">
                    {story && !activeVideoId && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => playStoryAudio(story)}
                                disabled={isLoadingAudio || isSpeaking}
                                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                title="Read Story (Natural Voice)"
                            >
                                {isLoadingAudio ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Volume2 className="w-5 h-5" />
                                )}
                                <span className="font-bold text-sm">
                                    {isLoadingAudio ? "Generating voice..." : "Read Story"}
                                </span>
                            </button>
                            <button
                                onClick={() => {
                                    cancel();
                                    if (pollyAudioRef.current) {
                                        pollyAudioRef.current.pause();
                                    }
                                }}
                                className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                                title="Stop"
                            >
                                <Pause className="w-5 h-5 fill-current" />
                            </button>
                        </div>
                    )}

                    <div className="h-8 w-[1px] bg-[var(--border)] hidden md:block" />

                    {/* Voice Selector */}
                    <div className="relative" ref={voiceMenuRef}>
                        <button
                            onClick={() => setShowVoiceMenu(!showVoiceMenu)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--surface2)] hover:bg-[var(--surface)] border border-[var(--border)] transition-all"
                            title="Select Voice"
                        >
                            <span className="text-lg">
                                {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.emoji || "💻"}
                            </span>
                            <span className="text-xs font-bold text-[var(--text)] truncate max-w-[100px]">
                                {VOICE_OPTIONS.find(v => v.id === selectedVoice)?.label || "Select Voice"}
                            </span>
                            <svg className={`w-3 h-3 text-[var(--muted)] transition-transform ${showVoiceMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {showVoiceMenu && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
                                <div className="p-2 border-b border-[var(--border)] bg-[var(--surface2)] sticky top-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center">Choose a Voice</p>
                                </div>
                                <div className="p-2 space-y-1">
                                    {VOICE_OPTIONS.map((voice) => (
                                        <div
                                            key={voice.id}
                                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all ${selectedVoice === voice.id
                                                ? "bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500"
                                                : "hover:bg-[var(--surface2)] border-2 border-transparent"
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    setSelectedVoice(voice.id);
                                                    setShowVoiceMenu(false);
                                                }}
                                                className="flex items-center gap-3 flex-1 text-left"
                                            >
                                                <span className="text-2xl">{voice.emoji}</span>
                                                <div>
                                                    <p className={`font-bold text-sm ${selectedVoice === voice.id ? "text-purple-600 dark:text-purple-400" : "text-[var(--text)]"}`}>
                                                        {voice.label}
                                                    </p>
                                                    <p className="text-[10px] text-[var(--muted)]">{voice.description}</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    previewVoice(voice.id as any);
                                                }}
                                                disabled={previewingVoice === voice.id}
                                                className={`p-2 rounded-lg transition-all flex-shrink-0 ${previewingVoice === voice.id
                                                    ? "bg-purple-500 text-white animate-pulse"
                                                    : "bg-[var(--surface2)] hover:bg-purple-100 dark:hover:bg-purple-900/30 text-[var(--muted)] hover:text-purple-500"
                                                    }`}
                                            >
                                                {previewingVoice === voice.id ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            </button>
                                            {selectedVoice === voice.id && <span className="text-purple-500 flex-shrink-0">✓</span>}
                                        </div>
                                    ))}

                                </div>
                                <div className="p-2 border-t border-[var(--border)] bg-[var(--surface2)]">
                                    <p className="text-[9px] text-[var(--muted)] text-center">
                                        Click play to preview each voice
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-8 w-[1px] bg-[var(--border)] hidden md:block" />

                    <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${autoPlay ? "bg-purple-600 text-white shadow-lg" : "bg-[var(--surface2)] text-[var(--muted)]"
                            }`}
                    >
                        Auto-Read
                    </button>
                </div>
            </div>

            {/* Visualizer Display (Only for Stories now) */}
            <div className="flex-1 bg-gradient-to-b from-[var(--surface)] to-[var(--surface2)]/30 border border-[var(--border)] rounded-[30px] md:rounded-[40px] p-4 md:p-14 shadow-2xl relative overflow-y-auto max-h-[600px] md:max-h-[700px] flex flex-col items-center custom-scrollbar">
                {!story && !isGenerating && !activeVideoId && (
                    <div className="flex flex-col items-center justify-center py-10 md:py-20 text-center gap-4 md:gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[28px] md:rounded-[35px] flex items-center justify-center text-white shadow-2xl shadow-purple-500/30 animate-pulse">
                            <BookOpen className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-tight">Story Time & Songs</h3>
                            <p className="text-[var(--muted)] max-w-sm mt-3 text-base md:text-lg font-medium leading-relaxed px-4">
                                Create a <span className="text-purple-600 font-bold">unique story</span> or sing along to <span className="text-emerald-600 font-bold">50+ favorite songs</span>!
                            </p>
                        </div>
                    </div>
                )}

                {isGenerating && (
                    <div className="flex flex-col items-center justify-center gap-6 py-32">
                        <div className="relative">
                            <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                        </div>
                        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-600 animate-pulse uppercase tracking-widest">
                            Writing a Masterpiece...
                        </p>
                    </div>
                )}

                {story && !activeVideoId && (
                    <div className="w-full max-w-3xl">
                        <div className="flex flex-wrap gap-x-2 gap-y-3 md:gap-y-4 leading-snug md:leading-normal text-2xl md:text-4xl font-black justify-center transition-all duration-300 px-2 md:px-4 mb-20">
                            {words.map((word, idx) => (
                                <span
                                    key={idx}
                                    className={`px-1.5 md:px-2 py-0.5 rounded-[10px] md:rounded-[12px] transition-all duration-200 ${currentWordIndex === idx
                                        ? "bg-yellow-300 dark:bg-yellow-500 text-black scale-110 md:scale-125 shadow-2xl z-20 border-2 border-yellow-600/20"
                                        : "text-[var(--text)] opacity-95 group-hover:opacity-100"
                                        }`}
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
