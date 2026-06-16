import {
  Alternatives,
  AlgorithmState,
  SliderSpec,
  Task,
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
}

// 顯示層：只負責畫實驗畫面、記表格，不碰演算法
export class View {
  constructor(private readonly els: ViewElements) {}

  private taskHeader = "";

  render(alt: Alternatives, state: AlgorithmState): void {
    this.paint(this.els.leftA, alt.left.payoffA);
    this.paint(this.els.leftB, alt.left.payoffB);
    this.paint(this.els.rightA, alt.right.payoffA);
    this.paint(this.els.rightB, alt.right.payoffB);
    this.els.status.textContent =
      `${this.taskHeader} · Iteration ${state.iteration} · Step Size = ${Math.round(state.stepSize)} · Target Value = ${state.value}`;
  }

  private paint(span: HTMLElement, value: number): void {
    span.textContent = String(value);
    span.style.fontWeight = "bold";
  }

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

  setTaskInfo(task: Task, index: number, total: number): void {
    this.taskHeader = `目標 ${task.name}（${index + 1} / ${total}）`;
  }

  beginRound(): void {
    this.els.choices.hidden = false;
    this.els.sliderArea.hidden = true;
    this.els.next.hidden = true;
    this.els.buttons.forEach((b) => (b.disabled = false));
    this.els.tableBody.replaceChildren();
  }

  showNextRound(taskName: string, value: number): void {
    this.els.choices.hidden = true;
    this.els.sliderArea.hidden = true;
    this.els.next.hidden = false;
    this.els.status.textContent = `${taskName} 完成，= ${value}。按 Next Round 繼續`;
  }
}
