"use client";

import { useState, useMemo, useEffect } from "react";
import {
    BookOpen,
    Sparkles,
    Play,
    Pause,
    RotateCcw,
    Volume2,
    Music,
    Crown,
    Gamepad2,
    Moon,
    Sun,
    VolumeX,
    Send,
    Loader2,
    Dice5,
    Grid,
    X,
    Youtube,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { useSpeechSynthesis } from "../aac/hooks/useSpeechSynthesis";

interface Rhyme {
    id: string;
    title: string;
    text: string;
    icon: string;
    youtubeId?: string; // Optional ID for verified videos
}

// Verified list of Popular Rhymes with working YouTube IDs (Cocomelon, Super Simple Songs, etc.)
const POPULAR_RHYMES: Rhyme[] = [
    // --- English Rhymes ---
    { id: "wheels-bus", title: "Wheels on the Bus", text: "The wheels on the bus go round and round...", icon: "🚌", youtubeId: "e_04ZrNroTo" },
    { id: "twinkle", title: "Twinkle Twinkle Little Star", text: "Twinkle, twinkle, little star...", icon: "⭐", youtubeId: "yCjJyiqpAuU" },
    { id: "five-ducks", title: "Five Little Ducks", text: "Five little ducks went out one day...", icon: "🦆", youtubeId: "LrAtBtQnvCE" }, // Updated
    { id: "old-mac", title: "Old MacDonald Had a Farm", text: "Old MacDonald had a farm...", icon: "👨‍🌾", youtubeId: "FQ-lfN6WHG0" },
    { id: "itsy-bitsy", title: "Itsy Bitsy Spider", text: "The itsy bitsy spider...", icon: "🕷️", youtubeId: "w_lCi8U49mY" },
    { id: "baa-baa", title: "Baa Baa Black Sheep", text: "Baa, baa, black sheep...", icon: "🐑", youtubeId: "MR5XSOdjKMA" },
    { id: "humpty", title: "Humpty Dumpty", text: "Humpty Dumpty sat on a wall...", icon: "🥚", youtubeId: "nrv495corBc" },
    { id: "london-bridge", title: "London Bridge", text: "London Bridge is falling down...", icon: "🌉", youtubeId: "Ser69-nsRNs" },
    { id: "row-boat", title: "Row Row Row Your Boat", text: "Row, row, row your boat...", icon: "🚣", youtubeId: "7otAJa3jui8" },
    { id: "mary-lamb", title: "Mary Had a Little Lamb", text: "Mary had a little lamb...", icon: "🐑", youtubeId: "aTrtKikAW6E" },
    { id: "johny-papa", title: "Johny Johny Yes Papa", text: "Johny, Johny. Yes, Papa?...", icon: "👦", youtubeId: "9uZBKyLk-Ho" },
    { id: "abc", title: "ABC Song", text: "A-B-C-D-E-F-G...", icon: "🔤", youtubeId: "75p-N9YKqNo" },
    { id: "head-shoulders", title: "Head Shoulders Knees Noes", text: "Head, shoulders, knees and toes...", icon: "🧘", youtubeId: "h4eueDYPTIg" },
    { id: "happy", title: "If You're Happy", text: "If you're happy and you know it...", icon: "👏", youtubeId: "71hqRT9U0wg" },
    { id: "ants", title: "The Ants Go Marching", text: "The ants go marching one by one...", icon: "🐜", youtubeId: "F54jC9dz1KE" },
    { id: "five-monkeys", title: "Five Little Monkeys", text: "Five little monkeys jumping on the bed...", icon: "🐵", youtubeId: "0j6AZhZFb7A" },
    { id: "rain", title: "Rain Rain Go Away", text: "Rain, rain, go away...", icon: "🌧️", youtubeId: "Zu6o23Pu0Do" }, // Updated
    { id: "finger-family", title: "Finger Family", text: "Daddy finger, daddy finger...", icon: "🖐️", youtubeId: "G6k7dChBaJ8" },
    { id: "baby-shark", title: "Baby Shark", text: "Baby shark, doo doo doo doo doo doo...", icon: "🦈", youtubeId: "XqZsoesa55w" },
    { id: "bingo", title: "Bingo", text: "There was a farmer had a dog...", icon: "🐶", youtubeId: "2E0hHjSwdW4" }, // Added
    { id: "go-away", title: "Go Away!", text: "Go away, big green monster...", icon: "🧟", youtubeId: "uXz8RnTn5Xw" }, // Added
    { id: "jingle-bells", title: "Jingle Bells", text: "Jingle bells, jingle bells...", icon: "🔔", youtubeId: "SvVrs6jkc_w" }, // Added
    { id: "clap-hands", title: "Clap Your Hands", text: "Clap your hands...", icon: "👏", youtubeId: "tWe93wO0VmE" }, // Added
    { id: "fruits", title: "Fruits Name", text: "Apple, Orange, Banana...", icon: "🍎", youtubeId: "7Abj-_IecBw" }, // Added
    { id: "wild-animals", title: "Wild Animals", text: "Lion, Tiger, Bear...", icon: "🦁", youtubeId: "si6FLGyvxW8" }, // Added
    { id: "phonics", title: "Phonics Song", text: "A is for Apple...", icon: "🅰️", youtubeId: "zAax3z5uQ2k" }, // Added

    // --- Hindi Rhymes ---
    { id: "machli-jal", title: "Machli Jal Ki Rani (Hindi)", text: "Machli jal ki rani hai...", icon: "🐟", youtubeId: "1CwiL64PVlg" },

    // --- Telugu Rhymes ---
    { id: "chitti-chilakamma", title: "Chitti Chilakamma (Telugu)", text: "Chitti chilakamma...", icon: "🦜", youtubeId: "gAP4HPfvLqY" },
    { id: "aakasamlo", title: "Aakasamlo Oka Tara (Telugu)", text: "Aakasamlo oka tara...", icon: "⭐", youtubeId: "0F6WRYemPRE" },
    { id: "cheema", title: "Cheema Cheema (Telugu)", text: "Cheema cheema...", icon: "🐜", youtubeId: "9YJtZNkjv38" },
    { id: "bujji-papa", title: "Bujji Bujji Papa (Telugu)", text: "Bujji bujji papa...", icon: "👶", youtubeId: "2kUaylNjr4M" },
    { id: "enugamma", title: "Enugamma Enugu (Telugu)", text: "Enugamma enugu...", icon: "🐘", youtubeId: "ubspZnidcak" }, // Updated
    { id: "aksharamala", title: "Telugu Aksharamala (Telugu)", text: "A Aa E Ee...", icon: "🅰️", youtubeId: "rf34i5n3kcA" }, // Added
    { id: "chitti-miriyalu", title: "Chitti Chitti Miriyalu (Telugu)", text: "Chitti chitti miriyalu...", icon: "🌶️", youtubeId: "V0i9uGDJluw" }, // Added
    { id: "veeri-veeri", title: "Veeri Veeri Gummadi (Telugu)", text: "Veeri veeri gummadi...", icon: "🎃", youtubeId: "G1VW0NRHtMc" }, // Added

    // --- Tamil Rhymes ---
    { id: "kanna-kanna", title: "Kanna Kanna (Tamil)", text: "Kanna kanna...", icon: "👦", youtubeId: "jkjkmOCkMqs" },
    { id: "nila-nila", title: "Nila Nila Odi Vaa (Tamil)", text: "Nila nila odi vaa...", icon: "🌙", youtubeId: "GtMuh3AgIwA" },
    { id: "chinna-chinna", title: "Chinna Chinna Aasai (Tamil)", text: "Chinna chinna...", icon: "💭", youtubeId: "1dMG9sa8qUo" },
    { id: "uyir-ezhuthukal", title: "Uyir Ezhuthukal (Tamil)", text: "A Aa E Ee...", icon: "🅰️", youtubeId: "EaRl0KZNEdQ" }, // Added

    // --- Kannada Rhymes ---
    { id: "beda-beda", title: "Beda Beda Magu (Kannada)", text: "Beda beda magu...", icon: "👶", youtubeId: "FUHy2rzxXaU" },

    // --- Marathi Rhymes ---
    { id: "chandoba", title: "Chandoba Chandoba (Marathi)", text: "Chandoba chandoba...", icon: "🌙", youtubeId: "nrmrkYUyCOQ" },
    { id: "sasa", title: "Sasa To Sasa (Marathi)", text: "Sasa to sasa...", icon: "🐰", youtubeId: "Bgwh5Gf35x8" },

    // --- Gujarati Rhymes ---
    { id: "halarda", title: "Halarda (Gujarati)", text: "Halarda...", icon: "🎼", youtubeId: "Vz0FkXaGbPY" },
    { id: "abc-gujarati", title: "ABC Song (Gujarati)", text: "A B C D...", icon: "🔤", youtubeId: "kR1p4-NPvfo" },
    { id: "chhuk-chhuk", title: "Chhuk Chhuk Gadi (Gujarati)", text: "Chhuk chhuk gadi...", icon: "🚂", youtubeId: "aQgLDVrPsk4" },
];

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
    const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

    const { speak, cancel, isSpeaking, currentWordIndex } = useSpeechSynthesis({
        volume,
        pitch: 1,
        rate: 0.85,
    });

    // Stop video when speaking starts, stop speaking when video starts
    useEffect(() => {
        if (activeVideoId) cancel();
    }, [activeVideoId, cancel]);

    useEffect(() => {
        if (isSpeaking) setActiveVideoId(null);
    }, [isSpeaking]);

    const words = useMemo(() => {
        if (!story) return [];
        return story.split(/\s+/);
    }, [story]);

    const generateStory = async (customTopic?: string) => {
        // If customTopic is empty (Surprise Me case), use the generic trigger
        const userPrompt = customTopic || topic || "Tell me a completely random, amazing story";

        setIsGenerating(true);
        setStory("");
        setActiveVideoId(null);
        cancel();

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: `You are "StoryWeaver", a world-renowned children's book author and master storyteller.

**YOUR GOAL:** Write a rich, immersive, and wildly entertaining story based on the user's topic.

**STORYTELLING RULES (STRICT):**
1.  **Length & Depth:** The story MUST be substantial (approx. 1200+ words) to provide a solid 5-minute reading/listening experience. Use dialogue and descriptive world-building to ensure it is long and detailed.
2.  **Expertise (Mythology & Faith):** You are an expert in **Hindu Mythology** (Ramayana, Mahabharatam) and **Christian Stories** (Bible stories for kids, the life of Jesus, Christmas Story, Noah's Ark). If the user asks for figures like **Ram, Laxman, Jesus, or David**, tell their legends with great respect and magical detail.
3.  **Kids Version Only:** Every story—especially mythological or religious ones—MUST be a **version for kids**. Focus on wonder, kindness, and positive messages.
3.  **Structure:** 
    *   **The Hook:** Start with "Once upon a time..." or an exciting action scene.
    *   **The Journey:** The main character must face obstacles and meet interesting friends.
    *   **The Climax:** A moment of excitement or big decision.
    *   **The Resolution:** A warm, happy ending with a clear moral about kindness, courage, or friendship.
4.  **Style:** Use sensory details (sights, sounds, smells). Be funny, whimsical, and heartwarming.
5.  **Classic & Epic Tales:** If the user asks for a known story (e.g., "Cinderella") or an epic (e.g., "Ramayana"), retell it faithfully but with your own magical descriptive flair.
6.  **New Stories:** If the user gives a simple topic (e.g., "Dog"), invent a specific character (e.g., "Barnaby the Dog who wanted to be a Cat") and write that specific adventure.

**FORMATTING:**
*   Use short paragraphs (easier to read).
*   Use **bold** for emphasis on sound effects (e.g., **BOOM!**, **Swish**).

**TONE:** Enthusiastic, gentle, and child-safe.

**Topic:** ${userPrompt}
`
                        },
                        {
                            role: "user",
                            content: `Write the full story now. Make it long and beautiful.`
                        }
                    ]
                })
            });

            const data = await res.json();
            if (data.reply) {
                setStory(data.reply);
                if (autoPlay) setTimeout(() => speak(data.reply), 500);
            }
        } catch (error) {
            console.error("Story gen failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const playRhyme = (rhyme: Rhyme) => {
        // setShowRhymeGallery(false); // Keep gallery open behind video
        cancel(); // Stop any TTS
        if (rhyme.youtubeId) {
            setActiveVideoId(rhyme.youtubeId);
        } else {
            // Fallback for custom text-only rhymes (though all listed should have IDs)
            setStory(rhyme.text);
            setTimeout(() => speak(rhyme.text), 100);
        }
    };

    const playRandomRhyme = () => {
        const random = POPULAR_RHYMES[Math.floor(Math.random() * POPULAR_RHYMES.length)];
        playRhyme(random);
    };

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
            {/* 50+ Rhymes Modal */}
            {showRhymeGallery && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="bg-[var(--surface)] w-full max-w-5xl h-[85vh] rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface2)]">
                            <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-3">
                                <Music className="text-emerald-500 w-8 h-8" />
                                Select a Song
                            </h2>
                            <button
                                onClick={() => setShowRhymeGallery(false)}
                                className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-[var(--background)]">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {POPULAR_RHYMES.map((r) => (
                                    <button
                                        key={r.id}
                                        onClick={() => playRhyme(r)}
                                        className="flex flex-col items-center gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:-translate-y-1 transition-all group"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-4xl mb-2 group-hover:scale-110 transition-transform">
                                            {r.icon}
                                        </div>
                                        <span className="font-bold text-sm text-[var(--text)] text-center line-clamp-2">{r.title}</span>
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                                            Play Video
                                        </span>
                                    </button>
                                ))}
                            </div>
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
                            placeholder="Topic e.g. King, Astronaut..."
                            className="flex-1 px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all font-medium"
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
                            <span className="text-[10px] font-black uppercase tracking-widest">50+ Songs Gallery</span>
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

                <div className="flex items-center justify-center gap-4 w-full md:w-auto">
                    {story && !activeVideoId && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => speak(story)}
                                disabled={isSpeaking}
                                className="p-3 bg-emerald-600 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                title="Play Story"
                            >
                                <Play className="w-5 h-5 fill-current" />
                            </button>
                            <button
                                onClick={cancel}
                                className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
                                title="Pause/Stop"
                            >
                                <Pause className="w-5 h-5 fill-current" />
                            </button>
                        </div>
                    )}

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
