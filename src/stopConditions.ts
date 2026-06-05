import { AlgorithmState, StopCondition } from "./types.js";

// End when iteration >= n
export class FixedIterations implements StopCondition {
  readonly name = "FixedIterations";

  constructor(private readonly n: number) {}

  isDone(state: AlgorithmState): boolean {
    return state.iteration >= this.n;
  }
}

// End whenstepSize < threshold or reach a max iteration limit (20)
export class Convergence implements StopCondition {
  readonly name = "Convergence";

  constructor(private readonly threshold: number) {}

  isDone(state: AlgorithmState): boolean {
    return state.stepSize < this.threshold || state.iteration >= 20; // sets a max iteration limit
  }
}
