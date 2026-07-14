"use client";

import { motion } from "motion/react";
import { CREAM, CYAN, INK } from "../lib/colors";
import { SectionHeader } from "./Modes";

const FAQS = [
  {
    q: "Is VeloKey free and open source?",
    a: (
      <>
        VeloKey is free to use with no sign-up wall, ads, or trial lock. The code is public under Apache-2.0, so
        you can audit it, fork it, and build your own version.
      </>
    ),
  },
  {
    q: "What modes and stats are included?",
    a: (
      <>
        You can train across Easy, Medium, Hard, and Quote difficulty modes, or with timed tests, word-count tests, zen mode, code drills, or your own custom text.
        Results include WPM, raw speed, accuracy, consistency, character breakdown, and a WPM-over-time chart.
      </>
    ),
  },
  {
    q: "How does keyboard support work?",
    a: (
      <>
        VeloKey mirrors real key presses and highlights keys live on desktop and tablet layouts. You can switch keyboard styles
        (mechanical or magic) and practice with a visual board that responds in real time while you type.
      </>
    ),
  },
  {
    q: "What about sound packs and typing feel?",
    a: (
      <>
        Audio feedback is built in with separate toggles for keyboard sounds and click sounds. There are multiple
        switch-inspired sound packs, plus optional haptics on supported devices. If sound feels muted at first,
        one click or keypress usually unlocks audio in the browser.
      </>
    ),
  },
  {
    q: "Do you support languages and code practice?",
    a: (
      <>
        Yes. VeloKey ships with a broad language manifest (including RTL scripts like Arabic, Urdu, Persian, and
        Hebrew), plus built-in code passages across popular stacks such as JavaScript, TypeScript, Python, Go,
        Rust, SQL, and more.
      </>
    ),
  },
  {
    q: "Where can I report bugs or contribute?",
    a: (
      <>
        Everything runs through GitHub: open issues for bugs/features and submit pull requests for fixes.
        Contributors are also surfaced on the About page from the public GitHub contributor feed.
        {" "}
        <a
          href="https://github.com/rishabhx29/velokey"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-white"
          style={{ color: CYAN }}
        >
          View repository
        </a>
        {" · "}
        <a
          href="https://github.com/rishabhx29/velokey/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-white"
          style={{ color: CYAN }}
        >
          Open an issue
        </a>
      </>
    ),
  },
  {
    q: "How is my data stored and used?",
    a: (
      <>
        VeloKey stores your local preferences in your browser (for example theme, keyboard/sound toggles, and related
        settings) so your setup persists between sessions. It also uses Google Analytics for anonymous usage signals
        like speed, accuracy, and feature usage to improve product decisions and fix issues faster, without collecting
        personal identity data.
      </>
    ),
  },
  {
    q: "Is VeloKey affiliated with Monkeytype?",
    a: (
      <>
        No. VeloKey is an independent minimalist typing application with its own
        implementation, features, and open-source roadmap.
      </>
    ),
  },
] as const;

export function FAQ() {
  return (
    <section className="relative z-10 mx-auto max-w-site px-6 py-16">
      <SectionHeader
        kicker="§07 · faq"
        title="Small answers before you start."
        sub="The short version: open it, type, read the signal, repeat."
      />

      <div
        className="border"
        style={{ background: `${CREAM}10`, borderColor: `${CREAM}10` }}
      >
        {FAQS.map((item, index) => (
          <motion.details
            key={item.q}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="group border-b last:border-b-0"
            style={{ background: index % 2 === 0 ? INK : "#0d1016", borderColor: `${CREAM}10` }}
            open={index === 0}
          >
            <summary className="grid cursor-pointer list-none grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-5 marker:hidden sm:px-7">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.26em]"
                style={{ color: CYAN }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className="text-[20px] font-bold leading-tight tracking-[-0.01em] sm:text-[24px]"
                style={{ color: CREAM }}
              >
                {item.q}
              </span>
              <span
                className="grid h-7 w-7 place-items-center border font-mono text-[16px] leading-none transition-transform group-open:rotate-45"
                style={{ borderColor: `${CREAM}16`, color: CYAN }}
              >
                +
              </span>
            </summary>
            <div className="px-5 pb-6 pl-[72px] sm:px-7 sm:pl-[92px]">
              <p
                className="max-w-[68ch] text-[14px] leading-[1.7]"
                style={{ color: `${CREAM}a6` }}
              >
                {item.a}
              </p>
            </div>
          </motion.details>
        ))}
      </div>
    </section>
  );
}
