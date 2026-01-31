"use client";

import { StoryAssistant } from "@/components/stories/StoryAssistant";

export default function StoriesPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] pt-36 px-4 sm:px-6 lg:px-8 pb-10">
            <StoryAssistant />
        </div>
    );
}
