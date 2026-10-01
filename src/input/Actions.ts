/**
 * Game actions and which keys/buttons trigger them.
 * Code asks "is Jump pressed?" instead of "is Space pressed?", so controls can be
 * changed here in one place (or by a future settings menu).
 *
 * Key names are KeyboardEvent.code values (https://developer.mozilla.org/docs/Web/API/UI_Events/Keyboard_event_code_values).
 * Mouse buttons are 'Mouse0' (left), 'Mouse1' (middle), 'Mouse2' (right).
 */
export type Action =
  | 'moveForward'
  | 'moveBack'
  | 'moveLeft'
  | 'moveRight'
  | 'jump'
  | 'fire'
  | 'special'
  | 'godMode'
  | 'confirm'
  | 'back'
  | 'menuLeft'
  | 'menuRight'
  | 'menuUp'
  | 'menuDown'
  | 'debugPanel'
  | 'debugKillAll'
  | 'mute';

export const DEFAULT_BINDINGS: Record<Action, string[]> = {
  moveForward: ['KeyW', 'ArrowUp'],
  moveBack: ['KeyS', 'ArrowDown'],
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  fire: ['Mouse0', 'KeyF'],
  special: ['ShiftLeft', 'ShiftRight', 'KeyE'],
  godMode: ['KeyG'],
  confirm: ['Enter', 'Space'],
  back: ['Escape', 'Backspace'],
  menuLeft: ['KeyA', 'ArrowLeft'],
  menuRight: ['KeyD', 'ArrowRight'],
  menuUp: ['KeyW', 'ArrowUp'],
  menuDown: ['KeyS', 'ArrowDown'],
  debugPanel: ['Backquote'],
  debugKillAll: ['KeyK'],
  mute: ['KeyM'],
};
