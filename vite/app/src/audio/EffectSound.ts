// app/src/audio/EffectSound.ts
import Phaser from "phaser";

export class EffectSound {
  constructor(private scene: Phaser.Scene) {}

  bulletFire() {
    const key = "se_bullet_fire";
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: 0.55 });
    }
  }

  bulletCollision() {
    const key = "se_bullet_collision";
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: 0.6 });
    }
  }

  bulletTimeout() {
    const key = "se_bullet_timeout";
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: 0.5 });
    }
  }

  uiSelect() {
    const key = "se_ui_select";
    if (this.scene.cache.audio.exists(key)) {
      this.scene.sound.play(key, { volume: 0.5 });
    }
  }
}