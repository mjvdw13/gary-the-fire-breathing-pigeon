import { beforeAll, describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { Physics, initPhysics } from '../src/physics/Physics';
import { CharacterMotor } from '../src/physics/CharacterMotor';
import { TUNING } from '../src/config/tuning';

const dt = TUNING.fixedStep;

function makeWorld() {
  const physics = new Physics();
  // 40x40 floor whose top surface is at y = 0
  physics.addStaticBox(new Vector3(0, -0.5, 0), new Vector3(40, 1, 40));
  // A wall at x = 5
  physics.addStaticBox(new Vector3(5.5, 2, 0), new Vector3(1, 4, 10));
  physics.step();
  return physics;
}

function simulate(physics: Physics, motor: CharacterMotor, seconds: number, each?: () => void) {
  for (let t = 0; t < seconds; t += dt) {
    each?.();
    motor.move(dt);
    physics.step();
  }
}

describe('CharacterMotor', () => {
  beforeAll(async () => {
    await initPhysics();
  });

  it('falls and lands on the floor', () => {
    const physics = makeWorld();
    const motor = new CharacterMotor(physics, new Vector3(0, 3, 0), { radius: 0.4, height: 1.2 });
    simulate(physics, motor, 1.5);
    expect(motor.grounded).toBe(true);
    expect(motor.position.y).toBeGreaterThan(-0.05);
    expect(motor.position.y).toBeLessThan(0.1);
  });

  it('jumps about v²/2g high and lands again', () => {
    const physics = makeWorld();
    const motor = new CharacterMotor(physics, new Vector3(0, 0.05, 0), { radius: 0.4, height: 1.2 });
    simulate(physics, motor, 0.5);
    expect(motor.grounded).toBe(true);

    const jumpSpeed = 12.5;
    motor.velocity.y = jumpSpeed;
    let peak = 0;
    simulate(physics, motor, 2, () => {
      peak = Math.max(peak, motor.position.y);
    });
    const expected = (jumpSpeed * jumpSpeed) / (2 * TUNING.gravity);
    expect(peak).toBeGreaterThan(expected * 0.85);
    expect(peak).toBeLessThan(expected * 1.1);
    expect(motor.grounded).toBe(true);
  });

  it('is stopped by walls', () => {
    const physics = makeWorld();
    const motor = new CharacterMotor(physics, new Vector3(0, 0.05, 0), { radius: 0.4, height: 1.2 });
    simulate(physics, motor, 2, () => {
      motor.velocity.x = 8;
    });
    expect(motor.position.x).toBeLessThan(5 - 0.3);
    expect(motor.position.x).toBeGreaterThan(4);
  });

  it('floats when gravityScale is 0', () => {
    const physics = makeWorld();
    const motor = new CharacterMotor(physics, new Vector3(0, 5, 0), {
      radius: 0.4,
      height: 1,
      gravityScale: 0,
    });
    simulate(physics, motor, 1);
    expect(motor.position.y).toBeCloseTo(5, 3);
  });

  it('knows when a spot is blocked (used to avoid spawning inside walls)', () => {
    const physics = makeWorld();
    expect(physics.isSpaceFree(new Vector3(0, 0.05, 0), 0.5, 2)).toBe(true);
    expect(physics.isSpaceFree(new Vector3(5.5, 0.05, 0), 0.5, 2)).toBe(false);
  });
});
