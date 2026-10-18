import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force-3d';
import { SubgraphNode, SubgraphLink } from '@/api/types';
import { NodeMesh } from './NodeMesh';
import { EdgeLines } from './EdgeLines';
import { useStore } from '@/store/useStore';

interface Graph3DProps {
  subgraph: { nodes: SubgraphNode[]; links: SubgraphLink[] } | null;
}

export const Graph3D: React.FC<Graph3DProps> = ({ subgraph }) => {
  const {
    activeEvidenceNodes,
    activeEvidenceEdges,
    focusedNodeId,
    selectedCustomerName,
    viewMode,
    cameraCommand,
    clearCameraCommand,
    setViewMode,
    selectCustomer,
    setFocusedNode,
  } = useStore();

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const [nodes, setNodes] = useState<SubgraphNode[]>([]);
  const [links, setLinks] = useState<SubgraphLink[]>([]);
  const simRef = useRef<any>(null);

  // Programmatic camera transition refs
  const targetPosRef = useRef<THREE.Vector3 | null>(null);
  const targetLookRef = useRef<THREE.Vector3 | null>(null);
  const isTransitioningRef = useRef<boolean>(false);

  // Initialize or update force-directed 3D simulation
  useEffect(() => {
    if (!subgraph || !subgraph.nodes || subgraph.nodes.length === 0) {
      setNodes([]);
      setLinks([]);
      return;
    }

    // Clone data to avoid mutating store state
    const simNodes: SubgraphNode[] = subgraph.nodes.map((n) => ({
      ...n,
      x: n.x ?? (Math.random() - 0.5) * 40,
      y: n.y ?? (Math.random() - 0.5) * 40,
      z: n.z ?? (Math.random() - 0.5) * 40,
    }));

    const nodeById = new Map<string, SubgraphNode>();
    simNodes.forEach((n) => nodeById.set(n.id, n));

    const simLinks = subgraph.links
      .map((l) => ({
        ...l,
        source: typeof l.source === 'object' ? l.source.id : l.source,
        target: typeof l.target === 'object' ? l.target.id : l.target,
      }))
      .filter((l) => nodeById.has(l.source as string) && nodeById.has(l.target as string));

    if (simRef.current) simRef.current.stop();

    const simulation = forceSimulation(simNodes, 3)
      .force(
        'link',
        forceLink(simLinks)
          .id((d: any) => d.id)
          .distance(12)
          .strength(0.6)
      )
      .force('charge', forceManyBody().strength(-80).distanceMax(120))
      .force('center', forceCenter(0, 0, 0))
      .force('collide', forceCollide(2.2))
      .alphaDecay(0.025);

    simulation.on('tick', () => {
      setNodes([...simNodes]);
    });

    simRef.current = simulation;
    setLinks(simLinks);

    return () => {
      simulation.stop();
    };
  }, [subgraph]);

  // Lookup map for fast edge rendering
  const nodeMap = useMemo(() => {
    const map = new Map<string, SubgraphNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const isPathActive = activeEvidenceNodes.length > 0;
  const evidenceNodeSet = useMemo(() => new Set(activeEvidenceNodes), [activeEvidenceNodes]);

  // Listen for user orbit/scroll interactions to stop programmatic flight immediately
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onStart = () => {
      isTransitioningRef.current = false;
    };

    controls.addEventListener('start', onStart);
    return () => {
      controls.removeEventListener('start', onStart);
    };
  }, [controlsRef.current]);

  // When focusedNodeId changes, initiate a smooth glide transition
  useEffect(() => {
    if (!focusedNodeId || nodes.length === 0) return;
    const target = nodes.find(
      (n) => n.id === focusedNodeId || n.name === focusedNodeId || n.name === selectedCustomerName
    );
    if (target && target.x !== undefined && target.y !== undefined && target.z !== undefined) {
      targetPosRef.current = new THREE.Vector3(target.x, target.y + 10, target.z + 28);
      targetLookRef.current = new THREE.Vector3(target.x, target.y, target.z);
      isTransitioningRef.current = true;
    }
  }, [focusedNodeId, nodes, selectedCustomerName]);

  // Handle camera commands (Holistic, Focus, Zoom In, Zoom Out)
  useEffect(() => {
    if (!cameraCommand) return;

    if (cameraCommand === 'holistic') {
      targetPosRef.current = new THREE.Vector3(0, 36, 110);
      targetLookRef.current = new THREE.Vector3(0, 0, 0);
      isTransitioningRef.current = true;
      setViewMode('holistic');
      clearCameraCommand();
    } else if (cameraCommand === 'focus') {
      const target = nodes.find(
        (n) =>
          n.id === focusedNodeId ||
          n.name === focusedNodeId ||
          n.name === selectedCustomerName ||
          n.label === 'Customer'
      );
      if (target && target.x !== undefined && target.y !== undefined && target.z !== undefined) {
        targetPosRef.current = new THREE.Vector3(target.x, target.y + 10, target.z + 28);
        targetLookRef.current = new THREE.Vector3(target.x, target.y, target.z);
        isTransitioningRef.current = true;
        setViewMode('focused');
      }
      clearCameraCommand();
    } else if (cameraCommand === 'zoom_in') {
      if (controlsRef.current) {
        const target = controlsRef.current.target as THREE.Vector3;
        const dir = camera.position.clone().sub(target).multiplyScalar(0.72);
        targetPosRef.current = target.clone().add(dir);
        targetLookRef.current = target.clone();
        isTransitioningRef.current = true;
      }
      clearCameraCommand();
    } else if (cameraCommand === 'zoom_out') {
      if (controlsRef.current) {
        const target = controlsRef.current.target as THREE.Vector3;
        const dir = camera.position.clone().sub(target).multiplyScalar(1.38);
        targetPosRef.current = target.clone().add(dir);
        targetLookRef.current = target.clone();
        isTransitioningRef.current = true;
      }
      clearCameraCommand();
    }
  }, [cameraCommand, nodes, focusedNodeId, selectedCustomerName, camera, clearCameraCommand, setViewMode]);

  // Smooth frame loop: interpolate camera position and orbit target without fighting user control
  useFrame(() => {
    if (isTransitioningRef.current && targetPosRef.current && targetLookRef.current) {
      camera.position.lerp(targetPosRef.current, 0.08);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookRef.current, 0.08);
        controlsRef.current.update();
      }

      // Check arrival threshold
      if (camera.position.distanceTo(targetPosRef.current) < 0.35) {
        isTransitioningRef.current = false;
      }
    } else if (controlsRef.current) {
      // Sync viewMode badge with user's manual scroll distance
      const dist = camera.position.distanceTo(controlsRef.current.target);
      if (dist > 75 && viewMode !== 'holistic') {
        setViewMode('holistic');
      } else if (dist <= 75 && viewMode !== 'focused') {
        setViewMode('focused');
      }
    }
  });

  return (
    <group>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.7}
        zoomSpeed={0.9}
        minDistance={3}
        maxDistance={280}
      />

      <EdgeLines
        links={links}
        nodeMap={nodeMap}
        activeEvidenceEdges={activeEvidenceEdges}
        isPathActive={isPathActive}
      />

      {nodes.map((node) => {
        const isEvidence = evidenceNodeSet.has(node.id) || evidenceNodeSet.has(node.name);
        const isFocused =
          focusedNodeId === node.id ||
          focusedNodeId === node.name ||
          (selectedCustomerName && (selectedCustomerName === node.name || selectedCustomerName === node.id));
        const isDimmed = isPathActive && !isEvidence;

        return (
          <NodeMesh
            key={node.id}
            node={node}
            isEvidence={isEvidence}
            isFocused={Boolean(isFocused)}
            isDimmed={isDimmed}
            onClick={() => {
              setFocusedNode(node.id);
              if (node.label === 'Customer' && node.name) {
                selectCustomer(node.name, true);
              }
            }}
          />
        );
      })}
    </group>
  );
};
