import { Chart, registerables } from "chart.js";
import { Scatter } from "react-chartjs-2";
import type { stdSeq } from "../logic/types";
import type { LossAversionResult } from "../logic/taskLogger";

Chart.register(...registerables);

type Classification = "loss_averse" | "gain_seeking" | "neutral";

function classLabel(c: Classification): string {
  if (c === "loss_averse") return "Loss Averse";
  if (c === "gain_seeking") return "Gain Seeking";
  return "Loss Neutral";
}

function fmt(n: number | null): string {
  if (n === null || isNaN(n)) return "n/a";
  return n.toFixed(3);
}

const cell = "border border-gray-300 px-2 py-1 text-center";

function SequenceChart({ sequence }: { sequence: stdSeq }) {
  const points = sequence.map(({ value, utility }) => ({ x: value, y: utility }));
  const yToName = new Map(sequence.map((s) => [s.utility, s.name]));
  const zeroAxisGrid = {
    color: (ctx: { tick?: { value: number | string } }) =>
      Number(ctx.tick?.value) === 0 ? "rgba(0, 0, 0, 0.65)" : "rgba(0, 0, 0, 0.1)",
    lineWidth: (ctx: { tick?: { value: number | string } }) =>
      Number(ctx.tick?.value) === 0 ? 2 : 1,
  };

  return (
    <Scatter
      data={{
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
      }}
      options={{
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
                const name = y !== null ? yToName.get(y) ?? y : y;
                return `${name}: ${x}`;
              },
            },
          },
        },
      }}
    />
  );
}

function SequenceTable({ sequence }: { sequence: stdSeq }) {
  return (
    <table className="w-full border-collapse">
      <caption className="my-2 font-semibold">最終估計序列 {"{ x_k⁻, …, 0, …, x_k⁺ }"}</caption>
      <tbody>
        {sequence.map(({ name, value }) => (
          <tr key={name}>
            <td className={cell}>{name}</td>
            <td className={cell}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LossAversion({ result }: { result: LossAversionResult }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold">KW Index（Köbberling-Wakker）</h3>
      <p>
        λ = x₁⁺ / (−x₁⁻) = {fmt(result.kw.lambda)}　→　{classLabel(result.kw.classification)}
      </p>

      <h3 className="mt-3 font-semibold">KT Index（Kahneman-Tversky）</h3>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cell}>i</th>
            <th className={cell}>−v(−xᵢ⁺) / v(xᵢ⁺)</th>
            <th className={cell}>−v(xᵢ⁻) / v(−xᵢ⁻)</th>
          </tr>
        </thead>
        <tbody>
          {result.kt.entries.map(({ i, ratioPos, ratioNeg }) => (
            <tr key={i}>
              <td className={cell}>{i}</td>
              <td className={cell}>{fmt(ratioPos)}</td>
              <td className={cell}>{fmt(ratioNeg)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th className={cell}>Mean</th>
            <td className={cell} colSpan={2}>{fmt(result.kt.mean)}</td>
          </tr>
          <tr>
            <th className={cell}>Median</th>
            <td className={cell} colSpan={2}>{fmt(result.kt.median)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2">Classification: {classLabel(result.kt.classification)}</p>
    </div>
  );
}

export interface ResultProps {
  result: { sequence: stdSeq; lossAversion: LossAversionResult };
  onRestart: () => void;
}

export function Result({ result, onRestart }: ResultProps) {
  return (
    <section>
      <div className="mx-auto my-4 max-w-[700px]">
        <SequenceChart sequence={result.sequence} />
      </div>
      <h2 className="text-xl font-bold">實驗結果</h2>
      <SequenceTable sequence={result.sequence} />
      <LossAversion result={result.lossAversion} />
      <div className="my-4">
        <button
          className="cursor-pointer rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
          onClick={onRestart}
        >
          返回開始
        </button>
      </div>
    </section>
  );
}
