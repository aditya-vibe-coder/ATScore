/**
 * ATScore India - Database Layer
 * In-memory storage with all CRUD operations for users, resumes, analyses, payments, OTPs, and Naukri profiles.
 * Designed for easy swap-in of a persistent DB later.
 */
import { User, Resume, Analysis, PaymentRecord, NaukriProfile, AIFeedbackResult, CoverLetterRecord, OfferAnalysis, ApplicationRecord, TailoredResumeResult, LinkedInProfile } from '../src/types';

// ===================== TYPES =====================
interface OtpRecord {
  id: string;
  email: string;
  otp_hash: string;
  purpose: 'verify_email' | 'password_reset';
  expires_at: number;
  used: number;
  created_at: number;
}

interface StoredUser extends User {
  password_hash: string;
  byok_key_encrypted?: string | null;
  analyses_used_today: number;
}

interface StoredResume extends Resume {
  extracted_text: string;
  parsed_data: any;
}

// ===================== STORAGE =====================
const users = new Map<string, StoredUser>();
const usersByEmail = new Map<string, StoredUser>();
const otps = new Map<string, OtpRecord[]>();
const resumes = new Map<string, StoredResume>();
const analyses = new Map<string, Analysis>();
const payments = new Map<string, PaymentRecord>();
const paymentsByOrderId = new Map<string, PaymentRecord>();
const naukriProfiles = new Map<string, NaukriProfile>();
const coverLetters = new Map<string, CoverLetterRecord>();
const offerAnalyses = new Map<string, OfferAnalysis>();
const applications = new Map<string, ApplicationRecord>();
const tailoredResumes = new Map<string, TailoredResumeResult>();
const linkedInProfiles = new Map<string, LinkedInProfile>();

// ===================== INIT =====================
export const db = {
  init() {
    console.log('[DB] In-memory database initialized.');
    // Seed some sample data if empty for development
    if (users.size === 0 && process.env.NODE_ENV !== 'production') {
      console.log('[DB] Development mode — ready for fresh usage.');
    }
  },

  // ===================== USERS =====================
  async createUser(user: StoredUser): Promise<void> {
    users.set(user.id, user);
    usersByEmail.set(user.email.toLowerCase(), user);
  },

  async findUserById(id: string): Promise<StoredUser | undefined> {
    return users.get(id);
  },

  async findUserByEmail(email: string): Promise<StoredUser | undefined> {
    return usersByEmail.get(email.toLowerCase());
  },

  async updateUser(id: string, updates: Partial<StoredUser>): Promise<StoredUser | undefined> {
    const user = users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    users.set(id, updated);
    usersByEmail.set(user.email.toLowerCase(), updated);
    return updated;
  },

  // ===================== OTPS =====================
  async createOtp(otp: OtpRecord): Promise<void> {
    const key = otp.email.toLowerCase();
    const existing = otps.get(key) || [];
    existing.push(otp);
    otps.set(key, existing);
  },

  async findOtp(email: string, purpose: string): Promise<OtpRecord | undefined> {
    const key = email.toLowerCase();
    const userOtps = otps.get(key);
    if (!userOtps) return undefined;
    // Find the most recent matching OTP that's not used
    return userOtps
      .filter(o => o.purpose === purpose && o.used === 0)
      .sort((a, b) => b.created_at - a.created_at)[0];
  },

  async markOtpUsed(id: string): Promise<void> {
    for (const [, userOtps] of otps) {
      const found = userOtps.find(o => o.id === id);
      if (found) {
        found.used = 1;
        return;
      }
    }
  },

  // ===================== RESUMES =====================
  async createResume(resume: StoredResume): Promise<void> {
    resumes.set(resume.id, resume);
  },

  async getResumes(userId: string): Promise<StoredResume[]> {
    return Array.from(resumes.values()).filter(r => r.user_id === userId);
  },

  async findResumeById(id: string): Promise<StoredResume | undefined> {
    return resumes.get(id);
  },

  async deleteResume(id: string): Promise<boolean> {
    // Also delete associated analyses
    for (const [aid, analysis] of analyses) {
      if (analysis.resume_id === id) {
        analyses.delete(aid);
      }
    }
    return resumes.delete(id);
  },

  async updateResumeName(id: string, name: string): Promise<StoredResume | undefined> {
    const resume = resumes.get(id);
    if (!resume) return undefined;
    const updated = { ...resume, name, updated_at: Date.now() };
    resumes.set(id, updated);
    return updated;
  },

  // ===================== ANALYSES =====================
  async createAnalysis(analysis: Analysis): Promise<void> {
    analyses.set(analysis.id, analysis);
  },

  async getAnalyses(userId: string): Promise<Analysis[]> {
    return Array.from(analyses.values()).filter(a => a.user_id === userId);
  },

  async findAnalysisById(id: string): Promise<Analysis | undefined> {
    return analyses.get(id);
  },

  async deleteAnalysis(id: string): Promise<boolean> {
    return analyses.delete(id);
  },

  async updateAnalysisFeedback(id: string, aiFeedback: AIFeedbackResult): Promise<Analysis | undefined> {
    const analysis = analyses.get(id);
    if (!analysis) return undefined;
    const updated = {
      ...analysis,
      ai_feedback: aiFeedback,
      ai_feedback_generated_at: Date.now()
    };
    analyses.set(id, updated);
    return updated;
  },

  // ===================== PAYMENTS =====================
  async createPayment(payment: PaymentRecord): Promise<void> {
    payments.set(payment.id, payment);
    paymentsByOrderId.set(payment.razorpay_order_id, payment);
  },

  async findPaymentByOrderId(orderId: string): Promise<PaymentRecord | undefined> {
    return paymentsByOrderId.get(orderId);
  },

  async updatePaymentStatus(orderId: string, status: PaymentRecord['status'], paymentId?: string): Promise<void> {
    const payment = paymentsByOrderId.get(orderId);
    if (!payment) return;
    const updated = {
      ...payment,
      status,
      razorpay_payment_id: paymentId || payment.razorpay_payment_id,
      paid_at: status === 'paid' ? Date.now() : payment.paid_at
    };
    payments.set(payment.id, updated);
    paymentsByOrderId.set(orderId, updated);
  },

  async getPayments(userId: string): Promise<PaymentRecord[]> {
    return Array.from(payments.values()).filter(p => p.user_id === userId);
  },

  // ===================== NAUKRI PROFILES =====================
  async createOrUpdateNaukriProfile(userId: string, profile: NaukriProfile): Promise<void> {
    naukriProfiles.set(userId, profile);
  },

  async findNaukriProfileByUserId(userId: string): Promise<NaukriProfile | undefined> {
    return naukriProfiles.get(userId);
  },

  // ===================== COVER LETTERS =====================
  async createCoverLetter(cl: CoverLetterRecord): Promise<void> {
    coverLetters.set(cl.id, cl);
  },

  async getCoverLetters(userId: string): Promise<CoverLetterRecord[]> {
    return Array.from(coverLetters.values()).filter(cl => cl.user_id === userId);
  },

  async findCoverLetterById(id: string): Promise<CoverLetterRecord | undefined> {
    return coverLetters.get(id);
  },

  async deleteCoverLetter(id: string): Promise<boolean> {
    return coverLetters.delete(id);
  },

  async countCoverLettersToday(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(coverLetters.values()).filter(
      cl => cl.user_id === userId && cl.created_at.startsWith(today)
    ).length;
  },

  // ===================== OFFER ANALYSES =====================
  async createOfferAnalysis(oa: OfferAnalysis): Promise<void> {
    offerAnalyses.set(oa.id, oa);
  },

  async getOfferAnalyses(userId: string): Promise<OfferAnalysis[]> {
    return Array.from(offerAnalyses.values()).filter(oa => oa.user_id === userId);
  },

  async findOfferAnalysisById(id: string): Promise<OfferAnalysis | undefined> {
    return offerAnalyses.get(id);
  },

  // ===================== APPLICATIONS =====================
  async createApplication(app: ApplicationRecord): Promise<void> {
    applications.set(app.id, app);
  },

  async getApplications(userId: string): Promise<ApplicationRecord[]> {
    return Array.from(applications.values()).filter(a => a.user_id === userId);
  },

  async findApplicationById(id: string): Promise<ApplicationRecord | undefined> {
    return applications.get(id);
  },

  async updateApplication(id: string, updates: Partial<ApplicationRecord>): Promise<ApplicationRecord | undefined> {
    const app = applications.get(id);
    if (!app) return undefined;
    const updated = { ...app, ...updates, updated_at: Date.now().toString() };
    applications.set(id, updated);
    return updated;
  },

  async deleteApplication(id: string): Promise<boolean> {
    return applications.delete(id);
  },

  async countApplications(userId: string): Promise<number> {
    return Array.from(applications.values()).filter(a => a.user_id === userId).length;
  },

  // ===================== TAILORED RESUMES =====================
  async createTailoredResume(tr: TailoredResumeResult): Promise<void> {
    tailoredResumes.set(tr.id, tr);
  },

  async getTailoredResumes(userId: string): Promise<TailoredResumeResult[]> {
    return Array.from(tailoredResumes.values()).filter(tr => tr.user_id === userId);
  },

  async findTailoredResumeById(id: string): Promise<TailoredResumeResult | undefined> {
    return tailoredResumes.get(id);
  },

  async countTailorsToday(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(tailoredResumes.values()).filter(
      tr => tr.user_id === userId && tr.created_at.startsWith(today)
    ).length;
  },

  // ===================== LINKEDIN PROFILES =====================
  async createLinkedInProfile(lp: LinkedInProfile): Promise<void> {
    linkedInProfiles.set(lp.id, lp);
  },

  async getLinkedInProfiles(userId: string): Promise<LinkedInProfile[]> {
    return Array.from(linkedInProfiles.values()).filter(lp => lp.user_id === userId);
  },

  async findLinkedInProfileById(id: string): Promise<LinkedInProfile | undefined> {
    return linkedInProfiles.get(id);
  },

  // ===================== ADMIN / DEBUG =====================
  async getAllUsers(): Promise<StoredUser[]> {
    return Array.from(users.values());
  },

  async resetAllDailyCounters(): Promise<void> {
    for (const [id, user] of users) {
      users.set(id, { ...user, analyses_used_today: 0 });
    }
    console.log('[DB] Reset all daily usage counters.');
  }
};
