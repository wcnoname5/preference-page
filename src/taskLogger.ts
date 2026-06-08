export interface KTRatioEntry {
  i: number;
  ratioPos: number | null; // -v(-xi+) / v(xi+)
  ratioNeg: number | null; // -v(xi-) / v(-xi-)
}

export interface KTResult {
  entries: KTRatioEntry[];
  mean: number;
  median: number;
  classification: "loss_averse" | "gain_seeking" | "neutral";
}

export interface KWResult {
  lambda: number;
  classification: "loss_averse" | "gain_seeking" | "neutral";
}

export interface LossAversionResult {
  kw: KWResult;
  kt: KTResult;
}

type Seq = { name: string; value: number }[];

// v(seq[j]) = j - zeroIdx (utility increases by 1 per step)
function interpolateUtility(y: number, seq: Seq): number | null {
  const zeroIdx = seq.findIndex((s) => s.name === "0");
  for (let j = 0; j < seq.length - 1; j++) {
    const lo = seq[j].value;
    const hi = seq[j + 1].value;
    if (lo <= y && y <= hi) {
      const t = hi === lo ? 0 : (y - lo) / (hi - lo);
      return j - zeroIdx + t;
    }
  }
  return null; // out of sequence range
}

function calcMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function computeKW(seq: Seq): KWResult {
  const x1pos = seq.find((s) => s.name === "x1+")!.value;
  const x1neg = seq.find((s) => s.name === "x1-")!.value;
  const lambda = x1pos / -x1neg;
  const classification = lambda > 1 ? "loss_averse" : lambda < 1 ? "gain_seeking" : "neutral";
  return { lambda, classification };
}

function computeKT(seq: Seq, k: number): KTResult {
  const zeroIdx = seq.findIndex((s) => s.name === "0");
  const entries: KTRatioEntry[] = [];

  for (let i = 1; i <= k; i++) {
    const xiPos = seq[zeroIdx + i].value; // x_i^+, positive
    const xiNeg = seq[zeroIdx - i].value; // x_i^-, negative

    // -v(-xi+) / v(xi+): v(xi+) = i by standard sequence construction
    const vNegXiPos = interpolateUtility(-xiPos, seq);
    const ratioPos = vNegXiPos !== null ? -vNegXiPos / i : null;

    // -v(xi-) / v(-xi-): v(xi-) = -i, so -v(xi-) = i
    const vNegXiNeg = interpolateUtility(-xiNeg, seq);
    const ratioNeg = vNegXiNeg !== null ? i / vNegXiNeg : null;

    entries.push({ i, ratioPos, ratioNeg });
  }

  const allRatios = entries
    .flatMap((e) => [e.ratioPos, e.ratioNeg])
    .filter((r): r is number => r !== null);

  const mean =
    allRatios.length > 0 ? allRatios.reduce((s, v) => s + v, 0) / allRatios.length : NaN;
  const median = allRatios.length > 0 ? calcMedian(allRatios) : NaN;

  const total = allRatios.length;
  const above = allRatios.filter((r) => r > 1).length;
  const below = allRatios.filter((r) => r < 1).length;
  const classification =
    above > total / 2 ? "loss_averse" : below > total / 2 ? "gain_seeking" : "neutral";

  return { entries, mean, median, classification };
}

// Record every elicited target value（L, x1pos, x1neg, L2, G2, x2pos, ...）。
// Later task will read values from TaskLogger to build new alternatives]
export class TaskLogger {
  private readonly values = new Map<string, number>();

  record(name: string, value: number): void {
    this.values.set(name, value);
  }

  has(name: string): boolean {
    return this.values.has(name);
  }

  get(name: string): number {
    const v = this.values.get(name);
    if (v === undefined) {
      throw new Error(`TaskLogger: "${name}" not elicited`);
    }
    return v;
  }

  // { x_k-, ..., x1-, 0, x1+, ..., x_k+ }
  finalSequence(k: number): Seq {
    const seq: Seq = [];
    for (let i = k; i >= 1; i--) {
      seq.push({ name: `x${i}-`, value: this.get(`x${i}neg`) });
    }
    seq.push({ name: "0", value: 0 });
    for (let i = 1; i <= k; i++) {
      seq.push({ name: `x${i}+`, value: this.get(`x${i}pos`) });
    }
    return seq;
  }

  computeLossAversion(k: number): LossAversionResult {
    const seq = this.finalSequence(k);
    return { kw: computeKW(seq), kt: computeKT(seq, k) };
  }
}
