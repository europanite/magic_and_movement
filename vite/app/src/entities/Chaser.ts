// app/src/entities/Chaser.ts
import Phaser from "phaser";
import { Character } from "./Character";

/**
 * Configurable chasing enemy that pursues a target Character/Sprite.
 * - Arcade Physics based steering
 * - Optional dash bursts
 * - Optional obstacle avoidance (with a StaticGroup)
 *
 * Usage (scene):
 *   const ch = new Chaser(this, 1600, 1200, "Chaser", {
 *     speed: 120,
 *     dashEveryMs: 3500,
 *     dashSpeed: 240,
 *   });
 *   ch.setTarget(player).setObstacles(blocks);
 *   this.add.existing(ch);
 */
export type ChaserOptions = {
  /** Base chase speed (px/s) */
  speed?: number;
  /** Dash every N milliseconds (0 disables dashing) */
  dashEveryMs?: number;
  /** Speed during dash (px/s) */
  dashSpeed?: number;
  /** Hitbox circle scale relative to display size */
  hitboxScale?: number;
  /** Display scale */
  scale?: number;
  /** Clamp velocity instantly (no acceleration smoothing) */
  snapVelocity?: boolean;
};

export class Chaser extends Character {
  private target?: Phaser.GameObjects.Sprite;
  private obstacles?: Phaser.Physics.Arcade.StaticGroup;

  private speed: number;
  private dashEveryMs: number;
  private dashSpeed: number;
  private lastDashAt = 0;
  private snapVelocity: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    displayName = "Chaser",
    opts: ChaserOptions = {}
  ) {
    super(scene, x, y, "enemy", 0, displayName, 1, {
      sounds: { death: "se_enemy_die" },
      collideWorldBounds: true,
      hitboxShape: "circle",
      hitboxScale: opts.hitboxScale ?? 0.45,
      scale: opts.scale ?? 1.8,
    });

    this.setData("kind", "enemy");

    this.speed = opts.speed ?? 120;
    this.dashEveryMs = opts.dashEveryMs ?? 0;
    this.dashSpeed = opts.dashSpeed ?? 260;
    this.snapVelocity = opts.snapVelocity ?? true;

    // Basic body setup
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setMaxSpeed(Math.max(this.speed, this.dashSpeed) * 1.05);
  }

  /** Assign the target to chase. Returns this for chaining. */
  public setTarget(t: Phaser.GameObjects.Sprite | undefined) {
    this.target = t;
    return this;
  }

  /** Optional: Provide obstacles (static bodies) to nudge around. */
  public setObstacles(group?: Phaser.Physics.Arcade.StaticGroup) {
    this.obstacles = group;
    return this;
  }

  /** Lightweight facing for left/right flip; avoid animation coupling. */
  private updateFacing(dx: number, dy: number) {
    // Prefer horizontal look if stronger; otherwise vertical (no anim keys required)
    if (Math.abs(dx) >= Math.abs(dy)) {
      this.setFlipX(dx < 0);
    } else {
      // keep last horizontal flip; vertical facing not visualized
    }
  }

  /** Very small avoidance: push perpendicular when overlapping a block. */
  private avoidIfNeeded() {
    if (!this.obstacles) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    let bumped = false;
    this.scene.physics.overlap(this, this.obstacles, () => {
      bumped = true;
    });

    if (bumped) {
      const vx = body.velocity.x;
      const vy = body.velocity.y;
      // Perpendicular nudge
      body.setVelocity(vy * 0.7, -vx * 0.7);
    }
  }

  /** Main steering logic */
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!this.target || !this.target.active) {
      // Idle if no target
      body.setVelocity(0, 0);
      return;
    }

    // Vector toward target
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Face the target for simple readability
    this.updateFacing(dx, dy);

    // Decide speed (dash if timer elapsed)
    let spd = this.speed;
    if (this.dashEveryMs > 0 && time - this.lastDashAt > this.dashEveryMs) {
      spd = this.dashSpeed;
      this.lastDashAt = time;
    }

    // Compute desired velocity
    if (dist > 1) {
      const ang = Math.atan2(dy, dx);
      const vx = Math.cos(ang) * spd;
      const vy = Math.sin(ang) * spd;

      if (this.snapVelocity) {
        body.setVelocity(vx, vy);
      } else {
        // Smooth accelerate toward the desired velocity
        body.velocity.x += (vx - body.velocity.x) * 0.2;
        body.velocity.y += (vy - body.velocity.y) * 0.2;
      }
    } else {
      body.setVelocity(0, 0);
    }

    // Cheap avoidance (optional)
    this.avoidIfNeeded();
  }
}
