/**
 * Shared Type Definitions for ATScore India
 */

export type TrackKey = 'mass_hiring' | 'naukri' | 'faang_india' | 'startup' | 'linkedin_mnc';

export interface ScoreItem {
  label: string;
  points: number;
  max: number;
  passed: boolean;
  message?: string;
}

export interface FormatScoreResult {
  score: number;
  maxScore: number;
  breakdown: ScoreItem[];
}

export interface SectionsScoreResult {
  score: number;
  maxScore: number;
  breakdown: ScoreItem[];
}

export interface KeywordScoreResult {
  score: number;
  maxScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  trackKeywordsPresent: string[];
  matchRate: number;
  breakdown: ScoreItem[];
}

export interface IndiaScoreResult {
  score: number;
  maxScore: number;
  breakdown: ScoreItem[];
  issues: string[];
  positives: string[];
  cgpa: number | null;
  collegeTier: string;
  noticePeriod: string | null;
  piiFound: string[];
}

export interface TrackBonusResult {
  score: number;
  maxScore: number;
  breakdown: ScoreItem[];
}

export interface ResumeSection {
  hasContact: boolean;
  hasObjective: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  hasExperience: boolean;
  hasInternship: boolean;
  hasProjects: boolean;
  hasCertification: boolean;
  hasAchievement: boolean;
  hasExtracurricular: boolean;
  hasLanguages: boolean;
  hasDeclaration: boolean;
  hasCGPA: boolean;
  hasGithub: boolean;
  hasLinkedIn: boolean;
  hasNoticePeriod: boolean;
  hasCurrentCTC: boolean;
  hasExpectedCTC: boolean;
}

export interface ParsedResume {
  text: string;
  wordCount: number;
  hasMultipleColumns: boolean;
  hasTables: boolean;
  hasTextBoxes: boolean;
  isScanned: boolean;
  pageCount?: number;
}

export interface AnalysisResult {
  totalScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  verdict: string;
  formatScore: number;
  sectionsScore: number;
  keywordsScore: number;
  indiaScore: number;
  trackBonusScore: number;
  scoreBreakdown: {
    format: FormatScoreResult;
    sections: SectionsScoreResult;
    keywords: KeywordScoreResult;
    india: IndiaScoreResult;
    trackBonus: TrackBonusResult;
  };
  keywordGaps: string[];
  keywordMatches: string[];
  recommendations: {
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    why: string;
  }[];
  cgpa: number | null;
  collegeTier: string;
  sections: ResumeSection;
  indiaIssues: string[];
  indiaPositives: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'paid';
  plan_expires_at: number | null;
  has_byok: boolean;
  analyses_used_today: number;
  created_at: number;
}

export interface Resume {
  id: string;
  user_id: string;
  name: string;
  file_type: 'pdf' | 'docx';
  word_count: number;
  created_at: number;
  updated_at: number;
}

export interface Analysis {
  id: string;
  user_id: string;
  resume_id: string;
  resume_name: string;
  jd_text: string;
  track: TrackKey;
  total_score: number;
  format_score: number;
  sections_score: number;
  keywords_score: number;
  india_score: number;
  track_bonus_score: number;
  score_breakdown: AnalysisResult['scoreBreakdown'];
  keyword_gaps: string[];
  keyword_matches: string[];
  recommendations: AnalysisResult['recommendations'];
  ai_feedback?: AIFeedbackResult | null;
  ai_feedback_generated_at?: number | null;
  created_at: number;
}

export interface AIFeedbackResult {
  overallAssessment: string;
  clichesFound: string[];
  bulletQuality: {
    score: number;
    assessment: string;
    examples: { original: string; improved: string }[];
  };
  achievementRatio: {
    achievements: number;
    responsibilities: number;
    verdict: string;
  };
  quickWins: {
    original: string;
    rewritten: string;
    why: string;
  }[];
  trackSpecificFeedback: string;
  topPriorities: string[];
}

export interface NaukriProfile {
  id: string;
  user_id: string;
  profile_data: {
    headline: string;
    summary: string;
    skills: string;
    education: string;
    experience: string;
    expectedCTC: string;
    currentLocation: string;
    noticePeriod: string;
  };
  completeness_score: number;
  gaps: string[];
  suggestions: string[];
  created_at: number;
  updated_at: number;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  plan_type: 'monthly' | 'yearly';
  status: 'created' | 'paid' | 'failed' | 'refunded';
  created_at: number;
  paid_at?: number;
}

// === FEATURE 1: COVER LETTER ===
export interface CoverLetterRecord {
  id: string;
  user_id: string;
  resume_id: string;
  track: TrackKey;
  jd_snippet: string;
  cover_letter: string;
  word_count: number;
  created_at: string;
}

// === FEATURE 2: OFFER LETTER ANALYZER ===
export interface CtcBreakdown {
  gross_annual_ctc: number;
  basic_salary_annual: number;
  hra_annual: number;
  variable_pay_annual: number;
  special_allowance_annual: number;
  pf_employer_annual: number;
  gratuity_annual: number;
  equity_annual: number;
  other_benefits_annual: number;
}

export interface OfferAnalysis {
  id: string;
  user_id: string;
  role: string;
  company: string;
  location: string;
  experience_years: number;
  ctc_breakdown: CtcBreakdown;
  in_hand_monthly_estimate: number;
  variable_percentage: number;
  red_flags: string[];
  positive_points: string[];
  market_comparison: 'below_market' | 'at_market' | 'above_market';
  negotiation_room: 'low' | 'medium' | 'high';
  negotiation_email: string;
  negotiation_verbal_script: string;
  recommended_ask_ctc: number;
  created_at: string;
}

// === FEATURE 3: APPLICATION TRACKER ===
export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview_r1'
  | 'interview_r2'
  | 'final_round'
  | 'offer_received'
  | 'accepted'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn';

export type ApplicationPortal =
  | 'naukri'
  | 'linkedin'
  | 'company_site'
  | 'referral'
  | 'campus'
  | 'recruiter_email'
  | 'other';

export interface ApplicationRecord {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string;
  track: TrackKey;
  portal: ApplicationPortal;
  applied_date: string;
  status: ApplicationStatus;
  ats_score: number | null;
  analysis_id: string | null;
  resume_version: string | null;
  recruiter_name: string;
  recruiter_email: string;
  notes: string;
  ctc_offered: number | null;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  total: number;
  by_status: Record<ApplicationStatus, number>;
  response_rate: number;
  interview_conversion: number;
  offer_rate: number;
  avg_days_to_response: number;
  top_portal: ApplicationPortal;
  top_track: TrackKey;
}

// === FEATURE 4: RESUME TAILOR ===
export interface TailoredResumeResult {
  id: string;
  user_id: string;
  source_resume_id: string;
  jd_snippet: string;
  track: TrackKey;
  professional_summary: string;
  skills: string[];
  experience_bullets: Record<string, string[]>;
  added_keywords: string[];
  original_score: number;
  estimated_score_improvement: number;
  full_tailored_text: string;
  created_at: string;
}

// === FEATURE 5: LINKEDIN GENERATOR ===
export interface LinkedInProfile {
  id: string;
  user_id: string;
  track: TrackKey;
  headlines: string[];
  about_section: string;
  skills_to_add: string[];
  completeness_checklist: Array<{
    item: string;
    impact: 'high' | 'medium';
    done: boolean;
  }>;
  created_at: string;
}
