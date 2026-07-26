import React, { useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import api from '../services/api';

const NetworkGraph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const response = await api.get('/graph/network');
        setGraphData(response.data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  if (loading) return <div className="p-4">Loading Graph...</div>;

  return (
    <div className="h-screen w-full bg-slate-900">
      <div className="absolute top-4 left-4 z-10 p-4 bg-white rounded shadow text-black">
        <h3 className="font-bold">Criminal Network Analysis</h3>
        <p className="text-xs">Blue: FIR, Green: Accused, Red: Victim, Yellow: Location</p>
      </div>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="properties.name || properties.fir_number || properties.station"
        nodeAutoColorBy="label"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label;
          const color = node.label === 'Accused' ? '#4caf50' :
                        node.label === 'Victim' ? '#f44336' :
                        node.label === 'FIR' ? '#2196f3' : '#ffeb3b';

          ctx.beginPath();
          ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowColor="gray"
      />
    </div>
  );
};

export default NetworkGraph;
