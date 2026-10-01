import type { Input } from '../input/Input';
import { h } from './dom';

/**
 * A full-screen HTML overlay (menus, pause, game over...).
 * Override `render()` to fill `this.root`, and `handleInput()` for keyboard controls.
 */
export abstract class Screen {
  readonly root: HTMLDivElement;

  constructor(parent: HTMLElement, className: string) {
    this.root = h('div', { class: `screen ${className}` });
    parent.append(this.root);
  }

  show(): void {
    this.render();
    this.root.classList.add('visible');
  }

  hide(): void {
    this.root.classList.remove('visible');
  }

  get visible(): boolean {
    return this.root.classList.contains('visible');
  }

  /** Rebuild the screen's HTML. */
  protected abstract render(): void;

  /** Called every tick while this screen is showing. */
  handleInput(_input: Input): void {}
}
