import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowStateService } from '../../services/flow-state.service';

// PUBLIC_INTERFACE
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  constructor(public flow: FlowStateService) {}

  addActionNode() {
    this.flow.addNode('action', { width: 160, height: 64 });
  }
  addOutcomeNode() {
    this.flow.addNode('outcome', { width: 140, height: 56 });
  }
  toggleSnap() {
    this.flow.toggleSnap();
  }
  fitView() {
    this.flow.fitView();
  }
}
