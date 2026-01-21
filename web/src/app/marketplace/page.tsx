"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { ShoppingBag, Star, Filter, Search, ArrowLeft, ExternalLink, Moon, Sun, Shirt, Headphones, Gamepad2, Timer, Scissors, Utensils, Watch, Puzzle, Smile, Zap, Layers, Anchor, Heart, MessageSquare, Clipboard, Bell, Lock, Shield, Mic, LayoutGrid, Speaker, Gift, Coffee, BookOpen, Music, Trees, Ticket } from "lucide-react";

// CONFIGURATION: Replace this with your actual Amazon Associate Tag!
const AMAZON_AFFILIATE_TAG = "neurokind-20";

// Helper: Adds tag to ANY Amazon link
const getAffiliateLink = (url: string) => {
    if (url.includes("amazon.com")) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}tag=${AMAZON_AFFILIATE_TAG}`;
    }
    return url;
};

// DATA: 80+ Real Autism Essentials with SPECIFIC ICONS
const allProducts = [
    // --- GIFTS FOR KIDS & PARENTS [NEW] ---
    {
        id: 201,
        name: "Sensory Subscription Box",
        category: "Gifts",
        price: "$40.00",
        rating: 4.8,
        reviews: "5k+",
        tag: "Monthly Joy",
        link: "https://www.amazon.com/s?k=sensory+subscription+box+for+kids",
        color: "from-fuchsia-500/20 to-pink-500/20 text-fuchsia-600 dark:text-fuchsia-300",
        icon: Gift
    },
    {
        id: 202,
        name: "Weighted Stuffed Animal (Hugimal)",
        category: "Gifts",
        price: "$45.00",
        rating: 4.9,
        reviews: "1k+",
        tag: "Comfort",
        link: "https://www.amazon.com/s?k=weighted+stuffed+animal",
        color: "from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-300",
        icon: Heart
    },
    {
        id: 203,
        name: "Magna-Tiles Building Set",
        category: "Gifts",
        price: "$50.00",
        rating: 4.9,
        reviews: "20k+",
        tag: "Top Rated",
        link: "https://www.amazon.com/s?k=magna+tiles",
        color: "from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-300",
        icon: Puzzle
    },
    {
        id: 204,
        name: "Plasma Car (Wiggle Car)",
        category: "Gifts",
        price: "$60.00",
        rating: 4.7,
        reviews: "10k+",
        tag: "Active Fun",
        link: "https://www.amazon.com/s?k=plasma+car",
        color: "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-300",
        icon: Zap
    },
    {
        id: 205,
        name: "Loop Quiet Earplugs (For Parents)",
        category: "Gifts",
        price: "$25.00",
        rating: 4.6,
        reviews: "50k+",
        link: "https://www.amazon.com/s?k=loop+quiet+earplugs",
        color: "from-slate-500/20 to-zinc-500/20 text-slate-600 dark:text-slate-300",
        icon: Headphones
    },
    {
        id: 206,
        name: "Aromatherapy Diffuser Spa Set",
        category: "Gifts",
        price: "$35.00",
        rating: 4.7,
        reviews: "15k+",
        tag: "Relaxation",
        link: "https://www.amazon.com/s?k=aromatherapy+diffuser+gift+set",
        color: "from-teal-500/20 to-green-500/20 text-teal-600 dark:text-teal-300",
        icon: Trees
    },
    {
        id: 207,
        name: "Weighted Eye Mask",
        category: "Gifts",
        price: "$20.00",
        rating: 4.5,
        reviews: "8k+",
        link: "https://www.amazon.com/s?k=weighted+eye+mask",
        color: "from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-300",
        icon: Moon
    },
    {
        id: 208,
        name: "Book: The Reason I Jump",
        category: "Gifts",
        price: "$15.00",
        rating: 4.7,
        reviews: "12k+",
        tag: "Insightful",
        link: "https://www.amazon.com/s?k=the+reason+i+jump+book",
        color: "from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-300",
        icon: BookOpen
    },
    {
        id: 209,
        name: "LEGO Classic Creative Brick Box",
        category: "Gifts",
        price: "$35.00",
        rating: 4.9,
        reviews: "30k+",
        link: "https://www.amazon.com/s?k=lego+classic+medium+creative+brick+box",
        color: "from-yellow-400/20 to-orange-400/20 text-yellow-600 dark:text-yellow-300",
        icon: Puzzle
    },
    {
        id: 210,
        name: "Interactive Globe for Kids",
        category: "Gifts",
        price: "$50.00",
        rating: 4.6,
        reviews: "3k+",
        link: "https://www.amazon.com/s?k=interactive+globe+for+kids",
        color: "from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-300",
        icon: Anchor
    },
    {
        id: 211,
        name: "Autism Awareness Coffee Mug",
        category: "Gifts",
        price: "$15.00",
        rating: 4.8,
        reviews: "1k+",
        link: "https://www.amazon.com/s?k=autism+mom+dad+coffee+mug",
        color: "from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-300",
        icon: Coffee
    },
    {
        id: 212,
        name: "Meal Delivery Gift Card",
        category: "Gifts",
        price: "$50+",
        rating: 5.0,
        reviews: "N/A",
        tag: "Practical",
        link: "https://www.amazon.com/s?k=doordash+gift+card",
        color: "from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-300",
        icon: Utensils
    },
    {
        id: 213,
        name: "Musical Hand Bells Set",
        category: "Gifts",
        price: "$30.00",
        rating: 4.7,
        reviews: "2k+",
        link: "https://www.amazon.com/s?k=musical+hand+bells+for+kids",
        color: "from-red-500/20 to-yellow-500/20 text-red-600 dark:text-red-300",
        icon: Music
    },
    {
        id: 214,
        name: "Museum/Zoo Membership",
        category: "Gifts",
        price: "$Varies",
        rating: 5.0,
        reviews: "Best Gift",
        tag: "Experience",
        link: "https://www.amazon.com/s?k=gift+card+for+museum", // Placeholder or Amazon experience gift cards
        color: "from-lime-500/20 to-green-500/20 text-lime-600 dark:text-lime-300",
        icon: Ticket
    },
    {
        id: 215,
        name: "Relaxing Bath Bombs Set",
        category: "Gifts",
        price: "$20.00",
        rating: 4.6,
        reviews: "10k+",
        link: "https://www.amazon.com/s?k=bath+bombs+gift+set",
        color: "from-purple-400/20 to-pink-400/20 text-purple-600 dark:text-purple-300",
        icon: Heart
    },

    // --- COMMUNICATION (AAC & VISUALS) [NEW] ---
    {
        id: 101,
        name: "PECS Communication Book",
        category: "Communication",
        price: "$30 - $50",
        rating: 4.7,
        reviews: "2k+",
        tag: "Non-Verbal",
        link: "https://www.amazon.com/s?k=pecs+communication+book",
        color: "from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-300",
        icon: MessageSquare
    },
    {
        id: 102,
        name: "Visual Schedule Cards",
        category: "Communication",
        price: "$15.00",
        rating: 4.6,
        reviews: "1k+",
        tag: "Routine",
        link: "https://www.amazon.com/s?k=visual+schedule+cards+autism",
        color: "from-blue-500/20 to-sky-500/20 text-blue-600 dark:text-blue-300",
        icon: Clipboard
    },
    {
        id: 103,
        name: "Talking Flash Cards",
        category: "Communication",
        price: "$20.00",
        rating: 4.8,
        reviews: "5k+",
        tag: "Speech",
        link: "https://www.amazon.com/s?k=talking+flash+cards+for+toddlers",
        color: "from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-300",
        icon: Speaker
    },
    {
        id: 104,
        name: "First-Then Board",
        category: "Communication",
        price: "$12.00",
        rating: 4.7,
        reviews: "800+",
        link: "https://www.amazon.com/s?k=first+then+board+autism",
        color: "from-indigo-500/20 to-purple-500/20 text-indigo-600 dark:text-indigo-300",
        icon: LayoutGrid
    },
    {
        id: 105,
        name: "Recordable Answer Buzzers",
        category: "Communication",
        price: "$18.00",
        rating: 4.6,
        reviews: "3k+",
        link: "https://www.amazon.com/s?k=recordable+answer+buzzers",
        color: "from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-300",
        icon: Mic
    },

    // --- SAFETY & WANDERING [NEW] ---
    {
        id: 110,
        name: "Door & Window Alarms",
        category: "Safety",
        price: "$20.00",
        rating: 4.6,
        reviews: "10k+",
        tag: "elopement",
        link: "https://www.amazon.com/s?k=door+alarms+for+kids+safety",
        color: "from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-300",
        icon: Bell
    },
    {
        id: 111,
        name: "Safety ID Bracelet",
        category: "Safety",
        price: "$15.00",
        rating: 4.7,
        reviews: "2k+",
        link: "https://www.amazon.com/s?k=autism+id+bracelet+for+kids",
        color: "from-slate-500/20 to-gray-500/20 text-slate-600 dark:text-slate-300",
        icon: Shield
    },
    {
        id: 112,
        name: "Childproof Door Locks",
        category: "Safety",
        price: "$15.00",
        rating: 4.8,
        reviews: "15k+",
        link: "https://www.amazon.com/s?k=child+proof+door+lock+top",
        color: "from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-300",
        icon: Lock
    },
    {
        id: 113,
        name: "Temporary Safety Tattoos",
        category: "Safety",
        price: "$10.00",
        rating: 4.5,
        reviews: "1k+",
        tag: "Crowds",
        link: "https://www.amazon.com/s?k=safety+tattoos+for+kids",
        color: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-300",
        icon: Heart
    },
    {
        id: 114,
        name: "AngelSense GPS Shirt",
        category: "Safety",
        price: "$40+",
        rating: 4.7,
        reviews: "500+",
        tag: "Tracker",
        link: "https://www.amazon.com/s?k=gps+tracker+undershirt+kids",
        color: "from-sky-500/20 to-cyan-500/20 text-sky-600 dark:text-sky-300",
        icon: Shirt
    },

    // --- SENSORY & REGULATION (EXPANDED) ---
    {
        id: 1,
        name: "Indoor Sensory Swing (Pod)",
        category: "Sensory",
        price: "$35 - $80",
        rating: 4.8,
        reviews: "5k+",
        tag: "Must Have",
        link: "https://www.amazon.com/s?k=autism+sensory+swing+indoor",
        color: "from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-300",
        icon: Anchor
    },
    {
        id: 120,
        name: "Blackout Sensory Tent",
        category: "Sensory",
        price: "$40 - $80",
        rating: 4.7,
        reviews: "2k+",
        tag: "Calm Space",
        link: "https://www.amazon.com/s?k=blackout+sensory+tent",
        color: "from-gray-800/20 to-black/20 text-gray-700 dark:text-gray-300",
        icon: Moon
    },
    {
        id: 121,
        name: "Sensory Bubble Tube",
        category: "Sensory",
        price: "$80+",
        rating: 4.5,
        reviews: "1k+",
        tag: "Visual",
        link: "https://www.amazon.com/s?k=sensory+bubble+tube+lamp",
        color: "from-cyan-500/20 to-blue-500/20 text-cyan-500 dark:text-cyan-300",
        icon: Zap
    },
    {
        id: 122,
        name: "Textured Sensory Mats",
        category: "Sensory",
        price: "$25.00",
        rating: 4.7,
        reviews: "1.5k+",
        tag: "Tactile",
        link: "https://www.amazon.com/s?k=sensory+mats+for+autistic+children",
        color: "from-pink-500/20 to-rose-500/20 text-pink-600 dark:text-pink-300",
        icon: Layers
    },
    {
        id: 2,
        name: "Weighted Blanket (Kids)",
        category: "Sensory",
        price: "$30 - $60",
        rating: 4.7,
        reviews: "10k+",
        tag: "Calming",
        link: "https://www.amazon.com/s?k=kids+weighted+blanket",
        color: "from-indigo-500/20 to-blue-500/20 text-indigo-600 dark:text-indigo-300",
        icon: Layers
    },
    {
        id: 3,
        name: "Compression Sensory Sheet",
        category: "Sensory",
        price: "$25.00",
        rating: 4.6,
        reviews: "2k+",
        link: "https://www.amazon.com/s?k=sensory+compression+sheet",
        color: "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-300",
        icon: Layers
    },
    {
        id: 4,
        name: "Body Sock (Sensory Sack)",
        category: "Sensory",
        price: "$18.00",
        rating: 4.7,
        reviews: "3k+",
        link: "https://www.amazon.com/s?k=sensory+body+sock",
        color: "from-pink-500/20 to-rose-500/20 text-pink-600 dark:text-pink-300",
        icon: Smile
    },
    {
        id: 5,
        name: "Chewable Jewelry / Necklaces",
        category: "Sensory",
        price: "$10 - $15",
        rating: 4.5,
        reviews: "1k+",
        link: "https://www.amazon.com/s?k=sensory+chew+necklace+for+kids",
        color: "from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-300",
        icon: Heart
    },
    {
        id: 31,
        name: "Weighted Lap Pad",
        category: "Sensory",
        price: "$25.00",
        rating: 4.7,
        reviews: "2k+",
        link: "https://www.amazon.com/s?k=weighted+lap+pad+for+kids",
        color: "from-indigo-500/20 to-violet-500/20 text-indigo-500 dark:text-indigo-300",
        icon: Layers
    },
    {
        id: 32,
        name: "Sensory Crash Pad",
        category: "Sensory",
        price: "$100+",
        rating: 4.8,
        reviews: "800+",
        link: "https://www.amazon.com/s?k=sensory+crash+pad",
        color: "from-orange-500/20 to-red-500/20 text-orange-600 dark:text-orange-300",
        icon: Zap
    },
    {
        id: 33,
        name: "Wobble Cushion",
        category: "Sensory",
        price: "$15.00",
        rating: 4.6,
        reviews: "5k+",
        tag: "Focus",
        link: "https://www.amazon.com/s?k=wobble+cushion+for+kids",
        color: "from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-300",
        icon: Anchor
    },

    // --- TOYS & DEVELOPMENT ---
    {
        id: 6,
        name: "Spinning & Stacking Toys",
        category: "Toys",
        price: "$15.00",
        rating: 4.9,
        reviews: "8k+",
        tag: "Motor Skills",
        link: "https://www.amazon.com/s?k=spinning+stacking+toy",
        color: "from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-300",
        icon: Puzzle
    },
    {
        id: 7,
        name: "Liquid Motion Bubbler Set",
        category: "Toys",
        price: "$12.00",
        rating: 4.6,
        reviews: "15k+",
        tag: "Visual",
        link: "https://www.amazon.com/s?k=liquid+motion+bubbler",
        color: "from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-300",
        icon: Zap
    },
    {
        id: 8,
        name: "Pop-It Fidget Packs",
        category: "Toys",
        price: "$10.00",
        rating: 4.7,
        reviews: "20k+",
        link: "https://www.amazon.com/s?k=pop+it+fidget+toy+pack",
        color: "from-yellow-500/20 to-amber-500/20 text-yellow-600 dark:text-yellow-300",
        icon: Gamepad2
    },
    {
        id: 34,
        name: "Kinetic Sand Set",
        category: "Toys",
        price: "$15.00",
        rating: 4.8,
        reviews: "30k+",
        link: "https://www.amazon.com/s?k=kinetic+sand",
        color: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300",
        icon: Smile
    },
    {
        id: 35,
        name: "Water Beads Pack",
        category: "Toys",
        price: "$9.00",
        rating: 4.6,
        reviews: "10k+",
        link: "https://www.amazon.com/s?k=water+beads+for+kids",
        color: "from-blue-500/20 to-indigo-500/20 text-blue-500 dark:text-blue-300",
        icon: Smile
    },
    {
        id: 36,
        name: "Indoor Trampoline",
        category: "Toys",
        price: "$60 - $100",
        rating: 4.7,
        reviews: "12k+",
        tag: "Energy",
        link: "https://www.amazon.com/s?k=indoor+trampoline+for+kids",
        color: "from-orange-500/20 to-red-500/20 text-orange-500 dark:text-orange-300",
        icon: Zap
    },
    {
        id: 37,
        name: "Balance Board",
        category: "Toys",
        price: "$40.00",
        rating: 4.8,
        reviews: "3k+",
        link: "https://www.amazon.com/s?k=wooden+balance+board+kids",
        color: "from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-300",
        icon: Anchor
    },
    {
        id: 38,
        name: "Pop-Up Play Tunnel",
        category: "Toys",
        price: "$18.00",
        rating: 4.7,
        reviews: "8k+",
        link: "https://www.amazon.com/s?k=kids+play+tunnel",
        color: "from-lime-500/20 to-green-500/20 text-lime-600 dark:text-lime-300",
        icon: Smile
    },

    // --- CLOTHING & DAILY LIVING ---
    {
        id: 11,
        name: "Seamless Sensitivity Socks",
        category: "Clothing",
        price: "$15.00",
        rating: 4.5,
        reviews: "900+",
        tag: "Comfort",
        link: "https://www.amazon.com/s?k=seamless+socks+for+kids+sensory",
        color: "from-gray-500/20 to-slate-500/20 text-gray-600 dark:text-gray-300",
        icon: Shirt
    },
    {
        id: 12,
        name: "Tagless Cotton Tees",
        category: "Clothing",
        price: "$15 - $25",
        rating: 4.6,
        reviews: "5k+",
        link: "https://www.amazon.com/s?k=tagless+shirts+for+kids",
        color: "from-slate-500/20 to-zinc-500/20 text-slate-600 dark:text-slate-300",
        icon: Shirt
    },
    {
        id: 13,
        name: "Elastic No-Tie Shoelaces",
        category: "Clothing",
        price: "$8.00",
        rating: 4.6,
        reviews: "40k+",
        link: "https://www.amazon.com/s?k=no+tie+shoelaces",
        color: "from-zinc-500/20 to-stone-500/20 text-zinc-600 dark:text-zinc-300",
        icon: Shirt
    },
    // --- NEW CLOTHING ADDITIONS ---
    {
        id: 301,
        name: "Adaptive Bodysuit (Toddler)",
        category: "Clothing",
        price: "$20.00",
        rating: 4.7,
        reviews: "1k+",
        tag: "Small Kids",
        link: "https://www.amazon.com/s?k=special+needs+bodysuits+for+kids",
        color: "from-pink-400/20 to-rose-400/20 text-pink-600 dark:text-pink-300",
        icon: Shirt
    },
    {
        id: 302,
        name: "Sensory Soft-Waist Pants",
        category: "Clothing",
        price: "$25.00",
        rating: 4.6,
        reviews: "2k+",
        tag: "Small Kids",
        link: "https://www.amazon.com/s?k=sensory+friendly+pants+toddler",
        color: "from-blue-400/20 to-sky-400/20 text-blue-600 dark:text-blue-300",
        icon: Shirt
    },
    {
        id: 303,
        name: "Compression Undershirt (Boys)",
        category: "Clothing",
        price: "$20 - $30",
        rating: 4.8,
        reviews: "3k+",
        tag: "Deep Pressure",
        link: "https://www.amazon.com/s?k=kids+compression+shirt+autism",
        color: "from-indigo-500/20 to-blue-600/20 text-indigo-600 dark:text-indigo-300",
        icon: Shirt
    },
    {
        id: 304,
        name: "Knit Denim Sensory Jeans",
        category: "Clothing",
        price: "$30.00",
        rating: 4.5,
        reviews: "1.5k+",
        tag: "Big Kids",
        link: "https://www.amazon.com/s?k=knit+denim+pants+boys+sensory",
        color: "from-slate-600/20 to-gray-600/20 text-slate-700 dark:text-slate-300",
        icon: Shirt
    },
    {
        id: 305,
        name: "Seamless Leggings (Girls)",
        category: "Clothing",
        price: "$18.00",
        rating: 4.7,
        reviews: "5k+",
        tag: "Girls",
        link: "https://www.amazon.com/s?k=seamless+leggings+girls+sensory",
        color: "from-fuchsia-500/20 to-purple-500/20 text-fuchsia-600 dark:text-fuchsia-300",
        icon: Shirt
    },
    {
        id: 306,
        name: "Sensory Friendly Dress",
        category: "Clothing",
        price: "$25.00",
        rating: 4.8,
        reviews: "800+",
        tag: "Girls",
        link: "https://www.amazon.com/s?k=sensory+friendly+dress+girls",
        color: "from-rose-500/20 to-pink-500/20 text-rose-600 dark:text-rose-300",
        icon: Shirt
    },
    {
        id: 307,
        name: "Magnetic Closure Shirt",
        category: "Clothing",
        price: "$35.00",
        rating: 4.6,
        reviews: "500+",
        tag: "Adaptive",
        link: "https://www.amazon.com/s?k=magnetic+closure+shirts+kids",
        color: "from-teal-500/20 to-emerald-500/20 text-teal-600 dark:text-teal-300",
        icon: Shirt
    },
    {
        id: 308,
        name: "Weighted Compression Vest",
        category: "Clothing",
        price: "$40 - $60",
        rating: 4.7,
        reviews: "2k+",
        tag: "Calming",
        link: "https://www.amazon.com/s?k=weighted+compression+vest+kids",
        color: "from-blue-600/20 to-indigo-600/20 text-blue-700 dark:text-blue-300",
        icon: Layers
    },
    {
        id: 309,
        name: "Seamless Boxer Briefs",
        category: "Clothing",
        price: "$20.00",
        rating: 4.7,
        reviews: "3k+",
        tag: "Big Kids",
        link: "https://www.amazon.com/s?k=seamless+boxer+briefs+boys+sensory",
        color: "from-gray-500/20 to-zinc-500/20 text-gray-600 dark:text-gray-300",
        icon: Shirt
    },
    // --- UNISEX CLOTHING [NEW] ---
    {
        id: 320,
        name: "Sensory Friendly Hoodie (Unisex)",
        category: "Clothing",
        price: "$30.00",
        rating: 4.8,
        reviews: "2k+",
        tag: "Unisex",
        link: "https://www.amazon.com/s?k=sensory+friendly+hoodie+kids",
        color: "from-orange-400/20 to-amber-400/20 text-orange-600 dark:text-orange-300",
        icon: Shirt
    },
    {
        id: 321,
        name: "Bamboo Viscose Pajama Set",
        category: "Clothing",
        price: "$25 - $40",
        rating: 4.9,
        reviews: "5k+",
        tag: "Cooling",
        link: "https://www.amazon.com/s?k=bamboo+pajamas+kids+unisex",
        color: "from-teal-400/20 to-emerald-400/20 text-teal-600 dark:text-teal-300",
        icon: Moon
    },
    {
        id: 322,
        name: "Soft Fleece Joggers",
        category: "Clothing",
        price: "$20.00",
        rating: 4.7,
        reviews: "10k+",
        tag: "Unisex",
        link: "https://www.amazon.com/s?k=kids+fleece+joggers+soft",
        color: "from-slate-500/20 to-gray-500/20 text-slate-600 dark:text-slate-300",
        icon: Shirt
    },
    {
        id: 323,
        name: "Wearable Blanket Hoodie",
        category: "Clothing",
        price: "$30.00",
        rating: 4.8,
        reviews: "50k+",
        tag: "Cozy",
        link: "https://www.amazon.com/s?k=wearable+blanket+kids",
        color: "from-indigo-400/20 to-blue-400/20 text-indigo-600 dark:text-indigo-300",
        icon: Layers
    },
    {
        id: 324,
        name: "Slip-On Canvas Shoes",
        category: "Clothing",
        price: "$25.00",
        rating: 4.6,
        reviews: "15k+",
        tag: "Easy On",
        link: "https://www.amazon.com/s?k=kids+slip+on+canvas+shoes",
        color: "from-red-400/20 to-rose-400/20 text-red-600 dark:text-red-300",
        icon: Zap
    },
    {
        id: 325,
        name: "Sensory Compression Beanie",
        category: "Clothing",
        price: "$15.00",
        rating: 4.5,
        reviews: "1k+",
        tag: "Calming",
        link: "https://www.amazon.com/s?k=sensory+compression+hat+kids",
        color: "from-violet-400/20 to-purple-400/20 text-violet-600 dark:text-violet-300",
        icon: Smile
    },

    // --- BOOKS AND RESOURCES [NEW] ---
    {
        id: 401,
        name: "Book: Uniquely Human",
        category: "Education",
        price: "$15.00",
        rating: 4.9,
        reviews: "5k+",
        tag: "Parenting",
        link: "https://www.amazon.com/s?k=uniquely+human+barry+prizant",
        color: "from-amber-200/20 to-yellow-200/20 text-amber-700 dark:text-amber-300",
        icon: BookOpen
    },
    {
        id: 402,
        name: "Book: The Out-of-Sync Child",
        category: "Education",
        price: "$16.00",
        rating: 4.8,
        reviews: "8k+",
        tag: "Sensory",
        link: "https://www.amazon.com/s?k=the+out+of+sync+child",
        color: "from-blue-200/20 to-slate-200/20 text-blue-700 dark:text-blue-300",
        icon: BookOpen
    },
    {
        id: 403,
        name: "Book: All My Stripes",
        category: "Education",
        price: "$12.00",
        rating: 4.9,
        reviews: "4k+",
        tag: "For Kids",
        link: "https://www.amazon.com/s?k=all+my+stripes+book",
        color: "from-red-200/20 to-orange-200/20 text-red-600 dark:text-red-300",
        icon: Smile
    },
    {
        id: 404,
        name: "Book: My Mouth is a Volcano",
        category: "Education",
        price: "$10.00",
        rating: 4.8,
        reviews: "10k+",
        tag: "Social",
        link: "https://www.amazon.com/s?k=my+mouth+is+a+volcano",
        color: "from-orange-500/20 to-red-500/20 text-orange-700 dark:text-orange-300",
        icon: BookOpen
    },

    // --- SLEEP & CALMING [NEW] ---
    {
        id: 410,
        name: "White Noise Sound Machine",
        category: "Tech",
        price: "$25.00",
        rating: 4.7,
        reviews: "50k+",
        tag: "Sleep",
        link: "https://www.amazon.com/s?k=white+noise+machine+for+kids",
        color: "from-zinc-200/20 to-slate-200/20 text-zinc-600 dark:text-zinc-300",
        icon: Moon
    },
    {
        id: 411,
        name: "Wake-Up Light Alarm Clock",
        category: "Tech",
        price: "$40.00",
        rating: 4.6,
        reviews: "15k+",
        tag: "Routine",
        link: "https://www.amazon.com/s?k=wake+up+light+alarm+clock+kids",
        color: "from-yellow-300/20 to-orange-300/20 text-yellow-600 dark:text-yellow-300",
        icon: Sun
    },
    {
        id: 412,
        name: "Vibrating Mattress Pad",
        category: "Sensory",
        price: "$60.00",
        rating: 4.5,
        reviews: "500+",
        tag: "Deep Sleep",
        link: "https://www.amazon.com/s?k=calming+vibrating+mattress+pad",
        color: "from-indigo-300/20 to-violet-300/20 text-indigo-700 dark:text-indigo-300",
        icon: Zap
    },
    {
        id: 413,
        name: "Glow-in-Dark Ceiling Stars",
        category: "Sensory",
        price: "$10.00",
        rating: 4.6,
        reviews: "8k+",
        tag: "Visual",
        link: "https://www.amazon.com/s?k=glow+in+the+dark+stars+ceiling",
        color: "from-green-200/20 to-lime-200/20 text-green-600 dark:text-green-300",
        icon: Moon
    },

    // --- MOTOR & FEEDING SKILLS [NEW] ---
    {
        id: 420,
        name: "Silicone Suction Plate",
        category: "Daily Living",
        price: "$15.00",
        rating: 4.8,
        reviews: "3k+",
        tag: "Feeding",
        link: "https://www.amazon.com/s?k=silicone+suction+plate+toddler",
        color: "from-cyan-300/20 to-teal-300/20 text-cyan-600 dark:text-cyan-300",
        icon: Utensils
    },
    {
        id: 421,
        name: "Oral Motor Chew Tool (Z-Vibe)",
        category: "Sensory",
        price: "$40.00",
        rating: 4.7,
        reviews: "1k+",
        tag: "Oral",
        link: "https://www.amazon.com/s?k=ark+z-vibe",
        color: "from-blue-400/20 to-indigo-400/20 text-blue-600 dark:text-blue-300",
        icon: Zap
    },
    {
        id: 422,
        name: "Therapy Peanut Ball",
        category: "Toys",
        price: "$25.00",
        rating: 4.7,
        reviews: "4k+",
        tag: "Balance",
        link: "https://www.amazon.com/s?k=peanut+ball+therapy+kids",
        color: "from-red-300/20 to-orange-300/20 text-red-600 dark:text-red-300",
        icon: Anchor
    },
    {
        id: 423,
        name: "Stepping Stones (Balance)",
        category: "Toys",
        price: "$40.00",
        rating: 4.8,
        reviews: "5k+",
        tag: "Gross Motor",
        link: "https://www.amazon.com/s?k=balance+stepping+stones+kids",
        color: "from-green-400/20 to-emerald-400/20 text-green-600 dark:text-green-300",
        icon: Layers
    },
    {
        id: 424,
        name: "Foam Climbing Blocks",
        category: "Toys",
        price: "$100+",
        rating: 4.8,
        reviews: "3k+",
        tag: "Active",
        link: "https://www.amazon.com/s?k=foam+climbing+blocks+toddlers",
        color: "from-purple-300/20 to-pink-300/20 text-purple-600 dark:text-purple-300",
        icon: Puzzle
    },
    {
        id: 425,
        name: "Scooter Board with Handles",
        category: "Toys",
        price: "$20.00",
        rating: 4.7,
        reviews: "2k+",
        tag: "Fun",
        link: "https://www.amazon.com/s?k=scooter+board+kids+handles",
        color: "from-yellow-400/20 to-orange-400/20 text-yellow-700 dark:text-yellow-300",
        icon: Zap
    },

    // --- FINE MOTOR & SCHOOL [NEW] ---
    {
        id: 430,
        name: "LCD Writing Tablet",
        category: "Tech",
        price: "$15.00",
        rating: 4.6,
        reviews: "20k+",
        tag: "Creative",
        link: "https://www.amazon.com/s?k=lcd+writing+tablet+kids",
        color: "from-black/20 to-gray-800/20 text-gray-700 dark:text-gray-300",
        icon: Gamepad2
    },
    {
        id: 431,
        name: "Therapy Putty (Strengthening)",
        category: "Sensory",
        price: "$12.00",
        rating: 4.7,
        reviews: "5k+",
        tag: "Fine Motor",
        link: "https://www.amazon.com/s?k=therapy+putty+kids",
        color: "from-pink-300/20 to-rose-300/20 text-pink-600 dark:text-pink-300",
        icon: Layers
    },
    {
        id: 432,
        name: "Erasable Gel Pens",
        category: "Education",
        price: "$15.00",
        rating: 4.7,
        reviews: "10k+",
        tag: "School",
        link: "https://www.amazon.com/s?k=erasable+pens+kids",
        color: "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-300",
        icon: Gamepad2
    },
    {
        id: 433,
        name: "Lace & Trace Activity Cards",
        category: "Education",
        price: "$12.00",
        rating: 4.7,
        reviews: "3k+",
        tag: "Skill",
        link: "https://www.amazon.com/s?k=lacing+cards+for+kids",
        color: "from-lime-300/20 to-green-300/20 text-lime-700 dark:text-lime-300",
        icon: Puzzle
    },
    {
        id: 434,
        name: "Zipper & Button Board",
        category: "Daily Living",
        price: "$15.00",
        rating: 4.6,
        reviews: "2k+",
        tag: "Skills",
        link: "https://www.amazon.com/s?k=learn+to+dress+board",
        color: "from-indigo-200/20 to-blue-200/20 text-indigo-700 dark:text-indigo-300",
        icon: Shirt
    },
    {
        id: 435,
        name: "Chunky Beeswax Crayons",
        category: "Education",
        price: "$18.00",
        rating: 4.8,
        reviews: "1k+",
        tag: "Art",
        link: "https://www.amazon.com/s?k=honeysticks+beeswax+crayons",
        color: "from-amber-400/20 to-yellow-400/20 text-amber-700 dark:text-amber-300",
        icon: Smile
    },

    // --- SPEECH & ORAL MOTOR [NEW] ---
    {
        id: 501,
        name: "Toobaloo Whisper Phone",
        category: "Communication",
        price: "$8.00",
        rating: 4.7,
        reviews: "5k+",
        tag: "Feedback",
        link: "https://www.amazon.com/s?k=toobaloo+whisper+phone",
        color: "from-red-400/20 to-orange-400/20 text-red-600 dark:text-red-300",
        icon: Mic
    },
    {
        id: 502,
        name: "Chew Tubes (Tough)",
        category: "Sensory",
        price: "$12.00",
        rating: 4.6,
        reviews: "3k+",
        tag: "Oral Motor",
        link: "https://www.amazon.com/s?k=chew+tubes+for+sensory+kids",
        color: "from-yellow-400/20 to-lime-400/20 text-yellow-700 dark:text-yellow-300",
        icon: Zap
    },
    {
        id: 503,
        name: "Sequencing Cards (Story)",
        category: "Education",
        price: "$15.00",
        rating: 4.7,
        reviews: "2k+",
        tag: "Speech",
        link: "https://www.amazon.com/s?k=sequencing+cards+for+speech+therapy",
        color: "from-blue-400/20 to-cyan-400/20 text-blue-600 dark:text-blue-300",
        icon: Layers
    },
    {
        id: 504,
        name: "TalkTools Honey Bear Cup",
        category: "Daily Living",
        price: "$20.00",
        rating: 4.6,
        reviews: "1.5k+",
        tag: "Straw Skills",
        link: "https://www.amazon.com/s?k=honey+bear+straw+cup",
        color: "from-amber-300/20 to-yellow-300/20 text-amber-700 dark:text-amber-300",
        icon: Utensils
    },
    {
        id: 505,
        name: "Social Skills Board Games",
        category: "Education",
        price: "$25.00",
        rating: 4.7,
        reviews: "1k+",
        tag: "Interactive",
        link: "https://www.amazon.com/s?k=social+skills+board+games+for+kids",
        color: "from-purple-400/20 to-fuchsia-400/20 text-purple-600 dark:text-purple-300",
        icon: Puzzle
    },
    {
        id: 506,
        name: "Mirror for Speech Practice",
        category: "Communication",
        price: "$15.00",
        rating: 4.5,
        reviews: "500+",
        tag: "Articulation",
        link: "https://www.amazon.com/s?k=shatterproof+mirror+for+kids",
        color: "from-sky-200/20 to-blue-200/20 text-sky-600 dark:text-sky-300",
        icon: Smile
    },

    // --- EVERYDAY NEEDS & AUTONOMY [NEW] ---
    {
        id: 510,
        name: "Color-Coded Digital Clock",
        category: "Daily Living",
        price: "$30.00",
        rating: 4.6,
        reviews: "2k+",
        tag: "Routine",
        link: "https://www.amazon.com/s?k=color+coded+clock+for+kids",
        color: "from-green-300/20 to-emerald-300/20 text-green-700 dark:text-green-300",
        icon: Watch
    },
    {
        id: 511,
        name: "Autism Medical Alert Seatbelt Cover",
        category: "Safety",
        price: "$10.00",
        rating: 4.8,
        reviews: "5k+",
        tag: "Safety",
        link: "https://www.amazon.com/s?k=autism+seatbelt+cover",
        color: "from-red-500/20 to-orange-500/20 text-red-600 dark:text-red-300",
        icon: Shield
    },
    {
        id: 512,
        name: "Noise Reducing Curtains",
        category: "Sensory",
        price: "$30 - $50",
        rating: 4.5,
        reviews: "10k+",
        tag: "Environment",
        link: "https://www.amazon.com/s?k=noise+reducing+curtains",
        color: "from-slate-400/20 to-gray-400/20 text-slate-700 dark:text-slate-300",
        icon: Moon
    },
    {
        id: 513,
        name: "Easy-Grip Toothbrush",
        category: "Daily Living",
        price: "$8.00",
        rating: 4.6,
        reviews: "2k+",
        tag: "Hygiene",
        link: "https://www.amazon.com/s?k=radius+totz+toothbrush",
        color: "from-teal-300/20 to-cyan-300/20 text-teal-600 dark:text-teal-300",
        icon: Zap
    },
    {
        id: 39,
        name: "Adaptive Utensils",
        category: "Daily Living",
        price: "$15 - $30",
        rating: 4.5,
        reviews: "1k+",
        link: "https://www.amazon.com/s?k=adaptive+utensils+for+kids",
        color: "from-green-500/20 to-teal-500/20 text-green-500 dark:text-green-300",
        icon: Utensils
    },
    {
        id: 40,
        name: "Vibrating Toothbrush",
        category: "Daily Living",
        price: "$10.00",
        rating: 4.6,
        reviews: "5k+",
        link: "https://www.amazon.com/s?k=kids+electric+toothbrush",
        color: "from-teal-500/20 to-cyan-500/20 text-teal-500 dark:text-teal-300",
        icon: Zap
    },
    {
        id: 41,
        name: "Potty Training Watch",
        category: "Daily Living",
        price: "$20.00",
        rating: 4.4,
        reviews: "3k+",
        tag: "Routine",
        link: "https://www.amazon.com/s?k=potty+training+watch",
        color: "from-pink-500/20 to-rose-500/20 text-pink-500 dark:text-pink-300",
        icon: Watch
    },

    // --- EDUCATION & SCHOOL ---
    {
        id: 42,
        name: "Visual Schedule Board",
        category: "Education",
        price: "$20.00",
        rating: 4.6,
        reviews: "2k+",
        tag: "Structure",
        link: "https://www.amazon.com/s?k=visual+schedule+for+kids",
        color: "from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-sky-300",
        icon: Layers
    },
    {
        id: 43,
        name: "Pencil Grips (Ergonomic)",
        category: "Education",
        price: "$6.00",
        rating: 4.7,
        reviews: "8k+",
        link: "https://www.amazon.com/s?k=pencil+grips+for+kids+handwriting",
        color: "from-cyan-500/20 to-teal-500/20 text-cyan-600 dark:text-cyan-300",
        icon: Gamepad2
    },
    {
        id: 44,
        name: "Adaptive Scissors",
        category: "Education",
        price: "$8.00",
        rating: 4.8,
        reviews: "1.5k+",
        link: "https://www.amazon.com/s?k=adaptive+scissors+kids",
        color: "from-yellow-500/20 to-orange-500/20 text-yellow-600 dark:text-yellow-300",
        icon: Scissors
    },
    {
        id: 45,
        name: "Emotional Flashcards",
        category: "Education",
        price: "$12.00",
        rating: 4.7,
        reviews: "3k+",
        link: "https://www.amazon.com/s?k=emotion+flashcards+for+kids",
        color: "from-violet-500/20 to-purple-500/20 text-violet-600 dark:text-violet-300",
        icon: Smile
    },

    // --- TECH & SAFETY ---
    {
        id: 14,
        name: "Noise Cancelling Earmuffs",
        category: "Tech",
        price: "$15.00",
        rating: 4.8,
        reviews: "12k+",
        tag: "School Ready",
        link: "https://www.amazon.com/s?k=kids+noise+cancelling+headphones",
        color: "from-slate-500/20 to-gray-500/20 text-slate-700 dark:text-slate-300",
        icon: Headphones
    },
    {
        id: 15,
        name: "Visual Timer",
        category: "Tech",
        price: "$20.00",
        rating: 4.7,
        reviews: "8k+",
        tag: "Routine",
        link: "https://www.amazon.com/s?k=visual+timer+for+kids",
        color: "from-red-500/20 to-orange-500/20 text-red-500 dark:text-red-300",
        icon: Timer
    },
    {
        id: 16,
        name: "GPS Tracker for Kids",
        category: "Tech",
        price: "$30 - $150",
        rating: 4.4,
        reviews: "5k+",
        tag: "Safety",
        link: "https://www.amazon.com/s?k=gps+tracker+for+kids",
        color: "from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-300",
        icon: Watch
    },
    {
        id: 17,
        name: "Galaxy Star Projector",
        category: "Tech",
        price: "$25.00",
        rating: 4.6,
        reviews: "15k+",
        tag: "Sleep",
        link: "https://www.amazon.com/s?k=galaxy+star+projector",
        color: "from-indigo-500/20 to-violet-500/20 text-indigo-800 dark:text-indigo-300",
        icon: Moon
    }
];

const CATEGORIES = ["All", "Gifts", "Communication", "Safety", "Sensory", "Toys", "Clothing", "Education", "Daily Living", "Tech"];

export default function MarketplacePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const filteredProducts = useMemo(() => {
        return allProducts.filter((product) => {
            const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory]);

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <div className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-30 shadow-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-2 rounded-full hover:bg-[var(--surface2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
                                    <ShoppingBag className="w-6 h-6 text-orange-500" />
                                    NeuroKid Store
                                </h1>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-[var(--muted)]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search toys, swings, clothes..."
                                className="block w-full rounded-xl border border-[var(--border)] bg-[var(--surface2)] pl-10 pr-4 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                    ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                                    : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 text-sm text-[var(--muted)] flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Showing {filteredProducts.length} results
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {filteredProducts.map((item) => (
                        <a
                            key={item.id}
                            href={getAffiliateLink(item.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-orange-200"
                        >
                            {/* Visual Placeholder for Item with specific colors */}
                            <div className={`relative aspect-square rounded-xl mb-4 overflow-hidden flex items-center justify-center bg-gradient-to-br ${item.color.split(' ')[0]} ${item.color.split(' ')[1]}`}>
                                <item.icon className={`w-16 h-16 opacity-40 group-hover:scale-110 transition-transform duration-500 ${item.color.split(' ').slice(2).join(' ')}`} />

                                {item.tag && (
                                    <span className="absolute top-2 right-2 bg-white/90 dark:bg-black/60 text-[var(--text)] backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-md shadow-sm uppercase tracking-wide">
                                        {item.tag}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col">
                                <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)] mb-1">{item.category}</div>
                                <h4 className="font-bold text-[var(--text)] mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                                    {item.name}
                                </h4>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex text-yellow-500">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        <span className="text-xs font-bold ml-1">{item.rating}</span>
                                    </div>
                                    <span className="text-xs text-[var(--muted)]">({item.reviews})</span>
                                </div>

                                <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
                                    <span className="font-bold text-lg text-[var(--text)]">{item.price}</span>
                                    <span className="flex items-center gap-1 text-xs font-bold text-white bg-[var(--primary)] px-3 py-2 rounded-lg group-hover:bg-[var(--primary-hover)] transition-colors shadow-sm cursor-pointer">
                                        Buy Now <ExternalLink className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            <div className="border-t border-[var(--border)] bg-[var(--surface2)] py-8 mt-12">
                <div className="mx-auto max-w-7xl px-4 text-center space-y-4">
                    <p className="text-xs text-[var(--muted)] opacity-80">
                        NeuroKid is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. As an Amazon Associate, I earn from qualifying purchases.
                    </p>
                    <p className="text-[10px] text-[var(--muted)] opacity-60 uppercase tracking-wide max-w-2xl mx-auto">
                        DISCLAIMER: This marketplace is a curated collection for educational demonstration. NeuroKid is a personal project by Shashank Puli (MVP). Content provides no medical advice.
                    </p>
                </div>
            </div>
        </div>
    );
}
