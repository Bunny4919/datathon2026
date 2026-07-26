import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Shield, ShieldAlert, Sparkles, User, UserCheck } from 'lucide-react';

interface Profile {
  id: number;
  name: string;
  risk_score: number;
  is_habitual: boolean;
  summary: string;
}

const ProfilesPage = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/offender-profiles')
      .then(res => {
        setProfiles(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
        <span className="text-sm font-semibold">Compiling offender profiles and risk metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Offender Profiling & Risk Assessment</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Criminological classification and AI-assisted behavioral profiles</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <ShieldAlert size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">High Risk Offenders</span>
            <span className="text-2xl font-extrabold text-slate-900">
              {profiles.filter(p => p.risk_score >= 70).length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-[#7C3AED] rounded-xl border border-purple-100">
            <UserCheck size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">Habitual Flagged</span>
            <span className="text-2xl font-extrabold text-slate-900">
              {profiles.filter(p => p.is_habitual).length}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Shield size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">Assessed Profiles</span>
            <span className="text-2xl font-extrabold text-slate-900">{profiles.length}</span>
          </div>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 shadow-xl shadow-purple-900/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5">
          <User className="text-[#7C3AED]" size={18} />
          <h3 className="text-sm font-bold text-slate-900">Identified Offender Registers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6 text-center">Risk Score</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6">AI Profile Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {profiles.map(p => (
                <tr key={p.id} className="hover:bg-purple-50/40 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{p.name}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.risk_score >= 70 ? 'bg-red-50 text-red-600 border border-red-200' :
                      p.risk_score >= 40 ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>
                      {p.risk_score}%
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {p.is_habitual ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-[#7C3AED] border border-purple-200">
                        Habitual
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                        First-time
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2 items-start max-w-xl">
                      <Sparkles size={14} className="text-[#7C3AED] mt-0.5 shrink-0" />
                      <p className="text-slate-700 italic leading-relaxed">"{p.summary}"</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfilesPage;
