import { Injectable, inject } from '@angular/core';
import { FlowStateService } from './flow-state.service';

@Injectable({ providedIn: 'root' })
export class SnapService {
  private flow = inject(FlowStateService);

  grid = 24;

  // PUBLIC_INTERFACE
  apply(x: number, y: number): { x: number; y: number } {
    /** Apply grid snapping if enabled in FlowStateService. */
    if (!this.flow.snapEnabled()) return { x, y };
    const sx = Math.round(x / this.grid) * this.grid;
    const sy = Math.round(y / this.grid) * this.grid;
    return { x: sx, y: sy };
  }
}
