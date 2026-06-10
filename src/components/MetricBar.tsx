import React from 'react';

interface MetricBarProps {
  label: string;
  score: number;
  max: number;
  colorClass?: string;
}

export function MetricBar({ label, score, max, colorClass = 'bg-indigo-500' }: MetricBarProps) {
  const percentage = Math.min(100, Math.round((score / max) * 100));
  const displayColor = colorClass || (
    percentage >= 80 ? 'bg-emerald-500' :
    percentage >= 60 ? 'bg-indigo-500' :
    percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-gray-400 font-medium truncate mr-2">{label}</span>
        <span className="text-xs font-semibold text-white font-mono shrink-0">{score}/{max}</span>
      </div>
      <div className="w-full h-2 bg-brand-border/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${displayColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
