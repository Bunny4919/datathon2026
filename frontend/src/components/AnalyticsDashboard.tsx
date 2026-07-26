import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const AnalyticsDashboard = () => {
  const [trends, setTrends] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [correlations, setCorrelations] = useState(null);
  const [socio, setSocio] = useState(null);
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

  if (loading) return <div className="p-4">Loading Analytics...</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen space-y-8">
      <h2 className="text-2xl font-bold">Crime Analytics Dashboard</h2>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Crime Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="crime_count" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Sociological Insights</h3>
          <p className="text-sm italic text-gray-600">{socio?.insight}</p>
          <div className="mt-4 overflow-auto">
            <pre className="text-xs">{JSON.stringify(socio?.accused, null, 2)}</pre>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Correlation Analysis</h3>
          <p className="text-sm italic text-gray-600">{correlations?.insight}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(correlations?.correlations || {}).map(([k, v]) => ({ name: k, val: v }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="val" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Hotspot Clusters (DBSCAN)</h3>
          <div className="text-sm">
            Found {hotspots.length} cluster points.
            <ul className="max-h-40 overflow-y-auto">
              {hotspots.map((h, i) => (
                <li key={i} className="text-xs border-b py-1">
                  Lat: {h.lat}, Lng: {h.lng}, Cluster: {h.cluster}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
