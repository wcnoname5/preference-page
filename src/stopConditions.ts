import { AlgorithmState, StopCondition } from "./types.js";

// 固定 iteration：iteration >= n 時結束
export class FixedIterations implements StopCondition {
  readonly name = "FixedIterations";

  constructor(private readonly n: number) {}

  isDone(state: AlgorithmState): boolean {
    return state.iteration >= this.n;
  }
}

// 收斂：stepSize < threshold 時結束
export class Convergence implements StopCondition {
  readonly name = "Convergence";

  constructor(private readonly threshold: number) {}

  isDone(state: AlgorithmState): boolean {
    return state.stepSize < this.threshold;
  }
}
