// app/src/effects/DeathFX.ts
import Phaser from "phaser";

export type DeathKind = "friendly" | "enemy" | "boss" | "bullet_timeout" | "bullet_collision";

function isDeathKind(v: any): v is DeathKind {
  return v === "friendly" || v === "enemy" || v === "boss" || v === "bullet_timeout" || v === "bullet_collision";
}

export class DeathFX {
  /** 種類別の推奨SEキー（★ default を用意） */
  static seKey(kind: DeathKind): string {
    switch (kind) {
      case "friendly":           return "se_friendly_die";
      case "boss":             return "se_boss_die";
      case "enemy":            return "se_enemy_die";
      case "bullet_timeout":   return "se_bullet_timeout";
      case "bullet_collision": return "se_bullet_collision";
      default:                 return "se_enemy_die";
    }
  }

  static playSE(scene: Phaser.Scene, key: string, detune = 0, volume = 0.8) {
    if (!scene.cache.audio.exists(key)) {
      console.warn(`[SE] Missing audio key: ${key}`);
      return;
    }
    scene.sound.play(key, { detune, volume } as any);
  }

  /**
   * 破裂演出（Phaser 3.60+ 互換）
   * - パーティクルを使わず、小さなスプライトを放射状に飛ばしてフェードアウト
   * - 余計なマネージャを使わないので v3.60 の削除APIに触れない
   */
  static burstParticles(scene: Phaser.Scene, x: number, y: number, tint: number) {
    const texKey = "bullet";
    if (!scene.textures.exists(texKey)) return;

    const COUNT = 20;
    for (let i = 0; i < COUNT; i++) {
      const img = scene.add.image(x, y, texKey);
      img.setOrigin(0.5).setScale(0.35).setAlpha(1).setDepth(1000).setTint(tint);

      // 角度と距離をランダムに
      const ang = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(60, 180);
      const dur = Phaser.Math.Between(380, 520);

      const tx = x + Math.cos(ang) * dist;
      const ty = y + Math.sin(ang) * dist;

      scene.tweens.add({
        targets: img,
        x: tx,
        y: ty,
        scale: 0,
        alpha: 0,
        duration: dur,
        ease: "Cubic.easeOut",
        onComplete: () => img.destroy(),
      });
    }
  }

  static tweenVanish(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, onComplete?: () => void) {
    scene.tweens.add({
      targets: sprite,
      duration: 250,
      scaleX: sprite.scaleX * 0.7,
      scaleY: sprite.scaleY * 0.7,
      alpha: 0,
      onComplete: () => onComplete?.(),
    });
  }

  /** 破壊演出のメイン入口（kindは安全にフォールバック） */
  static play(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, rawKind: any) {
    const kind: DeathKind = isDeathKind(rawKind) ? rawKind : "enemy";

    // 1) SE
    this.playSE(scene, this.seKey(kind), kind === "boss" ? -200 : 0, kind === "friendly" ? 0.9 : 0.7);

    // 2) 放射スプライト（色味を種類で少し変える）
    const tint =
      kind === "friendly" ? 0x80d0ff :
      kind === "boss"   ? 0xff8080 :
      0xffe080;
    this.burstParticles(scene, sprite.x, sprite.y, tint);

    // 3) カメラシェイク
    const cam = scene.cameras.main;
    cam.shake(kind === "boss" ? 200 : 120, kind === "boss" ? 0.01 : 0.006);

    // 4) 本体フェード → 破棄
    this.tweenVanish(scene, sprite, () => sprite.destroy());
  }
}
