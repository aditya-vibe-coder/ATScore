/**
 * Client API Client for ATScore India
 */

// Configurable API base URL — override via window.__ATSCORE_API_URL or VITE_API_URL env var
const API_BASE = (window as any).__ATSCORE_API_URL || import.meta.env.VITE_API_URL || '';

const BASE_URL = API_BASE || '';

let cachedToken = localStorage.getItem('atscore_token') || '';

export function getAuthToken() {
  return cachedToken;
}

export function saveAuthToken(token: string) {
  cachedToken = token;
  localStorage.setItem('atscore_token', token);
}

export function clearAuthToken() {
  cachedToken = '';
  localStorage.removeItem('atscore_token');
}

// Global fetch wrapper
async function secureFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (cachedToken) {
    headers.set('Authorization', `Bearer ${cachedToken}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    clearAuthToken();
    // Dispatch custom event to notify App to boot to login
    window.dispatchEvent(new Event('atscore_logout_event'));
  }

  const text = await response.text();
  let json: any = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  if (!response.ok) {
    throw new Error(json.error || json.message || 'Network request failed.');
  }

  return json;
}

export const api = {
  // Authentication
  async signup(payload: any) {
    return secureFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async verifyEmail(payload: any) {
    const res = await secureFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.accessToken) {
      saveAuthToken(res.accessToken);
    }
    return res;
  },

  async login(payload: any) {
    const res = await secureFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.accessToken) {
      saveAuthToken(res.accessToken);
    }
    return res;
  },

  async forgotPassword(payload: any) {
    return secureFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async resetPassword(payload: any) {
    return secureFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // User Profile details
  async getProfile() {
    return secureFetch('/api/user/profile');
  },

  async updateProfile(name: string) {
    return secureFetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  },

  async saveByokKey(key: string) {
    return secureFetch('/api/user/byok-key', {
      method: 'POST',
      body: JSON.stringify({ key })
    });
  },

  async removeByokKey() {
    return secureFetch('/api/user/byok-key', {
      method: 'DELETE'
    });
  },

  async getUsageLimits() {
    return secureFetch('/api/user/usage');
  },

  async resetTodayUsageLimit() {
    return secureFetch('/api/user/reset-quota', {
      method: 'POST'
    });
  },

  // Resumes
  async getResumes() {
    return secureFetch('/api/resumes');
  },

  async uploadResume(fileName: string, base64Content: string) {
    return secureFetch('/api/resumes/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileContent: base64Content })
    });
  },

  async seedMockResume() {
    return secureFetch('/api/resumes/seed-mock', {
      method: 'POST'
    });
  },

  async deleteResume(id: string) {
    return secureFetch(`/api/resumes/${id}`, {
      method: 'DELETE'
    });
  },

  async renameResume(id: string, name: string) {
    return secureFetch(`/api/resumes/${id}/name`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  },

  // Analyses
  async getAnalyses() {
    return secureFetch('/api/analyses');
  },

  async getAnalysis(id: string) {
    return secureFetch(`/api/analyses/${id}`);
  },

  async getPublicAnalysis(id: string) {
    return secureFetch(`/api/public/analyses/${id}`);
  },

  async runAnalysis(payload: { resumeId: string; jdText: string; track: string }) {
    return secureFetch('/api/analyses', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteAnalysis(id: string) {
    return secureFetch(`/api/analyses/${id}`, {
      method: 'DELETE'
    });
  },

  async triggerAIFeedback(id: string) {
    return secureFetch(`/api/analyses/${id}/ai-feedback`, {
      method: 'POST'
    });
  },

  // Payments / subscriptions
  async createBillingOrder(plan: 'monthly' | 'yearly' = 'yearly') {
    return secureFetch('/api/payments/create-order', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  },

  async verifyBillingPayment(payload: { orderId: string; paymentId?: string; signature?: string }) {
    return secureFetch('/api/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getPaymentsHistory() {
    return secureFetch('/api/payments/history');
  },

  // Premium PremiumToolsHub AI Endpoint helper representation
  async premiumInterviewPrep(payload: { resumeId: string; jdText: string; track: string }) {
    return secureFetch('/api/premium/interview-prep', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async premiumReferralPitch(payload: { resumeId: string; targetCompany: string; targetJobTitle: string }) {
    return secureFetch('/api/premium/referral-pitch', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async premiumSocialOptimize(payload: { resumeId: string }) {
    return secureFetch('/api/premium/social-optimize', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async premiumJdMatchSandbox(payload: { resumeId: string; jdText: string }) {
    return secureFetch('/api/premium/jd-match-sandbox', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Naukri profile crawls
  async submitNaukriProfile(payload: any) {
    return secureFetch('/api/naukri/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getLatestNaukriProfile() {
    return secureFetch('/api/naukri/latest');
  },

  // === COVER LETTERS ===
  async generateCoverLetter(payload: { resumeId: string; jdText: string; track: string }) {
    return secureFetch('/api/cover-letters/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getCoverLetters() {
    return secureFetch('/api/cover-letters');
  },

  async deleteCoverLetter(id: string) {
    return secureFetch(`/api/cover-letters/${id}`, { method: 'DELETE' });
  },

  // === OFFER ANALYZER ===
  async analyzeOffer(payload: { offerText: string; role: string; company: string; location: string; experienceYears: number }) {
    return secureFetch('/api/offer-analysis/analyze', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getOfferAnalyses() {
    return secureFetch('/api/offer-analysis');
  },

  // === APPLICATIONS ===
  async createApplication(payload: any) {
    return secureFetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getApplications() {
    return secureFetch('/api/applications');
  },

  async updateApplication(id: string, payload: any) {
    return secureFetch(`/api/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteApplication(id: string) {
    return secureFetch(`/api/applications/${id}`, { method: 'DELETE' });
  },

  async getApplicationStats() {
    return secureFetch('/api/applications/stats');
  },

  // === RESUME TAILOR ===
  async tailorResume(payload: { resumeId: string; jdText: string; track: string }) {
    return secureFetch('/api/resume-tailor/tailor', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getTailoredResumes() {
    return secureFetch('/api/resume-tailor');
  },

  // === LINKEDIN GENERATOR ===
  async generateLinkedIn(payload: { resumeId: string; track: string; currentHeadline?: string; currentAbout?: string }) {
    return secureFetch('/api/linkedin/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getLinkedInProfiles() {
    return secureFetch('/api/linkedin');
  }
};
