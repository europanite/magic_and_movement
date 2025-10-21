import Phaser from "phaser";
import { Base } from "./Base";

export class Point extends Base {

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w = 96,
    h = 96,
    name = "point",
    hp = 3
  ) {
    // 1) Texture
    if (!scene.textures.exists("point")) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x87cefa, 1).fillRect(0, 0, w, h);
      g.lineStyle(2, 0x2b241d, 0.6).strokeRect(0, 0, w, h);
      g.generateTexture("point", w, h);
      g.destroy();
    }

    // 2) Base Initialize
    super(scene, x, y, "point", 0, name, hp, {
      immovable: true,
      collideWorldBounds: false,
      showLabel: true,
      labelDepth: 10,
      drawHitbox: true,
      hitboxShape: "rect",
      hitboxScale: 1.0,
      hitboxPadding: 0,
      scale: 1,
    });
    this.setDepth(10);

    // 3) Display size
    this.w = w; 
    this.h = h;
    this.setDisplaySize(w, h);

    // Data tags
    this.setDataEnabled();
    this.setData("kind", "point");
    this.setData("name", name.toLowerCase());

    // 4) Stop
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setVelocity(0, 0);
    body.moves = false;
  }
}
