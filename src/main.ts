import { Alternatives, AlgorithmState, Selection, StopCondition, UpdateAlgorithm } from "./types.js";
import { HaB } from "./algorithms.js";
import { Convergence, FixedIterations } from "./stopConditions.js";

// 依設定建立演算法（之後新增演算法時，在這裡加一個 case）
function makeAlgorithm(name: string): UpdateAlgorithm {
  switch (name) {
    case "HaB":
      return new HaB();
    default:
      throw new Error(`未實作的演算法：${name}`);
  }
}

// 依設定建立結束條件
function makeStopCondition(kind: string, n: number, threshold: number): StopCondition {
  return kind === "convergence" ? new Convergence(threshold) : new FixedIterations(n);
}

// 跑單場實驗的迴圈：呈現 → 等選擇 → 更新 → 判斷結束
class Runner {
  private current: Alternatives;
  private state: AlgorithmState;
  private done = false;

  constructor(
    private readonly algorithm: UpdateAlgorithm,
    private readonly stopCondition: StopCondition,
    private readonly view: View
  ) {
    const start = algorithm.init();
    this.current = start.alternatives;
    this.state = start.state;
    this.view.render(this.current, this.state);
    this.view.log(this.state);
  }

  choose(selection: Selection): void {
    if (this.done) return;

    const step = this.algorithm.next(this.current, this.state, selection);
    this.current = step.alternatives;
    this.state = step.state;

    this.view.render(this.current, this.state);
    this.view.log(this.state);

    if (this.stopCondition.isDone(this.state)) {
      this.done = true;
      this.view.finish();
    }
  }
}

// 顯示層：只負責畫畫面、記 debug 表格，不碰演算法
class View {
  constructor(
    private readonly els: {
      leftA: HTMLElement;
      leftB: HTMLElement;
      rightA: HTMLElement;
      rightB: HTMLElement;
      tableBody: HTMLElement;
      status: HTMLElement;
      buttons: HTMLButtonElement[];
    }
  ) {}

  render(alt: Alternatives, state: AlgorithmState): void {
    this.els.leftA.textContent = String(alt.left.payoffA);
    this.els.leftB.textContent = String(alt.left.payoffB);
    this.els.rightA.textContent = String(alt.right.payoffA);
    this.els.rightB.textContent = String(alt.right.payoffB);
    this.els.status.textContent = `iteration ${state.iteration}，stepSize ${state.stepSize}`;
  }

  log(state: AlgorithmState): void {
    const row = document.createElement("tr");
    for (const value of [state.stage, state.iteration, state.stepSize]) {
      const cell = document.createElement("td");
      cell.textContent = String(value);
      row.appendChild(cell);
    }
    this.els.tableBody.appendChild(row);
  }

  finish(): void {
    this.els.status.textContent = "實驗結束 ✓";
    this.els.buttons.forEach((b) => (b.disabled = true));
  }
}

// 取得元素的小工具（找不到就直接報錯，方便除錯）
function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`找不到元素 #${id}`);
  return el as T;
}

function main(): void {
  const setupSection = byId("setup");
  const experimentSection = byId("experiment");

  const chooseLeft = byId<HTMLButtonElement>("choose-left");
  const chooseRight = byId<HTMLButtonElement>("choose-right");

  const view = new View({
    leftA: byId("left-a"),
    leftB: byId("left-b"),
    rightA: byId("right-a"),
    rightB: byId("right-b"),
    tableBody: byId("debug-body"),
    status: byId("status"),
    buttons: [chooseLeft, chooseRight],
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
