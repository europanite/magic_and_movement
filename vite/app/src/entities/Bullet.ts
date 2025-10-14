// app/src/entities/Bullet.ts
import Phaser from "phaser";
import { BaseCharacter } from "./BaseCharacter";
import { logger } from "../logger";

export interface BulletOptions {
  speed: number;
  lifespanMs: number;
  radius: number;
  armDelayMs: number;   // ← 追加：時限信管（アーム遅延）
}

export class Bullet extends BaseCharacter {
  private speed = 500;
  private lifespanMs = 3000;
  private armDelayMs = 1300;
  private bornAt = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string = "bullet",
    frame?: number | null
  ) {
    super(scene, x, y, textureKey, frame ?? 0, "", 1, {
      immovable: true,
      collideWorldBounds: false,
      showLabel: false,
      labelDepth: 0,
    });

    this.bornAt = scene.time.now;

    // 画面外で自壊
    this.scene.physics.world.on("worldbounds", (b: Phaser.Physics.Arcade.Body) => {
      if (b.gameObject === this) this.die();
    });

    this.setDepth(10);
  }

  /** 後からオプションを一括設定（チェーン可） */
  configure(opts: Partial<BulletOptions>) {
    if (opts.speed       !== undefined) this.speed       = opts.speed;
    if (opts.lifespanMs  !== undefined) this.lifespanMs  = opts.lifespanMs;
    if (opts.armDelayMs  !== undefined) this.armDelayMs  = opts.armDelayMs;
    if (opts.radius      !== undefined) {
      const d = Math.max(1, Math.round(opts.radius * 2));
      this.setDisplaySize(d, d); // 見た目更新 → BaseCharacter が body 同期
    }
    return this;
  }

  /** 武装（アーム）済みか？ */
  public isArmed(): boolean {
    let b = (this.scene.time.now - this.bornAt) >= this.armDelayMs;
    logger.cmd(`this.scene.time.now ${this.scene.time.now}`);
    logger.cmd(`this.bornAt ${this.bornAt}`);
    logger.cmd(`this.armDelayMs ${this.armDelayMs}`);
    logger.cmd(`this.scene.time.now - this.bornAt ${this.scene.time.now - this.bornAt}`);
    return b;
  }

  /** 発射（角度は度数法） */
  fire(angleDeg: number, speed = this.speed) {
    this.bornAt = this.scene.time.now;
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.scene.physics.velocityFromAngle(angleDeg, speed, body.velocity);
    this.setAngle(angleDeg);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    // 寿命で自然消滅
    if (time - this.bornAt >= this.lifespanMs) {
      // 通常の死亡処理の前に種別を上書き
      this.setData("kind", "bullet_timeout");
      this.die();
    }
  }
}
