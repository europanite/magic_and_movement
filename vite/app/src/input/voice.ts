// app/src/input/voice.ts
import { Rock } from "../entities/Rock";

// applyVoiceCmds 内の moveToRock 分岐だけ置換
case "moveToRock": {
  const rock = player.scene.children
    .getAll()
    .find(o => o.getData && o.getData("kind") === "rock" && o.getData("name") === c.name) as Rock | undefined;
  if (rock) player.moveToRock(rock);
  break;
}
