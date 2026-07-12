"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  direction?: Direction;
  once?: boolean;
  margin?: string;
  className?: string;
  as?: "div" | "section" | "header" | "article" | "li" | "span";
};

const EASE = [0.22, 1, 0.36, 1] as const;

function offsets(direction: Direction, y: number, x: number) {
  switch (direction) {
    case "up":
      return { x: 0, y };
    case "down":
      return { x: 0, y: -y };
    case "left":
      return { x, y: 0 };
    case "right":
      return { x: -x, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export function Reveal({
  children,
  delay = 0,
  duration = 0.7,
  y = 24,
  x = 24,
  direction = "up",
  once = true,
  margin = "-80px",
  className,
  as = "div",
}: RevealProps) {
  const off = offsets(direction, y, x);
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      initial={{ opacity: 0, ...off }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

type StaggerProps = {
  children: ReactNode;
  delay?: number;
  stagger?: number;
  className?: string;
  once?: boolean;
  margin?: string;
};

const containerVariants: Variants = {
  hidden: {},
  show: ({ stagger, delay }: { stagger: number; delay: number }) => ({
    transition: { staggerChildren: stagger, delayChildren: delay },
  }),
};

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function Stagger({
  children,
  delay = 0,
  stagger = 0.08,
  className,
  once = true,
  margin = "-80px",
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin }}
      variants={containerVariants}
      custom={{ stagger, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={revealItemVariants} className={className}>
      {children}
    </motion.div>
  );
}
