import {
  Alternatives,
  AlgorithmState,
  PayoffField,
  Selection,
  SliderSpec,
  Task,
  TargetCell,
} from "./types.js";
import { resolveTarget } from "./algorithms.js";

export interface ViewElements {
  leftA: HTMLElement;
  leftB: HTMLElement;
  rightA: HTMLElement;
  rightB: HTMLElement;
  tableBody: HTMLElement;
  status: HTMLElement;
  choices: HTMLElement;
  buttons: HTMLButtonElement[];
  sliderArea: HTMLElement;
  slider: HTMLInputElement;
  sliderValue: HTMLElement;
  sliderConfirm: HTMLButtonElement;
  next: HTMLElement;
  end: HTMLElement;
  taskInfo: HTMLElement;
  result: HTMLElement;
}

// 顯示層：只負責畫畫面、記表格，不碰演算法
export class View {
  constructor(private readonly els: ViewElements) {}

  render(alt: Alternatives, state: AlgorithmState): void {
    this.paint(this.els.leftA, alt.left.payoffA);
    this.paint(this.els.leftB, alt.left.payoffB);
    this.paint(this.els.rightA, alt.right.payoffA);
    this.paint(this.els.rightB, alt.right.payoffB);
    this.markTarget(resolveTarget(state));
    this.els.status.textContent =
      `Stage ${state.stage} · Iteration ${state.iteration} · Step Size = ${Math.round(state.stepSize)} · Target Value = ${state.value}`;
  }

  // 寫入數值，並依正負上色（正藍、負紅、零黑）
  private paint(span: HTMLElement, value: number): void {
    span.textContent = String(value);
    span.classList.remove("pos", "neg", "zero");
    span.classList.add(value > 0 ? "pos" : value < 0 ? "neg" : "zero");
  }

  // 用黑框標出目標所在的那一格 payoff
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

  // 在 debug 表格新增一列：iteration / targetValue / stepSize / bnds
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

  // ============= 實驗（跨 target）層級 =============

  // 顯示目前在哪個 stage / target，以及進度
  setTaskInfo(task: Task, index: number, total: number): void {
    this.els.taskInfo.textContent = `Stage ${task.stage} · 目標 ${task.name}（${index + 1} / ${total}）`;
  }

  // 開始一個 target：恢復選擇按鈕、隱藏結束/下一輪/結果、清空上一輪表格
  beginRound(): void {
    this.els.choices.hidden = false;
    this.els.sliderArea.hidden = true;
    this.els.next.hidden = true;
    this.els.end.hidden = true;
    this.els.result.hidden = true;
    this.els.buttons.forEach((b) => (b.disabled = false));
    this.els.tableBody.replaceChildren();
  }

  // 一個 target 結束、還有下一個：藏掉選擇鈕，秀出 Next Round
  showNextRound(taskName: string, value: number): void {
    this.els.choices.hidden = true;
    this.els.sliderArea.hidden = true;
    this.els.next.hidden = false;
    this.els.status.textContent = `${taskName} 完成，= ${value}。按 Next Round 繼續`;
  }

  // 全部 target 結束：秀出實驗結束、返回開始，以及最終估計序列
  showFinal(sequence: { name: string; value: number }[]): void {
    this.els.choices.hidden = true;
    this.els.sliderArea.hidden = true;
    this.els.next.hidden = true;
    this.els.end.hidden = false;
    this.els.status.textContent = "實驗結束 ✓";
    this.renderResult(sequence);
  }

  private renderResult(sequence: { name: string; value: number }[]): void {
    const table = document.createElement("table");
    const caption = document.createElement("caption");
    caption.textContent = "最終估計序列 { x_k⁻, …, 0, …, x_k⁺ }";
    table.appendChild(caption);

    const body = document.createElement("tbody");
    for (const { name, value } of sequence) {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      nameCell.textContent = name;
      const valueCell = document.createElement("td");
      valueCell.textContent = String(value);
      row.append(nameCell, valueCell);
      body.appendChild(row);
    }
    table.appendChild(body);

    this.els.result.replaceChildren(table);
    this.els.result.hidden = false;
  }
}
