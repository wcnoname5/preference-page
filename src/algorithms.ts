import { Alternatives, AlgorithmState, Selection, Step, UpdateAlgorithm } from "./types.js";

// HaB（Halving and Bisection 風格的骨架）
//
// Toy example：
//   left  固定為 { payoffA: 2000, payoffB: -2000 }
//   right 初始為 { payoffA: 0,    payoffB: 0    }
//   初始狀態 { stage: 1, iteration: 0, stepSize: 1000 }
//
// 每一步：同時更新 right 的 payoffA 與 payoffB。
//   選左邊 → right 兩個 payoff 都 - stepSize
//   選右邊 → right 兩個 payoff 都 + stepSize
// 下一輪 stepSize 砍半，iteration + 1。
export class HaB implements UpdateAlgorithm {
  readonly name = "HaB";

  init(): Step {
    return {
      alternatives: {
        left: { payoffA: 2000, payoffB: -2000 },
        right: { payoffA: 0, payoffB: 0 },
      },
      state: { stage: 1, iteration: 0, stepSize: 1000 },
    };
  }

  next(current: Alternatives, state: AlgorithmState, selection: Selection): Step {
    const delta = selection === "left" ? +state.stepSize : -state.stepSize;

    return {
      alternatives: {
        left: current.left,
        right: {
          payoffA: current.right.payoffA + delta,
          payoffB: current.right.payoffB + delta,
        },
      },
      state: {
        stage: state.stage,
        iteration: state.iteration + 1,
        stepSize: state.stepSize / 2,
      },
    };
  }
}
