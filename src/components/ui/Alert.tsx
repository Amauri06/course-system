import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  title
}) => {
  const configs = {
    info: {
      styles: 'bg-sky-50 border-sky-100 text-sky-800',
      icon: <Info className="w-5 h-5 text-sky-600 shrink-0" />
    },
    success: {
      styles: 'bg-emerald-50 border-emerald-100 text-emerald-800',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
    },
    warning: {
      styles: 'bg-amber-50 border-amber-100 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
    },
    danger: {
      styles: 'bg-rose-50 border-rose-100 text-rose-800',
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
    }
  };

  const current = configs[variant];

  return (
    <div className={`flex gap-3 p-4 border rounded-xl ${current.styles}`}>
      {current.icon}
      <div className="flex flex-col gap-0.5">
        {title && <h4 className="text-sm font-bold tracking-tight">{title}</h4>}
        <div className="text-xs font-medium leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

export default Alert;
