import React from 'react';

interface LoaderProps {
  variant?: 'spinner' | 'skeleton';
  rows?: number;
}

export const Loader: React.FC<LoaderProps> = ({
  variant = 'spinner',
  rows = 3
}) => {
  if (variant === 'skeleton') {
    return (
      <div className="w-full flex flex-col gap-4 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="w-full flex flex-col gap-2">
            <div className="h-4 bg-slate-200 rounded-md w-1/3" />
            <div className="h-9 bg-slate-100 rounded-xl w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-4 border-slate-200 border-t-brand-600 animate-spin" />
        <span className="text-xs font-semibold text-slate-400">Procesando...</span>
      </div>
    </div>
  );
};

export default Loader;
