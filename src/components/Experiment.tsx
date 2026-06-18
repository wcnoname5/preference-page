import type { ExperimentState } from "../logic/experiment";
import type { Selection } from "../logic/types";
import { DebugTable } from "./DebugTable";

export interface ExperimentProps {
  state: ExperimentState;
  onChoose: (s: Selection) => void;
  onNext: () => void;
  onSlide: (v: number) => void;
  onConfirmSlider: (v: number) => void;
}

const payoff = "mx-auto my-2 w-fit rounded border-2 border-transparent px-2 py-0.5 font-bold";

function Option({ title, a, b }: { title: string; a: number; b: number }) {
  return (
    <div className="flex-1 rounded-lg border border-gray-300 p-4 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className={payoff}>藍球：{a}</p>
      <p className={payoff}>紅球：{b}</p>
    </div>
  );
}

const choiceBtn =
  "flex-1 cursor-pointer rounded border border-gray-300 py-3 text-base hover:bg-gray-100";

export function Experiment({ state, onChoose, onNext, onSlide, onConfirmSlider }: ExperimentProps) {
  const { alternatives: alt, phase, sliderSpec, algoState } = state;

  return (
    <section>
      <p className="text-sm text-gray-700">
        一罐子內有若干紅色、藍色球，你不知道其比例。現在從罐中抽取一顆球。
        <br />
        以下兩選項各為一個樂透，分別寫出此球是紅球/藍球情況下，你所獲得的報酬或損失。
      </p>
      <h3 className="my-3 text-center font-semibold">請選擇比較吸引你的選項</h3>

      <div className="flex gap-4">
        <Option title="左" a={alt.left.payoffA} b={alt.left.payoffB} />
        <Option title="右" a={alt.right.payoffA} b={alt.right.payoffB} />
      </div>

      {phase === "choosing" && (
        <div className="my-4 flex gap-4">
          <button className={choiceBtn} onClick={() => onChoose("left")}>選左</button>
          <button className={choiceBtn} onClick={() => onChoose("right")}>選右</button>
        </div>
      )}

      {phase === "slider" && sliderSpec && (
        <div className="my-4 flex items-center gap-3">
          <input
            type="range"
            className="flex-1"
            min={sliderSpec.bnds[0]}
            max={sliderSpec.bnds[1]}
            step={1}
            value={algoState.value}
            onChange={(e) => onSlide(Math.round(Number(e.currentTarget.value)))}
          />
          <span className="w-16 text-right">{algoState.value}</span>
          <button
            className="cursor-pointer rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
            onClick={() => onConfirmSlider(algoState.value)}
          >
            確定
          </button>
        </div>
      )}

      {phase === "roundDone" && (
        <div className="my-4 flex gap-4">
          <button
            className="flex-1 cursor-pointer rounded bg-sky-600 py-3 text-base text-white hover:bg-sky-700"
            onClick={onNext}
          >
            Next Round
          </button>
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer">Details</summary>
        <p className="my-2 font-bold">{state.status}</p>
        <DebugTable rows={state.debugRows} />
      </details>
    </section>
  );
}
