// app/src/commands/Semantics.ts
export type SemanticType =
  | "TURN_LEFT"
  | "TURN_RIGHT"
  | "LIGHT_TOGGLE"
  | "WALK"
  | "STOP"
  | "SHOOT"
  | "SET_DIRECTION"
  | "MOVE_TO_ROCK";

export interface SemanticBase {
  type: SemanticType;
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
  | SemanticSetDirection;

export interface SemanticExecutor {
  exec(s: Semantic): void;
  listRockNames?(): string[];
}
