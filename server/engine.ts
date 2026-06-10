/**
 * ATScore India - Resume Parsing & ATS Scoring Engine
 * Calibrated for the Indian job market: Naukri, TCS/mass hiring, FAANG India, startups, consulting MNCs.
 * 
 * Scoring Framework (Total: 100 points):
 *   - Format & Layout (20 pts): Structure compliance, tables, columns, contact info
 *   - Sections Completeness (20 pts): Education, Skills, Experience, Projects, etc.
 *   - Keyword Density (30 pts): Track-specific keyword matching + JD match
 *   - India Intelligence (30 pts): CGPA, college tier, notice period, academic gates
 *   - Track Bonus (up to 10 extra): Specific track optimizations
 */
import mammoth from 'mammoth';
import { AnalysisResult, TrackKey, ResumeSection, ParsedResume, ScoreItem, IndiaScoreResult, FormatScoreResult, SectionsScoreResult, KeywordScoreResult, TrackBonusResult } from '../src/types';

// ===================== TRACKS DEFINITIONS =====================
export const TRACKS: Record<TrackKey, { name: string; companies: string; description: string }> = {
  mass_hiring: {
    name: 'Mass Hiring',
    companies: 'TCS · Infosys · Wipro · Cognizant · HCL · Capgemini',
    description: 'Calibrated for corporate services and entry-level mass engineering registration databases.'
  },
  naukri: {
    name: 'Naukri.com Index',
    companies: 'Mid-market companies · IT service MNCs · Product scaling firms',
    description: 'Calibrated for Naukri FastForward crawler search algorithms and profile indexing bots.'
  },
  faang_india: {
    name: 'FAANG India',
    companies: 'Google · Meta · Amazon · Microsoft · Flipkart · Zepto · Swiggy · CRED',
    description: 'Calibrated for elite technology operations, system engineers, and product giants.'
  },
  startup: {
    name: 'Indian Startups',
    companies: 'Series A–C startups · YC India portfolio · Shipped product companies',
    description: 'Calibrated for fast-growing Indian software operations and venture operations.'
  },
  linkedin_mnc: {
    name: 'LinkedIn / Consulting MNC',
    companies: 'Deloitte · Accenture · PwC · KPMG · IBM · Oracle · Salesforce India',
    description: 'Calibrated for administrative services, consultants, cloud engineers, and technical analysts.'
  }
};

// ===================== TRACK-SPECIFIC KEYWORDS =====================
const TRACK_KEYWORDS: Record<TrackKey, string[]> = {
  mass_hiring: [
    'cgpa', 'percentage', '10th', '12th', 'backlog', 'aggregate', 'graduation',
    'b.tech', 'm.tech', 'b.e', 'gate', 'aptitude', 'communication', 'team player',
    'service', 'maintenance', 'production support', 'tcs', 'infosys', 'wipro',
    'training', 'on-site', 'client handling', 'documentation', 'sdlc'
  ],
  naukri: [
    'notice period', 'immediate', 'serving notice', 'lwd', 'ctc', 'expected ctc',
    'current ctc', 'skills', 'bengaluru', 'bangalore', 'hybrid', 'remote',
    'node.js', 'react', 'python', 'java', 'sql', 'cloud', 'aws', 'gcp',
    'docker', 'kubernetes', 'microservices', 'full stack', 'devops'
  ],
  faang_india: [
    'system design', 'distributed systems', 'scalability', 'latency', 'throughput',
    'microservices', 'django', 'react', 'typescript', 'go', 'rust', 'aws', 'gcp',
    'kubernetes', 'docker', 'redis', 'kafka', 'load balancing', 'caching',
    'algorithm', 'data structure', 'leetcode', 'code review', 'tdd', 'ci/cd',
    'agile', 'sprint', 'stakeholder', 'p&l', 'roadmap', 'ml', 'ai'
  ],
  startup: [
    'full stack', 'react', 'next.js', 'node.js', 'typescript', 'python',
    'aws', 'gcp', 'firebase', 'mongodb', 'postgresql', 'redis', 'docker',
    'ci/cd', 'github', 'api', 'rest', 'graphql', 'mobile', 'responsive',
    'product', 'user', 'shipped', 'launched', 'prototype', 'mvp', 'agile',
    'startup', 'growth', 'scale', 'fast', 'lean'
  ],
  linkedin_mnc: [
    'consulting', 'client', 'stakeholder', 'communication', 'presentation',
    'aws', 'azure', 'gcp', 'cloud', 'oracle', 'salesforce', 'sap',
    'pmp', 'scrum', 'agile', 'jira', 'confluence', 'leadership',
    'team management', 'mentoring', 'strategic', 'roadmap', 'governance',
    'compliance', 'audit', 'risk management', 'sla', 'kpi', 'analytics'
  ]
};

// High-demand skills that boost scoring
const HIGH_DEMAND_SKILLS = [
  'react', 'typescript', 'node.js', 'python', 'go', 'rust', 'aws', 'gcp',
  'azure', 'docker', 'kubernetes', 'terraform', 'redis', 'kafka', 'postgresql',
  'mongodb', 'graphql', 'machine learning', 'deep learning', 'system design',
  'microservices', 'ci/cd', 'devops', 'sre', 'data engineering', 'spark'
];

// Tier-1 Indian institutions
const TIER_1_INSTITUTES = [
  'iit', 'nit', 'bits', 'iiit', 'iisc', 'iim', 'isb', 'xlri', 'spjain',
  'tifr', 'cmi', 'isi'
];

// Tier-2 Indian institutions
const TIER_2_INSTITUTES = [
  'dtu', 'nsut', 'iiitd', 'iiith', 'iiitb', 'lnmiit', 'mnit', 'motilal',
  'vit', 'vellore', 'srm', 'bit', 'mesra', 'thapar', 'daiict', 'coep',
  'pict', 'vit pune', 'manipal', 'symbiosis', 'christ'
];

// Action verbs (STAR format indicator)
const STAR_VERBS = [
  'achieved', 'delivered', 'launched', 'built', 'designed', 'architected',
  'developed', 'implemented', 'optimized', 'reduced', 'improved', 'increased',
  'generated', 'saved', 'led', 'managed', 'spearheaded', 'drove', 'created',
  'established', 'pioneered', 'transformed', 'accelerated', 'scaled',
  'migrated', 'consolidated', 'automated', 'engineered', 'deployed'
];

// Cliché phrases to flag
const CLICHE_PHRASES = [
  'hardworking', 'team player', 'go-getter', 'passionate', 'quick learner',
  'self-motivated', 'results-driven', 'proactive', 'think outside the box',
  'synergy', 'rockstar', 'ninja', 'guru', 'detail-oriented', 'people person',
  'responsible for', 'handled', 'worked on'
];

// ===================== PARSING =====================

/**
 * Parse a DOCX buffer and extract text content.
 */
export async function parseDocx(buffer: Buffer): Promise<ParsedResume> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    return {
      text,
      wordCount,
      hasMultipleColumns: false,
      hasTables: false,
      hasTextBoxes: false,
      isScanned: false,
      pageCount: Math.ceil(wordCount / 350) // rough estimate
    };
  } catch (err: any) {
    console.error('DOCX parsing error:', err);
    throw new Error('Failed to parse DOCX file: ' + (err.message || 'Unknown error'));
  }
}

/**
 * Parse a PDF buffer and extract text content.
 */
export async function parsePdf(buffer: Buffer): Promise<ParsedResume> {
  try {
    // pdf-parse is a CommonJS module — handle both ESM and CJS exports
    const pdfModule = await import('pdf-parse');
    const pdfParse = (pdfModule as any).default || pdfModule;
    const data = await pdfParse(buffer);
    const text = data.text || '';
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    return {
      text: text || '',
      wordCount,
      hasMultipleColumns: false,
      hasTables: false,
      hasTextBoxes: false,
      isScanned: text.trim().length < 50,
      pageCount: data.numpages || Math.ceil(wordCount / 350)
    };
  } catch (err: any) {
    console.error('PDF parsing error:', err);
    throw new Error('Failed to parse PDF file: ' + (err.message || 'Unknown error'));
  }
}

// ===================== TEXT ANALYSIS HELPERS =====================

function detectSection(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}


function extractCGPA(text: string): number | null {
  // Match patterns like "CGPA: 8.5", "GPA: 7.8", "8.5/10", "7.2 CGPA"
  const patterns = [
    /cgpa[:\s]*(\d+\.?\d*)/i,
    /gpa[:\s]*(\d+\.?\d*)/i,
    /(\d+\.\d+)\s*\/\s*10/i,
    /(\d+\.\d+)\s*cgpa/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (val > 0 && val <= 10) return val;
    }
  }
  return null;
}

function extractPercentage(text: string): number | null {
  const patterns = [
    /(\d{2,3})\s*%/,
    /percentage[:\s]*(\d{2,3})/i,
    /(\d{2,3})\s*percent/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (val > 0 && val <= 100) return val;
    }
  }
  return null;
}

function detectCollegeTier(text: string): string {
  const lower = text.toLowerCase();
  if (TIER_1_INSTITUTES.some(t => lower.includes(t))) return 'Tier-1';
  if (TIER_2_INSTITUTES.some(t => lower.includes(t))) return 'Tier-2';
  return 'Tier-3 (Standard)';
}

function detectNoticePeriod(text: string): string | null {
  const patterns = [
    /(\d+)\s*days?\s*notice/i,
    /(\d+)\s*month[bs]?\s*notice/i,
    /immediate\s*(joiner|available|join)/i,
    /notice\s*period[:\s]*(\d+)/i,
    /serving\s*notice/i,
    /lwd/i,
    /last working day/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0];
  }
  return null;
}

function extractPII(text: string): string[] {
  const pii: string[] = [];
  // Email
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) pii.push('email');
  // Phone
  if (/\b\d{10}\b/.test(text) || /\b\d{5}\s*\d{5}\b/.test(text)) pii.push('phone');
  // LinkedIn
  if (/linkedin\.com\/in\//i.test(text)) pii.push('linkedin');
  // GitHub
  if (/github\.com\//i.test(text)) pii.push('github');
  // Location
  if (/\b(bengaluru|bangalore|mumbai|delhi|pune|hyderabad|chennai|noida|gurgaon|kolkata|ahmedabad)\b/i.test(text)) pii.push('location');
  return pii;
}

function countStarAchievements(text: string): { achievements: number; responsibilities: number } {
  const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 20);
  let achievements = 0;
  let responsibilities = 0;

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase().trim();
    const hasStarVerb = STAR_VERBS.some(v => lower.includes(v));
    const hasMetric = /\d+%|\d+x|\d+ms|\$\d+|\d+million|\d+users|\d+req|\d+query/i.test(sentence);
    const isResponsibility = /responsible for|handled|tasked with|worked on|involved in/i.test(lower);

    if (hasStarVerb && hasMetric) {
      achievements++;
    } else if (isResponsibility || !hasStarVerb) {
      responsibilities++;
    } else {
      achievements++;
    }
  }

  return { achievements: Math.max(1, achievements), responsibilities: Math.max(1, responsibilities) };
}

function detectResumeSections(text: string): ResumeSection {
  const lower = text.toLowerCase();
  return {
    hasContact: detectSection(lower, ['email', 'phone', 'mobile', 'contact']),
    hasObjective: detectSection(lower, ['objective', 'summary', 'profile']),
    hasEducation: detectSection(lower, ['education', 'b.tech', 'b.e', 'm.tech', 'bachelor', 'master', 'degree', 'university', 'college', 'school']),
    hasSkills: detectSection(lower, ['skills', 'technologies', 'programming', 'languages', 'tech stack', 'technical']),
    hasExperience: detectSection(lower, ['experience', 'work history', 'employment', 'professional']),
    hasInternship: detectSection(lower, ['internship', 'intern', 'trainee']),
    hasProjects: detectSection(lower, ['projects', 'project', 'portfolio']),
    hasCertification: detectSection(lower, ['certification', 'certificate', 'license', 'accreditation']),
    hasAchievement: detectSection(lower, ['achievement', 'award', 'honor', 'recognition', 'accomplishment']),
    hasExtracurricular: detectSection(lower, ['extracurricular', 'volunteer', 'co-curricular', 'hobbies', 'interests']),
    hasLanguages: detectSection(lower, ['languages', 'english', 'hindi']),
    hasDeclaration: detectSection(lower, ['declaration', 'certify']),
    hasCGPA: /cgpa|gpa|percentage|aggregate/i.test(lower),
    hasGithub: /github/i.test(lower),
    hasLinkedIn: /linkedin/i.test(lower),
    hasNoticePeriod: /notice\s*period|notice\s*days|immediate\s*joiner|serving\s*notice/i.test(lower),
    hasCurrentCTC: /current\s*ctc|present\s*ctc/i.test(lower),
    hasExpectedCTC: /expected\s*ctc|desired\s*ctc/i.test(lower),
  };
}

function findClichePhrases(text: string): string[] {
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const phrase of CLICHE_PHRASES) {
    if (lower.includes(phrase)) {
      found.push(phrase);
    }
  }
  return found;
}

// ===================== SCORING FUNCTIONS =====================

function scoreFormat(text: string, parsedData: any): FormatScoreResult {
  const breakdown: ScoreItem[] = [];
  let score = 0;
  const maxScore = 20;

  // 1. Character count adequacy (3 pts)
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount >= 300 && wordCount <= 1200) {
    score += 3;
    breakdown.push({ label: 'Resume length adequacy', points: 3, max: 3, passed: true, message: `Word count is ${wordCount} — within optimal 300-1200 range.` });
  } else if (wordCount > 200 && wordCount < 1500) {
    score += 1;
    breakdown.push({ label: 'Resume length adequacy', points: 1, max: 3, passed: true, message: `Word count is ${wordCount} — slightly outside ideal 300-1200 but acceptable.` });
  } else {
    breakdown.push({ label: 'Resume length adequacy', points: 0, max: 3, passed: false, message: `Word count is ${wordCount} — outside optimal 300-1200 range.` });
  }

  // 2. Contact info presence (3 pts)
  const hasEmail = /\S+@\S+\.\S+/.test(text);
  const hasPhone = /\b\d{10}\b/.test(text) || /\+\d{1,3}\s*\d{10}/.test(text);
  const contactPoints = (hasEmail ? 1.5 : 0) + (hasPhone ? 1.5 : 0);
  score += contactPoints;
  breakdown.push({
    label: 'Contact information', points: contactPoints, max: 3,
    passed: contactPoints >= 2,
    message: hasEmail && hasPhone ? 'Email and phone found.' : hasEmail ? 'Email found, phone missing.' : hasPhone ? 'Phone found, email missing.' : 'No contact info found!'
  });

  // 3. No tables detection (3 pts)
  const hasTableMarkers = /\b(table|column|row|cell)\b/i.test(text);
  const noTablesScore = hasTableMarkers ? 1 : 3;
  score += noTablesScore;
  breakdown.push({
    label: 'No complex tables/columns', points: noTablesScore, max: 3,
    passed: noTablesScore >= 2,
    message: hasTableMarkers ? 'Possible table formatting detected — ATS may misread.' : 'Clean text flow, no table formatting detected.'
  });

  // 4. Bullet point usage (3 pts)
  const bulletCount = (text.match(/^[-•*]\s/mg) || []).length;
  const bulletScore = bulletCount >= 5 ? 3 : bulletCount >= 2 ? 1.5 : 0;
  score += bulletScore;
  breakdown.push({
    label: 'Bullet point formatting', points: bulletScore, max: 3,
    passed: bulletScore >= 2,
    message: bulletCount >= 5 ? `${bulletCount} bullet points found — excellent structure.` : bulletCount >= 2 ? `Only ${bulletCount} bullet points — add more for clarity.` : 'No bullet points detected — use bullet formatting for achievements.'
  });

  // 5. Proper spacing and sections (4 pts)
  const hasSectionBreaks = /\n\n[A-Z\s]+\n/.test(text) || /\n[A-Z][a-z]+:\n/.test(text);
  score += hasSectionBreaks ? 4 : 1;
  breakdown.push({
    label: 'Section breaks & headers', points: hasSectionBreaks ? 4 : 1, max: 4,
    passed: hasSectionBreaks,
    message: hasSectionBreaks ? 'Clear section headers with spacing detected.' : 'Section headers not clearly delineated — use bold capital section titles.'
  });

  // 6. No scanned PDF (4 pts)
  const isScanned = wordCount < 30;
  score += isScanned ? 0 : 4;
  breakdown.push({
    label: 'Selectable text (not scanned)', points: isScanned ? 0 : 4, max: 4,
    passed: !isScanned,
    message: isScanned ? 'WARNING: Resume appears to be a scanned image. ATS cannot read scanned PDFs!' : 'Selectable text detected — ATS-compatible.'
  });

  return { score: Math.min(score, maxScore), maxScore, breakdown };
}

function scoreSections(sections: ResumeSection): SectionsScoreResult {
  const breakdown: ScoreItem[] = [];
  let score = 0;
  const maxScore = 20;

  const sectionChecks: { label: string; check: boolean; weight: number }[] = [
    { label: 'Education section', check: sections.hasEducation, weight: 3 },
    { label: 'Skills section', check: sections.hasSkills, weight: 3 },
    { label: 'Work Experience section', check: sections.hasExperience, weight: 3.5 },
    { label: 'Projects section', check: sections.hasProjects, weight: 2.5 },
    { label: 'Contact information', check: sections.hasContact, weight: 2 },
    { label: 'Internship section', check: sections.hasInternship, weight: 1.5 },
    { label: 'Certifications section', check: sections.hasCertification, weight: 1.5 },
    { label: 'Achievements section', check: sections.hasAchievement, weight: 1 },
    { label: 'LinkedIn profile link', check: sections.hasLinkedIn, weight: 1 },
    { label: 'GitHub profile link', check: sections.hasGithub, weight: 1 },
  ];

  for (const check of sectionChecks) {
    const points = check.check ? check.weight : 0;
    score += points;
    breakdown.push({
      label: check.label, points, max: check.weight,
      passed: check.check,
      message: check.check ? 'Present' : 'Missing — consider adding this section.'
    });
  }

  return { score: Math.min(score, maxScore), maxScore, breakdown };
}

function scoreKeywords(text: string, jdText: string, track: TrackKey): KeywordScoreResult {
  const lower = text.toLowerCase();
  const breakdown: ScoreItem[] = [];
  let score = 0;
  const maxScore = 30;

  const trackSpecificKeywords = TRACK_KEYWORDS[track] || [];
  const jdKeywords = jdText ? extractKeywordsFromJD(jdText) : [];

  // 1. Track-specific keyword match (15 pts)
  const matchedTrackKws = trackSpecificKeywords.filter(kw => lower.includes(kw.toLowerCase()));
  const trackMatchRate = trackSpecificKeywords.length > 0 ? matchedTrackKws.length / trackSpecificKeywords.length : 0;
  const trackScore = Math.min(15, Math.round(trackMatchRate * 15));
  score += trackScore;
  breakdown.push({
    label: `Track-specific keywords (${TRACKS[track].name})`,
    points: trackScore, max: 15,
    passed: trackScore >= 8,
    message: `Matched ${matchedTrackKws.length}/${trackSpecificKeywords.length} track keywords.`
  });

  // 2. JD keyword match (10 pts)
  let jdMatchScore = 0;
  let matchedJdKws: string[] = [];
  if (jdKeywords.length > 0) {
    matchedJdKws = jdKeywords.filter(kw => lower.includes(kw.toLowerCase()));
    const jdMatchRate = matchedJdKws.length / jdKeywords.length;
    jdMatchScore = Math.min(10, Math.round(jdMatchRate * 10));
  }
  score += jdMatchScore;
  breakdown.push({
    label: 'Job Description keyword alignment',
    points: jdMatchScore, max: 10,
    passed: jdMatchScore >= 5,
    message: jdText ? `Matched ${matchedJdKws.length}/${jdKeywords.length} JD keywords.` : 'No JD provided — no JD keywords scored.'
  });

  // 3. High-demand skills density (5 pts)
  const matchedDemandSkills = HIGH_DEMAND_SKILLS.filter(s => lower.includes(s));
  const demandScore = Math.min(5, Math.round((matchedDemandSkills.length / HIGH_DEMAND_SKILLS.length) * 5));
  score += demandScore;
  breakdown.push({
    label: 'High-demand market skills', points: demandScore, max: 5,
    passed: demandScore >= 2,
    message: `Found ${matchedDemandSkills.length} high-demand skills: ${matchedDemandSkills.slice(0, 5).join(', ') || 'none'}.`
  });

  const missingTrackKws = trackSpecificKeywords.filter(kw => !lower.includes(kw.toLowerCase()));
  const missingJdKws = jdKeywords.filter(kw => !lower.includes(kw.toLowerCase()));

  return {
    score: Math.min(score, maxScore), maxScore,
    matchedKeywords: [...matchedTrackKws, ...matchedJdKws],
    missingKeywords: [...missingTrackKws, ...missingJdKws],
    trackKeywordsPresent: matchedTrackKws,
    matchRate: trackMatchRate,
    breakdown
  };
}

function scoreIndiaSpecific(text: string): IndiaScoreResult {
  const lower = text.toLowerCase();
  const breakdown: ScoreItem[] = [];
  let score = 0;
  const maxScore = 30;
  const issues: string[] = [];
  const positives: string[] = [];

  // 1. CGPA/Grade Presence (8 pts)
  const cgpa = extractCGPA(text);
  const percentage = extractPercentage(text);
  let cgpaScore = 0;
  if (cgpa !== null || percentage !== null) {
    if (cgpa !== null && cgpa >= 8) {
      cgpaScore = 8;
      positives.push(`Strong CGPA: ${cgpa}/10`);
    } else if (cgpa !== null && cgpa >= 6.5) {
      cgpaScore = 5;
      positives.push(`CGPA: ${cgpa}/10 — meets most cutoff thresholds.`);
    } else if (cgpa !== null) {
      cgpaScore = 3;
      positives.push(`CGPA: ${cgpa}/10 — some companies may filter below 6.5.`);
    } else {
      cgpaScore = 4;
      positives.push('Academic percentage mentioned.');
    }
  } else {
    issues.push('No CGPA, GPA, or percentage found. Many Indian mass-hiring platforms auto-reject without this field.');
  }
  score += cgpaScore;
  breakdown.push({
    label: 'Academic grades (CGPA/Percentage)', points: cgpaScore, max: 8,
    passed: cgpaScore >= 4,
    message: cgpa !== null ? `CGPA: ${cgpa}/10` : percentage !== null ? `Percentage: ${percentage}%` : 'Missing — critical for Indian recruiters.'
  });

  // 2. College Tier Detection (7 pts)
  const collegeTier = detectCollegeTier(text);
  let tierScore = 0;
  if (collegeTier === 'Tier-1') {
    tierScore = 7;
    positives.push('Tier-1 academic pedigree (IIT/NIT/BITS/IIIT) — strong signal for Indian recruiters.');
  } else if (collegeTier === 'Tier-2') {
    tierScore = 4;
    positives.push('Tier-2 institution — good recognition in India.');
  } else {
    tierScore = 2;
    issues.push('College name not recognized as Tier-1 or Tier-2. Consider emphasizing academic achievements.');
  }
  score += tierScore;
  breakdown.push({
    label: 'College/institution tier', points: tierScore, max: 7,
    passed: tierScore >= 4,
    message: collegeTier
  });

  // 3. Notice Period (5 pts)
  const noticePeriod = detectNoticePeriod(text);
  let noticeScore = 0;
  if (noticePeriod) {
    const noticeLower = noticePeriod.toLowerCase();
    if (noticeLower.includes('immediate') || /30\s*days/i.test(noticeLower) || /15\s*days/i.test(noticeLower)) {
      noticeScore = 5;
      positives.push(`Notice period: ${noticePeriod} — attractive to recruiters.`);
    } else if (/45\s*days/i.test(noticeLower) || /60\s*days/i.test(noticeLower)) {
      noticeScore = 3;
      positives.push(`Notice period: ${noticePeriod} — moderately acceptable.`);
    } else {
      noticeScore = 2;
      issues.push(`Notice period: ${noticePeriod} — 90-day periods significantly reduce recruiter responses.`);
    }
  } else {
    issues.push('No notice period mentioned. Recruiters on Naukri and LinkedIn filter heavily by this field.');
  }
  score += noticeScore;
  breakdown.push({
    label: 'Notice period alignment', points: noticeScore, max: 5,
    passed: noticeScore >= 3,
    message: noticePeriod || 'Missing — recruiters search by notice period.'
  });

  // 4. 10th/12th marks mentions (4 pts)
  const hasTenth = /10(th|th standard|th class|th grade)|ssc|matriculation/i.test(lower);
  const hasTwelfth = /12(th|th standard|th class|th grade)|hsc|intermediate/i.test(lower);
  const academicScore = (hasTenth ? 2 : 0) + (hasTwelfth ? 2 : 0);
  score += academicScore;
  if (hasTenth && hasTwelfth) {
    positives.push('10th and 12th marks mentioned — important for mass hiring platforms.');
  } else if (!hasTenth && !hasTwelfth) {
    issues.push('10th and 12th marks not mentioned. TCS, Infosys, Wipro application forms require these.');
  }
  breakdown.push({
    label: '10th/12th marks mentioned', points: academicScore, max: 4,
    passed: academicScore >= 2,
    message: hasTenth && hasTwelfth ? 'Both mentioned' : hasTenth ? 'Only 10th mentioned' : hasTwelfth ? 'Only 12th mentioned' : 'Not mentioned — critical for mass hiring.'
  });

  // 5. PII Completeness (3 pts)
  const piiFound = extractPII(text);
  const piiScore = Math.min(3, piiFound.length);
  score += piiScore;
  breakdown.push({
    label: 'Profile completeness (email, phone, location)', points: piiScore, max: 3,
    passed: piiScore >= 2,
    message: `Found: ${piiFound.join(', ') || 'none'}.`
  });

  // 6. STAR achievement density (3 pts)
  const starCount = countStarAchievements(text);
  const achievementScore = starCount.achievements >= 5 ? 3 : starCount.achievements >= 2 ? 1.5 : 0;
  score += achievementScore;
  if (starCount.achievements >= 5) {
    positives.push(`Strong achievement density: ${starCount.achievements} STAR-format achievements.`);
  } else {
    issues.push(`Only ${starCount.achievements} quantified achievements. Indian recruiters prefer metrics-backed statements.`);
  }
  breakdown.push({
    label: 'Quantified achievements', points: achievementScore, max: 3,
    passed: achievementScore >= 1.5,
    message: `${starCount.achievements} STAR achievements, ${starCount.responsibilities} responsibility-based items.`
  });

  return {
    score: Math.min(score, maxScore), maxScore, breakdown,
    issues, positives,
    cgpa, collegeTier, noticePeriod, piiFound
  };
}

function scoreTrackBonus(text: string, track: TrackKey): TrackBonusResult {
  const breakdown: ScoreItem[] = [];
  let score = 0;
  const maxScore = 10;
  const lower = text.toLowerCase();

  switch (track) {
    case 'mass_hiring':
      // Extra for: declaration, languages, gap explanation, backlogs
      if (/declaration/i.test(lower)) { score += 3; breakdown.push({ label: 'Declaration statement', points: 3, max: 3, passed: true, message: 'Declaration present — helps mass hiring applications.' }); }
      else { breakdown.push({ label: 'Declaration statement', points: 0, max: 3, passed: false, message: 'Missing declaration.' }); }
      if (/\b(english|hindi|marathi|tamil|telugu|kannada|malayalam|bengali|gujarati)\b/i.test(lower)) { score += 2; breakdown.push({ label: 'Languages known', points: 2, max: 2, passed: true, message: 'Languages listed.' }); }
      else { breakdown.push({ label: 'Languages known', points: 0, max: 2, passed: false, message: 'Languages not listed.' }); }
      if (/backlog|gap|year gap|career break/i.test(lower)) { score += 3; breakdown.push({ label: 'Gap/backlog explanation', points: 3, max: 3, passed: true, message: 'Gap/backlog explained proactively.' }); }
      else { breakdown.push({ label: 'Gap/backlog explanation', points: 0, max: 3, passed: false, message: 'No gap explanation — proactively address if applicable.' }); }
      break;

    case 'naukri':
      if (/notice\s*period|immediate|serving\s*notice/i.test(lower)) { score += 3; breakdown.push({ label: 'Notice period SEO', points: 3, max: 3, passed: true, message: 'Notice period mentioned — crucial for Naukri filtering.' }); }
      else { breakdown.push({ label: 'Notice period SEO', points: 0, max: 3, passed: false, message: 'Notice period missing — Naukri filters by this.' }); }
      if (/ctc|expected|current\s*ctc/i.test(lower)) { score += 2; breakdown.push({ label: 'CTC expectations', points: 2, max: 2, passed: true, message: 'CTC mentioned.' }); }
      else { breakdown.push({ label: 'CTC expectations', points: 0, max: 2, passed: false, message: 'CTC not mentioned — useful for recruiter filters.' }); }
      if (/(bangalore|bengaluru|mumbai|pune|hyderabad|delhi|noida|gurgaon|chennai)/i.test(lower)) { score += 3; breakdown.push({ label: 'Location clarity', points: 3, max: 3, passed: true, message: 'Location mentioned — critical for location filters.' }); }
      else { breakdown.push({ label: 'Location clarity', points: 0, max: 3, passed: false, message: 'Location missing.' }); }
      break;

    case 'faang_india':
      if (/system\s*design|distributed|scalab/i.test(lower)) { score += 3; breakdown.push({ label: 'System design keywords', points: 3, max: 3, passed: true, message: 'System design terminology found.' }); }
      else { breakdown.push({ label: 'System design keywords', points: 0, max: 3, passed: false, message: 'System design keywords missing — critical for FAANG.' }); }
      if (/\d+%|\d+x|\d+ms|\d+million/i.test(lower)) { score += 3; breakdown.push({ label: 'Quantified impact metrics', points: 3, max: 3, passed: true, message: 'Quantified metrics found.' }); }
      else { breakdown.push({ label: 'Quantified impact metrics', points: 0, max: 3, passed: false, message: 'No quantified metrics — FAANG requires numbers.' }); }
      const starRatio = countStarAchievements(text);
      if (starRatio.achievements > starRatio.responsibilities) { score += 2; breakdown.push({ label: 'Achievement > responsibility ratio', points: 2, max: 2, passed: true, message: 'More achievements than responsibilities — excellent.' }); }
      else { breakdown.push({ label: 'Achievement > responsibility ratio', points: 0, max: 2, passed: false, message: 'More responsibilities than achievements — rewrite duties as accomplishments.' }); }
      break;

    case 'startup':
      if (/\b(react|next\.?js|node\.?js|typescript|python|go)\b/i.test(lower)) { score += 3; breakdown.push({ label: 'Modern stack keywords', points: 3, max: 3, passed: true, message: 'Modern tech stack found.' }); }
      else { breakdown.push({ label: 'Modern stack keywords', points: 0, max: 3, passed: false, message: 'No modern stack keywords — startups look for React/Node/Python.' }); }
      if (/\b(shipped|launched|mvp|prototype|built\s(from\s+scratch|0\s+to))\b/i.test(lower)) { score += 3; breakdown.push({ label: 'Product shipping language', points: 3, max: 3, passed: true, message: 'Product-shipping language detected — great for startup culture.' }); }
      else { breakdown.push({ label: 'Product shipping language', points: 0, max: 3, passed: false, message: 'No product launch language — startups value builders.' }); }
      if (/github\.com|portfolio|personal\s*website/i.test(lower)) { score += 2; breakdown.push({ label: 'Portfolio/GitHub link', points: 2, max: 2, passed: true, message: 'Portfolio/GitHub found.' }); }
      else { breakdown.push({ label: 'Portfolio/GitHub link', points: 0, max: 2, passed: false, message: 'No portfolio/GitHub — startups review code.' }); }
      break;

    case 'linkedin_mnc':
      if (/linkedin\.com\/in\//i.test(lower)) { score += 3; breakdown.push({ label: 'LinkedIn profile link', points: 3, max: 3, passed: true, message: 'LinkedIn URL included — MNCs verify online presence.' }); }
      else { breakdown.push({ label: 'LinkedIn profile link', points: 0, max: 3, passed: false, message: 'LinkedIn missing — consultants must have visible profiles.' }); }
      if (/\b(aws|azure|gcp|cloud)\b/i.test(lower) && /\b(certif|license|accreditat)\b/i.test(lower)) { score += 3; breakdown.push({ label: 'Cloud certifications', points: 3, max: 3, passed: true, message: 'Cloud certifications found.' }); }
      else { breakdown.push({ label: 'Cloud certifications', points: 0, max: 3, passed: false, message: 'No cloud certifications — MNCs value AWS/Azure/GCP certs.' }); }
      if (/leadership|mentor|team\s*lead|manager|director|head\s*of/i.test(lower)) { score += 2; breakdown.push({ label: 'Leadership keywords', points: 2, max: 2, passed: true, message: 'Leadership language detected.' }); }
      else { breakdown.push({ label: 'Leadership keywords', points: 0, max: 2, passed: false, message: 'No leadership language — soft skills matter in consulting.' }); }
      break;
  }

  return { score: Math.min(score, maxScore), maxScore, breakdown };
}

function extractKeywordsFromJD(jdText: string): string[] {
  const lower = jdText.toLowerCase();
  // Extract words that look like skills/technologies (capitalized words, tech terms)
  const techPatterns = [
    /(react|node\.?js|python|java|javascript|typescript|go|rust|c\+\+|ruby|php|swift|kotlin)/gi,
    /(aws|gcp|azure|docker|kubernetes|terraform|ansible|jenkins)/gi,
    /(postgresql|mysql|mongodb|redis|elasticsearch|cassandra|dynamodb)/gi,
    /(kafka|rabbitmq|sqs|pulsar)/gi,
    /(graphql|rest|grpc|soap)/gi,
    /(machine learning|deep learning|nlp|computer vision|data science)/gi,
    /(agile|scrum|jira|confluence|saas|paas|microservices|serverless)/gi,
    /(system design|distributed systems|scalability|high availability)/gi,
  ];

  const keywords = new Set<string>();
  for (const pattern of techPatterns) {
    const matches = jdText.match(pattern);
    if (matches) {
      matches.forEach(m => keywords.add(m.toLowerCase()));
    }
  }

  // Also extract noun phrases that appear 2+ times (potential skills)
  const words = lower.split(/\W+/).filter(w => w.length > 3);
  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  }

  // Only take words that appear >1 as extracted keywords
  for (const [word, freq] of Object.entries(wordFreq)) {
    if (freq > 1 && keywords.size < 20) {
      keywords.add(word);
    }
  }

  return Array.from(keywords).slice(0, 25);
}

function generateRecommendations(
  formatScore: FormatScoreResult,
  sectionsScore: SectionsScoreResult,
  keywordScore: KeywordScoreResult,
  indiaScore: IndiaScoreResult,
  trackScore: TrackBonusResult,
  sections: ResumeSection,
  track: TrackKey,
  jdText: string
): AnalysisResult['recommendations'] {
  const recs: AnalysisResult['recommendations'] = [];

  // Format recommendations
  for (const item of formatScore.breakdown) {
    if (!item.passed && item.points < item.max) {
      recs.push({
        priority: 'HIGH',
        action: `Fix format: ${item.label}`,
        why: item.message || 'Improve formatting for ATS readability.'
      });
    }
  }

  // Section recommendations
  for (const item of sectionsScore.breakdown) {
    if (!item.passed) {
      recs.push({
        priority: 'MEDIUM',
        action: `Add missing section: ${item.label}`,
        why: item.message || `This section is standard in Indian ${TRACKS[track].name} applications.`
      });
    }
  }

  // Keyword recommendations
  if (keywordScore.missingKeywords.length > 0) {
    recs.push({
      priority: 'HIGH',
      action: `Integrate missing track keywords: ${keywordScore.missingKeywords.slice(0, 5).join(', ')}${keywordScore.missingKeywords.length > 5 ? '...' : ''}`,
      why: `Including these track-specific keywords improves your compliance score for ${TRACKS[track].name}.`
    });
  }

  // India-specific recommendations
  for (const issue of indiaScore.issues) {
    recs.push({
      priority: 'CRITICAL',
      action: issue.split('.')[0],
      why: issue
    });
  }

  // India-specific positives as recommendations
  if (indiaScore.cgpa === null) {
    recs.push({
      priority: 'HIGH',
      action: 'Add your CGPA/GPA explicitly in the education section',
      why: 'TCS, Infosys, Wipro, and many Indian companies have strict CGPA cutoffs (usually 6.5+). Without this, your application gets auto-rejected.'
    });
  }

  if (!sections.hasNoticePeriod) {
    recs.push({
      priority: 'HIGH',
      action: 'Explicitly state your notice period in the header or summary',
      why: 'Recruiters on Naukri and LinkedIn filter candidates by notice period. "Immediate" or "30 days" gets 3x more responses than leaving it blank.'
    });
  }

  // Track-specific CRITICAL recommendations
  if (track === 'faang_india') {
    const starCount = countStarAchievements(keywordScore.matchedKeywords.join(' '));
    if (starCount.achievements < 3) {
      recs.push({
        priority: 'CRITICAL',
        action: 'Rewrite achievements using STAR format with quantified metrics',
        why: 'FAANG India recruiters expect every bullet to show measurable impact (%, latency reduction, revenue increase). Generic responsibility descriptions will not pass screening.'
      });
    }
  }

  if (track === 'mass_hiring') {
    recs.push({
      priority: 'HIGH',
      action: 'Ensure 10th, 12th, and graduation marks are all clearly listed',
      why: 'TCS/Infosys/Cognizant application forms explicitly ask for each. Missing any leads to incomplete application status.'
    });
  }

  // JD-based recommendations
  if (jdText && keywordScore.missingKeywords.length > 0) {
    recs.push({
      priority: 'HIGH',
      action: `Add these missing JD keywords to your resume: ${keywordScore.missingKeywords.slice(0, 5).join(', ')}`,
      why: 'Your resume is missing keywords from the target job description. Adding them naturally increases ATS match rate.'
    });
  }

  // General improvement
  const cliches = findClichePhrases(keywordScore.matchedKeywords.join(' '));
  if (cliches.length > 0) {
    recs.push({
      priority: 'MEDIUM',
      action: `Remove cliché phrases: ${cliches.join(', ')}`,
      why: 'These phrases add zero signal and waste precious resume real estate.'
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  recs.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

  // Limit to top 10 recommendations
  return recs.slice(0, 10);
}

// ===================== MAIN ANALYZER =====================

/**
 * Analyze a resume against the Indian job market criteria.
 * This runs locally in < 5 seconds without any AI API calls.
 */
export async function analyzeResume(
  extractedText: string,
  parsedData: any,
  jdText: string,
  track: TrackKey
): Promise<AnalysisResult> {
  const text = extractedText || '';
  const parsed = parsedData || {};

  // Run all scoring modules
  const formatResult = scoreFormat(text, parsed);
  const sections = detectResumeSections(text);
  const sectionsResult = scoreSections(sections);
  const keywordsResult = scoreKeywords(text, jdText, track);
  const indiaResult = scoreIndiaSpecific(text);
  const trackResult = scoreTrackBonus(text, track);

  // Calculate total (max 100 from base, track bonus is extra)
  const totalScore = Math.min(100, Math.round(formatResult.score + sectionsResult.score + keywordsResult.score + indiaResult.score));
  const trackBonusScore = trackResult.score;

  // Generate grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 67) grade = 'B';
  else if (totalScore >= 52) grade = 'C';
  else if (totalScore >= 38) grade = 'D';
  else grade = 'F';

  // Generate keyword gaps and matches
  const keywordGaps = [...new Set(keywordsResult.missingKeywords)].slice(0, 15);
  const keywordMatches = [...new Set(keywordsResult.matchedKeywords)].slice(0, 15);

  // Generate recommendations
  const recommendations = generateRecommendations(
    formatResult, sectionsResult, keywordsResult, indiaResult, trackResult,
    sections, track, jdText
  );

  // Verdict text
  let verdict = '';
  if (totalScore >= 80) verdict = 'Excellent — this resume is well-calibrated for Indian recruiters and ATS systems.';
  else if (totalScore >= 67) verdict = 'Good — minor optimizations will significantly improve shortlisting rates.';
  else if (totalScore >= 52) verdict = 'Average — several key Indian-market elements are missing or weak.';
  else verdict = 'Needs overhaul — critical gaps in Indian recruiter expectations.';

  return {
    totalScore,
    grade,
    verdict,
    formatScore: formatResult.score,
    sectionsScore: sectionsResult.score,
    keywordsScore: keywordsResult.score,
    indiaScore: indiaResult.score,
    trackBonusScore,
    scoreBreakdown: {
      format: formatResult,
      sections: sectionsResult,
      keywords: keywordsResult,
      india: indiaResult,
      trackBonus: trackResult,
    },
    keywordGaps,
    keywordMatches: keywordsResult.trackKeywordsPresent,
    recommendations,
    cgpa: indiaResult.cgpa,
    collegeTier: indiaResult.collegeTier,
    sections,
    indiaIssues: indiaResult.issues,
    indiaPositives: indiaResult.positives
  };
}
