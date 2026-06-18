import {
  stdSeq,
  AlgorithmState,
  Alternatives,
  ExperimentConfig,
  Selection,
  SliderFinalizable,
  SliderSpec,
  StopCondition,
  Task,
  UpdateAlgorithm,
} from "./types";
import { resolveTarget } from "./algorithms";
import { buildTask, placeTarget, targetNames } from "./tasks";
import { LossAversionResult, TaskLogger } from "./taskLogger";

// 演算法是否支援 slider 收尾步驟（目前只有 BiM-S）
function isSliderFinalizable(algo: UpdateAlgorithm): algo is UpdateAlgorithm & SliderFinalizable {
  return typeof (algo as Partial<SliderFinalizable>).sliderFinalize === "function";
}

// 一列 debug 表格的資料（取代舊 View.log 直接建 DOM）
export interface DebugRow {
  iteration: number;
  targetValue: number;
  stepSize: number;
  bnds: string;
}

export type Phase = "choosing" | "slider" | "roundDone" | "done";

// React 從這個 snapshot 完整重畫實驗畫面，不需要碰 DOM
export interface ExperimentState {
  taskHeader: string;
  status: string;
  alternatives: Alternatives;
  algoState: AlgorithmState;
  debugRows: DebugRow[];
  phase: Phase;
  sliderSpec?: SliderSpec;
  result?: { sequence: stdSeq; lossAversion: LossAversionResult };
}

function statusLine(header: string, state: AlgorithmState): string {
  return `${header} · Iteration ${state.iteration} · Step Size = ${Math.round(state.stepSize)} · Target Value = ${state.value}`;
}

function debugRow(alt: Alternatives, state: AlgorithmState): DebugRow {
  const target = resolveTarget(state);
  return {
    iteration: state.iteration,
    targetValue: alt[target.side][target.field],
    stepSize: state.stepSize,
    bnds: state.bnds ? `[${state.bnds[0]}, ${state.bnds[1]}]` : "—",
  };
}

// 單一 target 的 inner loop：呈現 → 等選擇 → 更新 → 判斷結束（→ 可能的 slider 收尾）。
// 取代舊 Runner，但不再 push 到 View，而是把結果交給 ExperimentController 組成 snapshot。
class Round {
  state: AlgorithmState;
  debugRows: DebugRow[] = [];
  private done = false;
  private inSlider = false;

  constructor(
    private readonly algorithm: UpdateAlgorithm,
    private readonly stopCondition: StopCondition,
    private readonly task: Task,
    private readonly onComplete: (finalTarget: number) => void
  ) {
    this.state = algorithm.init({
      stage: task.stage,
      initialValue: task.initialValue,
      target: task.target,
      bnds: task.bnds,
    });
    this.debugRows.push(debugRow(this.alternatives(), this.state));
  }

  alternatives(): Alternatives {
    return placeTarget(
      this.task.template,
      this.task.target,
      this.state.value,
      this.task.isTargetSureThing
    );
  }

  // returns the slider spec when the round transitions into the slider phase
  choose(selection: Selection): SliderSpec | null {
    if (this.done || this.inSlider) return null;

    this.state = this.algorithm.next(this.state, selection);
    this.debugRows.push(debugRow(this.alternatives(), this.state));

    if (!this.stopCondition.isDone(this.state)) return null;

    if (!isSliderFinalizable(this.algorithm)) {
      this.done = true;
      this.onComplete(this.state.value);
      return null;
    }

    this.inSlider = true;
    const spec = this.algorithm.sliderFinalize(this.state);
    // slider 範圍 [min, max] 就是新 bnds，寫回 state 讓 debug 表格反映
    this.state = { ...this.state, bnds: spec.bnds, value: spec.initial };
    return spec;
  }

  // slider 拖動：只更新刺激值（畫面由 controller 用 alternatives() 重畫）
  slideTo(value: number): void {
    this.state = { ...this.state, value };
  }

  // slider 確定：記下最終估計值，結束這個 target
  confirmSlider(value: number): void {
    this.state = { ...this.state, value, iteration: this.state.iteration + 1, stepSize: 0 };
    this.debugRows.push(debugRow(this.alternatives(), this.state));
    this.done = true;
    this.inSlider = false;
    this.onComplete(this.state.value);
  }
}

// 外層 round 迴圈：依序走過所有 target，把每個 elicit 結果存進 logger 並 chain，
// 每次狀態改變就 emit 一個 ExperimentState snapshot 給 React。
export class ExperimentController {
  private readonly logger = new TaskLogger();
  private readonly names: string[];
  private index = 0;
  private round!: Round;
  private taskHeader = "";
  private phase: Phase = "choosing";
  private sliderSpec?: SliderSpec;
  private result?: { sequence: stdSeq; lossAversion: LossAversionResult };

  constructor(
    private readonly config: ExperimentConfig,
    private readonly makeAlgorithm: () => UpdateAlgorithm,
    private readonly makeStopCondition: () => StopCondition,
    private readonly onChange: (state: ExperimentState) => void
  ) {
    this.names = targetNames(config.k);
  }

  start(): void {
    this.index = 0;
    this.runCurrent();
  }

  choose(selection: Selection): void {
    if (this.phase !== "choosing") return;
    const spec = this.round.choose(selection);
    if (spec) {
      this.phase = "slider";
      this.sliderSpec = spec;
    }
    this.emit();
  }

  slideTo(value: number): void {
    if (this.phase !== "slider") return;
    this.round.slideTo(value);
    this.emit();
  }

  confirmSlider(value: number): void {
    if (this.phase !== "slider") return;
    this.sliderSpec = undefined;
    this.round.confirmSlider(value);
    this.emit();
  }

  next(): void {
    if (this.phase !== "roundDone") return;
    this.index += 1;
    this.runCurrent();
  }

  private runCurrent(): void {
    const task = buildTask(this.index, this.logger, this.config);
    this.taskHeader = `目標 ${task.name}（${this.index + 1} / ${this.names.length}）`;
    this.phase = "choosing";
    this.sliderSpec = undefined;
    this.round = new Round(
      this.makeAlgorithm(),
      this.makeStopCondition(),
      task,
      (finalTarget) => this.onTargetDone(task, finalTarget)
    );
    this.emit();
  }

  private onTargetDone(task: Task, finalTarget: number): void {
    this.logger.record(task.name, finalTarget);
    if (this.index < this.names.length - 1) {
      this.phase = "roundDone";
    } else {
      this.phase = "done";
      this.result = {
        sequence: this.logger.finalSequence(this.config.k),
        lossAversion: this.logger.computeLossAversion(this.config.k),
      };
    }
  }

  private currentStatus(): string {
    if (this.phase === "slider") return "用 slider 調整到兩個選項相等吸引你，再按確定";
    if (this.phase === "roundDone") {
      return `${this.round.state.value} 完成。按 Next Round 繼續`;
    }
    return statusLine(this.taskHeader, this.round.state);
  }

  private emit(): void {
    this.onChange({
      taskHeader: this.taskHeader,
      status: this.currentStatus(),
      alternatives: this.round.alternatives(),
      algoState: this.round.state,
      debugRows: [...this.round.debugRows],
      phase: this.phase,
      sliderSpec: this.sliderSpec,
      result: this.result,
    });
  }
}
