import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowStateService } from '../../services/flow-state.service';
import { SerializationService } from '../../services/serialization.service';

// PUBLIC_INTERFACE
@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  @Output() importFile = new EventEmitter<File>();

  constructor(
    public flow: FlowStateService,
    private serializer: SerializationService
  ) {}

  triggerFile(el: HTMLInputElement) {
    el.click();
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.importFile.emit(input.files[0]);
      input.value = '';
    }
  }

  exportJson() {
    const data = this.serializer.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'flow.json';
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  }

  newDiagram() {
    if (confirm('Clear current diagram?')) {
      this.flow.reset();
    }
  }
}
