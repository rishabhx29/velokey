# VeloKey

**VeloKey** is a minimal, distraction-free typing test website: timed and word-count drills, quotes, and a zen mode, with detailed results (WPM, accuracy, consistency, charts). On large screens you can turn on a **virtual keyboard** that highlights keys as you type, plus **key sounds** and optional **haptics** (supported devices).

---

## Features

| Area                 | What you get                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Test modes**       | Time (e.g. 15s–120s), word count, quotes (length presets), zen                                                  |
| **Results**          | WPM, raw speed, accuracy, character breakdown, consistency, elapsed time, WPM-over-time chart                   |
| **Virtual keyboard** | Classic layout; mirrors expected keys while typing (**desktop / `lg+` only** in the UI)                         |
| **Sound**            | Per-key feedback via Web Audio (`public/sounds/sound.ogg`); toggle in Settings                                  |
| **Haptics**          | Optional vibration on supported hardware ([web-haptics](https://www.npmjs.com/package/web-haptics))             |
| **Settings**         | Theme (light / dark / system), accent color, typography (many Google fonts), show keyboard, sound, realtime WPM |

Settings are stored in `localStorage` in the browser.

---

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 9+ (used in the commands below)

If you use npm or Yarn, run the equivalent of `install` and the scripts from `package.json`.

---

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/rishabhx29/velokey.git
   cd velokey
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

   This installs all packages and runs **`postinstall`**, which copies quote text from the `inspirational-quotes` package into `data/quotes.json` and generates required data files.

3. **Configure the realtime server**

   ```bash
   cp .env.example .env.local
   ```

4. **Run the web and realtime servers in separate terminals**

   ```bash
   pnpm dev
   pnpm realtime:dev
   ```

5. **Open the site**

   In your browser go to [http://localhost:3000](http://localhost:3000).

---

## Production Build

```bash
pnpm build
pnpm start
```

The multiplayer service is deployed independently from the Next.js app:

```bash
pnpm realtime:deploy
```

Set `NEXT_PUBLIC_PARTYKIT_HOST` in the web deployment to the PartyKit host
created by that deployment. The browser connects directly to this service, so
the typing-race WebSocket does not pass through the Next.js server.

## Multiplayer architecture

- `app/`, `components/`, `hooks/`, and `lib/` are the Next.js web application.
- `realtime/` is the authoritative PartyKit game service, deployed and scaled independently.
- `shared/` contains the race protocol consumed by both sides. It must remain runtime-neutral.

By default the app listens on port **3000** (`next start`). Use `pnpm start -- -p 4000` (or your host’s process manager) to change the port.

---

## Sound and the Browser

Audio uses the **Web Audio API**. Many browsers only unlock audio after a **user gesture** (click, tap, or key press). If sound is enabled in Settings but you hear nothing, interact with the page once (e.g. start typing or click the test area), then try again.

---

## Project Scripts

| Command                | Description                     |
| ---------------------- | ------------------------------- |
| `pnpm dev`             | Development server (Turbopack)  |
| `pnpm realtime:dev`    | PartyKit multiplayer server     |
| `pnpm realtime:deploy` | Deploy the multiplayer server   |
| `pnpm build`           | Optimized production build      |
| `pnpm start`           | Serve the production build      |
| `pnpm lint`            | Run ESLint                      |
| `pnpm typecheck`       | Run TypeScript (`tsc --noEmit`) |
| `pnpm format`          | Format TS/TSX with Prettier     |

---

## Tech Stack

- [Next.js](https://nextjs.org) (App Router), React 19, TypeScript
- Styling: Tailwind CSS, shadcn-style UI (Radix primitives, cmdk)
- Charts: Recharts
- Motion: [Motion](https://motion.dev)
- Words / quotes: `random-words`, `inspirational-quotes`

## Creative UI Stack

| Library                                            | Use it for                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| `three`, `@react-three/fiber`, `@react-three/drei` | Interactive 3D scenes, WebGL product moments, shaders, models, and helpers. |
| `@react-three/postprocessing`, `postprocessing`    | Bloom, depth of field, noise, and other GPU post-processing effects.        |
| `gsap`, `@gsap/react`                              | Choreographed timelines and scroll-driven landing-page animation.           |
| `lenis`                                            | Smooth scrolling for animation-led marketing pages.                         |
| `lottie-react`                                     | Lightweight playback of exported Lottie vector animations.                  |

Use Three.js canvases, heavy 3D models, and Lottie files from client components loaded with `next/dynamic`; keep them below the fold unless they are essential to the first view. Motion remains the default for ordinary React transitions and interactions.

## Development Tooling

| Tool                     | Command                    | Purpose                                                                                                |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Next Bundle Analyzer     | `npm run analyze`          | Inspect client, server, and edge bundles before shipping.                                              |
| Lighthouse               | `npm run audit:lighthouse` | Generate a local performance, accessibility, SEO, and best-practices report while the site is running. |
| Vitest + Testing Library | `npm run test`             | Run unit and component tests.                                                                          |
| Vitest coverage          | `npm run test:coverage`    | Generate V8 coverage for app, component, hook, and library code.                                       |
| Playwright + axe         | `npm run test:e2e`         | Run browser and accessibility tests. Install Chromium first with `npx playwright install chromium`.    |
| Storybook                | `npm run storybook`        | Develop and review UI components in isolation at port 6006.                                            |
| Knip                     | `npm run check:unused`     | Report unused files, exports, and dependencies for review.                                             |
| Husky + lint-staged      | Runs on `git commit`       | Format and lint staged source changes before each commit.                                              |
| R3F Test Renderer        | Use in Vitest tests        | Test Three.js scenes without requiring a browser canvas.                                               |

---

## Author

**Rishabh**

Email: [rishabh.j.tripathi@gmail.com](mailto:rishabh.j.tripathi@gmail.com)
GitHub: [rishabhx29](https://github.com/rishabhx29)
