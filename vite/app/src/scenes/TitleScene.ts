import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  private bgm!: Phaser.Sound.BaseSound;
  private bg!: Phaser.GameObjects.Image;

  constructor() {
    super("TitleScene");
  }

  preload() {
    // 既存：タイトルBGM
    this.load.audio("audio_title", "audio/title.mp3");
    // 追加：タイトル背景
    this.load.image("title_bg", "images/title.png");
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // BGM
    this.bgm = this.sound.add("audio_title", { loop: true, volume: 0.4 });
    this.bgm.play();

    // 背景（cover スケールで全面表示）
    this.bg = this.add.image(w / 2, h / 2, "title_bg").setOrigin(0.5, 0.5);
    this.bg.setScrollFactor(0);
    this.fitCover(this.bg, w, h);

    // タイトル/UI（背景より前面に）
    this.add.text(w / 2, h / 2 - 40, "Shout & Move", { font: "32px monospace", color: "#fff" })
      .setOrigin(0.5);
    this.add.text(w / 2, h / 2 + 10, "Say names or press keys", { font: "16px monospace", color: "#aaf" })
      .setOrigin(0.5);
    this.add.text(w / 2, h / 2 + 40, "Press SPACE / Click / Tap to Start", { font: "14px monospace", color: "#ccc" })
      .setOrigin(0.5);

    // スタート関数
    const start = () => {
      this.bgm.stop();
      this.input.keyboard!.off("keydown-SPACE", start);
      this.input.off("pointerdown", start);
      this.scene.start("MainScene");
    };

    // 入力イベント
    this.input.keyboard!.on("keydown-SPACE", start);
    this.input.on("pointerdown", start);

    // ウィンドウサイズ変化に追従
    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.bg.setPosition(width / 2, height / 2);
      this.fitCover(this.bg, width, height);
    });
  }

  // 画像の縦横比を維持したまま、画面全体をカバーするスケールを当てる
  private fitCover(img: Phaser.GameObjects.Image, targetW: number, targetH: number) {
    const tex = this.textures.get(img.texture.key).getSourceImage() as HTMLImageElement;
    const iw = tex.width, ih = tex.height;
    if (!iw || !ih) return;
    const scale = Math.max(targetW / iw, targetH / ih);
    img.setScale(scale);
  }
}
