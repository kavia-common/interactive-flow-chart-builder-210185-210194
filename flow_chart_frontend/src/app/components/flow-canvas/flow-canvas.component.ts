import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowStateService } from '../../services/flow-state.service';
import { ViewportService } from '../../services/viewport.service';
import { SnapService } from '../../services/snap.service';
import { SelectionService } from '../../services/selection.service';
import { NodeModel, PortPosition } from '../../models/flow-models';
import { HistoryService } from '../../services/history.service';

type DragState =
  | { kind: 'none' }
  | { kind: 'pan'; startX: number; startY: number; originX: number; originY: number }
  | { kind: 'node'; nodeId: string; startX: number; startY: number; nodeStartX: number; nodeStartY: number }
  | { kind: 'connect'; nodeId: string; port: PortPosition; startX: number; startY: number; curX: number; curY: number }
  | { kind: 'marquee'; startX: number; startY: number; curX: number; curY: number };

@Component({
  selector: 'app-flow-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flow-canvas.component.html',
  styleUrl: './flow-canvas.component.css'
})
export class FlowCanvasComponent implements OnInit, OnDestroy {
  // Expose Math for template usage
  Math = Math as any;
  @ViewChild('canvasArea') canvasArea!: ElementRef<HTMLDivElement>;
  private hostEl = inject(ElementRef<HTMLElement>);
  flow = inject(FlowStateService);
  viewport = inject(ViewportService);
  snap = inject(SnapService);
  selection = inject(SelectionService);
  history = inject(HistoryService);

  drag: DragState = { kind: 'none' };

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  get transform() {
    const v = this.viewport.state();
    return `translate(${v.x}px, ${v.y}px) scale(${v.k})`;
  }

  backgroundPatternStyle() {
    // Create repeating grid background
    const size = 24;
    const gridColor = '#E5E7EB';
    return {
      backgroundImage: `linear-gradient(90deg, ${gridColor} 1px, transparent 1px), linear-gradient(${gridColor} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
    };
  }

  onWheel(ev: WheelEvent) {
    this.viewport.zoomAt(-ev.deltaY, ev.clientX, ev.clientY);
  }

  onBackgroundDown(ev: MouseEvent) {
    if (ev.button === 1 || (ev.button === 0 && ev.altKey)) {
      // Middle click or Alt+Drag to pan
      const v = this.viewport.state();
      this.drag = { kind: 'pan', startX: ev.clientX, startY: ev.clientY, originX: v.x, originY: v.y };
    } else if (ev.button === 0) {
      // Left click on bg: start marquee selection
      const p = this.viewport.toWorld(ev.clientX, ev.clientY);
      this.drag = { kind: 'marquee', startX: p.x, startY: p.y, curX: p.x, curY: p.y };
      this.selection.clear();
    }
  }

  onBackgroundMove(ev: MouseEvent) {
    if (this.drag.kind === 'pan') {
      const dx = ev.clientX - this.drag.startX;
      const dy = ev.clientY - this.drag.startY;
      this.viewport.set(this.drag.originX + dx, this.drag.originY + dy);
    } else if (this.drag.kind === 'marquee') {
      const p = this.viewport.toWorld(ev.clientX, ev.clientY);
      this.drag.curX = p.x; this.drag.curY = p.y;
      this.selection.setMarquee(this.drag.startX, this.drag.startY, this.drag.curX, this.drag.curY);
    } else if (this.drag.kind === 'connect') {
      const p = this.viewport.toWorld(ev.clientX, ev.clientY);
      this.drag.curX = p.x; this.drag.curY = p.y;
    } else if (this.drag.kind === 'node') {
      const cur = this.viewport.toWorld(ev.clientX, ev.clientY);
      const dx = cur.x - this.drag.startX;
      const dy = cur.y - this.drag.startY;
      const { x, y } = this.snap.apply(this.drag.nodeStartX + dx, this.drag.nodeStartY + dy);
      this.flow.moveNode(this.drag.nodeId, x, y);
    }
  }

  onBackgroundUp(ev: MouseEvent) {
    if (this.drag.kind === 'marquee') {
      this.selection.commitMarquee(this.flow.nodes()());
      this.drag = { kind: 'none' };
    } else if (this.drag.kind !== 'none') {
      this.drag = { kind: 'none' };
      this.history.commit(); // commit after drags
    }
  }

  onNodeDown(ev: MouseEvent, node: NodeModel) {
    ev.stopPropagation();
    if (!ev.shiftKey && !this.selection.isSelected(node.id)) {
      this.selection.set([node.id]);
    } else if (ev.shiftKey) {
      this.selection.toggle(node.id);
    }
    const cur = this.viewport.toWorld(ev.clientX, ev.clientY);
    this.drag = { kind: 'node', nodeId: node.id, startX: cur.x, startY: cur.y, nodeStartX: node.x, nodeStartY: node.y };
  }

  connectFrom(node: NodeModel, port: PortPosition, ev: MouseEvent) {
    ev.stopPropagation();
    const cur = this.viewport.toWorld(ev.clientX, ev.clientY);
    this.drag = { kind: 'connect', nodeId: node.id, port, startX: cur.x, startY: cur.y, curX: cur.x, curY: cur.y };
  }

  onMouseUpGlobal = (ev: MouseEvent) => {
    if (this.drag.kind === 'connect') {
      // Check if release over another node to create edge
      const p = this.viewport.toWorld(ev.clientX, ev.clientY);
      const target = this.flow.findNodeAt(p.x, p.y);
      if (target) {
        const from = this.drag.nodeId;
        const to = target.id;
        const port = this.drag.port;
        this.flow.addEdge(from, to, port);
        this.history.commit();
      }
      this.drag = { kind: 'none' };
    }
  };

  @HostListener('document:mouseup', ['$event'])
  onGlobalMouseUp(ev: MouseEvent) {
    this.onMouseUpGlobal(ev);
  }

  trackNode(_i: number, n: NodeModel) { return n.id; }
}
