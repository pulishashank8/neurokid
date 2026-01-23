import { describe, it, expect } from "vitest";
import { RegisterSchema } from "@/lib/validators";

describe("RegisterSchema Validator", () => {
    it("should accept valid password", () => {
        const result = RegisterSchema.safeParse({
            email: "test@example.com",
            password: "Password123!",
            confirmPassword: "Password123!",
            username: "testuser",
            displayName: "Test User"
        });
        expect(result.success).toBe(true);
    });

    it("should reject password shorter than 8 chars", () => {
        const result = RegisterSchema.safeParse({
            email: "test@example.com",
            password: "Pass1!",
            confirmPassword: "Pass1!",
            username: "testuser",
            displayName: "Test User"
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain("at least 8 characters");
        }
    });

    it("should reject password without uppercase", () => {
        const result = RegisterSchema.safeParse({
            email: "test@example.com",
            password: "password123!",
            confirmPassword: "password123!",
            username: "testuser",
            displayName: "Test User"
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.message.includes("uppercase"))).toBe(true);
        }
    });

    it("should reject password without lowercase", () => {
        const result = RegisterSchema.safeParse({
            email: "test@example.com",
            password: "PASSWORD123!",
            confirmPassword: "PASSWORD123!",
            username: "testuser",
            displayName: "Test User"
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.message.includes("lowercase"))).toBe(true);
        }
    });

    it("should reject password without number", () => {
        const result = RegisterSchema.safeParse({
            email: "test@example.com",
            password: "Password!",
            confirmPassword: "Password!",
            username: "testuser",
            displayName: "Test User"
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.message.includes("number"))).toBe(true);
        }
    });

    it("should reject password without symbol", () => {
        const result = RegisterSchema.safeParse({
            email: "test@example.com",
            password: "Password123",
            confirmPassword: "Password123",
            username: "testuser",
            displayName: "Test User"
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.message.includes("symbol"))).toBe(true);
        }
    });
});
