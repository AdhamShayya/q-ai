import { useEffect, useState } from "react";

// ── Animated number counter ──────────────────────────────────
export function AnimatedCounter({
  target,
  suffix = "",
  inView,
  duration = 1800,
}: {
  target: number;
  suffix?: string;
  inView: boolean;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (inView === false) {
      return;
    }
    let current = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return (
    <span>
      {count >= 1000 ? count.toLocaleString() : count}
      {suffix}
    </span>
  );
}
