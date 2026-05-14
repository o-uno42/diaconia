import type { ReactNode } from 'react';

type BadgeColor = 'indigo' | 'emerald' | 'amber' | 'red' | 'sky' | 'gray' | 'purple' | 'violet';

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}

const colorMap: Record<BadgeColor, string> = {
  indigo: 'bg-indigo-500/40 text-indigo-700 border-indigo-500/60',
  emerald: 'bg-emerald-500/40 text-emerald-700 border-emerald-500/60',
  amber: 'bg-amber-500/40 text-amber-700 border-amber-500/60',
  red: 'bg-red-500/40 text-red-700 border-red-500/60',
  sky: 'bg-sky-500/40 text-sky-700 border-sky-500/60',
  gray: 'bg-stone-300/50 text-stone-800 border-stone-400/60',
  purple: 'bg-purple-500/40 text-purple-700 border-purple-500/60',
  violet: 'bg-violet-500/40 text-violet-700 border-violet-500/60',
};

export default function Badge({ color = 'indigo', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
}
