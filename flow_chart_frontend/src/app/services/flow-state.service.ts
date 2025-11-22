import { Injectable, Signal, computed, effect, signal } from '@angular/core';
import { EdgeModel, FlowSnapshot, NodeModel, PortPosition } from '../models/flow-models';
import { HistoryService } from './history.service';
import { SelectionService } from './selection.service';
import { ViewportService } from './viewport.service';
import { uniqueId, avoidOverlap, edgePath as edgePathUtil, tempEdgePath as tempEdgePathUtil, findNodeAt } from '../utils/geometry';

@Injectable({ providedIn: 'root' })
export class FlowStateService {
  private _nodes = signal<NodeModel[]>([]);
  private _edges = signal<EdgeModel[]>([]);
  saving = signal(false);
  snapEnabled = signal(true);

  // PUBLIC_INTERFACE
  nodes() {
    /** Accessor returning readonly signal for nodes. Use nodes()() in templates to read the array. */
    return this._nodes.asReadonly();
  }

  // PUBLIC_INTERFACE
  edges() {
    /** Accessor returning readonly signal for edges. Use edges()() in templates to read the array. */
    return this._edges.asReadonly();
  }

  constructor(
    private history: HistoryService,
    private selection: SelectionService,
    private viewport: ViewportService
  ) {
    // Initialize empty state commit
    this.history.setGetSnapshot(() => this.snapshot());
    this.history.setApplySnapshot((s) => this.applySnapshot(s));
  }

  // PUBLIC_INTERFACE
  snapshot(): FlowSnapshot {
    /** This is a public function: returns a serializable snapshot of the flow. */
    return {
      nodes: JSON.parse(JSON.stringify(this._nodes())),
      edges: JSON.parse(JSON.stringify(this._edges())),
    };
  }

  // PUBLIC_INTERFACE
  applySnapshot(s: FlowSnapshot) {
    /** Apply a previously captured snapshot to the current state. */
    this._nodes.set(s.nodes || []);
    this._edges.set(s.edges || []);
  }

  // PUBLIC_INTERFACE
  addNode(type: 'action' | 'outcome', size: { width: number; height: number }) {
    /** Add a new node of the specified type. */
    const nodes = this._nodes();
    const n: NodeModel = {
      id: uniqueId('node'),
      type,
      label: type,
      x: 100 + nodes.length * 24,
      y: 80 + nodes.length * 24,
      width: size.width,
      height: size.height
    };
    avoidOverlap(n, nodes);
    this._nodes.set([...nodes, n]);
    this.history.commit();
  }

  // PUBLIC_INTERFACE
  moveNode(id: string, x: number, y: number) {
    /** Move a node to a new position. */
    const nodes = this._nodes().map(n => n.id === id ? { ...n, x, y } : n);
    this._nodes.set(nodes);
  }

  // PUBLIC_INTERFACE
  addEdge(from: string, to: string, port: PortPosition) {
    /** Create a new edge between nodes via a specific port. */
    if (from === to) return;
    const exists = this._edges().some(e => e.from === from && e.to === to && e.port === port);
    if (exists) return;
    const e: EdgeModel = {
      id: uniqueId('edge'),
      from, to, port
    };
    this._edges.set([...this._edges(), e]);
  }

  // PUBLIC_INTERFACE
  deleteSelection() {
    /** Delete selected nodes and their incident edges. */
    const sel = this.selection.selectedIds();
    if (sel.length === 0) return;
    const nextNodes = this._nodes().filter(n => !sel.includes(n.id));
    const nextEdges = this._edges().filter(e => !sel.includes(e.from) && !sel.includes(e.to));
    this._nodes.set(nextNodes);
    this._edges.set(nextEdges);
    this.selection.clear();
    this.history.commit();
  }

  // PUBLIC_INTERFACE
  clearSelection() { this.selection.clear(); }

  // PUBLIC_INTERFACE
  selectAll() {
    this.selection.set(this._nodes().map(n => n.id));
  }

  // PUBLIC_INTERFACE
  singleSelection(): NodeModel | null {
    /** Returns the single selected node, or null if not exactly one. */
    const ids = this.selection.selectedIds();
    if (ids.length !== 1) return null;
    return this._nodes().find(n => n.id === ids[0]) || null;
  }

  // PUBLIC_INTERFACE
  commit() {
    /** Commit current state to history (e.g., after inspector edits). */
    this.history.commit();
  }

  // PUBLIC_INTERFACE
  toggleSnap() {
    this.snapEnabled.set(!this.snapEnabled());
  }

  // PUBLIC_INTERFACE
  fitView() {
    /** Fit the viewport to include all nodes (basic implementation). */
    const nodes = this._nodes();
    if (nodes.length === 0) {
      this.viewport.reset();
      return;
    }
    const minX = Math.min(...nodes.map(n => n.x));
    const minY = Math.min(...nodes.map(n => n.y));
    const maxX = Math.max(...nodes.map(n => n.x + n.width));
    const maxY = Math.max(...nodes.map(n => n.y + n.height));
    const pad = 40;
    const w = maxX - minX + pad * 2;
    const h = maxY - minY + pad * 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight - 56; // minus topbar
    const k = Math.min(1.2, Math.max(0.2, Math.min(vw / w, vh / h)));
    const x = -minX * k + (vw - (maxX - minX) * k) / 2;
    const y = -minY * k + (vh - (maxY - minY) * k) / 2 + 56; // keep under topbar visual
    this.viewport.set(x, y, k);
  }

  // Helper paths for edges
  edgePath(e: EdgeModel): string {
    const from = this._nodes().find(n => n.id === e.from);
    const to = this._nodes().find(n => n.id === e.to);
    if (!from || !to) return '';
    return edgePathUtil(from, to, e.port);
  }

  tempEdgePath(drag: { startX: number, startY: number, curX: number, curY: number }) {
    return tempEdgePathUtil(drag.startX, drag.startY, drag.curX, drag.curY);
  }

  findNodeAt(x: number, y: number) {
    return findNodeAt(this._nodes(), x, y);
  }

  reset() {
    this._nodes.set([]);
    this._edges.set([]);
    this.selection.clear();
    this.history.commit();
    this.viewport.reset();
  }

  // PUBLIC_INTERFACE
  undo() {
    /** Undo the last change. */
    this.history.undo();
  }

  // PUBLIC_INTERFACE
  redo() {
    /** Redo the last undone change. */
    this.history.redo();
  }
}
