import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, AlertTriangle, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Linkedin, UserCheck } from 'lucide-react';
import { Resume, User, TrackKey } from '../types';
import { api } from '../api';
import { TRACK_DETAILS } from '../constants';

interface Props { resumes: Resume[]; user: User | null; onUpgradeTrigger: () => void; }

export function LinkedInGenerator({ resumes, user, onUpgradeTrigger }: Props) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '');
  const [selectedTrack, setSelectedTrack] = useState<TrackKey>('naukri');
  const [currentHeadline, setCurrentHeadline] = useState('');
  const [currentAbout, setCurrentAbout] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedHeadlineIdx, setSelectedHeadlineIdx] = useState<number>(0);
  const [showFirstLines, setShowFirstLines] = useState(false);
  const [checklist, setChecklist] = useState<Array<{item:string;impact:string;done:boolean}>>([]);
  const [history, setHistory] = useState<any[]>([]);

  const isPremium = user?.plan === 'paid';

  useEffect(() => {
    if (isPremium) loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getLinkedInProfiles();
      setHistory(res.profiles || []);
    } catch {}
  };

  const handleGenerate = async () => {
    setError(null);
    if (!selectedResumeId) { setError('Please select a resume.'); return; }

    try {
      setLoading(true);
      const res = await api.generateLinkedIn({
        resumeId: selectedResumeId,
        track: selectedTrack,
        currentHeadline: currentHeadline || undefined,
        currentAbout: currentAbout || undefined
      });
      setResult(res);
      setChecklist(res.completeness_checklist || []);
      setSelectedHeadlineIdx(0);
      loadHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllSkills = () => {
    if (result?.skills_to_add) {
      navigator.clipboard.writeText(result.skills_to_add.join(', '));
      setCopied('all_skills');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const toggleChecklistItem = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  };

  const completionPercent = checklist.length > 0 ? Math.round((checklist.filter(c => c.done).length / checklist.length) * 100) : 0;

  if (!isPremium) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Linkedin className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white">LinkedIn Profile Generator</h2>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">Complete LinkedIn profiles are 40x more likely to receive recruiter InMail. This tool generates your exact headline and About section in 30 seconds.</p>
          <button onClick={onUpgradeTrigger} className="mt-6 px-6 py-3 bg-gradient-to-r from-accent-primary to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition">
            Upgrade to Pro — ₹799
          </button>
        </div>
      </motion.div>
    );
  }

  const trackOptions = Object.values(TRACK_DETAILS);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">LinkedIn Profile Generator</h2>
        <p className="text-xs text-gray-400 mt-1">Generate headlines, About section, and skills list calibrated for Indian recruiter search patterns.</p>
      </div>

      {error && <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">{error}</div>}

      <div className="space-y-5">
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
          <h3 className="font-display font-semibold text-sm text-white">1. Select Resume</h3>
          <select value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)} className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary">
            <option value="">-- Select a resume --</option>
            {resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
          <h3 className="font-display font-semibold text-sm text-white">2. Track</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {trackOptions.map(track => (
              <div key={track.key} onClick={() => setSelectedTrack(track.key)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTrack === track.key ? 'border-accent-primary bg-orange-950/20' : 'border-brand-border/60 hover:bg-brand-bg'}`}>
                <h4 className="text-xs font-bold text-white">{track.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1">{track.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
          <h3 className="font-display font-semibold text-sm text-white">3. Current Profile (Optional)</h3>
          <input value={currentHeadline} onChange={e => setCurrentHeadline(e.target.value)} placeholder="Your current LinkedIn headline (optional)" className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary" />
          <textarea value={currentAbout} onChange={e => setCurrentAbout(e.target.value)} placeholder="Paste your current About section to get improvement tips (optional)" className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-300 focus:outline-none focus:border-accent-primary" style={{ minHeight: '100px' }} />
          <button onClick={handleGenerate} disabled={loading} className="px-6 py-3 bg-accent-primary hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 flex items-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate LinkedIn Profile'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-4">
            <h3 className="font-display font-bold text-sm text-white">Headlines</h3>
            <div className="space-y-3">
              {result.headlines?.map((h: string, i: number) => (
                <div key={i} onClick={() => setSelectedHeadlineIdx(i)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedHeadlineIdx === i ? 'border-accent-primary bg-orange-950/10' : 'border-brand-border/60 hover:bg-brand-bg'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-white font-semibold leading-relaxed">{h}</p>
                    <button onClick={(e) => { e.stopPropagation(); copyText(h); }} className="p-1.5 bg-brand-bg border border-brand-border rounded-lg text-gray-400 hover:text-white shrink-0">
                      {copied === h ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{h.length} / 120 chars</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
            <h3 className="font-display font-bold text-sm text-white">About Section</h3>
            <div className="relative">
              <textarea readOnly value={result.about_section || ''} className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-200 leading-relaxed" style={{ minHeight: '150px' }} />
              <button onClick={() => copyText(result.about_section)} className="absolute top-2 right-2 p-2 bg-brand-bg border border-brand-border rounded-lg text-gray-400 hover:text-white transition">
                {copied === result.about_section ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-500">{(result.about_section || '').length} / 2000 characters</p>
            <button onClick={() => setShowFirstLines(!showFirstLines)} className="text-[10px] text-accent-primary hover:underline flex items-center gap-1">
              {showFirstLines ? 'Hide' : 'Show'} first 2 lines preview
            </button>
            {showFirstLines && (
              <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-3">
                <p className="text-xs text-gray-400">{(result.about_section || '').slice(0, 300)}...</p>
              </div>
            )}
          </div>

          <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white">Skills to Add</h3>
              <button onClick={copyAllSkills} className="px-3 py-1.5 text-[10px] font-semibold bg-brand-border/80 hover:bg-brand-border text-white rounded-lg transition flex items-center gap-1">
                {copied === 'all_skills' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                Copy all 15
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.skills_to_add?.map((s: string, i: number) => (
                <div key={i} className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-bg border border-brand-border rounded-lg">
                  <span className="text-[10px] text-gray-300">{s}</span>
                  <button onClick={() => copyText(s)} className="text-gray-500 hover:text-white">
                    {copied === s ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white">Completeness Checklist</h3>
              <span className="text-xs font-mono text-white font-bold">{completionPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <div key={i} onClick={() => toggleChecklistItem(i)} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${item.done ? 'bg-emerald-950/10 border-emerald-500/20' : item.impact === 'high' ? 'bg-brand-bg/40 border-emerald-500/10' : 'bg-brand-bg/20 border-brand-border/60'}`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'}`}>
                    {item.done && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-xs text-gray-200">{item.item}</p>
                    <span className={`text-[9px] font-mono font-bold uppercase ${item.impact === 'high' ? 'text-emerald-400' : 'text-gray-500'}`}>{item.impact} impact</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border">
          <h3 className="font-display font-semibold text-sm text-white mb-3">History</h3>
          {history.slice(0, 3).map((item: any) => (
            <div key={item.id} className="border border-brand-border/60 rounded-xl p-3 mb-2 text-xs text-gray-400 flex items-center justify-between">
              <span>Generated {new Date(item.created_at).toLocaleDateString()}</span>
              <button onClick={() => copyText(item.about_section || item.headlines?.[0] || '')} className="text-accent-primary hover:underline">Copy</button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
