import Phaser from "phaser";
import { Character } from "./Character";
import { logger } from "../logger";
import { Rock } from "./Rock";

export class Friendly extends Character {
  public direction: number = 90;
  private moveTarget: Phaser.Math.Vector2 | null = null;
  private targetRock: Rock | null = null;
  private targetPoint: Rock | null = null;
  private speed = 200;
  private facing: "right" | "left" | "forward" | "back" = "forward";
  private interrupted = false;
  private clampEnabled = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  wasd!: { [k: string]: Phaser.Input.Keyboard.Key };

  constructor(scene: Phaser.Scene, x: number, y: number, name = "you", maxHp = 5) {
    super(
      scene, 
      x, 
      y, 
      "friendly",
      0, 
      name, 
      maxHp, 
      {
        sounds: { death: "se_friendly_die" },
        collideWorldBounds: true,
      }
    );

    // animation
    this.ensureAnims(this.scene);

    this.setData("kind", "friendly");

    // Check destructions
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.triggerGameResults("defeated");
    });

      this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      SPACE: this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    } as any;
  
    // Shoot
    this.scene.input.keyboard!.on('keydown-SPACE', () => {
      this.shoot(this.direction, {
        speed: 400,
        radius: 8,
        lifespanMs: 1000,
        armDelayMs: 300,
      });
    });

    this.scene.cameras.main.startFollow(this, true, 0.1, 0.1);

    // Friendly Input
    const kb = this.scene.input.keyboard!;
    const logKey = (type:string, key:string)=> logger.cmd(`key ${type}: ${key}`);
    kb.on("keydown", (e: KeyboardEvent) => logKey("back", e.key));
    kb.on("keyup",   (e: KeyboardEvent) => logKey("forward",   e.key));

  }

  /** Begin auto-navigation toward the rock center. */
  moveToRock(target: Rock) {
    this.speed=400;
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

  moveToPoint(target: Point) {
    this.speed=400;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.moveTarget = new Phaser.Math.Vector2(target.x, target.y);
    this.targetPoint = target;

    // Keep collisions enabled while auto-moving.
    if (body) {
      body.checkCollision.none = false;
    }

    const label = target.getData("name") ?? target.displayName ?? "point";
    logger.info(`Move: heading to point "${String(label)}"`);
  }

  /** Scene can read which rock we are targeting. */
  public getTargetRock(): Rock | null {
    return this.targetRock;
  }

  private playWalkAnim() {
    if (!this.active || !(this as any).anims) return;

    const key = {
      right:   "walk-right",
      left:    "walk-left",
      forward: "walk-forward",
      back:    "walk-back",
    }[this.facing];

    const anims = (this as any).anims as Phaser.Animations.AnimationState | undefined;
    if (!anims) return;
    if (anims.currentAnim?.key !== key) anims.play(key, true);
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
      this.scene.physics.velocityFromRotation(angle, this.speed, body.velocity);
      this.playWalkAnim();

      if (this.moveTarget && !this.targetRock) {
        const dx = this.moveTarget.x - this.x;
        const dy = this.moveTarget.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist <= 6) { // しきい値はお好みで
          const body = this.body as Phaser.Physics.Arcade.Body;
          body?.setVelocity(0, 0);
          this.setPosition(this.moveTarget.x, this.moveTarget.y);
          this.stopAutoMove();
          (this as any).playIdleFromDirection?.();
        }
      }

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
  public updateAction(){

    const left    = (this.cursors.left?.isDown  || this.wasd.A.isDown );
    const right   = (this.cursors.right?.isDown || this.wasd.D.isDown );
    const forward = (this.cursors.up?.isDown    || this.wasd.W.isDown );
    const back    = (this.cursors.down?.isDown  || this.wasd.S.isDown );

      if (this.isAutoMoving?.()) return;
      this.speed=200;
      this.moving = false;
      if (left)    { this.setVelocityX(-this.speed); this.direction = 180; this.moving = true; }
      if (right)   { this.setVelocityX( this.speed); this.direction =   0; this.moving = true; }
      if (forward) { this.setVelocityY(-this.speed); this.direction = 270; this.moving = true; }
      if (back)    { this.setVelocityY( this.speed); this.direction =  90; this.moving = true; }

      const body = this.body as Phaser.Physics.Arcade.Body | undefined;
      const physicallyMoving = !!body && (Math.abs(body.velocity.x) > 1 || Math.abs(body.velocity.y) > 1);

      if (this.moving || physicallyMoving) {
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
  public setup_mic(lower = ""){
          if (/\bforward\b/.test(lower)) { set("forward", true);  set("back",false); set("left",false); set("right",false); }
          if (/\bback\b/.test(lower))    { set("forward", false); set("back",true);  set("left",false); set("right",false); }
          if (/\bleft\b/.test(lower))    { set("forward", false); set("back",false); set("left",true);  set("right",false); }
          if (/\bright\b/.test(lower))   { set("forward", false); set("back",false); set("left",false); set("right",true); }
          if (/\bstop\b/.test(lower))    { set("forward", false); set("back",false); set("left",false); set("right",false); }

          if (/\bshoot\b/.test(lower)) {
            this.shoot(this.direction, {
              speed: 400,
              radius: 8,
              lifespanMs: 1000,
              armDelayMs: 300,
            });
          }
  }
}
