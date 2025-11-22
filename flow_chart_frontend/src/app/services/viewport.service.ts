import { Injectable, signal } from '@angular/core';
import { ViewportState } from '../models/flow-models';

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private _state = signal<ViewportState>({ x: 120, y: 120, k: 1 });

  // PUBLIC_INTERFACE
  state() { return this._state(); }

  // PUBLIC_INTERFACE
  set(x: number, y: number, k?: number) {
    const next: ViewportState = { x, y, k: k ?? this._state().k };
    this._state.set(next);
  }

  // PUBLIC_INTERFACE
  reset() { this._state.set({ x: 120, y: 120, k: 1 }); }

  // PUBLIC_INTERFACE
  toWorld(clientX: number, clientY: number) {
    const { x, y, k } = this._state();
    const rect = (typeof document !== 'undefined' ? document.body.getBoundingClientRect() : { left: 0, top: 0 } as any);
    const worldX = (clientX - rect.left - x) / k;
    const worldY = (clientY - rect.top - y) / k;
    return { x: worldX, y: worldY };
  }

  // PUBLIC_INTERFACE
  zoomAt(deltaY: number, clientX: number, clientY: number) {
    /** Zoom at pointer position (smooth). */
    const { x, y, k } = this._state();
    const factor = Math.exp(deltaY * -0.001);
    const newK = Math.min(2.0, Math.max(0.2, k * factor));

    const rect = (typeof document !== 'undefined' ? document.body.getBoundingClientRect() : { left: 0, top: 0 } as any);
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const wx = (px - x) / k;
    const wy = (py - y) / k;

    const nx = px - wx * newK;
    const ny = py - wy * newK;

    this._state.set({ x: nx, y: ny, k: newK });
  }
}
