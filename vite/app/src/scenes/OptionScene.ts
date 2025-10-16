import Phaser from "phaser";

export class OptionScene extends Phaser.Scene {
  private ui!: Phaser.GameObjects.Container;
  private volValueText!: Phaser.GameObjects.Text;
  private muteValueText!: Phaser.GameObjects.Text;

  constructor() {
    super("OptionScene");
  }

  preload() {
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // 背景
    this.add.rectangle(0, 0, w * 2, h * 2, 0x0b0f16, 1).setOrigin(0);

    // タイトル
    this.add.text(w / 2, h * 0.18, "Options", {
      fontFamily: "system-ui, monospace",
      fontSize: "56px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.ui = this.add.container(0, 0);

    // UI Commons
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "system-ui, monospace",
      fontSize: "24px",
      color: "#dfe9ff",
      stroke: "#000",
      strokeThickness: 3,
    };
    const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "system-ui, monospace",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000",
      strokeThickness: 3,
      backgroundColor: "#2b3340",
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
    };

    const rowY1 = h * 0.35;
    const rowY2 = h * 0.46;
    const colL  = w * 0.35;
    const colR  = w * 0.62;

    // ========== Master Volume ==========
    this.add.text(colL, rowY1, "Master Volume", labelStyle).setOrigin(1, 0.5);

    const decVol = this.makeTextButton(colR - 140, rowY1, " - ", () => this.addVolume(-0.1));
    const incVol = this.makeTextButton(colR + 140, rowY1, " + ", () => this.addVolume(+0.1));
    this.volValueText = this.add.text(colR, rowY1, this.formatVolume(this.sound.volume), valueStyle).setOrigin(0.5);

    // ========== Mute ==========
    this.add.text(colL, rowY2, "Mute (All Sound)", labelStyle).setOrigin(1, 0.5);

    const toggleMute = this.makeTextButton(colR, rowY2, "Toggle", () => this.toggleMute()).setOrigin(0.5);
    this.muteValueText = this.add.text(colR + 160, rowY2, this.sound.mute ? "ON" : "OFF", valueStyle).setOrigin(0.5);

    // ========== Buttons (Back / Title) ==========
    const back = this.makeWideButton(w / 2, h * 0.68, "← Back to Title", () => {
      this.scene.start("TitleScene");
    });

    this.ui.add([decVol, incVol, toggleMute, back]);

    // ESC / B Return
    this.input.keyboard?.on("keydown-ESC", () => this.scene.start("TitleScene"));
    this.input.keyboard?.on("keydown-B",   () => this.scene.start("TitleScene"));

    // Resize
    this.scale.on("resize", (sz: Phaser.Structs.Size) => this.onResize(sz.width, sz.height));
  }

  // ------------- helpers -------------
  private onResize(w: number, h: number) {

  }

  private makeTextButton(x: number, y: number, label: string, onClick: () => void) {
    const t = this.add.text(x, y, label, {
      fontFamily: "system-ui, monospace",
      fontSize: "28px",
      color: "#ffffff",
      backgroundColor: "#2b3340",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", onClick)
      .on("pointerover", () => t.setAlpha(0.85))
      .on("pointerout",  () => t.setAlpha(1));
    return t;
  }

  private makeWideButton(x: number, y: number, label: string, onClick: () => void) {
    return this.makeTextButton(x, y, label, onClick);
  }

  private addVolume(delta: number) {
    const v = Phaser.Math.Clamp(this.sound.volume + delta, 0, 1);
    this.sound.volume = v;
    this.volValueText.setText(this.formatVolume(v));
  }

  private toggleMute() {
    this.sound.mute = !this.sound.mute;
    this.muteValueText.setText(this.sound.mute ? "ON" : "OFF");
  }

  private formatVolume(v: number) {
    return ` ${Math.round(v * 100)}% `;
  }
}
