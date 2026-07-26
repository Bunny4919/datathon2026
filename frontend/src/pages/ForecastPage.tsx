import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';

const KARNATAKA_DISTRICTS = [
  'Bengaluru Urban', 'Mysuru', 'Belagavi', 'Dakshina Kannada',
  'Ballari', 'Dharwad', 'Kalaburagi', 'Shivamogga', 'Tumakuru', 'Hassan'
];

const ForecastPage = () => {
  const [selectedDistrict, setSelectedDistrict] = useState('Bengaluru Urban');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchForecast = async (district: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/forecast/district/${encodeURIComponent(district)}`);
      setData(res.data);
    } catch (e: any) {
      setError('Failed to load forecast data. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast(selectedDistrict);
  }, [selectedDistrict]);

  const chartData = React.useMemo(() => {
    if (!data) return [];
    const hist = (data.historical || []).map((v: number, i: number) => ({
      index: `M-${i + 1}`,
      historical: parseFloat(v.toFixed(1)),
      forecast: null
    }));
    const forecast = (data.forecast || []).map((v: number, i: number) => ({
      index: `F+${i + 1}`,
      historical: null,
      forecast: parseFloat(v.toFixed(1))
    }));
    if (hist.length > 0 && forecast.length > 0) {
      forecast[0] = { ...forecast[0], historical: hist[hist.length - 1].historical };
    }
    return [...hist, ...forecast];
  }, [data]);

  const maxForecast = data?.forecast ? Math.max(...data.forecast) : 0;
  const minForecast = data?.forecast ? Math.min(...data.forecast) : 0;
  const trend = data?.forecast && data.forecast.length > 1
    ? data.forecast[data.forecast.length - 1] > data.forecast[0] ? 'rising' : 'falling'
    : 'stable';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Predictive Crime Forecast</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">ARIMA time-series model — 6-month ahead prediction per district</p>
        </div>
        <button
          onClick={() => fetchForecast(selectedDistrict)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#7C3AED] hover:border-purple-200 shadow-xs transition-all cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#7C3AED]' : ''} />
          Refresh
        </button>
      </div>

      {/* District Selector */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 shadow-sm">
        <label className="text-xs text-slate-400 uppercase tracking-wider font-extrabold block mb-3">
          Select District
        </label>
        <div className="flex flex-wrap gap-2">
          {KARNATAKA_DISTRICTS.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDistrict(d)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDistrict === d
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-50 border border-slate-200/70 text-slate-600 hover:bg-purple-50 hover:text-[#7C3AED]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {data && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-xl ${trend === 'rising' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              <TrendingUp size={22} className={trend === 'rising' ? '' : 'rotate-180'} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-0.5">6-Month Trend</span>
              <span className={`text-lg font-extrabold capitalize ${trend === 'rising' ? 'text-red-600' : 'text-emerald-600'}`}>
                {trend}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-[#7C3AED] rounded-xl border border-purple-100">
              <AlertTriangle size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-0.5">Peak Forecast Month</span>
              <span className="text-lg font-extrabold text-slate-900">{maxForecast.toFixed(0)} incidents</span>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <MapPin size={22} />
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block mb-0.5">Lowest Forecast</span>
              <span className="text-lg font-extrabold text-slate-900">{minForecast.toFixed(0)} incidents</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-xl shadow-purple-900/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">{selectedDistrict} — Crime Forecast</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Historical baseline + 6-month ARIMA prediction</p>
          </div>
          {data?.note && (
            <span className="text-[10px] px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold">
              ⚠ Fallback estimate
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-72 gap-3 text-slate-400">
            <div className="w-6 h-6 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
            <span className="text-sm font-semibold">Running ARIMA model...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-72 text-red-500 text-sm font-semibold">{error}</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="index" tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ color: '#0F172A', fontWeight: 'bold', fontSize: 12 }}
                  itemStyle={{ fontSize: 11 }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine
                  x={`M-${data?.historical?.length}`}
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                  label={{ value: 'Today', fill: '#64748B', fontSize: 10, fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="historical"
                  name="Historical"
                  stroke="#7C3AED"
                  strokeWidth={3}
                  dot={{ fill: '#7C3AED', r: 3 }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast (ARIMA)"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  strokeDasharray="6 3"
                  dot={{ fill: '#F59E0B', r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Model Info */}
      <div className="bg-white rounded-[24px] border border-slate-200/80 p-5 shadow-sm">
        <h4 className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider mb-3">Model Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
          {[
            { label: 'Model', value: 'ARIMA(3,1,0)' },
            { label: 'Horizon', value: '6 months' },
            { label: 'Data Source', value: 'historical_crime_stats' },
            { label: 'Fallback', value: 'Moving trend estimate' }
          ].map(item => (
            <div key={item.label} className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl">
              <span className="text-slate-500 block">{item.label}</span>
              <span className="text-slate-900 font-bold mt-0.5 block">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForecastPage;
