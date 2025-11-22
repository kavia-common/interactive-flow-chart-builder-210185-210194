import { Component, HostListener, OnInit, inject, Signal, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopbarComponent } from './components/topbar/topbar.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { FlowCanvasComponent } from './components/flow-canvas/flow-canvas.component';
import { InspectorComponent } from './components/inspector/inspector.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { MinimapComponent } from './components/minimap/minimap.component';
import { FlowStateService } from './services/flow-state.service';
import { SerializationService } from './services/serialization.service';

// PUBLIC_INTERFACE
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    TopbarComponent,
    ToolbarComponent,
    FlowCanvasComponent,
    InspectorComponent,
    ContextMenuComponent,
    MinimapComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  /** Title shown while loading */
  title = 'Interactive Flow Editor';

  private flowState = inject(FlowStateService);
  private serializer = inject(SerializationService);

  autosaveKey = 'flow_editor_autosave_v1';
  saving: Signal<boolean> = this.flowState.saving;

  ngOnInit(): void {
    // Try load from localStorage autosave
    const data = localStorage.getItem(this.autosaveKey);
    if (data) {
      try {
        this.serializer.import(data);
      } catch (e) {
        console.warn('Failed to import autosave:', e);
      }
    }
    // Autosave on changes (throttled inside service)
    effect(() => {
      // Track state changes for autosave
      const snapshot = this.serializer.export();
      if (snapshot) {
        localStorage.setItem(this.autosaveKey, snapshot);
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(ev: KeyboardEvent) {
    // Global keyboard shortcuts
    // Ctrl/Cmd+S: export JSON
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 's') {
      ev.preventDefault();
      const data = this.serializer.export();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = 'flow.json';
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    }
    // Delete: delete selection
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      this.flowState.deleteSelection();
    }
    // Ctrl/Cmd+Z: undo
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      this.flowState.undo();
    }
    // Ctrl/Cmd+Shift+Z: redo
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      this.flowState.redo();
    }
    // Ctrl/Cmd+A: select all
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'a') {
      ev.preventDefault();
      this.flowState.selectAll();
    }
    // Escape: clear selection
    if (ev.key === 'Escape') {
      this.flowState.clearSelection();
    }
  }

  // PUBLIC_INTERFACE
  importFromFile(file: File) {
    /** Import the flow from a provided JSON file (triggered by Topbar) */
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        this.serializer.import(text);
      } catch (e) {
        alert('Failed to import JSON: ' + (e as Error).message);
      }
    };
    reader.readAsText(file);
  }
}
