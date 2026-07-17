"use client"

import { forwardRef, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"

const corners = [
  { id: "tl", position: "-top-[3px] -left-[3px]", border: "border-t border-l" },
  { id: "tr", position: "-top-[3px] -right-[3px]", border: "border-t border-r" },
  { id: "bl", position: "-bottom-[3px] -left-[3px]", border: "border-b border-l" },
  { id: "br", position: "-bottom-[3px] -right-[3px]", border: "border-b border-r" },
] as const

export const CornerBrackets = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CornerBrackets({ children, className, ...props }, ref) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const showBrackets = isHovered || isFocusWithin

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={() => setIsFocusWithin(false)}
      {...props}
    >
      <AnimatePresence>
        {showBrackets && (
          <>
            <motion.span
              className="pointer-events-none absolute -inset-[3px] border border-dashed border-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            />
            {corners.map(({ id, position, border }) => (
              <motion.span
                key={id}
                className={cn(
                  "pointer-events-none absolute h-[5px] w-[5px] border-foreground",
                  position,
                  border,
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
      {children}
    </div>
  )
})

CornerBrackets.displayName = "CornerBrackets"
