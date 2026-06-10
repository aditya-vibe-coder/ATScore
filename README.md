<div align="center">
  <img src="assets/ATScore.png" alt="ATScore India — ATS Resume Scorer for Indian Jobs" width="100%" />
</div>

<br />

<div align="center">

# ATScore India

### ATS Resume Scorer Calibrated for Indian Jobs

*100-point multi-bucket scoring engine covering TCS mass hiring, Naukri.com mid-market,*
*FAANG India loops, Indian startups, and consulting MNCs.*

<br />

[![License: Proprietary](https://img.shields.io/badge/license-Proprietary-red)](#license)
[![Live](https://img.shields.io/badge/Live-atscore.harmnix.com-orange?logo=cloudflare)](https://atscore.harmnix.com)
[![Stack: React](https://img.shields.io/badge/Stack-React+TypeScript-3178C6?logo=typescript)](https://react.dev)
[![AI: Gemini](https://img.shields.io/badge/AI-Gemini-4285F4?logo=google)](https://deepmind.google/technologies/gemini/)
[![Auth: JWT](https://img.shields.io/badge/Auth-JWT+Bcrypt-000000?logo=jsonwebtokens)](https://jwt.io)

<br />

**[🔗 atscore.harmnix.com](https://atscore.harmnix.com)**

</div>

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Scoring Engine](#scoring-engine)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Publishing Guide](#publishing-guide)
- [Security Model](#security-model)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

ATScore India scores resumes on a 100-point scale using five calibrated buckets that reflect what Indian recruiters actually look for. Unlike generic ATS checkers calibrated for US hiring, ATScore India accounts for CGPA thresholds in mass hiring, notice period tags on Naukri.com, STAR-format quantified bullets for FAANG India, GitHub and shipped-product evidence for startups, and cloud certifications for consulting MNCs.

---

## Features

### Core Scoring Engine

**100-Point Multi-Bucket Scoring** — Each resume is scored across Format & Layout (20 pts), Sections Completeness (20 pts), Keyword Density (30 pts), India Intelligence (30 pts), and a Track-Specific Bonus (up to 10 pts). Instant A-to-F grade with full breakdown.

**5 India-Calibrated Tracks** — Mass Hiring (TCS, Infosys, Wipro, Cognizant, HCL, Capgemini), Naukri.com Index (mid-market IT MNCs), FAANG India (Google, Meta, Amazon, Microsoft, Flipkart, Swiggy, CRED), Indian Startups (YC India, Series A-C), and LinkedIn / Consulting MNC (Deloitte, Accenture, PwC, IBM, Oracle, Salesforce).

**Keyword Gap Analysis** — Identifies missing keywords for each track and compares against uploaded JD text for ATS match rate optimization.

**India Intelligence** — Evaluates CGPA, college tier (Tier-1/2/Standard), notice period, 10th/12th marks, LinkedIn/GitHub presence, and STAR achievement verb density.

**Naukri.com Profile Analyzer** — Analyzes profile completeness, headline optimization, skills stack density, notice period tags, and CTC transparency for Naukri FastForward crawler algorithms.

### AI & Premium Tools

**STAR Bullet Rewriter** *(Premium)* — Converts duty-based bullets into quantified STAR-format achievements with metrics.

**Interview Prep Generator** *(Premium)* — Generates role-specific technical and behavioral questions based on resume and target JD.

**Keyword Injector** *(Premium)* — Suggests semantic keyword additions for ATS match rate improvement.

**GCC Alignment Engine** *(Premium)* — Analyzes resume suitability for Global Capability Centers.

**Tier-Comp Analyzer** *(Premium)* — Benchmarks compensation expectations against market data.

**Referral Pitch Generator** *(Premium)* — Generates LinkedIn cold messages and email referral pitches.

**JD Match Sandbox** *(Premium)* — A-B tests resume match against any job description.

**Cover Letter Generator** — Generates role-specific cover letters with customizable tracks.

**Offer Letter Analyzer** *(Premium)* — Analyzes CTC breakdown, in-hand salary, variable pay, red flags, and generates negotiation scripts.

**Application Tracker** — Tracks job applications with status pipeline, recruiter notes, and stats dashboard.

**Resume Tailor** *(Premium)* — Tailors resume content to specific job descriptions with keyword injection.

**LinkedIn Profile Generator** *(Premium)* — Generates optimized headline variants, about sections, and skills recommendations.

### Account & Security

**Email OTP Authentication** — No passwords stored in plaintext. PBKDF2 hashing with 100k iterations.

**JWT Session Management** — 7-day access tokens with HMAC-SHA256 signing.

**BYOK (Bring Your Own Key)** — Users can add OpenAI API keys, encrypted at rest with AES-256-GCM.

**Razorpay Subscription Billing** — ₹79/month or ₹799/year with webhook verification via HMAC-SHA256.

**Cloudflare KV Storage** — All user data stored in KV with per-user key isolation.

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Frontend | React 19 + TypeScript | Component-based UI with type safety |
| Styling | Tailwind CSS v4 + Lucide Icons | Utility-first responsive design |
| Charts | Recharts | Score breakdown visualization |
| Backend | Express.js + Cloudflare Workers | Dual deployment (server + edge) |
| Database | Cloudflare KV / SQLite | Persistent user data storage |
| Auth | jose (JWT) + bcryptjs | Token-based auth with password hashing |
| Encryption | Node.js crypto (AES-256-GCM) | At-rest encryption for BYOK keys |
| Payments | Razorpay | Subscription billing and invoicing |
| AI | Gemini API + OpenAI API | Deep feedback and premium features |
| Parser | mammoth (DOCX) + pdf-parse | Resume file text extraction |
| Build | Vite + esbuild | Fast development and optimized builds |
| Hosting | Google Cloud Run / Cloudflare | Scalable serverless deployment |

---

## How It Works

### Data Flow

```
User Uploads Resume (.pdf / .docx)
         │
         ▼
Text Extraction (mammoth / pdf-parse)
         │
         ▼
Scoring Engine (100-point multi-bucket)
  ├─ Format & Layout (20 pts)
  ├─ Sections Completeness (20 pts)
  ├─ Keyword Density (30 pts)
  ├─ India Intelligence (30 pts)
  └─ Track Bonus (up to 10 pts)
         │
         ▼
Instant A-to-F Grade with Breakdown
         │
         ▼
Premium Features (optional)
  ├─ AI Deep Feedback (Gemini / OpenAI)
  ├─ STAR Rewrites
  ├─ Interview Prep
  └─ Keyword Injector
```

### Where Data Lives

| Data Type | Stored In | Persists? | Encrypted? |
| :--- | :--- | :--- | :--- |
| User Accounts | Cloudflare KV | Yes | Passwords (bcrypt) |
| Resumes | Cloudflare KV | Yes | No |
| Analyses | Cloudflare KV | Yes | No |
| BYOK Keys | Cloudflare KV | Yes | AES-256-GCM |
| Payment Records | Cloudflare KV | Yes | No |
| Application Data | Cloudflare KV | Yes | No |

---

## Scoring Engine

The scoring engine runs entirely on the server/worker side and evaluates resumes against five calibrated buckets:

### 1. Format & Layout (20 pts)
- Word count optimization (300–1200 words)
- Contact info (email + phone)
- Bullet point usage (5+ bullets)
- Section headers and structure

### 2. Sections Completeness (20 pts)
- Education section
- Skills section
- Experience section
- Projects section
- Contact info section

### 3. Keyword Density (30 pts)
- Track-specific keyword matching (15 pts)
- JD keyword cross-reference (10 pts)
- General demand skill density (5 pts)

### 4. India Intelligence (30 pts)
- CGPA evaluation (8 pts)
- College tier classification (7 pts)
- Notice period assessment (5 pts)
- 10th/12th marks declaration (4 pts)
- LinkedIn/GitHub presence (4 pts)
- STAR achievement verbs (4 pts)
- Issue flagging with specific recommendations

### 5. Track Bonus (up to 10 pts)
- Track-specific scoring rubric with custom keyword weights

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Cloudflare account (for Worker deployment)
- Razorpay account (for payment integration)

### Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd atscore-india

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Fill in your API keys and secrets

# Start development server
npm run dev
```

### Worker Development

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create "KV_DATA"

# Start Worker dev server
cd worker
wrangler dev
```

### Build for Production

```bash
npm run build
# Output: dist/ (static assets) + dist/server.cjs (Express backend)
```

---

## Usage

### 1. Upload a Resume
1. Sign up with email and verify via OTP
2. Upload a PDF or DOCX resume (max 5MB)
3. Select your target track (Mass Hiring, Naukri.com, FAANG India, Startup, or Consulting MNC)
4. Optionally paste a job description for keyword cross-referencing

### 2. Read Your Score
- View your A-to-F grade and 100-point breakdown
- Check keyword gaps specific to your track
- Review India Intelligence analysis (CGPA, college tier, notice period)
- Read specific recommendations for improvement

### 3. Use Premium Features
1. Subscribe via Razorpay (monthly or yearly) or add your own OpenAI API key
2. Trigger AI Deep Feedback for STAR-format rewrites and detailed analysis
3. Use the STAR Bullet Rewriter to transform duty bullets into achievements
4. Generate interview prep questions tailored to your resume and target role
5. Analyze Naukri.com profile for recruiter visibility optimization

### 4. Track Applications
1. Log job applications with company, role, portal, and status
2. Track recruiter interactions and follow-ups
3. View application statistics (response rate, interview conversion, offer rate)

### 5. Generate Cover Letters & LinkedIn Profiles
1. Select a resume and target track
2. Paste the job description
3. Generate a tailored cover letter
4. Use LinkedIn Generator for optimized profile content

---

## Publishing Guide

### Public Repo Checklist

Before pushing this repo to a public destination (GitHub, GitLab, etc.):

1. **Sanitize `workers/wrangler.toml`:** Replace the KV namespace ID, custom domain route, and ALL hardcoded secrets with placeholders. Secrets should be set via `wrangler secret put` in production.

2. **Sanitize `workers/src/index.ts`:** Ensure all fallback secret values are placeholders (e.g., `'your-jwt-secret'`, `'rzp_live_YOUR_KEY_ID'`).

3. **Sanitize `server.ts`:** Replace production CORS origins and fallback credentials with placeholders.

4. **Sanitize `src/api.ts`:** Use runtime override (`window.__ATSCORE_API_URL`) or env var instead of hardcoded production URLs.

5. **Sanitize `server/auth.ts` and `server/crypto.ts`:** Replace real JWT secrets and encryption keys with placeholders.

6. **Create `.env.example`:** Template-only file with placeholder values for all required env vars.

7. **Delete** `package-lock.json`, `assets/.aistudio/`, and any credential files.

8. **Add `worker/.wrangler/` to `.gitignore`.**

9. **Verify** with grep:
```bash
grep -rl "rzp_live_\|atscore\.harmnix\.com\|8cb62866\|your-actual-secret" .
```

### Deployment

- **Frontend:** Deploy `dist/` to Cloudflare Pages, Vercel, or any static host
- **Backend (Express):** Deploy to Google Cloud Run, Railway, or any Node.js host
- **Backend (Worker):** Deploy with `wrangler deploy` from the `workers/` directory

---

## Security Model

### Authentication
- **Passwords:** Hashed with bcrypt (12 rounds) in Express mode, PBKDF2 (100k iterations) in Worker mode
- **Sessions:** JWT access tokens with 7-day expiry, signed with HMAC-SHA256
- **OTP:** 6-digit codes with 10-minute TTL for email verification and password reset

### Data Encryption
- **BYOK Keys:** Encrypted at rest using AES-256-GCM with derive key from scrypt
- **Payment Webhooks:** Verified with HMAC-SHA256 using Razorpay webhook secret
- **No Plaintext Secrets:** All credentials loaded from environment variables or `wrangler secret`

### Rate Limiting
- **Auth Endpoints:** 10 requests/minute for signup, 20 requests/minute for login
- **Free Tier:** 2 analyses/day, 10 tracked applications, 2 cover letters/day
- **Premium Tier:** 5 tailor operations/day, unlimited analyses and AI feedback

### CORS
- Strict whitelist of allowed origins
- Credentials flag enabled for authenticated sessions

---

## Roadmap

### Completed
- [x] 100-point multi-bucket scoring engine
- [x] 5 India-calibrated tracks with custom keyword vocabularies
- [x] Resume upload and text extraction (PDF + DOCX)
- [x] Instant A-to-F grade with bucket breakdown
- [x] Keyword gap analysis with JD cross-reference
- [x] India Intelligence (CGPA, college tier, notice period)
- [x] Email OTP authentication with JWT sessions
- [x] Razorpay subscription billing
- [x] BYOK (Bring Your Own Key) with AES-256-GCM encryption
- [x] Naukri.com profile analyzer
- [x] Cover letter generator
- [x] Offer letter analyzer with negotiation scripts
- [x] Application tracker with stats dashboard
- [x] Resume tailor for JD-specific optimization
- [x] LinkedIn profile generator
- [x] Resume versioning and score history
- [x] Mobile-first responsive design
- [x] Both Express server and Cloudflare Worker deployments

### Planned
- [ ] Image/animated score gauge
- [ ] Batch resume scoring
- [ ] PDF score report export
- [ ] Dark mode toggle
- [ ] Team/collaboration features
- [ ] ATS score heatmap across multiple resumes
- [ ] Integration with LinkedIn API for profile import

---

## License

© 2025 Harmnix. All rights reserved.

This source code is provided for portfolio and reference purposes only. Commercial use, redistribution, or self-hosting is not permitted.

---

## Author

Built by **[Harmnix](https://harmnix.com)** — a portfolio of developer tools and productivity apps for Indian users.
