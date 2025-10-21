// app/src/audio/CharacterSound.ts
import Phaser from "phaser";

export class CharacterSound {
  constructor(private scene: Phaser.Scene) {}

  playDeath(kind: "friendly" | "enemy" | "boss") {
    const key = {
      friendly: "se_friendly_die",
      enemy: "se_enemy_die",
      boss: "se_boss_die",
    }[kind];
    this.scene.sound.play(key, { volume: 0.8 });
  }

  playHit() {
    this.scene.sound.play("se_hit", { volume: 0.6 });
  }
}
