import { BoundScheme, ExperimentConfig, StopCondition, UpdateAlgorithm } from "../types.js";
import { HaB, ASA, BiM, BiMS } from "../algorithms.js";
import { Convergence, FixedIterations } from "../stopConditions.js";
import { EXP_BASE_CONFIG } from "../config.js";
import { byId } from "../dom.js";

export type StartCallback = (
  config: ExperimentConfig,
  makeAlgorithm: () => UpdateAlgorithm,
  makeStopCondition: () => StopCondition
) => void;

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

export class SetupPage {
  constructor(private readonly onStart: StartCallback) {
    enforceIntegerMessage(byId<HTMLInputElement>("iterations"));
    enforceIntegerMessage(byId<HTMLInputElement>("threshold"));

    byId<HTMLFormElement>("setup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.submit();
    });
  }

  private submit(): void {
    const algoName = checkedValue("algorithm");
    const stopKind = checkedValue("stop");
    const boundScheme = checkedValue("bound") as BoundScheme;
    const n = Number(byId<HTMLInputElement>("iterations").value);
    const threshold = Number(byId<HTMLInputElement>("threshold").value);

    const config: ExperimentConfig = { ...EXP_BASE_CONFIG, boundScheme };
    this.onStart(
      config,
      () => makeAlgorithm(algoName),
      () => makeStopCondition(stopKind, n, threshold)
    );
  }
}
