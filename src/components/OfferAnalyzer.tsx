import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Lock, Sparkles, AlertTriangle, RefreshCw, Copy, Check, ChevronDown, ChevronUp, BadgeIndianRupee, TrendingUp, Mail, Phone } from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface Props { user: User | null; onUpgradeTrigger: () => void; }

export function OfferAnalyzer({ user, onUpgradeTrigger }: Props) {
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [offerText, setOfferText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeNegTab, setActiveNegTab] = useState<'email' | 'script'>('email');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const isPremium = user?.plan === 'paid';
  const loadingMessages = ['Reading your offer letter...', 'Calculating in-hand...', 'Generating negotiation script...'];

  useEffect(() => {
    if (isPremium) loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.getOfferAnalyses();
      setHistory(res.analyses || []);
    } catch {}
  };

  const handleAnalyze = async () => {
    setError(null);
    if (offerText.length < 100) { setError('Offer letter text must be at least 100 characters.'); return; }
    if (!role || !company || !location) { setError('Role, company, and location are required.'); return; }

    try {
      setLoading(true);
      let msgIdx = 0;
      const msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % loadingMessages.length;
        setLoadingMsg(loadingMessages[msgIdx]);
      }, 3000);
      setLoadingMsg(loadingMessages[0]);

      const res = await api.analyzeOffer({ offerText, role, company, location, experienceYears });
      clearInterval(msgInterval);
      setResult(res);
      setLoadingMsg('');
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
            <Lock className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-white">Offer Letter Analyzer</h2>
          <p className="text-xs text-gray-400 mt-2 max-w-md mx-auto">67% of Indian professionals accept the first offer. This tool helps you negotiate the other 33% outcome.</p>
          <button onClick={onUpgradeTrigger} className="mt-6 px-6 py-3 bg-gradient-to-r from-accent-primary to-orange-500 text-white font-bold text-xs rounded-xl shadow-lg hover:opacity-90 transition">
            <Sparkles className="w-4 h-4 inline mr-2" />Upgrade to Pro — ₹799
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Offer Letter Analyzer</h2>
        <p className="text-xs text-gray-400 mt-1">Decode your CTC. Know your market value. Negotiate with data.</p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="Role title (e.g. SDE II)" className="bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary" />
        <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" className="bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary" />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City (e.g. Bangalore)" className="bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary" />
        <div className="flex items-center gap-2 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5">
          <span className="text-[10px] text-gray-400 font-mono">Experience (years):</span>
          <input type="number" min={0} max={40} value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))} className="bg-transparent text-xs text-white w-16 focus:outline-none" />
        </div>
      </div>

      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-3">
        <h3 className="font-display font-semibold text-sm text-white">Offer Letter Text</h3>
        <textarea value={offerText} onChange={e => setOfferText(e.target.value)} placeholder="Paste your complete offer letter here. Include all salary components, allowances, and any terms mentioned." className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-300 focus:outline-none focus:border-accent-primary" style={{ minHeight: '200px' }} />
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-6 py-3 bg-accent-primary hover:bg-orange-600 text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          {loading ? loadingMsg : 'Analyze Offer Letter'}
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4">
            <h3 className="font-display font-bold text-white">CTC Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead><tr className="border-b border-brand-border/60 text-gray-500"><th className="pb-2">Component</th><th className="pb-2 text-right">Annual</th><th className="pb-2 text-right">Monthly</th></tr></thead>
                <tbody className="divide-y divide-brand-border/40">
                  {[
                    ['Gross Annual CTC', result.ctc_breakdown?.gross_annual_ctc || result.gross_annual_ctc],
                    ['Basic Salary', result.ctc_breakdown?.basic_salary_annual || result.basic_salary_annual],
                    ['HRA', result.ctc_breakdown?.hra_annual || result.hra_annual],
                    ['Variable Pay', result.ctc_breakdown?.variable_pay_annual || result.variable_pay_annual],
                    ['Special Allowance', result.ctc_breakdown?.special_allowance_annual || result.special_allowance_annual],
                    ['PF (Employer)', result.ctc_breakdown?.pf_employer_annual || result.pf_employer_annual],
                    ['Gratuity', result.ctc_breakdown?.gratuity_annual || result.gratuity_annual],
                    ['Other Benefits', result.ctc_breakdown?.other_benefits_annual || result.other_benefits_annual],
                  ].map(([label, amount]: any) => (
                    <tr key={label} className={label === 'Variable Pay' && (result.variable_percentage > 35) ? 'bg-yellow-950/20' : ''}>
                      <td className="py-2.5 text-gray-300">{label}</td>
                      <td className="py-2.5 text-right font-mono text-white">₹{Number(amount).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right font-mono text-gray-400">₹{Math.round(Number(amount) / 12).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-[10px] text-gray-400 font-mono">Estimated In-Hand Monthly</p>
              <p className="text-2xl font-black text-white font-mono">₹{Number(result.in_hand_monthly_estimate || 0).toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-500 mt-1">Estimate based on standard deductions and new tax regime.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-surface p-5 rounded-2xl border border-red-500/20 space-y-3">
              <h3 className="font-display font-bold text-xs text-red-400 uppercase">Red Flags</h3>
              {result.red_flags?.length > 0 ? result.red_flags.map((f: string, i: number) => (
                <div key={i} className="bg-red-950/20 border border-red-500/10 rounded-lg p-3 text-xs text-red-300">{f}</div>
              )) : <p className="text-xs text-emerald-400">No major red flags detected</p>}
            </div>
            <div className="bg-brand-surface p-5 rounded-2xl border border-emerald-500/20 space-y-3">
              <h3 className="font-display font-bold text-xs text-emerald-400 uppercase">Positives</h3>
              {result.positive_points?.length > 0 ? result.positive_points.map((p: string, i: number) => (
                <div key={i} className="bg-emerald-950/20 border border-emerald-500/10 rounded-lg p-3 text-xs text-emerald-300">{p}</div>
              )) : <p className="text-xs text-gray-400">None highlighted</p>}
            </div>
          </div>

          <div className="bg-brand-surface p-5 rounded-2xl border border-indigo-500/20 space-y-4 text-center">
            <div className={`inline-block px-6 py-3 rounded-2xl text-lg font-black font-mono ${
              result.market_comparison === 'above_market' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
              result.market_comparison === 'below_market' ? 'bg-red-950/40 text-red-400 border border-red-500/20' :
              'bg-yellow-950/40 text-yellow-400 border border-yellow-500/20'
            }`}>
              {result.market_comparison === 'above_market' ? 'Above Market' : result.market_comparison === 'below_market' ? 'Below Market' : 'At Market'}
            </div>
            <p className="text-xs text-gray-400">Negotiation Room: <span className="text-white font-semibold capitalize">{result.negotiation_room}</span></p>
            {(result.negotiation_room === 'medium' || result.negotiation_room === 'high') && (
              <p className="text-sm text-white font-semibold">Consider asking for <span className="text-accent-primary">₹{Number(result.recommended_ask_ctc || 0).toLocaleString('en-IN')} LPA</span></p>
            )}
          </div>

          <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border space-y-4">
            <div className="flex gap-2 border-b border-brand-border/40 pb-3">
              <button onClick={() => setActiveNegTab('email')} className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${activeNegTab === 'email' ? 'bg-accent-primary text-white' : 'text-gray-400 hover:text-white'}`}><Mail className="w-3 h-3 inline mr-1" />Email</button>
              <button onClick={() => setActiveNegTab('script')} className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${activeNegTab === 'script' ? 'bg-accent-primary text-white' : 'text-gray-400 hover:text-white'}`}><Phone className="w-3 h-3 inline mr-1" />Verbal Script</button>
            </div>
            {activeNegTab === 'email' ? (
              <div className="relative">
                <textarea readOnly value={result.negotiation_email || ''} className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-200 leading-relaxed" style={{ minHeight: '180px' }} />
                <button onClick={() => copyText(result.negotiation_email)} className="absolute top-2 right-2 p-2 bg-brand-bg border border-brand-border rounded-lg text-gray-400 hover:text-white transition">
                  {copied === result.negotiation_email ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="relative bg-brand-bg border border-brand-border rounded-xl p-4">
                <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{result.negotiation_verbal_script || ''}</p>
                <button onClick={() => copyText(result.negotiation_verbal_script)} className="absolute top-2 right-2 p-2 bg-brand-bg border border-brand-border rounded-lg text-gray-400 hover:text-white transition">
                  {copied === result.negotiation_verbal_script ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <p className="text-[10px] text-gray-500 mt-3">Customize with your specific skills and achievements before sending.</p>
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
              <button onClick={() => setExpandedHistory(expandedHistory === item.id ? null : item.id)} className="w-full px-4 py-3 flex items-center justify-between text-xs text-gray-300 hover:bg-brand-bg/40">
                <span>{item.role} @ {item.company}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500">{new Date(item.created_at).toLocaleDateString()}</span>
                  {expandedHistory === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
