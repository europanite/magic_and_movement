import Phaser from "phaser";
import { CharacterBase } from "./CharacterBase";

export class Player extends CharacterBase {
  public direction: number = 90;

  constructor(scene: Phaser.Scene, x: number, y: number, name = "you", maxHp = 5) {
    super(scene, x, y, "player", 0, name, maxHp, {
      sounds: { death: "se_player_die" },
    });
    this.setData("kind", "player");
  }
}