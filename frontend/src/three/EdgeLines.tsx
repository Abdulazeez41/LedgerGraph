import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SubgraphLink, SubgraphNode } from '@/api/types';

interface EdgeLinesProps {
  links: SubgraphLink[];
  nodeMap: Map<string, SubgraphNode>;
  activeEvidenceEdges: Array<{ source: string; target: string; type: string }>;
  isPathActive: boolean;
}

export const EdgeLines: React.FC<EdgeLinesProps> = ({
  links,
  nodeMap,
  activeEvidenceEdges,
  isPathActive,
}) => {
  const { linePositions, lineColors } = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    // Lookup set for active evidence edges
    const evidenceSet = new Set<string>();
    for (const e of activeEvidenceEdges) {
      evidenceSet.add(`${e.source}->${e.target}`);
      evidenceSet.add(`${e.target}->${e.source}`);
    }

    const colorDefault = new THREE.Color('#44514B');
    const colorDimmed = new THREE.Color('#1A2420');
    const colorEvidence = new THREE.Color('#DCAB4A'); // bright brass

    for (const link of links) {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source;
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target;

      const src = nodeMap.get(srcId);
      const tgt = nodeMap.get(tgtId);

      if (!src || !tgt) continue;

      const isEvidence = evidenceSet.has(`${srcId}->${tgtId}`);
      const linkColor = isEvidence ? colorEvidence : isPathActive ? colorDimmed : colorDefault;

      positions.push(src.x ?? 0, src.y ?? 0, src.z ?? 0);
      positions.push(tgt.x ?? 0, tgt.y ?? 0, tgt.z ?? 0);

      colors.push(linkColor.r, linkColor.g, linkColor.b);
      colors.push(linkColor.r, linkColor.g, linkColor.b);
    }

    return {
      linePositions: new Float32Array(positions),
      lineColors: new Float32Array(colors),
    };
  }, [links, nodeMap, activeEvidenceEdges, isPathActive]);

  if (linePositions.length === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={linePositions.length / 3}
          array={linePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={lineColors.length / 3}
          array={lineColors}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={isPathActive ? 0.75 : 0.45}
        linewidth={1}
      />
    </lineSegments>
  );
};
