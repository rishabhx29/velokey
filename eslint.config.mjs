import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "out/**",
      "build/**",
      "data/**",
      "next-env.d.ts",
      // Agent/editor tooling, not application code
      ".agents/**",
      ".claude/**",
      ".partykit/**",
      "test-results/**",
      "coverage/**",
      "storybook-static/**",
      // CommonJS build scripts (postinstall data generators)
      "scripts/*.cjs",
    ],
  },
]);

export default eslintConfig;
