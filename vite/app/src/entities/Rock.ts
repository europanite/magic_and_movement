import Phaser from "phaser";
import { Base } from "./Base";

/**
 * Rock: Base 継承版
 * - 動的ボディだが immovable（押されない）
 * - 表示は単色テクスチャを動的生成して矩形サイズに拡大
 * - ヒットボックスは "rect" で displaySize と同期
 */
export class Rock extends Base {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    name: string
  ) {
    // 1x1 の動的テクスチャを用意（なければ生成）
    const key = "rock_tex";
    if (!scene.textures.exists(key)) {
      const g = scene.add.graphics();
      g.fillStyle(0x5b4b3a, 1).fillRect(0, 0, 8, 8);
      g.generateTexture(key, 8, 8);
      g.destroy();
    }

    super(scene, x, y, key, 0, name, Number.POSITIVE_INFINITY, {
      immovable: true,
      showLabel: true,
      hitboxShape: "rect",
      hitboxScale: 1.0,
      hitboxPadding: 0,
      labelDepth: 50,
      drawHitbox: false,
    });

    // 表示サイズ＝当たりサイズ
    this.setDisplaySize(w, h);
    this.setTint(0x5b4b3a);
    this.setData("kind", "rock");
    this.setData("name", name);

    // 輪郭線が必要なら軽いライン表現（任意）
    // ラインはスプライトでは描きづらいので不要なら削除
  }
}
