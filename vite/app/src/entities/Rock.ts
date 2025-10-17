// app/src/entities/Rock.ts
import Phaser from "phaser";
import { Base } from "./Base";

/**
 * Rock
 * - Base 継承（HP/死亡演出/ラベル/ヒットボックス同期を共通化）
 * - HP=3
 * - 質量∞的ふるまい（Arcade: immovable + moves=false）
 * - 見た目：矩形テクスチャ（なければ動的生成）
 * - ヒットボックス：矩形
 */
export class Rock extends Base {
  private w: number;
  private h: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w = 96,
    h = 96,
    name = "rock",
    hp = 3
  ) {
    // 1) テクスチャ確保（無ければ生成）
    if (!scene.textures.exists("rock")) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x5b4b3a, 1).fillRect(0, 0, w, h);
      g.lineStyle(2, 0x2b241d, 0.6).strokeRect(0, 0, w, h);
      g.generateTexture("rock", w, h);
      g.destroy();
    }

    // 2) Base 初期化（矩形ヒットボックス／不動指定）
    super(scene, x, y, "rock", 0, name, hp, {
      immovable: true,           // ← 反発時も動かない
      collideWorldBounds: false,
      showLabel: true,
      labelDepth: 100,
      drawHitbox: true,
      hitboxShape: "rect",       // ← 矩形で当てる
      hitboxScale: 1.0,
      hitboxPadding: 0,
      scale: 1,
    });

    // 3) 表示サイズ＝ヒットボックスに一致させる
    this.w = w; this.h = h;
    this.setDisplaySize(w, h);

    // DeathFX の種別フォールバックは Base 側が持っているので不要だが、
    // 敵系演出を流用したいなら "enemy" にしておく（任意）
    this.setDataEnabled();
    this.setData("kind", "enemy");

    // 4) 物理ふるまいを完全停止
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocity(0, 0);
    body.moves = false;          // ← フレーム積分も止める（実質 Static 的）
  }

  /** スケール変更時もヒットボックスは Base が同期するが、念のため矩形保持 */
  override setDisplaySize(width: number, height: number): this {
    this.w = width; this.h = height;
    return super.setDisplaySize(width, height);
  }

  /** 念のため毎フレームも速度ゼロ＆不動を強制 */
  preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    const b = this.body as Phaser.Physics.Arcade.Body;
    if (b) { b.setVelocity(0, 0); b.moves = false; }
  }
}
