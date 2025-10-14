import Phaser from "phaser";

export class Rock extends Phaser.GameObjects.Rectangle {
  nameTag: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, name: string) {
    super(scene, x, y, w, h, 0x5b4b3a);
    scene.add.existing(this);

    // 物理(Static Body)
    scene.physics.add.existing(this, true);
    // サイズを矩形に厳密同期（中心基準）
    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(w, h, true);

    // 見た目
    this.setStrokeStyle(2, 0x2b241d, 0.6);
    this.setData("name", name);

    this.nameTag = scene.add.text(x - w / 2, y - h / 2 - 14, name, {
      font: "14px monospace",
      color: "#fff",
      stroke: "#000",
      strokeThickness: 3,
    });
  }
}
