import { Alternatives, BoundScheme, ExperimentConfig, Task, TargetCell } from "./types";
import { TaskLogger } from "./taskLogger";

const FIXED_BND_WIDTH = 5000;

// Place elicited value to target cell
export function placeTarget(
  template: Alternatives,
  target: TargetCell,
  value: number,
  isTargetSureThing: boolean
): Alternatives {
  const prev = template[target.side];
  const option = isTargetSureThing
    ? { payoffA: value, payoffB: value }
    : {
        payoffA: target.field === "payoffA" ? value : prev.payoffA,
        payoffB: target.field === "payoffB" ? value : prev.payoffB,
      };
  return target.side === "left"
    ? { left: option, right: template.right }
    : { left: template.left, right: option };
}

// Order of all elicited targets: L, x1pos, x1neg, L2, G2, x2pos, x2neg, ..., x_k pos/neg
export function targetNames(k: number): string[] {
  if (k < 0) throw new Error(`k must be positive, got ${k}`);
  if (!Number.isInteger(k)) throw new Error(`k must be an integer, got ${k}`);
  const names = ["L", "x1pos", "x1neg", "L2", "G2"];
  for (let i = 2; i <= k; i++) {
    names.push(`x${i}pos`, `x${i}neg`);
  }
  return names;
}


// ======== Initial point and boundary (initial Condition) ========
interface InitCond {
  start: number; 
  bnds: [number, number];
}

// Loss-type target (boundary < 0)
function lossChained(
  left: { payoffA: number; payoffB: number },
  rightStim: number,
  scheme: BoundScheme
): InitCond {
  const leftPos = left.payoffA;
  const leftNeg = left.payoffB;
  if (scheme === "fixed_bnd") {
    const upper = leftNeg;
    const lower = upper - FIXED_BND_WIDTH;
    return { start: Math.round((lower + upper) / 2), bnds: [lower, upper] };
  }
  // Default: Equal expectation
  const start = leftPos + leftNeg - rightStim;
  const upper = leftNeg;
  const lower = upper + 2 * (start - upper);
  return { start: Math.round(start), bnds: [Math.round(lower), Math.round(upper)] };
}

// Gain-type target
function gainChained(
  left: { payoffA: number; payoffB: number },
  rightStim: number,
  scheme: BoundScheme
): InitCond {
  const leftPos = left.payoffA;
  const leftNeg = left.payoffB;
  if (scheme === "fixed_bnd") {
    const lower = leftPos;
    const upper = lower + FIXED_BND_WIDTH;
    return { start: Math.round((lower + upper) / 2), bnds: [lower, upper] };
  }
  const start = leftPos + leftNeg - rightStim;
  const lower = leftPos;
  const upper = lower + 2 * (start - lower);
  return { start: Math.round(start), bnds: [Math.round(lower), Math.round(upper)] };
}

// 建出第 index 個 target 的完整 Task（讀 logger 取得先前 elicit 的值來 chain）。
export function buildTask(index: number, logger: TaskLogger, config: ExperimentConfig): Task {
  const { G, g, l, k, boundScheme } = config;
  const name = targetNames(k)[index];

  // ---- Stage 1 ----
  if (name === "L") {
    // (G, L) ~ 0
    const start = boundScheme === "fixed_bnd" ? -FIXED_BND_WIDTH / 2 : -G;
    const bnds: [number, number] = boundScheme === "fixed_bnd" ? [-FIXED_BND_WIDTH, 0] : [-2 * G, 0];
    return {
      name,
      stage: 1,
      template: { left: { payoffA: G, payoffB: start }, right: { payoffA: 0, payoffB: 0 } },
      target: { side: "left", field: "payoffB" },
      isTargetSureThing: false,
      initialValue: start,
      bnds,
    };
  }

  if (name === "x1pos") {
    // (G, 0) ~ x1+; bounds: [0, G]
    const bnds: [number, number] = [0, G];
    const start = Math.round(G / 2);
    return {
      name,
      stage: 1,
      template: { left: { payoffA: G, payoffB: 0 }, right: { payoffA: start, payoffB: start } },
      target: { side: "right", field: "payoffA" },
      isTargetSureThing: true,
      initialValue: start,
      bnds,
    };
  }

  if (name === "x1neg") {
    // (0, L) ~ x1-，bounds: [L, 0]
    const L = logger.get("L");
    const bnds: [number, number] = [L, 0];
    const start = Math.round(L / 2);
    return {
      name,
      stage: 1,
      template: { left: { payoffA: 0, payoffB: L }, right: { payoffA: start, payoffB: start } },
      target: { side: "right", field: "payoffA" },
      isTargetSureThing: true,
      initialValue: start,
      bnds,
    };
  }

  // ---- Stage 2（gain standard sequence）----
  if (name === "L2") {
    // (0, l1) ~ (x1+, L2)
    const x1pos = logger.get("x1pos");
    const left = { payoffA: 0, payoffB: l };
    const { start, bnds } = lossChained(left, x1pos, boundScheme);
    return {
      name,
      stage: 2,
      template: { left: left, right: { payoffA: x1pos, payoffB: start } },
      target: { side: "right", field: "payoffB" },
      isTargetSureThing: false,
      initialValue: start,
      bnds,
    };
  }

  const posMatch = name.match(/^x(\d+)pos$/);
  if (posMatch) {
    // (x_{i-1}+, l1) ~ (x_i+, L2)
    const i = Number(posMatch[1]);
    const prev = logger.get(`x${i - 1}pos`);
    const L2 = logger.get("L2");
    const left = { payoffA: prev, payoffB: l };
    const { start, bnds } = gainChained(left, L2, boundScheme);
    return {
      name,
      stage: 2,
      template: { left: left, right: { payoffA: start, payoffB: L2 } },
      target: { side: "right", field: "payoffA" },
      isTargetSureThing: false,
      initialValue: start,
      bnds,
    };
  }

  // ---- Stage 3（loss standard sequence）----
  if (name === "G2") {
    // (g1, 0) ~ (G2, x1-)
    const x1neg = logger.get("x1neg");
    const left = { payoffA: g, payoffB: 0 };
    const { start, bnds } = gainChained(left, x1neg, boundScheme);
    return {
      name,
      stage: 3,
      template: {left: left, right: { payoffA: start, payoffB: x1neg } },
      target: { side: "right", field: "payoffA" },
      isTargetSureThing: false,
      initialValue: start,
      bnds,
    };
  }

  const negMatch = name.match(/^x(\d+)neg$/);
  if (negMatch) {
    // (g1, x_{i-1}-) ~ (G2, x_i-)
    const i = Number(negMatch[1]);
    const prev = logger.get(`x${i - 1}neg`);
    const G2 = logger.get("G2");
    const left = { payoffA: g, payoffB: prev };
    const { start, bnds } = lossChained(left, G2, boundScheme);
    return {
      name,
      stage: 3,
      template: { left: left, right: { payoffA: G2, payoffB: start } },
      target: { side: "right", field: "payoffB" },
      isTargetSureThing: false,
      initialValue: start,
      bnds,
    };
  }

  throw new Error(`未知的 target 名稱：${name}`);
}
