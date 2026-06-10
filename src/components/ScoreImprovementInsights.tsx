import React from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, ArrowUp, Lightbulb } from 'lucide-react';
import { Analysis } from '../types';

interface ScoreImprovementInsightsProps {
  analyses: Analysis[];
}

export function ScoreImprovementInsights({ analyses }: ScoreImprovementInsightsProps) {
  if (analyses.length === 0) return null;

  const sorted = [...analyses].sort((a, b) => b.created_at - a.created_at);
  const latest = sorted[0];
  const previous = sorted[1];

  // Collect top recommendations from the latest analysis
  const criticalRecs = latest.recommendations?.filter(r => r.priority === 'CRITICAL') || [];
  const highRecs = latest.recommendations?.filter(r => r.priority === 'HIGH') || [];

  // Calculate improvement if there's a previous analysis
  const scoreDiff = previous ? latest.total_score - previous.total_score : null;
  const isImproving = scoreDiff !== null && scoreDiff > 0;

  // Identify weakest area
  const areas = [
    { name: 'Formatting', score: latest.format_score, max: 20 },
    { name: 'Sections', score: latest.sections_score, max: 20 },
    { name: 'Keywords', score: latest.keywords_score, max: 30 },
    { name: 'India Alignment', score: latest.india_score, max: 30 },
  ];
  const weakest = areas.reduce((min, a) => a.score / a.max < min.score / min.max ? a : min, areas[0]);

  return (
    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-5 hover-glow transition-all duration-300">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="font-display font-bold text-lg text-white">
          {isImproving ? 'You\'re Improving! 🚀' : 'Improvement Insights'}
        </h3>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Score trend */}
        <div className={`p-4 rounded-xl border ${isImproving ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-brand-bg/40 border-brand-border'}`}>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <TrendingUp className={`w-4 h-4 ${isImproving ? 'text-emerald-400' : 'text-gray-500'}`} />
            Score Trend
          </div>
          <p className={`text-lg font-bold font-mono mt-1 ${isImproving ? 'text-emerald-400' : 'text-gray-300'}`}>
            {scoreDiff !== null ? `${scoreDiff > 0 ? '+' : ''}${scoreDiff} pts` : 'Baseline'}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {previous ? `From ${previous.total_score} to ${latest.total_score}` : 'First analysis'}
          </p>
        </div>

        {/* Weakest area */}
        <div className="p-4 rounded-xl bg-brand-bg/40 border border-brand-border">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Weakest Area
          </div>
          <p className="text-lg font-bold font-mono mt-1 text-yellow-400">{weakest.name}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {weakest.score}/{weakest.max} ({Math.round((weakest.score / weakest.max) * 100)}%)
          </p>
        </div>

        {/* Top priority actions */}
        <div className="p-4 rounded-xl bg-brand-bg/40 border border-brand-border">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
            <ArrowUp className="w-4 h-4 text-indigo-400" />
            Actions Needed
          </div>
          <p className="text-lg font-bold font-mono mt-1 text-indigo-400">
            {criticalRecs.length + highRecs.length}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {criticalRecs.length} critical, {highRecs.length} high priority
          </p>
        </div>
      </div>

      {/* Priority recommendations list */}
      {(criticalRecs.length > 0 || highRecs.length > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-300 font-display">Top Priority Actions</h4>
          <div className="space-y-1.5">
            {criticalRecs.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-red-950/20 border border-red-500/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-red-400 font-bold font-mono">CRITICAL</span>
                  <p className="text-xs text-gray-300 mt-0.5">{rec.action}</p>
                </div>
              </div>
            ))}
            {highRecs.slice(0, 3).map((rec, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 bg-orange-950/20 border border-orange-500/10 rounded-lg">
                <ArrowUp className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-orange-400 font-bold font-mono">HIGH</span>
                  <p className="text-xs text-gray-300 mt-0.5">{rec.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* India-specific positives */}
      {latest.score_breakdown?.india?.positives && latest.score_breakdown.india.positives.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-300 font-display">✅ What's Working Well (India-Specific)</h4>
          <div className="space-y-1.5">
            {latest.score_breakdown.india.positives.slice(0, 3).map((p, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-emerald-950/10 border border-emerald-500/10 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
