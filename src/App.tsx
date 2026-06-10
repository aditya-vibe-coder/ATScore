// SEO AUDIT: view state variable = currentView, landing value = 'landing',
// public share value = 'shared_report', app values = ['login','signup','verify','dashboard','resumes','upload_view','analyze_view','scoreboard','naukri_view','premium_toolkit','settings_view','cover-letters','offer-analyzer','tracker','resume-tailor','linkedin']
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  FileText, 
  Sparkles, 
  Sliders, 
  Upload, 
  Lock, 
  Settings, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Briefcase, 
  Users, 
  Zap, 
  User as UserIcon, 
  ArrowRight, 
  LogOut, 
  RefreshCw, 
  Download, 
  Share2, 
  Trash2,
  Copy,
  Link,
  Check,
  ThumbsUp,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Cpu,
  Github,
  Linkedin,
  Clock,
  Heart,
  Sun,
  Moon
} from 'lucide-react';

import { api, getAuthToken, clearAuthToken } from './api';
import { TRACK_DETAILS, TrackConfig } from './constants';
import { ScoreGauge } from './components/ScoreGauge';
import { ScoreTrendChart } from './components/ScoreTrendChart';
import { ScoreImprovementInsights } from './components/ScoreImprovementInsights';
import { MetricBar } from './components/MetricBar';
import { PremiumToolsHub } from './components/premium/PremiumToolsHub';
import { CoverLetterGenerator } from './components/CoverLetterGenerator';
import { OfferAnalyzer } from './components/OfferAnalyzer';
import { ApplicationTracker } from './components/ApplicationTracker';
import { ResumeTailor } from './components/ResumeTailor';
import { LinkedInGenerator } from './components/LinkedInGenerator';
import { findVersionMatches } from './utils/versioning';
import { 
  User, 
  Resume, 
  Analysis, 
  NaukriProfile, 
  PaymentRecord, 
  TrackKey,
  AIFeedbackResult
} from './types';

export default function App() {
  // Global States
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const verificationCompletedRef = useRef(false);
  const autoVerifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('atscore_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('atscore_theme', theme);
  }, [theme]);

  // Core Lists
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  
  // Active report
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Forms states
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [verificationOtp, setVerificationOtp] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);

  // Resume Upload Fields
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileBase64, setUploadedFileBase64] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Scoring inputs
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetJdText, setTargetJdText] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<TrackKey>('naukri');
  
  // Naukri Optimizer Fields
  const [naukriHeadline, setNaukriHeadline] = useState('');
  const [naukriSummary, setNaukriSummary] = useState('');
  const [naukriSkills, setNaukriSkills] = useState('');
  const [naukriNotice, setNaukriNotice] = useState('Immediate / 15 Days');
  const [naukriCTC, setNaukriCTC] = useState('12 LPA');
  const [naukriLocation, setNaukriLocation] = useState('Bengaluru');
  const [naukriAnalysisResult, setNaukriAnalysisResult] = useState<NaukriProfile | null>(null);

  // Settings BYOK Fields
  const [byokKey, setByokKey] = useState('');
  const [byokSaving, setByokSaving] = useState(false);

  // Counter metric demo state
  const [demoCounter, setDemoCounter] = useState(47293);

  // Detailed UI category state toggles
  const [expandedSection, setExpandedSection] = useState<string | null>('format');

  // LinkedIn Share States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState('');
  const [copiedState, setCopiedState] = useState(false);

  // Public Shareable Report states
  const [publicSharedAnalysis, setPublicSharedAnalysis] = useState<Analysis | null>(null);
  const [publicSharedLoading, setPublicSharedLoading] = useState<boolean>(false);
  const [activeShareAnalysis, setActiveShareAnalysis] = useState<Analysis | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('share');
    if (sharedId) {
      const fetchPublicShared = async () => {
        try {
          setPublicSharedLoading(true);
          const report = await api.getPublicAnalysis(sharedId);
          setPublicSharedAnalysis(report);
          setCurrentView('shared_report');
        } catch (err: any) {
          setApiError(err.message || 'Could not find public shared report.');
        } finally {
          setPublicSharedLoading(false);
        }
      };
      fetchPublicShared();
    }
  }, []);

  // Resume Version Linking States
  const [linkedResumes, setLinkedResumes] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem('atscore_linked_resumes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [pendingLinkSuggestion, setPendingLinkSuggestion] = useState<{
    newResume: Resume;
    existingResumes: Resume[];
  } | null>(null);

  const handleLinkResumes = (primaryResumeId: string, secondaryResumeIds: string[]) => {
    const updated = { ...linkedResumes };
    
    let existingGroupKey: string | null = null;
    for (const key of Object.keys(updated)) {
      const g = updated[key];
      if (g.includes(primaryResumeId) || secondaryResumeIds.some(id => g.includes(id))) {
        existingGroupKey = key;
        break;
      }
    }

    const groupKey = existingGroupKey || `gp_${Date.now()}`;
    const combined = [
      ...(updated[groupKey] || []),
      primaryResumeId,
      ...secondaryResumeIds
    ];
    // deduplicate
    updated[groupKey] = Array.from(new Set(combined));

    setLinkedResumes(updated);
    localStorage.setItem('atscore_linked_resumes', JSON.stringify(updated));
    setPendingLinkSuggestion(null);
    setApiSuccess('Successfully linked these resume versions to track their score progression together!');
  };

  // Load Initial Session
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      loadProfileAndDashboard();
    }

    // Subscribe to session logout notifications
    const handleLogout = () => {
      setUser(null);
      setCurrentView('landing');
      setApiError('Your session has expired. Please authenticate again.');
    };
    window.addEventListener('atscore_logout_event', handleLogout);

    // Simulated Landing Page score updates counter
    const counterInterval = setInterval(() => {
      setDemoCounter(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 4500);

    return () => {
      window.removeEventListener('atscore_logout_event', handleLogout);
      clearInterval(counterInterval);
    };
  }, []);

  const loadProfileAndDashboard = async () => {
    try {
      setLoading(true);
      const profileRes = await api.getProfile();
      setUser(profileRes.user);
      
      const resumeList = await api.getResumes();
      setResumes(resumeList);

      const analysisList = await api.getAnalyses();
      setAnalyses(analysisList);

      setCurrentView('dashboard');
    } catch (err: any) {
      console.warn('Silent session load failed:', err.message);
      clearAuthToken();
    } finally {
      setLoading(false);
    }
  };

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const payList = await api.getPaymentsHistory();
      setPayments(payList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAction = () => {
    clearAuthToken();
    setUser(null);
    setCurrentView('landing');
    setApiSuccess('Successfully logged out.');
  };

  // Error/Success Notification timers
  useEffect(() => {
    if (apiError) {
      const t = setTimeout(() => setApiError(null), 8500);
      return () => clearTimeout(t);
    }
  }, [apiError]);

  useEffect(() => {
    if (apiSuccess) {
      const t = setTimeout(() => setApiSuccess(null), 8500);
      return () => clearTimeout(t);
    }
  }, [apiSuccess]);

  // === AUTHENTICATION ACTIONS ===

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!authEmail || !authName || !authPassword) {
      setApiError('All signup credential fields are required.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.signup({
        email: authEmail,
        name: authName,
        password: authPassword
      });
      setVerificationEmail(authEmail);
      setVerificationOtp(res.sandboxOtp || ''); // Auto-fill OTP for effortless verification
      setSandboxOtp(res.sandboxOtp);
      verificationCompletedRef.current = false;
      setApiSuccess(res.message);
      // Auto-verify after a brief pause so the user sees the success message
      if (res.sandboxOtp) {
        autoVerifyTimerRef.current = setTimeout(async () => {
          if (verificationCompletedRef.current) return; // already verified manually
          try {
            const verifyRes = await api.verifyEmail({
              email: authEmail,
              otp: res.sandboxOtp
            });
            if (verificationCompletedRef.current) return;
            setUser(verifyRes.user);
            setApiSuccess('Account verified! Redirecting to dashboard...');
            loadProfileAndDashboard();
          } catch (err: any) {
            if (verificationCompletedRef.current) return;
            setApiError('Auto-verification failed. Click "Complete Registration" to verify.');
          }
        }, 1500);
      }
      setCurrentView('verify');
    } catch (err: any) {
      setApiError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCompletedRef.current) return; // prevent double-verify
    setApiError(null);
    if (!verificationOtp) {
      setApiError('Please enter the 6-digit numeric verification code.');
      return;
    }
    try {
      setLoading(true);
      verificationCompletedRef.current = true;
      // Cancel auto-verify if it's still pending
      if (autoVerifyTimerRef.current) {
        clearTimeout(autoVerifyTimerRef.current);
        autoVerifyTimerRef.current = null;
      }
      const res = await api.verifyEmail({
        email: verificationEmail,
        otp: verificationOtp
      });
      setUser(res.user);
      setApiSuccess(res.message);
      loadProfileAndDashboard();
    } catch (err: any) {
      verificationCompletedRef.current = false; // allow retry on failure
      setApiError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!authEmail || !authPassword) {
      setApiError('Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.login({ email: authEmail, password: authPassword });
      setUser(res.user);
      setApiSuccess(res.message);
      loadProfileAndDashboard();
    } catch (err: any) {
      setApiError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      setApiError('Please specify your registered email address first.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.forgotPassword({ email: authEmail });
      setVerificationEmail(authEmail);
      setSandboxOtp(res.sandboxOtp);
      setApiSuccess(res.message + ' Please inspect your developer logs.');
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationOtp || !authPassword) {
      setApiError('Both the OTP code and your new secure password are required.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.resetPassword({
        email: verificationEmail,
        otp: verificationOtp,
        newPassword: authPassword
      });
      setApiSuccess(res.message);
      setAuthPassword('');
      setCurrentView('login');
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === RESUME UPLOAD ACTIONS ===

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setApiError(null);
    const mime = file.type;
    const name = file.name;
    const ext = name.substring(name.lastIndexOf('.')).toLowerCase();

    if (ext !== '.pdf' && ext !== '.docx') {
      setApiError('Format mismatch error. ATScore supports .pdf and .docx documents only.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError('Metadata payload limit. Base file size cannot exceed 5MB.');
      return;
    }

    setUploadedFileName(name);
    
    // Convert to Base64 JSON
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64Str = res.substring(res.indexOf(',') + 1);
      setUploadedFileBase64(base64Str);
    };
    reader.readAsDataURL(file);
  };

  const handleSeedMockResume = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await api.seedMockResume();
      setApiSuccess(res.message);
      
      const freshResumes = await api.getResumes();
      setResumes(freshResumes);
      if (res.resume && res.resume.id) {
        setSelectedResumeId(res.resume.id);
      }
      setCurrentView('dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Seeding demo resume failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadedFileName || !uploadedFileBase64) {
      setApiError('Please select or drag-and-drop a valid document file.');
      return;
    }
    try {
      setLoading(true);
      setApiError(null);
      const res = await api.uploadResume(uploadedFileName, uploadedFileBase64);
      setApiSuccess(res.message);
      
      // reload lists
      const freshResumes = await api.getResumes();
      
      const uploadedDoc = freshResumes.find((r: Resume) => r.id === res.resume.id);
      if (uploadedDoc) {
        const existingDocs = resumes.filter(r => r.id !== uploadedDoc.id);
        const matches = findVersionMatches(uploadedDoc, existingDocs);
        if (matches.length > 0) {
          setPendingLinkSuggestion({
            newResume: uploadedDoc,
            existingResumes: matches
          });
        }
      }

      setResumes(freshResumes);
      
      // Auto assign selecting index
      setSelectedResumeId(res.resume.id);
      
      // Clear variables
      setUploadedFileName('');
      setUploadedFileBase64('');

      setCurrentView('dashboard');
    } catch (err: any) {
      setApiError(err.message || 'File parsing collapsed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you of absolute intent to delete this resume? This deletes all associated score analyses.')) return;
    try {
      setLoading(true);
      await api.deleteResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      // Refresh analyses too
      const freshAnalyses = await api.getAnalyses();
      setAnalyses(freshAnalyses);
      setApiSuccess('File removed successfully.');
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === RESUME GRADING RUN ===

  const handleTriggerAnalysis = async () => {
    setApiError(null);
    if (!selectedResumeId) {
      setApiError('A selected parsed resume from your folder is required.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.runAnalysis({
        resumeId: selectedResumeId,
        jdText: targetJdText,
        track: selectedTrack
      });

      // Reload lists
      const list = await api.getAnalyses();
      setAnalyses(list);

      // Open scoreboard report page
      setSelectedAnalysis(res.analysis);
      setCurrentView('scoreboard');
      setApiSuccess('Core grading metrics generated successfully. 0.0s AI cost spent.');
    } catch (err: any) {
      if (err.message.includes('LIMIT_EXCEEDED')) {
        setApiError('Analyses Quota overlimit. Upgrade subscription to activate unlimited processing.');
      } else {
        setApiError(err.message || 'Analysis operation failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAIDeepFeedback = async () => {
    if (!selectedAnalysis) return;
    try {
      setAiLoading(true);
      setApiError(null);
      const res = await api.triggerAIFeedback(selectedAnalysis.id);
      setSelectedAnalysis(res.updatedAnalysis);
      setApiSuccess('AI Deep Review compiled successfully. Zero overall costs.');
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const generateDefaultLinkedInPost = (analysis: Analysis) => {
    const trackName = TRACK_DETAILS[analysis.track]?.name || 'Professional Track';
    const score = analysis.total_score;
    const grade = score >= 80 ? 'A' : score >= 67 ? 'B' : score >= 52 ? 'C' : score >= 38 ? 'D' : 'F';
    
    let strengthsText = '';
    const positives = analysis.score_breakdown?.india?.positives;
    if (positives && positives.length > 0) {
      strengthsText = positives.slice(0, 2).map((item: string) => `• ${item}`).join('\n');
    } else {
      strengthsText = `• Verified resume format layout integrity\n• Targeted density for core field-specific keywords`;
    }

    return `🚀 I just evaluated my resume using ATScore India's calibrated job-market optimizer!

📈 Assessment Breakdown:
• ATS Score: ${score}/100
• Grade: ${grade}
• Calibrated Track: ${trackName}

💡 Verified Strengths:
${strengthsText}

🎯 Preparing actively for opportunities with Indian recruiters! Highly recommend checking out ATScore India if you want to optimize your CV visibility for naukri.com crawlers, TCS iON gates, or Indian tech giants.

#CareerDevelopment #IndiaJobs #ResumeOptimizer #ATSScoreIndia #CareerGrowth #Hiring`;
  };

  const openLinkedInShareModal = () => {
    if (!selectedAnalysis) return;
    const initialText = generateDefaultLinkedInPost(selectedAnalysis);
    setShareText(initialText);
    setCopiedState(false);
    setIsShareModalOpen(true);
  };

  const handleCopyShareText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      setApiError('Failed to copy text to clipboard. Please select and copy manually.');
    }
  };

  const handleLinkedInShareNav = () => {
    const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  // === NAUKRI OPTIMIZER FLOW ===

  const handleNaukriSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naukriHeadline || !naukriSummary) {
      setApiError('Both profile headline and biography summary are mandatory items.');
      return;
    }
    try {
      setLoading(true);
      setApiError(null);
      const res = await api.submitNaukriProfile({
        headline: naukriHeadline,
        summary: naukriSummary,
        skills: naukriSkills,
        noticePeriod: naukriNotice,
        expectedCTC: naukriCTC,
        currentLocation: naukriLocation,
        education: 'B.Tech Engineering',
        experience: '3 Years'
      });
      setNaukriAnalysisResult(res);
      setApiSuccess('Naukri search crawler model metrics updated.');
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadLatestNaukriProfile = async () => {
    try {
      const res = await api.getLatestNaukriProfile();
      setNaukriHeadline(res.profile_data.headline || '');
      setNaukriSummary(res.profile_data.summary || '');
      setNaukriSkills(res.profile_data.skills || '');
      setNaukriNotice(res.profile_data.noticePeriod || '');
      setNaukriCTC(res.profile_data.expectedCTC || '');
      setNaukriLocation(res.profile_data.currentLocation || '');
      setNaukriAnalysisResult(res);
    } catch (err) {
      // safe bypass
    }
  };

  // === BYOK SETTINGS ACTIONS ===

  const handleSaveByok = async () => {
    setApiError(null);
    if (!byokKey) {
      setApiError('Key field is empty.');
      return;
    }
    try {
      setByokSaving(true);
      const res = await api.saveByokKey(byokKey);
      setApiSuccess(res.message);
      setByokKey('');
      // update state
      if (user) {
        setUser({ ...user, has_byok: true });
      }
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setByokSaving(false);
    }
  };

  const handleRemoveByok = async () => {
    if (!confirm('Are you absolutely certain to disconnect your personal OpenAI key? Deep analysis will fall back to Platform Gemini.')) return;
    try {
      setLoading(true);
      const res = await api.removeByokKey();
      setApiSuccess(res.message);
      if (user) {
        setUser({ ...user, has_byok: false });
      }
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // === PAYMENT MOCK PORTAL INTEGRATION ===

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleTriggerPremiumUpgrade = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const res = await api.createBillingOrder(selectedPlan);

      const planLabel = selectedPlan === 'monthly' ? 'Monthly Premium Plan' : 'Yearly Premium Plan';
      const planDesc = selectedPlan === 'monthly'
        ? 'Monthly Premium - Unlimited Resume Scoring'
        : 'Yearly Premium Plan - Unlimited Resume Scoring';

      // Real Razorpay Checkout integration
      const options = {
        key: res.keyId,
        amount: res.amount,
        currency: res.currency || 'INR',
        name: 'ATScore India',
        description: planDesc,
        order_id: res.orderId,
        prefill: {
          name: res.user?.name || '',
          email: res.user?.email || ''
        },
        theme: {
          color: '#f97316'
        },
        modal: {
          ondismiss: () => {
            setApiError('Payment cancelled. You can upgrade anytime.');
            setLoading(false);
          }
        },
        handler: async (response: any) => {
          try {
            setLoading(true);
            const verifyRes = await api.verifyBillingPayment({
              orderId: res.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            setApiSuccess('🎉 ' + planLabel + ' activated! Unlimited analyses + AI feedbacks unlocked.');
            loadProfileAndDashboard();
          } catch (err: any) {
            setApiError(err.message || 'Payment verification failed');
            setLoading(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setApiError(err.message);
      setLoading(false);
    }
  };

  // Reset counters for convenient testing play
  const handleResetQuotaCounter = async () => {
    try {
      setLoading(true);
      const res = await api.resetTodayUsageLimit();
      setApiSuccess(res.message);
      if (user) {
        setUser({ ...user, analyses_used_today: 0 });
      }
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-gray-100 flex flex-col font-sans transition-all duration-300">

      {currentView === 'landing' ? (
        <Helmet>
          <title>ATScore India — ATS Resume Scorer Calibrated for Indian Jobs</title>
          <meta name="description" content="Score your resume for Indian jobs with a 100-point ATS checker calibrated for TCS, Infosys, Naukri.com, FAANG India, and Indian startups. AI feedback, STAR bullet rewrites, keyword injection, interview prep." />
          <link rel="canonical" href="https://atscore.harmnix.com/" />
          <meta property="og:url" content="https://atscore.harmnix.com/" />
          <meta property="og:title" content="ATScore India — ATS Resume Scorer Calibrated for Indian Jobs" />
          <meta property="og:description" content="100-point ATS resume scorer built for the Indian hiring ecosystem. 5 tracks: Mass Hiring, Naukri.com, FAANG India, Indian Startups, Consulting MNC." />
        </Helmet>
      ) : currentView === 'shared_report' ? (
        <Helmet>
          <title>ATS Resume Score Report — ATScore India</title>
          <meta name="description" content="View this ATS resume score report generated by ATScore India — 100-point breakdown calibrated for the Indian job market." />
          <meta name="robots" content="index, follow" />
        </Helmet>
      ) : (
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
      )}

      {/* GLOBAL ERROR/SUCCESS ALERTS */}
      <AnimatePresence>
        {apiError && (
          <motion.div 
            initial={{ translateY: -80, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -80, opacity: 0 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-red-950 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-display font-medium text-red-400">Execution Error</h4>
              <p className="text-xs text-red-200 mt-1">{apiError}</p>
            </div>
            <button onClick={() => setApiError(null)} className="text-red-400 hover:text-red-100 text-xs font-mono font-bold">dismiss</button>
          </motion.div>
        )}

        {apiSuccess && (
          <motion.div 
            initial={{ translateY: -80, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            exit={{ translateY: -80, opacity: 0 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg bg-emerald-950 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-display font-medium text-emerald-400">Success</h4>
              <p className="text-xs text-emerald-200 mt-1">{apiSuccess}</p>
            </div>
            <button onClick={() => setApiSuccess(null)} className="text-emerald-400 hover:text-emerald-100 text-xs font-mono font-bold">dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVIGATION BAR */}
      <header className="border-b border-brand-border bg-brand-bg/95 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView(user ? 'dashboard' : 'landing')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-accent-primary to-orange-500 flex items-center justify-center shadow-lg shadow-orange-950/40">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-white tracking-tight shrink-0 flex items-center gap-1.5">
              ATScore <span className="text-xs px-2 py-0.5 rounded bg-orange-950/50 text-accent-primary border border-accent-primary/20">INDIA</span>
            </span>
            <p className="text-[10px] font-mono text-gray-500 tracking-wider">CALIBRATED ASSESSMENT</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-brand-border bg-brand-surface/80 hover:bg-brand-surface text-gray-400 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            id="btn-theme-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 bg-brand-surface/80 px-3 py-1.5 rounded-lg border border-brand-border font-mono hidden sm:inline">
                {user.plan === 'paid' ? '⭐ PREMIUM' : 'FREE USER'}
              </span>
              <button 
                onClick={handleLogoutAction} 
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
                id="btn-logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {currentView !== 'landing' && (
                <button onClick={() => setCurrentView('landing')} className="text-xs font-medium text-gray-400 hover:text-white">Home</button>
              )}
              <button 
                onClick={() => setCurrentView('login')} 
                className="px-4 py-2 text-xs font-medium font-display text-gray-200 border border-brand-border rounded-xl hover:bg-brand-surface transition"
                id="btn-nav-login"
              >
                Log In
              </button>
              <button 
                onClick={() => setCurrentView('signup')} 
                className="px-4 py-2 text-xs font-medium font-display text-white bg-accent-primary rounded-xl shadow-lg shadow-orange-950/40 hover:bg-orange-600 transition"
                id="btn-nav-signup"
              >
                Score Resume Free
              </button>
            </div>
          )}
        </div>
      </header>

      {/* CORE FRAMEWORK WORKSPACE */}
      <main className="flex-1 flex flex-col">
        {loading && (
          <div className="fixed inset-0 bg-brand-bg/85 z-50 flex flex-col items-center justify-center p-4">
            <RefreshCw className="w-10 h-10 text-accent-primary animate-spin mb-4" />
            <h3 className="font-display text-lg font-bold text-white tracking-tight">Syncing files database...</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm text-center">Formulating algorithms matrices, checking notice segments, and preparing scores reports.</p>
          </div>
        )}

        {/* 1. PUBLIC MARKETING LANDING PAGE */}
        {currentView === 'landing' && (
          <div className="flex-1">
            {/* Hero Block */}
            <div className="relative py-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.07)_0,transparent_100%)]" />
              
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-950/30 border border-accent-primary/20 text-xs font-medium font-display text-accent-primary tracking-wide mb-6">
                <Sparkles className="w-3.5 h-3.5 text-accent-primary" />
                Calibrated Core Indian Job Market Intelligence Engine
              </div>

              <h1 className="font-display font-bold text-4xl sm:text-6xl tracking-tight text-white max-w-4xl leading-[1.08] lg:leading-[1.05]">
                ATS Resume Scorer <br />
                <span className="bg-gradient-to-r from-accent-primary to-orange-500 bg-clip-text text-transparent">Built for the Indian Job Market.</span>
              </h1>
              
              <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mt-6 leading-relaxed">
                The only ATS scorer adjusted for Naukri crawler bots, TCS iON cutoff forms, and FAANG India impact guidelines. Not global US rules — real Indian corporate benchmarks.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
                <button 
                  onClick={() => setCurrentView('signup')} 
                  className="w-full sm:w-auto px-8 py-4 text-sm font-semibold font-display text-white bg-accent-primary rounded-2xl shadow-xl shadow-orange-950/40 hover:bg-orange-600 transition flex items-center justify-center gap-2 group"
                  id="btn-hero-cta"
                >
                  Analyze My Resume Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="text-xs font-mono text-gray-500">
                  ⚡ <span className="text-white font-semibold">{demoCounter.toLocaleString()}+</span> Indian CVs scored
                </div>
              </div>

              {/* Indian Reality vs Global US Advice Grid */}
              <div className="w-full mt-24">
                <h2 className="font-display font-bold text-2xl text-white mb-2 tracking-tight">The "Global Resume Advice" Trap</h2>
                <p className="text-xs text-gray-400 mb-10 max-w-xl mx-auto">Why standard tools (Zety, ResumeWorded) calibrated for US hiring give counterproductive advice in Noida, Pune, Delhi NCR, and Bangalore.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border/60 text-left">
                    <span className="text-xs font-mono uppercase tracking-wider text-red-500 font-bold flex items-center gap-1.5 mb-3">
                      <XCircle className="w-4 h-4" /> Global US / EU Recommendation
                    </span>
                    <h3 className="font-display font-semibold text-white">"Remove CGPA & Academic Percentages"</h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      Western tools claim academic marks do not matter. In India, massive service operators (TCS, Infosys, Cognizant) automatically filter profiles using grades. They auto-reject resumes leaving CGPA fields blank.
                    </p>
                  </div>

                  <div className="bg-brand-surface p-6 rounded-2xl border border-accent-primary/20 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 -z-10 blur-xl rounded-full" />
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold flex items-center gap-1.5 mb-3">
                      <CheckCircle className="w-4 h-4" /> ATScore India Adaptation
                    </span>
                    <h3 className="font-display font-semibold text-white">"Academic Gates Enforcement Verification"</h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      Our system checks your exact education grades format, reviews IIT/NIT/private pedigree indexes, flags 10th/12th percentages for mass systems, and details how to avoid auto-rejection pools.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tracks Section */}
              <div className="w-full mt-24 text-left">
                <h2 className="font-display font-bold text-2xl text-white text-center mb-10 tracking-tight">5 Specialized Grading Tracks</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {Object.values(TRACK_DETAILS).map((track: TrackConfig) => (
                    <div key={track.key} className="bg-brand-surface p-6 rounded-2xl border border-brand-border hover:border-accent-primary/20 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-brand-bg border border-brand-border">
                          {track.logoText}
                        </span>
                        <Zap className="w-4 h-4 text-orange-400" />
                      </div>
                      <h3 className="font-display font-bold text-white text-base leading-snug">{track.name}</h3>
                      <p className="text-[11px] font-mono text-gray-400 mt-1 mb-3">{track.companies}</p>
                      <p className="text-xs text-gray-400 leading-relaxed bg-brand-bg/40 p-3 rounded-xl border border-brand-border/40">
                        {track.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value prop cards */}
              <div className="w-full mt-24 py-12 rounded-3xl bg-gradient-to-b from-brand-surface to-brand-bg border border-brand-border/60 max-w-4xl mx-auto">
                <h2 className="font-display font-bold text-xl text-accent-primary mb-6">Designed For Indian Placement Budgets</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-8 text-left">
                  <div>
                    <h3 className="font-display font-semibold text-white text-sm">International Scanners are Expensive</h3>
                    <p className="text-xs text-gray-400 mt-1">Premium global platforms charge up to ₹2,500/month. ATScore India provides complete unhindered testing logs for just ₹79/month or ₹799/year. One placement shortlist pays for itself.</p>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-white text-sm">Naukri Optimization Packages</h3>
                    <p className="text-xs text-gray-400 mt-1">Portal consultants take thousand-rupee commissions to rewrite CV heads. Our integrated Naukri Optimizer reviews your crawler visibility indexes immediately for free.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public footer */}
            <footer className="border-t border-brand-border bg-brand-surface/40 py-8 px-6 mt-20 text-center">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <span className="text-xs text-gray-500 font-mono">ATScore India © 2026. Built with Antigravity AI Studio Developer Suite.</span>
                <div className="flex gap-4 text-xs text-gray-400 font-display">
                  <span>Terms Of Service</span>
                  <span>Contact Helpline</span>
                </div>
              </div>
            </footer>
          </div>
        )}

        {/* 2. AUTHENTICATION PAGES */}
        {(currentView === 'login' || currentView === 'signup' || currentView === 'verify') && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <div className="absolute inset-x-0 top-1/4 -translate-y-1/2 -z-10 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.04)_0,transparent_100%)] w-96 h-96 mx-auto blur-xl" />

            <div className="w-full max-w-md bg-brand-surface p-8 rounded-2xl border border-brand-border shadow-2xl relative">
              
              {currentView === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-display text-2xl font-bold text-white tracking-tight">Create your account</h2>
                    <p className="text-xs text-gray-400 mt-1">Get custom India-calibrated resume critiques</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Full Name</label>
                    <input 
                      type="text" 
                      value={authName}
                      onChange={e => setAuthName(e.target.value)}
                      placeholder="e.g. Aditya Sharma" 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Email Address</label>
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      placeholder="aditya@example.com" 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Password</label>
                    <input 
                      type="password" 
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      placeholder="Min 6 characters" 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full px-4 py-3 text-xs font-semibold text-white bg-accent-primary rounded-xl shadow-lg hover:bg-orange-600 transition"
                    id="btn-signup-submit"
                  >
                    Generate Free Verification Core
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    Already have an account?{' '}
                    <span onClick={() => setCurrentView('login')} className="text-accent-primary cursor-pointer hover:underline">Log In</span>
                  </p>
                </form>
              )}

              {currentView === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="text-center">
                    <h2 className="font-display text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                    <p className="text-xs text-gray-400 mt-1">Accelerate your resume shortenings</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Email Address</label>
                    <input 
                      type="email" 
                      value={authEmail}
                      onChange={e => setAuthEmail(e.target.value)}
                      placeholder="aditya@example.com" 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-gray-400 font-medium">Password</label>
                      <span onClick={handleForgotPassword} className="text-[11px] text-accent-primary cursor-pointer hover:underline">Forgot password?</span>
                    </div>
                    <input 
                      type="password" 
                      value={authPassword}
                      onChange={e => setAuthPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full px-4 py-3 text-xs font-semibold text-white bg-accent-primary rounded-xl shadow-lg hover:bg-orange-600 transition"
                    id="btn-login-submit"
                  >
                    Verify & Enter Dashboard
                  </button>

                  <p className="text-xs text-center text-gray-400">
                    Don't have an account?{' '}
                    <span onClick={() => setCurrentView('signup')} className="text-accent-primary cursor-pointer hover:underline">Sign Up free</span>
                  </p>
                </form>
              )}

              {currentView === 'verify' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white tracking-tight">Almost there!</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      We've sent a verification code to <strong className="text-white">{verificationEmail}</strong>.
                      {sandboxOtp ? ' Click below to complete registration instantly.' : ''}
                    </p>
                  </div>

                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    {/* Hidden auto-filled OTP field */}
                    <input type="hidden" value={verificationOtp} readOnly />
                    
                    {sandboxOtp && (
                      <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2">
                        <p className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                          ✓ Verification code ready
                        </p>
                        <p className="text-3xl font-bold tracking-widest text-white font-mono">
                          {sandboxOtp}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          This code has been pre-filled. Click the button below to complete registration.
                        </p>
                      </div>
                    )}

                    {/* Fallback manual input in case auto-fill doesn't work */}
                    {!sandboxOtp && (
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400 font-medium">6-Digit Verification Code</label>
                        <input 
                          type="text" 
                          value={verificationOtp}
                          onChange={e => setVerificationOtp(e.target.value)}
                          placeholder="e.g. 123456" 
                          className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-white focus:outline-none focus:border-accent-primary"
                          maxLength={6}
                          required
                        />
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="w-full px-4 py-3 text-sm font-semibold text-white bg-accent-primary rounded-xl shadow-lg hover:bg-orange-600 transition flex items-center justify-center gap-2"
                      id="btn-verify-otp"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {sandboxOtp ? 'Complete Registration → Dashboard' : 'Verify Email'}
                    </button>

                    {sandboxOtp && (
                      <p className="text-[10px] text-gray-500 text-center">
                        Didn't auto-verify?{' '}
                        <button type="submit" className="text-accent-primary hover:underline" onClick={handleVerifyEmail}>
                          Click here to verify manually
                        </button>
                      </p>
                    )}
                  </form>

                  {/* Password reset sub-form toggle flow checking */}
                  <form onSubmit={handlePasswordResetComplete} className="space-y-4 border-t border-brand-border/40 pt-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Alternatively: Recover credentials password</p>
                    
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-medium font-display">New Secure Password</label>
                      <input 
                        type="password" 
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        placeholder="New Password" 
                        className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white border border-brand-border hover:bg-brand-surface rounded-xl transition"
                    >
                      Authorize Recover Password Reset
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PUBLICLY SHARED REPORT DETAIL VIEW */}
        {currentView === 'shared_report' && publicSharedAnalysis && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 space-y-8"
          >
            {/* Header Branding Banner */}
            <div className="bg-brand-surface border border-indigo-500/30 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-950 text-indigo-400 font-mono font-bold tracking-wider uppercase">
                  ✓ VERIFIED ATS ANALYSIS CERTIFICATE
                </span>
                <h2 className="font-display font-extrabold text-2xl tracking-tight text-white mt-2">
                  {publicSharedAnalysis.resume_name}
                </h2>
                <p className="text-xs text-gray-400 font-display mt-1">
                  Public profile credential scored under the <strong className="text-gray-200">{TRACK_DETAILS[publicSharedAnalysis.track]?.name}</strong> validation criteria.
                </p>
              </div>

              <div>
                <button 
                  onClick={() => {
                    // Check if they are logged in or not
                    if (user) {
                      setCurrentView('dashboard');
                    } else {
                      setCurrentView('landing');
                    }
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition"
                >
                  {user ? 'Go to Dashboard Hub' : 'Scorer Homepage'}
                </button>
              </div>
            </div>

            {/* Circular scoreboard hero panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {/* Large Gauge Panel */}
              <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border flex flex-col justify-center items-center shadow-md">
                <ScoreGauge 
                  score={publicSharedAnalysis.total_score} 
                  grade={publicSharedAnalysis.total_score >= 80 ? 'A' : publicSharedAnalysis.total_score >= 67 ? 'B' : 'C'} 
                />
                <div className="text-center mt-2 border-t border-brand-border/40 pt-4 w-full">
                  <p className="text-xs font-mono text-gray-400 font-bold">VERDICT RESOLUTION</p>
                  <p className="text-sm font-semibold tracking-tight text-white mt-1 leading-snug">
                    {publicSharedAnalysis.score_breakdown.india.cgpa !== null ? `CGPA: ${publicSharedAnalysis.score_breakdown.india.cgpa.toFixed(2)}/10` : 'No CGPA Identified'}
                  </p>
                  <p className="text-xs font-mono text-accent-green mt-1">Tier: {publicSharedAnalysis.score_breakdown.india.collegeTier || 'UNKNOWN'}</p>
                </div>
              </div>

              {/* Score Breakdown horizontal charts */}
              <div className="md:col-span-2 bg-brand-surface p-6 rounded-3xl border border-brand-border flex flex-col justify-between shadow-md">
                <div>
                  <h3 className="font-display font-semibold text-white mb-6">Component Breakdown Analytics</h3>
                  <div className="space-y-4">
                    <MetricBar 
                      label="Formatting Standards & Layout Integrity" 
                      score={publicSharedAnalysis.format_score} 
                      max={20} 
                      colorClass="bg-brand-border/80" 
                    />
                    <MetricBar 
                      label="Core Resume Segment Completed" 
                      score={publicSharedAnalysis.sections_score} 
                      max={20} 
                      colorClass="bg-blue-500" 
                    />
                    <MetricBar 
                      label="Target Keywords Density Match" 
                      score={publicSharedAnalysis.keywords_score} 
                      max={30} 
                      colorClass="bg-purple-500" 
                    />
                    <MetricBar 
                      label="India-corridors Intelligence cutoffs alignment" 
                      score={publicSharedAnalysis.india_score} 
                      max={30} 
                      colorClass="bg-orange-500" 
                    />
                  </div>
                </div>

                <div className="text-xs font-mono text-gray-400 mt-6 border-t border-brand-border/40 pt-4 flex justify-between items-center">
                  <span>⚙️ Verified and indexed automatically under real job market criteria.</span>
                  <span className="text-indigo-400 font-bold">ATScore India Verified</span>
                </div>
              </div>
            </div>

            {/* Keyword gaps and matches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 shadow-md">
                <h3 className="font-display font-bold text-xs text-emerald-400 uppercase tracking-lighter">Identified Strengths & Matches</h3>
                <div className="flex flex-wrap gap-2">
                  {publicSharedAnalysis.keyword_matches.length === 0 ? (
                    <span className="text-xs text-gray-500 italic">No matches listed.</span>
                  ) : (
                    publicSharedAnalysis.keyword_matches.map((kw, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-mono font-medium">{kw}</span>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 shadow-md">
                <h3 className="font-display font-bold text-xs text-red-400 uppercase tracking-lighter font-mono">Prescribed Area Improvement Gaps</h3>
                <div className="flex flex-wrap gap-2">
                  {publicSharedAnalysis.keyword_gaps.length === 0 ? (
                    <span className="text-xs text-gray-500 italic font-mono">No direct keyword gaps found in track indexing.</span>
                  ) : (
                    publicSharedAnalysis.keyword_gaps.map((gap, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-red-950/40 text-red-400 border border-red-500/20 font-mono font-medium">{gap}</span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 shadow-md">
              <h3 className="font-display font-bold text-lg text-white">Branding & Alignment Action Plan</h3>
              <div className="space-y-3">
                {publicSharedAnalysis.recommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-brand-bg/40 border border-brand-border/60 rounded-xl flex gap-3 items-start">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase shrink-0 mt-0.5 ${
                      rec.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/20' :
                      rec.priority === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-500/20' :
                      'bg-slate-900 text-slate-400'
                    }`}>
                      {rec.priority}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">{rec.action}</h4>
                      <p className="text-gray-400 text-xs mt-1 leading-relaxed">{rec.why}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details parameter checklist */}
            <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 shadow-md">
              <h3 className="font-display font-bold text-lg text-white">Step-by-Step Scoring Parameters Review</h3>
              
              <div className="space-y-3 select-none">
                {/* Format category */}
                <div className="border border-brand-border/60 rounded-xl overflow-hidden font-display">
                  <div 
                    onClick={() => setExpandedSection(expandedSection === 'format' ? null : 'format')}
                    className="bg-brand-bg/40 p-4 flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-xs font-bold text-gray-200">Formatting layout & tables check (Score: {publicSharedAnalysis.format_score}/20)</span>
                    {expandedSection === 'format' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                  
                  {expandedSection === 'format' && (
                    <div className="p-4 bg-brand-bg/25 border-t border-brand-border/40 space-y-3.5">
                      {publicSharedAnalysis.score_breakdown.format.breakdown.map((item, idx) => (
                        <div key={idx} className="flex gap-3 start text-xs">
                          {item.passed ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                          <div>
                            <h4 className="font-semibold text-white">{item.label}</h4>
                            <p className="text-gray-400 mt-0.5">{item.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Sign-up CTA Banner */}
            <div className="bg-gradient-to-r from-accent-primary/10 via-orange-950/20 to-indigo-950/20 border border-brand-border p-8 rounded-3xl text-center space-y-4 shadow-xl">
              <p className="text-xs font-mono tracking-widest text-accent-primary uppercase font-bold">WANT TO RUN YOUR OWN ATS ASSESSMENT?</p>
              <h3 className="font-display font-extrabold text-2xl text-white max-w-xl mx-auto leading-tight">
                Instantly scan format standards, keyword coverage rates, and India job gateways rules.
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No subscription requested for standard reports. Check notice periods criteria, CGPA limits, and Naukri optimization in less than 5 seconds.
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => {
                    setPublicSharedAnalysis(null);
                    setCurrentView('signup');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-accent-primary to-orange-500 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  Create Your Free Scorer Account Now
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. PROTECTED DASHBOARD AND MANAGEMENT RAIL DESKTOP VIEWS */}
        {user && (
          <div className="flex-1 flex flex-col md:flex-row">
            
            {/* IN-APP DASHBOARD SIDEBAR PANEL */}
            <aside className="w-full md:w-64 bg-brand-surface border-b md:border-b-0 md:border-r border-brand-border flex flex-col justify-between shrink-0 shrink-0 select-none">
              <div className="p-4 space-y-6">
                
                {/* Simplified profile widget */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-bg/50 border border-brand-border/60">
                  <div className="w-9 h-9 rounded-full bg-accent-primary/20 border border-accent-primary/20 flex items-center justify-center font-display font-bold text-accent-primary text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-semibold text-white truncate">{user.name}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Dashboard core navigation */}
                <nav className="space-y-1 font-display">
                  <button 
                    onClick={() => { setCurrentView('dashboard'); setSelectedAnalysis(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <Sliders className="w-4 h-4 shrink-0" />
                    Dashboard Index
                  </button>

                  <button 
                    onClick={() => setCurrentView('resumes')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'resumes' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    My Resume Folder
                  </button>

                  <button 
                    onClick={() => setCurrentView('naukri_view')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'naukri_view' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                    id="nav-naukri"
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    Naukri Crawl Optimizer
                  </button>

                  <button 
                    onClick={() => setCurrentView('premium_toolkit')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'premium_toolkit' ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                    id="nav-premium-toolkit"
                  >
                    <Zap className="w-4 h-4 shrink-0 text-indigo-400" />
                    Premium AI Toolkit Hub
                  </button>

                  {/* Job Search Suite */}
                  <div className="pt-4 pb-1">
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider px-3">Job Search Suite</p>
                  </div>

                  <button 
                    onClick={() => setCurrentView('cover-letters')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'cover-letters' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    Cover Letters
                  </button>

                  <button 
                    onClick={() => setCurrentView('tracker')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'tracker' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    Application Tracker
                  </button>

                  <button 
                    onClick={() => setCurrentView('resume-tailor')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'resume-tailor' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    Resume Tailor
                  </button>

                  <button 
                    onClick={() => setCurrentView('linkedin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'linkedin' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <Linkedin className="w-4 h-4 shrink-0" />
                    LinkedIn Generator
                  </button>

                  <button 
                    onClick={() => setCurrentView('offer-analyzer')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'offer-analyzer' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <Zap className="w-4 h-4 shrink-0" />
                    Offer Analyzer
                  </button>

                  <button 
                    onClick={() => { setCurrentView('settings_view'); loadSettingsData(); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${currentView === 'settings_view' ? 'bg-accent-primary/10 text-accent-primary border-l-2 border-accent-primary' : 'text-gray-400 hover:bg-brand-bg hover:text-white'}`}
                  >
                    <Settings className="w-4 h-4 shrink-0" />
                    Bring Your Own Key & Settings
                  </button>
                </nav>
              </div>

              {/* Sidebar Upgrade CTA and quota indicator */}
              <div className="p-4 border-t border-brand-border/40 space-y-3.5">
                <div className="space-y-1 bg-brand-bg p-3 rounded-xl border border-brand-border/40">
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>DAILY QUOTA</span>
                    <span>{user.plan === 'paid' ? 'UNLIMITED' : `${user.analyses_used_today} / 2 USED`}</span>
                  </div>
                  <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-primary rounded-full"
                      style={{ width: `${user.plan === 'paid' ? 100 : (user.analyses_used_today / 2) * 100}%` }}
                    />
                  </div>
                  {user.plan === 'free' && (
                    <span onClick={handleResetQuotaCounter} className="text-[9px] font-mono hover:underline cursor-pointer block mt-1 text-gray-500">
                      🔄 Reset count limit (Dev playground tool)
                    </span>
                  )}
                </div>

                {user.plan === 'free' && (
                  <div className="space-y-2">
                    {/* Plan Toggle */}
                    <div className="flex rounded-xl overflow-hidden border border-brand-border bg-brand-bg p-0.5">
                      <button
                        onClick={() => setSelectedPlan('monthly')}
                        className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition-all ${
                          selectedPlan === 'monthly'
                            ? 'bg-accent-primary text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Monthly ₹79
                      </button>
                      <button
                        onClick={() => setSelectedPlan('yearly')}
                        className={`flex-1 text-[10px] font-semibold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                          selectedPlan === 'yearly'
                            ? 'bg-accent-primary text-white shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Yearly ₹799
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1 rounded">Save 16%</span>
                      </button>
                    </div>
                    <button 
                      onClick={handleTriggerPremiumUpgrade}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[11px] font-bold text-white bg-gradient-to-r from-accent-primary to-orange-500 rounded-xl hover:opacity-90 shadow-xl shadow-orange-950/20"
                      id="btn-sidebar-upgrade"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Upgrade to {selectedPlan === 'monthly' ? 'Monthly' : 'Yearly'} Pro
                    </button>
                  </div>
                )}
              </div>
            </aside>

            {/* MAIN PORTLET CONTAINER SCENE */}
            <div className="flex-1 overflow-y-auto px-6 py-8 relative">
              <div className="max-w-5xl mx-auto space-y-8">
                
                {/* 3.1 ACTIVE SUMMARY INSIGHTS DASHBOARD */}
                {currentView === 'dashboard' && (
                  <motion.div 
                    initial={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="space-y-8"
                  >
                    {/* Welcome headliner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className="font-display font-extrabold text-3xl tracking-tight text-white mb-1">ATScore Hub Dashboard</h2>
                        <p className="text-xs text-gray-400">Score, align metrics, and verify shortlist indexing for Indian recruiting portals.</p>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCurrentView('upload_view')}
                          className="px-4 py-2.5 text-xs font-semibold font-display text-white bg-accent-primary rounded-xl shadow-lg hover:bg-orange-600 transition flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload parsed resume
                        </button>
                        <button 
                          onClick={() => setCurrentView('analyze_view')}
                          className="px-4 py-2.5 text-xs font-semibold font-display text-white bg-emerald-600 rounded-xl hover:bg-emerald-500 transition flex items-center gap-2"
                          id="btn-nav-analyze"
                        >
                          <Sliders className="w-4 h-4" />
                          Grade Resume
                        </button>
                      </div>
                    </div>

                    {/* VERSION LINK SUGGESTION BANNER */}
                    {pendingLinkSuggestion && (
                      <motion.div 
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="bg-[#1e1b4b]/60 border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        id="version-link-suggestion-banner"
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/25 text-indigo-400 shrink-0">
                            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              Version Progression Detected!
                            </h4>
                            <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                              It looks like your newly uploaded <span className="text-[#a5b4fc] font-semibold">"{pendingLinkSuggestion.newResume.name}"</span> is a newer iteration/version of your existing resume folder document(s):
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {pendingLinkSuggestion.existingResumes.map(r => (
                                <span key={r.id} className="text-[10px] font-mono font-semibold bg-[#0f172a] border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-md">
                                  {r.name}
                                </span>
                              ))}
                            </div>
                            <p className="text-[10px] text-indigo-400 font-medium mt-1.5">
                              Linking them groups their historical score analyses so you can view an exclusive progress timeline trend!
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            onClick={() => setPendingLinkSuggestion(null)}
                            className="px-3 py-1.5 text-xs text-indigo-300 hover:text-white transition rounded-xl font-semibold"
                          >
                            Ignore
                          </button>
                          <button
                            onClick={() => handleLinkResumes(
                              pendingLinkSuggestion.newResume.id, 
                              pendingLinkSuggestion.existingResumes.map(r => r.id)
                            )}
                            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-950/50 transition flex items-center gap-1.5"
                          >
                            <Link className="w-3.5 h-3.5" />
                            Link Versions & Track Progress
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Numeric stats bento summary row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border flex items-center gap-4 hover-glow transition-all duration-300">
                        <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-accent-primary/25 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 tracking-wider font-mono">PARSED DOCUMENTS</span>
                          <h4 className="text-2xl font-black font-mono text-white mt-0.5">{resumes.length}</h4>
                        </div>
                      </div>

                      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border flex items-center gap-4 hover-glow transition-all duration-300">
                        <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-center shrink-0">
                          <Sliders className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 tracking-wider font-mono">SCORINGS RUN</span>
                          <h4 className="text-2xl font-black font-mono text-white mt-0.5">{analyses.length}</h4>
                        </div>
                      </div>

                      <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border flex items-center gap-4 hover-glow transition-all duration-300">
                        <div className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <TrendingUp className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 tracking-wider font-mono">PEAK RATED REPORT</span>
                          <h4 className="text-2xl font-black font-mono text-white mt-0.5">
                            {analyses.length > 0 ? Math.max(...analyses.map(a => a.total_score)) : 'N/A'}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <ScoreTrendChart 
                      analyses={analyses} 
                      resumes={resumes}
                      linkedResumes={linkedResumes}
                    />

                    <ScoreImprovementInsights analyses={analyses} />

                    {/* Historical Analyses Scores Report Cards */}
                    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 hover-glow transition-all duration-300">
                      <div>
                        <h3 className="font-display font-bold text-lg text-white">Grading Reports History</h3>
                        <p className="text-xs text-gray-400">Past scorecards, category weights, and Indian alignment critiques.</p>
                      </div>

                      {analyses.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-brand-border/60 rounded-xl bg-brand-bg/20">
                          <BookOpen className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Empty score index database. Upload and run your first resume grading analysis!</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-brand-border/60 text-gray-500 font-mono">
                                <th className="pb-3 text-left">Document</th>
                                <th className="pb-3">Career Track</th>
                                <th className="pb-3">Calibrated Score</th>
                                <th className="pb-3">Grade</th>
                                <th className="pb-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border/40">
                              {analyses.map((analysis: Analysis) => (
                                <tr key={analysis.id} className="hover:bg-brand-bg/40 transition">
                                  <td className="py-3 font-semibold text-gray-200">
                                    {analysis.resume_name}
                                  </td>
                                  <td className="py-3">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-brand-bg text-gray-200">
                                      {TRACK_DETAILS[analysis.track]?.name}
                                    </span>
                                  </td>
                                  <td className="py-3 font-bold font-mono text-white">
                                    {analysis.total_score} / 100
                                  </td>
                                  <td className="py-3">
                                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                                      analysis.total_score >= 80 ? 'bg-emerald-950 text-emerald-400' :
                                      analysis.total_score >= 67 ? 'bg-blue-950 text-blue-400' :
                                      analysis.total_score >= 52 ? 'bg-yellow-950 text-yellow-400' : 'bg-red-950 text-red-400'
                                    }`}>
                                      {analysis.total_score >= 80 ? 'A' :
                                       analysis.total_score >= 67 ? 'B' :
                                       analysis.total_score >= 52 ? 'C' : 'F'}
                                    </span>
                                  </td>
                                  <td className="py-3 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button 
                                        onClick={() => { setSelectedAnalysis(analysis); setCurrentView('scoreboard'); }}
                                        className="px-2.5 py-1.5 text-[10px] bg-brand-border/80 hover:bg-brand-border hover:text-white rounded-lg transition shrink-0"
                                        id={`btn-view-report-${analysis.id}`}
                                      >
                                        See Report Cards
                                      </button>
                                      <button 
                                        onClick={() => { setActiveShareAnalysis(analysis); setShareLinkCopied(false); }}
                                        className="px-2.5 py-1.5 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition inline-flex items-center gap-1 shrink-0"
                                        id={`btn-share-report-${analysis.id}`}
                                        title="Generate public shareable link"
                                      >
                                        <Share2 className="w-3 h-3" />
                                        Share
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 3.2 MY RESUME FOLDER PATH */}
                {currentView === 'resumes' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-display font-extrabold text-2xl text-white">My Resume Folder</h2>
                        <p className="text-xs text-gray-400">Manage parsed selectable text resumes.</p>
                      </div>
                      <button 
                        onClick={() => setCurrentView('upload_view')}
                        className="px-4 py-2 text-xs font-semibold bg-accent-primary rounded-xl text-white hover:bg-orange-600 transition flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Add Document
                      </button>
                    </div>

                    {resumes.length === 0 ? (
                      <div className="text-center py-20 border border-brand-border border-dashed rounded-2xl bg-brand-surface/40">
                        <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <h4 className="font-display font-semibold text-white">Folder Index is Empty</h4>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">Upload standard .pdf or .docx resumes to extract searchable technical vectors.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {resumes.map((r: Resume) => (
                          <div key={r.id} className="bg-brand-surface p-5 rounded-2xl border border-brand-border/80 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-accent-primary/20 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5 text-accent-primary" />
                              </div>
                              <div className="overflow-hidden">
                                <h4 className="text-sm font-bold text-white truncate max-w-xs">{r.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">Format: {r.file_type.toUpperCase()} · {r.word_count} words</p>
                                <p className="text-[10px] text-gray-500 mt-1 font-mono">Parsed: {new Date(r.created_at).toLocaleDateString()}</p>
                                {(Object.values(linkedResumes) as string[][]).some(g => g.includes(r.id)) && (
                                  <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-[6px] text-[9px] font-semibold font-mono">
                                    <Link className="w-2.5 h-2.5 text-indigo-400" />
                                    Linked Version
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {/* Option to quick analyze */}
                              <button 
                                onClick={() => { setSelectedResumeId(r.id); setCurrentView('analyze_view'); }}
                                className="px-2 py-1.5 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-lg text-[10px] font-bold"
                              >
                                Grade CV
                              </button>
                              <button 
                                onClick={(e) => handleDeleteResume(r.id, e)} 
                                className="p-1.5 bg-red-950/30 hover:bg-red-950 border border-red-500/20 text-red-400 rounded-lg"
                                id={`btn-delete-${r.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3.3 UPLOAD RESUME PAGE VIEW */}
                {currentView === 'upload_view' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6 max-w-2xl mx-auto"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-display font-extrabold text-2xl text-white">Upload New Doc</h2>
                        <p className="text-xs text-gray-400">Select or drop a technical selectable text-based file.</p>
                      </div>
                      <button
                        onClick={handleSeedMockResume}
                        disabled={loading}
                        className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15 text-orange-400 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                        Instant Demo Resume Seed
                      </button>
                    </div>

                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                        isDragOver ? 'border-accent-primary bg-orange-950/10' : 'border-brand-border bg-brand-surface/60'
                      }`}
                    >
                      <input 
                        type="file" 
                        onChange={handleFileChange}
                        accept=".pdf,.docx"
                        className="hidden" 
                        id="document-file-input"
                      />
                      
                      <div className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-orange-950/40 border border-accent-primary/20 flex items-center justify-center mx-auto">
                          <Upload className="w-6 h-6 text-accent-primary" />
                        </div>

                        {uploadedFileName ? (
                          <div className="space-y-2">
                            <span className="text-sm font-semibold text-white">{uploadedFileName}</span>
                            <span className="text-xs text-gray-400 block font-mono">Conversion parsed successfully. Ready for engine database syncing.</span>
                            <button onClick={() => { setUploadedFileName(''); setUploadedFileBase64(''); }} className="text-xs text-red-400 hover:underline">Clear File</button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <h4 className="font-display font-semibold text-white text-base">Drag in parsed CV</h4>
                            <p className="text-xs text-gray-400">PDF and DOCX formats supported. Up to 5MB.</p>
                            <label htmlFor="document-file-input" className="mt-4 inline-block px-4 py-2 bg-brand-border/60 hover:bg-brand-border hover:text-white rounded-xl text-xs text-gray-300 transition cursor-pointer">
                              Browse Local Files
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button 
                        onClick={() => setCurrentView('dashboard')} 
                        className="px-4 py-2 text-xs font-semibold border border-brand-border rounded-xl hover:bg-brand-surface"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleUploadSubmit} 
                        className="px-6 py-2 text-xs font-semibold text-white bg-accent-primary rounded-xl shadow-lg hover:bg-orange-600 font-display"
                        id="btn-upload-actions-submit"
                      >
                        Analyze & Store Resume
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 3.4 TRIGGER GRADING ANALYSIS SCREEN */}
                {currentView === 'analyze_view' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="font-display font-extrabold text-2xl text-white">Grading Index Settings</h2>
                      <p className="text-xs text-gray-400 font-display">Configure track metrics indices and target Job Specifications.</p>
                    </div>

                    <div className="space-y-6">
                      
                      {/* Left: Input Selection Settings */}
                      <div className="space-y-6">
                        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4">
                          <h3 className="font-display font-bold text-sm text-white">1. Select Prepared File</h3>
                          
                          {resumes.length === 0 ? (
                            <div className="bg-brand-bg/50 p-6 rounded-xl text-center border border-brand-border space-y-3">
                              <p className="text-xs text-gray-400">No resumes found in your workspace.</p>
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <button 
                                  onClick={() => setCurrentView('upload_view')} 
                                  className="text-xs px-3 py-1.5 border border-brand-border hover:bg-brand-surface text-gray-300 rounded-lg transition"
                                >
                                  Go to Uploads
                                </button>
                                <button 
                                  onClick={handleSeedMockResume}
                                  disabled={loading}
                                  className="text-xs px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 rounded-lg transition flex items-center gap-1 font-semibold"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  Seed Demo BITS Resume
                                </button>
                              </div>
                            </div>
                          ) : (
                            <select 
                              value={selectedResumeId}
                              onChange={e => setSelectedResumeId(e.target.value)}
                              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                              required
                            >
                              <option value="">-- Choose uploaded resume --</option>
                              {resumes.map(r => (
                                <option key={r.id} value={r.id}>{r.name} ({r.word_count} words)</option>
                              ))}
                            </select>
                          )}
                        </div>

                        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4">
                          <h3 className="font-display font-bold text-sm text-white">2. Paste Target Job Description (Optional)</h3>
                          <textarea 
                            value={targetJdText}
                            onChange={e => setTargetJdText(e.target.value)}
                            placeholder="Insert the full target Job description contents here. We will run Tf-Idf metric indexing extraction to identify keyword matches and recommendations."
                            rows={6}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-gray-300 focus:outline-none focus:border-accent-primary"
                          />
                          <div className="text-right text-[10px] text-gray-500 font-mono">
                            {targetJdText.length} characters
                          </div>
                        </div>
                      </div>

                      {/* Right: Target Track choices */}
                      <div className="space-y-6">
                        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 select-none">
                          <h3 className="font-display font-bold text-sm text-white">3. Select Target Path Track</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-display">
                            {Object.values(TRACK_DETAILS).map((track: TrackConfig) => (
                              <div 
                                key={track.key}
                                onClick={() => setSelectedTrack(track.key)}
                                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                                  selectedTrack === track.key 
                                    ? 'border-accent-primary bg-orange-950/20' 
                                    : 'border-brand-border/60 hover:bg-brand-bg'
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <h4 className="text-xs font-bold text-white">{track.name}</h4>
                                  {selectedTrack === track.key && (
                                    <div className="w-2 h-2 rounded-full bg-accent-primary" />
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{track.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button 
                          onClick={handleTriggerAnalysis}
                          disabled={!selectedResumeId}
                          className={`w-full py-3 text-xs font-semibold rounded-xl text-white font-display transition duration-200 ${
                            selectedResumeId 
                              ? 'bg-accent-primary shadow-lg hover:bg-orange-600 cursor-pointer' 
                              : 'bg-brand-elevated text-gray-500 cursor-not-allowed'
                          }`}
                          id="btn-trigger-grading"
                        >
                          Compile Scores Calibrator
                        </button>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 3.5 SCOREBOARD DETAILED ANALYSIS REPORT PAGE */}
                {selectedAnalysis && currentView === 'scoreboard' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-8"
                  >
                    {/* Header Report details */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span onClick={() => setCurrentView('dashboard')} className="text-xs text-accent-primary hover:underline cursor-pointer">← Back to Dashboard Hub</span>
                        <h2 className="font-display font-extrabold text-3xl tracking-tight text-white mt-2">ATS Score Calibration Card</h2>
                        <p className="text-xs text-gray-400 font-display">Scored under the {TRACK_DETAILS[selectedAnalysis.track]?.name} validation criteria.</p>
                      </div>

                      <div className="flex gap-2 font-display">
                        <button 
                          onClick={() => window.print()}
                          className="px-3.5 py-2 text-xs border border-brand-border rounded-xl text-gray-300 hover:bg-brand-surface transition"
                        >
                          Print Scorecard
                        </button>
                        <button 
                          onClick={openLinkedInShareModal}
                          className="px-3.5 py-2 text-xs border border-brand-border rounded-xl text-white bg-slate-800/80 hover:bg-brand-elevated transition flex items-center gap-1.5"
                        >
                          <Linkedin className="w-3.5 h-3.5 text-indigo-400" />
                          Share on LinkedIn
                        </button>
                        <button 
                          onClick={handleTriggerAIDeepFeedback}
                          disabled={aiLoading}
                          className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-accent-primary to-orange-500 rounded-xl hover:opacity-90 shadow-xl transition flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          {aiLoading ? 'Compiling Critique...' : 'Unlock AI Assessment'}
                        </button>
                      </div>
                    </div>

                    {/* Circular scoreboard hero panel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                      
                      {/* Large Gauge Panel */}
                      <div className="bg-brand-surface p-6 rounded-3xl border border-brand-border flex flex-col justify-center items-center">
                        <ScoreGauge 
                          score={selectedAnalysis.total_score} 
                          grade={selectedAnalysis.total_score >= 80 ? 'A' : selectedAnalysis.total_score >= 67 ? 'B' : 'C'} 
                        />
                        <div className="text-center mt-2 border-t border-brand-border/40 pt-4 w-full">
                          <p className="text-xs font-mono text-gray-400">VERDICT RESOLUTION</p>
                          <p className="text-sm font-semibold tracking-tight text-white mt-1 leading-snug">{selectedAnalysis.score_breakdown.india.cgpa !== null ? `CGPA: ${selectedAnalysis.score_breakdown.india.cgpa.toFixed(2)}/10` : 'No CGPA Identified'}</p>
                          <p className="text-xs font-mono text-accent-green mt-1">Tier: {selectedAnalysis.score_breakdown.india.collegeTier || 'UNKNOWN'}</p>
                        </div>
                      </div>

                      {/* Score Breakdown horizontal charts */}
                      <div className="md:col-span-2 bg-brand-surface p-6 rounded-3xl border border-brand-border flex flex-col justify-between">
                        <div>
                          <h3 className="font-display font-semibold text-white mb-6">Component Breakdown Analytics</h3>
                          
                          <div className="space-y-4">
                            <MetricBar 
                              label="Formatting Standards & Layout Integrity" 
                              score={selectedAnalysis.format_score} 
                              max={20} 
                              colorClass="bg-brand-border/80" 
                            />
                            
                            <MetricBar 
                              label="Core Resume Segment Completed" 
                              score={selectedAnalysis.sections_score} 
                              max={20} 
                              colorClass="bg-blue-500" 
                            />
                            
                            <MetricBar 
                              label="Target Keywords Density Match" 
                              score={selectedAnalysis.keywords_score} 
                              max={30} 
                              colorClass="bg-purple-500" 
                            />
                            
                            <MetricBar 
                              label="India-corridors Intelligence cutoffs alignment" 
                              score={selectedAnalysis.india_score} 
                              max={30} 
                              colorClass="bg-orange-500" 
                            />
                          </div>
                        </div>

                        <div className="text-xs font-mono text-gray-400 mt-6 border-t border-brand-border/40 pt-4">
                          ⚙️ Normalized total calculations index generated locally in 0.2s.
                        </div>
                      </div>
                    </div>

                    {/* Reusable Category Sub-Check items checklist expander */}
                    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4">
                      <h3 className="font-display font-bold text-lg text-white">Step-by-Step Scoring Parameters Review</h3>
                      
                      <div className="space-y-3 select-none">
                        
                        {/* Format category */}
                        <div className="border border-brand-border/60 rounded-xl overflow-hidden font-display">
                          <div 
                            onClick={() => setExpandedSection(expandedSection === 'format' ? null : 'format')}
                            className="bg-brand-bg/40 p-4 flex items-center justify-between cursor-pointer"
                          >
                            <span className="text-xs font-bold text-gray-200">Formatting layout & tables check (Score: {selectedAnalysis.format_score}/20)</span>
                            {expandedSection === 'format' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                          
                          {expandedSection === 'format' && (
                            <div className="p-4 bg-brand-bg/25 border-t border-brand-border/40 space-y-3.5">
                              {selectedAnalysis.score_breakdown.format.breakdown.map((item, idx) => (
                                <div key={idx} className="flex gap-3 start text-xs">
                                  {item.passed ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                                  <div>
                                    <h4 className="font-semibold text-white">{item.label}</h4>
                                    <p className="text-gray-400 mt-0.5">{item.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Keyword gaps category */}
                        <div className="border border-brand-border/60 rounded-xl overflow-hidden font-display">
                          <div 
                            onClick={() => setExpandedSection(expandedSection === 'keywords' ? null : 'keywords')}
                            className="bg-brand-bg/40 p-4 flex items-center justify-between cursor-pointer"
                          >
                            <span className="text-xs font-bold text-gray-200">Job Description keyword matching results (Score: {selectedAnalysis.keywords_score}/30)</span>
                            {expandedSection === 'keywords' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                          
                          {expandedSection === 'keywords' && (
                            <div className="p-4 bg-brand-bg/25 border-t border-brand-border/40 space-y-4">
                              
                              <div>
                                <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold mb-2">Technical keywords identified ({selectedAnalysis.keyword_matches.length})</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedAnalysis.keyword_matches.length === 0 ? (
                                    <span className="text-xs text-gray-500 font-semibold italic">No direct matches. Paste target JD to check matching percentages.</span>
                                  ) : (
                                    selectedAnalysis.keyword_matches.map((kw, i) => (
                                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">{kw}</span>
                                    ))
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-mono uppercase tracking-wider text-red-500 font-bold mb-2">Keyword gaps in resume ({selectedAnalysis.keyword_gaps.length})</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedAnalysis.keyword_gaps.length === 0 ? (
                                    <span className="text-xs text-emerald-400 font-semibold">Perfect alignment! No significant keywords gaps.</span>
                                  ) : (
                                    selectedAnalysis.keyword_gaps.map((kw, i) => (
                                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-red-950/40 text-red-400 border border-red-500/20">{kw}</span>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* India intelligence specifications */}
                        <div className="border border-brand-border/60 rounded-xl overflow-hidden font-display">
                          <div 
                            onClick={() => setExpandedSection(expandedSection === 'india' ? null : 'india')}
                            className="bg-brand-bg/40 p-4 flex items-center justify-between cursor-pointer"
                          >
                            <span className="text-xs font-bold text-gray-200">India target placement parameters assessment (Score: {selectedAnalysis.india_score}/30)</span>
                            {expandedSection === 'india' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                          
                          {expandedSection === 'india' && (
                            <div className="p-4 bg-brand-bg/25 border-t border-brand-border/40 space-y-4">
                              
                              <div className="space-y-2.5">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-gray-400">IDENTIFIED MARKETS CRITIQUES</h4>
                                {(selectedAnalysis.score_breakdown?.india?.issues || []).map((issue, idx) => (
                                  <div key={idx} className="flex gap-2 text-xs text-orange-200 bg-orange-950/35 border border-orange-500/10 p-3 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                    <p>{issue}</p>
                                  </div>
                                ))}

                                {(selectedAnalysis.score_breakdown?.india?.positives || []).map((pos, idx) => (
                                  <div key={idx} className="flex gap-2 text-xs text-emerald-200 bg-emerald-950/30 border border-emerald-500/10 p-3 rounded-xl">
                                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                    <p>{pos}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Structured priority recommendations */}
                    <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4">
                      <div>
                        <h3 className="font-display font-extrabold text-lg text-white">Priority Recommendations Checklist</h3>
                        <p className="text-xs text-gray-400">Action items sorted by operational impact to prevent auto-rejections.</p>
                      </div>

                      <div className="space-y-3.5">
                        {selectedAnalysis.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-brand-bg/40 border border-brand-border/60">
                            <span className={`text-[10px] font-bold px-2 py-1 tracking-wider rounded font-mono shrink-0 uppercase ${
                              rec.priority === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/20' :
                              rec.priority === 'HIGH' ? 'bg-orange-950 text-orange-400 border border-orange-500/20' : 'bg-brand-border text-gray-300'
                            }`}>
                              {rec.priority}
                            </span>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-white leading-snug">{rec.action}</h4>
                              <p className="text-xs text-gray-400 font-display leading-relaxed">{rec.why}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI DEEP FEEDBACK COMPILED REPORT */}
                    {selectedAnalysis.ai_feedback ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-brand-surface p-6 rounded-2xl border-2 border-purple-500/40 relative space-y-6"
                      >
                        <div className="absolute top-4 right-4 w-12 h-12 bg-purple-500/5 blur-xl rounded-full" />
                        
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-950 flex items-center justify-center border border-purple-500/35">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </div>
                          <div>
                            <h3 className="font-display font-extrabold text-lg text-white">AI Deep Coach assessment</h3>
                            <p className="text-xs text-gray-400 font-mono">Completed under Platform Gemini flash parameters.</p>
                          </div>
                        </div>

                        {/* Overall assessment text */}
                        <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-500/15 space-y-1.5">
                          <h4 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest text-left">PRO ANALYSIS ASSESSMENT</h4>
                          <p className="text-xs text-gray-300 font-display leading-relaxed">{selectedAnalysis.ai_feedback.overallAssessment}</p>
                        </div>

                        {/* Staggered before/after wins */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold font-mono text-purple-400 uppercase tracking-widest text-left">SUGGESTED REWRITE SAMPLES</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedAnalysis.ai_feedback.quickWins?.map((win, idx) => (
                              <div key={idx} className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border/60 text-xs text-left space-y-2">
                                <div>
                                  <span className="text-[9px] font-bold text-red-400 tracking-wide uppercase">Original Weak Line:</span>
                                  <p className="text-gray-400 italic font-display mt-0.5">"{win.original}"</p>
                                </div>
                                <div className="border-t border-brand-border/30 pt-2">
                                  <span className="text-[9px] font-bold text-emerald-400 tracking-wide uppercase">Rewritten metric replacement:</span>
                                  <p className="text-white font-semibold font-display mt-0.5">"{win.rewritten}"</p>
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono mt-1 pt-1 border-t border-brand-border/20">Why: {win.why}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bullet achievements ratio metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border/60 text-xs">
                            <span className="text-[10px] font-bold font-mono text-purple-400 uppercase block mb-2">ACHIEVEMENT VS TASK RATIO</span>
                            <div className="flex gap-4 items-center">
                              <div className="text-center bg-brand-bg p-3 rounded-lg border border-brand-border shrink-0 min-w-[100px]">
                                <span className="text-2xl font-black text-white">{selectedAnalysis.ai_feedback.achievementRatio?.achievements || 0}</span>
                                <span className="text-[9px] uppercase tracking-wider text-gray-400 block mt-0.5">Achievements</span>
                              </div>
                              <span className="text-gray-500 font-bold">:</span>
                              <div className="text-center bg-brand-bg p-3 rounded-lg border border-brand-border shrink-0 min-w-[100px]">
                                <span className="text-2xl font-black text-white">{selectedAnalysis.ai_feedback.achievementRatio?.responsibilities || 0}</span>
                                <span className="text-[9px] uppercase tracking-wider text-gray-400 block mt-0.5">Responsibilities</span>
                              </div>
                              <p className="text-[11px] text-gray-400 font-display leading-relaxed">{selectedAnalysis.ai_feedback.achievementRatio?.verdict}</p>
                            </div>
                          </div>

                          <div className="bg-brand-bg/40 p-4 rounded-xl border border-brand-border/60 text-xs space-y-1.5">
                            <span className="text-[10px] font-bold font-mono text-purple-400 uppercase block">CLICHÉ WORDS DETECTED</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {selectedAnalysis.ai_feedback.clichesFound?.map((c, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-red-950/20 text-red-400 border border-red-500/20">{c}</span>
                              ))}
                              {(!selectedAnalysis.ai_feedback.clichesFound || selectedAnalysis.ai_feedback.clichesFound.length === 0) && (
                                <span className="text-gray-400 italic">No fluff vocabulary identified. Clean content.</span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 leading-normal mt-1 block">Words like "team player" add zero information index to modern hiring algorithms.</p>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-brand-surface p-10 text-center rounded-2xl border border-brand-border space-y-4">
                        <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
                        <h3 className="font-display font-semibold text-white">Unlock Deep AI Critique Analysis</h3>
                        <p className="text-xs text-gray-400 max-w-sm mx-auto">Analyze achievements vs duties ratio, isolate cliche vocabularies, perform custom rewrites, and configure Indian corporate targets.</p>
                        <button 
                          onClick={handleTriggerAIDeepFeedback}
                          disabled={aiLoading}
                          className="px-6 py-3 text-xs font-display font-bold text-white bg-gradient-to-r from-accent-primary to-orange-500 rounded-xl hover:opacity-90 inline-flex items-center gap-2 shadow-2xl"
                        >
                          <Zap className="w-4 h-4" />
                          {aiLoading ? 'Syncing...' : 'Perform AI Audit'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3.6 NAUKRI PROFILE OPTIMIZER */}
                {currentView === 'naukri_view' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                    onViewportEnter={loadLatestNaukriProfile}
                  >
                    <div>
                      <h2 className="font-display font-extrabold text-2xl text-white">Naukri Crawler Optimizer</h2>
                      <p className="text-xs text-gray-400">Audit your profiles completeness metrics and Noida/Bangalore search crawlers visibility indexes.</p>
                    </div>

                    <div className="space-y-6">
                      
                      {/* Left: Optimizer settings */}
                      <form onSubmit={handleNaukriSubmit} className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4 select-none">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-400 font-medium">Naukri Profile Headline</label>
                          <input 
                            type="text" 
                            value={naukriHeadline}
                            onChange={e => setNaukriHeadline(e.target.value)}
                            placeholder="e.g. Senior Software Engineer | React, Node.js & Supabase" 
                            className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-gray-400 font-medium">Profile Summary Bio</label>
                          <textarea 
                            value={naukriSummary}
                            onChange={e => setNaukriSummary(e.target.value)}
                            placeholder="State years index, direct tech stacks, and active deployments." 
                            rows={4}
                            className="w-full bg-brand-bg border border-brand-border rounded-xl p-4 text-xs text-white focus:outline-none focus:border-accent-primary"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-medium">Declared Key Skills (Comma-separated)</label>
                            <input 
                              type="text" 
                              value={naukriSkills}
                              onChange={e => setNaukriSkills(e.target.value)}
                              placeholder="React, Postgres, Supabase, Nodejs" 
                              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-medium">Notice Period status</label>
                            <select 
                              value={naukriNotice}
                              onChange={e => setNaukriNotice(e.target.value)}
                              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary"
                            >
                              <option value="Immediate Joiner">Immediate Joiner / Serving Notice</option>
                              <option value="15 Days">15 Days</option>
                              <option value="30 Days / 1 Month">30 Days / 1 Month</option>
                              <option value="90 Days / 3 Months">90 Days / 3 Months (System Warned)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-medium">Expected CTC (Annual in LPA)</label>
                            <input 
                              type="text" 
                              value={naukriCTC}
                              onChange={e => setNaukriCTC(e.target.value)}
                              placeholder="e.g. 15 LPA" 
                              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-medium font-display">Target Location Corridor</label>
                            <input 
                              type="text" 
                              value={naukriLocation}
                              onChange={e => setNaukriLocation(e.target.value)}
                              placeholder="e.g. Bengaluru / NCR" 
                              className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="w-full py-3 bg-accent-primary text-xs font-bold text-white rounded-xl shadow-lg hover:bg-orange-600 transition"
                          id="btn-naukri-optimizer-submit"
                        >
                          Run Naukri Optimization Audit
                        </button>
                      </form>

                      {/* Right: Crawler Output result cards */}
                      {naukriAnalysisResult ? (
                        <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border text-left space-y-4">
                          <div className="text-center border-b border-brand-border/40 pb-4">
                            <span className="text-[10px] text-gray-400 block font-mono">COMPLETE INDEX RATE</span>
                            <h4 className="text-4xl font-extrabold text-white mt-1 font-mono">{naukriAnalysisResult.completeness_score}%</h4>
                            <p className="text-[10px] text-emerald-400 mt-1 font-semibold leading-relaxed">Visibility Score Category: {naukriAnalysisResult.completeness_score >= 80 ? 'EXCEPTIONAL' : 'AVERAGE'}</p>
                          </div>

                          {/* Gaps review Checklist */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-mono font-bold text-gray-300">Crawler indexing Gaps ({naukriAnalysisResult.gaps.length})</h5>
                            {naukriAnalysisResult.gaps.map((g, i) => (
                              <div key={i} className="flex gap-2 text-xs text-orange-200 bg-orange-950/20 p-2.5 rounded-lg border border-orange-500/10">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                                <p>{g}</p>
                              </div>
                            ))}

                            {naukriAnalysisResult.suggestions.length > 0 && (
                              <div className="space-y-2 border-t border-brand-border/40 pt-3">
                                <h5 className="text-xs font-mono font-bold text-gray-300">Suggested Action Items</h5>
                                {naukriAnalysisResult.suggestions.map((s, i) => (
                                  <div key={i} className="flex gap-2 text-xs text-gray-300">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <p>{s}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-brand-surface/40 p-8 rounded-2xl border border-brand-border text-center space-y-3 font-display">
                          <Briefcase className="w-8 h-8 text-gray-400 mx-auto" />
                          <h4 className="text-sm font-semibold text-white">Simulation Report Empty</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">Fill out your profile metadata structure and execute the crawl metrics verification check.</p>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}

                {/* 3.6 PREMIUM TOOLKIT HUB VIEW */}
                {currentView === 'premium_toolkit' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <PremiumToolsHub 
                      resumes={resumes}
                      authToken={getAuthToken() || ''}
                      user={user}
                      onUpgradeTrigger={handleTriggerPremiumUpgrade}
                    />
                  </motion.div>
                )}

                {/* COVER LETTER GENERATOR */}
                {currentView === 'cover-letters' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <CoverLetterGenerator
                      resumes={resumes}
                      user={user}
                      onUpgradeTrigger={handleTriggerPremiumUpgrade}
                    />
                  </motion.div>
                )}

                {/* OFFER ANALYZER */}
                {currentView === 'offer-analyzer' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <OfferAnalyzer
                      user={user}
                      onUpgradeTrigger={handleTriggerPremiumUpgrade}
                    />
                  </motion.div>
                )}

                {/* APPLICATION TRACKER */}
                {currentView === 'tracker' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <ApplicationTracker
                      user={user}
                      onUpgradeTrigger={handleTriggerPremiumUpgrade}
                    />
                  </motion.div>
                )}

                {/* RESUME TAILOR */}
                {currentView === 'resume-tailor' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <ResumeTailor
                      resumes={resumes}
                      user={user}
                      onUpgradeTrigger={handleTriggerPremiumUpgrade}
                    />
                  </motion.div>
                )}

                {/* LINKEDIN GENERATOR */}
                {currentView === 'linkedin' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <LinkedInGenerator
                      resumes={resumes}
                      user={user}
                      onUpgradeTrigger={handleTriggerPremiumUpgrade}
                    />
                  </motion.div>
                )}

                {/* 3.7 SETTINGS AND BYOK CONTROLS */}
                {currentView === 'settings_view' && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="font-display font-extrabold text-2xl text-white">Bring Your Own Key & Billing Settings</h2>
                      <p className="text-xs text-gray-400">Configure personal encrypted OpenAPI credentials or audit past billing statements.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      
                      {/* Left: BYOK configuration block */}
                      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4">
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-accent-primary" />
                          <h3 className="font-display font-bold text-base text-white">AES-256 Encrypted Private BYOK</h3>
                        </div>
                        
                        <p className="text-xs text-gray-400 leading-relaxed bg-brand-bg p-3.5 border border-brand-border rounded-xl">
                          Your key is stored encrypted using military-grade AES-256. We use it solely to run token audits when you trigger "Trigger Deep AI Audit".
                        </p>

                        <div className="space-y-1">
                          <label className="text-xs text-gray-400 font-medium">OpenAI Secret API Key</label>
                          <input 
                            type="password" 
                            value={byokKey}
                            onChange={e => setByokKey(e.target.value)}
                            placeholder={user?.has_byok ? '••••••••••••••••••••••••' : 'sk-proj-...'} 
                            className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-accent-primary"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={handleSaveByok}
                            disabled={byokSaving}
                            className="px-4 py-2 bg-accent-primary text-xs font-bold text-white rounded-xl shadow hover:bg-orange-600 transition"
                            id="btn-save-byok"
                          >
                            {byokSaving ? 'Testing Key...' : 'Verify & Store Key'}
                          </button>
                          
                          {user?.has_byok && (
                            <button 
                              type="button"
                              onClick={handleRemoveByok}
                              className="px-3 py-2 text-xs border border-red-500/20 text-red-400 hover:bg-red-950 rounded-xl transition"
                            >
                              Disconnect Key
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Payment history block */}
                      <div className="bg-brand-surface p-6 rounded-2xl border border-brand-border space-y-4">
                        <h3 className="font-display font-bold text-base text-white">Billing History</h3>
                        
                        {payments.length === 0 ? (
                          <div className="text-center py-10 rounded-xl bg-brand-bg/50 border border-brand-border text-xs text-gray-500">
                            No billing transactions found.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {payments.map((p: PaymentRecord) => (
                              <div key={p.id} className="flex justify-between items-center text-xs p-3 rounded-xl bg-brand-bg border border-brand-border">
                                <div className="space-y-0.5">
                                  <span className="font-mono text-white text-[11px] font-bold">{p.razorpay_order_id}</span>
                                  <span className="text-[10px] text-gray-500 block">Status: {p.status.toUpperCase()}</span>
                                </div>
                                <span className="font-mono text-white font-bold">₹{(p.amount / 100).toFixed(2)} INR</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}

              </div>
            </div>

          </div>
        )}

      {/* LINKEDIN SHARE DIALOG MODAL */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-brand-border/60"
            >
              {/* Left Column: Editor Controls */}
              <div className="p-6 md:w-1/2 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1 px-1.5 bg-[#0077b5]/10 rounded-lg">
                      <Linkedin className="w-5 h-5 text-[#0077b5]" />
                    </div>
                    <h3 className="font-display font-extrabold text-xl text-white">Share Stats on LinkedIn</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Personalize and publish your ATS grade, score, and core Indian job market alignments directly to your LinkedIn professional network feed.
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">DRAFT POST TEXT</label>
                    <textarea
                      value={shareText}
                      onChange={(e) => setShareText(e.target.value)}
                      rows={10}
                      className="w-full bg-brand-bg/50 border border-brand-border rounded-2xl p-4 text-xs text-slate-100 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary leading-relaxed font-sans resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleCopyShareText}
                    className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-xl border border-brand-border bg-slate-800 text-white hover:bg-slate-700 transition"
                  >
                    {copiedState ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-indigo-400" />
                        Copy Draft Text
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleLinkedInShareNav}
                    className="flex items-center justify-center gap-2 w-full py-3 text-xs font-bold rounded-xl bg-gradient-to-r from-accent-primary to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-indigo-500/10 transition"
                  >
                    <Linkedin className="w-4 h-4" />
                    Open LinkedIn & Draft Post
                  </button>
                  
                  <button
                    onClick={() => setIsShareModalOpen(false)}
                    className="text-center text-xs text-slate-400 hover:text-white transition mt-1"
                  >
                    Cancel Share
                  </button>
                </div>
              </div>

              {/* Right Column: LinkedIn Live Feed Mockup Visual */}
              <div className="p-6 md:w-1/2 bg-[#020617]/50 flex flex-col justify-center">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-3">Feed Mockup Preview</span>
                
                {/* LinkedIn Card Mock */}
                <div className="bg-[#0f172a] border border-[#1e293b] p-4 rounded-2xl flex flex-col space-y-3 shadow-md max-w-sm mx-auto w-full text-[13px] font-sans">
                  {/* LinkedIn Header */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-950 border border-indigo-500/25 flex items-center justify-center font-display font-bold text-xs text-indigo-400 capitalize whitespace-nowrap overflow-hidden shrink-0">
                      {(user?.name || 'C').charAt(0)}
                    </div>
                    <div className="leading-tight shrink-1 min-w-0">
                      <h4 className="font-bold text-white text-xs truncate flex items-center gap-1">
                        {user?.name || 'Candidate Name'}
                        <span className="text-[10px] font-normal text-slate-400">• 1st</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">ATS Calibrated Professional • Resume Scholar</p>
                      <p className="text-[9px] text-slate-500 flex items-center gap-0.5 mt-0.6">
                        <Clock className="w-2.5 h-2.5" /> Just now • 🌐
                      </p>
                    </div>
                  </div>

                  {/* LinkedIn Post Text body (truncated) */}
                  <div className="text-slate-300 text-[11px] leading-relaxed line-clamp-6 whitespace-pre-wrap font-sans">
                    {shareText}
                  </div>

                  {/* Attachment Card Mock */}
                  {selectedAnalysis && (
                    <div className="border border-brand-border/80 rounded-xl overflow-hidden bg-brand-bg/60">
                      <div className="p-3 bg-gradient-to-br from-brand-surface to-brand-bg flex items-center justify-between border-b border-brand-border/40">
                        <div className="space-y-1 pr-2">
                          <span className="px-1.5 py-0.5 bg-indigo-950/60 border border-indigo-500/30 text-[8px] font-mono text-indigo-400 rounded font-bold uppercase tracking-wider">
                            CALIBRATED REPORT
                          </span>
                          <h5 className="font-display font-bold text-xs text-white tracking-tight mt-1 leading-snug">
                            ATS GRADE {selectedAnalysis.total_score >= 80 ? 'A' : selectedAnalysis.total_score >= 67 ? 'B' : selectedAnalysis.total_score >= 52 ? 'C' : selectedAnalysis.total_score >= 38 ? 'D' : 'F'} Verified
                          </h5>
                          <p className="text-[9px] text-slate-400 truncate">{TRACK_DETAILS[selectedAnalysis.track]?.name}</p>
                        </div>
                        
                        <div className="w-11 h-11 rounded-full bg-[#020617] border-2 border-indigo-500/35 flex flex-col justify-center items-center shrink-0">
                          <span className="text-[11px] font-black text-white">{selectedAnalysis.total_score}</span>
                          <span className="text-[7px] font-mono text-indigo-400">Score</span>
                        </div>
                      </div>
                      <div className="p-2 px-3 bg-brand-surface flex justify-between items-center text-[9px]">
                        <span className="text-slate-400 truncate max-w-[160px] font-mono">{selectedAnalysis.resume_name}</span>
                        <span className="font-bold text-indigo-400">
                          atscore.in
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action buttons footer */}
                  <div className="border-t border-brand-border/30 pt-2 flex justify-between text-slate-400 text-[10px] px-1 font-semibold leading-none">
                    <span className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer"><ThumbsUp className="w-3.5 h-3.5" /> Like</span>
                    <span className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer"><MessageSquare className="w-3.5 h-3.5" /> Comment</span>
                    <span className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer"><Share2 className="w-3.5 h-3.5" /> Repost</span>
                    <span className="flex items-center gap-1 hover:text-indigo-400 cursor-pointer"><Send className="w-3.5 h-3.5" /> Send</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PUBLIC SHARE REPORT LINK MODAL */}
      <AnimatePresence>
        {activeShareAnalysis && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveShareAnalysis(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-brand-surface border border-brand-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl">
                    <Share2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-white">Generate Shareable Link</h3>
                    <p className="text-[10px] text-gray-400 font-sans">Share your verified ATS credentials for personal branding.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveShareAnalysis(null)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="bg-brand-bg/50 border border-brand-border p-4 rounded-2xl space-y-1">
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-wider">RESUME REPORT</span>
                  <h4 className="text-sm font-bold text-white truncate font-sans">{activeShareAnalysis.resume_name}</h4>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-300 font-sans">
                    <span className="bg-brand-border px-2 py-0.5 rounded font-mono font-bold text-amber-400">
                      Score: {activeShareAnalysis.total_score}/100
                    </span>
                    <span className="bg-brand-border px-2 py-0.5 rounded font-mono font-bold text-indigo-400">
                      Track: {TRACK_DETAILS[activeShareAnalysis.track]?.name}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block">Public Shareable Link</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?share=${activeShareAnalysis.id}`}
                      className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none select-all font-mono"
                    />
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`${window.location.origin}/?share=${activeShareAnalysis.id}`);
                          setShareLinkCopied(true);
                          setTimeout(() => setShareLinkCopied(false), 2000);
                        } catch (err) {
                          setApiError('Failed to copy. Please click the input text and copy manually.');
                        }
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {shareLinkCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-500/10 p-3.5 rounded-xl space-y-1.5">
                  <span className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider block">💡 Branding Strategy Tip</span>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                    Recruiters value technical evidence! Add this link to your email signature, LinkedIn features section, or personal website portfolio. Your shared report does not require a login, presenting your scores and matched achievements seamlessly.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveShareAnalysis(null)}
                  className="px-4 py-2 bg-brand-border text-xs text-gray-300 hover:text-white rounded-xl border border-brand-border hover:bg-brand-surface font-semibold transition"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </main>
    </div>
  );
}
