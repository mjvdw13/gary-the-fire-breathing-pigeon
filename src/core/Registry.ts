/**
 * A list of things you can look up by id — characters, enemies, levels, projectiles.
 * Adding new content to the game = writing its file and registering it in that folder's index.ts.
 */
export class Registry<T extends { id: string }> {
  private items = new Map<string, T>();

  constructor(private kind: string) {}

  register(...items: T[]): this {
    for (const item of items) {
      if (this.items.has(item.id)) {
        throw new Error(`${this.kind} "${item.id}" is registered twice`);
      }
      this.items.set(item.id, item);
    }
    return this;
  }

  get(id: string): T {
    const item = this.items.get(id);
    if (!item) {
      const known = [...this.items.keys()].join(', ');
      throw new Error(`Unknown ${this.kind} "${id}". Known: ${known}`);
    }
    return item;
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  /** Everything registered, in the order it was added. */
  list(): T[] {
    return [...this.items.values()];
  }
}
