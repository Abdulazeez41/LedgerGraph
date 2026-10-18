import React from 'react';
import { SubgraphNode, SubgraphLink } from '@/api/types';
import { useStore } from '@/store/useStore';

interface Fallback2DProps {
  subgraph: { nodes: SubgraphNode[]; links: SubgraphLink[] } | null;
}

export const Fallback2D: React.FC<Fallback2DProps> = ({ subgraph }) => {
  const { selectCustomer, setFocusedNode, activeEvidenceNodes } = useStore();

  if (!subgraph || !subgraph.nodes || subgraph.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-muted">
        No graph topology loaded. Select an account from the ledger rail.
      </div>
    );
  }

  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;

  // Simple radial positioning for 2D fallback
  const nodes = subgraph.nodes.map((node, i) => {
    const angle = (i / subgraph.nodes.length) * 2 * Math.PI;
    const radius = node.label === 'Customer' ? 0 : 160 + (i % 3) * 40;
    return {
      ...node,
      px: centerX + Math.cos(angle) * radius,
      py: centerY + Math.sin(angle) * radius,
    };
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const evidenceSet = new Set(activeEvidenceNodes);

  return (
    <div className="w-full h-full flex items-center justify-center bg-stage overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-4xl max-h-[80vh]">
        {/* Links */}
        {subgraph.links.map((link, idx) => {
          const srcId = typeof link.source === 'object' ? link.source.id : link.source;
          const tgtId = typeof link.target === 'object' ? link.target.id : link.target;
          const src = nodeMap.get(srcId);
          const tgt = nodeMap.get(tgtId);
          if (!src || !tgt) return null;

          return (
            <line
              key={idx}
              x1={src.px}
              y1={src.py}
              x2={tgt.px}
              y2={tgt.py}
              stroke="rgba(138, 152, 144, 0.25)"
              strokeWidth={1}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isEvidence = evidenceSet.has(node.id) || evidenceSet.has(node.name);
          const isCustomer = node.label === 'Customer';
          const fill = isCustomer ? '#1E7F55' : isEvidence ? '#DCAB4A' : '#8A9890';

          return (
            <g
              key={node.id}
              className="cursor-pointer group"
              onClick={() => {
                setFocusedNode(node.id);
                if (isCustomer && node.name) selectCustomer(node.name, true);
              }}
            >
              <circle
                cx={node.px}
                cy={node.py}
                r={isCustomer ? 14 : isEvidence ? 9 : 6}
                fill={fill}
                stroke={isEvidence ? '#F4F0E6' : 'rgba(244, 240, 230, 0.4)'}
                strokeWidth={isEvidence ? 2 : 1}
                className="transition-transform group-hover:scale-125"
              />
              <text
                x={node.px}
                y={node.py + (isCustomer ? 22 : 16)}
                textAnchor="middle"
                className="text-[10px] font-mono fill-chalk select-none pointer-events-none"
              >
                {node.name || node.properties?.invoice_number || node.id}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
