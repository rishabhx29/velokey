import { useEffect } from "react";

/**
 * Escape hatch for one-time external sync on mount.
 * Good for: DOM integration (focus, scroll), third-party widget lifecycles,
 * browser API subscriptions, singleton event listeners.
 *
 * Wraps useEffect with an empty dependency array to make intent explicit.
 * Do NOT use this for derived state, data fetching, or event-driven actions —
 * those have better replacements per the no-useEffect rule.
 */
export function useMountEffect(effect: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}
