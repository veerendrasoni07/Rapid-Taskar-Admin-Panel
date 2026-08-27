import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function KPICard({ title, value, icon: Icon, trend, className }: KPICardProps) {
  return (
    <div className={twMerge(clsx("bg-surface rounded-lg p-6 border border-border shadow-sm", className))}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-secondary">{title}</p>
        <div className="p-2 bg-primary/10 rounded-md">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-x-2">
        <p className="text-2xl font-semibold text-text">{value}</p>
        {trend && (
          <p
            className={clsx(
              "text-sm font-medium",
              trend.isPositive ? "text-success" : "text-error"
            )}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </p>
        )}
      </div>
    </div>
  );
}
