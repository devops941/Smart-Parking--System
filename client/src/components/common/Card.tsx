import React, { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  hoverEffect?: boolean;
}

export const Card = ({
  children,
  header,
  footer,
  hoverEffect = false,
  className,
  ...props
}: CardProps) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-xl border border-slate-200/90 shadow-xs transition-all duration-150',
          hoverEffect && 'hover:border-slate-300 hover:shadow-sm',
          className
        )
      )}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          {header}
        </div>
      )}
      <div className="p-5">{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};
