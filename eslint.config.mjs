import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Project-wide relaxations to unblock lint while keeping other checks
      "@typescript-eslint/no-explicit-any": "warn", // Warn on any types to encourage proper typing
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "prefer-const": "off",
      "no-use-before-define": "off",
    },
  },
  // Stricter rules for API routes (critical for type safety)
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // Error on any in API routes
    },
  },
  // Relaxed rules for test files
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Scripts and tooling (Node, often use require)
  {
    files: ["scripts/**", "fix-tests.js", "test-db.js", "tests/**", "**/__tests__/**/setup*.ts", "**/__tests__/**/setup-*.ts", "**/__tests__/**/screening.test.tsx"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  // Example files may use @ts-nocheck for documentation
  {
    files: ["**/*.example.ts", "**/*.example.tsx"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    files: ["prisma/seed.{js,mjs,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
