"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import {
  IconArrowLeft,
  IconLock,
  IconCheck,
  IconRotate,
  IconBook,
} from "@tabler/icons-react"
import {
  COURSES,
  readCourseProgress,
  isLessonComplete,
  isLessonUnlocked,
  courseCompletion,
  buildLessonWords,
  type Course,
  type CourseLesson,
  type CourseProgress,
} from "@/lib/courses"
import { CornerBrackets } from "@/components/corner-brackets"
import { cn } from "@/lib/utils"

/**
 * Hands the chosen lesson's drill words to the typing engine on the home
 * page via the shared chrome ref (same pipeline as Practice Dashboard),
 * then navigates home so the session starts immediately.
 */
function useLessonLauncher() {
  const router = useRouter()
  return (lesson: CourseLesson) => {
    const words = buildLessonWords(lesson)
    sessionStorage.setItem(
      "vk-lesson-pending",
      JSON.stringify({ lessonId: lesson.id, words })
    )
    // Consumed by the typing engine when this run finishes, to record the
    // accuracy against the lesson's pass threshold.
    sessionStorage.setItem("vk-lesson-active", lesson.id)
    router.push("/")
  }
}

export default function CoursesPage() {
  const [progress, setProgress] = useState<CourseProgress | null>(null)
  const startLesson = useLessonLauncher()

  useEffect(() => {
    queueMicrotask(() => setProgress(readCourseProgress()))
  }, [])

  const courses = useMemo(() => COURSES, [])

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-4"
      >
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft size={16} />
          Back
        </Link>
        <h1 className="font-mono text-xl font-bold tracking-tight text-foreground">
          Typing Courses
        </h1>
      </motion.div>

      {progress === null ? (
        <div className="py-20 text-center font-mono text-sm text-muted-foreground">
          Loading courses…
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {courses.map((course, ci) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={progress}
              index={ci}
              onStartLesson={startLesson}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CourseCard({
  course,
  progress,
  index,
  onStartLesson,
}: {
  course: Course
  progress: CourseProgress
  index: number
  onStartLesson: (lesson: CourseLesson) => void
}) {
  const { done, total } = courseCompletion(course, progress)
  const allDone = done === total

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-base font-bold text-foreground">
            <IconBook size={16} className="text-primary" />
            {course.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {course.description}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-xs tabular-nums",
            allDone ? "text-emerald-500" : "text-muted-foreground"
          )}
        >
          {done}/{total}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {course.lessons.map((lesson, li) => {
          const complete = isLessonComplete(lesson, progress)
          const unlocked = isLessonUnlocked(course, li, progress)
          const best = progress.best[lesson.id]
          return (
            <button
              key={lesson.id}
              type="button"
              disabled={!unlocked}
              onClick={() => onStartLesson(lesson)}
              className={cn(
                "group flex cursor-pointer items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors",
                complete
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : unlocked
                    ? "border-border bg-muted/10 hover:border-primary/40 hover:bg-muted/30"
                    : "cursor-not-allowed border-border/40 bg-muted/5 opacity-50"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {li + 1}. {lesson.title}
                  </span>
                  {complete && (
                    <IconCheck
                      size={14}
                      className="shrink-0 text-emerald-500"
                    />
                  )}
                  {!unlocked && (
                    <IconLock
                      size={12}
                      className="shrink-0 text-muted-foreground"
                    />
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {lesson.description}
                </p>
                {best !== undefined && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
                    best {best}% · pass {lesson.passAccuracy}%
                  </p>
                )}
              </div>
              <CornerBrackets className="shrink-0">
                <span
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 font-mono text-[10px] uppercase",
                    complete
                      ? "text-emerald-500"
                      : unlocked
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                >
                  {complete ? (
                    <>
                      <IconRotate size={10} />
                      redo
                    </>
                  ) : unlocked ? (
                    "start"
                  ) : (
                    "locked"
                  )}
                </span>
              </CornerBrackets>
            </button>
          )
        })}
      </div>
    </motion.section>
  )
}
