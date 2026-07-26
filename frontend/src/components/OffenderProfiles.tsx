import React, { useEffect, useState } from 'react';
import api from '../services/api';

const OffenderProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/offender-profiles').then(res => {
      setProfiles(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4">Loading Profiles...</div>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Offender Profiling & Risk Assessment</h2>
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Risk Score</th>
              <th className="p-3 border">Habitual</th>
              <th className="p-3 border">AI Profile Summary</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 border">{p.name}</td>
                <td className={`p-3 border font-bold ${p.risk_score > 50 ? 'text-red-600' : 'text-green-600'}`}>
                  {p.risk_score}
                </td>
                <td className="p-3 border">{p.is_habitual ? 'Yes' : 'No'}</td>
                <td className="p-3 border text-sm italic">{p.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div}
    </div>
  );
};

export default OffenderProfiles;
