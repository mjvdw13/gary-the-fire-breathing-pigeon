import type { Input } from '../../input/Input';
import { h } from '../dom';
import { Screen } from '../Screen';

export interface MessageContent {
  title: string;
  subtitle?: string;
  lines?: string[];
  /** Small text at the bottom, like "Press SPACE". */
  hint?: string;
  /** Extra class for colors: 'splash' | 'victory' | 'gameover' | 'paused' | 'chapter' */
  tone?: string;
  /** Controls cheat sheet. */
  controls?: [string, string][];
}

export interface MessageActions {
  onConfirm?: () => void;
  onBack?: () => void;
  /** Seconds before confirm works (so you don't skip by accident). */
  confirmDelay?: number;
}

/**
 * One flexible screen for all the "big text" moments: splash title, pause,
 * chapter transitions, victory and game over.
 */
export class MessageScreen extends Screen {
  private content: MessageContent = { title: '' };
  private actions: MessageActions = {};
  private shownAt = 0;

  constructor(parent: HTMLElement) {
    super(parent, 'message');
  }

  open(content: MessageContent, actions: MessageActions = {}): void {
    this.content = content;
    this.actions = actions;
    this.shownAt = performance.now();
    this.show();
  }

  handleInput(input: Input): void {
    const ready = (performance.now() - this.shownAt) / 1000 >= (this.actions.confirmDelay ?? 0.3);
    if (ready && input.pressed('confirm')) this.actions.onConfirm?.();
    else if (input.pressed('back')) this.actions.onBack?.();
  }

  protected render(): void {
    const c = this.content;
    this.root.className = `screen message visible ${c.tone ?? ''}`;
    this.root.replaceChildren(
      h(
        'div',
        { class: 'message-box' },
        h('h1', { class: 'big-title' }, c.title),
        c.subtitle ? h('h2', { class: 'big-subtitle' }, c.subtitle) : null,
        ...(c.lines ?? []).map((line) => h('p', {}, line)),
        c.controls
          ? h(
              'div',
              { class: 'controls' },
              ...c.controls.flatMap(([key, what]) => [h('kbd', {}, key), h('span', {}, what)]),
            )
          : null,
        c.hint ? h('div', { class: 'hint blink', onclick: () => this.actions.onConfirm?.() }, c.hint) : null,
      ),
    );
  }
}
