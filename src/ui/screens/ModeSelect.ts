import type { GameMode } from '../../gameplay/modes/GameMode';
import type { Input } from '../../input/Input';
import type { SaveData } from '../../save/SaveData';
import { h } from '../dom';
import { Screen } from '../Screen';

export class ModeSelect extends Screen {
  selected = 0;
  private modes: GameMode[];

  constructor(
    parent: HTMLElement,
    modeFactories: (() => GameMode)[],
    private save: SaveData,
    private onConfirm: (index: number) => void,
    private onBack: () => void,
  ) {
    super(parent, 'mode-select');
    this.modes = modeFactories.map((make) => make());
  }

  handleInput(input: Input): void {
    if (input.pressed('menuLeft') || input.pressed('menuUp')) this.select(this.selected - 1);
    if (input.pressed('menuRight') || input.pressed('menuDown')) this.select(this.selected + 1);
    if (input.pressed('confirm')) this.onConfirm(this.selected);
    if (input.pressed('back')) this.onBack();
  }

  private select(index: number): void {
    const n = this.modes.length;
    this.selected = (index + n) % n;
    this.render();
  }

  protected render(): void {
    this.root.replaceChildren(
      h('h1', { class: 'title' }, 'Choose a Mode'),
      h(
        'div',
        { class: 'mode-row' },
        ...this.modes.map((m, i) =>
          h(
            'button',
            {
              class: `mode-card ${i === this.selected ? 'selected' : ''}`,
              onclick: () => (i === this.selected ? this.onConfirm(i) : this.select(i)),
            },
            h('div', { class: 'mode-icon' }, m.icon),
            h('h2', {}, m.name),
            h('p', {}, m.description),
            h('div', { class: 'best' }, `Best: ${this.save.highScore(m.id).toLocaleString()}`),
          ),
        ),
      ),
      h('div', { class: 'hint' }, 'A / D to choose  ·  ENTER to start  ·  ESC to go back'),
    );
  }
}
