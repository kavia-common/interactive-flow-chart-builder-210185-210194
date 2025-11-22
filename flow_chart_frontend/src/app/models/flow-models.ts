export type NodeType = 'action' | 'outcome';
export type PortPosition = 'left' | 'right' | 'top' | 'bottom';

export interface NodeModel {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgeModel {
  id: string;
  from: string;
  to: string;
  port: PortPosition;
}

export interface FlowSnapshot {
  nodes: NodeModel[];
  edges: EdgeModel[];
}

export interface ViewportState {
  x: number;
  y: number;
  k: number;
}
