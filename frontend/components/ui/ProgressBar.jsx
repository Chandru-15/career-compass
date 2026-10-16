import React from 'react';
import { cn } from '@/lib/utils';

export function ProgressBar({ value, max = 100, className, showLabel = false, color = 'teal' }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorClasses = {
    teal: 'from-teal-400 to-teal-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    orange: 'from-orange-400 to-orange-600',
    red: 'from-red-400 to-red-600',
    purple: 'from-purple-400 to-purple-600',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 mt-1 text-right">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}