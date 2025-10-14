// app/src/audio/SoundManager.ts
import Phaser from "phaser";
import { CharacterSound } from "./CharacterSound";
import { EffectSound } from "./EffectSound";

export class SoundManager {
  private static _inst: SoundManager;
  private scene!: Phaser.Scene;
  public characters!: CharacterSound;
  public effects!: EffectSound;

  static init(scene: Phaser.Scene) {
    if (!this._inst) this._inst = new SoundManager(scene);
    return this._inst;
  }

  static get I() { return this._inst; }

  private constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.characters = new CharacterSound(scene);
    this.effects = new EffectSound(scene);
  }
}
