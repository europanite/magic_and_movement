export interface HasBodyAndAngle {
  x: number;
  y: number;
  angle?: number;
  rotation?: number;
  body?: { width?: number; height?: number; radius?: number };
}

export function getMuzzleSpawn(
  shooter: HasBodyAndAngle,
  angleDeg: number,
  bulletRadius: number,
  padding = 2 
): { x: number; y: number } {
  const w = shooter.body?.width ?? 0;
  const h = shooter.body?.height ?? 0;
  const shooterHitRadius =
    shooter.body?.radius ??
    Math.max(w, h) * 0.5 || 12;

  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);

  const muzzle = shooterHitRadius + bulletRadius + padding;

  return {
    x: shooter.x + dx * muzzle,
    y: shooter.y + dy * muzzle,
  };
}
