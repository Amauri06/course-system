import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  noPadding = false,
  hoverable = false
}) => {
  return (
    <div
      className={`bg-white border border-slate-100 rounded-2xl shadow-xs transition-all duration-300 ${
        hoverable ? 'hover:shadow-md hover:-translate-y-1' : ''
      } ${className}`}
    >
      {/* Card Header */}
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/20">
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-800 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 rounded-b-2xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
