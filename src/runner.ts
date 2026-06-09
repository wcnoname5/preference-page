import {
  AlgorithmState,
  Alternatives,
  ExperimentConfig,
  Selection,
  SliderFinalizable,
  StopCondition,
  Task,
  UpdateAlgorithm,
} from "./types.js";
import { View } from "./view.js";
import { buildTask, placeTarget, targetNames } from "./tasks.js";
import { LossAversionResult, TaskLogger } from "./taskLogger.js";

// 演算法是否支援 slider 收尾步驟（目前只有 BiM-S）
function isSliderFinalizable(algo: UpdateAlgorithm): algo is UpdateAlgorithm & SliderFinalizable {
  return typeof (algo as Partial<SliderFinalizable>).sliderFinalize === "function";
}

// 跑單一 target 的 inner loop：呈現 → 等選擇 → 更新 → 判斷結束（→ 可能的 slider 收尾）
export class Runner {
  private state: AlgorithmState;
  private done = false;
  private inSlider = false;

  constructor(
    private readonly algorithm: UpdateAlgorithm,
    private readonly stopCondition: StopCondition,
    private readonly view: View,
    private readonly task: Task,
    private readonly onComplete: (finalTarget: number) => void
  ) {
    this.state = algorithm.init({
      stage: task.stage,
      initialValue: task.initialValue,
      target: task.target,
      bnds: task.bnds,
    });
    this.renderAndLog();
  }

  // create current alternatives
  private curAlts(): Alternatives {
    return placeTarget(
      this.task.template,
      this.task.target,
      this.state.value,
      this.task.isTargetSureThing
    );
  }

  private renderAndLog(): void {
    const alt = this.curAlts();
    this.view.render(alt, this.state);
    this.view.log(alt, this.state);
  }

  choose(selection: Selection): void {
    if (this.done || this.inSlider) return;

    this.state = this.algorithm.next(this.state, selection);
    this.renderAndLog();

    if (this.stopCondition.isDone(this.state)) {
      this.finishOrSlider();
    }
  }

  // Stop Conditon 
  private finishOrSlider(): void {
    if (!isSliderFinalizable(this.algorithm)) {
      this.done = true;
      this.onComplete(this.state.value);
      return;
    }

    this.inSlider = true;
    const spec = this.algorithm.sliderFinalize(this.state);
    // slider 範圍 [min, max] 就是這一步的新 bnds，寫回 state 讓 debug 表格反映
    this.state = { ...this.state, bnds: spec.bnds };
    this.applySlider(spec.initial);
    this.view.showSlider(
      spec,
      (value) => this.applySlider(value),
      (value) => this.confirmSlider(value)
    );
  }

  // slider 拖動：更新刺激值並重畫
  private applySlider(value: number): void {
    this.state = { ...this.state, value };
    this.view.render(this.curAlts(), this.state);
  }

  // slider 確定：記下最終估計值，結束這個 target
  private confirmSlider(value: number): void {
    this.state = { ...this.state, value, iteration: this.state.iteration + 1, stepSize: 0 };
    this.renderAndLog();
    this.done = true;
    this.inSlider = false;
    this.onComplete(this.state.value);
  }
}

// 外層 round 迴圈：依序走過所有 target，把每個 elicit 結果存進 logger 並 chain，
// 最後輸出整個估計序列。
export class Experiment {
  private readonly logger = new TaskLogger();
  private readonly names: string[];
  private index = 0;
  private current: Runner | null = null;

  constructor(
    private readonly config: ExperimentConfig,
    private readonly makeAlgorithm: () => UpdateAlgorithm,
    private readonly makeStopCondition: () => StopCondition,
    private readonly view: View,
    private readonly onDone: (sequence: { name: string; value: number }[], lossAversion: LossAversionResult) => void
  ) {
    this.names = targetNames(config.k);
  }

  // 開始整個實驗（從第一個 target 起）
  start(): void {
    this.index = 0;
    this.runCurrent();
  }

  // 把左/右選擇交給目前正在跑的 target
  choose(selection: Selection): void {
    this.current?.choose(selection);
  }

  // 前進到下一個 target
  next(): void {
    if (this.index >= this.names.length - 1) return;
    this.index += 1;
    this.runCurrent();
  }

  private runCurrent(): void {
    // 從 logger 讀先前 elicit 的值來 chain 出這個 target
    const task = buildTask(this.index, this.logger, this.config);
    this.view.beginRound();
    this.view.setTaskInfo(task, this.index, this.names.length);
    this.current = new Runner(
      this.makeAlgorithm(),
      this.makeStopCondition(),
      this.view,
      task,
      (finalTarget) => this.onTargetDone(task, finalTarget)
    );
  }

  private onTargetDone(task: Task, finalTarget: number): void {
    this.logger.record(task.name, finalTarget);
    if (this.index < this.names.length - 1) {
      this.view.showNextRound(task.name, finalTarget);
    } else {
      this.onDone(
        this.logger.finalSequence(this.config.k),
        this.logger.computeLossAversion(this.config.k)
      );
    }
  }
}
