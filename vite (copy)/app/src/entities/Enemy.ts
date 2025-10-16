import Phaser from "phaser";
import { CharacterBase } from "./CharacterBase";

export class Enemy extends CharacterBase {
  constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
    super(scene, x, y, "enemy", 0, name, 1, {
      sounds: { death: "se_enemy_die" },
    });
    this.setData("kind", "enemy");
  }
}