import {
  AlgorithmState,
  Selection,
  SliderFinalizable,
  SliderSpec,
  TargetCell,
  TaskSetup,
  UpdateAlgorithm,
} from "./types";
import { DEFAULT_ASAc } from "./config";

// Bisection Helpers 
const midpoint = ([a, b]: [number, number]): number => (a + b) / 2;
const halfWidth = ([a, b]: [number, number]): number => (b - a) / 2;

export function resolveTarget(state: AlgorithmState): TargetCell {
  return state.target;
}

// ============= Update Algorithms =============
// algorithms only updated Current State (e.g., the target's value), alternative display is handled by task module
// heuristic: if selection matches target side (selection === state.target.side) → decrease value; else increase value.

export class HaB implements UpdateAlgorithm {
  readonly name = "HaB";

  init(setup: TaskSetup): AlgorithmState {
    return {
      stage: setup.stage,
      iteration: 0,
      stepSize: Math.abs(setup.initialValue) / 2,
      value: setup.initialValue,
      target: setup.target,
    };
  }

  next(state: AlgorithmState, selection: Selection): AlgorithmState {
    const delta = selection === state.target.side ? -state.stepSize : state.stepSize;
    return {
      stage: state.stage,
      iteration: state.iteration + 1,
      stepSize: state.stepSize / 2,
      value: Math.round(state.value + delta),
      target: state.target,
    };
  }
}

export class ASA implements UpdateAlgorithm {
  readonly name = "ASA";

  init(setup: TaskSetup): AlgorithmState {
    return {
      stage: setup.stage,
      iteration: 0,
      stepSize: 320,
      value: setup.initialValue,
      target: setup.target,
      nSwitch: 0,
      lastSelection: null,
      ASAc: DEFAULT_ASAc,
    };
  }

  next(state: AlgorithmState, selection: Selection): AlgorithmState {
    if (state.ASAc === undefined) throw new Error("ASAc not defined in state");
    if (state.nSwitch === undefined) throw new Error("nSwitch not defined in state");

    const trialN = state.iteration + 1; // trial number starts from 1 for calculation
    const theta = 0.5;
    const Z = selection === state.target.side ? 1 : 0;
    const delta =
      trialN === 1 || trialN === 2
        ? -(state.ASAc / trialN) * (Z - theta)
        : -(state.ASAc / (2 + state.nSwitch)) * (Z - theta);

    return {
      stage: state.stage,
      iteration: trialN,
      stepSize: Math.abs(delta),
      value: Math.round(state.value + delta),
      target: state.target,
      lastSelection: selection,
      nSwitch: selection === state.lastSelection ? state.nSwitch : state.nSwitch + 1,
      ASAc: state.ASAc,
    };
  }
}


export class BiM implements UpdateAlgorithm {
  readonly name = "BiM";

  init(setup: TaskSetup): AlgorithmState {
    return {
      stage: setup.stage,
      iteration: 0,
      stepSize: halfWidth(setup.bnds),
      value: midpoint(setup.bnds),
      target: setup.target,
      bnds: setup.bnds,
    };
  }

  next(state: AlgorithmState, selection: Selection): AlgorithmState {
    if (!state.bnds) {
      throw new Error("`bnds` not in state");
    }
    const m = midpoint(state.bnds);
    const newBnds: [number, number] =
      selection === state.target.side ? [state.bnds[0], m] : [m, state.bnds[1]];

    return {
      stage: state.stage,
      iteration: state.iteration + 1,
      stepSize: halfWidth(newBnds),
      value: Math.round(midpoint(newBnds)),
      target: state.target,
      bnds: newBnds,
    };
  }
}

// BiM-S composite UpdateAlgorithm and SliderFinalizable
export class BiMS implements UpdateAlgorithm, SliderFinalizable {
  // Note: a small mismatch is that BiM-S will produce one more iteration if a fixed iteration stop condition is used.
  readonly name = "BiM-S";
  private readonly bisection = new BiM();

  init(setup: TaskSetup): AlgorithmState {
    return this.bisection.init(setup);
  }

  next(state: AlgorithmState, selection: Selection): AlgorithmState {
    return this.bisection.next(state, selection);
  }

  sliderFinalize(state: AlgorithmState): SliderSpec {
    if (!state.bnds) {
      throw new Error("`bnds` not in state");
    }
    const width = state.bnds[1] - state.bnds[0];
    const min = Math.round(state.bnds[0] - width);
    const max = Math.round(state.bnds[1] + width);
    return { bnds: [min, max], initial: Math.round(midpoint(state.bnds)) };
  }
}
