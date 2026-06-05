import {
  Alternatives,
  AlgorithmState,
  Selection,
  SliderFinalizable,
  SliderSpec,
  Step,
  TargetCell,
  UpdateAlgorithm,
} from "./types.js";

const DEFAULT_TARGET: TargetCell = { side: "right", field: "payoffA" };
const DEFAULT_ASAc: number = 320;

export function resolveTarget(state: AlgorithmState): TargetCell {
  return state.target;
}

type DefaultState = Pick<AlgorithmState, "iteration">;

const initState: DefaultState = {
  iteration: 0
};

// 區間小工具（BiM / BiM-S 用）
const midpoint = ([a, b]: [number, number]): number => (a + b) / 2;
const halfWidth = ([a, b]: [number, number]): number => (b - a) / 2;

export class HaB implements UpdateAlgorithm {
  readonly name = "HaB";

  init(): Step {
    return {
      alternatives: {
        left: { payoffA: 2000, payoffB: -2000 },
        right: { payoffA: 0, payoffB: 0 },
      },
      state: { ...initState, stage: 1, stepSize: 1000, target: DEFAULT_TARGET },
    };
  }

  next(current: Alternatives, state: AlgorithmState, selection: Selection): Step {
    const targetSide = resolveTarget(state).side;
    const delta = selection === targetSide ? -state.stepSize : state.stepSize;

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
        target: state.target,
      },
    };
  }
}

export class ASA implements UpdateAlgorithm {
  readonly name = "ASA";

  init(): Step {
    return {
      alternatives: {
        left: { payoffA: 2000, payoffB: -2000 },
        right: { payoffA: 0, payoffB: 0 },
      },
      state: { ...initState, stage: 1, stepSize: 320 , nSwitch: 0, lastSelection: null, ASAc: DEFAULT_ASAc,  target: DEFAULT_TARGET},
    };
  }

  next(current: Alternatives, state: AlgorithmState, selection: Selection): Step {
    const targetSide = resolveTarget(state).side;
    const trialN = state.iteration + 1; // trial number starts from 1 for calculation
    const theta = 0.5;
    const Z = selection === targetSide ? 1 : 0;
    function updateDelta(): number {
      if (state.ASAc === undefined) {
        throw new Error("ASAc not definded in state");
      }
      if (state.nSwitch === undefined) {
        throw new Error("nSwitch not definded in state");
      }

      if (trialN === 1 || trialN === 2) {
        return -(state.ASAc/trialN) * (Z - theta);
      }
      return -(state.ASAc / (2 + state.nSwitch!)) * (Z - theta);
    }
    const delta = updateDelta();


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
        iteration: trialN,
        stepSize: Math.abs(delta),
        lastSelection: selection,
        nSwitch: selection === state.lastSelection ? state.nSwitch! : state.nSwitch! + 1,
        ASAc: state.ASAc,
        target: state.target,
      },
    };
  }
}

// BiM（標準二分法）：維護一個區間 (a, b)，目標 T 取中點。
// 含 T 的選項（這裡是 right）被選 → 保留下半 (a, m)；否則保留上半 (m, b)。
export class BiM implements UpdateAlgorithm {
  readonly name = "BiM";

  init(): Step {
    const bnds: [number, number] = [0, 2000]; // 初始區間 (a, b)，需涵蓋目標 T
    const mid = midpoint(bnds);               // 第一輪 T 為區間中點
    return {
      alternatives: {
        left: { payoffA: 2000, payoffB: -2000 },
        right: { payoffA: mid, payoffB: mid },
      },
      state: { ...initState, stage: 1, stepSize: halfWidth(bnds), bnds, target: DEFAULT_TARGET },
    };
  }

  next(current: Alternatives, state: AlgorithmState, selection: Selection): Step {
    if (!state.bnds) {
      throw new Error("BiM 的 state 缺少 bnds");
    }
    const targetSide = resolveTarget(state).side;
    const m = midpoint(state.bnds);
    const newBnds: [number, number] =
      selection === targetSide ? [state.bnds[0], m] : [m, state.bnds[1]];
    const mid = midpoint(newBnds);

    return {
      alternatives: {
        left: current.left,
        right: { payoffA: mid, payoffB: mid },
      },
      state: {
        stage: state.stage,
        iteration: state.iteration + 1,
        stepSize: halfWidth(newBnds),
        bnds: newBnds,
        target: state.target,
      },
    };
  }
}


// BiM-S（Bisection with Slider）： inhertits BiM, only switch to slider in final stage
export class BiMS implements UpdateAlgorithm, SliderFinalizable {
  // Note: a small mismatch is that BiM-S will produce one more iteration if a fixed iteration stop condition is used.
  readonly name = "BiM-S";
  private readonly bisection = new BiM();

  init(): Step {
    return this.bisection.init();
  }

  next(current: Alternatives, state: AlgorithmState, selection: Selection): Step {
    // BiM stage
    return this.bisection.next(current, state, selection);
  }

  sliderFinalize(state: AlgorithmState, _current: Alternatives): SliderSpec {
    if (!state.bnds) {
      throw new Error("BiM-S 的 state 缺少 bnds");
    }

    const center = midpoint(state.bnds);
    const width = state.bnds[1] - state.bnds[0];
    // slider range = 最後一個 BiM 區間的 3 倍（左右各外擴一個區間寬），取整數。
    const min = Math.round(state.bnds[0] - width);
    const max = Math.round(state.bnds[1] + width);
    return { bnds: [min, max], initial: center };
  }
}