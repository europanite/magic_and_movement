import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  private bgm!: Phaser.Sound.BaseSound;
  private bg!: Phaser.GameObjects.Image;
  private scrim!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Graphics;
  private uiContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super("TitleScene");
  }

  preload() {
    this.load.audio("audio_title", "audio/title.mp3");
    this.load.image("title_bg", "images/title.png");
    this.load.audio("se_bullet_collision","audio/bullet_timeout.mp3");
  }

  create() {
    const w = this.scale.width, h = this.scale.height;

    // BGM
    this.bgm = this.sound.add("audio_title", { loop: true, volume: 0.4 });
    this.bgm.play();

    this.bg = this.add.image(w / 2, h / 2, "title_bg").setOrigin(0.5, 0.5);
    this.bg.setScrollFactor(0);
    this.fitCover(this.bg, w, h);

    this.scrim = this.add.graphics().setScrollFactor(0).setDepth(5);
    this.drawScrim(this.scrim, w, h, 0.38);

    this.vignette = this.add.graphics().setScrollFactor(0).setDepth(6);
    this.drawVignette(this.vignette, w, h);

    this.uiContainer = this.add.container(0, 0).setDepth(10);

    const { titleSize, subSize, hintSize, columnY } = this.computeLayout(w, h);

    this.titleText = this.add.text(w / 2, columnY - 40, "Magic & Movement", {
      fontFamily: "monospace",
      fontSize: `${titleSize}px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: Math.max(4, Math.round(titleSize * 0.15)),
    })
      .setOrigin(0.5)
      .setShadow(0, Math.max(2, Math.round(titleSize * 0.06)), "#000", Math.max(8, Math.round(titleSize * 0.25)), true, true);
    this.uiContainer.add(this.titleText);

    this.subtitleText = this.add.text(w / 2, columnY + 10, "Say names or press keys", {
      fontFamily: "monospace",
      fontSize: `${subSize}px`,
      color: "#dfe9ff",
      stroke: "#000000",
      strokeThickness: Math.max(3, Math.round(subSize * 0.18)),
    })
      .setOrigin(0.5)
      .setShadow(0, Math.max(2, Math.round(subSize * 0.08)), "#000", Math.max(6, Math.round(subSize * 0.3)), true, true);
    this.uiContainer.add(this.subtitleText);

    const menuY = columnY + 70;
    const spacing = Math.max(12, Math.round(h * 0.015));
    const buttonWidth = Math.min(520, Math.round(w * 0.6));
    const buttonHeight = Math.max(44, Math.round(h * 0.06));
    const labelSize = Math.max(16, Math.round(buttonHeight * 0.42));

    const startBtn = this.makeButton(
      w / 2, 
      menuY, 
      buttonWidth, 
      buttonHeight, 
      "▶ Start", () => this.startGame(), 
      labelSize);

    const escapeBtn = this.makeButton(
      w / 2,
      menuY + (buttonHeight + spacing),
      buttonWidth,
      buttonHeight,
      "Escape",
      () => {
        if (this.bgm?.isPlaying) this.bgm.stop();
        this.input.keyboard?.removeAllListeners();
        this.input.removeAllListeners();
        this.scene.start("EscapeScene01");
      },
      labelSize
    );

    const optionsBtn = this.makeButton(
      w / 2,
      menuY + 2 * (buttonHeight + spacing),
      buttonWidth,
      buttonHeight,
      "Options",
      () => this.scene.start("OptionScene"),
      labelSize
    );

    this.uiContainer.add([startBtn, escapeBtn, optionsBtn]);

    this.hintText = this.add.text(w / 2, h - Math.max(24, Math.round(h * 0.04)), "Press SPACE / Click / Tap to Start", {
      fontFamily: "monospace",
      fontSize: `${hintSize}px`,
      color: "#eeeeee",
      stroke: "#000000",
      strokeThickness: Math.max(2, Math.round(hintSize * 0.2)),
    })
      .setOrigin(0.5)
      .setShadow(0, Math.max(1, Math.round(hintSize * 0.1)), "#000", Math.max(4, Math.round(hintSize * 0.3)), true, true)
      .setDepth(10);

    const start = () => this.startGame();
    this.input.keyboard!.on("keydown-SPACE", start);
    this.hintText.setInteractive({ useHandCursor: true })
      .on("pointerup", start);

    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      const { width, height } = gameSize;
      this.onResize(width, height);
    });
  }

  private startGame() {
    if (this.bgm?.isPlaying) this.bgm.stop();
    this.input.keyboard!.removeAllListeners();
    this.input.removeAllListeners();
    this.scene.start("MainScene01");
  }

  private flashHint() {
    this.tweens.add({
      targets: this.hintText,
      alpha: 0.2,
      duration: 120,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
    });
  }

  private fitCover(img: Phaser.GameObjects.Image, targetW: number, targetH: number) {
    const tex = this.textures.get(img.texture.key).getSourceImage() as HTMLImageElement;
    const iw = tex?.width ?? 0, ih = tex?.height ?? 0;
    if (!iw || !ih) return;
    const scale = Math.max(targetW / iw, targetH / ih);
    img.setScale(scale).setPosition(targetW / 2, targetH / 2);
  }

  private drawScrim(g: Phaser.GameObjects.Graphics, w: number, h: number, alpha = 0.35) {
    g.clear();
    g.fillStyle(0x000000, alpha);
    g.fillRect(0, 0, w, h);
  }

  private drawVignette(g: Phaser.GameObjects.Graphics, w: number, h: number) {
    g.clear();
    const rings = 6;
    for (let i = 0; i < rings; i++) {
      const pad = i * Math.max(6, Math.round(Math.min(w, h) * 0.01));
      const a = 0.12 - i * (0.12 / rings);
      if (a <= 0) break;
      g.lineStyle(Math.max(12, Math.round(Math.min(w, h) * 0.02)), 0x000000, a);
      g.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    }
  }

  private computeLayout(w: number, h: number) {
    const titleSize = Math.max(28, Math.round(h * 0.085));
    const subSize = Math.max(14, Math.round(h * 0.035));
    const hintSize = Math.max(12, Math.round(h * 0.03));
    const columnY = Math.round(h * 0.36);
    return { titleSize, subSize, hintSize, columnY };
  }

  private makeButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
    fontPx: number
  ) {
    const bg = this.add.rectangle(0, 0, w, h, 0x000000, 0.45)
      .setStrokeStyle(2, 0xffffff, 0.2)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(0, 0, label, {
      fontFamily: "monospace",
      fontSize: `${fontPx}px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: Math.max(2, Math.round(fontPx * 0.18)),
    })
      .setOrigin(0.5)
      .setShadow(0, Math.max(1, Math.round(fontPx * 0.1)), "#000", Math.max(4, Math.round(fontPx * 0.3)), true, true);

    const c = this.add.container(x, y, [bg, text]);

    // hover / press
    bg.on("pointerover", () => bg.setFillStyle(0x000000, 0.62));
    bg.on("pointerout",  () => bg.setFillStyle(0x000000, 0.45));
    bg.on("pointerdown", () => {
      this.sound.play("se_bullet_collision", { volume: 0.5 });
      bg.setFillStyle(0xffffff, 0.18);
    });
    bg.on("pointerup",   () => {
      bg.setFillStyle(0x000000, 0.62);
      onClick();
    });

    return c;
  }

  private onResize(w: number, h: number) {
    this.fitCover(this.bg, w, h);
    this.drawScrim(this.scrim, w, h, 0.38);
    this.drawVignette(this.vignette, w, h);

    const { titleSize, subSize, hintSize, columnY } = this.computeLayout(w, h);

    this.titleText
      .setFontSize(titleSize)
      .setStroke("#000", Math.max(4, Math.round(titleSize * 0.15)))
      .setShadow(0, Math.max(2, Math.round(titleSize * 0.06)), "#000", Math.max(8, Math.round(titleSize * 0.25)), true, true)
      .setPosition(w / 2, columnY - 40);

    this.subtitleText
      .setFontSize(subSize)
      .setStroke("#000", Math.max(3, Math.round(subSize * 0.18)))
      .setShadow(0, Math.max(2, Math.round(subSize * 0.08)), "#000", Math.max(6, Math.round(subSize * 0.3)), true, true)
      .setPosition(w / 2, columnY + 10);

    const spacing = Math.max(12, Math.round(h * 0.015));
    const buttonWidth = Math.min(520, Math.round(w * 0.6));
    const buttonHeight = Math.max(44, Math.round(h * 0.06));
    const labelSize = Math.max(16, Math.round(buttonHeight * 0.42));
    const menuY = columnY + 70;

    const [startBtn, howtoBtn, optionsBtn] = this.uiContainer.list.filter(n => n instanceof Phaser.GameObjects.Container) as Phaser.GameObjects.Container[];

    const reframe = (btn: Phaser.GameObjects.Container, i: number) => {
      btn.setPosition(w / 2, menuY + i * (buttonHeight + spacing));
      const rect = btn.list[0] as Phaser.GameObjects.Rectangle;
      const label = btn.list[1] as Phaser.GameObjects.Text;
      rect.setSize(buttonWidth, buttonHeight);
      label.setFontSize(labelSize)
           .setStroke("#000", Math.max(2, Math.round(labelSize * 0.18)))
           .setShadow(0, Math.max(1, Math.round(labelSize * 0.1)), "#000", Math.max(4, Math.round(labelSize * 0.3)), true, true);
    };

    reframe(startBtn, 0);
    reframe(howtoBtn, 1);
    reframe(optionsBtn, 2);

    this.hintText
      .setFontSize(hintSize)
      .setStroke("#000", Math.max(2, Math.round(hintSize * 0.2)))
      .setShadow(0, Math.max(1, Math.round(hintSize * 0.1)), "#000", Math.max(4, Math.round(hintSize * 0.3)), true, true)
      .setPosition(w / 2, h - Math.max(24, Math.round(h * 0.04)));
  }
}
