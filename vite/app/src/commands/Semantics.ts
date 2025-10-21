// app/src/commands/Semantics.ts
export type SemanticType =
  | "GO_FORWARD"
  | "GO_BACK"
  | "GO_LEFT"
  | "GO_RIGHT"
  | "TURN_LEFT"
  | "TURN_RIGHT"
  | "TURN_BACK"
  | "LIGHT_TOGGLE"
  | "WALK"
  | "STOP"
  | "SHOOT"
  | "SET_DIRECTION"
  | "MOVE_TO_ROCK"
  | "MOVE_TO_POINT"
  | "ATTACK_ENEMY";

export interface SemanticBase {
  type: SemanticType;
}

export interface SemanticMoveToPoint extends SemanticBase {
  type: "MOVE_TO_POINT";
  name: string;
}

export interface SemanticAttackEnemy extends SemanticBase {
  type: "ATTACK_ENEMY";
  name: string;
}

export interface SemanticMoveToRock extends SemanticBase {
  type: "MOVE_TO_ROCK";
  name: string;
}

export interface SemanticSetDirection extends SemanticBase {
  type: "SET_DIRECTION";
  degrees: number;
}

export type Semantic =
  | SemanticBase
  | SemanticMoveToRock
  | SemanticMoveToPoint
  | SemanticSetDirection
  | SemanticAttackEnemy

export interface SemanticExecutor {
  exec(s: Semantic): void;
  listRockNames?(): string[];
  listPointNames?(): string[];
}
