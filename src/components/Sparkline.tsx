import { useLayoutEffect, useRef, useState } from 'react';

/** Courbe miniature sans axes : la tendance, pas la mesure. */
export default function Sparkline({
  data,
  color = '#C25E38',
  width = 88,
  height = 26,
  fill = true,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  if (data.length < 2) return <svg width={width} height={height} aria-hidden="true" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - 2 - ((v - min) / range) * (height - 4)] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      {fill && <polygon points={area} fill={color} opacity={0.12} />}
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.2} fill={color} />
    </svg>
  );
}

/** Texte long qui défile quand il ne tient pas — jamais coupé par des points de suspension. */
export function Ticker({ text, className = '' }: { text: string; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const over = (inner.current?.scrollWidth ?? 0) - (box.current?.clientWidth ?? 0);
      setShift(over > 4 ? over : 0);
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' && box.current ? new ResizeObserver(measure) : null;
    if (ro && box.current) ro.observe(box.current);
    return () => ro?.disconnect();
  }, [text]);
  return (
    <span ref={box} className={`ticker ${className}`} title={text} data-overflow={shift ? '1' : '0'} style={{ ['--ticker-shift' as string]: `-${shift}px` }}>
      <span ref={inner} className="ticker-inner">
        {text}
      </span>
    </span>
  );
}
