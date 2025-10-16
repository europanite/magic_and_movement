import Phaser from "phaser";
import { SoundManager } from "../audio/SoundManager";

export class TitleScene extends Phaser.Scene {
  private titleImage!: Phaser.GameObjects.Image;
  private startButton!: Phaser.GameObjects.Text;
  private optionButton!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private bg!: Phaser.GameObjects.Image;

  constructor() {
    super("TitleScene");
  }

  preload() {
    this.load.image("title", "images/title.png");
    this.load.audio("bgm_title", "audio/title.mp3");
    this.load.audio("se_ui_select", "audio/bullet_timeout.mp3");
  }

  create() {
    SoundManager.init(this);

    const w = this.scale.width;
    const h = this.scale.height;

    // 背景（中央配置 + アスペクト比維持）
    this.bg = this.add.image(w / 2, h / 2, "title").setOrigin(0.5, 0.5);
    this.fitCover(this.bg, w, h);

    // タイトル
    const title = this.add.text(w / 2, h * 0.25, "Magic and Movement", {
      font: "48px serif",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    });
    title.setOrigin(0.5, 0.5);

    // スタートボタン
    this.startButton = this.add.text(w / 2, h * 0.6, "Start Game", {
      font: "32px monospace",
      color: "#ffffaa",
      backgroundColor: "#00000055",
      padding: { x: 16, y: 8 },
    })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.startGame());

    // オプションボタン
    this.optionButton = this.add.text(w / 2, h * 0.72, "Options", {
      font: "28px monospace",
      color: "#aaffff",
      backgroundColor: "#00000055",
      padding: { x: 16, y: 8 },
    })
      .setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.sound.play("se_ui_select", { volume: 0.6 });
        this.scene.start("OptionScene");
      });

    // ヒント
    this.hintText = this.add
      .text(w / 2, h * 0.85, "Press SPACE or click the Start button", {
        font: "20px monospace",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0.5);

    // BGM
    const bgm = this.sound.add("bgm_title", { loop: true, volume: 0.5 });
    bgm.play();

    // Spaceキーで開始
    this.input.keyboard!.on("keydown-SPACE", () => this.startGame());

    // 画面リサイズ時もスケーリング調整
    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      this.fitCover(this.bg, gameSize.width, gameSize.height);
    });
  }

  private fitCover(img: Phaser.GameObjects.Image, targetW: number, targetH: number) {
    const tex = this.textures.get(img.texture.key).getSourceImage() as HTMLImageElement;
    if (!tex) return;

    const iw = tex.width;
    const ih = tex.height;
    const scale = Math.max(targetW / iw, targetH / ih);
    img.setScale(scale).setPosition(targetW / 2, targetH / 2);
  }

  private startGame() {
    this.sound.stopAll();
    this.scene.start("MainScene");
  }
}