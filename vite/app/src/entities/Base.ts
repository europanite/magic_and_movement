import Phaser from "phaser";
import { DeathFX } from "../effects/DeathFX";

export type BaseOptions = {
  scale?: number;
  immovable?: boolean;
  collideWorldBounds?: boolean;
  showLabel?: boolean;
  labelDepth?: number;
  drawHitbox?: boolean;
};

export class Base extends Phaser.Physics.Arcade.Sprite {
  static DEBUG_HITBOXES = true;
  protected maxHp = 1;
  protected hp = 1;
  protected nameTag?: Phaser.GameObjects.Text;
  protected hitboxGfx?: Phaser.GameObjects.Graphics;
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
    };

    this.maxHp = maxHp;
    this.hp = maxHp;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    if (this.opts.scale !== 1) this.setScale(this.opts.scale);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(this.opts.immovable);
    this.setCollideWorldBounds(this.opts.collideWorldBounds);

    this.syncHitboxToDisplay();

    if (this.opts.showLabel && this.displayName) {
      this.nameTag = scene.add.text(this.x, this.y, this.displayName, {
        font: "14px monospace",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(this.opts.labelDepth);
    }

    this.hitboxGfx = scene.add.graphics().setDepth(10000);
  }

  protected syncHitboxToDisplay() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const w = Math.max(1, Math.round(this.displayWidth));
    const h = Math.max(1, Math.round(this.displayHeight));
    body.setSize(w, h, true);
  }

  public isArmed(): boolean {
    return false;
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

  public setHitboxSize(width: number, height: number) {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(Math.max(1, Math.round(width)), Math.max(1, Math.round(height)), true);
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
    // ① 再入防止
    if (this.getData("__dying")) return;
    this.setData("__dying", true);

    this.nameTag?.destroy();
    this.hitboxGfx?.destroy();

    const kind = (this.getData("kind") as "player"|"enemy"|"boss") ?? "enemy";

    // ② まず即時に無効化して preUpdate からもう呼ばれないようにする
    this.setActive(false).setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (body) body.enable = false;

    // ③ 破棄は DeathFX 側に任せる（ここで destroy しない！）
    //    DeathFX.play は tween 完了時に destroy する実装に統一
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

    if (this.hitboxGfx && Base.DEBUG_HITBOXES && this.opts.drawHitbox) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      this.hitboxGfx.clear();
      this.hitboxGfx.lineStyle(1, 0x00ff00, 0.9);
      this.hitboxGfx.strokeRect(body.x, body.y, body.width, body.height);
    }
  }
}
