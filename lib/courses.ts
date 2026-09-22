// ─────────────────────────────────────────────────────────────────────────────
// Structured typing courses — progressive lessons that unlock as you pass them.
// Progress lives in localStorage; lesson text is generated deterministically
// from each lesson's target keys so practice always matches the curriculum.
// ─────────────────────────────────────────────────────────────────────────────

import { generateWords } from "@/lib/words"
import { randomPick, randomShuffle } from "@/lib/secure-random"

export interface CourseLesson {
  id: string
  title: string
  description: string
  /** Keys drilled in this lesson ("" = all keys / general words) */
  keys: string[]
  /** Words per drill */
  wordCount: number
  /** Pass threshold: accuracy % required to complete the lesson */
  passAccuracy: number
}

export interface Course {
  id: string
  title: string
  description: string
  lessons: CourseLesson[]
}

const DRILL_LENGTH = 6
const DRILL_LENGTH_HARD = 8

function drillWord(keys: string[], hard: boolean): string {
  let word = ""
  const length = hard ? DRILL_LENGTH_HARD : DRILL_LENGTH
  while (word.length < length) {
    word += randomPick(keys)
  }
  return word
}

/** Generate the word list for a lesson: drill words from its keys, padded
 * with general English words so the drill still reads like real text. */
export function buildLessonWords(lesson: CourseLesson): string[] {
  if (lesson.keys.length === 0) {
    return generateWords(lesson.wordCount)
  }
  const keyCount = lesson.keys.length
  const drillCount = Math.max(8, Math.round(lesson.wordCount * 0.7))
  const drills = Array.from({ length: drillCount }, () =>
    // Solo-key drills first (pure repetition), then mixed-key drills
    drillWord(
      keyCount === 1 || randomPick([true, false])
        ? [lesson.keys[0]]
        : lesson.keys,
      keyCount > 2
    )
  )
  const filler = generateWords(lesson.wordCount - drills.length)
  // Interleave so drills don't all sit at the start
  return randomShuffle([...drills, ...filler])
}

export const COURSES: Course[] = [
  {
    id: "foundations",
    title: "Foundations",
    description: "From the home row to full words — start here if you're new",
    lessons: [
      {
        id: "home-asdf",
        title: "Home row: a s d f",
        description: "Anchor your left hand on the home row",
        keys: ["a", "s", "d", "f"],
        wordCount: 25,
        passAccuracy: 90,
      },
      {
        id: "home-jkl",
        title: "Home row: j k l ;",
        description: "Anchor your right hand",
        keys: ["j", "k", "l"],
        wordCount: 25,
        passAccuracy: 90,
      },
      {
        id: "home-blend",
        title: "Home row blended",
        description: "Both hands together",
        keys: ["a", "s", "d", "f", "j", "k", "l"],
        wordCount: 30,
        passAccuracy: 92,
      },
      {
        id: "top-ei",
        title: "Top row: e i",
        description: "Reach up for the most common vowels",
        keys: ["e", "i"],
        wordCount: 30,
        passAccuracy: 90,
      },
      {
        id: "top-rou",
        title: "Top row: r o u",
        description: "Complete the upper reach",
        keys: ["r", "o", "u", "t"],
        wordCount: 30,
        passAccuracy: 90,
      },
      {
        id: "bottom-vbm",
        title: "Bottom row: v b n m",
        description: "The trickiest row, done slowly",
        keys: ["v", "b", "n", "m"],
        wordCount: 30,
        passAccuracy: 88,
      },
    ],
  },
  {
    id: "accuracy",
    title: "Accuracy Lab",
    description: "Clean typing under pressure — precision over speed",
    lessons: [
      {
        id: "acc-common",
        title: "Common words, 98% clean",
        description: "Everyday vocabulary at high precision",
        keys: [],
        wordCount: 40,
        passAccuracy: 98,
      },
      {
        id: "acc-adjacent",
        title: "Adjacent-key traps",
        description: "Pairs people fumble: he/er, un/im, on/in",
        keys: ["h", "e", "r", "u", "i", "m", "n", "o"],
        wordCount: 35,
        passAccuracy: 96,
      },
      {
        id: "acc-shift",
        title: "Capitals & shift",
        description: "Shift reaches without breaking rhythm",
        keys: ["q", "w", "e", "r", "t"],
        wordCount: 35,
        passAccuracy: 95,
      },
      {
        id: "acc-marathon",
        title: "Marathon: 60 words",
        description: "Hold your accuracy for a long run",
        keys: [],
        wordCount: 60,
        passAccuracy: 97,
      },
    ],
  },
  {
    id: "symbols",
    title: "Numbers & Symbols",
    description: "Code-style characters without losing flow",
    lessons: [
      {
        id: "sym-numrow",
        title: "Number row",
        description: "1 through 0 without looking down",
        keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        wordCount: 30,
        passAccuracy: 92,
      },
      {
        id: "sym-brackets",
        title: "Brackets & braces",
        description: "()[]{} — the code essentials",
        keys: [],
        wordCount: 30,
        passAccuracy: 92,
      },
      {
        id: "sym-mixed",
        title: "Mixed everything",
        description: "Digits, symbols, words — full chaos",
        keys: [],
        wordCount: 40,
        passAccuracy: 94,
      },
    ],
  },
]

// ── Progression ──────────────────────────────────────────────────────────────

const PROGRESS_KEY = "vk-course-progress"

export interface CourseProgress {
  /** lessonId → best accuracy achieved (lesson is complete if ≥ passAccuracy) */
  best: Record<string, number>
}

export function readCourseProgress(): CourseProgress {
  if (typeof window === "undefined") return { best: {} }
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return { best: {} }
    const parsed = JSON.parse(raw) as CourseProgress
    return parsed && typeof parsed.best === "object"
      ? { best: parsed.best }
      : { best: {} }
  } catch {
    return { best: {} }
  }
}

export function recordLessonResult(
  lessonId: string,
  accuracy: number
): CourseProgress {
  const progress = readCourseProgress()
  const prev = progress.best[lessonId]
  if (prev === undefined || accuracy > prev) {
    progress.best[lessonId] = accuracy
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  }
  return progress
}

export function isLessonComplete(
  lesson: CourseLesson,
  progress: CourseProgress
): boolean {
  return (progress.best[lesson.id] ?? 0) >= lesson.passAccuracy
}

/** A lesson is unlocked when the previous one in the course is complete
 * (the first lesson of each course is always unlocked). */
export function isLessonUnlocked(
  course: Course,
  lessonIndex: number,
  progress: CourseProgress
): boolean {
  if (lessonIndex === 0) return true
  return isLessonComplete(course.lessons[lessonIndex - 1], progress)
}

export function courseCompletion(course: Course, progress: CourseProgress) {
  const done = course.lessons.filter((l) =>
    isLessonComplete(l, progress)
  ).length
  return { done, total: course.lessons.length }
}
