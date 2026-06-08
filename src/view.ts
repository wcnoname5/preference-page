import {
  Alternatives,
  AlgorithmState,
  SliderSpec,
  Task,
} from "./types.js";
import { resolveTarget } from "./algorithms.js";
import { LossAversionResult } from "./taskLogger.js";

export interface ViewElements {
  experiment: HTMLElement;
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
  result: HTMLElement;
}

// 顯示層：只負責畫畫面、記表格，不碰演算法
export class View {
  constructor(private readonly els: ViewElements) {}

  // 目前 stage / target 進度，會併進 status 一起顯示
  private taskHeader = "";

  render(alt: Alternatives, state: AlgorithmState): void {
    this.paint(this.els.leftA, alt.left.payoffA);
    this.paint(this.els.leftB, alt.left.payoffB);
    this.paint(this.els.rightA, alt.right.payoffA);
    this.paint(this.els.rightB, alt.right.payoffB);
    this.els.status.textContent =
      `${this.taskHeader} · Iteration ${state.iteration} · Step Size = ${Math.round(state.stepSize)} · Target Value = ${state.value}`;
  }

  // 寫入數值
  private paint(span: HTMLElement, value: number): void {
    span.textContent = String(value);
    span.style.fontWeight = "bold";
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

  // 記下目前 stage / target 進度
  setTaskInfo(task: Task, index: number, total: number): void {
    this.taskHeader = `Stage ${task.stage} · 目標 ${task.name}（${index + 1} / ${total}）`;
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
  showFinal(sequence: { name: string; value: number }[], lossAversion: LossAversionResult): void {
    this.els.experiment.hidden = true;
    this.els.end.hidden = false;
    this.renderResult(sequence);
    this.renderLossAversion(lossAversion);
  }

  private static classLabel(c: "loss_averse" | "gain_seeking" | "neutral"): string {
    if (c === "loss_averse") return "Loss Averse";
    if (c === "gain_seeking") return "Gain Seeking";
    return "Loss Neutral";
  }

  private static fmt(n: number | null): string {
    if (n === null) return "n/a";
    if (isNaN(n)) return "n/a";
    return n.toFixed(3);
  }

  private renderLossAversion(result: LossAversionResult): void {
    const section = document.createElement("div");

    // KW index
    const kwTitle = document.createElement("h3");
    kwTitle.textContent = "KW Index（Köbberling-Wakker）";
    const kwBody = document.createElement("p");
    kwBody.textContent =
      `λ = x₁⁺ / (−x₁⁻) = ${View.fmt(result.kw.lambda)}　→　${View.classLabel(result.kw.classification)}`;
    section.append(kwTitle, kwBody);

    // KT index
    const ktTitle = document.createElement("h3");
    ktTitle.textContent = "KT Index（Kahneman-Tversky）";

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    for (const text of ["i", "−v(−xᵢ⁺) / v(xᵢ⁺)", "−v(xᵢ⁻) / v(−xᵢ⁻)"]) {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const { i, ratioPos, ratioNeg } of result.kt.entries) {
      const row = document.createElement("tr");
      for (const val of [String(i), View.fmt(ratioPos), View.fmt(ratioNeg)]) {
        const td = document.createElement("td");
        td.textContent = val;
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);

    const tfoot = document.createElement("tfoot");
    for (const [label, val] of [["Mean", View.fmt(result.kt.mean)], ["Median", View.fmt(result.kt.median)]]) {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = label;
      const td = document.createElement("td");
      td.setAttribute("colspan", "2");
      td.textContent = val;
      row.append(th, td);
      tfoot.appendChild(row);
    }
    table.appendChild(tfoot);

    const ktClass = document.createElement("p");
    ktClass.textContent = `Classification: ${View.classLabel(result.kt.classification)}`;

    section.append(ktTitle, table, ktClass);
    this.els.result.appendChild(section);
  }

  private renderResult(sequence: { name: string; value: number }[]): void {
    const heading = document.createElement("h2");
    heading.textContent = "實驗結果";

    const table = document.createElement("table");
    const caption =document.createElement("h3");
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

    this.els.result.replaceChildren(heading, table);
    this.els.result.hidden = false;
  }
}
