import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../services/api';
import { Share2, Users, Info } from 'lucide-react';

const NetworkPage = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    const fetchGraphAndCommunities = async () => {
      try {
        const [gRes, cRes] = await Promise.all([
          api.get('/graph/network'),
          api.get('/graph/communities')
        ]);
        setGraphData(gRes.data);
        setCommunities(cRes.data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGraphAndCommunities();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)] text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
        <span className="text-sm font-semibold">Compiling criminal connection network...</span>
      </div>
    );
  }

  const getFilteredData = () => {
    if (activeFilter === 'ALL') return graphData;
    
    const filteredNodes = graphData.nodes.filter((node: any) => {
      if (node.label === 'FIR') return true;
      if (activeFilter === 'ACCUSED' && node.label === 'Accused') return true;
      if (activeFilter === 'VICTIM' && node.label === 'Victim') return true;
      if (activeFilter === 'TRANSACTION' && node.label === 'Transaction') return true;
      return false;
    });

    const nodeIds = new Set(filteredNodes.map((n: any) => n.id));
    const filteredLinks = graphData.links.filter(
      (link: any) => nodeIds.has(link.source.id || link.source) && nodeIds.has(link.target.id || link.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] relative">
      {/* 2D Force Graph Container */}
      <div className="flex-1 bg-white rounded-[24px] overflow-hidden relative border border-slate-200/80 shadow-xl shadow-purple-900/5">
        
        {/* Floating Legends */}
        <div className="absolute top-4 left-4 z-10 p-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl text-slate-800 text-xs max-w-[280px] shadow-lg shadow-purple-900/5">
          <h4 className="font-bold flex items-center gap-1.5 mb-2.5 text-slate-900">
            <Share2 size={14} className="text-[#7C3AED]" />
            <span>Interactive Relations Legend</span>
          </h4>
          <div className="space-y-2 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              <span className="text-slate-700">FIR (Crime Case Node)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-700">Accused (Suspect/Offender)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="text-slate-700">Victim (Complainant/Victim)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="text-slate-700">Flagged Transaction (Tx)</span>
            </div>
          </div>
          
          <div className="mt-3.5 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
            <p>💡 Scroll to Zoom. Click and drag nodes to pin. Zoom close to reveal labels.</p>
          </div>
        </div>

        {/* Filters Top Bar */}
        <div className="absolute top-4 right-4 z-10 flex gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm">
          {[
            { id: 'ALL', label: 'All Links' },
            { id: 'ACCUSED', label: 'Offenders Only' },
            { id: 'VICTIM', label: 'Victims Only' },
            { id: 'TRANSACTION', label: 'Transactions' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeFilter === f.id 
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white shadow-md shadow-purple-500/20' 
                  : 'text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* D3 Graph */}
        <div className="w-full h-full bg-slate-900">
          <ForceGraph2D
            graphData={getFilteredData()}
            nodeLabel={(node: any) => 
              `${node.label}: ${node.properties.name || node.properties.fir_number}`
            }
            nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
              const label = node.label;
              const color = label === 'Accused' ? '#10b981' : 
                            label === 'Victim' ? '#ef4444' : 
                            label === 'FIR' ? '#3b82f6' : '#f59e0b';
              const radius = label === 'FIR' ? 6 : 4.5;
              
              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.shadowColor = color;
              ctx.shadowBlur = 6;
              ctx.fill();
              ctx.shadowBlur = 0;
              
              ctx.lineWidth = 1;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();

              if (globalScale > 2.0) {
                const name = node.properties.name || node.properties.fir_number || 'Node';
                ctx.font = `${8 / globalScale}px sans-serif`;
                ctx.fillStyle = '#cbd5e1';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(name, node.x, node.y + radius + 2.5);
              }
            }}
            linkWidth={1.5}
            linkColor={() => 'rgba(255, 255, 255, 0.15)'}
            linkDirectionalArrowLength={3.5}
            linkDirectionalArrowColor={() => 'rgba(255, 255, 255, 0.3)'}
            linkDirectionalArrowRelPos={1}
          />
        </div>
      </div>

      {/* Gang Community Sidebar Panel */}
      <div className="w-80 bg-white rounded-[24px] border border-slate-200/80 shadow-xl shadow-purple-900/5 flex flex-col h-full overflow-hidden shrink-0">
        <div className="p-4 px-5 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/70">
          <Users size={17} className="text-[#7C3AED]" />
          <h3 className="text-sm font-bold text-slate-900">Detected Organized Gangs</h3>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl text-xs text-slate-600 font-medium flex items-start gap-2.5">
            <Info size={16} className="text-[#7C3AED] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              These gang clusters identify co-offenders linked across shared case files, highlighting criminal networks.
            </p>
          </div>

          <div className="space-y-3">
            {communities.map((g: any) => (
              <div 
                key={g.id} 
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl hover:border-purple-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                  <h4 className="text-xs font-bold text-slate-900 leading-tight truncate">{g.name}</h4>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {g.members.map((member: string, idx: number) => (
                    <span 
                      key={idx} 
                      className="px-2 py-1 bg-white border border-slate-200 text-[10px] text-slate-700 rounded-lg font-bold shadow-2xs"
                    >
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;
