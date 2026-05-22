import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md'
}) => {
  const variants = {
    primary: 'bg-brand-50 text-brand-700 border-brand-100',
    secondary: 'bg-slate-50 text-slate-600 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    danger: 'bg-rose-50 text-rose-700 border-rose-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    info: 'bg-sky-50 text-sky-700 border-sky-100',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wide font-bold uppercase border',
    md: 'px-2.5 py-1 text-xs tracking-wide font-bold uppercase border',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-sans ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

export default Badge;
