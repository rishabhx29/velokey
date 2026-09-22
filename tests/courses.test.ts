// ── Course progression logic tests ───────────────────────────────────────────
// Covers the pure gating functions (isLessonComplete, isLessonUnlocked,
// courseCompletion) and lesson word generation from lib/courses.ts. A wrong
// unlock rule here would silently gate or expose lessons for users.

import { describe, expect, it } from "vitest"
import {
  COURSES,
  buildLessonWords,
  courseCompletion,
  isLessonComplete,
  isLessonUnlocked,
  type CourseLesson,
  type CourseProgress,
} from "@/lib/courses"

const progressWith = (best: Record<string, number>): CourseProgress => ({
  best,
})

const foundations = COURSES[0]
const accuracyLab = COURSES[1]

describe("course data integrity", () => {
  it("has unique lesson ids across all courses", () => {
    const ids = COURSES.flatMap((c) => c.lessons.map((l) => l.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("gives every lesson a positive word count and a sane pass threshold", () => {
    for (const course of COURSES) {
      for (const lesson of course.lessons) {
        expect(lesson.wordCount).toBeGreaterThan(0)
        expect(lesson.passAccuracy).toBeGreaterThan(0)
        expect(lesson.passAccuracy).toBeLessThanOrEqual(100)
      }
    }
  })

  it("ships at least one course whose first lesson is startable", () => {
    expect(COURSES.length).toBeGreaterThan(0)
    for (const course of COURSES) {
      expect(course.lessons.length).toBeGreaterThan(0)
    }
  })
})

describe("isLessonComplete", () => {
  const lesson = foundations.lessons[0] // passAccuracy: 90

  it("is incomplete when no attempt was recorded", () => {
    expect(isLessonComplete(lesson, progressWith({}))).toBe(false)
  })

  it("is incomplete just below the pass threshold", () => {
    expect(isLessonComplete(lesson, progressWith({ "home-asdf": 89 }))).toBe(
      false
    )
  })

  it("is complete exactly at the pass threshold", () => {
    expect(isLessonComplete(lesson, progressWith({ "home-asdf": 90 }))).toBe(
      true
    )
  })

  it("is complete above the pass threshold", () => {
    expect(isLessonComplete(lesson, progressWith({ "home-asdf": 100 }))).toBe(
      true
    )
  })
})

describe("isLessonUnlocked", () => {
  it("always unlocks the first lesson, even with zero progress", () => {
    expect(isLessonUnlocked(foundations, 0, progressWith({}))).toBe(true)
  })

  it("locks the second lesson behind the first", () => {
    expect(isLessonUnlocked(foundations, 1, progressWith({}))).toBe(false)
  })

  it("unlocks the second lesson once the first is passed exactly at threshold", () => {
    const progress = progressWith({ "home-asdf": 90 })
    expect(isLessonUnlocked(foundations, 1, progress)).toBe(true)
  })

  it("keeps the second lesson locked when the first was attempted but failed", () => {
    const progress = progressWith({ "home-asdf": 42 })
    expect(isLessonUnlocked(foundations, 1, progress)).toBe(false)
  })

  it("chains: passing lesson 1 alone does not unlock lesson 3", () => {
    const progress = progressWith({ "home-asdf": 95 })
    expect(isLessonUnlocked(foundations, 2, progress)).toBe(false)
  })

  it("chains: passing lessons 1 and 2 unlocks lesson 3", () => {
    const progress = progressWith({ "home-asdf": 95, "home-jkl": 90 })
    expect(isLessonUnlocked(foundations, 2, progress)).toBe(true)
  })

  it("uses each course's own thresholds, not a global one", () => {
    // accuracyLab lesson 0 requires 98 — 90 must not complete it.
    const progress = progressWith({ "acc-common": 90 })
    expect(isLessonUnlocked(accuracyLab, 1, progress)).toBe(false)
    expect(
      isLessonUnlocked(accuracyLab, 1, progressWith({ "acc-common": 98 }))
    ).toBe(true)
  })
})

describe("courseCompletion", () => {
  it("counts nothing done with empty progress", () => {
    expect(courseCompletion(foundations, progressWith({}))).toEqual({
      done: 0,
      total: 6,
    })
  })

  it("counts only lessons that meet their own thresholds", () => {
    const progress = progressWith({
      "home-asdf": 95, // pass 90 → done
      "home-jkl": 10, // pass 90 → not done
      "home-blend": 92, // pass 92 → done
    })
    expect(courseCompletion(foundations, progress)).toEqual({
      done: 2,
      total: 6,
    })
  })

  it("counts everything done when all thresholds are met", () => {
    const best = Object.fromEntries(
      foundations.lessons.map((l) => [l.id, l.passAccuracy])
    )
    expect(courseCompletion(foundations, progressWith(best))).toEqual({
      done: 6,
      total: 6,
    })
  })
})

describe("buildLessonWords", () => {
  it("returns exactly wordCount non-empty words for key lessons", () => {
    const lesson = foundations.lessons[0] // keys a/s/d/f, 25 words
    const words = buildLessonWords(lesson)
    expect(words).toHaveLength(25)
    for (const word of words) {
      expect(word.length).toBeGreaterThan(0)
    }
  })

  it("returns exactly wordCount words for key-less (general) lessons", () => {
    const lesson = accuracyLab.lessons[0] // keys: [], 40 words
    const words = buildLessonWords(lesson)
    expect(words).toHaveLength(40)
  })

  it("drills multi-key lessons using only the lesson's keys", () => {
    const lesson = foundations.lessons[1] // keys j/k/l, 25 words → ≥8 drills
    const words = buildLessonWords(lesson)
    const drills = words.filter((w) => /^[jkl]+$/.test(w))
    expect(drills.length).toBeGreaterThanOrEqual(8)
  })

  it("drills solo-key lessons with pure repetition of that key", () => {
    const lesson: CourseLesson = {
      id: "test-solo",
      title: "Solo",
      description: "",
      keys: ["a"],
      wordCount: 10,
      passAccuracy: 90,
    }
    const words = buildLessonWords(lesson)
    expect(words).toContain("aaaaaa") // 6-char drill of pure 'a'
  })
})
