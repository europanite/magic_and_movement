import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("TitleScene");
  }

  preload() {
    this.load.audio("audio_title", "audio/title.mp3");
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    this.bgm = this.sound.add("audio_title", { loop: true, volume: 0.4 });
    this.bgm.play();

    this.cameras.main.setBackgroundColor(0x20242a);
    this.add.text(w / 2, h / 2 - 40, "Shout & Move", { font: "32px monospace", color: "#fff" }).setOrigin(0.5);
    this.add.text(w / 2, h / 2 + 10, "Say names or press keys", { font: "16px monospace", color: "#aaf" }).setOrigin(0.5);
    this.add.text(w / 2, h / 2 + 40, "Press SPACE / Click / Tap to Start", { font: "14px monospace", color: "#ccc" }).setOrigin(0.5);

    // ✅ 関数を先に定義
    const start = () => {
      this.bgm.stop();
      this.input.keyboard!.off("keydown-SPACE", start);
      this.input.off("pointerdown", start);
      this.scene.start("MainScene");
    };

    // ✅ その後でイベント登録
    this.input.keyboard!.on("keydown-SPACE", start);
    this.input.on("pointerdown", start);
  }
}
