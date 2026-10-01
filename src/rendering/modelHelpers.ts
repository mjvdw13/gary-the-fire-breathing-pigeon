import type { PartDef } from './ModelFactory';

/**
 * Make a left AND right copy of a part (wings, legs, eyes, ears...).
 * Describe the LEFT one (positive x). If you give a name like 'wing', you get 'wingL' and 'wingR'.
 * Children of a mirrored part should use parent: 'wingL' — the right copy is re-parented to 'wingR'.
 */
export function sym(part: PartDef & { name?: string }): PartDef[] {
  const left: PartDef = { ...part, name: part.name ? `${part.name}L` : undefined };
  const right: PartDef = {
    ...part,
    name: part.name ? `${part.name}R` : undefined,
    pos: [-part.pos[0], part.pos[1], part.pos[2]],
    pivot: part.pivot ? [-part.pivot[0], part.pivot[1], part.pivot[2]] : undefined,
    rot: part.rot ? [part.rot[0], -part.rot[1], -part.rot[2]] : undefined,
    parent: part.parent?.endsWith('L') ? `${part.parent.slice(0, -1)}R` : part.parent,
  };
  return [left, right];
}
