import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-soft transition-all duration-300 ${
        hoverEffect ? 'hover:shadow-glass-hover hover:-translate-y-0.5 hover:border-healthcare-200 dark:hover:border-healthcare-800 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
