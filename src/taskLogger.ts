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
  finalSequence(k: number): { name: string; value: number }[] {
    const seq: { name: string; value: number }[] = [];
    for (let i = k; i >= 1; i--) {
      seq.push({ name: `x${i}-`, value: this.get(`x${i}neg`) });
    }
    seq.push({ name: "0", value: 0 });
    for (let i = 1; i <= k; i++) {
      seq.push({ name: `x${i}+`, value: this.get(`x${i}pos`) });
    }
    return seq;
  }
}
