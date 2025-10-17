// app/src/entities/Base.ts
import Phaser from "phaser";
import { DeathFX } from "../effects/DeathFX";
import type { DeathKind } from "../effects/DeathFX";
import { syncHitboxToDisplay as syncHB } from "../utils/hitbox";

export type BaseOptions = {
  scale?: number;
  immovable?: boolean;
  collideWorldBounds?: boolean;
  showLabel?: boolean;
  labelDepth?: number;
  drawHitbox?: boolean;
  hitboxShape?: "circle" | "rect";
  hitboxScale?: number;
  hitboxPadding?: number;
};

export class Base extends Phaser.Physics.Arcade.Sprite {
  public maxHp = 1;
  public hp = 1;

  protected nameTag?: Phaser.GameObjects.Text;
  protected opts: Required<BaseOptions>;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame: number | string = 0,
    public displayName: string = "",
    maxHp = 1,
    options: BaseOptions = {}
  ) {
    super(scene, x, y, texture, frame);

    this.opts = {
      scale: options.scale ?? 1,
      immovable: options.immovable ?? false,
      collideWorldBounds: options.collideWorldBounds ?? false,
      showLabel: options.showLabel ?? true,
      labelDepth: options.labelDepth ?? 100,
      drawHitbox: options.drawHitbox ?? true,
      hitboxShape: options.hitboxShape ?? "circle",
      hitboxScale: options.hitboxScale ?? 1.0,
      hitboxPadding: options.hitboxPadding ?? 0,
    };

    this.maxHp = maxHp;
    this.hp = maxHp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    if (this.opts.scale !== 1) this.setScale(this.opts.scale);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(!!this.opts.immovable);
    body.setCollideWorldBounds(!!this.opts.collideWorldBounds);

    this.syncHitboxToDisplay();

    if (this.opts.showLabel) {
      this.nameTag = scene.add.text(this.x, this.y - this.displayHeight * 0.5 - 8, this.displayName, {
        fontSize: "18px",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 2,
      }).setDepth(this.opts.labelDepth);
    }
  }

  protected syncHitboxToDisplay() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    syncHB(this as any, {
      hitboxShape: this.opts.hitboxShape,
      scaleFactor: this.opts.hitboxScale,
      padding: this.opts.hitboxPadding,
    });
  }

  setScale(x: number, y?: number): this {
    super.setScale(x, y);
    if (this.body) this.syncHitboxToDisplay();
    return this;
  }

  setFrame(frame: string | number): this {
    super.setFrame(frame);
    if (this.body) this.syncHitboxToDisplay();
    return this;
  }

  /** HPを減算し、0以下なら死ぬ */
  public takeDamage(n = 1) {
    this.hp = Math.max(0, this.hp - n);
    if (this.hp <= 0) this.die();
  }

  /** 外部からも死亡判定を参照可能に */
  public isDead(): boolean {
    return this.hp <= 0 || !this.active;
  }

  protected die() {
    // 再入防止
    if (this.getData("__dying")) return;
    this.setData("__dying", true);

    this.nameTag?.destroy();

    // kind フォールバックを強化（未設定や想定外でも "enemy" に統一）
    const raw = this.getData("kind");
    const kind: DeathKind =
      raw === "friendly" ||
      raw === "enemy" ||
      raw === "boss" ||
      raw === "bullet_timeout" ||
      raw === "bullet_collision"
        ? (raw as DeathKind)
        : "enemy";
    if (raw !== kind) this.setData("kind", kind);

    // 即時無効化
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.enable = false;

    // エフェクト発火（破棄は DeathFX 側で）
    DeathFX.play(this.scene, this as unknown as Phaser.GameObjects.Sprite, kind);
  }

  /** 1フレームごとにHP=0の個体を整理 */
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.hp <= 0 && this.active) {
      this.die();
      return;
    }

    if (this.nameTag && this.active) {
      this.nameTag.setPosition(this.x, this.y - this.displayHeight * 0.5 - 8);
    }
  }
}
