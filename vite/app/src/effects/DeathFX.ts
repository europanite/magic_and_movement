// app/src/effects/DeathFX.ts
import Phaser from "phaser";

type DeathKind = "player" | "enemy" | "boss" | "bullet_timeout" | "bullet_collision";


export class DeathFX {
  /** 種類別の推奨SEキー */
  static seKey(kind: DeathKind): string {
    switch (kind) {
        case "player": return "se_player_die";
        case "boss":   return "se_boss_die";
        case "enemy":  return "se_enemy_die";
        case "bullet_timeout": return "se_bullet_timeout";
        case "bullet_collision": return "se_bullet_collision"; // ←追加
    }
  }

    static playSE(scene: Phaser.Scene, key: string, detune = 0, volume = 0.8) {
    const exists = scene.cache.audio.exists(key);
    if (!exists) {
        console.warn(`[SE] Missing audio key: ${key}`);
        return;
    }

    scene.sound.play(key, { detune, volume });
    }

  /** 粒子エミッタ（bullet.png を使う） */
  static burstParticles(scene: Phaser.Scene, x: number, y: number, tint?: number) {
    const p = scene.add.particles(0, 0, "bullet", {
      x, y,
      speed: { min: 80, max: 260 },
      angle: { min: 0, max: 360 },
      lifespan: 420,
      scale: { start: 0.6, end: 0 },
      quantity: 26,
      tint,
      blendMode: "ADD",
    });
    scene.time.delayedCall(480, () => p.destroy());
  }

  /** 本体のフェード＆回転＆拡大 */
  static tweenVanish(scene: Phaser.Scene, go: Phaser.GameObjects.Sprite, onComplete?: () => void) {
    scene.tweens.add({
      targets: go,
      duration: 380,
      rotation: go.rotation + Phaser.Math.DegToRad(65),
      scale: go.scale * 1.35,
      alpha: 0,
      ease: "cubic.in",
      onComplete: () => onComplete && onComplete(),
    });
  }

  /** 白フラッシュ（短い） */
  static flash(scene: Phaser.Scene, go: Phaser.GameObjects.Sprite) {
    go.setTintFill(0xffffff);
    scene.time.delayedCall(60, () => go.clearTint());
  }

  /** 入口：死亡演出＋SE。完了後に destroy() まで面倒を見る */
  static play(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite & { destroy: () => void }, kind: DeathKind) {
    // 1) フラッシュ
    this.flash(scene, sprite);

    // 2) SE
    this.playSE(scene, this.seKey(kind), kind === "boss" ? -200 : 0, kind === "player" ? 0.9 : 0.7);

    // 3) 粒子（色味を種類で少し変える）
    const tint = kind === "player" ? 0x80d0ff : kind === "boss" ? 0xff8080 : 0xffe080;
    this.burstParticles(scene, sprite.x, sprite.y, tint);

    // 4) カメラちょい揺れ（ボスは強め）
    const cam = scene.cameras.main;
    cam.shake(kind === "boss" ? 200 : 120, kind === "boss" ? 0.01 : 0.006);

    // 5) 本体トゥイーン → 破棄
    this.tweenVanish(scene, sprite, () => sprite.destroy());
  }
}
