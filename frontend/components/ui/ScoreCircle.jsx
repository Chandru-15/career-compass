import React from 'react';
import { cn } from '@/lib/utils';

export function ScoreCircle({ score, size = 'md', label, className }) {
  // Handle NaN, null, undefined, or invalid scores
  const safeScore = isNaN(score) || score === null || score === undefined ? 0 : Number(score);
  const percentage = Math.min(Math.max(safeScore, 0), 100);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };

  const textClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const getColor = () => {
    if (percentage >= 80) return { stroke: '#14b8a6', bg: 'from-teal-50 to-teal-100' };
    if (percentage >= 60) return { stroke: '#3b82f6', bg: 'from-blue-50 to-blue-100' };
    if (percentage >= 40) return { stroke: '#f59e0b', bg: 'from-amber-50 to-amber-100' };
    return { stroke: '#ef4444', bg: 'from-red-50 to-red-100' };
  };

  const colors = getColor();

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className={cn('relative', sizeClasses[size])}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', textClasses[size])} style={{ color: colors.stroke }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {label && <p className="text-sm text-slate-600 mt-2 font-medium">{label}</p>}
    </div>
  );
}