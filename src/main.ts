import { BoundScheme, ExperimentConfig, StopCondition, UpdateAlgorithm } from "./types.js";
import { HaB, ASA, BiM, BiMS } from "./algorithms.js";
import { Convergence, FixedIterations } from "./stopConditions.js";
import { View } from "./view.js";
import { Experiment } from "./runner.js";
import { EXP_BASE_CONFIG } from "./config.js";

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

// 取得元素的小工具（找不到就直接報錯，方便除錯）
function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`找不到元素 #${id}`);
  return el as T;
}

// 把 number 欄位的原生驗證泡泡改成自訂訊息（訊息依該欄位的 min/max 自動產生）
function enforceIntegerMessage(input: HTMLInputElement): void {
  const message = `只接受 ${input.min} 到 ${input.max} 之間的整數`;
  input.addEventListener("input", () => input.setCustomValidity(""));
  input.addEventListener("invalid", () => {
    if (!input.validity.valid) input.setCustomValidity(message);
  });
}

function checkedValue(name: string): string {
  return (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement).value;
}

function main(): void {
  const setupSection = byId("setup");
  const experimentSection = byId("experiment");

  const chooseLeft = byId<HTMLButtonElement>("choose-left");
  const chooseRight = byId<HTMLButtonElement>("choose-right");
  const nextButton = byId<HTMLButtonElement>("next-button");
  const restartButton = byId<HTMLButtonElement>("restart-button");

  enforceIntegerMessage(byId<HTMLInputElement>("iterations"));
  enforceIntegerMessage(byId<HTMLInputElement>("threshold"));

  const view = new View({
    leftA: byId("left-a"),
    leftB: byId("left-b"),
    rightA: byId("right-a"),
    rightB: byId("right-b"),
    tableBody: byId("debug-body"),
    status: byId("status"),
    choices: byId("choices"),
    buttons: [chooseLeft, chooseRight],
    sliderArea: byId("slider-area"),
    slider: byId<HTMLInputElement>("slider"),
    sliderValue: byId("slider-value"),
    sliderConfirm: byId<HTMLButtonElement>("slider-confirm"),
    next: byId("next"),
    end: byId("end"),
    taskInfo: byId("task-info"),
    result: byId("result"),
  });

  let experiment: Experiment | null = null;

  byId<HTMLFormElement>("setup-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const algoName = checkedValue("algorithm");
    const stopKind = checkedValue("stop");
    const boundScheme = checkedValue("bound") as BoundScheme;
    const n = Number(byId<HTMLInputElement>("iterations").value);
    const threshold = Number(byId<HTMLInputElement>("threshold").value);

    const config: ExperimentConfig = { ...EXP_BASE_CONFIG, boundScheme };
    experiment = new Experiment(
      config,
      () => makeAlgorithm(algoName),
      () => makeStopCondition(stopKind, n, threshold),
      view
    );

    setupSection.hidden = true;
    experimentSection.hidden = false;
    experiment.start();
  });

  chooseLeft.onclick = () => experiment?.choose("left");
  chooseRight.onclick = () => experiment?.choose("right");
  nextButton.onclick = () => experiment?.next();

  // 返回開始：回到設定畫面
  restartButton.onclick = () => {
    experiment = null;
    experimentSection.hidden = true;
    setupSection.hidden = false;
  };
}

main();
