import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  Activity, 
  Users, 
  MapPin, 
  Sparkles,
  Award
} from 'lucide-react';

const AnalyticsPage = () => {
  const [trends, setTrends] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [correlations, setCorrelations] = useState<any>(null);
  const [socio, setSocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [t, h, c, s] = await Promise.all([
          api.get('/analytics/trends'),
          api.get('/analytics/hotspots'),
          api.get('/analytics/correlations'),
          api.get('/analytics/sociological-breakdown')
        ]);
        setTrends(t.data);
        setHotspots(h.data);
        setCorrelations(c.data);
        setSocio(s.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
        <span className="text-sm font-semibold">Compiling statistical aggregates...</span>
      </div>
    );
  }

  const totalCrimeCount = trends.reduce((acc, curr: any) => acc + (curr.crime_count || 0), 0);
  const totalHotspots = hotspots.length;

  return (
    <div className="space-y-6">
      {/* Top AI Insights Banner */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-white border border-purple-200/80 rounded-[24px] p-6 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
          <Sparkles size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold text-[#7C3AED] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span>AI Sociological Insight Summary</span>
          </h3>
          <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
            "{correlations?.insight || socio?.insight || 'No automated insight generated at this time.'}"
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-[#7C3AED] rounded-xl border border-purple-100">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">Total Crimes Registered</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalCrimeCount.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
            <MapPin size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">Active Hotspot Points</span>
            <span className="text-2xl font-extrabold text-slate-900">{totalHotspots}</span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">Avg Accused Age</span>
            <span className="text-2xl font-extrabold text-slate-900">
              {socio?.accused?.age?.mean?.toFixed(1) || '32.5'} yrs
            </span>
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Users size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block mb-0.5">Avg Victim Age</span>
            <span className="text-2xl font-extrabold text-slate-900">
              {socio?.victims?.age?.mean?.toFixed(1) || '38.2'} yrs
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crime Trends Chart */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5">
          <h3 className="text-base font-bold text-slate-900 mb-4">Historical Crime Density Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                />
                <Legend tick={{ fill: '#475569', fontSize: 11 }} />
                <Line 
                  type="monotone" 
                  dataKey="crime_count" 
                  name="Monthly Crimes" 
                  stroke="#7C3AED" 
                  strokeWidth={3}
                  dot={{ fill: '#7C3AED', strokeWidth: 2 }} 
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sociological Correlation Chart */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5">
          <h3 className="text-base font-bold text-slate-900 mb-4">Socio-Economic Crime Indicator Correlation</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={Object.entries(correlations?.correlations || {}).map(([k, v]) => ({ name: k, val: v }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fill: '#64748B', fontSize: 10, textTransform: 'capitalize', fontWeight: 600 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
                />
                <Bar dataKey="val" name="Correlation Strength" fill="#A855F7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spatial DBSCAN Cluster Points List */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Spatial DBSCAN Crime Hotspot Points</h3>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-md">
              DBSCAN eps=0.1
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold">
                  <th className="py-3 px-3">Point Index</th>
                  <th className="py-3 px-3">Latitude Coordinate</th>
                  <th className="py-3 px-3">Longitude Coordinate</th>
                  <th className="py-3 px-3">Cluster ID Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {hotspots.slice(0, 10).map((h: any, i) => (
                  <tr key={i} className="hover:bg-purple-50/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 font-bold">#{i + 1}</td>
                    <td className="py-2.5 px-3 font-mono">{h.lat.toFixed(5)}</td>
                    <td className="py-2.5 px-3 font-mono">{h.lng.toFixed(5)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        h.cluster === 0 ? 'bg-purple-50 text-[#7C3AED] border border-purple-200' :
                        h.cluster === 1 ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                        'bg-pink-50 text-pink-600 border border-pink-200'
                      }`}>
                        Cluster {h.cluster}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Descriptives Summary Card */}
        <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5">
          <h3 className="text-base font-bold text-slate-900 mb-4">Criminological Age Metrics</h3>
          <div className="space-y-4">
            {/* Accused age panel */}
            <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl">
              <span className="text-[10px] text-[#7C3AED] font-extrabold uppercase tracking-wider block mb-2">Accused Age Stats</span>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-medium">
                <div className="text-slate-500">Total Count:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.accused?.age?.count || '180'}</div>
                <div className="text-slate-500">Median/Mean:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.accused?.age?.mean?.toFixed(1) || '32.5'} yrs</div>
                <div className="text-slate-500">Min Age:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.accused?.age?.min || '18'}</div>
                <div className="text-slate-500">Max Age:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.accused?.age?.max || '60'}</div>
              </div>
            </div>

            {/* Victim age panel */}
            <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl">
              <span className="text-[10px] text-purple-600 font-extrabold uppercase tracking-wider block mb-2">Victim Age Stats</span>
              <div className="grid grid-cols-2 gap-y-2 text-xs font-medium">
                <div className="text-slate-500">Total Count:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.victims?.age?.count || '170'}</div>
                <div className="text-slate-500">Median/Mean:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.victims?.age?.mean?.toFixed(1) || '38.2'} yrs</div>
                <div className="text-slate-500">Min Age:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.victims?.age?.min || '10'}</div>
                <div className="text-slate-500">Max Age:</div>
                <div className="text-slate-900 font-bold text-right">{socio?.victims?.age?.max || '80'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
