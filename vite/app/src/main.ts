import Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene";
import { MainScene } from "./scenes/MainScene";
import { logger } from "./logger";

logger.info("Booting Phaser...");

const config: Phaser.Types.Core.GameConfig = {
  parent: "game-root",
  scene: [TitleScene, MainScene],
  backgroundColor: "#20242a",
  physics: { default: "arcade", arcade: { } },
};

new Phaser.Game(config);

logger.cmd("Initialized");
