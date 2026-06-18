import { useRef, type FormEvent } from "react";
import { ASA, BiM, BiMS, HaB } from "../logic/algorithms";
import { Convergence, FixedIterations } from "../logic/stopConditions";
import { EXP_BASE_CONFIG } from "../logic/config";
import type {
  BoundScheme,
  ExperimentConfig,
  StopCondition,
  UpdateAlgorithm,
} from "../logic/types";

function makeAlgorithm(name: string): UpdateAlgorithm {
  switch (name) {
    case "HaB":  return new HaB();
    case "ASA":  return new ASA();
    case "BiM":  return new BiM();
    case "BiM-S": return new BiMS();
    default: throw new Error(`未實作的演算法：${name}`);
  }
}

function makeStopCondition(kind: string, n: number, threshold: number): StopCondition {
  return kind === "convergence" ? new Convergence(threshold) : new FixedIterations(n);
}

export interface SetupFormProps {
  onStart: (
    config: ExperimentConfig,
    makeAlgorithm: () => UpdateAlgorithm,
    makeStopCondition: () => StopCondition
  ) => void;
}

const fieldsetCls = "mb-4 rounded border border-gray-300 p-3";
const legendCls = "px-1 font-semibold";
const labelCls = "my-1 flex items-center gap-2";
const numberCls = "w-20 rounded border border-gray-300 px-1 py-0.5";

export function SetupForm({ onStart }: SetupFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // 沿用原本的 setCustomValidity 整數提示
  function enforceIntegerMessage(e: FormEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    if (e.type === "input") {
      input.setCustomValidity("");
    } else if (!input.validity.valid) {
      input.setCustomValidity(`只接受 ${input.min} 到 ${input.max} 之間的整數`);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const algoName = String(data.get("algorithm"));
    const stopKind = String(data.get("stop"));
    const boundScheme = String(data.get("bound")) as BoundScheme;
    const n = Number(data.get("iterations"));
    const threshold = Number(data.get("threshold"));

    const config: ExperimentConfig = { ...EXP_BASE_CONFIG, boundScheme };
    onStart(
      config,
      () => makeAlgorithm(algoName),
      () => makeStopCondition(stopKind, n, threshold)
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>更新演算法</legend>
        {["HaB", "ASA", "BiM", "BiM-S"].map((name, i) => (
          <label key={name} className={labelCls}>
            <input type="radio" name="algorithm" value={name} defaultChecked={i === 0} /> {name}
          </label>
        ))}
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>結束條件</legend>
        <label className={labelCls}>
          <input type="radio" name="stop" value="fixed" defaultChecked /> 固定 iteration 數：
          <input
            className={numberCls}
            type="number"
            name="iterations"
            defaultValue={5}
            min={5}
            max={10}
            step={1}
            required
            onInput={enforceIntegerMessage}
            onInvalid={enforceIntegerMessage}
          />
        </label>
        <label className={labelCls}>
          <input type="radio" name="stop" value="convergence" /> 收斂（Step Size &lt;）：
          <input
            className={numberCls}
            type="number"
            name="threshold"
            defaultValue={50}
            min={5}
            max={100}
            step={1}
            required
            onInput={enforceIntegerMessage}
            onInvalid={enforceIntegerMessage}
          />
        </label>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>初始值(及初始區間)設定</legend>
        <p>每次測量開始時初始值(如果是 BiM 或 BiM-S，則同時決定初始區間)決定的方法，共兩類：</p>
        <ol className="ml-5 list-decimal pl-4">
          <li>Equal-expectation：初始值設在使得<b>兩個選項期望值相等</b>的位置。</li>
          <li>Fixed Boundary Width (用於 BiM/BiM-S)：固定初始區間寬度為定值 (設定為 5000)，初始值即為此區間中點。</li>
        </ol>
        <label className={labelCls}>
          <input type="radio" name="bound" value="equal_expectation" defaultChecked /> Equal-expectation
        </label>
        <label className={labelCls}>
          <input type="radio" name="bound" value="fixed_bnd" /> Fixed Boundary Width（=5000）
        </label>
      </fieldset>

      <button
        type="submit"
        className="w-full rounded bg-sky-600 py-3 font-medium text-white hover:bg-sky-700"
      >
        Start
      </button>
    </form>
  );
}
