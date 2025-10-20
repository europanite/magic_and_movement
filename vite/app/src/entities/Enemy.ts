import Phaser from "phaser";
import { Character } from "./Character";

export class Enemy extends Character {
  constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
    super(scene, x, y, "enemy", 0, name, 1, {
      sounds: { death: "se_enemy_die" },
    });
    this.setData("kind", "enemy");
  }
}