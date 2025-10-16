import Phaser from "phaser";

export function syncHitboxToDisplay(
  obj: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
  opts: { hitboxShape?: "circle" | "rect"; scaleFactor?: number; padding?: number } = {}
) {
  const hitboxShape = opts.hitboxShape ?? "circle";
  const scaleFactor = opts.scaleFactor ?? 1.0;
  const padding     = opts.padding ?? 0;

  const wDisp = Math.max(1, obj.displayWidth  - padding * 2);
  const hDisp = Math.max(1, obj.displayHeight - padding * 2);

  const body = obj.body as Phaser.Physics.Arcade.Body;

  if (hitboxShape === "circle") {
    const r = Math.max(1, (Math.min(wDisp, hDisp) * scaleFactor) * 0.5);

    body.setCircle(r);

    const dOx = obj.displayOriginX;         // = displayWidth * originX
    const dOy = obj.displayOriginY;         // = displayHeight * originY

    body.setOffset(dOx - r, dOy - r);
  } else {
    const bw = Math.max(1, wDisp * scaleFactor);
    const bh = Math.max(1, hDisp * scaleFactor);

    body.setSize(bw, bh);

    const dOx = obj.displayOriginX;
    const dOy = obj.displayOriginY;
    body.setOffset(dOx - bw * 0.5, dOy - bh * 0.5);
  }

  body.updateFromGameObject();
}
