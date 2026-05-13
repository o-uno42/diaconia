import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({ children, header, footer, className = '', hover, onClick }: CardProps) {
  return (
    <div
      className={`glass-card overflow-hidden ${hover ? 'hover:bg-white/10 hover:shadow-glass-lg hover:-translate-y-0.5 cursor-pointer' : ''} transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      {header && <div className="px-6 py-4 border-b border-white/10">{header}</div>}
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-4 border-t border-white/10">{footer}</div>}
    </div>
  );
}
