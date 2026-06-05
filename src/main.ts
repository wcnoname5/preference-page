import {
  Alternatives,
  AlgorithmState,
  PayoffField,
  Selection,
  SliderFinalizable,
  SliderSpec,
  StopCondition,
  TargetCell,
  UpdateAlgorithm,
} from "./types.js";
import { HaB, ASA, BiM, BiMS, resolveTarget } from "./algorithms.js";
import { Convergence, FixedIterations } from "./stopConditions.js";


// 依設定建立演算法（之後新增演算法時，在這裡加一個 case）
function makeAlgorithm(name: string): UpdateAlgorithm {
  switch (name) {
    case "HaB":
      return new HaB();
    case "ASA":
      return new ASA();
    case "BiM":
      return new BiM();
    case "BiM-S":
      return new BiMS();
    default:
      throw new Error(`未實作的演算法：${name}`);
  }
}

// 依設定建立結束條件
function makeStopCondition(kind: string, n: number, threshold: number): StopCondition {
  return kind === "convergence" ? new Convergence(threshold) : new FixedIterations(n);
}

// 演算法是否支援 slider 收尾步驟（目前只有 BiM-S）
function isSliderFinalizable(algo: UpdateAlgorithm): algo is UpdateAlgorithm & SliderFinalizable {
  return typeof (algo as Partial<SliderFinalizable>).sliderFinalize === "function";
}

// 跑單場實驗的迴圈：呈現 → 等選擇 → 更新 → 判斷結束（→ 可能的 slider 收尾）
class Runner {
  private current: Alternatives;
  private state: AlgorithmState;
  private done = false;
  private inSlider = false;

  constructor(
    private readonly algorithm: UpdateAlgorithm,
    private readonly stopCondition: StopCondition,
    private readonly view: View
  ) {
    const start = algorithm.init();
    this.current = start.alternatives;
    this.state = start.state;
    this.view.render(this.current, this.state);
    this.view.log(this.current, this.state);
  }

  choose(selection: Selection): void {
    if (this.done || this.inSlider) return;

    const step = this.algorithm.next(this.current, this.state, selection);
    this.current = step.alternatives;
    this.state = step.state;

    this.view.render(this.current, this.state);
    this.view.log(this.current, this.state);

    if (this.stopCondition.isDone(this.state)) {
      this.finishOrSlider();
    }
  }

  // 停止條件成立：支援 slider 的演算法多走一步 matching，否則直接結束
  private finishOrSlider(): void {
    if (!isSliderFinalizable(this.algorithm)) {
      this.done = true;
      this.view.finish();
      return;
    }

    this.inSlider = true;
    const side = this.targetSide();
    const spec = this.algorithm.sliderFinalize(this.state, this.current);
    // wtite final slider bounds back to state 
    this.state = { ...this.state, bnds: spec.bnds };
    this.applySlider(side, spec.initial);
    this.view.showSlider(
      spec,
      (value) => this.applySlider(side, value),
      (value) => this.confirmSlider(side, value)
    );
  }

  // slider 拖動：把目標側的 payoff 更新為 slider 值並重畫
  private applySlider(side: Selection, value: number): void {
    const payoffs = { payoffA: value, payoffB: value };
    this.current =
      side === "left" ? { ...this.current, left: payoffs } : { ...this.current, right: payoffs };
    this.view.render(this.current, this.state);
  }

  // slider 確定：記下最終估計值，結束實驗
  private confirmSlider(side: Selection, value: number): void {
    this.applySlider(side, value);
    this.state = { ...this.state, iteration: this.state.iteration + 1, stepSize: 0 };
    this.view.log(this.current, this.state);
    this.done = true;
    this.inSlider = false;
    this.view.finish();
  }

  private targetSide(): Selection {
    return resolveTarget(this.state).side;
  }
}

// 顯示層：只負責畫畫面、記表格，不碰演算法
class View {
  constructor(
    private readonly els: {
      leftA: HTMLElement;
      leftB: HTMLElement;
      rightA: HTMLElement;
      rightB: HTMLElement;
      tableBody: HTMLElement;
      stage: HTMLElement;
      status: HTMLElement;
      choices: HTMLElement;
      buttons: HTMLButtonElement[];
      sliderArea: HTMLElement;
      slider: HTMLInputElement;
      sliderValue: HTMLElement;
      sliderConfirm: HTMLButtonElement;
    }
  ) {}

  render(alt: Alternatives, state: AlgorithmState): void {
    this.paint(this.els.leftA, alt.left.payoffA);
    this.paint(this.els.leftB, alt.left.payoffB);
    this.paint(this.els.rightA, alt.right.payoffA);
    this.paint(this.els.rightB, alt.right.payoffB);
    this.markTarget(resolveTarget(state));
    this.els.stage.textContent = String(state.stage);
    this.els.status.textContent = `iteration ${state.iteration}，stepSize ${state.stepSize}`;
  }

  // 寫入數值，並依正負上色（正藍、負紅、零黑）
  private paint(span: HTMLElement, value: number): void {
    span.textContent = String(value);
    span.classList.remove("pos", "neg", "zero");
    span.classList.add(value > 0 ? "pos" : value < 0 ? "neg" : "zero");
  }

  // mark target with CSS class
  private markTarget(target: TargetCell): void {
    const cells: Array<[Selection, PayoffField, HTMLElement]> = [
      ["left", "payoffA", this.els.leftA],
      ["left", "payoffB", this.els.leftB],
      ["right", "payoffA", this.els.rightA],
      ["right", "payoffB", this.els.rightB],
    ];
    for (const [side, field, span] of cells) {
      const isTarget = side === target.side && field === target.field;
      span.closest("p")?.classList.toggle("target", isTarget);
    }
  }

  // add logs to debug table
  log(alt: Alternatives, state: AlgorithmState): void {
    const target = resolveTarget(state);
    const targetValue = alt[target.side][target.field];
    const bnds = state.bnds ? `[${state.bnds[0]}, ${state.bnds[1]}]` : "—";

    const row = document.createElement("tr");
    for (const value of [state.iteration, targetValue, state.stepSize, bnds]) {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.appendChild(cell);
    }
    this.els.tableBody.appendChild(row);
  }

  // 進入 slider 收尾：把左/右按鈕換成 slider
  showSlider(
    spec: SliderSpec,
    onInput: (value: number) => void,
    onConfirm: (value: number) => void
  ): void {
    this.els.choices.hidden = true;
    this.els.sliderArea.hidden = false;
    this.els.status.textContent = "用 slider 調整到兩個選項相等吸引你，再按確定";

    const slider = this.els.slider;
    slider.min = String(spec.bnds[0]);
    slider.max = String(spec.bnds[1]);
    slider.step = "1";
    slider.value = String(Math.round(spec.initial));
    this.els.sliderValue.textContent = String(Math.round(spec.initial));

    slider.oninput = () => {
      const value = Math.round(Number(slider.value));
      this.els.sliderValue.textContent = String(value);
      onInput(value);
    };
    this.els.sliderConfirm.onclick = () => onConfirm(Math.round(Number(slider.value)));
  }

  finish(): void {
    this.els.status.textContent = "實驗結束 ✓";
    this.els.buttons.forEach((b) => (b.disabled = true));
    this.els.sliderArea.hidden = true;
  }
}

// 取得元素的小工具（找不到就直接報錯，方便除錯）
function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`找不到元素 #${id}`);
  return el as T;
}

// 把 number 欄位的原生驗證泡泡改成自訂訊息（訊息依該欄位的 min/max 自動產生）
function enforceIntegerMessage(input: HTMLInputElement): void {
  const message = `只接受 ${input.min} 到 ${input.max} 之間的整數`;
  // 先清掉自訂訊息，讓瀏覽器重新依 step/min/max 判斷有效性
  input.addEventListener("input", () => input.setCustomValidity(""));
  // 驗證失敗時（送出表單）才掛上自訂訊息，泡泡就會顯示這句
  input.addEventListener("invalid", () => {
    if (!input.validity.valid) input.setCustomValidity(message);
  });
}

function main(): void {
  const setupSection = byId("setup");
  const experimentSection = byId("experiment");

  const chooseLeft = byId<HTMLButtonElement>("choose-left");
  const chooseRight = byId<HTMLButtonElement>("choose-right");

  enforceIntegerMessage(byId<HTMLInputElement>("iterations"));
  enforceIntegerMessage(byId<HTMLInputElement>("threshold"));

  const view = new View({
    leftA: byId("left-a"),
    leftB: byId("left-b"),
    rightA: byId("right-a"),
    rightB: byId("right-b"),
    tableBody: byId("debug-body"),
    stage: byId("debug-stage"),
    status: byId("status"),
    choices: byId("choices"),
    buttons: [chooseLeft, chooseRight],
    sliderArea: byId("slider-area"),
    slider: byId<HTMLInputElement>("slider"),
    sliderValue: byId("slider-value"),
    sliderConfirm: byId<HTMLButtonElement>("slider-confirm"),
  });

  byId<HTMLFormElement>("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const algoName = (document.querySelector('input[name="algorithm"]:checked') as HTMLInputElement).value;
    const stopKind = (document.querySelector('input[name="stop"]:checked') as HTMLInputElement).value;
    const n = Number(byId<HTMLInputElement>("iterations").value);
    const threshold = Number(byId<HTMLInputElement>("threshold").value);

    const runner = new Runner(
      makeAlgorithm(algoName),
      makeStopCondition(stopKind, n, threshold),
      view
    );

    chooseLeft.onclick = () => runner.choose("left");
    chooseRight.onclick = () => runner.choose("right");

    setupSection.hidden = true;
    experimentSection.hidden = false;
  });
}

main();
