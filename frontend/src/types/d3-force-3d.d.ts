declare module 'd3-force-3d' {
  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    z?: number;
    vx?: number;
    vy?: number;
    vz?: number;
    fx?: number | null;
    fy?: number | null;
    fz?: number | null;
    [key: string]: any;
  }

  export interface SimulationLinkDatum<NodeDatum extends SimulationNodeDatum> {
    source: NodeDatum | string | number;
    target: NodeDatum | string | number;
    index?: number;
    [key: string]: any;
  }

  export interface Force<NodeDatum extends SimulationNodeDatum> {
    (alpha: number): void;
    initialize?(nodes: NodeDatum[], ...args: any[]): void;
    [key: string]: any;
  }

  export interface Simulation<NodeDatum extends SimulationNodeDatum> {
    restart(): Simulation<NodeDatum>;
    stop(): Simulation<NodeDatum>;
    tick(iterations?: number): Simulation<NodeDatum>;
    nodes(): NodeDatum[];
    nodes(nodes: NodeDatum[]): Simulation<NodeDatum>;
    alpha(): number;
    alpha(alpha: number): Simulation<NodeDatum>;
    alphaMin(): number;
    alphaMin(min: number): Simulation<NodeDatum>;
    alphaDecay(): number;
    alphaDecay(decay: number): Simulation<NodeDatum>;
    alphaTarget(): number;
    alphaTarget(target: number): Simulation<NodeDatum>;
    velocityDecay(): number;
    velocityDecay(decay: number): Simulation<NodeDatum>;
    force(name: string): Force<NodeDatum> | undefined;
    force(name: string, force: Force<NodeDatum> | null): Simulation<NodeDatum>;
    numDimensions(): number;
    numDimensions(n: number): Simulation<NodeDatum>;
    on(typenames: string, listener: () => void): Simulation<NodeDatum>;
  }

  export function forceSimulation<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(
    nodes?: NodeDatum[],
    numDimensions?: number
  ): Simulation<NodeDatum>;

  export function forceLink<
    NodeDatum extends SimulationNodeDatum = SimulationNodeDatum,
    LinkDatum extends SimulationLinkDatum<NodeDatum> = SimulationLinkDatum<NodeDatum>
  >(links?: LinkDatum[]): any;

  export function forceManyBody<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(): any;
  export function forceCenter<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(
    x?: number,
    y?: number,
    z?: number
  ): any;
  export function forceCollide<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(radius?: number | ((node: NodeDatum) => number)): any;
}
