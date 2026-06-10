import { TrackKey } from './types';

export interface TrackConfig {
  key: TrackKey;
  name: string;
  companies: string;
  description: string;
  longDescription: string;
  idealFor: string;
  accentClass: string;
  logoText: string;
}

export const TRACK_DETAILS: Record<TrackKey, TrackConfig> = {
  mass_hiring: {
    key: 'mass_hiring',
    name: 'Mass Hiring',
    logoText: 'TCS iON',
    companies: 'TCS · Infosys · Wipro · Cognizant · HCL · Capgemini',
    description: 'Calibrated for corporate services and entry-level mass engineering registration databases.',
    longDescription: 'Requires high focus on academic degree markers (CGPA > 6.5 cutoff is non-negotiable), explicitly state 10th/12th percentages, active backlogs declaration, and high standard keywords density.',
    idealFor: 'Freshers, service aspirants, and university drive applicants.',
    accentClass: 'bg-orange-950/40 border-orange-700/60 text-orange-300'
  },
  naukri: {
    key: 'naukri',
    name: 'Naukri.com Index',
    logoText: 'Naukri',
    companies: 'Mid-market companies · IT service MNCs · Product scaling firms',
    description: 'Calibrated for Naukri FastForward crawler search algorithms and profile indexing bots.',
    longDescription: 'Prioritizes extreme keyword density matching, explicit Notice Period tags (recruiters filter heavily by under 30 days notice), a prominent Skills stack section, and profile completeness indexes.',
    idealFor: 'Experienced analysts, corporate mid-level engineers, and active portal job hunters.',
    accentClass: 'bg-blue-950/40 border-blue-700/60 text-blue-300'
  },
  faang_india: {
    key: 'faang_india',
    name: 'FAANG India',
    logoText: 'FAANG',
    companies: 'Google · Meta · Amazon · Microsoft · Flipkart · Zepto · Swiggy · CRED',
    description: 'Calibrated for elite technology operations, system engineers, and product giants.',
    longDescription: 'A strict single-page limit prioritizing STAR metric achievements (e.g. "Reduced latency by 45%"), massive action verbs count, system design HLD/LLD terms, and GitHub profile connections.',
    idealFor: 'Product engineers, algorithms specialists, and elite system designers.',
    accentClass: 'bg-purple-950/30 border-purple-700/60 text-purple-300'
  },
  startup: {
    key: 'startup',
    name: 'Indian Startups',
    logoText: 'YC India',
    companies: 'Series A–C startups · YC India portfolio · Shipped product companies',
    description: 'Calibrated for fast-growing Indian software operations and venture operations.',
    longDescription: 'Rewards project breadth over educational pedigree. Focuses heavily on personal projects, production links, active portfolio websites, versatile modern stack tools, and hacker initiative evidence.',
    idealFor: 'Full stake generalists, indie hackers, and swift product builders.',
    accentClass: 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
  },
  linkedin_mnc: {
    key: 'linkedin_mnc',
    name: 'LinkedIn / Consulting MNC',
    logoText: 'LinkedIn',
    companies: 'Deloitte · Accenture · PwC · KPMG · IBM · Oracle · Salesforce India',
    description: 'Calibrated for administrative services, consultants, cloud engineers, and technical analysts.',
    longDescription: 'Focuses heavily on professional bio summaries, consulting certifications validation (AWS, Oracle Cloud, PMP, Scrum Master), soft skills keywords, and standardized corporate templates.',
    idealFor: 'Tech consultants, cloud engineers, scrum masters, and business analysts.',
    accentClass: 'bg-cyan-950/40 border-cyan-700/60 text-cyan-300'
  },
};
