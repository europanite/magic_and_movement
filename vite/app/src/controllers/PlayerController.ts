// app/src/controllers/PlayerController.ts
import Phaser from "phaser";
import type { Semantic, SemanticExecutor } from "../commands/Semantics";
import { Friendly } from "../entities/Friendly";

/**
 * PlayerController
 * - Keeps Friendly-specific logic out of the Scene.
 * - Implements SemanticExecutor so CommandParser can call into here.
 */
export class PlayerController implements SemanticExecutor {
  constructor(
    private scene: Phaser.Scene,
    private friendly: Friendly,
    /** Optional: rock name provider for MOVE_TO_ROCK auto-complete, etc. */
    private listRocks?: () => string[]
  ) {}

  /** For CommandParser voice intents (optional) */
  listRockNames(): string[] {
    return this.listRocks?.() ?? [];
  }

  /** Main dispatch */
  exec(s: Semantic): void {
    switch (s.type) {
      case "GO_RIGHT": this.setDirectionDeg(0);   this.startWalking(); break;
      case "GO_DOWN":  this.setDirectionDeg(90);  this.startWalking(); break;
      case "GO_LEFT":  this.setDirectionDeg(180); this.startWalking(); break;
      case "GO_UP":    this.setDirectionDeg(270); this.startWalking(); break;

      case "TURN_LEFT":  this.nudge(-90); break;
      case "TURN_RIGHT": this.nudge(+90); break;
      case "TURN_BACK":  this.nudge(+180); break;

      case "SET_DIRECTION": this.setDirectionDeg(s.degrees); break;

      case "WALK": this.startWalking(); break;

      case "STOP": {
        const body = this.friendly.body as Phaser.Physics.Arcade.Body | undefined;
        body?.setVelocity(0, 0);
        (this.friendly as any).playIdleAnim?.();
        break;
      }

      case "SHOOT": {
        const deg = (this.friendly as any).direction ?? 0;
        this.friendly.shoot(deg); // Scene must expose spawnBullet (see below)
        break;
      }

      case "LIGHT_TOGGLE":
        (this.friendly as any).toggleLight?.();
        break;

      case "MOVE_TO_ROCK":
        (this.friendly as any).moveToRockByName?.(s.name);
        break;
    }
  }

  // ---------- helpers ----------
  private nudge(delta: number) {
    const now = ((this.friendly as any).direction ?? 0) as number;
    this.setDirectionDeg(((now + delta) % 360 + 360) % 360);
  }

  private setDirectionDeg(deg: number) {
    (this.friendly as any).direction = deg;

    // Basic readable facing (no animation coupling required)
    if (deg >= 45 && deg < 135) {
      (this.friendly as any).facing = "back";    this.friendly.setFlipX(false);
    } else if (deg >= 135 && deg < 225) {
      (this.friendly as any).facing = "left";    this.friendly.setFlipX(true);
    } else if (deg >= 225 && deg < 315) {
      (this.friendly as any).facing = "forward"; this.friendly.setFlipX(false);
    } else {
      (this.friendly as any).facing = "right";   this.friendly.setFlipX(false);
    }

    (this.friendly as any).playIdleAnim?.();
  }

  private startWalking(speed = (this.friendly as any).speed ?? 160) {
    const body = this.friendly.body as Phaser.Physics.Arcade.Body | undefined;
    const deg = ((this.friendly as any).direction ?? 0) as number;
    const rad = Phaser.Math.DegToRad(deg);
    const vx = Math.cos(rad) * speed;
    const vy = Math.sin(rad) * speed;

    (this.friendly as any).stopAutoMove?.(); // cancel auto-path then go manual
    body?.setVelocity(vx, vy);
    (this.friendly as any).playWalkAnim?.();
  }
}
