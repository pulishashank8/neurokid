import { describe, it, expect } from "vitest";
import { POPULAR_RHYMES, RHYME_COUNT, RHYME_LANGUAGES } from "@/features/stories/rhymes-data";

describe("rhymes-data", () => {
    describe("POPULAR_RHYMES", () => {
        it("has at least one rhyme", () => {
            expect(POPULAR_RHYMES.length).toBeGreaterThan(0);
        });

        it("RHYME_COUNT matches array length", () => {
            expect(RHYME_COUNT).toBe(POPULAR_RHYMES.length);
        });

        it("every rhyme has required fields: id, title, text, icon", () => {
            for (const r of POPULAR_RHYMES) {
                expect(r.id).toBeDefined();
                expect(typeof r.id).toBe("string");
                expect(r.id.length).toBeGreaterThan(0);
                expect(r.title).toBeDefined();
                expect(typeof r.title).toBe("string");
                expect(r.text).toBeDefined();
                expect(r.icon).toBeDefined();
            }
        });

        it("every rhyme has a valid youtubeId for playback", () => {
            for (const r of POPULAR_RHYMES) {
                expect(r.youtubeId, `Rhyme "${r.title}" (id: ${r.id}) must have youtubeId`).toBeDefined();
                expect(typeof r.youtubeId).toBe("string");
                expect((r.youtubeId as string).length).toBe(11);
            }
        });

        it("no youtubeId is a YouTube channel ID (must not start with UC)", () => {
            for (const r of POPULAR_RHYMES) {
                const id = r.youtubeId as string;
                expect(id.startsWith("UC"), `Rhyme "${r.title}" has channel-like id: ${id}`).toBe(false);
            }
        });

        it("no duplicate rhyme ids", () => {
            const ids = POPULAR_RHYMES.map((r) => r.id);
            const unique = new Set(ids);
            expect(unique.size).toBe(ids.length);
        });

        it("does not include removed broken rhyme (The Ants Go Marching)", () => {
            const ants = POPULAR_RHYMES.find((r) => r.id === "ants");
            expect(ants).toBeUndefined();
        });
    });

    describe("RHYME_LANGUAGES", () => {
        it("includes All as first option", () => {
            expect(RHYME_LANGUAGES[0]).toBe("All");
        });

        it("has at least one other language", () => {
            expect(RHYME_LANGUAGES.length).toBeGreaterThan(1);
        });

        it("every language in data appears in filter list", () => {
            const dataLangs = new Set(POPULAR_RHYMES.map((r) => r.language).filter(Boolean));
            const filterLangs = new Set(RHYME_LANGUAGES.filter((l) => l !== "All"));
            for (const lang of dataLangs) {
                expect(filterLangs.has(lang as string), `Language "${lang}" should be in RHYME_LANGUAGES`).toBe(true);
            }
        });
    });
});
