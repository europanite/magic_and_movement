import Phaser from "phaser";

type GameResultsData = {
  reason?: "defeated" | "timeout" | "fell";
  score?: number;
  timeMs?: number;
  retryScene?: string;
};

export class GameResultsScene extends Phaser.Scene {
  private ui!: Phaser.GameObjects.Container;

  
  constructor() {
    super("GameResultsScene");
  }

  preload() {
  }

  create(data: GameResultsData) {
  
    const retryKey = data?.retryScene ?? "MainScene01"; // Fall Back

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(0, 0, w * 2, h * 2, 0x000000, 0.85).setOrigin(0);

    const title = this.add.text(w / 2, h * 0.35, "GAME Results", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "64px",
      color: "#ffffff",
      stroke: "#000",
      strokeThickness: 6,
    }).setOrigin(0.5);

    const reason = this.add.text(w / 2, h * 0.45,
      data?.reason ? `Reason: ${data.reason}` : "",
      { fontSize: "20px", color: "#cccccc" }
    ).setOrigin(0.5);

    const stats = this.add.text(w / 2, h * 0.50,
      [
        data?.score != null ? `Score: ${data.score}` : "",
        data?.timeMs != null ? `Time: ${(data.timeMs / 1000).toFixed(1)}s` : "",
      ].filter(Boolean).join("   "),
      { fontSize: "18px", color: "#aaaaaa" }
    ).setOrigin(0.5);

    // Buttons（Title／Retry）
    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: "28px",
      color: "#ffffff",
      backgroundColor: "#2b3340",
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
    };

    const btnRetry = this.add.text(w / 2, h * 0.6, "Retry", btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });

    btnRetry.on("pointerup", () => {
      this.scene.start(retryKey);
    });

    const btnTitle = this.add.text(w / 2, h * 0.7, "Back to Title", btnStyle)
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnTitle.on("pointerup", () => this.scene.start("TitleScene"));

    this.tweens.add({ targets: title, alpha: 0.5, yoyo: true, repeat: -1, duration: 900 });
    this.ui = this.add.container(0, 0, [title, reason, stats, btnRetry, btnTitle]).setDepth(1000);
  }
}
