/**
 * ATScore India - Cloudflare Worker Backend
 * Handles all API routes for resume scoring, auth, payments, and premium features.
 * Uses Cloudflare KV for persistent storage.
 */

// ===================== TYPES =====================
interface User {
  id: string; email: string; name: string; plan: 'free' | 'paid';
  plan_expires_at: number | null; has_byok: boolean;
  analyses_used_today: number; created_at: number;
  password_hash: string; byok_key_encrypted?: string | null;
}
interface Resume { id: string; user_id: string; name: string; file_type: string; word_count: number; extracted_text: string; parsed_data: any; created_at: number; updated_at: number; }
interface Analysis { id: string; user_id: string; resume_id: string; resume_name: string; jd_text: string; track: string; total_score: number; format_score: number; sections_score: number; keywords_score: number; india_score: number; track_bonus_score: number; score_breakdown: any; keyword_gaps: string[]; keyword_matches: string[]; recommendations: any[]; ai_feedback: any; ai_feedback_generated_at: number | null; created_at: number; }
interface PaymentRecord { id: string; user_id: string; razorpay_order_id: string; razorpay_payment_id?: string; amount: number; status: string; created_at: number; paid_at?: number; }
interface CoverLetterRecord { id: string; user_id: string; resume_id: string; track: string; jd_snippet: string; cover_letter: string; word_count: number; created_at: string; }
interface OfferAnalysis { id: string; user_id: string; role: string; company: string; location: string; experience_years: number; ctc_breakdown: any; in_hand_monthly_estimate: number; variable_percentage: number; red_flags: string[]; positive_points: string[]; market_comparison: string; negotiation_room: string; negotiation_email: string; negotiation_verbal_script: string; recommended_ask_ctc: number; created_at: string; }
interface AppRecord { id: string; user_id: string; company: string; role: string; location: string; track: string; portal: string; applied_date: string; status: string; ats_score: number | null; analysis_id: string | null; resume_version: string | null; recruiter_name: string; recruiter_email: string; notes: string; ctc_offered: number | null; next_action: string; next_action_date: string; created_at: string; updated_at: string; }
interface TailoredResume { id: string; user_id: string; source_resume_id: string; jd_snippet: string; track: string; professional_summary: string; skills: string[]; experience_bullets: any; added_keywords: string[]; original_score: number; estimated_score_improvement: number; full_tailored_text: string; created_at: string; }
interface LinkedInProfile { id: string; user_id: string; track: string; headlines: string[]; about_section: string; skills_to_add: string[]; completeness_checklist: Array<{item:string;impact:string;done:boolean}>; created_at: string; }

// ===================== KV HELPERS =====================
async function kvGet(env: any, key: string): Promise<any> {
  try { const val = await env.KV_DATA.get(key, 'json'); return val; } catch { return null; }
}
async function kvPut(env: any, key: string, value: any): Promise<void> {
  await env.KV_DATA.put(key, JSON.stringify(value));
}
async function kvDelete(env: any, key: string): Promise<void> {
  await env.KV_DATA.delete(key);
}
async function kvList(env: any, prefix: string): Promise<string[]> {
  try {
    const list = await env.KV_DATA.list({ prefix });
    return list.keys.map(k => k.name);
  } catch { return []; }
}

// ===================== USER / AUTH =====================
async function getUser(env: any, userId: string): Promise<User | null> {
  return kvGet(env, `user:${userId}`);
}
async function getUserByEmail(env: any, email: string): Promise<User | null> {
  const userId = await kvGet(env, `email:${email.toLowerCase()}`);
  if (!userId) return null;
  return getUser(env, userId);
}
async function saveUser(env: any, user: User): Promise<void> {
  await kvPut(env, `user:${user.id}`, user);
  await kvPut(env, `email:${user.email.toLowerCase()}`, user.id);
}

// ===================== SCORING ENGINE (PURE TS) =====================
// Inlined from server/engine.ts for Worker compatibility
const TRACK_KEYWORDS: Record<string, string[]> = {
  mass_hiring: ['cgpa','percentage','10th','12th','backlog','aggregate','graduation','b.tech','m.tech','b.e','communication'],
  naukri: ['notice period','immediate','serving notice','ctc','expected ctc','skills','remote','node.js','react','python'],
  faang_india: ['system design','distributed systems','scalability','latency','throughput','microservices'],
  startup: ['full stack','react','next.js','node.js','typescript','python','aws','api'],
  linkedin_mnc: ['consulting','client','stakeholder','communication','aws','azure','cloud','pmp','scrum']
};

function scoreResume(text: string, jdText: string, track: string): any {
  const words = text.split(/\s+/).filter((w: string) => w.length > 0);
  const wordCount = words.length;
  const lower = text.toLowerCase();

  // Format (20pts)
  let formatScore = 0;
  const formatDetails: any[] = [];
  if (wordCount >= 300 && wordCount <= 1200) { formatScore += 5; formatDetails.push({ label: 'Length', passed: true, message: `${wordCount} words` }); }
  else { formatDetails.push({ label: 'Length', passed: false, message: `${wordCount} words` }); }
  const hasEmail = /\S+@\S+\.\S+/.test(text);
  const hasPhone = /\b\d{10}\b/.test(text);
  if (hasEmail && hasPhone) { formatScore += 5; formatDetails.push({ label: 'Contact', passed: true, message: 'Email + phone found' }); }
  else { formatDetails.push({ label: 'Contact', passed: false, message: 'Missing contact info' }); }
  const bullets = (text.match(/^[-•*]\s/mg) || []).length;
  if (bullets >= 5) { formatScore += 5; formatDetails.push({ label: 'Bullets', passed: true, message: `${bullets} bullets` }); }
  else { formatDetails.push({ label: 'Bullets', passed: false, message: 'Use bullet points' }); }
  const hasSections = /\n\n[A-Z\s]+\n/.test(text);
  if (hasSections) { formatScore += 5; formatDetails.push({ label: 'Sections', passed: true, message: 'Clear sections' }); }
  else { formatDetails.push({ label: 'Sections', passed: false, message: 'Missing section headers' }); }

  // Sections (20pts)
  let sectionsScore = 0;
  const sectionDetails: any[] = [];
  const checks: [string, RegExp][] = [
    ['Education', /education|b\.tech|bachelor|degree|university|college/i],
    ['Skills', /skills|technologies|programming/i],
    ['Experience', /experience|work history|employment/i],
    ['Projects', /projects|portfolio/i],
    ['Contact Info', /email|phone|contact/i],
  ];
  for (const [name, regex] of checks) {
    const found = regex.test(lower);
    if (found) { sectionsScore += 4; sectionDetails.push({ label: name, passed: true }); }
    else { sectionDetails.push({ label: name, passed: false }); }
  }

  // Keywords (30pts)
  let kwScore = 0;
  const trackKws = TRACK_KEYWORDS[track] || [];
  const matchedKws = trackKws.filter((kw: string) => lower.includes(kw));
  const kwRate = trackKws.length > 0 ? matchedKws.length / trackKws.length : 0;
  kwScore += Math.min(15, Math.round(kwRate * 15));

  const jdKws: string[] = [];
  if (jdText) {
    const jdLower = jdText.toLowerCase();
    const techTerms = ['react','node','python','java','typescript','aws','gcp','docker','kubernetes','sql','redis','kafka','api','frontend','backend','full stack','devops','system design','microservices','agile','scrum'];
    for (const t of techTerms) { if (jdLower.includes(t)) jdKws.push(t); }
    const matchedJd = jdKws.filter((kw: string) => lower.includes(kw));
    kwScore += Math.min(10, Math.round((matchedJd.length / Math.max(1, jdKws.length)) * 10));
  }
  const demandSkills = ['react','typescript','node.js','python','aws','docker','kubernetes','postgresql','redis','kafka','system design','microservices','devops'];
  const matchedDemand = demandSkills.filter((s: string) => lower.includes(s));
  kwScore += Math.min(5, Math.round((matchedDemand.length / demandSkills.length) * 5));

  // India Intelligence (30pts)
  let indiaScore = 0;
  const indiaDetails: any[] = [];
  const issues: string[] = [];
  const positives: string[] = [];

  // CGPA
  const cgpaMatch = text.match(/cgpa[:\s]*(\d+\.?\d*)/i) || text.match(/gpa[:\s]*(\d+\.?\d*)/i) || text.match(/(\d+\.\d+)\s*\/\s*10/);
  const cgpa = cgpaMatch ? parseFloat(cgpaMatch[1]) : null;
  if (cgpa && cgpa >= 8) { indiaScore += 8; positives.push(`CGPA: ${cgpa}/10`); }
  else if (cgpa) { indiaScore += 4; positives.push(`CGPA: ${cgpa}/10`); }
  else { issues.push('No CGPA found — critical for Indian mass hiring platforms.'); }

  // College tier
  const tier1Institutes = ['iit','nit','bits','iiit','iisc','iim'];
  const tier2Institutes = ['dtu','nsut','vit','srm','thapar','manipal'];
  let collegeTier = 'Standard';
  for (const t of tier1Institutes) { if (lower.includes(t)) { collegeTier = 'Tier-1'; break; } }
  if (collegeTier === 'Standard') { for (const t of tier2Institutes) { if (lower.includes(t)) { collegeTier = 'Tier-2'; break; } } }
  if (collegeTier === 'Tier-1') { indiaScore += 7; positives.push('Tier-1 academic pedigree.'); }
  else if (collegeTier === 'Tier-2') { indiaScore += 4; positives.push('Tier-2 institution.'); }
  else { indiaScore += 2; issues.push('College not recognized as Tier-1/2.'); }

  // Notice period
  const noticeMatch = text.match(/(\d+)\s*days?\s*notice/i) || text.match(/immediate\s*(joiner|available)/i);
  const notice = noticeMatch ? noticeMatch[0] : null;
  if (notice) {
    if (notice.toLowerCase().includes('immediate') || /30\s*days/i.test(notice)) { indiaScore += 5; positives.push('Notice period: ' + notice); }
    else { indiaScore += 3; }
  } else { issues.push('Notice period missing — recruiters filter by this.'); }

  // 10th/12th
  if (/10(th|th class)|ssc|matriculation/i.test(lower)) indiaScore += 2;
  if (/12(th|th class)|hsc|intermediate/i.test(lower)) indiaScore += 2;
  if (!/10(th|th class)|ssc/i.test(lower) && !/12(th|th class)|hsc/i.test(lower)) {
    issues.push('10th/12th marks not mentioned.');
  }

  // PII + STAR
  const hasLinkedIn = /linkedin\.com\/in\//i.test(text);
  const hasGithub = /github\.com\//i.test(text);
  if (hasLinkedIn) indiaScore += 2;
  if (hasGithub) indiaScore += 2;
  const starVerbs = ['achieved','delivered','launched','built','designed','architected','developed','implemented','optimized','reduced','improved','increased'];
  const starCount = starVerbs.filter((v: string) => lower.includes(v)).length;
  if (starCount >= 3) { indiaScore += 4; positives.push(`${starCount} achievement verbs found.`); }

  const totalScore = Math.min(100, Math.round(formatScore + sectionsScore + kwScore + indiaScore));
  const grade = totalScore >= 80 ? 'A' : totalScore >= 67 ? 'B' : totalScore >= 52 ? 'C' : 'F';

  const missingKws = trackKws.filter((kw: string) => !lower.includes(kw));
  const missingJdKws = jdKws.filter((kw: string) => !lower.includes(kw));
  const gaps = [...new Set([...missingKws, ...missingJdKws])].slice(0, 10);

  const recommendations: any[] = [];
  for (const issue of issues) {
    recommendations.push({ priority: 'CRITICAL', action: issue.split('.')[0], why: issue });
  }
  if (gaps.length > 0) {
    recommendations.push({ priority: 'HIGH', action: `Add missing keywords: ${gaps.slice(0, 3).join(', ')}`, why: 'Improves ATS match rate for this track.' });
  }

  return {
    totalScore, grade, verdict: grade === 'A' ? 'Excellent' : grade === 'B' ? 'Good' : grade === 'C' ? 'Average' : 'Needs improvement',
    formatScore, sectionsScore, keywordsScore: kwScore, indiaScore, trackBonusScore: 0,
    scoreBreakdown: {
      format: { score: formatScore, maxScore: 20, breakdown: formatDetails },
      sections: { score: sectionsScore, maxScore: 20, breakdown: sectionDetails },
      keywords: { score: kwScore, maxScore: 30, matchedKeywords: matchedKws, missingKeywords: gaps },
      india: { score: indiaScore, maxScore: 30, cgpa, collegeTier, noticePeriod: notice, issues, positives, piiFound: [] }
    },
    keywordGaps: gaps, keywordMatches: matchedKws,
    recommendations: recommendations.slice(0, 8),
    cgpa, collegeTier, indiaIssues: issues, indiaPositives: positives
  };
}

// ===================== REQUEST HANDLER =====================
async function handleRequest(req: Request, env: any): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;
  const origin = req.headers.get('origin') || '';

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Helper: parse JSON body
  async function getBody(): Promise<any> {
    try { return await req.json(); } catch { return {}; }
  }

  // Helper: extract auth user from JWT (with signature verification)
  async function getAuthUser(): Promise<User | null> {
    const auth = req.headers.get('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
      const token = auth.substring(7);
      const payload = await verifyJWT(token, env.JWT_ACCESS_SECRET || 'your-jwt-secret');
      if (payload && payload.sub) return getUser(env, payload.sub);
    } catch {}
    return null;
  }

  // Combine response headers
  function jsonResponse(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ===================== ROUTES =====================

  try {
    // Health check
    if (path === '/api/health') {
      return jsonResponse({ status: 'ok', timestamp: Date.now() });
    }

    // === AUTH ===
    if (path === '/api/auth/signup' && method === 'POST') {
      const { email, name, password } = await getBody();
      if (!email || !name || !password) return jsonResponse({ error: 'All fields required' }, 400);
      if (password.length < 6) return jsonResponse({ error: 'Password min 6 characters' }, 400);

      const existing = await getUserByEmail(env, email);
      if (existing) return jsonResponse({ error: 'Email already registered' }, 409);

      const password_hash = await pbkdf2Hash(password);
      const userId = crypto.randomUUID();
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const user: User = {
        id: userId, email, name, plan: 'free', plan_expires_at: null,
        has_byok: false, analyses_used_today: 0, created_at: Date.now(),
        password_hash,
      };
      await saveUser(env, user);
      // Store OTP
      const otpHash = await pbkdf2Hash(otp);
      await env.KV_DATA.put(`otp:${email.toLowerCase()}`, JSON.stringify({ otp_hash: otpHash, email, purpose: 'verify_email', expires_at: Date.now() + 10 * 60 * 1000 }), { expirationTtl: 600 });

      console.log(`[SIGNUP OTP] ${email}: ${otp}`);
      return jsonResponse({ message: 'Account created. Verify your email.', email, sandboxOtp: otp }, 201);
    }

    if (path === '/api/auth/verify-email' && method === 'POST') {
      const { email, otp } = await getBody();
      if (!email || !otp) return jsonResponse({ error: 'Email and OTP required' }, 400);
      const stored = await kvGet(env, `otp:${email.toLowerCase()}`);
      if (!stored || stored.expires_at < Date.now()) return jsonResponse({ error: 'OTP expired or invalid' }, 400);
      const matched = await pbkdf2Compare(otp, stored.otp_hash);
      if (!matched) return jsonResponse({ error: 'Invalid OTP' }, 400);

      await kvDelete(env, `otp:${email.toLowerCase()}`);
      const user = await getUserByEmail(env, email);
      if (!user) return jsonResponse({ error: 'User not found' }, 404);

      const accessToken = await createJWT({ sub: user.id, email: user.email, plan: user.plan }, env.JWT_ACCESS_SECRET || 'your-jwt-secret');
      return jsonResponse({
        message: 'Verified successfully', accessToken,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, plan_expires_at: user.plan_expires_at, has_byok: !!user.byok_key_encrypted }
      });
    }

    if (path === '/api/auth/login' && method === 'POST') {
      const { email, password } = await getBody();
      if (!email || !password) return jsonResponse({ error: 'Email and password required' }, 400);
      const user = await getUserByEmail(env, email);
      if (!user) return jsonResponse({ error: 'Invalid credentials' }, 401);
      const matched = await pbkdf2Compare(password, user.password_hash);
      if (!matched) return jsonResponse({ error: 'Invalid credentials' }, 401);

      const accessToken = await createJWT({ sub: user.id, email: user.email, plan: user.plan }, env.JWT_ACCESS_SECRET || 'your-jwt-secret');
      return jsonResponse({
        message: 'Logged in', accessToken,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, plan_expires_at: user.plan_expires_at, has_byok: !!user.byok_key_encrypted }
      });
    }

    // === USER PROFILE ===
    if (path === '/api/user/profile' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      return jsonResponse({ user: { id: user.id, name: user.name, email: user.email, plan: user.plan, plan_expires_at: user.plan_expires_at, has_byok: !!user.byok_key_encrypted, analyses_used_today: user.analyses_used_today } });
    }

    if (path === '/api/user/profile' && method === 'PUT') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { name } = await getBody();
      if (!name) return jsonResponse({ error: 'Name required' }, 400);
      user.name = name;
      await saveUser(env, user);
      return jsonResponse({ message: 'Profile updated' });
    }

    if (path === '/api/user/usage' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      return jsonResponse({ used: user.analyses_used_today, limit: user.plan === 'paid' ? 999 : 2, isPaid: user.plan === 'paid' });
    }

    if (path === '/api/user/reset-quota' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      user.analyses_used_today = 0;
      await saveUser(env, user);
      return jsonResponse({ message: 'Quota reset' });
    }

    // === RESUMES ===
    if (path === '/api/resumes' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const keys = await kvList(env, `resume:`);
      const resumes: any[] = [];
      for (const key of keys) {
        const r = await kvGet(env, key);
        if (r && r.user_id === user.id) {
          resumes.push({ id: r.id, name: r.name, file_type: r.file_type, word_count: r.word_count, created_at: r.created_at, updated_at: r.updated_at });
        }
      }
      return jsonResponse(resumes);
    }

    if (path === '/api/resumes/upload' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { fileName, fileContent } = await getBody();
      if (!fileName || !fileContent) return jsonResponse({ error: 'File details required' }, 400);
      const text = Buffer.from(fileContent, 'base64').toString('utf-8');
      if (text.length < 50) return jsonResponse({ error: 'SCANNED_PDF', message: 'File appears empty or scanned.' }, 422);

      const resumeId = crypto.randomUUID();
      const resume: Resume = {
        id: resumeId, user_id: user.id, name: fileName, file_type: fileName.endsWith('.pdf') ? 'pdf' : 'docx',
        word_count: text.split(/\s+/).length, extracted_text: text, parsed_data: { text, wordCount: text.split(/\s+/).length },
        created_at: Date.now(), updated_at: Date.now()
      };
      await kvPut(env, `resume:${resumeId}`, resume);
      return jsonResponse({ message: 'Resume uploaded', resume: { id: resumeId, name: fileName, file_type: resume.file_type, word_count: resume.word_count } }, 201);
    }

    if (path === '/api/resumes/seed-mock' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const demoText = `RAHUL SHARMA\nSenior Full-Stack Engineer | Bengaluru\nEmail: rahul.sharma@bits.com | Phone: +91 9988776655\n\nEDUCATION:\nB.Tech in Computer Science from BITS Pilani (CGPA: 8.7/10)\n10th: 94% | 12th: 91%\n\nEXPERIENCE:\nSenior Software Engineer at Flipkart (2024-Present)\n- Architected high-throughput microservices using Node.js and Kafka, improving data processing by 45%\n- Led migration of legacy monolith to Kubernetes-based microservices, reducing deployment time by 60%\n- Optimized PostgreSQL queries achieving sub-50ms response times for 10M+ daily requests\n\nSoftware Engineer at Wipro (2021-2024)\n- Built React-based dashboard with real-time metrics, serving 500+ internal users\n- Developed REST APIs with Express and TypeScript, implementing Redis caching layer\n- Reduced production incidents by 35% through automated monitoring and alerting\n\nSKILLS:\nReact, TypeScript, Node.js, Go, Python, PostgreSQL, Redis, Kafka, Docker, Kubernetes, GCP, AWS\n\nNOTICE PERIOD: Immediate / 15 Days`;
      const resumeId = 'seed_' + crypto.randomUUID().substring(0, 12);
      const resume: Resume = {
        id: resumeId, user_id: user.id, name: 'BITS_Pilani_Flipkart_Engineer.pdf', file_type: 'pdf',
        word_count: 185, extracted_text: demoText, parsed_data: { text: demoText, wordCount: 185 },
        created_at: Date.now(), updated_at: Date.now()
      };
      await kvPut(env, `resume:${resumeId}`, resume);
      return jsonResponse({ message: 'Demo resume seeded', resume: { id: resumeId, name: resume.name, file_type: 'pdf', word_count: 185 } }, 201);
    }

    // Resume CRUD by ID
    const resumeMatch = path.match(/^\/api\/resumes\/([^/]+)$/);
    if (resumeMatch) {
      const resumeId = resumeMatch[1];
      if (method === 'GET') {
        const user = await getAuthUser();
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
        const resume = await kvGet(env, `resume:${resumeId}`);
        if (!resume || resume.user_id !== user.id) return jsonResponse({ error: 'Not found' }, 404);
        return jsonResponse(resume);
      }
      if (method === 'DELETE') {
        const user = await getAuthUser();
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
        const resume = await kvGet(env, `resume:${resumeId}`);
        if (!resume || resume.user_id !== user.id) return jsonResponse({ error: 'Not found' }, 404);
        await kvDelete(env, `resume:${resumeId}`);
        return jsonResponse({ message: 'Deleted' });
      }
    }

    // === ANALYSES ===
    if (path === '/api/analyses' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const keys = await kvList(env, `analysis:`);
      const analyses: Analysis[] = [];
      for (const key of keys) {
        const a = await kvGet(env, key);
        if (a && a.user_id === user.id) analyses.push(a);
      }
      analyses.sort((a, b) => b.created_at - a.created_at);
      return jsonResponse(analyses);
    }

    if (path === '/api/analyses' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { resumeId, jdText, track } = await getBody();
      if (!resumeId || !track) return jsonResponse({ error: 'Resume ID and track required' }, 400);

      // Rate limit check
      if (user.plan !== 'paid') {
        const today = new Date().toISOString().split('T')[0];
        if (user.analyses_used_today >= 2) {
          return jsonResponse({ error: 'LIMIT_EXCEEDED', message: 'Daily limit reached. Upgrade to Premium.' }, 403);
        }
        user.analyses_used_today = (user.analyses_used_today || 0) + 1;
        await saveUser(env, user);
      }

      const resume = await kvGet(env, `resume:${resumeId}`);
      if (!resume || resume.user_id !== user.id) return jsonResponse({ error: 'Resume not found' }, 404);

      const result = scoreResume(resume.extracted_text, jdText || '', track);
      const analysisId = crypto.randomUUID();
      const analysis: Analysis = {
        id: analysisId, user_id: user.id, resume_id: resumeId, resume_name: resume.name,
        jd_text: jdText || '', track, total_score: result.totalScore,
        format_score: result.formatScore, sections_score: result.sectionsScore,
        keywords_score: result.keywordsScore, india_score: result.indiaScore,
        track_bonus_score: result.trackBonusScore, score_breakdown: result.scoreBreakdown,
        keyword_gaps: result.keywordGaps, keyword_matches: result.keywordMatches,
        recommendations: result.recommendations, ai_feedback: null, ai_feedback_generated_at: null,
        created_at: Date.now()
      };
      await kvPut(env, `analysis:${analysisId}`, analysis);
      return jsonResponse({ message: 'Analysis complete', analysis }, 201);
    }

    // Analyses by ID
    const analysisMatch = path.match(/^\/api\/analyses\/([^/]+)$/);
    if (analysisMatch) {
      const analysisId = analysisMatch[1];
      if (method === 'GET') {
        const user = await getAuthUser();
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
        const analysis = await kvGet(env, `analysis:${analysisId}`);
        if (!analysis || analysis.user_id !== user.id) return jsonResponse({ error: 'Not found' }, 404);
        return jsonResponse(analysis);
      }
      if (method === 'DELETE') {
        const user = await getAuthUser();
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
        await kvDelete(env, `analysis:${analysisId}`);
        return jsonResponse({ message: 'Deleted' });
      }
    }

    // Public shared analysis
    const publicMatch = path.match(/^\/api\/public\/analyses\/([^/]+)$/);
    if (publicMatch && method === 'GET') {
      const analysis = await kvGet(env, `analysis:${publicMatch[1]}`);
      if (!analysis) return jsonResponse({ error: 'Not found' }, 404);
      return jsonResponse(analysis);
    }

    // === PAYMENTS ===
    if (path === '/api/payments/create-order' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

      const body = await getBody();
      const planType: 'monthly' | 'yearly' = body.plan === 'monthly' ? 'monthly' : 'yearly';
      const amountInPaise = planType === 'monthly' ? 7900 : 79900; // ₹79/mo or ₹799/yr

      // Create a real Razorpay order via API
      const keyId = env.RAZORPAY_KEY_ID || 'rzp_live_YOUR_KEY_ID';
      const keySecret = env.RAZORPAY_KEY_SECRET || 'your_key_secret';
      const basicAuth = btoa(`${keyId}:${keySecret}`);

      let razorpayOrder;
      try {
        const resp = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `atscore_${user.id.substring(0, 8)}_${Date.now().toString(36)}`,
            notes: {
              user_id: user.id,
              email: user.email,
              plan_type: planType
            }
          })
        });
        razorpayOrder = await resp.json();
        if (!resp.ok) {
          console.error('[Razorpay] Order creation failed:', razorpayOrder);
          return jsonResponse({ error: 'Payment gateway error. Please try again.' }, 502);
        }
      } catch (fetchErr: any) {
        console.error('[Razorpay] API call failed:', fetchErr.message);
        return jsonResponse({ error: 'Payment gateway unreachable.' }, 502);
      }

      const razorpayOrderId = razorpayOrder.id;
      const payId = crypto.randomUUID().substring(0, 15);
      await kvPut(env, `payment:${payId}`, {
        id: payId, user_id: user.id, razorpay_order_id: razorpayOrderId,
        amount: amountInPaise, plan_type: planType, status: 'created', created_at: Date.now()
      });
      await kvPut(env, `order:${razorpayOrderId}`, payId);
      return jsonResponse({
        orderId: razorpayOrderId, amount: amountInPaise, plan_type: planType,
        currency: 'INR', keyId, user: { name: user.name, email: user.email }
      });
    }

    if (path === '/api/payments/verify' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { orderId, paymentId, signature } = await getBody();
      const payId = await kvGet(env, `order:${orderId}`);
      if (!payId) return jsonResponse({ error: 'Order not found' }, 404);

      // Update payment record
      const payRecord = await kvGet(env, `payment:${payId}`);
      if (payRecord) {
        payRecord.status = 'paid';
        payRecord.razorpay_payment_id = paymentId || 'webhook';
        payRecord.paid_at = Date.now();
        await kvPut(env, `payment:${payId}`, payRecord);
      }

      const planType = payRecord?.plan_type || 'yearly';
      const daysToAdd = planType === 'monthly' ? 30 : 365;

      user.plan = 'paid';
      user.plan_expires_at = Math.floor((Date.now() + daysToAdd * 24 * 60 * 60 * 1000) / 1000);
      await saveUser(env, user);
      return jsonResponse({ success: true, message: planType === 'monthly' ? 'Monthly plan activated!' : 'Yearly Premium activated! Unlimited analyses unlocked.' });
    }

    // === RAZORPAY WEBHOOK HANDLER ===
    // Note: webhook handler consumes req.text() so it must NOT call getBody() (which calls req.json())
    if (path === '/api/payments/webhook' && method === 'POST') {
      const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret';
      const signature = req.headers.get('x-razorpay-signature') || '';
      const rawBody = await req.text();

      // Verify HMAC-SHA256 signature (hex-encoded from Razorpay)
      if (signature) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw', encoder.encode(webhookSecret),
          { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
        const expectedHex = Array.from(new Uint8Array(expectedSig))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        if (expectedHex !== signature) {
          console.error('[Webhook] Invalid signature');
          return jsonResponse({ error: 'Invalid signature' }, 401);
        }
      }

      let event;
      try {
        event = JSON.parse(rawBody);
      } catch {
        return jsonResponse({ error: 'Invalid payload' }, 400);
      }

      const eventType = event.event || '';
      const payload = event.payload || {};
      const orderEntity = payload.order || payload.payment?.order || {};
      const paymentEntity = payload.payment || {};
      const razorpayOrderId = orderEntity.id || paymentEntity.order_id || '';
      const razorpayPaymentId = paymentEntity.id || '';

      if (eventType.includes('payment') && razorpayOrderId) {
        const payId = await kvGet(env, `order:${razorpayOrderId}`);
        if (payId) {
          const payRecord = await kvGet(env, `payment:${payId}`);
          if (payRecord && payRecord.status !== 'paid') {
            payRecord.status = 'paid';
            payRecord.razorpay_payment_id = razorpayPaymentId;
            payRecord.paid_at = Date.now();
            await kvPut(env, `payment:${payId}`, payRecord);

            const planType = payRecord.plan_type || 'yearly';
            const daysToAdd = planType === 'monthly' ? 30 : 365;

            const webhookUser = await getUser(env, payRecord.user_id);
            if (webhookUser) {
              webhookUser.plan = 'paid';
              webhookUser.plan_expires_at = Math.floor((Date.now() + daysToAdd * 24 * 60 * 60 * 1000) / 1000);
              await saveUser(env, webhookUser);
              console.log(`[Webhook] Premium activated for user ${payRecord.user_id} via order ${razorpayOrderId}`);
            }
          }
        }
      }

      return jsonResponse({ received: true, event: eventType });
    }

    // === BYOK KEY MANAGEMENT ===
    if (path === '/api/user/byok-key' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { key } = await getBody();
      if (!key) return jsonResponse({ error: 'BYOK key required' }, 400);
      user.byok_key_encrypted = key;
      user.has_byok = true;
      await saveUser(env, user);
      return jsonResponse({ message: 'BYOK key saved' });
    }

    if (path === '/api/user/byok-key' && method === 'DELETE') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      user.byok_key_encrypted = null;
      user.has_byok = false;
      await saveUser(env, user);
      return jsonResponse({ message: 'BYOK key removed' });
    }

    // === PAYMENTS HISTORY ===
    if (path === '/api/payments/history' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const keys = await kvList(env, 'payment:');
      const payments: any[] = [];
      for (const key of keys) {
        const p = await kvGet(env, key);
        if (p && p.user_id === user.id) payments.push(p);
      }
      return jsonResponse(payments);
    }

    // === COVER LETTERS ===
    if (path === '/api/cover-letters/generate' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

      const { resumeId, jobDescription, track } = await getBody();
      if (!resumeId || !jobDescription || jobDescription.length < 50 || !track) {
        return jsonResponse({ error: 'resumeId, jobDescription (min 50 chars), and track required' }, 400);
      }

      if (user.plan !== 'paid') {
        const keys = await kvList(env, 'cover_letter:');
        const today = new Date().toISOString().split('T')[0];
        const todayCount = keys.filter(k => k.startsWith(`cover_letter:${user.id}:${today}`)).length;
        if (todayCount >= 2) {
          return jsonResponse({ error: 'Daily limit reached. Upgrade to Pro for unlimited cover letters.' }, 429);
        }
      }

      const resume = await kvGet(env, `resume:${resumeId}`);
      if (!resume || resume.user_id !== user.id) return jsonResponse({ error: 'Resume not found' }, 404);

      // Call Gemini-based generation (simplified for worker - use mock for now)
      const mockLetter = `I am writing to express my strong interest in the ${track} role. With my proven track record in delivering scalable solutions and driving measurable impact, I am confident in my ability to contribute effectively to your team.\n\nThroughout my career, I have consistently delivered results by leveraging my technical expertise and problem-solving skills. My experience includes leading cross-functional initiatives, optimizing system performance, and mentoring junior team members.\n\nI would welcome the opportunity to discuss how my background and skills align with your team's goals. Thank you for your time and consideration.`;
      const wc = mockLetter.split(/\s+/).length;
      const clId = crypto.randomUUID().substring(0, 15);
      const nowStr = new Date().toISOString();

      const cl: CoverLetterRecord = {
        id: clId, user_id: user.id, resume_id: resumeId, track,
        jd_snippet: jobDescription.slice(0, 200),
        cover_letter: mockLetter, word_count: wc, created_at: nowStr
      };
      await kvPut(env, `cover_letter:${user.id}:${nowStr}:${clId}`, cl);
      // Also store in user's list
      const listKey = `cover_letters:${user.id}`;
      const existing = await kvGet(env, listKey) || [];
      existing.push(cl);
      await kvPut(env, listKey, existing);

      return jsonResponse({ id: clId, cover_letter: mockLetter, word_count: wc, created_at: nowStr });
    }

    if (path === '/api/cover-letters' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const list = await kvGet(env, `cover_letters:${user.id}`) || [];
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return jsonResponse({ cover_letters: list });
    }

    const clDeleteMatch = path.match(/^\/api\/cover-letters\/([^/]+)$/);
    if (clDeleteMatch && method === 'DELETE') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const list = await kvGet(env, `cover_letters:${user.id}`) || [];
      const filtered = list.filter((c: any) => c.id !== clDeleteMatch[1]);
      await kvPut(env, `cover_letters:${user.id}`, filtered);
      return jsonResponse({ success: true });
    }

    // === OFFER ANALYZER ===
    if (path === '/api/offer-analysis/analyze' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (user.plan !== 'paid') {
        return jsonResponse({ error: 'Offer Letter Analyzer is a Pro feature. Upgrade to access.' }, 403);
      }
      const { offerText, role, company, location, experienceYears } = await getBody();
      if (!offerText || offerText.length < 100 || !role || !company || !location) {
        return jsonResponse({ error: 'All fields required, offerText min 100 chars' }, 400);
      }
      const oaId = crypto.randomUUID().substring(0, 15);
      const nowStr = new Date().toISOString();
      const mockResult = {
        gross_annual_ctc: 1800000, basic_salary_annual: 720000, hra_annual: 360000,
        variable_pay_annual: 360000, special_allowance_annual: 240000, pf_employer_annual: 86400,
        gratuity_annual: 34632, equity_annual: 0, other_benefits_annual: 0,
        in_hand_monthly_estimate: 104000, variable_percentage: 20,
        red_flags: ["No HRA mentioned"], positive_points: ["Above market base salary"],
        market_comparison: 'at_market', negotiation_room: 'medium',
        negotiation_email: "Subject: Re: Offer Letter – " + role + " Position\n\nDear Team, Thank you for the offer.",
        negotiation_verbal_script: "Thank you for the offer, I'm really excited about this opportunity.",
        recommended_ask_ctc: 2100000
      };
      const oa: OfferAnalysis = {
        id: oaId, user_id: user.id, role, company, location,
        experience_years: experienceYears || 0, ctc_breakdown: mockResult, ...mockResult, created_at: nowStr
      };
      const listKey = `offer_analyses:${user.id}`;
      const existing = await kvGet(env, listKey) || [];
      existing.push(oa);
      await kvPut(env, listKey, existing);
      return jsonResponse(oa);
    }

    if (path === '/api/offer-analysis' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const list = await kvGet(env, `offer_analyses:${user.id}`) || [];
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return jsonResponse({ analyses: list });
    }

    // === APPLICATIONS ===
    if (path === '/api/applications' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

      if (user.plan !== 'paid') {
        const existing = await kvGet(env, `applications:${user.id}`) || [];
        if (existing.length >= 10) {
          return jsonResponse({ error: 'Free plan limited to 10 tracked applications. Upgrade to Pro.' }, 429);
        }
      }

      const body = await getBody();
      if (!body.company || !body.role) return jsonResponse({ error: 'Company and role required' }, 400);
      const appId = crypto.randomUUID().substring(0, 15);
      const nowStr = new Date().toISOString();
      const app: AppRecord = {
        id: appId, user_id: user.id, company: body.company, role: body.role,
        location: body.location || '', track: body.track || 'naukri', portal: body.portal || 'other',
        applied_date: body.applied_date || nowStr.split('T')[0], status: 'applied',
        ats_score: body.ats_score || null, analysis_id: body.analysis_id || null,
        resume_version: null, recruiter_name: body.recruiter_name || '',
        recruiter_email: body.recruiter_email || '', notes: body.notes || '',
        ctc_offered: body.ctc_offered || null, next_action: body.next_action || '',
        next_action_date: body.next_action_date || '', created_at: nowStr, updated_at: nowStr
      };
      const existing = await kvGet(env, `applications:${user.id}`) || [];
      existing.push(app);
      await kvPut(env, `applications:${user.id}`, existing);
      return jsonResponse(app, 201);
    }

    if (path === '/api/applications' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      let apps = await kvGet(env, `applications:${user.id}`) || [];
      const status = url.searchParams.get('status');
      const portal = url.searchParams.get('portal');
      if (status) apps = apps.filter((a: any) => a.status === status);
      if (portal) apps = apps.filter((a: any) => a.portal === portal);
      apps.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      return jsonResponse({ applications: apps });
    }

    const appMatch = path.match(/^\/api\/applications\/([^/]+)$/);
    if (appMatch) {
      const appId = appMatch[1];
      if (method === 'PUT') {
        const user = await getAuthUser();
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
        const apps = await kvGet(env, `applications:${user.id}`) || [];
        const idx = apps.findIndex((a: any) => a.id === appId);
        if (idx === -1) return jsonResponse({ error: 'Not found' }, 404);
        const body = await getBody();
        const allowed = ['status','recruiter_name','recruiter_email','notes','next_action','next_action_date','ctc_offered'];
        for (const key of allowed) {
          if (body[key] !== undefined) apps[idx][key] = body[key];
        }
        apps[idx].updated_at = new Date().toISOString();
        await kvPut(env, `applications:${user.id}`, apps);
        return jsonResponse(apps[idx]);
      }
      if (method === 'DELETE') {
        const user = await getAuthUser();
        if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
        let apps = await kvGet(env, `applications:${user.id}`) || [];
        apps = apps.filter((a: any) => a.id !== appId);
        await kvPut(env, `applications:${user.id}`, apps);
        return jsonResponse({ success: true });
      }
    }

    if (path === '/api/applications/stats' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (user.plan !== 'paid') return jsonResponse({ error: 'Application analytics is Pro only.' }, 403);
      const apps = await kvGet(env, `applications:${user.id}`) || [];
      const byStatus: Record<string, number> = {};
      const portals: Record<string, number> = {};
      const tracks: Record<string, number> = {};
      for (const a of apps) {
        byStatus[a.status] = (byStatus[a.status] || 0) + 1;
        portals[a.portal] = (portals[a.portal] || 0) + 1;
        tracks[a.track] = (tracks[a.track] || 0) + 1;
      }
      const screened = (byStatus['screening']||0)+(byStatus['interview_r1']||0)+(byStatus['interview_r2']||0)+(byStatus['final_round']||0);
      const total = apps.length;
      const stats = {
        total,
        by_status: byStatus,
        response_rate: total > 0 ? Math.round((screened / total) * 100) : 0,
        interview_conversion: total > 0 ? Math.round((screened / total) * 100) : 0,
        offer_rate: total > 0 ? Math.round((((byStatus['offer_received']||0)+(byStatus['accepted']||0))/total)*100) : 0,
        avg_days_to_response: 0,
        top_portal: Object.entries(portals).sort((a,b)=>b[1]-a[1])[0]?.[0]||'other',
        top_track: Object.entries(tracks).sort((a,b)=>b[1]-a[1])[0]?.[0]||'naukri',
      };
      return jsonResponse({ stats });
    }

    // === RESUME TAILOR ===
    if (path === '/api/resume-tailor/tailor' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (user.plan !== 'paid') return jsonResponse({ error: 'Resume Tailor is a Pro feature.' }, 403);

      // Check daily limit
      const keys = await kvList(env, 'tailored_resume:');
      const today = new Date().toISOString().split('T')[0];
      const todayCount = keys.filter(k => k.includes(`:${user.id}:${today}`)).length;
      if (todayCount >= 5) return jsonResponse({ error: 'Daily limit of 5 tailors reached.' }, 429);

      const { resumeId, jdText, track } = await getBody();
      if (!resumeId || !jdText || jdText.length < 80 || !track) {
        return jsonResponse({ error: 'resumeId, jdText (min 80), track required' }, 400);
      }
      const resume = await kvGet(env, `resume:${resumeId}`);
      if (!resume || resume.user_id !== user.id) return jsonResponse({ error: 'Not found' }, 404);

      // Mock result
      const trId = crypto.randomUUID().substring(0, 15);
      const nowStr = new Date().toISOString();
      const tr: TailoredResume = {
        id: trId, user_id: user.id, source_resume_id: resumeId,
        jd_snippet: jdText.slice(0, 200), track,
        professional_summary: "Experienced software engineer with expertise in building scalable web applications.",
        skills: ["React","TypeScript","Node.js","PostgreSQL","Redis"],
        experience_bullets: {},
        added_keywords: ["Kubernetes","Microservices"],
        original_score: 50, estimated_score_improvement: 15,
        full_tailored_text: "Tailored resume content",
        created_at: nowStr
      };
      const listKey = `tailored_resumes:${user.id}`;
      const existing = await kvGet(env, listKey) || [];
      existing.push(tr);
      await kvPut(env, listKey, existing);
      return jsonResponse(tr);
    }

    if (path === '/api/resume-tailor' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const list = await kvGet(env, `tailored_resumes:${user.id}`) || [];
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return jsonResponse({ tailored_resumes: list });
    }

    // === LINKEDIN GENERATOR ===
    if (path === '/api/linkedin/generate' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      if (user.plan !== 'paid') return jsonResponse({ error: 'LinkedIn Generator is a Pro feature.' }, 403);

      const { resumeId, track, currentHeadline, currentAbout } = await getBody();
      if (!resumeId || !track) return jsonResponse({ error: 'resumeId and track required' }, 400);
      const resume = await kvGet(env, `resume:${resumeId}`);
      if (!resume || resume.user_id !== user.id) return jsonResponse({ error: 'Not found' }, 404);

      const lpId = crypto.randomUUID().substring(0, 15);
      const nowStr = new Date().toISOString();
      const lp: LinkedInProfile = {
        id: lpId, user_id: user.id, track,
        headlines: [
          "Senior Full Stack Engineer | React, Node.js, TypeScript",
          "Software Engineer | Distributed Systems | 4+ Years Experience",
          "Full Stack Developer | Cloud-Native Apps | System Design"
        ],
        about_section: "I am a software engineer with experience building scalable applications.",
        skills_to_add: ["React","TypeScript","Node.js","System Design"],
        completeness_checklist: [
          {item:"Add a professional photo",impact:"high",done:false},
          {item:"Set #OpenToWork",impact:"high",done:false},
          {item:"Add 5+ skills",impact:"high",done:false},
        ],
        created_at: nowStr
      };
      const listKey = `linkedin_profiles:${user.id}`;
      const existing = await kvGet(env, listKey) || [];
      existing.push(lp);
      await kvPut(env, listKey, existing);
      return jsonResponse(lp);
    }

    if (path === '/api/linkedin' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const list = await kvGet(env, `linkedin_profiles:${user.id}`) || [];
      list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return jsonResponse({ profiles: list });
    }

    // === PREMIUM STUB ENDPOINTS ===
    const premiumEndpoints = ['/api/premium/interview-prep', '/api/premium/referral-pitch', '/api/premium/social-optimize', '/api/premium/jd-match-sandbox'];
    if (premiumEndpoints.includes(path) && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Premium feature coming soon in a future update.' }, 501);
      // Premium features would use Gemini API - returning placeholder
      return jsonResponse({ message: 'Premium feature - coming soon', feature: path, available: false });
    }

    // === AI FEEDBACK ===
    const aiFeedbackMatch = path.match(/^\/api\/analyses\/([^/]+)\/ai-feedback$/);
    if (aiFeedbackMatch && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      return jsonResponse({ message: 'AI feedback feature coming soon' });
    }

    // === NAUKRI ===
    if (path === '/api/naukri/analyze' && method === 'POST') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { headline, summary, skills } = await getBody();
      if (!headline || !summary) return jsonResponse({ error: 'Headline and summary required' }, 400);
      const kwList = skills ? skills.split(',').map((s: string) => s.trim()) : [];
      let completeness = 40;
      const gaps: string[] = [];
      const suggestions: string[] = [];
      if (headline.length >= 35) completeness += 15; else { gaps.push('Headline too short'); suggestions.push('Make headline 35-100 chars'); }
      if (summary.split(/\s+/).length >= 50) completeness += 15; else { gaps.push('Summary too short'); suggestions.push('Write 50+ word summary'); }
      if (kwList.length >= 10) completeness += 15; else { gaps.push('Too few skills'); suggestions.push('Add 10+ skills'); }
      const scoreVal = Math.min(100, completeness);
      await kvPut(env, `naukri:${user.id}`, { id: user.id, profile_data: { headline, summary, skills }, completeness_score: scoreVal, gaps, suggestions, created_at: Date.now(), updated_at: Date.now() });
      return jsonResponse({ completeness_score: scoreVal, gaps, suggestions, profile_data: { headline, summary, skills } });
    }

    if (path === '/api/naukri/latest' && method === 'GET') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const profile = await kvGet(env, `naukri:${user.id}`);
      if (!profile) return jsonResponse({ error: 'No profile found' }, 404);
      return jsonResponse(profile);
    }

    // === FORGOT/RESET PASSWORD ===
    if (path === '/api/auth/forgot-password' && method === 'POST') {
      const { email } = await getBody();
      if (!email) return jsonResponse({ error: 'Email required' }, 400);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await pbkdf2Hash(otp);
      await env.KV_DATA.put(`otp:${email.toLowerCase()}`, JSON.stringify({ otp_hash: otpHash, email, purpose: 'password_reset', expires_at: Date.now() + 10 * 60 * 1000 }), { expirationTtl: 600 });
      console.log(`[PASSWORD RESET OTP] ${email}: ${otp}`);
      return jsonResponse({ message: 'Reset OTP sent', email, sandboxOtp: otp });
    }

    if (path === '/api/auth/reset-password' && method === 'POST') {
      const { email, otp, newPassword } = await getBody();
      if (!email || !otp || !newPassword) return jsonResponse({ error: 'All fields required' }, 400);
      const stored = await kvGet(env, `otp:${email.toLowerCase()}`);
      if (!stored || stored.purpose !== 'password_reset' || stored.expires_at < Date.now()) return jsonResponse({ error: 'Invalid/expired OTP' }, 400);
      const matched = await pbkdf2Compare(otp, stored.otp_hash);
      if (!matched) return jsonResponse({ error: 'Invalid OTP' }, 400);
      const user = await getUserByEmail(env, email);
      if (!user) return jsonResponse({ error: 'User not found' }, 404);
      user.password_hash = await pbkdf2Hash(newPassword);
      await saveUser(env, user);
      await kvDelete(env, `otp:${email.toLowerCase()}`);
      return jsonResponse({ message: 'Password reset successfully' });
    }

    // === RENAME RESUME ===
    const renameMatch = path.match(/^\/api\/resumes\/([^/]+)\/name$/);
    if (renameMatch && method === 'PUT') {
      const user = await getAuthUser();
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const { name } = await getBody();
      if (!name) return jsonResponse({ error: 'Name required' }, 400);
      const resume = await kvGet(env, `resume:${renameMatch[1]}`);
      if (!resume || resume.user_id !== user.id) return jsonResponse({ error: 'Not found' }, 404);
      resume.name = name;
      resume.updated_at = Date.now();
      await kvPut(env, `resume:${renameMatch[1]}`, resume);
      return jsonResponse({ message: 'Renamed', resume: { id: resume.id, name: resume.name } });
    }

    // 404 fallback
    return jsonResponse({ error: 'Not found', path }, 404);

  } catch (err: any) {
    console.error('Worker error:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
}

// ===================== CRYPTO HELPERS =====================
// ===================== CRYPTO HELPERS (PBKDF2 + HMAC JWT) =====================

/**
 * Hash password using PBKDF2 with 100k iterations (Web Crypto API).
 * Returns salt:hash format for verification.
 */
async function pbkdf2Hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return `${saltB64}:${hashB64}`;
}

async function pbkdf2Compare(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(':');
  if (!saltB64 || !hashB64) return false;
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const computedB64 = btoa(String.fromCharCode(...new Uint8Array(derived)));
  return computedB64 === hashB64;
}

/**
 * Create a signed JWT using HMAC-SHA256.
 */
async function createJWT(payload: any, jwtSecret: string): Promise<string> {
  const secret = new TextEncoder().encode(jwtSecret);
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = { ...payload, iat: now, exp: now + 7 * 24 * 3600 };
  
  const b64url = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const data = `${b64url(header)}.${b64url(jwtPayload)}`;
  
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const sigB64url = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${data}.${sigB64url}`;
}

/**
 * Verify a JWT and return the payload, or null if invalid/expired.
 */
async function verifyJWT(token: string, jwtSecret: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    
    // Verify signature
    const secret = new TextEncoder().encode(jwtSecret);
    const data = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const sigBytes = Uint8Array.from(atob(sigB64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;
    
    // Decode payload
    const payloadStr = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);
    
    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    
    return payload;
  } catch {
    return null;
  }
}

// ===================== ENTRY POINT =====================
export default {
  async fetch(req: Request, env: any): Promise<Response> {
    return handleRequest(req, env);
  }
};
