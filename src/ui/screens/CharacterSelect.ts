import type { Input } from '../../input/Input';
import type { CharacterDef } from '../../player/CharacterDef';
import { h } from '../dom';
import { Screen } from '../Screen';

/** Pick your bird. The 3D model spins in the background (see rendering/Showcase.ts). */
export class CharacterSelect extends Screen {
  selected = 0;

  constructor(
    parent: HTMLElement,
    private characters: CharacterDef[],
    private onHighlight: (index: number) => void,
    private onConfirm: (index: number) => void,
  ) {
    super(parent, 'char-select');
  }

  handleInput(input: Input): void {
    if (input.pressed('menuLeft')) this.select(this.selected - 1);
    if (input.pressed('menuRight')) this.select(this.selected + 1);
    if (input.pressed('confirm')) this.onConfirm(this.selected);
  }

  select(index: number): void {
    const n = this.characters.length;
    this.selected = (index + n) % n;
    this.onHighlight(this.selected);
    this.render();
  }

  protected render(): void {
    const c = this.characters[this.selected];
    const abilities = c.abilities().map((a) => h('span', { class: 'chip' }, a.name));
    this.root.replaceChildren(
      h('h1', { class: 'title' }, 'Choose Your Bird'),
      h(
        'div',
        { class: 'char-info' },
        h('h2', { style: `color:${c.color}` }, c.name),
        h('div', { class: 'subtitle' }, c.title),
        h('p', {}, c.description),
        h('div', { class: 'chips' }, ...abilities),
      ),
      h(
        'div',
        { class: 'card-row' },
        h('button', { class: 'arrow', onclick: () => this.select(this.selected - 1) }, '◀'),
        ...this.characters.map((ch, i) =>
          h(
            'button',
            {
              class: `card ${i === this.selected ? 'selected' : ''}`,
              style: `--accent:${ch.color}`,
              onclick: () => (i === this.selected ? this.onConfirm(i) : this.select(i)),
            },
            h('div', { class: 'swatch' }),
            h('div', { class: 'card-name' }, ch.name),
          ),
        ),
        h('button', { class: 'arrow', onclick: () => this.select(this.selected + 1) }, '▶'),
      ),
      h('div', { class: 'hint' }, 'A / D to choose  ·  ENTER to select'),
    );
  }
}
