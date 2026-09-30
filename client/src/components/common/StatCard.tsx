import React, { ReactNode } from 'react';
import { clsx } from 'clsx';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  badge?: ReactNode;
  highlightColor?: 'default' | 'teal' | 'green' | 'red' | 'amber' | 'slate';
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-teal-50 text-teal-700',
  trend,
  badge,
}: StatCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-black/5', iconBgColor)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900">{value}</span>
          {badge && <span>{badge}</span>}
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
        {trend && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px]">
            <span className={clsx('font-bold px-1.5 py-0.5 rounded', trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
              {trend.value}
            </span>
            <span className="text-slate-400">{trend.label || 'vs last week'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
