// app/src/entities/Bullet.ts
import Phaser from "phaser";
import { Base } from "./Base";
import { logger } from "../logger";
import { SoundManager } from "../audio/SoundManager";

/** 弾の生成・挙動に関するオプション */
export interface BulletOptions {
  /** 像の移動速度(px/s) */
  speed: number;
  /** 自然消滅までの寿命(ms) */
  lifespanMs: number;
  /** 弾の見た目半径（display 半径） */
  radius: number;
  /** 起爆可能になるまでの遅延(ms) — 時限信管 */
  armDelayMs: number;
  /** 発射者（自己衝突防止用） */
  owner?: Phaser.GameObjects.GameObject;
}

/**
 * 弾（Arcade Physics）
 * 対策A：生成から常に body.enable = true にし、当たり判定の可否は armed フラグで制御する。
 */
export class Bullet extends Base {
  private speed = 500;
  private lifespanMs = 3000;
  private armDelayMs = 300;

  private bornAt = 0;
  private armed = false;
  private owner?: Phaser.GameObjects.GameObject;

  /** 内部メモ：角度（度数法） */
  private angleDeg = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: Partial<BulletOptions> = {}
  ) {
    // テクスチャ名は "bullet" 前提（public/images/bullet.png）
    // 弾は当たり判定を円形で扱うのが前提
    super(scene, x, y, "bullet", 0, "bullet", 1, {
      hitboxShape: "circle",
      hitboxScale: 1.0,
      hitboxPadding: 0,
      showLabel: false,
      drawHitbox: false,
      collideWorldBounds: false,
      immovable: false,
      scale: 1,
      labelDepth: 100,
    });

    this.setOrigin(0.5, 0.5);

    // 既定値を反映
    if (options.speed      !== undefined) this.speed      = options.speed;
    if (options.lifespanMs !== undefined) this.lifespanMs = options.lifespanMs;
    if (options.armDelayMs !== undefined) this.armDelayMs = options.armDelayMs;
    if (options.owner      !== undefined) this.owner      = options.owner;

    // 見た目サイズ（display）を半径ベースで反映
    const r = options.radius ?? 8;
    this.setDisplaySize(r * 2, r * 2);

    // Arcade Body の初期設定
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setBounce(0, 0);
    body.setFriction(0, 0);
    body.setCollideWorldBounds(false);
    // ★ 対策A：ここで body.enable を false にしない（常に true のまま移動させる）

    // ワールド外での自然消滅を拾いたい場合は onWorldBounds を使う
    // ただし collideWorldBounds=false のため、明示的に発生させたい場合はシーン側でハンドリング
    body.onWorldBounds = true;

    // worldbounds 経由の消滅（必要に応じて）
    this.scene.physics.world.on("worldbounds", (b: Phaser.Physics.Arcade.Body) => {
      if (b.gameObject === this) this.vanishAs("bullet_timeout");
    });

    // メタデータ（効果音選別などに使用）
    this.setDataEnabled();
    this.setData("kind", "bullet");
  }

  /** 生成後にパラメータを上書き（チェーン可） */
  configure(opts: Partial<BulletOptions>) {
    if (opts.speed      !== undefined) this.speed      = opts.speed;
    if (opts.lifespanMs !== undefined) this.lifespanMs = opts.lifespanMs;
    if (opts.armDelayMs !== undefined) this.armDelayMs = opts.armDelayMs;
    if (opts.owner      !== undefined) this.owner      = opts.owner;
    if (opts.radius     !== undefined) this.setDisplaySize(opts.radius * 2, opts.radius * 2);
    return this;
  }

  /** 所有者（発射者）を取得 */
  getOwner() { return this.owner; }

  /** 武装（起爆可能）状態か */
  isArmed() { return this.armed; }

  /**
   * 命中可否（process フィルタや onOverlap 内で利用）
   * - アーム前（未武装）は当たらない
   * - 所有者（発射者）には当たらない
   */
  canHit(target: Phaser.GameObjects.GameObject): boolean {
    if (!this.armed) return false;
    if (this.owner && (this.owner === target)) return false;
    return true;
  }

  /**
   * 発射（与角度は度数法）
   * - ★対策A：body.enable は切り替えない
   * - アーム遅延は this.armed を遅延で true に
   */
  fire(angleDeg: number, speedOverride?: number) {
    this.angleDeg = angleDeg;
    const spd = speedOverride ?? this.speed;

    // ベロシティ設定
    const a = Phaser.Math.DegToRad(angleDeg);
    const vx = Math.cos(a) * spd;
    const vy = Math.sin(a) * spd;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);

    // 存在管理
    this.setActive(true).setVisible(true);
    this.bornAt = this.scene.time.now;

    // 起動SE（存在すれば）
    SoundManager.I?.effects?.bulletFire();

    // ★★ 武装は遅延してから
    this.armed = false;
    if (this.armDelayMs <= 0) {
      this.armed = true;
    } else {
      this.scene.time.delayedCall(this.armDelayMs, () => {
        // すでに消滅していれば何もしない
        if (!this.active) return;
        this.armed = true;
      });
    }
  }

  /**
   * 何かに当たった/寿命切れなどで消滅する際の統一口
   * kind:
   *  - "bullet_timeout" …… 寿命/範囲外
   *  - "bullet_collision" … 衝突（弾同士・対象命中含む）
   */
  private vanishAs(kind: "bullet_timeout" | "bullet_collision") {
    // 種類をメタデータに入れて Base#die → DeathFX/Sound 側に渡す
    this.setData("kind", kind);
    this.die();
  }

  /** 外部からのダメージ（弾×弾など） */
  override takeDamage(n = 1) {
    if (this.active && !this.getData("kind")) {
      this.setData("kind", "bullet_collision");
    }
    super.takeDamage(n);
  }

  /** 1フレームごとの更新：寿命判定のみ */
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    // 自然消滅（寿命）
    if (time - this.bornAt >= this.lifespanMs) {
      this.vanishAs("bullet_timeout");
    }
  }
}
