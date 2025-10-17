// app/src/entities/Player.ts
import Phaser from "phaser";
import { CharacterBase } from "./CharacterBase";
import { logger } from "../logger";
import { Rock } from "./Rock";

export class Player extends CharacterBase {
  public direction: number = 90;

  private moveTarget: Phaser.Math.Vector2 | null = null;
  private targetRock: Rock | null = null;
  private moveSpeed = 180;
  private facing: "right" | "left" | "forward" | "back" = "forward";
  private interrupted = false;
  private clampEnabled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, name = "you", maxHp = 5) {
    super(scene, x, y, "player", 0, name, maxHp, {
      sounds: { death: "se_player_die" },
      collideWorldBounds: true,
    });
    this.setData("kind", "player");
  }

  /** Begin auto-navigation toward the rock center. */
  moveToRock(target: Rock) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.moveTarget = new Phaser.Math.Vector2(target.x, target.y);
    this.targetRock = target;

    // Keep collisions enabled while auto-moving.
    if (body) {
      body.checkCollision.none = false;
    }

    const label = target.getData("name") ?? target.displayName ?? "rock";
    logger.info(`Move: heading to rock "${String(label)}"`);
  }

  /** Scene can read which rock we are targeting. */
  public getTargetRock(): Rock | null {
    return this.targetRock;
  }

  private playWalkAnim() {
    const key = {
      right:   "walk-right",
      left:    "walk-left",
      forward: "walk-forward",
      back:    "walk-back",
    }[this.facing];
    if (this.anims.currentAnim?.key !== key) {
      this.anims.play(key, true);
    }
  }

  public isAutoMoving(): boolean {
    return !!this.moveTarget;
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.interrupted) {
      this.interrupted = false;
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.moveTarget) {
      // --- Heading & facing update
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;

      if (Math.abs(dx) >= Math.abs(dy)) {
        this.facing = dx >= 0 ? "right" : "left";
        this.direction = dx >= 0 ? 0 : 180;
      } else {
        this.facing = dy >= 0 ? "back" : "forward";
        this.direction = dy >= 0 ? 90 : 270;
      }

      // --- Velocity & animation
      const angle = Math.atan2(dy, dx);
      this.scene.physics.velocityFromRotation(angle, this.moveSpeed, body.velocity);
      this.playWalkAnim();

      // NOTE:
      // Do NOT stop in here. Stopping is now exclusively handled by the scene-side collider.
    } else {
      // Ensure collisions stay enabled when not auto-moving
      if (body.checkCollision.none !== false) body.checkCollision.none = false;
    }

    // Camera clamp once we've been inside the view at least once
    const cam = this.scene.cameras.main;
    if (!this.clampEnabled) {
      if (cam.worldView.contains(this.x, this.y)) {
        this.clampEnabled = true;
      }
      return;
    }
    this.keepInsideCameraView();
  }

  /** Called by scene or input to cancel auto-navigation */
  public stopAutoMove() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
      body.checkCollision.none = false;
    }
    this.moveTarget = null;
    this.targetRock = null;
  }

  /** User input should always win over auto-move */
  public interruptAutoMove() {
    if (this.isAutoMoving()) {
      logger.info("Auto-move interrupted by user input.");
      this.stopAutoMove();
      this.interrupted = true;
    }
  }

  private keepInsideCameraView() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    const cam = this.scene.cameras.main;
    const view = cam.worldView;

    const halfW = body.width  * 0.5;
    const halfH = body.height * 0.5;

    const minX = view.left  + halfW;
    const maxX = view.right - halfW;
    const minY = view.top   + halfH;
    const maxY = view.bottom- halfH;

    this.x = Phaser.Math.Clamp(this.x, minX, maxX);
    this.y = Phaser.Math.Clamp(this.y, minY, maxY);

    body.position.x = this.x - halfW;
    body.position.y = this.y - halfH;
  }
}
