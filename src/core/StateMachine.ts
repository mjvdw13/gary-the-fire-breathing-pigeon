/**
 * A state machine: something is in exactly one "state" at a time (like 'idle',
 * 'jumping', 'spitting') and each state has its own enter/update/exit code.
 *
 * Used by the game flow (menus → playing → victory) and by bosses.
 *
 * Example:
 *   const fsm = new StateMachine(this, {
 *     idle:  { update: (cat, dt) => { if (fsm.time > 2) fsm.change('jump'); } },
 *     jump:  { enter: (cat) => cat.leap() },
 *   }, 'idle');
 */
export interface State<Owner> {
  enter?(owner: Owner): void;
  update?(owner: Owner, dt: number): void;
  exit?(owner: Owner): void;
}

export class StateMachine<Owner, Name extends string> {
  /** Name of the state we're in right now. */
  current: Name;
  /** Seconds spent in the current state. */
  time = 0;

  constructor(
    private owner: Owner,
    private states: Record<Name, State<Owner>>,
    initial: Name,
  ) {
    this.current = initial;
    this.states[initial].enter?.(owner);
  }

  change(next: Name): void {
    this.states[this.current].exit?.(this.owner);
    this.current = next;
    this.time = 0;
    this.states[next].enter?.(this.owner);
  }

  update(dt: number): void {
    this.time += dt;
    this.states[this.current].update?.(this.owner, dt);
  }

  is(name: Name): boolean {
    return this.current === name;
  }
}
