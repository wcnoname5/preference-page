import { LossAversionResult } from "../taskLogger.js";
import { byId } from "../dom.js";

export class ResultPage {
  constructor(
    private readonly container: HTMLElement,
    onRestart: () => void
  ) {
    byId<HTMLButtonElement>("restart-button").onclick = onRestart;
  }

  show(sequence: { name: string; value: number }[], lossAversion: LossAversionResult): void {
    byId("end").hidden = false;
    this.renderResult(sequence);
    this.renderLossAversion(lossAversion);
  }

  private renderResult(sequence: { name: string; value: number }[]): void {
    const heading = document.createElement("h2");
    heading.textContent = "實驗結果";

    const caption = document.createElement("h3");
    caption.textContent = "最終估計序列 { x_k⁻, …, 0, …, x_k⁺ }";

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

    const table = document.createElement("table");
    table.append(caption, body);

    this.container.replaceChildren(heading, table);
    this.container.hidden = false;
  }

  private renderLossAversion(result: LossAversionResult): void {
    const section = document.createElement("div");

    const kwTitle = document.createElement("h3");
    kwTitle.textContent = "KW Index（Köbberling-Wakker）";
    const kwBody = document.createElement("p");
    kwBody.textContent = `λ = x₁⁺ / (−x₁⁻) = ${ResultPage.fmt(result.kw.lambda)}　→　${ResultPage.classLabel(result.kw.classification)}`;
    section.append(kwTitle, kwBody);

    const ktTitle = document.createElement("h3");
    ktTitle.textContent = "KT Index（Kahneman-Tversky）";

    const headerRow = document.createElement("tr");
    for (const text of ["i", "−v(−xᵢ⁺) / v(xᵢ⁺)", "−v(xᵢ⁻) / v(−xᵢ⁻)"]) {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    }
    const thead = document.createElement("thead");
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");
    for (const { i, ratioPos, ratioNeg } of result.kt.entries) {
      const row = document.createElement("tr");
      for (const val of [String(i), ResultPage.fmt(ratioPos), ResultPage.fmt(ratioNeg)]) {
        const td = document.createElement("td");
        td.textContent = val;
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }

    const tfoot = document.createElement("tfoot");
    for (const [label, val] of [["Mean", ResultPage.fmt(result.kt.mean)], ["Median", ResultPage.fmt(result.kt.median)]]) {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = label;
      const td = document.createElement("td");
      td.setAttribute("colspan", "2");
      td.textContent = val;
      row.append(th, td);
      tfoot.appendChild(row);
    }

    const table = document.createElement("table");
    table.append(thead, tbody, tfoot);

    const ktClass = document.createElement("p");
    ktClass.textContent = `Classification: ${ResultPage.classLabel(result.kt.classification)}`;

    section.append(ktTitle, table, ktClass);
    this.container.appendChild(section);
  }

  private static classLabel(c: "loss_averse" | "gain_seeking" | "neutral"): string {
    if (c === "loss_averse") return "Loss Averse";
    if (c === "gain_seeking") return "Gain Seeking";
    return "Loss Neutral";
  }

  private static fmt(n: number | null): string {
    if (n === null || isNaN(n)) return "n/a";
    return n.toFixed(3);
  }
}
