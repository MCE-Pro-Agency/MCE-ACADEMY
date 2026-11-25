import { useEffect, useState } from 'react';

// Fait défiler le nombre contenu dans `value` (« +50 », « +20 ans »…) quand `start` devient vrai.
export default function CountUp({ value, start, duration = 1600 }) {
  const match = String(value).match(/^(\D*)(\d+)(.*)$/);
  const target = match ? Number(match[2]) : 0;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!match || !start) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setCurrent(target); return undefined; }
    let frame;
    const begin = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - begin) / duration, 1);
      setCurrent(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!match) return value;
  return (
    <>
      <span aria-hidden="true">{match[1]}{current}{match[3]}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}
