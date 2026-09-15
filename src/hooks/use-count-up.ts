import { useState, useEffect, useRef } from "react";

export function useCountUp(endValue: number, durationMs: number = 1500) {
  // If endValue is already non-zero at mount (cached data), initialise to it
  // so we never flash "0+" even for a single frame.
  const [value, setValue] = useState(() => (endValue > 0 ? endValue : 0));

  // Track whether we have *completed* an animation (not just started one).
  const hasCompleted = useRef(endValue > 0);
  const prevEndValue = useRef(endValue);

  useEffect(() => {
    // Nothing to animate yet — data hasn't loaded.
    if (endValue === 0) {
      return;
    }

    // If the animation already completed once, just snap to any new value
    // (handles background React Query refetches).
    if (hasCompleted.current) {
      if (prevEndValue.current !== endValue) {
        setValue(endValue);
        prevEndValue.current = endValue;
      }
      return;
    }

    // First time we have a real value — animate from 0 to endValue.
    prevEndValue.current = endValue;

    let startTime: number | null = null;
    let animationFrameId: number;
    let completed = false;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / durationMs, 1);

      // Ease-out cubic formula for smooth deceleration
      const easeOut = 1 - Math.pow(1 - percentage, 3);

      setValue(Math.floor(easeOut * endValue));

      if (percentage < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setValue(endValue);
        completed = true;
        hasCompleted.current = true;
      }
    };

    // Start from 0 for the animation
    setValue(0);
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      // If the effect is torn down before the animation finishes
      // (e.g. Strict Mode double-mount), snap to the final value so the
      // next effect invocation sees hasCompleted = true and the UI never
      // shows a stale 0.
      if (!completed) {
        setValue(endValue);
        hasCompleted.current = true;
      }
    };
  }, [endValue, durationMs]);

  return value;
}
