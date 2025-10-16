import Phaser from "phaser";
import { CharacterBase } from "./CharacterBase";
import { logger } from "../logger";

export class Player extends CharacterBase {
  public direction: number = 90;

  private moveTarget: Phaser.Math.Vector2 | null = null;
  private targetRock: Phaser.GameObjects.Rectangle | null = null;
  private moveSpeed = 180;
  private interrupted = false;
  private clampEnabled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, name = "you", maxHp = 5) {
    super(scene, x, y, "player", 0, name, maxHp, {
      sounds: { death: "se_player_die" },
      collideWorldBounds: true,
    });
    this.setData("kind", "player");
  }

  /** 岩を目的地にセット（向くだけ。歩行は walk コマンドで開始） */
  moveToRock(target: Phaser.GameObjects.Rectangle) {
    this.moveTarget = new Phaser.Math.Vector2(target.x, target.y);
    this.targetRock = target;
    // 向くだけ（歩かせない）
    const ang = Math.atan2(target.y - this.y, target.x - this.x);
    this.setDirection(Phaser.Math.RadToDeg(ang));
    logger.info(`Aim: facing rock "${target.getData("name")}"`);
    this.startAutoMove(); // ★ 追加：ターゲット設定と同時に歩行開始
  }

  /** ナビ開始（目的地が設定済みなら歩行を開始） */
  startAutoMove() {
    if (!this.moveTarget) return;
    this.setSpeed(this.moveSpeed);
    logger.info("Auto-move started.");
  }

  /** ナビ停止（速度0＋目的地解除） */
  public stopAutoMove() {
    this.stop(); // speed=0 により CharacterBase が停止処理＆アニメ停止に移行
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.checkCollision.none = false;
    this.moveTarget = null;
    this.targetRock = null;
  }

  public interruptAutoMove() {
    if (this.isAutoMoving()) {
      logger.info("Auto-move interrupted by user input.");
      this.stopAutoMove();
      this.interrupted = true;
    }
  }

  public isAutoMoving(): boolean {
    return !!this.moveTarget && this.speed > 0;
  }

  /** 画面内クランプ */
  private keepInsideCameraView() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;
    const cam = this.scene.cameras.main;
    const view = cam.worldView;
    const halfW = body.width * 0.5;
    const halfH = body.height * 0.5;
    const minX = view.left + halfW;
    const maxX = view.right - halfW;
    const minY = view.top + halfH;
    const maxY = view.bottom - halfH;
    this.x = Phaser.Math.Clamp(this.x, minX, maxX);
    this.y = Phaser.Math.Clamp(this.y, minY, maxY);
    body.position.x = this.x - halfW;
    body.position.y = this.y - halfH;
  }

  /** 毎フレーム：まずナビ処理で speed/direction を更新 → 親の運動モデルに委譲 */
  preUpdate(time: number, delta: number) {
    // ===== ① ナビ処理（速度・向きだけを更新し、速度適用は親に任せる） =====
    if (this.interrupted) { this.interrupted = false; /* 1フレームだけスキップ */ }
    else if (this.moveTarget) {
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;
      const ang = Math.atan2(dy, dx);
      this.setDirection(Phaser.Math.RadToDeg(ang));

      // 目的地に向けて歩行（walk コマンドが来ていない場合は speed=0 のまま）
      if (this.speed > 0) {
        // 到着判定（岩ヒットボックス優先／なければ距離しきい値）
        let arrived = false;

        if (this.targetRock && (this.targetRock.body as Phaser.Physics.Arcade.StaticBody)) {
          const body = this.body as Phaser.Physics.Arcade.Body;
          const pr = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
          const rb = this.targetRock.body as Phaser.Physics.Arcade.StaticBody;
          const rr = new Phaser.Geom.Rectangle(rb.x, rb.y, rb.width, rb.height);
          if (Phaser.Geom.Intersects.RectangleToRectangle(pr, rr)) arrived = true;
        } else {
          const dist2 = dx * dx + dy * dy;
          arrived = dist2 <= (24 * 24); // 距離しきい値（px）
        }

        if (arrived) {
          this.stopAutoMove(); // ★必ず停止
          logger.info("Arrived at rock. Auto-move stopped.");
        }
      }
    }

    // ===== ② 親側で speed/direction → velocity & アニメ同期 =====
    super.preUpdate(time, delta);

    // ===== ③ 可視範囲クランプ =====
    const cam = this.scene.cameras.main;
    if (!this.clampEnabled) {
      if (cam.worldView.contains(this.x, this.y)) this.clampEnabled = true;
    } else {
      this.keepInsideCameraView();
    }
  }

  // CharacterBase.onWalkFrame が歩行アニメを方向に合わせて再生するので、Player 側は上書き不要
}
