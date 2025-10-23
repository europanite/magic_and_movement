import Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene";
import { MainScene01 } from "./scenes/MainScene01";
import { OptionScene } from "./scenes/OptionScene";
import { GameResultsScene } from "./scenes/GameResultsScene";
import { EscapeScene01 } from "./scenes/EscapeScene01";
import { logger } from "./logger"

logger.info("Booting Phaser...");

const BASE_W = 1200;
const BASE_H = 900;

const config: Phaser.Types.Core.GameConfig = {
  parent: "game-root",
  type: Phaser.AUTO,
  width: BASE_W,
  height: BASE_H,
  backgroundColor: "#20242a",
  physics: { default: "arcade", arcade: { debug: true } },
  scene: [TitleScene, EscapeScene01, OptionScene, MainScene01, GameResultsScene],
  scale: {
    mode: Phaser.Scale.FIT,
  },
};

new Phaser.Game(config);

logger.cmd("Initialized");