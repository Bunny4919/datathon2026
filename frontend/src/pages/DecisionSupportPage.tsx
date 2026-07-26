import React, { useState } from 'react';
import api from '../services/api';
import { Search, FileText, Clock, Lightbulb, ChevronRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

type Tab = 'summary' | 'timeline' | 'leads';

const DecisionSupportPage = () => {
  const [firId, setFirId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [leads, setLeads] = useState<any>(null);

  const handleSearch = async () => {
    const id = parseInt(firId);
    if (!id || isNaN(id)) {
      setError('Enter a valid numeric FIR ID');
      return;
    }
    setError('');
    setLoading(true);
    setSummary(null);
    setTimeline(null);
    setLeads(null);
    try {
      const [s, t, l] = await Promise.all([
        api.get(`/decision-support/case-summary/${id}`),
        api.get(`/decision-support/case-timeline/${id}`),
        api.get(`/decision-support/leads/${id}`)
      ]);
      setSummary(s.data);
      setTimeline(t.data);
      setLeads(l.data);
      setActiveTab('summary');
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'FIR case record not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Decision Support Intelligence</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">AI-generated case summaries, event timelines, and investigative leads</p>
      </div>

      <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-extrabold block mb-3">Enter FIR ID to Analyse</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              placeholder="e.g. 1"
              value={firId}
              onChange={e => setFirId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:border-[#7C3AED] focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
            Analyse
          </button>
        </div>
        {error && <div className="flex items-center gap-2 mt-3 text-red-600 text-xs font-semibold"><AlertCircle size={14} /> {error}</div>}
      </div>

      {(summary || timeline || leads) && (
        <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-xl shadow-purple-900/5 overflow-hidden">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-extrabold">Case Reference</span>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">FIR #{summary?.fir_number || firId}</h2>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#7C3AED]" />
              <span className="text-xs text-[#7C3AED] font-bold">AI Analysis Complete</span>
            </div>
          </div>

          <div className="flex border-b border-slate-100 bg-slate-50/30">
            {[
              { key: 'summary', label: 'Case Summary', icon: <FileText size={15} /> },
              { key: 'timeline', label: 'Timeline', icon: <Clock size={15} /> },
              { key: 'leads', label: 'Investigative Leads', icon: <Lightbulb size={15} /> }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
                className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === tab.key ? 'border-[#7C3AED] text-[#7C3AED] bg-white' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'summary' && summary && (
              <div className="space-y-4">
                <div className="p-5 bg-purple-50/70 border border-purple-100 rounded-2xl">
                  <span className="text-[10px] text-[#7C3AED] font-extrabold uppercase tracking-wider block mb-2 font-mono">Executive Summary</span>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line">{summary.summary}</p>
                </div>
                {summary.sources && (
                  <div className="flex gap-2">
                    {summary.sources.map((s: string, i: number) => (
                      <span key={i} className="text-[10px] px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-mono font-bold border border-slate-200">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timeline' && timeline && (
              <div className="relative pl-6 border-l-2 border-purple-200 my-2">
                <div className="space-y-5">
                  {(timeline.events || []).map((ev: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[31px] mt-1.5 w-3 h-3 rounded-full bg-[#7C3AED] border-2 border-white shadow-sm" />
                      <span className="text-[10px] text-[#7C3AED] font-extrabold font-mono block">{ev.date}</span>
                      <p className="text-sm text-slate-800 font-medium mt-0.5">{ev.event}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'leads' && leads && (
              <div className="space-y-3">
                <div className="p-5 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                  <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider block mb-2 font-mono">Recommended Investigative Leads</span>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-line">{leads.leads}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!summary && !loading && !error && (
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-12 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
          <div className="p-4 bg-purple-50 rounded-2xl text-[#7C3AED] border border-purple-100"><Search size={28} /></div>
          <div>
            <p className="text-base font-bold text-slate-900">Enter a FIR ID to begin</p>
            <p className="text-xs text-slate-500 font-medium mt-1">The system will generate an AI summary, timeline, and intelligence leads</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionSupportPage;
