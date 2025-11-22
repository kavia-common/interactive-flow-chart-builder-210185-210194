import { Injectable, signal } from '@angular/core';
import { NodeModel } from '../models/flow-models';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private selected = signal<string[]>([]);
  private marqueeBox = signal<{ x1: number, y1: number, x2: number, y2: number } | null>(null);

  selectedIds() { return this.selected(); }
  isSelected(id: string) { return this.selected().includes(id); }

  set(ids: string[]) { this.selected.set([...new Set(ids)]); }
  toggle(id: string) {
    const s = new Set(this.selected());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selected.set([...s]);
  }
  clear() { this.selected.set([]); }

  setMarquee(x1: number, y1: number, x2: number, y2: number) {
    this.marqueeBox.set({ x1, y1, x2, y2 });
  }
  commitMarquee(nodes: NodeModel[]) {
    const m = this.marqueeBox();
    if (!m) return;
    const minX = Math.min(m.x1, m.x2);
    const minY = Math.min(m.y1, m.y2);
    const maxX = Math.max(m.x1, m.x2);
    const maxY = Math.max(m.y1, m.y2);
    const ids = nodes.filter(n => n.x >= minX && n.y >= minY && n.x + n.width <= maxX && n.y + n.height <= maxY).map(n => n.id);
    this.set(ids);
    this.marqueeBox.set(null);
  }
}
