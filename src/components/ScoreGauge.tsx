import React from 'react';

interface ScoreGaugeProps {
  score: number;
  grade: string;
}

export function ScoreGauge({ score, grade }: ScoreGaugeProps) {
  const circumference = 2 * Math.PI * 60; // r=60
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return { stroke: '#10b981', hex: '#10b981' };
    if (score >= 67) return { stroke: '#3b82f6', hex: '#3b82f6' };
    if (score >= 52) return { stroke: '#f59e0b', hex: '#f59e0b' };
    if (score >= 38) return { stroke: '#f97316', hex: '#f97316' };
    return { stroke: '#f43f5e', hex: '#f43f5e' };
  };

  const color = getColor();

  const getGradeColor = () => {
    if (grade === 'A') return 'text-emerald-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      {/* Background circle */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r="60"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-brand-border/30"
        />
      </svg>

      {/* Score circle */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r="60"
          fill="none"
          stroke={color.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 8px ${color.hex}40)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="text-center z-10">
        <span className="block text-3xl font-black text-white font-mono tracking-tight">
          {score}
        </span>
        <span className={`block text-lg font-bold font-display ${getGradeColor()}`}>
          Grade {grade}
        </span>
        <span className="block text-[10px] text-gray-500 font-mono mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}
