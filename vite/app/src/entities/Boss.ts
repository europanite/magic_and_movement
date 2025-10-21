// app/src/entities/Boss.ts
import Phaser from "phaser";
import { Character } from "./Character";

export class Boss extends Character {
  constructor(scene: Phaser.Scene, x: number, y: number, name: string, maxHp = 30) {
    super(scene, x, y, "boss", 0, name, maxHp, {
      sounds: { death: "se_boss_die" },
      hitboxShape: "circle",
      hitboxScale: 0.45,
      hitboxPadding: 0,
      scale: 2.5,
    });
    this.setData("kind", "boss");
  }
}
