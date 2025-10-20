import Phaser from "phaser";
import { Character } from "./Character";
import { logger } from "../logger";
import { Rock } from "./Rock";

export class Friendly extends Character {
  public direction: number = 90;
  private moveTarget: Phaser.Math.Vector2 | null = null;
  private targetRock: Rock | null = null;
  private moveSpeed = 180;
  private facing: "right" | "left" | "forward" | "back" = "forward";
  private interrupted = false;
  private clampEnabled = false;

  // Frame Assignment
  private FRAMES = {
    back:  { idle: 0,  walk: [0, 1, 2] },
    left:  { idle: 3,  walk: [3, 4, 5] },
    right: { idle: 6,  walk: [6, 7, 8] },
    forward:    { idle: 9, walk: [9, 10, 11] },
  };



  constructor(scene: Phaser.Scene, x: number, y: number, name = "you", maxHp = 5) {
    super(scene, x, y, "friendly", 0, name, maxHp, {
      sounds: { death: "se_friendly_die" },
      collideWorldBounds: true,
    });

    // animation
    this.makeWalkAnim("walk-back",    this.FRAMES.back.walk);
    this.makeWalkAnim("walk-left",    this.FRAMES.left.walk);
    this.makeWalkAnim("walk-right",   this.FRAMES.right.walk);
    this.makeWalkAnim("walk-forward", this.FRAMES.forward.walk);

    this.setData("kind", "friendly");

    // Check destructions
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.triggerGameResults("defeated");
    });

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
  // Add near other public helpers
  public faceToward(targetX: number, targetY: number) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const absx = Math.abs(dx), absy = Math.abs(dy);

    if (absx >= absy) {
      // left/right dominate
      (this as any).facing = dx >= 0 ? "right" : "left";
      this.direction = dx >= 0 ? 0 : 180;
    } else {
      (this as any).facing = dy >= 0 ? "back" : "forward";
      this.direction = dy >= 0 ? 90 : 270;
    }
  }

  // Idle consistent with last facing/direction (callable from scene)
  private playIdleFromDirection() {
    const key = this.direction === 0   ? "right"
            : this.direction === 180 ? "left"
            : this.direction === 270 ? "forward"
            : "back"; // 90 or fallback
    this.anims.stop();
    // If you have dedicated idle frames, map here; otherwise reuse walk-* start frame
    this.anims.play(`walk-${key}`, true);
    this.anims.pause(this.anims.currentAnim?.frames[0]); // freeze on first frame for "idle"
  }
  public updateAction(left: boolean, right: boolean, forward: boolean, back: boolean){
      if (this.isAutoMoving?.()) return;
      this.speed=200;
      this.moving = false;
      if (left)    { this.setVelocityX(-this.speed); this.direction = 180; this.moving = true; }
      if (right)   { this.setVelocityX( this.speed); this.direction =   0; this.moving = true; }
      if (forward) { this.setVelocityY(-this.speed); this.direction = 270; this.moving = true; }
      if (back)    { this.setVelocityY( this.speed); this.direction =  90; this.moving = true; }

      if (this.moving) {
        const key = this.direction === 0   ? "right"
                  : this.direction === 180 ? "left"
                  : this.direction === 270 ? "forward"
                  : "back";
        this.play(`walk-${key}`, true);
      } else {
        this.playIdleFromDirection?.();
      }
  }
  public makeWalkAnim(key: string, frames: number[]) {
    this.scene.anims.create({
      key,
      frames: frames.map((f) => ({ key: "friendly", frame: f })),
      frameRate: 8,
      repeat: -1,
    });
  }

}
