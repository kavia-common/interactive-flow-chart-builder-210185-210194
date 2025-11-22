import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowStateService } from '../../services/flow-state.service';
import { ViewportService } from '../../services/viewport.service';

// PUBLIC_INTERFACE
@Component({
  selector: 'app-minimap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minimap.component.html',
  styleUrl: './minimap.component.css'
})
export class MinimapComponent {
  flow = inject(FlowStateService);
  viewport = inject(ViewportService);

  scale = 0.08;

  viewRect() {
    const v = this.viewport.state();
    const ww = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const wh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      left: -v.x * this.scale / v.k,
      top: -v.y * this.scale / v.k,
      width: ww * this.scale / v.k,
      height: wh * this.scale / v.k
    };
  }
}
