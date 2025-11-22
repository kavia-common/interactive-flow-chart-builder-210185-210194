import { EdgeModel, NodeModel, PortPosition } from '../models/flow-models';

let idCounter = 1;
// PUBLIC_INTERFACE
export function uniqueId(prefix = 'id'): string {
  /** Generate unique IDs for nodes/edges. */
  return `${prefix}_${idCounter++}`;
}

export function rectsOverlap(a: NodeModel, b: NodeModel): boolean {
  return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y);
}

export function avoidOverlap(node: NodeModel, nodes: NodeModel[]) {
  // Simple nudge algorithm to avoid exact overlap
  for (const other of nodes) {
    if (other.id !== node.id && rectsOverlap(node, other)) {
      node.x = other.x + other.width + 24;
      node.y = other.y;
    }
  }
}

export function portPoint(n: NodeModel, port: PortPosition) {
  switch (port) {
    case 'left': return { x: n.x, y: n.y + n.height / 2 };
    case 'right': return { x: n.x + n.width, y: n.y + n.height / 2 };
    case 'top': return { x: n.x + n.width / 2, y: n.y };
    case 'bottom': return { x: n.x + n.width / 2, y: n.y + n.height };
  }
}

export function edgePath(n1: NodeModel, n2: NodeModel, port: PortPosition): string {
  const p1 = portPoint(n1, port);
  // Simple heuristic: aim towards center of target n2
  const p2 = { x: n2.x + n2.width / 2, y: n2.y + n2.height / 2 };
  const dx = (p2.x - p1.x) * 0.5;
  const dy = (p2.y - p1.y) * 0.5;
  const c1 = { x: p1.x + dx, y: p1.y + dy };
  const c2 = { x: p2.x - dx, y: p2.y - dy };
  return `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
}

export function tempEdgePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = (x2 - x1) * 0.5;
  const dy = (y2 - y1) * 0.5;
  const c1 = { x: x1 + dx, y: y1 + dy };
  const c2 = { x: x2 - dx, y: y2 - dy };
  return `M ${x1} ${y1} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${x2} ${y2}`;
}

export function findNodeAt(nodes: NodeModel[], x: number, y: number): NodeModel | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height) {
      return n;
    }
  }
  return null;
}
