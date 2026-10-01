/**
 * Progress that survives closing the browser: unlocked companions and high scores.
 * Stored in localStorage. Add new fields to SaveState (with a default in DEFAULTS).
 */
interface SaveState {
  companions: string[];
  highScores: Record<string, number>;
}

const KEY = 'gary3d-save-v1';
const DEFAULTS: SaveState = { companions: [], highScores: {} };

export class SaveData {
  private state: SaveState;

  constructor() {
    this.state = this.load();
  }

  hasCompanion(id: string): boolean {
    return this.state.companions.includes(id);
  }

  /** Returns true if this is a NEW unlock. */
  unlockCompanion(id: string): boolean {
    if (this.hasCompanion(id)) return false;
    this.state.companions.push(id);
    this.save();
    return true;
  }

  highScore(modeId: string): number {
    return this.state.highScores[modeId] ?? 0;
  }

  /** Returns true if it's a new high score. */
  submitScore(modeId: string, score: number): boolean {
    if (score <= this.highScore(modeId)) return false;
    this.state.highScores[modeId] = score;
    this.save();
    return true;
  }

  /** Wipe everything (debug panel). */
  reset(): void {
    this.state = structuredClone(DEFAULTS);
    this.save();
  }

  private load(): SaveState {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...structuredClone(DEFAULTS), ...JSON.parse(raw) };
    } catch {
      // Private browsing or corrupted save — start fresh.
    }
    return structuredClone(DEFAULTS);
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch {
      // Storage blocked — progress just won't be remembered.
    }
  }
}
