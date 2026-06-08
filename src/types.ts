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

export interface AlgorithmState {
  stage: number;
  iteration: number;
  stepSize: number;
  value: number; // current target `T` value
  target: TargetCell;
  // ASA specific:
  ASAc?: number;
  nSwitch?: number;
  lastSelection?: Selection | null;
  bnds?: [number, number]; // bounds: specific to BiM & BiM-S
}

// Initial Task setup pass to algorithms for state initialization.
export interface TaskSetup {
  stage: number;
  initialValue: number;
  target: TargetCell;
  bnds: [number, number];
}

export interface UpdateAlgorithm {
  readonly name: string;
  // method: setup initial state (starting point)
  init(setup: TaskSetup): AlgorithmState;
  //method: update value according to selection
  next(state: AlgorithmState, selection: Selection): AlgorithmState;
}

export interface StopCondition {
  readonly name: string;
  isDone(state: AlgorithmState): boolean;
}

export interface SliderSpec {
  bnds: [number, number];
  initial: number;
}

// A interface for algorithm that needs to specify a final slider task
export interface SliderFinalizable {
  sliderFinalize(state: AlgorithmState): SliderSpec;
}

// ============= Experiment Config and Task Description =============

export type BoundScheme = "equal_expectation" | "fixed_bnd";

export interface ExperimentConfig {
  G: number; // > 0
  g: number; // G > g > 0
  l: number; // l < 0
  k: number; // integer >= 1, # of x+ / x- ponits
  boundScheme: BoundScheme;
}

// Description of eliciting a target value (inner loop)
export interface Task {
  name: string; 
  stage: number; // for debugging only. not used in logic
  template: Alternatives; // Fixed alternative outcomes (starting point for target cell)
  target: TargetCell;
  isTargetSureThing: boolean;
  initialValue: number; // starting point
  bnds: [number, number]; // for BiM & BiM-S only. ASA & HaB ignores it
}
