export interface Alternatives {
  left: { payoffA: number; payoffB: number };
  right: { payoffA: number; payoffB: number };
}

export type Selection = "left" | "right";

export type PayoffField = "payoffA" | "payoffB";

export interface TargetCell {
  side: Selection;
  field: PayoffField;
}

// 演算法在迭代間需要保存的狀態（決定更新量大小）
export interface AlgorithmState {
  stage: number;
  iteration: number;
  stepSize: number;
  target: TargetCell;
  // ASA specific:
  ASAc?: number;
  nSwitch?: number;
  lastSelection?: Selection | null;
  bnds?: [number, number]; // bounds: specific to BiM & BiM-S
}

// 每一步回傳的結果：下一輪要顯示的數值 + 新狀態
export interface Step {
  alternatives: Alternatives;
  state: AlgorithmState;
}

export interface UpdateAlgorithm {
  readonly name: string;

  // 初始化：回傳第一輪要顯示的數值與初始狀態
  init(): Step;


  next(current: Alternatives, state: AlgorithmState, selection: Selection): Step;
}

export interface StopCondition {
  readonly name: string;
  isDone(state: AlgorithmState): boolean;
}

// slider 收尾步驟的範圍（BiM-S 的最後一步 matching 用）
export interface SliderSpec {
  bnds: [number, number];
  initial: number;
}

// 可選能力：停止條件成立時，若演算法實作此介面，
// 外殼不直接結束，而是多呈現一個 slider matching 步驟。
export interface SliderFinalizable {
  sliderFinalize(state: AlgorithmState, current: Alternatives): SliderSpec;
}
