import { Injectable } from '@angular/core';
import { FlowSnapshot } from '../models/flow-models';

type SnapshotGetter = () => FlowSnapshot;
type SnapshotApplier = (s: FlowSnapshot) => void;

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private history: FlowSnapshot[] = [];
  private future: FlowSnapshot[] = [];
  private getSnapshot: SnapshotGetter = () => ({ nodes: [], edges: [] });
  private applySnapshot: SnapshotApplier = () => {};
  private lastCommitAt = 0;

  setGetSnapshot(fn: SnapshotGetter) { this.getSnapshot = fn; }
  setApplySnapshot(fn: SnapshotApplier) { this.applySnapshot = fn; }

  // PUBLIC_INTERFACE
  commit() {
    /** Commit current state to history, with throttling to avoid spamming. */
    const now = Date.now();
    if (now - this.lastCommitAt < 120) return;
    this.lastCommitAt = now;
    const snap = this.getSnapshot();
    this.history.push(structuredClone(snap));
    this.future = [];
  }

  // PUBLIC_INTERFACE
  undo() {
    /** Undo last committed state. */
    if (this.history.length === 0) return;
    const current = this.getSnapshot();
    const prev = this.history.pop()!;
    this.future.push(current);
    this.applySnapshot(prev);
  }

  // PUBLIC_INTERFACE
  redo() {
    /** Redo last undone state. */
    if (this.future.length === 0) return;
    const next = this.future.pop()!;
    const current = this.getSnapshot();
    this.history.push(current);
    this.applySnapshot(next);
  }
}
