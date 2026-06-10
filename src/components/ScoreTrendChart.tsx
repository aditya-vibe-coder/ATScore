import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Analysis, Resume } from '../types';

interface ScoreTrendChartProps {
  analyses: Analysis[];
  resumes: Resume[];
  linkedResumes: Record<string, string[]>;
}

export function ScoreTrendChart({ analyses, resumes, linkedResumes }: ScoreTrendChartProps) {
  if (analyses.length === 0) {
    return null;
  }

  // Sort analyses by date
  const sorted = [...analyses].sort((a, b) => a.created_at - b.created_at);

  // Build chart data
  const chartData = sorted.map(a => ({
    date: new Date(a.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    score: a.total_score,
    name: a.resume_name?.substring(0, 20) || 'Resume',
    track: a.track,
  }));

  // Calculate average
  const avgScore = Math.round(sorted.reduce((sum, a) => sum + a.total_score, 0) / sorted.length);

  return (
    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 hover-glow transition-all duration-300">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-display font-bold text-lg text-white">Score Trend Progression</h3>
          <p className="text-xs text-gray-400">Track how your resume score evolves across versions.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-gray-500 font-mono">AVERAGE</span>
          <p className="text-lg font-black text-white font-mono">{avgScore}</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />
            <ReferenceLine
              y={75}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: 'Target',
                fill: '#10b981',
                fontSize: 10,
                position: 'right',
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: '#818cf8' }}
              name="ATS Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {analyses.length >= 2 && (
        <div className="border-t border-brand-border/40 pt-3 flex justify-between text-xs text-gray-400 font-mono">
          <span>📈 Trend: {
            sorted[sorted.length - 1].total_score > sorted[0].total_score
              ? `Improving (+${sorted[sorted.length - 1].total_score - sorted[0].total_score} pts)`
              : sorted[sorted.length - 1].total_score < sorted[0].total_score
              ? `Declining (${sorted[sorted.length - 1].total_score - sorted[0].total_score} pts)`
              : 'Stable (no change)'
          }</span>
          <span>{sorted.length} data points</span>
        </div>
      )}
    </div>
  );
}
