import Phaser from "phaser";

import { BaseCharacter } from "./BaseCharacter";

export class Enemy extends BaseCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
    super(scene, x, y, "enemy", 0, name, 1);
    this.setData("kind", "enemy");
  }
}
