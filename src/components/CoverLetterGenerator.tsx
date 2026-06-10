import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Copy, Download, Check, AlertTriangle, RefreshCw, Sparkles, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Resume, User, CoverLetterRecord, TrackKey } from '../types';
import { api } from '../api';
import { TRACK_DETAILS } from '../constants';

interface Props {
  resumes: Resume[];
  user: User | null;
  onUpgradeTrigger: () => void;
}

export function CoverLetterGenerator({ resumes, user, onUpgradeTrigger }: Props) {
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackKey>('naukri');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [history, setHistory] = useState<CoverLetterRecord[]>([]);
  const [usageToday, setUsageToday] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getCoverLetters();
      setHistory(res.cover_letters || []);
      const today = new Date().toISOString().split('T')[0];
      setUsageToday((res.cover_letters || []).filter((c: CoverLetterRecord) => c.created_at.startsWith(today)).length);
    } catch {}
  };

  const handleGenerate = async () => {
    setError(null);
    if (!selectedResumeId) { setError('Please select a resume.'); return; }
    if (jobDescription.length < 50) { setError('Job description must be at least 50 characters.'); return; }
    if (!selectedTrack) { setError('Please select a track.'); return; }

    if (user?.plan !== 'paid' && usageToday >= 2) {
      setError('Daily limit reached. Upgrade to Pro for unlimited cover letters.');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await api.generateCoverLetter({
        resumeId: selectedResumeId,
        jdText: jobDescription,
        track: selectedTrack
      });
      setGeneratedLetter(res.cover_letter);
      setWordCount(res.word_count);
      loadHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (generatedLetter) {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedLetter) {
      const blob = new Blob([generatedLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover-letter.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const trackOptions = Object.values(TRACK_DETAILS);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Cover Letter Generator</h2>
        <p className="text-xs text-gray-400 mt-1">India-calibrated. One minute. Ready to send.</p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
          {(error.includes('limit') || error.includes('Upgrade')) && (
            <button onClick={onUpgradeTrigger} className="ml-auto px-3 py-1 bg-accent-primary rounded-lg text-white font-semibold text-[10px]">Upgrade</button>
          )}
        </div>
      )}

      {user?.plan !== 'paid' && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-3 text-xs text-gray-400 flex items-center justify-between">
          <span>{usageToday} of 2 free cover letters used today.</span>
          <button onClick={onUpgradeTrigger} className="text-accent-primary font-semibold hover:underline">Upgrade for unlimited</button>
        </div>
      )}

      <div className="space-y-5">
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
          <h3 className="font-display font-semibold text-sm text-white">1. Select Resume</h3>
          <select
            value={selectedResumeId}
            onChange={e => setSelectedResumeId(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
          >
            <option value="">-- Select a resume --</option>
            {resumes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
          <h3 className="font-display font-semibold text-sm text-white">2. Job Description</h3>
          <textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value.slice(0, 3000))}
            placeholder="Paste the full job description here..."
            className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-300 focus:outline-none focus:border-accent-primary"
            style={{ minHeight: '120px' }}
          />
          <div className="text-right text-[10px] text-gray-500 font-mono">{jobDescription.length} / 3000</div>
        </div>

        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
          <h3 className="font-display font-semibold text-sm text-white">3. Target Track</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {trackOptions.map(track => (
              <div
                key={track.key}
                onClick={() => setSelectedTrack(track.key)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTrack === track.key ? 'border-accent-primary bg-orange-950/20' : 'border-brand-border/60 hover:bg-brand-bg'
                }`}
              >
                <h4 className="text-xs font-bold text-white">{track.name}</h4>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{track.description}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedResumeId}
          className="w-full py-3 text-xs font-semibold rounded-xl text-white bg-accent-primary shadow-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? 'Generating your cover letter...' : 'Generate Cover Letter'}
        </button>
      </div>

      {generatedLetter && (
        <div className="bg-brand-surface p-6 rounded-2xl border border-accent-primary/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-white">Your Cover Letter</h3>
            <span className="px-2 py-0.5 bg-brand-bg border border-brand-border rounded-lg text-[10px] text-gray-400 font-mono">{wordCount} words</span>
          </div>

          <textarea
            readOnly
            value={generatedLetter}
            className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-200 leading-relaxed"
            style={{ minHeight: '200px' }}
          />

          <div className="flex gap-3">
            <button onClick={handleCopy} className="px-4 py-2 text-xs font-semibold bg-brand-border/80 hover:bg-brand-border text-white rounded-xl transition flex items-center gap-2">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
            <button onClick={handleDownload} className="px-4 py-2 text-xs font-semibold bg-brand-border/80 hover:bg-brand-border text-white rounded-xl transition flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download as .txt
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-semibold bg-accent-primary hover:bg-orange-600 text-white rounded-xl transition flex items-center gap-2 ml-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Another
            </button>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
          <h3 className="font-display font-semibold text-sm text-white">History</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="border border-brand-border/60 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs text-gray-300 hover:bg-brand-bg/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-accent-primary shrink-0" />
                    <span className="truncate max-w-[200px]">{item.jd_snippet}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                    {expandedHistory === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </button>
                {expandedHistory === item.id && (
                  <div className="px-4 pb-4 border-t border-brand-border/40 pt-3">
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{item.cover_letter}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
