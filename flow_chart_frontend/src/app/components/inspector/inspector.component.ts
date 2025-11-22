import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowStateService } from '../../services/flow-state.service';
import { FormsModule } from '@angular/forms';

// PUBLIC_INTERFACE
@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspector.component.html',
  styleUrl: './inspector.component.css'
})
export class InspectorComponent {
  constructor(public flow: FlowStateService) {}

  get sel() { return this.flow.singleSelection(); }

  update() {
    this.flow.commit();
  }
}
