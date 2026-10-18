import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { SubgraphNode } from '@/api/types';
import { formatMoney } from '@/lib/format';

interface NodeMeshProps {
  node: SubgraphNode;
  isEvidence: boolean;
  isFocused: boolean;
  isDimmed: boolean;
  onClick: () => void;
}

export const NodeMesh: React.FC<NodeMeshProps> = ({
  node,
  isEvidence,
  isFocused,
  isDimmed,
  onClick,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle float / rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      if (node.label === 'Customer') {
        meshRef.current.rotation.y += delta * 0.4;
      } else if (node.label === 'Payment') {
        meshRef.current.rotation.x += delta * 0.5;
      } else if (node.label === 'Dispute') {
        meshRef.current.rotation.z += delta * 0.6;
      }
    }
  });

  // Calculate base color based on type and properties
  const color = React.useMemo(() => {
    if (isEvidence) return '#F4F0E6'; // bright highlight for reasoning path

    switch (node.label) {
      case 'Customer': {
        const risk = node.properties?.risk_score ?? 50;
        if (risk <= 35) return '#1E7F55'; // Naira green
        if (risk <= 65) return '#C69234'; // Brass
        return '#C2412D'; // Vermilion
      }
      case 'Invoice': {
        const status = node.properties?.status;
        if (status === 'OVERDUE') return '#C2412D';
        if (status === 'PAID') return '#1E7F55';
        return '#C69234';
      }
      case 'Payment':
        return '#2DA36F';
      case 'Dispute':
        return '#DC5540';
      case 'Order':
        return '#8A9890';
      case 'Supplier':
        return '#C69234';
      default:
        return '#8A9890';
    }
  }, [node, isEvidence]);

  const scale = isEvidence ? 1.4 : isFocused ? 1.3 : hovered ? 1.25 : 1.0;
  const opacity = isDimmed ? 0.2 : 1.0;

  // Geometry selector based on label silhouette
  const renderGeometry = () => {
    switch (node.label) {
      case 'Customer':
        return <octahedronGeometry args={[1.3, 0]} />;
      case 'Order':
        return <cylinderGeometry args={[0.9, 0.9, 1.4, 6]} />;
      case 'Invoice':
        return <boxGeometry args={[1.4, 1.4, 1.4]} />;
      case 'Payment':
        return <torusGeometry args={[0.9, 0.35, 12, 24]} />;
      case 'Dispute':
        return <tetrahedronGeometry args={[1.3, 0]} />;
      case 'Supplier':
        return <sphereGeometry args={[1.1, 16, 16]} />;
      default:
        return <sphereGeometry args={[0.8, 12, 12]} />;
    }
  };

  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const z = node.z ?? 0;

  return (
    <group position={[x, y, z]}>
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.6}
          transparent
          opacity={opacity}
          emissive={isEvidence ? '#DCAB4A' : hovered ? color : '#000000'}
          emissiveIntensity={isEvidence ? 0.8 : hovered ? 0.4 : 0.0}
        />
      </mesh>

      {/* Luminous Vertical Beacon Pillar & Ground Rings for Prompted Node */}
      {isFocused && (
        <group>
          {/* Vertical light beam cylinder */}
          <mesh position={[0, 12, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 24, 12]} />
            <meshBasicMaterial color="#DCAB4A" transparent opacity={0.65} />
          </mesh>
          {/* Beacon pinnacle orb */}
          <mesh position={[0, 24, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
              color="#F4F0E6"
              emissive="#DCAB4A"
              emissiveIntensity={1.6}
            />
          </mesh>
          {/* Concentric ground rings */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[2.0, 2.3, 32]} />
            <meshBasicMaterial color="#DCAB4A" side={THREE.DoubleSide} transparent opacity={0.5} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
            <ringGeometry args={[3.2, 3.5, 32]} />
            <meshBasicMaterial color="#1E7F55" side={THREE.DoubleSide} transparent opacity={0.35} />
          </mesh>
        </group>
      )}

      {/* Evidence Pulsing Wireframe Ring */}
      {isEvidence && !isFocused && (
        <mesh scale={1.8}>
          <ringGeometry args={[1.4, 1.55, 32]} />
          <meshBasicMaterial color="#DCAB4A" side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
      )}

      {/* High-Altitude Spatial Beacon Pin for Prompted Entity (Visible even in Holistic View) */}
      {isFocused && (
        <Html distanceFactor={45} center position={[0, 5.5, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="cursor-pointer group flex flex-col items-center select-none pointer-events-auto"
            title="Prompted Entity • Click to inspect"
          >
            <div className="bg-[#0B1210]/95 backdrop-blur-md px-3 py-2 rounded-xl border border-brass shadow-[0_0_25px_rgba(198,146,52,0.45)] text-center text-chalk min-w-[210px] transform group-hover:scale-105 transition-all">
              <div className="flex items-center justify-center space-x-1.5 text-[9px] font-mono uppercase tracking-widest text-brass font-bold pb-1 border-b border-white/10">
                <span className="w-2 h-2 rounded-full bg-brass animate-ping" />
                <span>PROMPTED ENTITY</span>
              </div>
              <div className="font-serif font-bold text-sm text-chalk mt-1 truncate max-w-[240px]">
                {node.name}
              </div>
              <div className="font-mono text-[10px] text-brass-light flex items-center justify-center space-x-1.5 mt-0.5">
                <span className="bg-brass-dim px-1.5 py-0.5 rounded border border-brass/30 font-semibold">{node.id}</span>
                <span>•</span>
                <span className="text-chalk/80">{node.properties?.business_type || 'Commercial SME'}</span>
              </div>
              <div className="mt-1 pt-1 border-t border-white/10 flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted">Risk: <strong className="text-naira-green">{node.properties?.risk_score ?? '—'}</strong></span>
                <span className="text-muted">Limit: <strong className="text-chalk">{formatMoney(node.properties?.credit_limit, true)}</strong></span>
              </div>
            </div>
            {/* Pointer arrow pointing to node */}
            <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-brass drop-shadow-md" />
          </div>
        </Html>
      )}

      {/* Lightweight HTML Tooltip on Hover or Evidence for non-focused nodes */}
      {(hovered || isEvidence) && !isFocused && (
        <Html distanceFactor={24} center position={[0, 2.2, 0]}>
          <div className="pointer-events-none px-2.5 py-1.5 rounded-lg glass-panel text-[11px] font-mono whitespace-nowrap shadow-lg border border-white/20 select-none">
            <div className="font-semibold text-chalk flex items-center space-x-1.5">
              <span className="text-[9px] uppercase tracking-wider text-brass font-bold">
                {node.label}:
              </span>
              <span>{node.name || node.properties?.invoice_number || node.id}</span>
            </div>
            {node.label === 'Customer' && (
              <div className="mt-1 space-y-0.5 text-[10px] text-muted">
                <div className="flex items-center space-x-1.5">
                  <span className="text-brass font-bold">ID: {node.id || node.properties?.id || '—'}</span>
                  <span>•</span>
                  <span className="truncate max-w-[160px]">{node.properties?.business_type || 'SME'}</span>
                </div>
                <div className="flex space-x-2">
                  <span>Risk: {node.properties?.risk_score ?? '—'}</span>
                  <span>Limit: {formatMoney(node.properties?.credit_limit, true)}</span>
                </div>
              </div>
            )}
            {node.label === 'Invoice' && (
              <div className="text-[10px] text-muted flex space-x-2 mt-0.5">
                <span>{node.properties?.status}</span>
                <span>{formatMoney(node.properties?.amount, true)}</span>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
