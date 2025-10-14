import Phaser from "phaser";

export class Rock extends Phaser.GameObjects.Rectangle {
  nameTag: Phaser.GameObjects.Text;
  // 追加: ヒットボックス描画用
  private hitboxGfx: Phaser.GameObjects.Graphics;

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

    // === ヒットボックス可視化 ===
    this.hitboxGfx = scene.add.graphics().setDepth(10_000);
    const redraw = () => {
      const b = this.body as Phaser.Physics.Arcade.StaticBody;
      this.hitboxGfx.clear();
      this.hitboxGfx.lineStyle(1, 0x00ff00, 0.9);
      this.hitboxGfx.strokeRect(b.x, b.y, b.width, b.height);
    };
    scene.events.on("postupdate", redraw);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off("postupdate", redraw);
      this.hitboxGfx.destroy();
      this.nameTag.destroy();
    });

    // 初回描画
    redraw();
  }
}
