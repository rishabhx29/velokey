# VeloKey

**VeloKey** is a minimal, distraction-free typing test website: timed and word-count drills, quotes, and a zen mode, with detailed results (WPM, accuracy, consistency, charts). On large screens you can turn on a **virtual keyboard** that highlights keys as you type, plus **key sounds** and optional **haptics** (supported devices).

---

## Features

| Area | What you get |
|------|----------------|
| **Test modes** | Time (e.g. 15s–120s), word count, quotes (length presets), zen |
| **Results** | WPM, raw speed, accuracy, character breakdown, consistency, elapsed time, WPM-over-time chart |
| **Virtual keyboard** | Classic layout; mirrors expected keys while typing (**desktop / `lg+` only** in the UI) |
| **Sound** | Per-key feedback via Web Audio (`public/sounds/sound.ogg`); toggle in Settings |
| **Haptics** | Optional vibration on supported hardware ([web-haptics](https://www.npmjs.com/package/web-haptics)) |
| **Settings** | Theme (light / dark / system), accent color, typography (many Google fonts), show keyboard, sound, realtime WPM |

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

3. **Run the development server**

   ```bash
   pnpm dev
   ```

4. **Open the site**

   In your browser go to [http://localhost:3000](http://localhost:3000).

---

## Production Build

```bash
pnpm build
pnpm start
```

By default the app listens on port **3000** (`next start`). Use `pnpm start -- -p 4000` (or your host’s process manager) to change the port.

---

## Sound and the Browser

Audio uses the **Web Audio API**. Many browsers only unlock audio after a **user gesture** (click, tap, or key press). If sound is enabled in Settings but you hear nothing, interact with the page once (e.g. start typing or click the test area), then try again.

---

## Project Scripts

| Command | Description |
|--------|-------------|
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Optimized production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript (`tsc --noEmit`) |
| `pnpm format` | Format TS/TSX with Prettier |

---

## Tech Stack

- [Next.js](https://nextjs.org) (App Router), React 19, TypeScript  
- Styling: Tailwind CSS, shadcn-style UI (Radix primitives, cmdk)  
- Charts: Recharts  
- Motion: [Motion](https://motion.dev)  
- Words / quotes: `random-words`, `inspirational-quotes`

---

## Author

**Rishabh Tripathi**  
Email: `rishabh.j.tripathi2903@gmail.com`  
GitHub: [rishabhx29](https://github.com/rishabhx29)