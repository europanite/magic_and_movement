import Phaser from "phaser";

import { BaseCharacter } from "./BaseCharacter";

export class Boss extends BaseCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number, name: string, maxHp = 30) {
    // 画像は暫定で 'boss'（既存では enemy_sheet 流用）。見た目を大きくしたいので scale=2
    super(scene, x, y, "boss", 0, name, maxHp, { scale: 2, labelDepth: 10 });
    this.setData("kind", "boss");
  }
}

