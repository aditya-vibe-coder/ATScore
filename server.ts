import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environmental variables
dotenv.config();

import { db } from './server/db';
import { encrypt, decrypt } from './server/crypto';
import { 
  parseDocx, 
  parsePdf, 
  analyzeResume, 
  TRACKS 
} from './server/engine';
import { generateAIDeepFeedback, testOpenAIKey } from './server/ai';
import {
  premiumStarRewrite,
  premiumGccAlignment,
  premiumInterviewPrep,
  premiumKeywordInjector,
  premiumTierCompAnalyzer,
  premiumReferralPitch,
  premiumNaukriSocialOptimize,
  premiumJdMatchSandbox
} from './server/premium';
import { 
  requireAuth, 
  createAccessToken, 
  hashPassword, 
  comparePassword, 
  AuthenticatedRequest 
} from './server/auth';
import {
  generateCoverLetter,
  analyzeOfferLetter,
  tailorResumeToJD,
  generateLinkedInProfile
} from './server/premium';
import { User, Resume, Analysis, PaymentRecord, NaukriProfile, CoverLetterRecord, OfferAnalysis, ApplicationRecord, ApplicationStats, ApplicationStatus, TailoredResumeResult, LinkedInProfile } from './src/types';
import Razorpay from 'razorpay';

const app = express();
const PORT = 3000;

// Lazy initialize Razorpay client to prevent startup failure when keys are empty
let razorpayClient: any = null;
function getRazorpay() {
  if (!razorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
      razorpayClient = new Razorpay({
        key_id: keyId,
        key_secret: keySecret
      });
    }
  }
  return razorpayClient;
}

// Custom CORS handler compatible with Cloudflare deployments and local sandbox previews
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://YOUR_DOMAIN.com',
    'http://YOUR_DOMAIN.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  const origin = req.headers.origin;
  if (origin) {
    if (allowedOrigins.includes(origin) || origin.endsWith('.YOUR_DOMAIN.com')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Set high upload limits and capture raw bodies for secure webhooks verification
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Premium verification middleware validating active plan tier or BYOK configuration
async function requirePremium(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User lookup reference missing.' });
    }
    if (user.plan === 'paid' || user.byok_key_encrypted) {
      return next();
    }
    return res.status(403).json({
      error: 'UPGRADE_REQUIRED',
      message: 'This feature is elite. Upgrade to ATScore Pro or configure your own encrypted OpenAI API key in Settings to unlock immediately!'
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to authorize premium feature access.' });
  }
}

// DB Initializer
db.init();

// Simple console request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// PRIVATE SECURITY RATE-LIMITS STORAGE
const rateLimits: Record<string, { count: number; expires: number }> = {};
function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (!rateLimits[ip] || rateLimits[ip].expires < now) {
    rateLimits[ip] = { count: 1, expires: now + windowMs };
    return true;
  }
  rateLimits[ip].count += 1;
  return rateLimits[ip].count <= limit;
}

// RATE LIMIT MIDDLEWARE FOR AUTH ACTIONS
function authRateLimiter(limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown-ip';
    if (!checkRateLimit(ip, limit, windowMs)) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again later.' });
    }
    next();
  };
}

// === MISC ENDPOINTS ===
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// === AUTHENTICATION ENDPOINTS ===

// SIGNUP
app.post('/api/auth/signup', authRateLimiter(10, 60 * 1000), async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: 'All fields (email, name, password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password code must have at least 6 characters.' });
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    const password_hash = await hashPassword(password);
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const otp_hash = await hashPassword(otp);

    // Store in users
    const userId = Math.random().toString(36).substring(2, 18);
    const newUser: User & { password_hash: string } = {
      id: userId,
      email: email,
      name: name,
      plan: 'free',
      plan_expires_at: null,
      has_byok: false,
      analyses_used_today: 0,
      created_at: Date.now(),
      password_hash
    };

    await db.createUser(newUser);

    // Store verification OTP in storage
    const otpId = Math.random().toString(36).substring(2, 15);
    await db.createOtp({
      id: otpId,
      email: email.toLowerCase(),
      otp_hash,
      purpose: 'verify_email',
      expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes
      used: 0,
      created_at: Date.now()
    });

    console.log(`[VERIFICATION OTP FOR ${email}]: ${otp}`);

    res.status(201).json({
      message: 'Account initialized successfully. Please verify your email using the verification code.',
      email: email,
      // Provide OTP in payload in sandbox for direct testing friction reduction
      sandboxOtp: otp
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

// VERIFY EMAIL
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required.' });
    }

    const storedOtp = await db.findOtp(email, 'verify_email');
    if (!storedOtp || storedOtp.expires_at < Date.now()) {
      return res.status(400).json({ error: 'Verification code expired or invalid. Please request a new code.' });
    }

    const matched = await comparePassword(otp, storedOtp.otp_hash);
    if (!matched) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
    }

    await db.markOtpUsed(storedOtp.id);

    // Find and update user email verification index
    const user = await db.findUserByEmail(email);
    if (user) {
      await db.updateUser(user.id, { plan: 'free' }); // verified
      const accessToken = await createAccessToken({ sub: user.id, email: user.email, plan: user.plan });
      
      return res.json({
        message: 'Account verified successfully.',
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          plan_expires_at: user.plan_expires_at,
          has_byok: !!user.byok_key_encrypted
        }
      });
    }

    res.status(404).json({ error: 'User workspace not found.' });
  } catch (err: any) {
    console.error('Verify email failed:', err);
    res.status(500).json({ error: err.message || 'Verification failed.' });
  }
});

// LOGIN
app.post('/api/auth/login', authRateLimiter(20, 60 * 1000), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const matched = await comparePassword(password, user.password_hash);
    if (!matched) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const accessToken = await createAccessToken({ sub: user.id, email: user.email, plan: user.plan });

    res.json({
      message: 'Logged in successfully.',
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        plan_expires_at: user.plan_expires_at,
        has_byok: !!user.byok_key_encrypted
      }
    });
  } catch (err: any) {
    console.error('Login failed:', err);
    res.status(500).json({ error: 'Login process error occurred.' });
  }
});

// FORGOT PASSWORD
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      // Avoid enumerating email accounts, but in sandbox we fail clearly
      return res.status(404).json({ error: 'No user found with this email address.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_hash = await hashPassword(otp);

    await db.createOtp({
      id: Math.random().toString(36).substring(2, 15),
      email: email.toLowerCase(),
      otp_hash,
      purpose: 'password_reset',
      expires_at: Date.now() + 10 * 60 * 1000,
      used: 0,
      created_at: Date.now()
    });

    console.log(`[PASSWORD RESET OTP FOR ${email}]: ${otp}`);

    res.json({
      message: 'Reset instructions dispatched successfully.',
      email,
      sandboxOtp: otp
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate password reset.' });
  }
});

// RESET PASSWORD
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'All fields (email, otp, newPassword) are required.' });
    }

    const storedOtp = await db.findOtp(email, 'password_reset');
    if (!storedOtp || storedOtp.expires_at < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const matched = await comparePassword(otp, storedOtp.otp_hash);
    if (!matched) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User account not located.' });
    }

    const hashed = await hashPassword(newPassword);
    await db.updateUser(user.id, { password_hash: hashed });
    await db.markOtpUsed(storedOtp.id);

    res.json({ message: 'Password updated successfully. You may now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update new credentials password.' });
  }
});

// === USER ENDPOINTS (requireAuth) ===

app.get('/api/user/profile', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'Profile not found' });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        plan_expires_at: user.plan_expires_at,
        has_byok: !!user.byok_key_encrypted,
        analyses_used_today: user.analyses_used_today
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server lookup error' });
  }
});

app.put('/api/user/profile', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name field cannot be left blank.' });

    const updated = await db.updateUser(req.user!.id, { name });
    res.json({ message: 'Profile updated.', user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Could not modify profile details.' });
  }
});

app.post('/api/user/byok-key', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'API Key argument missing.' });

    // Dry Run check
    const isValid = await testOpenAIKey(key);
    if (!isValid) {
      return res.status(400).json({ error: 'OpenAI API key credentials test call failed. Verify at platform.openai.com/api-keys' });
    }

    const cryptKey = encrypt(key);
    await db.updateUser(req.user!.id, { byok_key_encrypted: cryptKey });

    res.json({ message: 'API Key validated and stored securely using AES-256 GCM encryption at rest.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Key storage execution aborted.' });
  }
});

app.delete('/api/user/byok-key', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    await db.updateUser(req.user!.id, { byok_key_encrypted: null });
    res.json({ message: 'API Key removed from workspace securely.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed deletion action.' });
  }
});

app.get('/api/user/usage', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User workspace not found' });
    
    const limit = user.plan === 'paid' ? 999 : 2;
    res.json({
      used: user.analyses_used_today || 0,
      limit,
      isPaid: user.plan === 'paid'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed query.' });
  }
});

// === RESUMES ENDPOINTS (requireAuth) ===

// UPLOAD BASE64
app.post('/api/resumes/upload', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { fileName, fileContent } = req.body; // base64 string
    if (!fileName || !fileContent) {
      return res.status(400).json({ error: 'File details and content (Base64) are required.' });
    }

    const fileBuffer = Buffer.from(fileContent, 'base64');
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({ error: 'Payload too large. Files must be smaller than 5MB.' });
    }

    const ext = path.extname(fileName).toLowerCase();
    let text = '';
    let parsedData: any = {};

    if (ext === '.docx') {
      parsedData = await parseDocx(fileBuffer);
      text = parsedData.text;
    } else if (ext === '.pdf') {
      parsedData = await parsePdf(fileBuffer);
      text = parsedData.text;
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Please upload .pdf or .docx extensions only.' });
    }

    if (!text || text.trim().length < 50) {
      return res.status(422).json({
        error: 'SCANNED_PDF',
        message: 'The document appears to be empty or a scanned picture. ATScore can only scan selectable text contents. Try recreating using standard engines.'
      });
    }

    const resumeId = Math.random().toString(36).substring(2, 18);
    const resumeObj: Resume & { extracted_text: string; parsed_data: any } = {
      id: resumeId,
      user_id: req.user!.id,
      name: fileName,
      file_type: ext === '.pdf' ? 'pdf' : 'docx',
      word_count: parsedData.wordCount,
      extracted_text: text,
      parsed_data: parsedData,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    await db.createResume(resumeObj);

    res.status(201).json({
      message: 'Resume parsed and cataloged successfully.',
      resume: {
        id: resumeObj.id,
        name: resumeObj.name,
        file_type: resumeObj.file_type,
        word_count: resumeObj.word_count
      }
    });
  } catch (err: any) {
    console.error('File parsing failure:', err);
    res.status(500).json({ error: err.message || 'File upload parsing execution failed.' });
  }
});

// SEED COGNITIVE MOCK RESUME
app.post('/api/resumes/seed-mock', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const resumeId = 'seed_' + Math.random().toString(36).substring(2, 14);
    const demoText = `RAHUL SHARMA
Senior Full-Stack Engineer | Bengaluru, Karnataka
Email: rahul.sharma.bits@gmail.com | Phone: +91 99887 76655
Academic Pedigree: B.Tech in Computer Science from BITS Pilani (Tier-1 University)

Core Professional Experience:
Senior Software Engineer at Flipkart, Bengaluru (2024 - Present)
- Responsible for managing search indexing systems and frontend web portals using React.js and TypeScript.
- Developed backend application controllers and database schemas utilizing typed interfaces on Express.
- Optimized API query structures and resolved high-throughput database issues before shipping.

Software Engineer at Wipro Technologies, Chennai (2021 - 2024)
- Worked on client-side state managers and UI integration with web dashboards.
- Monitored backend APIs and participated in deployment configuration phases.
- Responsible for debugging system issues in production workloads.

Technical Skills:
Languages: JavaScript, TypeScript, Go, SQL, Python
Frameworks: React, Express, Node.js, Bootstrap
Platforms: Docker, Git, GCP, Redis, PostgreSQL, MySQL`;

    const resumeObj: Resume & { extracted_text: string; parsed_data: any } = {
      id: resumeId,
      user_id: req.user!.id,
      name: 'BITS_Pilani_Flipkart_Senior_Engineer.pdf',
      file_type: 'pdf',
      word_count: 185,
      extracted_text: demoText,
      parsed_data: {
        text: demoText,
        wordCount: 185,
        skillsMatchedCount: 6
      },
      created_at: Date.now(),
      updated_at: Date.now()
    };

    await db.createResume(resumeObj);

    res.status(201).json({
      message: 'Demo resume seeded successfully! You can now analyze or grade this document.',
      resume: {
        id: resumeObj.id,
        name: resumeObj.name,
        file_type: resumeObj.file_type,
        word_count: resumeObj.word_count
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Seeding mock resume failed.' });
  }
});

// LIST
app.get('/api/resumes', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await db.getResumes(req.user!.id);
    const sanitized = list.map(r => ({
      id: r.id,
      name: r.name,
      file_type: r.file_type,
      word_count: r.word_count,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: 'Resumes parsing catalog retrieve failed.' });
  }
});

// DETAILS
app.get('/api/resumes/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const resume = await db.findResumeById(req.params.id);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume file not found.' });
    }
    res.json({
      id: resume.id,
      name: resume.name,
      file_type: resume.file_type,
      word_count: resume.word_count,
      extracted_text: resume.extracted_text,
      created_at: resume.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Resume detail lookup crashed.' });
  }
});

// DELETE
app.delete('/api/resumes/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const resume = await db.findResumeById(req.params.id);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'File entry not localized.' });
    }

    await db.deleteResume(req.params.id);
    res.json({ message: 'Resume deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Deletion operation crashed.' });
  }
});

// RENAME
app.put('/api/resumes/:id/name', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name content missing.' });

    const resume = await db.findResumeById(req.params.id);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume not found.' });
    }

    const updated = await db.updateResumeName(req.params.id, name);
    res.json({ message: 'Target file renamed.', resume: updated });
  } catch (err) {
    res.status(500).json({ error: 'Could not execute rename command.' });
  }
});

// === ANALYSES ENDPOINTS (requireAuth) ===

// CREATE ANALYSIS (scoring algorithm runs locally in < 5 seconds)
app.post('/api/analyses', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId, jdText, track } = req.body;
    if (!resumeId || !track) {
      return res.status(400).json({ error: 'Resume details, selected track parameters are required.' });
    }

    if (!TRACKS[track as keyof typeof TRACKS]) {
      return res.status(400).json({ error: 'Incorrect track parameters chosen.' });
    }

    // Rate Limit Quota Enforced
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User does not exist.' });

    if (user.plan !== 'paid') {
      const todayString = new Date().toISOString().split('T')[0];
      const testUser = await db.findUserById(user.id);
      if (testUser?.analyses_used_today && testUser?.analyses_used_today >= 2) {
        return res.status(403).json({
          error: 'LIMIT_EXCEEDED',
          message: 'Daily analysis limits reached (2 analyses / day under Free Tier). Upgrade subscription to activate unlimited processing.'
        });
      }
      await db.updateUser(user.id, { 
        analyses_used_today: (testUser?.analyses_used_today || 0) + 1 
      });
    }

    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(442).json({ error: 'Resume source not localized.' });
    }

    // Execute scoring local orchestrator
    const result = await analyzeResume(resume.extracted_text, resume.parsed_data, jdText || '', track as any);

    const analysisObj: Analysis = {
      id: Math.random().toString(36).substring(2, 18),
      user_id: req.user!.id,
      resume_id: resumeId,
      resume_name: resume.name,
      jd_text: jdText || '',
      track: track as any,
      total_score: result.totalScore,
      format_score: result.formatScore,
      sections_score: result.sectionsScore,
      keywords_score: result.keywordsScore,
      india_score: result.indiaScore,
      track_bonus_score: result.trackBonusScore,
      score_breakdown: result.scoreBreakdown,
      keyword_gaps: result.keywordGaps,
      keyword_matches: result.keywordMatches,
      recommendations: result.recommendations,
      created_at: Date.now(),
      ai_feedback: null,
      ai_feedback_generated_at: null
    };

    await db.createAnalysis(analysisObj);

    res.status(201).json({
      message: 'Resume analyzed successfully under India scoring engine guidelines.',
      analysis: analysisObj
    });
  } catch (err: any) {
    console.error('Core scoring failure:', err);
    res.status(500).json({ error: err.message || 'Scoring pipeline collapsed.' });
  }
});

// LIST
app.get('/api/analyses', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const list = await db.getAnalyses(req.user!.id);
    const sorted = list.sort((a,b) => b.created_at - a.created_at);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Failed history retrieval query.' });
  }
});

// GET SINGLE REPORT
app.get('/api/analyses/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const analysis = await db.findAnalysisById(req.params.id);
    if (!analysis || analysis.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Report not identified.' });
    }
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Metadata report retrieve error.' });
  }
});

// GET PUBLIC SHAREABLE REPORT (No requireAuth)
app.get('/api/public/analyses/:id', async (req, res) => {
  try {
    const analysis = await db.findAnalysisById(req.params.id);
    if (!analysis) {
      return res.status(404).json({ error: 'Report not identified.' });
    }
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Public report retrieve error.' });
  }
});

// DELETE ANALYSIS
app.delete('/api/analyses/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const analysis = await db.findAnalysisById(req.params.id);
    if (!analysis || analysis.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Report not identified.' });
    }
    await db.deleteAnalysis(req.params.id);
    res.json({ message: 'Analysis deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Could not execute analysis delete report.' });
  }
});

// TRIGGER AI FEEDBACK (Uses encrypted private OpenAI API Key OR Platform Gemini fallback) - Gated by Premium subscription
app.post('/api/analyses/:id/ai-feedback', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const analysis = await db.findAnalysisById(req.params.id);
    if (!analysis || analysis.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Analysis report not found.' });
    }

    const resume = await db.findResumeById(analysis.resume_id);
    if (!resume) {
      return res.status(404).json({ error: 'Associated resume deleted from workspace.' });
    }

    // Retrieve and decrypt user BYOK key if populated
    const user = await db.findUserById(req.user!.id);
    let key: string | null = null;
    if (user && user.byok_key_encrypted) {
      key = decrypt(user.byok_key_encrypted);
    }

    const trackConfig = TRACKS[analysis.track as keyof typeof TRACKS];

    // Trigger assessment pipeline
    const aiFeedback = await generateAIDeepFeedback(
      resume.extracted_text,
      analysis.jd_text,
      trackConfig.name,
      trackConfig.companies,
      key
    );

    const updated = await db.updateAnalysisFeedback(analysis.id, aiFeedback);

    res.json({
      message: 'AI Deep Analysis report compiled successfully.',
      aiFeedback,
      updatedAnalysis: updated
    });
  } catch (err: any) {
    console.error('AI trigger failure:', err);
    res.status(500).json({ error: err.message || 'AI processing collapsed.' });
  }
});

// === PREMIUM SUITE ENDPOINTS (Protected by Auth & Premium Tier) ===

app.post('/api/premium/star-rewrite', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { bulletText, resumeText, jdText, track } = req.body;
    if (!bulletText) {
      return res.status(400).json({ error: 'Source bullet text is required.' });
    }
    const result = await premiumStarRewrite(
      bulletText,
      resumeText || '',
      jdText || '',
      track || 'General Tech'
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bullet rewriting collapsed.' });
  }
});

app.post('/api/premium/gcc-alignment', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume document matching is required.' });
    }
    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const result = await premiumGccAlignment(resume.extracted_text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'GCC analysis failed.' });
  }
});

app.post('/api/premium/interview-prep', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId, jdText, track } = req.body;
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume document ID is required.' });
    }
    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const result = await premiumInterviewPrep(
      resume.extracted_text,
      jdText || '',
      track || 'Software Engineer'
    );
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Interview prep failed.' });
  }
});

app.post('/api/premium/keyword-injector', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId, keywords } = req.body;
    if (!resumeId || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Resume document ID and a valid list of keywords are required.' });
    }
    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const result = await premiumKeywordInjector(resume.extracted_text, keywords);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Keyword injection simulation collapsed.' });
  }
});

app.post('/api/premium/tier-comp-analyzer', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume document ID is required.' });
    }
    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume not found.' });
    }
    const result = await premiumTierCompAnalyzer(resume.extracted_text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Compensation benchmarking collapsed.' });
  }
});

// NEW: Referral email & LinkedIn pitch generator
app.post('/api/premium/referral-pitch', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId, targetCompany, targetJobTitle } = req.body;
    if (!resumeId || !targetCompany || !targetJobTitle) {
      return res.status(400).json({ error: 'Resume ID, target company, and target job title are required.' });
    }
    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume reference not found.' });
    }
    const result = await premiumReferralPitch(resume.extracted_text, targetCompany, targetJobTitle);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Pitch compilation failed.' });
  }
});

// NEW: Naukri SEO bio and visual discovery optimizer
app.post('/api/premium/social-optimize', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId } = req.body;
    if (!resumeId) {
      return res.status(400).json({ error: 'Resume ID is required.' });
    }
    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume reference not found.' });
    }
    const result = await premiumNaukriSocialOptimize(resume.extracted_text);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Naukri SEO index optimization failed.' });
  }
});

// NEW: JD Match and Score Sandbox Analyzer
app.post('/api/premium/jd-match-sandbox', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId, jdText } = req.body;
    if (!resumeId || !jdText) {
      return res.status(400).json({ error: 'Resume ID and JD text are required.' });
    }
    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'Resume reference not found.' });
    }
    const result = await premiumJdMatchSandbox(resume.extracted_text, jdText);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'JD comparative sandpointing failed.' });
  }
});

// === PAYMENTS ENDPOINTS (requireAuth & webhook) ===

// CREATE RAZORPAY BILLING ORDER
app.post('/api/payments/create-order', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User lookup reference missing.' });

    const plan_type: 'monthly' | 'yearly' = req.body.plan === 'monthly' ? 'monthly' : 'yearly';
    const amt = plan_type === 'monthly' ? 7900 : 79900; // ₹79/mo or ₹799/yr
    const payRecordId = Math.random().toString(36).substring(2, 15);
    let orderId = `order_${user.id.substring(0,6)}_${Math.random().toString(36).substring(2, 10)}`;

    const rzp = getRazorpay();
    if (rzp) {
      try {
        const order = await rzp.orders.create({
          amount: amt,
          currency: 'INR',
          receipt: `rcpt_${payRecordId}`
        });
        orderId = order.id;
      } catch (err: any) {
        console.error('Razorpay SDK order creation failed. Resorting to safe local sandbox payment order creation:', err.message);
      }
    }

    const logRecord: PaymentRecord = {
      id: payRecordId,
      user_id: user.id,
      razorpay_order_id: orderId,
      amount: amt,
      plan_type,
      status: 'created',
      created_at: Date.now()
    };

    await db.createPayment(logRecord);

    const actualKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_YOUR_KEY_ID';

    res.json({
      orderId: orderId,
      amount: amt,
      plan_type,
      currency: 'INR',
      keyId: actualKeyId,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('Razorpay gateway fail:', err);
    res.status(500).json({ error: 'Payment gateway connection error.' });
  }
});

// VERIFY PAYMENT & ACTIVATE Paid premium subscription
app.post('/api/payments/verify', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: 'Order authorization payload missing.' });
    }

    const payRecord = await db.findPaymentByOrderId(orderId);
    if (!payRecord || payRecord.user_id !== req.user!.id) {
      return res.status(404).json({ error: 'No associated billing transactions located.' });
    }

    // signature validation is executed if this is a real razorpay trade and a signature is passed
    const rzp = getRazorpay();
    if (rzp && signature && paymentId) {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(orderId + '|' + paymentId)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Razorpay signature validation failed!');
        return res.status(400).json({ error: 'Razorpay billing signature tamper detected!' });
      }
    }

    const planType = payRecord.plan_type || 'yearly';
    const daysToAdd = planType === 'monthly' ? 30 : 365;

    await db.updatePaymentStatus(orderId, 'paid', paymentId || `pay_${Math.random().toString(36).substring(2,10)}`);
    await db.updateUser(req.user!.id, {
      plan: 'paid',
      plan_expires_at: Math.floor((Date.now() + daysToAdd * 24 * 60 * 60 * 1000) / 1000)
    });

    res.json({
      success: true,
      message: planType === 'monthly'
        ? 'Monthly plan activated! Unlimited analyses + AI feedbacks unlocked.'
        : 'Yearly plan activated! Unlimited analyses + AI feedbacks unlocked.'
    });
  } catch (err: any) {
    console.error('Verify subscription upgrade fail:', err);
    res.status(500).json({ error: 'Subscription upgrade verification collapsed.' });
  }
});

// HISTORY
app.get('/api/payments/history', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const payHistory = await db.getPayments(req.user!.id);
    res.json(payHistory.sort((a,b) => b.created_at - a.created_at));
  } catch (err) {
    res.status(500).json({ error: 'Billing indexes read crash' });
  }
});

// RAZORPAY WEBHOOK HANDLER FOR SECURE TRANSACTION SYNCHRONIZATION
app.post('/api/payments/webhook', async (req: any, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (signature && webhookSecret) {
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('[Webhook] Warning: Invalid signature received on Razorpay Webhook.');
        return res.status(400).json({ error: 'Signature invalid' });
      }
    }

    const { event, payload } = req.body;
    if (event === 'order.paid' || event === 'payment.captured' || event === 'payment.authorized') {
      const paymentEntity = payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const payRecord = await db.findPaymentByOrderId(razorpayOrderId);
        if (payRecord) {
          const planType = payRecord.plan_type || 'yearly';
          const daysToAdd = planType === 'monthly' ? 30 : 365;
          await db.updatePaymentStatus(razorpayOrderId, 'paid', razorpayPaymentId || 'webhook');
          await db.updateUser(payRecord.user_id, {
            plan: 'paid',
            plan_expires_at: Math.floor((Date.now() + daysToAdd * 24 * 60 * 60 * 1000) / 1000)
          });
          console.log(`[Webhook] User successfully upgraded through webhook status update for order ${razorpayOrderId}`);
        }
      }
    }

    res.json({ success: true, status: 'ok' });
  } catch (err: any) {
    console.error('[Webhook] Failed to process webhook payload:', err.message);
    res.status(500).json({ error: 'Webhook processing collapsed.' });
  }
});

// === NAUKRI OPTIMIZER ENDPOINT ===
app.post('/api/naukri/analyze', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { headline, summary, skills, expectedCTC, noticePeriod, currentLocation } = req.body;
    if (!headline || !summary) {
      return res.status(400).json({ error: 'Profile Headline and Profile Summary are required for Naukri crawler modeling.' });
    }

    const keywords = skills ? skills.split(',').map((s: string) => s.trim()) : [];
    let completeness = 40; // baseline
    const gaps: string[] = [];
    const suggestions: string[] = [];

    // Headline check
    if (headline.length >= 35 && headline.length <= 100) {
      completeness += 15;
    } else {
      gaps.push('Profile Headline lacks optimization (optimal: 35-100 characters)');
      suggestions.push('Draft headline with specific matching targets: e.g. "Senior Software Engineer | React, Node.js & Distributed Systems"');
    }

    // Summary check
    const summaryWords = summary.split(/\s+/).length;
    if (summaryWords >= 50 && summaryWords <= 130) {
      completeness += 15;
    } else {
      gaps.push(`Profile summary contains ${summaryWords} words (optimal range: 50-130 words for keyword crawls accuracy)`);
      suggestions.push('Rewrite resume bio summarizing total years index, key frameworks and shipped achievements.');
    }

    // Skills quantity
    if (keywords.length >= 10) {
      completeness += 15;
    } else {
      gaps.push(`Low key skills density (${keywords.length} declared, recommended: 10+ core tech topics)`);
      suggestions.push('Declare framework subtopics explicitly (e.g. state keys like Redux, Postgres, Docker).');
    }

    // Notice Period indexing
    const noticeLower = String(noticePeriod || '').toLowerCase();
    if (noticeLower.includes('immediate') || noticeLower.includes('serving') || noticeLower.includes('30 days') || noticeLower.includes('1 month')) {
      completeness += 15;
    } else if (noticeLower.includes('90 days') || noticeLower.includes('3 months')) {
      gaps.push('notice period of 90 days / 3 months severely decreases active crawl hits by technical agents in Bangalore/Noida sectors.');
      suggestions.push('If negotiating details, explicitly mention active negotiations or early release eligibility: "Serving notice - 45 days negotiable".');
    } else {
      gaps.push('No notice period listed. Recruiters on Naukri filter specifically by notice duration.');
      suggestions.push('Add an explicit noticed parameters e.g., "Notice Period: Immediate / 1 Month".');
    }

    // Expected CTC
    if (expectedCTC) {
      completeness += 10;
    } else {
      gaps.push('Expected CTC detail not indexed.');
    }

    // Cap at 100
    const scoreVal = Math.min(100, completeness);

    // Profile recommendations generator
    const naukriObj: NaukriProfile = {
      id: Math.random().toString(36).substring(2, 15),
      user_id: req.user!.id,
      profile_data: {
        headline,
        summary,
        skills: skills || '',
        education: req.body.education || '',
        experience: req.body.experience || '',
        expectedCTC: expectedCTC || '',
        currentLocation: currentLocation || '',
        noticePeriod: noticePeriod || ''
      },
      completeness_score: scoreVal,
      gaps,
      suggestions,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    await db.createOrUpdateNaukriProfile(req.user!.id, naukriObj);

    res.json(naukriObj);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Naukri profile pipeline failed.' });
  }
});

// Latest naukri analyze
app.get('/api/naukri/latest', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const profObj = await db.findNaukriProfileByUserId(req.user!.id);
    if (!profObj) return res.status(404).json({ error: 'No Naukri crawling reviews saved' });
    res.json(profObj);
  } catch (err) {
    res.status(500).json({ error: 'Naukri review lookup failure.' });
  }
});

// === COVER LETTER GENERATOR ENDPOINTS ===

app.post('/api/cover-letters/generate', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { resumeId, jobDescription, track } = req.body;
    if (!resumeId || !jobDescription || !track) {
      return res.status(400).json({ error: 'resumeId, jobDescription, and track are required' });
    }
    if (jobDescription.length < 50) {
      return res.status(400).json({ error: 'Job description must be at least 50 characters' });
    }
    if (!['mass_hiring','naukri','faang_india','startup','linkedin_mnc'].includes(track)) {
      return res.status(400).json({ error: 'Invalid track' });
    }

    // Free tier daily limit check
    if (user.plan !== 'paid') {
      const usedToday = await db.countCoverLettersToday(user.id);
      if (usedToday >= 2) {
        return res.status(429).json({ error: 'Daily limit reached. Upgrade to Pro for unlimited cover letters.' });
      }
    }

    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== user.id) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const result = await generateCoverLetter(
      resume.extracted_text,
      jobDescription,
      track,
      user.name
    );

    const coverLetterId = Math.random().toString(36).substring(2, 18);
    const clRecord: CoverLetterRecord = {
      id: coverLetterId,
      user_id: user.id,
      resume_id: resumeId,
      track: track as any,
      jd_snippet: jobDescription.slice(0, 200),
      cover_letter: result.cover_letter,
      word_count: result.word_count,
      created_at: new Date().toISOString()
    };
    await db.createCoverLetter(clRecord);

    res.status(200).json({
      id: clRecord.id,
      cover_letter: clRecord.cover_letter,
      word_count: clRecord.word_count,
      created_at: clRecord.created_at
    });
  } catch (err: any) {
    console.error('Cover letter generation error:', err);
    res.status(500).json({ error: err.message || 'Cover letter generation failed' });
  }
});

app.get('/api/cover-letters', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const letters = await db.getCoverLetters(req.user!.id);
    const sorted = letters.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ cover_letters: sorted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch cover letters' });
  }
});

app.delete('/api/cover-letters/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const cl = await db.findCoverLetterById(req.params.id);
    if (!cl || cl.user_id !== req.user!.id) return res.status(404).json({ error: 'Not found' });
    await db.deleteCoverLetter(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// === OFFER LETTER ANALYZER ENDPOINTS ===

app.post('/api/offer-analysis/analyze', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { offerText, role, company, location, experienceYears } = req.body;
    if (!offerText || offerText.length < 100) {
      return res.status(400).json({ error: 'Offer letter text must be at least 100 characters' });
    }
    if (!role || !company || !location) {
      return res.status(400).json({ error: 'role, company, and location are required' });
    }
    const expYears = typeof experienceYears === 'number' ? Math.min(Math.max(0, experienceYears), 40) : 0;

    const result = await analyzeOfferLetter(offerText, role, company, location, expYears);

    const oaId = Math.random().toString(36).substring(2, 18);
    const oa: OfferAnalysis = {
      id: oaId,
      user_id: req.user!.id,
      role, company, location,
      experience_years: expYears,
      ...result,
      created_at: new Date().toISOString()
    };
    await db.createOfferAnalysis(oa);

    res.status(200).json(oa);
  } catch (err: any) {
    console.error('Offer analysis error:', err);
    res.status(500).json({ error: err.message || 'Offer analysis failed' });
  }
});

app.get('/api/offer-analysis', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const analyses = await db.getOfferAnalyses(req.user!.id);
    const sorted = analyses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ analyses: sorted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// === APPLICATION TRACKER ENDPOINTS ===

app.post('/api/applications', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.plan !== 'paid') {
      const count = await db.countApplications(user.id);
      if (count >= 10) {
        return res.status(429).json({ error: 'Free plan limited to 10 tracked applications. Upgrade to Pro for unlimited tracking and analytics.' });
      }
    }

    const { company, role, location, track, portal, applied_date, ats_score, analysis_id, recruiter_name, recruiter_email, notes, next_action, next_action_date, ctc_offered } = req.body;
    if (!company || !role) {
      return res.status(400).json({ error: 'Company and role are required' });
    }

    const appId = Math.random().toString(36).substring(2, 18);
    const now = new Date().toISOString();
    const appRecord: ApplicationRecord = {
      id: appId,
      user_id: user.id,
      company, role, location: location || '',
      track: track || 'naukri',
      portal: portal || 'other',
      applied_date: applied_date || now.split('T')[0],
      status: 'applied',
      ats_score: ats_score || null,
      analysis_id: analysis_id || null,
      resume_version: null,
      recruiter_name: recruiter_name || '',
      recruiter_email: recruiter_email || '',
      notes: notes || '',
      ctc_offered: ctc_offered || null,
      next_action: next_action || '',
      next_action_date: next_action_date || '',
      created_at: now,
      updated_at: now
    };
    await db.createApplication(appRecord);
    res.status(201).json(appRecord);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create application' });
  }
});

app.get('/api/applications', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    let apps = await db.getApplications(req.user!.id);
    const { status, portal } = req.query;
    if (status) apps = apps.filter(a => a.status === status);
    if (portal) apps = apps.filter(a => a.portal === portal);
    apps.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    res.json({ applications: apps });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

app.put('/api/applications/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const app = await db.findApplicationById(req.params.id);
    if (!app || app.user_id !== req.user!.id) return res.status(404).json({ error: 'Not found' });

    const allowed = ['status', 'recruiter_name', 'recruiter_email', 'notes', 'next_action', 'next_action_date', 'ctc_offered'];
    const updates: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await db.updateApplication(req.params.id, updates);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update application' });
  }
});

app.delete('/api/applications/:id', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const app = await db.findApplicationById(req.params.id);
    if (!app || app.user_id !== req.user!.id) return res.status(404).json({ error: 'Not found' });
    await db.deleteApplication(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.get('/api/applications/stats', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const apps = await db.getApplications(req.user!.id);
    const byStatus: Record<string, number> = {};
    const statuses: ApplicationStatus[] = ['applied','screening','interview_r1','interview_r2','final_round','offer_received','accepted','rejected','ghosted','withdrawn'];
    for (const s of statuses) byStatus[s] = 0;
    for (const a of apps) byStatus[a.status] = (byStatus[a.status] || 0) + 1;

    const applied = byStatus['applied'] || 0;
    const screened = (byStatus['screening'] || 0) + (byStatus['interview_r1'] || 0) + (byStatus['interview_r2'] || 0) + (byStatus['final_round'] || 0);
    const total = apps.length;

    const portalCounts: Record<string, number> = {};
    const trackCounts: Record<string, number> = {};
    for (const a of apps) {
      portalCounts[a.portal] = (portalCounts[a.portal] || 0) + 1;
      trackCounts[a.track] = (trackCounts[a.track] || 0) + 1;
    }

    const stats: ApplicationStats = {
      total,
      by_status: byStatus as any,
      response_rate: total > 0 ? Math.round(((screened) / total) * 100) : 0,
      interview_conversion: total > 0 ? Math.round(((screened) / total) * 100) : 0,
      offer_rate: total > 0 ? Math.round((((byStatus['offer_received'] || 0) + (byStatus['accepted'] || 0)) / total) * 100) : 0,
      avg_days_to_response: 0,
      top_portal: (Object.entries(portalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other') as any,
      top_track: (Object.entries(trackCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'naukri') as any,
    };

    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// === RESUME TAILOR ENDPOINTS ===

app.post('/api/resume-tailor/tailor', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Daily limit for premium users too (5 per day)
    const usedToday = await db.countTailorsToday(user.id);
    if (usedToday >= 5) {
      return res.status(429).json({ error: 'Daily limit of 5 tailors reached. Resets at midnight.' });
    }

    const { resumeId, jdText, track } = req.body;
    if (!resumeId || !jdText || jdText.length < 80 || !track) {
      return res.status(400).json({ error: 'resumeId, jdText (min 80 chars), and track required' });
    }

    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== user.id) return res.status(404).json({ error: 'Resume not found' });

    // Get latest analysis score for this resume
    const analyses = await db.getAnalyses(user.id);
    const latestAnalysis = analyses.filter(a => a.resume_id === resumeId).sort((a, b) => b.created_at - a.created_at)[0];
    const originalScore = latestAnalysis?.total_score || 50;

    const result = await tailorResumeToJD(resume.extracted_text, jdText, track, originalScore);

    // Build full tailored text
    const expBulletsText = Object.entries(result.experience_bullets || {})
      .map(([company_, bullets]) => `${company_}:\n${(bullets as string[]).map(b => `• ${b}`).join('\n')}`)
      .join('\n\n');
    const fullTailoredText = `Professional Summary:\n${result.professional_summary}\n\nSkills:\n${(result.skills || []).join(', ')}\n\nExperience:\n${expBulletsText}`;

    const trId = Math.random().toString(36).substring(2, 18);
    const tr: TailoredResumeResult = {
      id: trId,
      user_id: user.id,
      source_resume_id: resumeId,
      jd_snippet: jdText.slice(0, 200),
      track: track as any,
      professional_summary: result.professional_summary || '',
      skills: result.skills || [],
      experience_bullets: result.experience_bullets || {},
      added_keywords: result.added_keywords || [],
      original_score: originalScore,
      estimated_score_improvement: result.estimated_score_improvement || 0,
      full_tailored_text: fullTailoredText,
      created_at: new Date().toISOString()
    };
    await db.createTailoredResume(tr);

    res.status(200).json(tr);
  } catch (err: any) {
    console.error('Resume tailor error:', err);
    res.status(500).json({ error: err.message || 'Resume tailoring failed' });
  }
});

app.get('/api/resume-tailor', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const tailored = await db.getTailoredResumes(req.user!.id);
    const sorted = tailored.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ tailored_resumes: sorted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tailored resumes' });
  }
});

// === LINKEDIN GENERATOR ENDPOINTS ===

app.post('/api/linkedin/generate', requireAuth as any, requirePremium as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId, track, currentHeadline, currentAbout } = req.body;
    if (!resumeId || !track) {
      return res.status(400).json({ error: 'resumeId and track are required' });
    }

    const resume = await db.findResumeById(resumeId);
    if (!resume || resume.user_id !== req.user!.id) return res.status(404).json({ error: 'Resume not found' });

    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const result = await generateLinkedInProfile(
      resume.extracted_text,
      track,
      currentHeadline || '',
      currentAbout || '',
      user.name
    );

    const lpId = Math.random().toString(36).substring(2, 18);
    const lp: LinkedInProfile = {
      id: lpId,
      user_id: user.id,
      track: track as any,
      headlines: result.headlines || [],
      about_section: result.about_section || '',
      skills_to_add: result.skills_to_add || [],
      completeness_checklist: result.completeness_checklist || [],
      created_at: new Date().toISOString()
    };
    await db.createLinkedInProfile(lp);

    res.status(200).json(lp);
  } catch (err: any) {
    console.error('LinkedIn generation error:', err);
    res.status(500).json({ error: err.message || 'LinkedIn profile generation failed' });
  }
});

app.get('/api/linkedin', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    const profiles = await db.getLinkedInProfiles(req.user!.id);
    const sorted = profiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ profiles: sorted });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch LinkedIn profiles' });
  }
});

// Reset analyses daily counter helper (For admin play/demonstration)
app.post('/api/user/reset-quota', requireAuth as any, async (req: AuthenticatedRequest, res) => {
  try {
    await db.updateUser(req.user!.id, { analyses_used_today: 0 });
    res.json({ message: 'analyses count reset to 0' });
  } catch {
    res.status(500).json({ error: 'Failed reset.' });
  }
});

// === VITE / STATIC CLIENT ROUTING HANDLER ===
async function runServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in Express for development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production direct static client from "dist/".');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`ATScore India custom server listening on port ${PORT}`);
    console.log(`Environment mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });
}

runServer();
