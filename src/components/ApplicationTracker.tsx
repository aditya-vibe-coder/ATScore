import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, ChevronDown, ChevronUp, Briefcase, Building2, MapPin, Clock, Zap, TrendingUp, Lock } from 'lucide-react';
import { User, ApplicationRecord, ApplicationStatus, ApplicationPortal, ApplicationStats } from '../types';
import { api } from '../api';
import { TRACK_DETAILS } from '../constants';

interface Props { user: User | null; onUpgradeTrigger: () => void; }

const STATUS_ORDER: ApplicationStatus[] = ['applied','screening','interview_r1','interview_r2','final_round','offer_received','accepted','rejected','ghosted','withdrawn'];
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied', screening: 'Screening', interview_r1: 'Round 1', interview_r2: 'Round 2',
  final_round: 'Final Round', offer_received: 'Offer', accepted: 'Accepted',
  rejected: 'Rejected', ghosted: 'Ghosted', withdrawn: 'Withdrawn'
};
const PORTALS: ApplicationPortal[] = ['naukri','linkedin','company_site','referral','campus','recruiter_email','other'];
const DONE_STATUSES: ApplicationStatus[] = ['accepted','rejected','ghosted','withdrawn'];

export function ApplicationTracker({ user, onUpgradeTrigger }: Props) {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ company: '', role: '', location: '', track: 'naukri', portal: 'linkedin' as ApplicationPortal, applied_date: new Date().toISOString().split('T')[0], notes: '', recruiter_name: '', recruiter_email: '', next_action: '', next_action_date: '' });

  const isPremium = user?.plan === 'paid';
  const freeCount = applications.length;

  useEffect(() => { loadApps(); if (isPremium) loadStats(); }, []);

  const loadApps = async () => {
    try {
      const res = await api.getApplications();
      setApplications(res.applications || []);
    } catch {}
  };

  const loadStats = async () => {
    try {
      const res = await api.getApplicationStats();
      setStats(res.stats || null);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.role) { setError('Company and role are required.'); return; }
    try {
      await api.createApplication(form);
      setShowForm(false);
      setForm({ company: '', role: '', location: '', track: 'naukri', portal: 'linkedin', applied_date: new Date().toISOString().split('T')[0], notes: '', recruiter_name: '', recruiter_email: '', next_action: '', next_action_date: '' });
      loadApps();
    } catch (err: any) { setError(err.message); }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try { await api.updateApplication(id, { status }); loadApps(); } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this application?')) return;
    try { await api.deleteApplication(id); loadApps(); } catch (err: any) { setError(err.message); }
  };

  const getDaysSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const trackColors: Record<string, string> = {
    mass_hiring: 'bg-orange-950/40 text-orange-300 border-orange-700/30',
    naukri: 'bg-blue-950/40 text-blue-300 border-blue-700/30',
    faang_india: 'bg-purple-950/30 text-purple-300 border-purple-700/30',
    startup: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/30',
    linkedin_mnc: 'bg-cyan-950/40 text-cyan-300 border-cyan-700/30',
  };

  const columnApps = (status: ApplicationStatus) => applications.filter(a => a.status === status);

  const filteredApps = filterStatus ? applications.filter(a => a.status === filterStatus) : applications;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">Application Tracker</h2>
          <p className="text-xs text-gray-400 mt-1">Track every job application from submission through offer.</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.plan !== 'paid' && (
            <span className="text-[10px] px-2 py-1 bg-brand-bg border border-brand-border rounded-lg text-gray-400 font-mono">{freeCount}/10 used</span>
          )}
          <button onClick={() => setShowForm(true)} className="px-4 py-2 text-xs font-semibold bg-accent-primary text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {error && <div className="bg-red-950/40 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs">{error}</div>}

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setFilterStatus('')} className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg whitespace-nowrap ${!filterStatus ? 'bg-accent-primary text-white' : 'bg-brand-bg text-gray-400 border border-brand-border'}`}>All</button>
        {STATUS_ORDER.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg whitespace-nowrap ${filterStatus === s ? 'bg-accent-primary text-white' : 'bg-brand-bg text-gray-400 border border-brand-border'}`}>{STATUS_LABELS[s]}</button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-display font-bold text-white text-sm mb-4">Add Application</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company *" className="col-span-2 bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary" />
                <input required value={form.role} onChange={e => setForm({...form, role: e.target.value})} placeholder="Role *" className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary" />
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Location" className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-accent-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.track} onChange={e => setForm({...form, track: e.target.value})} className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none">
                  {Object.values(TRACK_DETAILS).map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
                </select>
                <select value={form.portal} onChange={e => setForm({...form, portal: e.target.value as ApplicationPortal})} className="bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none">
                  {PORTALS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                </select>
              </div>
              <input type="date" value={form.applied_date} onChange={e => setForm({...form, applied_date: e.target.value})} className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none" />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes (optional)" className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-gray-300 focus:outline-none" rows={2} />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-accent-primary text-white text-xs font-semibold rounded-xl hover:bg-orange-600 transition">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-brand-border text-gray-400 text-xs font-semibold rounded-xl hover:text-white transition">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {STATUS_ORDER.map(status => {
            const apps = columnApps(status);
            if (DONE_STATUSES.includes(status) && apps.length === 0) return null;
            return (
              <div key={status} className="w-72 bg-brand-surface/50 border border-brand-border rounded-2xl shrink-0">
                <div className="px-4 py-3 border-b border-brand-border/40 flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{STATUS_LABELS[status]}</h4>
                  <span className="text-[10px] text-gray-500 font-mono">{apps.length}</span>
                </div>
                <div className="p-3 space-y-2 min-h-[120px]">
                  {apps.length === 0 ? (
                    <p className="text-[10px] text-gray-500 text-center py-4">No applications</p>
                  ) : (
                    apps.map(app => (
                      <div key={app.id} className="bg-brand-bg border border-brand-border/60 rounded-xl p-3 space-y-1.5 cursor-pointer hover:border-accent-primary/30 transition" onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="text-xs font-bold text-white">{app.company}</h5>
                            <p className="text-[10px] text-gray-400">{app.role}</p>
                          </div>
                          <div className="flex gap-1">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono ${trackColors[app.track] || 'bg-brand-bg text-gray-400'}`}>
                              {TRACK_DETAILS[app.track as keyof typeof TRACK_DETAILS]?.logoText || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <Clock className="w-3 h-3" /> {getDaysSince(app.applied_date)}d
                          {app.ats_score && <><span className="w-1 h-1 rounded-full bg-gray-600" />Score: {app.ats_score}</>}
                        </div>
                        {expandedId === app.id && (
                          <div className="border-t border-brand-border/40 pt-2 mt-2 space-y-2">
                            {app.location && <p className="text-[10px] text-gray-400"><MapPin className="w-3 h-3 inline" /> {app.location}</p>}
                            {app.notes && <p className="text-[10px] text-gray-500">{app.notes}</p>}
                            <select value={app.status} onChange={e => handleStatusChange(app.id, e.target.value as ApplicationStatus)} className="w-full bg-brand-bg border border-brand-border rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none">
                              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                            </select>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPremium && stats && (
        <div className="bg-brand-surface p-5 rounded-2xl border border-indigo-500/20 space-y-4">
          <h3 className="font-display font-bold text-sm text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-indigo-400" /> Application Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Response Rate', value: `${stats.response_rate}%` },
              { label: 'Interview Rate', value: `${stats.interview_conversion}%` },
              { label: 'Offer Rate', value: `${stats.offer_rate}%` },
              { label: 'Total Apps', value: stats.total }
            ].map(m => (
              <div key={m.label} className="bg-brand-bg/50 border border-brand-border rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-white font-mono">{m.value}</p>
                <p className="text-[10px] text-gray-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
            <div className="bg-brand-bg/30 p-3 rounded-xl"><span className="text-gray-500">Top Portal:</span> <span className="text-white font-semibold capitalize">{stats.top_portal}</span></div>
            <div className="bg-brand-bg/30 p-3 rounded-xl"><span className="text-gray-500">Top Track:</span> <span className="text-white font-semibold capitalize">{stats.top_track}</span></div>
          </div>
        </div>
      )}

      {!isPremium && (
        <div className="bg-brand-surface p-5 rounded-2xl border border-brand-border/60 relative overflow-hidden">
          <div className="absolute inset-0 backdrop-blur-[2px] bg-brand-bg/40 flex items-center justify-center z-10">
            <div className="text-center">
              <Lock className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs text-gray-400 mb-2">Application analytics is Pro only.</p>
              <button onClick={onUpgradeTrigger} className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 transition">Upgrade to Pro</button>
            </div>
          </div>
          <div className="opacity-30 pointer-events-none">
            <h4 className="font-display font-bold text-sm text-white">Application Analytics</h4>
            <div className="grid grid-cols-4 gap-4 mt-4">
              {[1,2,3,4].map(i => <div key={i} className="bg-brand-bg rounded-xl p-4"><div className="h-8 w-16 bg-brand-border rounded" /></div>)}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
