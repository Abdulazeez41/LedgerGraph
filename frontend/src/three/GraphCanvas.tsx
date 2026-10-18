import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Graph3D } from './Graph3D';
import { Fallback2D } from './Fallback2D';
import { useStore } from '@/store/useStore';

export const GraphCanvas: React.FC = () => {
  const { subgraph } = useStore();
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
      }
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  if (!webGlSupported) {
    return <Fallback2D subgraph={subgraph} />;
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-stage select-none">
      <Canvas
        camera={{ position: [0, 15, 45], fov: 50, near: 0.1, far: 1000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            console.warn('WebGL context lost, switching to 2D SVG fallback.');
            setWebGlSupported(false);
          });
        }}
      >
        <color attach="background" args={['#0B1210']} />

        {/* Lighting suited to the dark stage */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[20, 40, 20]} intensity={1.2} />
        <pointLight position={[-20, -20, -20]} intensity={0.4} color="#1E7F55" />

        <Suspense fallback={null}>
          <Graph3D subgraph={subgraph} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GraphCanvas;
