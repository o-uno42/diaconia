import type { ReactNode } from 'react';

type BadgeColor = 'indigo' | 'emerald' | 'amber' | 'red' | 'sky' | 'gray' | 'purple';

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  className?: string;
}

const colorMap: Record<BadgeColor, string> = {
  indigo: 'bg-accent-500/20 text-accent-300 border-accent-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  red: 'bg-red-500/20 text-red-300 border-red-500/30',
  sky: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  gray: 'bg-white/10 text-white/70 border-white/20',
  purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function Badge({ color = 'indigo', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
}
