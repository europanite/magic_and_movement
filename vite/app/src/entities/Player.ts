import Phaser from "phaser";
import { BaseCharacter } from "./BaseCharacter";

/** 方向角を既存コードから参照しているためプロパティを持たせる */
export class Player extends BaseCharacter {
  public direction: number = 90; // 0:右, 90:下, 180:左, 270:上（既存の使い方に合わせる）

  constructor(scene: Phaser.Scene, x: number, y: number, name = "you", maxHp = 5) {
    // 既存のプレイヤー画像キー 'player' を使用
    super(scene, x, y, "player", 0, name, maxHp);
    this.setData("kind", "player");
  }
}
