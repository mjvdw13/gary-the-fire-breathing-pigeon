/**
 * A tiny "radio station" for the game.
 * One part of the game `emit`s an event (like "enemyKilled"), and anything that
 * cares can listen with `on` — without the two parts needing to know about each other.
 *
 * All the event names and their data are listed in `events.ts`.
 */
type Handler<T> = (payload: T) => void;

export class EventBus<Events extends object> {
  private handlers = new Map<keyof Events, Set<Handler<any>>>();

  /** Listen for an event. Returns a function that stops listening. */
  on<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler);
    return () => set!.delete(handler);
  }

  /** Listen for an event just once. */
  once<K extends keyof Events>(type: K, handler: Handler<Events[K]>): () => void {
    const off = this.on(type, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  /** Tell every listener that something happened. */
  emit<K extends keyof Events>(type: K, payload: Events[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    // Copy so listeners can unsubscribe while we loop.
    for (const handler of [...set]) handler(payload);
  }
}
