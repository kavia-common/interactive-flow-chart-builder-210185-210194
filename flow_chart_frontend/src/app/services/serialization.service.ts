import { Injectable, inject } from '@angular/core';
import { FlowSnapshot } from '../models/flow-models';
import { FlowStateService } from './flow-state.service';

// PUBLIC_INTERFACE
@Injectable({ providedIn: 'root' })
export class SerializationService {
  private flow = inject(FlowStateService);

  // PUBLIC_INTERFACE
  export(): string {
    /** Export the current flow as JSON string. */
    const snapshot = this.flow.snapshot();
    return JSON.stringify(snapshot, null, 2);
  }

  // PUBLIC_INTERFACE
  import(json: string) {
    /** Import a flow from a JSON string and apply it to state. */
    const data = JSON.parse(json) as FlowSnapshot;
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new Error('Invalid JSON structure');
    }
    this.flow.applySnapshot(data);
  }
}
