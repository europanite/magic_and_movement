// app/src/entities/Bullet.ts
import Phaser from "phaser";
import { Base } from "./Base";
import { logger } from "../logger";
import { SoundManager } from "../audio/SoundManager";

export interface BulletOptions {
  speed: number;
  lifespanMs: number;
  radius: number;
  armDelayMs: number;   // ← 追加：時限信管（アーム遅延）
}

export class Bullet extends Base {
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
      this.setDisplaySize(d, d);
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

    // ★ 発射時だけ鳴らす
    if (SoundManager.I?.effects?.bulletFire) {
      SoundManager.I.effects.bulletFire();
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    this.scene.physics.velocityFromAngle(angleDeg, speed, body.velocity);
    this.setAngle(angleDeg);
  }

  /** 消滅種別を明示してから通常死処理へ */
  private vanishAs(kind: "bullet_timeout" | "bullet_collision") {
    this.setData("kind", kind);
    this.die();
  }

  override takeDamage(n = 1) {
    if (this.active && !this.getData("kind")) {
      this.setData("kind", "bullet_collision");
    }
    super.takeDamage(n);
  }

  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);

    // ★（削除）ここでSEを鳴らさない
    // SoundManager.I.effects.bulletTimeout(); ← これが連続再生の元凶

    // 寿命で自然消滅：一度だけ timeout SE
    if (time - this.bornAt >= this.lifespanMs) {
      this.vanishAs("bullet_timeout");
    }
  }
}
