/**
 * useAnimatedNumber — smoothly animates a number from 0 to target value.
 * Used for loan limit, risk score, etc.
 */

import { useState, useEffect, useRef } from "react";

export function useAnimatedNumber(target, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;

    const timeout = setTimeout(() => {
      const start = performance.now();
      const startValue = 0;

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(startValue + (target - startValue) * eased));

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick);
        }
      }

      frameRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, delay]);

  return value;
}
