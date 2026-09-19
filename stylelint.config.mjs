/**
 * Stylelint config for scanners/linters that resolve a repo-level config
 * (SonarCSS-style engines embed stylelint's `at-rule-no-unknown`).
 *
 * The Tailwind v4 build-time at-rules below are processed by Tailwind's
 * PostCSS pipeline from `app/globals.css` before reaching the browser —
 * they are not unknown CSS, they are directives of the Tailwind DSL.
 *
 * `public/themes/*.css` are static, browser-served stylesheets (loaded via
 * <link>) that Tailwind never processes; they contain only plain CSS.
 */
const config = {
  ignoreFiles: ["public/themes/**/*.css"],
  rules: {
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "layer",
          "config",
          "plugin",
          "theme",
          "utility",
          "variant",
          "custom-variant",
          "custom-media",
          "source",
          "reference",
          "screen",
        ],
      },
    ],
  },
}

export default config
