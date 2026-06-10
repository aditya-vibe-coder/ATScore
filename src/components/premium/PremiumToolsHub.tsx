import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Copy, 
  Lock, 
  ShieldAlert, 
  Building2, 
  Calendar, 
  MapPin, 
  BadgeIndianRupee, 
  GraduationCap, 
  ChevronDown, 
  Briefcase, 
  UserCheck, 
  HelpCircle, 
  Zap, 
  Plus, 
  X,
  Target,
  RefreshCw,
  TrendingUp,
  Cpu,
  Mail,
  Share2,
  FileText
} from 'lucide-react';
import { Resume, User } from '../../types';
import { api } from '../../api';

interface PremiumToolsHubProps {
  resumes: Resume[];
  authToken: string;
  user: User | null;
  onUpgradeTrigger: () => void;
}

type PremiumTab = 'jdMatch' | 'star' | 'gcc' | 'interview' | 'injector' | 'comp' | 'pitch' | 'socialSEO';

export function PremiumToolsHub({ resumes, authToken, user, onUpgradeTrigger }: PremiumToolsHubProps) {
  const [activeTab, setActiveTab] = useState<PremiumTab>('jdMatch');
  const [selectedResumeId, setSelectedResumeId] = useState<string>(resumes[0]?.id || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorString, setErrorString] = useState<string>('');
  const [successString, setSuccessString] = useState<string>('');

  const isPremium = user?.plan === 'paid';

  // 1. STAR Rewrite states
  const [starInput, setStarInput] = useState<string>('Led the cloud migration of our back-end server databases for scaling inventory.');
  const [starResult, setStarResult] = useState<any>(null);

  // 2. GCC Alignment states
  const [gccResult, setGccResult] = useState<any>(null);

  // 3. Interview Prep states
  const [interviewJd, setInterviewJd] = useState<string>('Candidate must have solid experience with high-throughput microservices, distributed system designs, gRPC APIs, and zero-downtime deployment in high scale cloud clusters.');
  const [interviewTrack, setInterviewTrack] = useState<string>('Software Engineer');
  const [interviewResult, setInterviewResult] = useState<any>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // 4. Keyword Injector states
  const [keywordInput, setKeywordInput] = useState<string>('Kubernetes, Docker, AWS, System Design');
  const [keywordResult, setKeywordResult] = useState<any>(null);

  // 5. Tier & Comp states
  const [compResult, setCompResult] = useState<any>(null);

  // 6. Referral Pitch states
  const [pitchCompany, setPitchCompany] = useState<string>('Goldman Sachs Bengaluru');
  const [pitchTitle, setPitchTitle] = useState<string>('Senior Software Engineer - Distributed Systems');
  const [pitchResult, setPitchResult] = useState<any>(null);

  // 7. Social / Naukri SEO states
  const [socialResult, setSocialResult] = useState<any>(null);

  // 8. Interactive JD Match states
  const [jdMatchInput, setJdMatchInput] = useState<string>('Candidate should have experience building scalable TypeScript backends, Express APIs, Google Cloud Platform deployments, and responsive React web portals with robust schema validations.');
  const [jdMatchResult, setJdMatchResult] = useState<any>(null);

  // 9. Interactive Notice Period Simulator states
  const [noticeDurationSim, setNoticeDurationSim] = useState<string>('90');
  const [resignedStatusSim, setResignedStatusSim] = useState<string>('serving');

  // 10. Interactive Salary negotiation states
  const [offeredCtcSim, setOfferedCtcSim] = useState<number>(14);
  const [desiredCtcSim, setDesiredCtcSim] = useState<number>(18);
  const [competingOfferSim, setCompetingOfferSim] = useState<string>('yes_similar');

  // Clipboard copy utility
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setSuccessString('Copied value to clipboard!');
    setTimeout(() => {
      setCopiedText(null);
      setSuccessString('');
    }, 2500);
  };

  // Safe fetch helper for custom premium endpoints
  const callPremiumApi = async (endpoint: string, payload: any) => {
    if (!isPremium) {
      setErrorString('UPGRADE_REQUIRED: This action is a premium feature.');
      return null;
    }
    setLoading(true);
    setErrorString('');
    setSuccessString('');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute premium calculation.');
      }
      return data;
    } catch (err: any) {
      setErrorString(err.message || 'Server connection error.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Execution triggers
  const handleStarRewrite = async () => {
    if (!isPremium) return;
    if (!starInput.trim()) {
      setErrorString('Please specify a bullet point to rewrite.');
      return;
    }
    const currentResumeText = '';
    const result = await callPremiumApi('/api/premium/star-rewrite', {
      bulletText: starInput,
      resumeText: currentResumeText,
      track: 'Software Engineer',
      jdText: interviewJd
    });
    if (result) {
      setStarResult(result);
      setSuccessString('Resume bullet calibrated successfully via STAR model!');
    }
  };

  const handleGccAlignment = async () => {
    if (!isPremium) return;
    if (!selectedResumeId) {
      setErrorString('Please select a parsed resume first.');
      return;
    }
    const result = await callPremiumApi('/api/premium/gcc-alignment', {
      resumeId: selectedResumeId
    });
    if (result) {
      setGccResult(result);
      setSuccessString('GCC Alignment Scoring and Notice tricks calculated!');
    }
  };

  const handleInterviewPrep = async () => {
    if (!isPremium) return;
    if (!selectedResumeId) {
      setErrorString('Please select a parsed resume first.');
      return;
    }
    setLoading(true);
    setErrorString('');
    setSuccessString('');
    try {
      const result = await api.premiumInterviewPrep({
        resumeId: selectedResumeId,
        jdText: interviewJd,
        track: interviewTrack
      });
      if (result) {
        setInterviewResult(result);
        if (result.questions && result.questions.length > 0) {
          setActiveQuestionId(result.questions[0].id);
        }
        setSuccessString('Custom Interview Prep Board generated!');
      }
    } catch (err: any) {
      setErrorString(err.message || 'Failed to generate interview questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordInjector = async () => {
    if (!isPremium) return;
    if (!selectedResumeId) {
      setErrorString('Please select a parsed resume first.');
      return;
    }
    const keywordsList = keywordInput
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    if (keywordsList.length === 0) {
      setErrorString('Please provide at least one missing keyword.');
      return;
    }

    const result = await callPremiumApi('/api/premium/keyword-injector', {
      resumeId: selectedResumeId,
      keywords: keywordsList
    });
    if (result) {
      setKeywordResult(result);
      setSuccessString('Natural keyword injection points discovered!');
    }
  };

  const handleTierComp = async () => {
    if (!isPremium) return;
    if (!selectedResumeId) {
      setErrorString('Please select a parsed resume first.');
      return;
    }
    const result = await callPremiumApi('/api/premium/tier-comp-analyzer', {
      resumeId: selectedResumeId
    });
    if (result) {
      setCompResult(result);
      setSuccessString('Academic tier and market CTC predicted!');
    }
  };

  const handleReferralPitch = async () => {
    if (!isPremium) return;
    if (!selectedResumeId) {
      setErrorString('Please select a parsed resume first.');
      return;
    }
    if (!pitchCompany.trim() || !pitchTitle.trim()) {
      setErrorString('Please fill out the target company and designation fields.');
      return;
    }
    const result = await callPremiumApi('/api/premium/referral-pitch', {
      resumeId: selectedResumeId,
      targetCompany: pitchCompany,
      targetJobTitle: pitchTitle
    });
    if (result) {
      setPitchResult(result);
      setSuccessString('Personalized referral pitches compiled successfully!');
    }
  };

  const handleSocialOptimize = async () => {
    if (!isPremium) return;
    if (!selectedResumeId) {
      setErrorString('Please select a parsed resume first.');
      return;
    }
    const result = await callPremiumApi('/api/premium/social-optimize', {
      resumeId: selectedResumeId
    });
    if (result) {
      setSocialResult(result);
      setSuccessString('Naukri SEO index optimizations resolved!');
    }
  };

  const handleJdMatchSandbox = async () => {
    if (!isPremium) return;
    if (!selectedResumeId) {
      setErrorString('Please select a parsed resume first.');
      return;
    }
    if (!jdMatchInput.trim()) {
      setErrorString('Please paste a target Job Description first.');
      return;
    }
    const result = await callPremiumApi('/api/premium/jd-match-sandbox', {
      resumeId: selectedResumeId,
      jdText: jdMatchInput
    });
    if (result) {
      setJdMatchResult(result);
      setSuccessString('Deep comparative JD match sandbox analyzed successfully!');
    }
  };

  return (
    <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden hover-grow transition-all duration-300" id="premium-tools-hub-container">
      {/* Premium Hub Header banner */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-[#0f172a] to-brand-surface p-6 border-b border-brand-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold font-mono tracking-wider text-[10px] px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shrink-0">
              <Zap className="w-2.5 h-2.5 animate-bounce fill-current" />
              PRO PRESET PLATFORM
            </span>
            <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black px-2 py-0.5 rounded-md font-sans uppercase">
              PRO MODULE
            </span>
          </div>
          <h2 className="font-display font-bold text-xl text-white mt-1.5 flex items-center gap-2">
            Premium AI Suite & Career Optimization
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl">
            Access elite monetization modules to optimize resumes for GCCs, target Indian job portals, bypass notice locks, and draft tailored referral pitches.
          </p>
        </div>

        {/* Global File Selector */}
        {resumes.length > 0 && (
          <div className="bg-brand-bg/55 border border-brand-border/60 rounded-xl px-3 py-1.5 flex items-center gap-2 focus-within:border-indigo-500 transition duration-200">
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wide">ACTIVE DOC:</span>
            <select
              value={selectedResumeId}
              onChange={(e) => {
                setSelectedResumeId(e.target.value);
                // Invalidate old results
                setGccResult(null);
                setInterviewResult(null);
                setKeywordResult(null);
                setCompResult(null);
                setPitchResult(null);
                setSocialResult(null);
                setJdMatchResult(null);
              }}
              className="bg-transparent border-0 text-xs font-semibold text-white focus:outline-none cursor-pointer"
              id="premium-doc-selector"
            >
              {resumes.map(r => (
                <option key={r.id} value={r.id} className="bg-[#0f172a]">
                  {r.name.length > 25 ? `${r.name.slice(0, 22)}...` : r.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {resumes.length === 0 ? (
        <div className="p-8 text-center bg-brand-bg/10">
          <ShieldAlert className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <h4 className="font-display font-semibold text-white">Resume Document Required</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Please upload at least one .pdf or .docx resume document in the scanner panel above first to unlock this premium suite.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row min-h-[550px]">
          {/* Sub Navigation Tabs List */}
          <div className="w-full md:w-64 bg-brand-bg/20 md:border-r border-brand-border flex flex-col justify-between shrink-0">
            <div className="p-3.5 space-y-1">
              <button
                onClick={() => { setActiveTab('jdMatch'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'jdMatch'
                    ? 'bg-gradient-to-r from-indigo-600/15 to-purple-600/15 border-l-2 border-indigo-500 text-white font-black'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Target className="w-4 h-4 text-purple-400 animate-pulse" />
                JD Match Sandbox
              </button>

              <button
                onClick={() => { setActiveTab('star'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'star'
                    ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-white font-bold'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                STAR Bullet Rewriter
              </button>

              <button
                onClick={() => { setActiveTab('gcc'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'gcc'
                    ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-white font-bold'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-400" />
                GCC & Notice Alignment
              </button>

              <button
                onClick={() => { setActiveTab('interview'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'interview'
                    ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-white font-bold'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Target className="w-4 h-4 text-indigo-400" />
                Interview Prep Board
              </button>

              <button
                onClick={() => { setActiveTab('injector'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'injector'
                    ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-white font-bold'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Cpu className="w-4 h-4 text-indigo-400" />
                ATS Keyword Injector
              </button>

              <button
                onClick={() => { setActiveTab('comp'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'comp'
                    ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-white font-bold'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <BadgeIndianRupee className="w-4 h-4 text-indigo-400" />
                University Tier & CTC Predictor
              </button>

              <button
                onClick={() => { setActiveTab('pitch'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'pitch'
                    ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-white font-bold'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4 text-indigo-400" />
                Referral & Referral Pitches
              </button>

              <button
                onClick={() => { setActiveTab('socialSEO'); setErrorString(''); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                  activeTab === 'socialSEO'
                    ? 'bg-indigo-600/10 border-l-2 border-indigo-500 text-white font-bold'
                    : 'text-gray-400 hover:bg-brand-surface hover:text-white'
                }`}
              >
                <Share2 className="w-4 h-4 text-indigo-400" />
                Naukri Profile Optimizer
              </button>
            </div>

            {/* Sidebar Pricing Conversion Callout */}
            {!isPremium && (
              <div className="p-4 border-t border-indigo-500/15 bg-indigo-950/20 m-3 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Premium locked
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Get certified scoreboards, interview prep cards, notice period modifiers, and high response pitch templates.
                </p>
                <button
                  onClick={onUpgradeTrigger}
                  className="w-full py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-[10px] rounded-lg shadow transition cursor-pointer"
                >
                  Upgrade to Pro ₹79/mo or ₹799/yr
                </button>
              </div>
            )}
          </div>

          {/* Active Area Viewport */}
          <div className="flex-1 p-6 relative">
            {/* Status alerts */}
            {errorString && (
              <div className="mb-4 bg-red-950/40 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium">
                ⚠️ {errorString}
              </div>
            )}
            {successString && (
              <div className="mb-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs font-bold font-mono">
                ✓ {successString}
              </div>
            )}

            {/* UPGRADE TEASER OVERLAY (If user is not paid, we let them view forms but execute button shows an elegant blocker or triggers upgrade) */}
            {!isPremium && (
              <div className="mb-6 bg-gradient-to-b from-indigo-950/30 to-transparent border border-indigo-500/15 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    Sandbox Preview Mode Active
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                    You are exploring the premium suite layout. Upgrading with Razorpay immediately executes these active AI models on your actual resume document. 
                  </p>
                </div>
                <button
                  onClick={onUpgradeTrigger}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-950 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Unlock Full Access Now
                </button>
              </div>
            )}

            {/* 0. INTERACTIVE TARGET JD MATCH SANDBOX */}
            {activeTab === 'jdMatch' && (
              <div className="space-y-5" id="view-jd-match-sandbox">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5 font-bold">
                    🎯 Interactive Job Description (JD) Match Sandbox
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Paste any custom target role description here to test direct alignment score and unlock tailored compliance feedback.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">Target Job Description (JD)</label>
                  <textarea
                    value={jdMatchInput}
                    onChange={(e) => setJdMatchInput(e.target.value)}
                    rows={4}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed text-left"
                    placeholder="Paste the target JD here..."
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-500 font-mono">Quick sandbox roles:</span>
                    <button 
                      onClick={() => setJdMatchInput("We are looking for a Senior Frontend Engineer specialized in React, TypeScript, Tailwind styles, and micro-frontend architectures with state persistence.")}
                      className="text-[9px] font-mono text-indigo-400 hover:underline border border-indigo-500/15 rounded-md px-1.5 py-0.5 bg-brand-bg cursor-pointer"
                    >
                      Senior React Dev
                    </button>
                    <button 
                      onClick={() => setJdMatchInput("Seeking a Backend Developer with robust Experience in Node Express systems, PostgreSQL transactions, Redis cache, Docker setups, and Google Cloud platform routing.")}
                      className="text-[9px] font-mono text-indigo-400 hover:underline border border-indigo-500/15 rounded-md px-1.5 py-0.5 bg-brand-bg cursor-pointer"
                    >
                      Node Express / GCP Backend
                    </button>
                  </div>
                </div>

                <button
                  onClick={isPremium ? handleJdMatchSandbox : onUpgradeTrigger}
                  disabled={loading}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
                  {loading ? 'Simulating alignment models...' : isPremium ? 'Calculate JD Match Alignment' : 'Unlock Match Sandbox'}
                </button>

                {/* Comparative Report results */}
                <AnimatePresence mode="wait">
                  {jdMatchResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border-t border-brand-border/40 pt-5 space-y-5"
                    >
                      {/* Interactive Scoreboard Block */}
                      <div className="bg-[#0b0f1d] border border-indigo-500/20 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6">
                        {/* Radial Indicator */}
                        <div className="relative w-24 h-24 flex items-center justify-center rounded-full bg-indigo-950/40 border border-indigo-500/15 shrink-0">
                          <span className={`text-2xl font-black font-mono ${jdMatchResult.matchScore >= 80 ? 'text-emerald-400' : jdMatchResult.matchScore >= 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
                            {jdMatchResult.matchScore}%
                          </span>
                          <svg className="absolute inset-0 w-24 h-24 -rotate-90">
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              className="text-brand-border/20"
                            />
                            <circle
                              cx="48"
                              cy="48"
                              r="42"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray="264"
                              strokeDashoffset={264 - (264 * jdMatchResult.matchScore) / 100}
                              className={`${jdMatchResult.matchScore >= 80 ? 'text-emerald-500' : jdMatchResult.matchScore >= 60 ? 'text-yellow-500' : 'text-orange-500'} transition-all duration-1000`}
                            />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">ATS Alignment Scorecard</span>
                          <h4 className="text-sm font-semibold text-white">
                            {jdMatchResult.matchScore >= 80 ? 'High Alignment (Excellent Fit)' : jdMatchResult.matchScore >= 60 ? 'Moderate Alignment (Viable candidate with adjustments)' : 'Weak Alignment (Deficit heavy)'}
                          </h4>
                          <p className="text-xs text-gray-300 leading-relaxed font-sans pt-1">
                            {jdMatchResult.summary}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Identifies / Matched Skills */}
                        <div className="bg-[#0f172a] border border-brand-border rounded-xl p-4.5 space-y-3 text-left">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase block tracking-wider border-b border-brand-border/30 pb-1.5 mb-2.5">✓ Matched Keywords Found ({jdMatchResult.matchedSkills?.length || 0})</span>
                          {jdMatchResult.matchedSkills?.length === 0 ? (
                            <p className="text-[11px] text-gray-500">None detected. Consider rewriting weak bullets below.</p>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-left">
                              {jdMatchResult.matchedSkills?.map((ms: any, idx: number) => (
                                <div key={idx} className="bg-[#0b101c]/60 border border-emerald-500/10 p-2.5 rounded-lg flex flex-col gap-0.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-white font-mono break-all">{ms.skill}</span>
                                    <span className="text-[9px] font-bold text-emerald-400 font-sans shrink-0 uppercase tracking-wide">Level: {ms.level}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-400 leading-relaxed italic block mt-1">
                                    "{ms.sentenceContext}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Critical Gaps / Missing Keywords */}
                        <div className="bg-[#0f172a] border border-brand-border rounded-xl p-4.5 space-y-3 text-left">
                          <span className="text-[10px] font-mono text-orange-400 font-bold uppercase block tracking-wider border-b border-brand-border/30 pb-1.5 mb-2.5">⚠️ Missing Keywords & Gaps ({jdMatchResult.missingSkills?.length || 0})</span>
                          {jdMatchResult.missingSkills?.length === 0 ? (
                            <p className="text-[11px] text-emerald-400">Perfect compliance! No missing core keywords.</p>
                          ) : (
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-left">
                              {jdMatchResult.missingSkills?.map((ms: any, idx: number) => (
                                <div key={idx} className="bg-[#18110b]/60 border border-orange-500/10 p-2.5 rounded-lg flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-white font-mono break-all">{ms.skill}</span>
                                    <span className="text-[9px] font-semibold text-orange-400 font-sans bg-orange-500/5 border border-orange-500/10 px-1.5 py-0.5 rounded shrink-0 uppercase tracking-wider">{ms.impact}</span>
                                  </div>
                                  <p className="text-[11px] text-gray-300 font-sans leading-relaxed">
                                    {ms.recommendation}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Soft Skill align */}
                      <div className="bg-[#0f172a] border border-brand-border rounded-xl p-4.5 space-y-3 text-left">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block border-b border-brand-border/30 pb-1.5">👤 Core Behavioral & Soft Competencies</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                          {jdMatchResult.softSkillsAnalysis?.map((ss: any, idx: number) => (
                            <div key={idx} className="bg-[#0b101d] p-3 border border-brand-border rounded-xl flex items-start gap-2.5">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${ss.matched ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/20' : 'bg-red-950 text-red-400 border border-red-500/20'}`}>
                                {ss.matched ? '✓' : '!'}
                              </span>
                              <div className="space-y-0.5">
                                <h5 className="text-[11px] font-bold text-white font-sans">{ss.skill}</h5>
                                <p className="text-[10px] text-gray-400 leading-relaxed font-sans">{ss.insight}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customized structural bullets updates (Direct modifications!) */}
                      <div className="space-y-2.5 text-left">
                        <span className="text-[10px] font-mono text-purple-400 font-bold uppercase block tracking-wider">🎯 Customized Target Job Bullet Restructuring</span>
                        <div className="space-y-3">
                          {jdMatchResult.structuralFixes?.map((fix: any, idx: number) => (
                            <div key={idx} className="bg-[#120f26]/40 border border-[#4338ca]/20 rounded-xl p-4 space-y-2 relative text-left">
                              <span className="text-[8px] font-mono text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-500/10 inline-block">Your weak/average bullet text:</span>
                              <p className="text-[10px] text-gray-400 line-through">"{fix.originalText}"</p>
                              
                              <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/10 block mt-1 w-max">Compliant Optimized STAR proposal:</span>
                              <p className="text-[11px] text-white font-semibold italic">"{fix.suggestedPhrase}"</p>
                              
                              <span className="text-[9px] text-[#818cf8] block mt-1 bg-indigo-950/20 p-2 rounded leading-normal">{fix.benefit}</span>

                              <button
                                onClick={() => copyToClipboard(fix.suggestedPhrase)}
                                className="absolute top-2.5 right-2.5 p-1.5 hover:bg-brand-border rounded text-gray-400 hover:text-white transition cursor-pointer"
                                title="Copy suggested bullet phrase"
                              >
                                {copiedText === fix.suggestedPhrase ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 1. STAR METHOD BULLET REWRITER VIEW */}
            {activeTab === 'star' && (
              <div className="space-y-5" id="view-star-rewriter">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5">
                    Interactive STAR Bullet Rewriter
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Turn loosely phrased job duties into strong business-impact milestones.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">WEAK BULLET INPUT</label>
                  <textarea
                    value={starInput}
                    onChange={(e) => setStarInput(e.target.value)}
                    rows={2}
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter raw achievement here (e.g. 'Took care of bugs on the website update')"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] text-gray-500 font-mono">Quick templates:</span>
                    <button 
                      onClick={() => setStarInput('I was responsible for fixing slow database query times on our server.')}
                      className="text-[9px] font-mono text-indigo-400 hover:underline border border-indigo-500/15 rounded-md px-1.5 bg-brand-bg"
                    >
                      Slow DB queries
                    </button>
                    <button 
                      onClick={() => setStarInput('Managed product deployment and customer support tickets')}
                      className="text-[9px] font-mono text-indigo-400 hover:underline border border-indigo-500/15 rounded-md px-1.5 bg-brand-bg"
                    >
                      Support Tickets
                    </button>
                  </div>
                </div>

                <button
                  onClick={isPremium ? handleStarRewrite : onUpgradeTrigger}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-950/50 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {loading ? 'Consulting STAR engine...' : isPremium ? 'Rewrite via Pro STAR AI' : 'Unlock Pro STAR Rewriter'}
                </button>

                {/* Results block */}
                <AnimatePresence mode="wait">
                  {starResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="border-t border-brand-border/40 pt-5 space-y-4"
                    >
                      <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">3 Premium Optimized Variations</h4>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {starResult.variations.map((v: any, idx: number) => (
                          <div key={idx} className="bg-brand-bg/50 border border-brand-border rounded-xl p-4 space-y-3 relative hover:border-indigo-500/40 transition">
                            <div className="flex justify-between items-center bg-[#070b19] border border-indigo-500/10 px-2 py-0.5 rounded-md self-start">
                              <span className="text-[10px] font-mono text-indigo-300 font-semibold">{v.category}</span>
                              <span className="text-[9px] font-mono text-purple-400">Variant #{idx+1}</span>
                            </div>

                            <p className="text-xs font-semibold text-white italic leading-relaxed border-l-2 border-indigo-500 pl-3">
                              "{v.rewrittenFull}"
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-brand-border/30">
                              <div>
                                <span className="text-[9px] font-mono text-gray-500 block uppercase">SITUATION & TASK</span>
                                <span className="text-[10px] text-gray-300">{v.situationTask}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono text-gray-500 block uppercase">ACTION</span>
                                <span className="text-[10px] text-gray-300">{v.action}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-mono text-gray-500 block uppercase">RESULT</span>
                                <span className="text-[10px] text-gray-300 text-emerald-400 font-medium font-mono">{v.result}</span>
                              </div>
                            </div>

                            <div className="pt-2 bg-brand-surface/30 p-2.5 rounded-lg border border-brand-border/40 text-[10px] text-gray-400 flex items-start gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="text-white font-semibold">Impact breakdown:</span> {v.explanation}
                              </div>
                            </div>

                            <button
                              onClick={() => copyToClipboard(v.rewrittenFull)}
                              className="absolute top-4 right-4 bg-[#0f172a] hover:bg-indigo-950/50 p-2 rounded-lg border border-brand-border text-gray-400 hover:text-white transition"
                              title="Copy achievement"
                            >
                              {copiedText === v.rewrittenFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 2. GCC & NOTICE PERIOD ALIGNMENT VIEW */}
            {activeTab === 'gcc' && (
              <div className="space-y-5" id="view-gcc-alignment">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5">
                    GCC (Global Capability Center) & Notice Evaluation
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Analyze coordinates specifically for Indian notice constraints and eligibility against major high-demand GCC product companies.
                  </p>
                </div>

                <div className="bg-brand-bg/40 border border-brand-border p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wide">ACTIVE ANALYSIS FILE:</span>
                    <h4 className="text-xs font-bold text-white">
                      {resumes.find(r => r.id === selectedResumeId)?.name || 'Please select document'}
                    </h4>
                  </div>
                  <button
                    onClick={isPremium ? handleGccAlignment : onUpgradeTrigger}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
                    {loading ? 'Evaluating details...' : isPremium ? 'Evaluate GCC Hub Readiness' : 'Unlock Notice Optimizer'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {gccResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5 border-t border-brand-border/40 pt-5"
                    >
                      {/* Metric widgets row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-[#0c1020] border border-indigo-500/15 p-4 rounded-xl flex items-center gap-3.5">
                          <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-indigo-950/40 border border-indigo-500/20">
                            <span className="text-sm font-black font-mono text-indigo-300">{gccResult.appealScore}</span>
                            <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-r-transparent animate-spin-slow pointer-events-none" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">GCC Appeal rating</span>
                            <span className="text-xs font-bold text-white">{gccResult.appealScore >= 80 ? 'Tier-1 Candidate' : 'Highly Viable Option'}</span>
                          </div>
                        </div>

                        <div className="bg-[#0c1020] border border-indigo-500/15 p-4 rounded-xl flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-orange-950/20 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">Detected Notice</span>
                            <span className="text-xs font-bold text-white">~ {gccResult.detectedNoticeWeeks} Weeks ({gccResult.noticePeriodFound})</span>
                          </div>
                        </div>

                        <div className="bg-[#0c1020] border border-indigo-500/15 p-4 rounded-xl flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-[9px] font-mono text-gray-400 block uppercase">HUB ELIGIBILITY</span>
                            <span className="text-xs font-bold text-white text-emerald-300">{gccResult.locationEligibility}</span>
                          </div>
                        </div>
                      </div>

                      {/* Main breakdown panels */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-5 space-y-3.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display border-b border-brand-border/40 pb-2">
                            <Lock className="w-3.5 h-3.5 text-indigo-400" />
                            Elite Talent Friction Points
                          </h4>
                          <ul className="space-y-2.5">
                            {gccResult.frictionPoints.map((f: string, idx: number) => (
                              <li key={idx} className="flex gap-2.5 text-xs text-gray-300">
                                <span className="w-5 h-5 rounded bg-red-950/30 border border-red-500/15 flex items-center justify-center text-red-400 font-mono text-[10px] shrink-0">!</span>
                                <div>{f}</div>
                              </li>
                            ))}
                          </ul>
                          
                          <div className="pt-2">
                            <span className="text-[9px] font-mono text-gray-500 block uppercase">GCC COMPLIANCE ADVICE</span>
                            <p className="text-xs text-gray-300 leading-relaxed mt-1">{gccResult.cultureTransitionAdvice}</p>
                          </div>
                        </div>

                        <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-5 space-y-3.5">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-display border-b border-brand-border/40 pb-2">
                            <Zap className="w-3.5 h-3.5 text-indigo-400" />
                            Notice Period Optimization Suggestions
                          </h4>
                          <div className="space-y-3">
                            {gccResult.noticeTricks.map((t: any, idx: number) => (
                              <div key={idx} className="space-y-1.5 bg-brand-bg p-3 border border-brand-border/50 rounded-lg relative">
                                <span className="text-[8px] font-mono text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-500/10">Insecure raw original:</span>
                                <p className="text-[10px] text-gray-400 line-through">"{t.originalPhrasing}"</p>
                                
                                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/10 block mt-1 w-max">Pro optimizing rewrite:</span>
                                <p className="text-[11px] text-white font-semibold italic">"{t.suggestedPhrasing}"</p>
                                
                                <span className="text-[9px] text-gray-400 block mt-1.5 bg-indigo-950/15 p-1.5 rounded">{t.benefit}</span>

                                <button
                                  onClick={() => copyToClipboard(t.suggestedPhrasing)}
                                  className="absolute top-2.5 right-2.5 p-1.5 hover:bg-brand-border rounded text-gray-400 hover:text-white transition"
                                  title="Copy suggested phrase"
                                >
                                  {copiedText === t.suggestedPhrasing ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* NEW: Notice Period Buyouts & Bypass Strategy Board */}
                      <div className="bg-gradient-to-r from-red-950/20 via-[#0d1226] to-[#0f172a] border border-indigo-500/15 rounded-xl p-5 space-y-4 text-left">
                        <div>
                          <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold font-mono tracking-wider text-[9px] px-2 py-0.5 rounded-full uppercase">
                            ⚡ Indian Notice Bypass Strategy Board
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1.5 flex items-center gap-1 font-display">
                            Notice Speed-Joiner Simulation Board
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Simulate your negotiation leverage, generate professional manager notification letters, and HR spoken templates to prevent automatic resume filter exclusions.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Selector 1 */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase block">1. Target Notice Duration</span>
                            <select
                              value={noticeDurationSim}
                              onChange={(e) => setNoticeDurationSim(e.target.value)}
                              className="w-full bg-[#0b0f1d] border border-brand-border rounded-lg text-xs p-2 text-white outline-none cursor-pointer"
                            >
                              <option value="90">90 Days (TCS, Infosys, Wipro, Accenture standard)</option>
                              <option value="60">60 Days (Service Agreement)</option>
                              <option value="30">30 Days or less (Immediate joiner band)</option>
                            </select>
                          </div>

                          {/* Selector 2 */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase block">2. Current Resignation Status</span>
                            <select
                              value={resignedStatusSim}
                              onChange={(e) => setResignedStatusSim(e.target.value)}
                              className="w-full bg-[#0b0f1d] border border-brand-border rounded-lg text-xs p-2 text-white outline-none cursor-pointer"
                            >
                              <option value="pre">Not Resigned Yet (Pre-offer evaluation)</option>
                              <option value="serving">Resigned & Serving Notice Period</option>
                              <option value="lwd">LWD (Last Working Day) Confirmed & Locked</option>
                            </select>
                          </div>
                        </div>

                        {/* Calculated Outcomes (Live simulation) */}
                        <div className="bg-brand-bg/60 p-4 border border-brand-border rounded-xl space-y-3.5">
                          {/* Speed Gauge & Leverage Level */}
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border/40 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-gray-400">Notice Friction Rating:</span>
                              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                                noticeDurationSim === '90' 
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                  : noticeDurationSim === '60' 
                                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {noticeDurationSim === '90' ? 'CRITICAL RISK (90 Days)' : noticeDurationSim === '60' ? 'MODERATE RESISTANCE (60 Days)' : 'EXCELLENT SPEED (30 Days)'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-gray-400">Target Buyout Probability:</span>
                              <span className="text-xs font-black text-indigo-400">
                                {noticeDurationSim === '90' && resignedStatusSim === 'pre' && '35% (Early Stage)'}
                                {noticeDurationSim === '90' && resignedStatusSim === 'serving' && '75% (Viable Option)'}
                                {noticeDurationSim === '90' && resignedStatusSim === 'lwd' && '95% (Highly Preferred/Immediate)'}
                                {noticeDurationSim === '60' && resignedStatusSim === 'pre' && '55% (Negotiable)'}
                                {noticeDurationSim === '60' && resignedStatusSim === 'serving' && '85% (Strong Leverage)'}
                                {noticeDurationSim === '60' && resignedStatusSim === 'lwd' && '99% (Immediate Joiner)'}
                                {noticeDurationSim === '30' && '100% (Instant Ingress)'}
                              </span>
                            </div>
                          </div>

                          {/* Spoken script to HR callback */}
                          <div className="space-y-1.5 relative bg-[#0b101c]/80 p-3.5 border border-indigo-500/5 rounded-lg text-left">
                            <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase block">💬 Recruiter Spoken Callback Script (Copy to use on phone calls)</span>
                            <p className="text-[11px] text-gray-200 leading-relaxed font-sans pr-8 italic">
                              "{noticeDurationSim === '90' && resignedStatusSim === 'pre' && `I am actively mapping opportunities and ready to resignation upon receiving an optimized GCC slot. While my employment contract states 90 days, we have structured client handover frameworks and internal resource backups that allow our leadership to release me in under 45 days, or accept double-sided buyout offsets which you can fund.`}"
                              "{noticeDurationSim === '90' && resignedStatusSim === 'serving' && `I have formally submitted my resignation on my current platform, and I am actively serving my notice. My project Handover has commenced, and because the core deliverables are already assigned to my dual-shadow, my engineering lead is agreeable to early releases or direct buyout buy-overs if your recruitment framework supports notice adjustments.`}"
                              "{noticeDurationSim === '90' && resignedStatusSim === 'lwd' && `My resignation was officially logged, and my Last Working Day is locked and documented. I have completed my active project handovers and my deliverables are fully wrapped up. Consequently, I am a strategic immediate-joiner, with zero dependencies on hand.`}"
                              "{noticeDurationSim === '60' && resignedStatusSim === 'pre' && `I am negotiable on release targets. My formal notice of 60 days can easily be optimized to 30 days due to surplus resource allocation on my current bench.`}"
                              "{noticeDurationSim === '60' && resignedStatusSim === 'serving' && `I am currently in my notice phase with and will wrap up handovers shortly. I am negotiated for release relief, making short-notice onboarding fully achievable.`}"
                              "{noticeDurationSim === '60' && resignedStatusSim === 'lwd' && `Transition completed and release confirmed. My LWD is finalized, allowing me to start immediately upon completing background verification.`}"
                              "{noticeDurationSim === '30' && `Notice period is under 30 days. Handover is underway, allowing me to start immediately with minimal lag.`}"
                            </p>
                            <button
                              onClick={() => {
                                const el = document.getElementById('notice-calc-sc');
                                if (el) copyToClipboard(el.textContent || '');
                              }}
                              className="absolute top-2.5 right-2 text-gray-500 hover:text-white p-1 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <span id="notice-calc-sc" className="hidden">
                              {noticeDurationSim === '90' && resignedStatusSim === 'pre' && `I am actively mapping opportunities and ready to resignation upon receiving an optimized GCC slot. While my employment contract states 90 days, we have structured client handover frameworks and internal resource backups that allow our leadership to release me in under 45 days, or accept double-sided buyout offsets which you can fund.`}
                              {noticeDurationSim === '90' && resignedStatusSim === 'serving' && `I have formally submitted my resignation on my current platform, and I am actively serving my notice. My project Handover has commenced, and because the core deliverables are already assigned to my dual-shadow, my engineering lead is agreeable to early releases or direct buyout buy-overs if your recruitment framework supports notice adjustments.`}
                              {noticeDurationSim === '90' && resignedStatusSim === 'lwd' && `My resignation was officially logged, and my Last Working Day is locked and documented. I have completed my active project handovers and my deliverables are fully wrapped up. Consequently, I am a strategic immediate-joiner, with zero dependencies on hand.`}
                              {noticeDurationSim === '60' && resignedStatusSim === 'pre' && `I am negotiable on release targets. My formal notice of 60 days can easily be optimized to 30 days due to surplus resource allocation on my current bench.`}
                              {noticeDurationSim === '60' && resignedStatusSim === 'serving' && `I am currently in my notice phase with and will wrap up handovers shortly. I am negotiated for release relief, making short-notice onboarding fully achievable.`}
                              {noticeDurationSim === '60' && resignedStatusSim === 'lwd' && `Transition completed and release confirmed. My LWD is finalized, allowing me to start immediately upon completing background verification.`}
                              {noticeDurationSim === '30' && `Notice period is under 30 days. Handover is underway, allowing me to start immediately with minimal lag.`}
                            </span>
                          </div>

                          {/* formal release request email draft */}
                          <div className="space-y-1.5 relative bg-[#130e0b]/80 p-3.5 border border-orange-500/5 rounded-lg text-left">
                            <span className="text-[9px] font-mono text-orange-400 font-bold uppercase block">📧 Polished Email to current manager (Early release request / Buyout waiver)</span>
                            <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap leading-normal pr-8 select-all">
{`Subject: Request for Early Release / Handover Notice Period Adjustment

Dear Sir/Ma'am,

As part of my scheduled transition period, I am dedicated to ensuring a seamless transfer of all my active deliverables. I have completed structured documentation for my ongoing modules and successfully mapped handovers to the designated backup engineers.

Given that the core transition path is now fully secure, I would like to respectfully request a release date relief of ${noticeDurationSim === '90' ? '45 days early' : '30 days early'}, or alternative buyout approval if supported by company policy. This early release will enable me to align with my target obligations, and I am happy to offset remaining handshake tasks offline if needed.

Looking forward to your favorable directive.

Warm regards,`}
                            </pre>
                            <button
                              onClick={() => {
                                const txt = `Subject: Request for Early Release / Handover Notice Period Adjustment\n\nDear Sir/Ma'am,\n\nAs part of my scheduled transition period, I am dedicated to ensuring a seamless transfer of all my active deliverables. I have completed structured documentation for my ongoing modules and successfully mapped handovers to the designated backup engineers.\n\nGiven that the core transition path is now fully secure, I would like to respectfully request a release date relief of ${noticeDurationSim === '90' ? '45 days early' : '30 days early'}, or alternative buyout approval if supported by company policy. This early release will enable me to align with my target obligations, and I am happy to offset remaining handshake tasks offline if needed.\n\nLooking forward to your favorable directive.\n\nWarm regards,`;
                                copyToClipboard(txt);
                              }}
                              className="absolute top-2.5 right-2 text-gray-500 hover:text-white p-1 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 3. INTERVIEW PREP VIEW */}
            {activeTab === 'interview' && (
              <div className="space-y-5" id="view-interview-prep">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5 font-bold">
                    Interview Prep Board
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Compares background logs against Target JD, compiling behavioral and architectural gaps recruiters typically probe.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">TARGET CAREER TRACK</label>
                    <input
                      type="text"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={interviewTrack}
                      onChange={(e) => setInterviewTrack(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">TARGET JOB DESCRIPTION</label>
                    <textarea
                      value={interviewJd}
                      onChange={(e) => setInterviewJd(e.target.value)}
                      rows={2}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      placeholder="Paste job specifications here..."
                    />
                  </div>
                </div>

                <button
                  onClick={isPremium ? handleInterviewPrep : onUpgradeTrigger}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
                  {loading ? 'Compiling gaps questions...' : isPremium ? 'Generate Custom Interview Board' : 'Unlock Interview Prep Board'}
                </button>

                {/* Results accordion */}
                <AnimatePresence mode="wait">
                  {interviewResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 border-t border-brand-border/40 pt-5"
                    >
                      {/* Identified gaps tag banner */}
                      <div className="bg-brand-bg p-4 border border-brand-border rounded-xl space-y-2">
                        <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider block">⚠️ IDENTIFIED CONCEPTUAL GAPS:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {interviewResult.identifiedGaps.map((g: string, idx: number) => (
                            <span key={idx} className="bg-red-950/20 border border-red-500/15 text-red-300 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-semibold">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Accordions */}
                      <div className="space-y-3">
                        {interviewResult.questions.map((q: any) => (
                          <div key={q.id} className="bg-brand-bg/50 border border-brand-border/60 rounded-xl overflow-hidden hover:border-brand-border transition">
                            <button
                              onClick={() => setActiveQuestionId(activeQuestionId === q.id ? null : q.id)}
                              className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3 focus:outline-none"
                            >
                              <div className="space-y-1">
                                <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                                  q.confidenceIndication.includes('High') 
                                    ? 'bg-red-500/10 border border-red-500/25 text-red-400' 
                                    : 'bg-yellow-500/10 border border-yellow-500/25 text-yellow-400'
                                }`}>
                                  {q.confidenceIndication}
                                </span>
                                <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                                  {q.question}
                                </h4>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${activeQuestionId === q.id ? 'rotate-180 text-white' : ''}`} />
                            </button>

                            <AnimatePresence initial={false}>
                              {activeQuestionId === q.id && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-1 border-t border-brand-border/40 space-y-3 bg-[#0a0d18]/45">
                                    <div className="bg-[#0c1020] border border-blue-500/10 p-3 rounded-lg text-xs leading-relaxed text-gray-300">
                                      <span className="text-[10px] font-mono text-blue-400 font-bold block uppercase mb-1">RECRUITER STRATEGIC INTENTANGLE:</span>
                                      {q.whyRecruiterAsks}
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase">MODEL REQUISITE RESPONSE STRUCTURE:</span>
                                      <div className="text-xs text-gray-300 leading-relaxed font-sans bg-brand-surface p-3.5 border border-brand-border rounded-xl">
                                        <p className="whitespace-pre-line">{q.suggestedResponseOutline}</p>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => copyToClipboard(q.question)}
                                      className="text-[10px] font-mono text-indigo-400 hover:text-white transition flex items-center gap-1 bg-[#0f172a] border border-brand-border px-2.5 py-1.5 rounded-lg"
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy raw question to study
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 4. REAL-TIME KEYWORD INJECTOR VIEW */}
            {activeTab === 'injector' && (
              <div className="space-y-5" id="view-keyword-injector">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5">
                    ATS Keyword Natural Placement Injector
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Recommend integration adjustments incorporating missing keywords seamlessly without looking like raw keyword spam.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">MISSING KEYWORDS INPUTS (COMMA SEPARATED)</label>
                  <input
                    type="text"
                    className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="e.g. Kotlin, Docker, AWS, Snowflake, System Design"
                  />
                  <span className="text-[10px] text-gray-500 font-mono">Separate skill keyword tags via copper delimiters.</span>
                </div>

                <button
                  onClick={isPremium ? handleKeywordInjector : onUpgradeTrigger}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                  {loading ? 'Finding locations...' : isPremium ? 'Calculate Natural Injection Points' : 'Unlock ATS Keyword Injector'}
                </button>

                {/* Results layout */}
                <AnimatePresence mode="wait">
                  {keywordResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 border-t border-brand-border/40 pt-5"
                    >
                      <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">Contextual Seamless Skill Adjustments</h4>
                      
                      <div className="space-y-4">
                        {keywordResult.injections.map((inj: any, idx: number) => (
                          <div key={idx} className="bg-brand-bg/50 border border-brand-border rounded-xl p-4.5 space-y-3 hover:border-indigo-500/25 transition">
                            <div className="flex flex-wrap gap-2 items-center justify-between">
                              <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                                Keyword: {inj.keyword}
                              </span>
                              <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-gray-500" />
                                {inj.logicalLocation}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-brand-border/30">
                              <div className="bg-brand-surface p-3 rounded-lg border border-brand-border/40">
                                <span className="text-[9px] font-mono text-red-400 block mb-1">CURRENT ORIGINAL PHRASE:</span>
                                <p className="text-[11px] text-gray-400">"{inj.originalContextText}"</p>
                              </div>

                              <div className="bg-[#0b1021]/80 p-3 rounded-lg border border-indigo-500/20 relative">
                                <span className="text-[9px] font-mono text-emerald-400 block mb-1">ATS INJECTED RECOMMENDATION:</span>
                                <p className="text-[11px] text-white font-semibold">"{inj.suggestedInjectedText}"</p>
                                
                                <button
                                  onClick={() => copyToClipboard(inj.suggestedInjectedText)}
                                  className="absolute top-2 right-2 p-1 bg-brand-bg border border-brand-border rounded hover:text-white text-gray-400 transition"
                                  title="Copy injected variation"
                                >
                                  {copiedText === inj.suggestedInjectedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            <div className="text-[10px] text-gray-400 flex items-start gap-1 p-1 bg-brand-surface/30 rounded">
                              <span className="text-white font-semibold">Integrative rationale:</span> {inj.justification}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 5. TIER Rating & COMPENSATION BENCHMARK VIEW */}
            {activeTab === 'comp' && (
              <div className="space-y-5" id="view-comp-balancer">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5">
                    University Tier & Dynamic Indian CTC Predictor
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Recognizes academic campus pedigree and calculates highly realistic market compensation bands in INR Lakhs per Annum (LPA).
                  </p>
                </div>

                <div className="bg-brand-bg/40 border border-brand-border p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wide">TARGET DOCUMENT EVALUATION:</span>
                    <h4 className="text-xs font-bold text-white">
                      {resumes.find(r => r.id === selectedResumeId)?.name || 'Please select document'}
                    </h4>
                  </div>
                  <button
                    onClick={isPremium ? handleTierComp : onUpgradeTrigger}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BadgeIndianRupee className="w-3.5 h-3.5" />}
                    {loading ? 'Evaluating payroll grids...' : isPremium ? 'Predict Market CTC predictions' : 'Unlock CTC Predictor'}
                  </button>
                </div>

                {/* Results display */}
                <AnimatePresence mode="wait">
                  {compResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-5 border-t border-brand-border/40 pt-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-[#0b1021] border border-indigo-500/15 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-500/25 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-gray-500 block uppercase">ACADEMIC ALUMNI PEDIGREE</span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{compResult.detectedTierRating}</h4>
                            <span className="text-[9px] font-mono text-indigo-300 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/15 block mt-0.5 w-max">
                              {compResult.detectedTierBadge}
                            </span>
                          </div>
                        </div>

                        <div className="bg-[#0b1021] border border-indigo-500/15 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-950/20 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <Briefcase className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-gray-500 block uppercase">CALIBRATED EXPERIENCE METRICS</span>
                            <h4 className="text-sm font-bold text-white mt-0.5">{compResult.yearsOfExperience}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {compResult.identifiedCoreHotSkills.map((s: string, idx: number) => (
                                <span key={idx} className="text-[8px] font-mono font-bold bg-brand-bg px-1 rounded text-orange-300/90 whitespace-nowrap">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Predicted compensation list cards */}
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-mono font-bold text-gray-400 uppercase tracking-wider">Salary Benchmarks Predictions (INR Lakhs Per Annum - LPA)</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {compResult.predictions.map((p: any, idx: number) => (
                            <div key={idx} className="bg-brand-bg/50 border border-brand-border p-4 rounded-xl space-y-2 flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] font-bold text-white flex items-center gap-1 font-display">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                  {p.city}
                                </span>
                                
                                <div className="mt-3 flex items-baseline gap-1.5 font-display">
                                  <span className="text-2xl font-black text-white font-mono">{p.minLpa} - {p.maxLpa}</span>
                                  <span className="text-[10px] font-bold text-indigo-400 font-mono">LPA</span>
                                </div>
                              </div>

                              <p className="text-[10px] text-gray-400 mt-2 italic leading-relaxed border-t border-brand-border/40 pt-2">
                                {p.notes}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Negotiation tips */}
                      <div className="bg-[#0b1021]/60 border border-indigo-500/15 rounded-xl p-4.5 space-y-3">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">₹ PROFESSIONAL SALARY NEGOTIATION COACH PLAN:</span>
                        <ul className="space-y-2">
                          {compResult.recommendationsToNegotiate.map((rec: string, idx: number) => (
                            <li key={idx} className="flex gap-2.5 text-xs text-gray-300">
                              <span className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">✓</span>
                              <div>{rec}</div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* NEW: Interactive Salary Counter-Offer Negotiation Simulator */}
                      <div className="bg-gradient-to-r from-emerald-950/20 via-[#0d1c16] to-[#0f172a] border border-emerald-500/15 rounded-xl p-5 space-y-4 text-left">
                        <div>
                          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-mono tracking-wider text-[9px] px-2 py-0.5 rounded-full uppercase">
                            ₹ Pro Counter-Offer & Salary Suite
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1.5 flex items-center gap-1 font-display">
                            Interactive INR Compensation Simulator
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Leverage your detected academic profile ({compResult.detectedTierRating}) and experience metrics to model persuasive compensation counter-proposals with real-time risk parameters.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
                          {/* Offered CTC Selector */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase block">Offered Fixed CTC (LPA)</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={3}
                                max={50}
                                value={offeredCtcSim}
                                onChange={(e) => setOfferedCtcSim(Number(e.target.value))}
                                className="w-full h-1 bg-[#0b0f1d] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                              <span className="text-xs font-bold font-mono text-white shrink-0 bg-[#0b0f1d] px-2 py-1 rounded border border-brand-border">{offeredCtcSim} LPA</span>
                            </div>
                          </div>

                          {/* Desired CTC Selector */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase block">Desired CTC Expectation (LPA)</span>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={3}
                                max={60}
                                value={desiredCtcSim}
                                onChange={(e) => setDesiredCtcSim(Number(e.target.value))}
                                className="w-full h-1 bg-[#0b0f1d] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                              <span className="text-xs font-bold font-mono text-emerald-300 shrink-0 bg-[#0b0f1d] px-2 py-1 rounded border border-brand-border">{desiredCtcSim} LPA</span>
                            </div>
                          </div>

                          {/* Competing offers */}
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono text-gray-400 font-bold uppercase block">Competing Offer Status</span>
                            <select
                              value={competingOfferSim}
                              onChange={(e) => setCompetingOfferSim(e.target.value)}
                              className="w-full bg-[#0b0f1d] border border-brand-border rounded-lg text-xs p-1.5 text-white outline-none cursor-pointer"
                            >
                              <option value="no">No, other processes active</option>
                              <option value="yes_similar">Yes, similar CTC pending</option>
                              <option value="yes_higher">Yes, higher offer on hand</option>
                            </select>
                          </div>
                        </div>

                        {/* Outcomes Simulator details */}
                        <div className="bg-[#0b0f1d] p-4 border border-brand-border rounded-xl space-y-3.5 text-left">
                          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-border/40 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-gray-400">CTC Jump Delta:</span>
                              <span className="text-xs font-black font-mono text-emerald-400">
                                +{offeredCtcSim > 0 ? Math.round(((desiredCtcSim - offeredCtcSim) / offeredCtcSim) * 100) : 0}% Request hike
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-gray-400">Negotiation Defense Class:</span>
                              <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                                ((desiredCtcSim - offeredCtcSim) / offeredCtcSim) <= 0.15
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : ((desiredCtcSim - offeredCtcSim) / offeredCtcSim) <= 0.35
                                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                  : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                              }`}>
                                {((desiredCtcSim - offeredCtcSim) / offeredCtcSim) <= 0.15 
                                  ? 'SAFE ZONE (High Success probability)' 
                                  : ((desiredCtcSim - offeredCtcSim) / offeredCtcSim) <= 0.35 
                                  ? 'MODERATE LEVERAGE ZONE' 
                                  : 'AGGRESSIVE ZONE (Needs heavy justification)'}
                              </span>
                            </div>
                          </div>

                          {/* HR spoke counter script */}
                          <div className="space-y-1.5 relative bg-[#0b101c]/80 p-3.5 border border-indigo-500/5 rounded-lg text-left">
                            <span className="text-[9px] font-mono text-indigo-400 font-bold uppercase block">💬 Verbal Phone Call Response with HR (Conversational Defense Script)</span>
                            <p className="text-[11px] text-gray-200 leading-relaxed font-sans pr-8 italic">
                              "Thank you for sharing the details of the offer, I am incredibly excited about the alignment. Given my background from a strong academic benchmark like {compResult.detectedTierRating} coupled with my active skill context, I am looking to establish a highly mutually viable package. If we could adjust the fixed base component closer to {desiredCtcSim} LPA, I would be fully prepared to wrap up pending opportunities and finalize my commitment today."
                            </p>
                            <button
                              onClick={() => {
                                const txt = `Thank you for sharing the details of the offer, I am incredibly excited about the alignment. Given my background from a strong academic benchmark like ${compResult.detectedTierRating} coupled with my active skill context, I am looking to establish a highly mutually viable package. If we could adjust the fixed base component closer to ${desiredCtcSim} LPA, I would be fully prepared to wrap up pending opportunities and finalize my commitment today.`;
                                copyToClipboard(txt);
                              }}
                              className="absolute top-2.5 right-2 text-gray-500 hover:text-white p-1 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Email write draft */}
                          <div className="space-y-1.5 relative bg-[#0e1713]/80 p-3.5 border border-emerald-500/5 rounded-lg text-left">
                            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">📧 Professional Counter-Offer Pitch Email (Copy to respond to offer email)</span>
                            <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap leading-normal pr-8 select-all">
{`Subject: Compensation Discussion: Offer Revision Proposal - [Your Name]

Dear Recruitment Handset Committee,

Thank you for sending over the formal offer details for the role. I am extremely enthusiastic about joining the team and driving high-throughput scaling objectives.

To ensure long-term alignment regarding structural benchmarks, I want to respectfully propose an adjustment to the fixed base salary parameter. Considering my credentials (including my graduation from ${compResult.detectedTierRating} representing a key tier background) along with my competencies, I would appreciate it if we could calibrate the base CTC to ${desiredCtcSim} LPA. 

${competingOfferSim.startsWith('yes') ? 'Additionally, I am currently evaluating concurrent discussions in a similar range, but I prefer local project vectors and would immediately lock in the contract here if this band can be aligned.' : 'I believe this representation directly reflects my market suitability, and I am ready to complete formalities quickly to begin onboarding.'}

Thank you for your partnership and support in this transition.

Sincerely,`}
                            </pre>
                            <button
                              onClick={() => {
                                const txt = `Subject: Compensation Discussion: Offer Revision Proposal - [Your Name]\n\nDear Recruitment Handset Committee,\n\nThank you for sending over the formal offer details for the role. I am extremely enthusiastic about joining the team and driving high-throughput scaling objectives.\n\nTo ensure long-term alignment regarding structural benchmarks, I want to respectfully propose an adjustment to the fixed base salary parameter. Considering my credentials (including my graduation from ${compResult.detectedTierRating} representing a key tier background) along with my competencies, I would appreciate it if we could calibrate the base CTC to ${desiredCtcSim} LPA. \n\n${competingOfferSim.startsWith('yes') ? 'Additionally, I am currently evaluating concurrent discussions in a similar range, but I prefer local project vectors and would immediately lock in the contract here if this band can be aligned.' : 'I believe this representation directly reflects my market suitability, and I am ready to complete formalities quickly to begin onboarding.'}\n\nThank you for your partnership and support in this transition.\n\nSincerely,`;
                                copyToClipboard(txt);
                              }}
                              className="absolute top-2.5 right-2 text-gray-500 hover:text-white p-1 transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 6. REFERRAL PITCH VIEW */}
            {activeTab === 'pitch' && (
              <div className="space-y-5" id="view-referral-pitch">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5">
                    Premium Referral Pitch & Cold Email Generator
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Generate highly contextual LinkedIn and Cold Email pitches custom mapped from your resume achievements.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">TARGET COMPANY</label>
                    <input
                      type="text"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={pitchCompany}
                      onChange={(e) => setPitchCompany(e.target.value)}
                      placeholder="e.g. Goldman Sachs Bangalore, Swiggy"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">TARGET DESIGNATION / TITLE</label>
                    <input
                      type="text"
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={pitchTitle}
                      onChange={(e) => setPitchTitle(e.target.value)}
                      placeholder="e.g. Senior Backend Dev - Ledger Team"
                    />
                  </div>
                </div>

                <button
                  onClick={isPremium ? handleReferralPitch : onUpgradeTrigger}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {loading ? 'Compiling pitching scripts...' : isPremium ? 'Compile Custom Referral Pitch' : 'Unlock Referral Pitcher'}
                </button>

                {/* Results block */}
                <AnimatePresence mode="wait">
                  {pitchResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5 border-t border-brand-border/40 pt-5"
                    >
                      <div className="space-y-4">
                        {/* LinkedIn micro Pitch */}
                        <div className="bg-brand-bg border border-indigo-500/20 rounded-xl p-4.5 relative hover:border-indigo-500/45 transition">
                          <span className="bg-indigo-500/10 text-indigo-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase border border-indigo-500/20">LinkedIn Connect Request Pitch (Keep &lt;300 chars)</span>
                          <p className="text-xs text-white mt-3 font-medium whitespace-pre-line leading-relaxed italic border-l-2 border-indigo-500 pl-3">
                            "{pitchResult.linkedinPitch}"
                          </p>
                          <button
                            onClick={() => copyToClipboard(pitchResult.linkedinPitch)}
                            className="absolute top-4.5 right-4.5 p-2 bg-brand-surface rounded border border-brand-border hover:text-white text-gray-400 transition"
                            title="Copy LinkedIn Pitch"
                          >
                            {copiedText === pitchResult.linkedinPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Cold Email Block */}
                        <div className="bg-brand-bg border border-brand-border rounded-xl p-4.5 relative hover:border-indigo-500/20 transition">
                          <span className="bg-orange-500/10 text-orange-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase border border-orange-500/20 block w-max">Formal Referral Hook Email</span>
                          
                          <div className="mt-3.5 space-y-2 text-xs">
                            <div className="bg-brand-surface p-2.5 rounded border border-brand-border/60">
                              <span className="text-[9px] font-mono text-gray-400 block">SUBJECT LINE:</span>
                              <strong className="text-white font-medium">{pitchResult.coldEmailSubject}</strong>
                            </div>

                            <div className="bg-brand-surface p-3.5 rounded border border-brand-border/60 relative">
                              <span className="text-[9px] font-mono text-gray-400 block mb-1">EMAIL BODY:</span>
                              <p className="text-gray-300 font-sans whitespace-pre-line leading-relaxed mt-1">
                                {pitchResult.coldEmailBody}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => copyToClipboard(`Subject: ${pitchResult.coldEmailSubject}\n\n${pitchResult.coldEmailBody}`)}
                            className="absolute top-4.5 right-4.5 p-2 bg-brand-surface rounded border border-brand-border hover:text-white text-gray-400 transition"
                            title="Copy full email"
                          >
                            {copiedText === `Subject: ${pitchResult.coldEmailSubject}\n\n${pitchResult.coldEmailBody}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Protocol tips */}
                        <div className="bg-[#0b1021]/60 border border-indigo-500/15 rounded-xl p-4.5 space-y-2">
                          <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">💡 INDIAN ECOSYSTEM REFERRAL PROTOCOL STRATEGY:</span>
                          <p className="text-xs text-gray-300 leading-relaxed font-sans">{pitchResult.referralProtocolStrategy}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 7. SOCIAL / NAUKRI SEO OPTIMIZER VIEW */}
            {activeTab === 'socialSEO' && (
              <div className="space-y-5" id="view-social-optimize">
                <div>
                  <h3 className="font-display font-medium text-sm text-white flex items-center gap-1.5">
                    Naukri & Job Portal SEO Headline Optimizer
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Generates recruiter profile titles, SEO keyword tags, and indexing summaries to skyrocket discovery rankings.
                  </p>
                </div>

                <div className="bg-brand-bg/40 border border-brand-border p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wide">TARGET DOCUMENT EVALUATION:</span>
                    <h4 className="text-xs font-bold text-white">
                      {resumes.find(r => r.id === selectedResumeId)?.name || 'Please select document'}
                    </h4>
                  </div>
                  <button
                    onClick={isPremium ? handleSocialOptimize : onUpgradeTrigger}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                    {loading ? 'Optimizing indexing targets...' : isPremium ? 'Optimize SEO discoverability' : 'Unlock SEO Optimizer'}
                  </button>
                </div>

                {/* Results display */}
                <AnimatePresence mode="wait">
                  {socialResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-5 border-t border-brand-border/40 pt-5 text-xs"
                    >
                      {/* Headlines section */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block tracking-wider">⚡ 4 High-CTR Profile Headlines (SEO Optimized)</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {socialResult.headlines.map((headlineText: string, idx: number) => (
                            <div key={idx} className="bg-brand-bg p-3 border border-brand-border rounded-xl flex items-center justify-between gap-3 relative hover:border-indigo-500/30 transition">
                              <div className="space-y-1 max-w-[85%]">
                                <span className="text-[8px] font-mono text-indigo-400 bg-indigo-500/5 px-1 py-0.5 rounded border border-indigo-500/10">Option {idx+1}</span>
                                <p className="text-[11px] text-white font-medium leading-relaxed">"{headlineText}"</p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(headlineText)}
                                className="p-1.5 bg-brand-surface rounded border border-brand-border text-gray-400 hover:text-white transition"
                                title="Copy Headline"
                              >
                                {copiedText === headlineText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recruiter summary Pitch */}
                      <div className="bg-brand-bg border border-brand-border rounded-xl p-4 relative">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase block mb-1">📑 Crawl Optimised Bio Pitch Summary</span>
                        <p className="text-gray-300 leading-relaxed font-sans text-xs mt-2 italic whitespace-pre-line">
                          "{socialResult.recruiterPitchSummary}"
                        </p>
                        <button
                          onClick={() => copyToClipboard(socialResult.recruiterPitchSummary)}
                          className="absolute top-4 right-4 p-2 bg-brand-surface rounded border border-brand-border text-gray-400 hover:text-white transition"
                          title="Copy Bio Summary"
                        >
                          {copiedText === socialResult.recruiterPitchSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Skill tags list */}
                      <div className="bg-brand-bg border border-brand-border rounded-xl p-4 space-y-2.5">
                        <span className="text-[10px] font-mono text-orange-400 font-bold uppercase block">🏷️ Strategic Portal Skill tagging list (Copy and Paste to rank higher)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {socialResult.strategicKeywordsList.map((tag: string, idx: number) => (
                            <span key={idx} className="bg-orange-500/10 border border-orange-500/25 text-orange-300 font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Hacks info */}
                      <div className="bg-[#0b1021]/60 border border-indigo-500/15 rounded-xl p-4.5 space-y-2">
                        <span className="text-[10px] font-mono text-indigo-400 font-bold block uppercase tracking-wider">💡 INSIDER UPDATE BUMP HACK:</span>
                        <p className="text-gray-300 leading-relaxed font-sans text-xs">{socialResult.naukriHacks}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
