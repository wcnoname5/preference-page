// 一次呈現給受試者的兩個選項。
// 第一版固定每個選項兩欄 payoff（A、B）。
export interface Alternatives {
  left: { payoffA: number; payoffB: number };
  right: { payoffA: number; payoffB: number };
}

// 受試者選了哪邊
export type Selection = "left" | "right";

// 演算法在迭代間需要保存的狀態（決定更新量大小）
export interface AlgorithmState {
  stage: number;
  iteration: number;
  stepSize: number;
}

// 演算法每一步回傳的結果：下一輪要顯示的數值 + 新狀態
export interface Step {
  alternatives: Alternatives;
  state: AlgorithmState;
}

// 更新演算法的抽象介面
export interface UpdateAlgorithm {
  readonly name: string;

  // 初始化：回傳第一輪要顯示的數值與初始狀態
  init(): Step;

  // 根據這次選擇，計算下一輪要顯示的數值與新狀態。
  // 由演算法自己決定要改哪一格（回傳完整的下一輪 Alternatives）。
  next(current: Alternatives, state: AlgorithmState, selection: Selection): Step;
}

// 結束條件的抽象介面
export interface StopCondition {
  readonly name: string;
  isDone(state: AlgorithmState): boolean;
}
