import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, AlertTriangle, RefreshCw, Copy, Check, ChevronDown, ChevronUp, Wand2, FileText } from 'lucide-react';
import { Resume, User, TrackKey, TailoredResumeResult } from '../types';
import { api } from '../api';
import { TRACK_DETAILS } from '../constants';

interface Props { resumes: Resume[]; user: User | null; onUpgradeTrigger: () => void; }

export function ResumeTailor({ resumes, user, onUpgradeTrigger }: Props) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '');
  const [jdText, setJdText] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackKey>('naukri');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [result, setResult] = useState<TailoredResumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'experience' | 'full'>('summary');
  const [history, setHistory] = useState<any[]>([]);
  const [tailorsToday, setTailorsToday] = useState(0);

  const isPremium = user?.plan === 'paid';
  const loadingMessages = ['Reading your resume...', 'Analyzing the JD requirements...', 'Matching keywords...', 'Rewriting your bullets...'];

  useEffect(() => {
    if (isPremium) {
      loadHistory();
    }
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getTailoredResumes();
      setHistory(res.tailored_resumes || []);
      const today = new Date().toISOString().split('T')[0];
      setTailorsToday((res.tailored_resumes || []).filter((t: any) => t.created_at?.startsWith(today)).length);
    } catch {}
  };

  const handleTailor = async () => {
    setError(null);
    if (!selectedResumeId) { setError('Please select a resume.'); return; }
    if (jdText.length < 80) { setError('Job description must be at least 80 characters.'); return; }

    try {
      setLoading(true);
      let msgIdx = 0;
      const msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % loadingMessages.length;
        setLoadingMsg(loadingMessages[msgIdx]);
      }, 3000);
      setLoadingMsg(loadingMessages[0]);

      const res = await api.tailorResume({ resumeId: selectedResumeId, jdText, track: selectedTrack });
      clearInterval(msgInterval);
      setResult(res);
      loadHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isPremium) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white">Resume JD Tailor</h2>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">Tailoring your resume per JD is the single highest-impact thing you can do before applying. One-click. Premium only.</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Resume JD Tailor</h2>
          <p className="text-xs text-gray-400 mt-1">Tailor your resume to maximize ATS keyword match for any job description.</p>
        </div>
        <span className="px-3 py-1.5 bg-brand-bg border border-brand-border rounded-lg text-[10px] text-gray-400 font-mono">{tailorsToday}/5 used today</span>
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
          <h3 className="font-display font-semibold text-sm text-white">3. Job Description</h3>
          <textarea value={jdText} onChange={e => setJdText(e.target.value)} placeholder="Paste the full job description" className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-300 focus:outline-none focus:border-accent-primary" style={{ minHeight: '150px' }} />
          <button onClick={handleTailor} disabled={loading} className="px-6 py-3 bg-accent-primary hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 flex items-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? loadingMsg : 'Tailor Resume'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-4">
            <div className="flex gap-2 border-b border-brand-border/40 pb-3 overflow-x-auto">
              {(['summary', 'experience', 'full'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition ${activeTab === tab ? 'bg-accent-primary text-white' : 'text-gray-400 hover:text-white'}`}>
                  {tab === 'summary' ? 'Summary & Skills' : tab === 'experience' ? 'Experience' : 'Full Resume'}
                </button>
              ))}
            </div>

            {activeTab === 'summary' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-4">
                  <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-2">Tailored Summary</h4>
                  <p className="text-xs text-gray-200 leading-relaxed">{result.professional_summary}</p>
                  <div className="mt-3">
                    <h5 className="text-[10px] font-mono text-gray-500 uppercase mb-1">Skills</h5>
                    <div className="flex flex-wrap gap-1">
                      {result.skills?.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-bg border border-brand-border text-gray-300">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-4">
                  <h4 className="text-[10px] font-mono text-gray-500 uppercase mb-2">Added Keywords</h4>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {result.added_keywords?.map((kw, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-500/20">{kw}</span>
                    ))}
                  </div>
                  {result.estimated_score_improvement > 0 && (
                    <div className="bg-accent-primary/10 border border-accent-primary/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-accent-primary font-bold">+{result.estimated_score_improvement} ATS points estimated</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-3">
                {Object.entries(result.experience_bullets || {}).map(([company_, bullets]) => (
                  <div key={company_} className="bg-brand-bg/40 border border-brand-border rounded-xl p-4">
                    <h4 className="text-xs font-bold text-white mb-2">{company_}</h4>
                    <ul className="space-y-1">
                      {(bullets as string[]).map((b, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-emerald-400 shrink-0">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'full' && (
              <div className="relative">
                <textarea readOnly value={result.full_tailored_text || ''} className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-200 leading-relaxed" style={{ minHeight: '300px' }} />
                <div className="flex gap-2 mt-3">
                  <button onClick={() => copyText(result.full_tailored_text)} className="px-4 py-2 text-xs font-semibold bg-brand-border/80 hover:bg-brand-border text-white rounded-xl transition flex items-center gap-2">
                    {copied === result.full_tailored_text ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    Copy
                  </button>
                  <button onClick={() => { const blob = new Blob([result.full_tailored_text], {type:'text/plain'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tailored-resume.txt'; a.click(); }} className="px-4 py-2 text-xs font-semibold bg-brand-border/80 hover:bg-brand-border text-white rounded-xl transition flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Download .txt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border">
          <h3 className="font-display font-semibold text-sm text-white mb-3">History</h3>
          {history.slice(0, 5).map((item: any) => (
            <div key={item.id} className="border border-brand-border/60 rounded-xl overflow-hidden mb-2">
              <button onClick={() => setCopied(copied === item.id ? null : item.id)} className="w-full px-4 py-3 flex items-center justify-between text-xs text-gray-300 hover:bg-brand-bg/40">
                <span className="truncate max-w-[200px]">{item.jd_snippet}</span>
                <span className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
