// SonarQube-class scan: eslint-plugin-sonarjs (bug + code-smell detectors).
// Run separately via `npm run scan:sonar` — not part of the normal lint gate.
import sonarjs from "eslint-plugin-sonarjs";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import nextPlugin from "@next/eslint-plugin-next";

const sonarScanConfig = [
  {
    linterOptions: {
      // Inline eslint-disable directives exist for the main lint config, which
      // enables those plugin rules; this scan runs them disabled, so unused-
      // directive reporting here is noise.
      reportUnusedDisableDirectives: "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "public/**",
      "out/**",
      "build/**",
      "storybook-static/**",
      "test-results/**",
      "coverage/**",
      ".agents/**",
      ".claude/**",
      ".partykit/**",
    ],
  },
  {
    // Register the plugins referenced by inline eslint-disable directives so
    // they resolve (their rules stay off — this scan is sonarjs-only).
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooks,
      react,
      "jsx-a11y": jsxA11y,
      "@next/next": nextPlugin,
    },
  },
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "hooks/**/*.ts", "lib/**/*.ts", "realtime/**/*.ts", "shared/**/*.ts", "tests/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: "module", ecmaVersion: "latest" },
    },
    plugins: { sonarjs },
    rules: {
      ...sonarjs.configs.recommended.rules,
    },
  },
  {
    // Playwright's `test.skip(condition, reason)` is the idiomatic way to skip
    // e2e specs when their server prerequisite is absent — not a disabled test.
    files: ["tests/e2e/**"],
    rules: { "sonarjs/no-skipped-tests": "off" },
  },
];

export default sonarScanConfig;
