import type { Chart as ChartClass } from "chart.js";
import { stdSeq } from "../types.js";
import { LossAversionResult } from "../taskLogger.js";
import { byId } from "../dom.js";

// Chart is loaded as UMD via CDN script tag — it's a global at runtime
declare const Chart: typeof ChartClass;

export class ResultPage {
  private chart: ChartClass | null = null;

  constructor(
    private readonly container: HTMLElement,
    onRestart: () => void
  ) {
    byId<HTMLButtonElement>("restart-button").onclick = onRestart;
  }

  show(sequence: stdSeq, lossAversion: LossAversionResult): void {
    byId("end").hidden = false;
    this.renderResult(sequence);
    this.renderSequenceChart(sequence);
    this.renderLossAversion(lossAversion);
  }

  private renderSequenceChart(sequence: stdSeq): void {
    this.chart?.destroy();
    
    const points = sequence.map(({ value, utility }) => ({ x: value, y: utility }));
    const yToName = new Map(sequence.map((s) => [s.utility, s.name]));
    const zeroAxisGrid = {
      color: (ctx: { tick?: { value: number | string } }) =>
        Number(ctx.tick?.value) === 0 ? "rgba(0, 0, 0, 0.65)" : "rgba(0, 0, 0, 0.1)",
      lineWidth: (ctx: { tick?: { value: number | string } }) =>
        Number(ctx.tick?.value) === 0 ? 2 : 1,
    };
    this.chart = new Chart(byId<HTMLCanvasElement>("sequence-chart"), {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Indifference sequence",
            data: points,
            showLine: true,
            fill: false,
            tension: 0,
            pointRadius: 5,
            borderColor: "steelblue",
            backgroundColor: "steelblue",
          },
        ],
      },
      options: {
        scales: {
          x: {
            title: { display: true, text: "Monetary value" },
            grid: zeroAxisGrid,
          },
          y: {
            title: { display: true, text: "Utility index" },
            grid: zeroAxisGrid,
            ticks: {
              stepSize: 1,
              callback: (val) => yToName.get(val as number) ?? val,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const { x, y } = ctx.parsed;
                const name = y !== null ? (yToName.get(y) ?? y) : y;
                return `${name}: ${x}`;
              },
            },
          },
        },
      },
    });
  }

  private renderResult(sequence: stdSeq): void {
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

    const content = byId("result-content");
    content.replaceChildren(heading, table);
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
    byId("result-content").appendChild(section);
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
