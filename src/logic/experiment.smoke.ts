// Smoke check: drive a full HaB run through the controller, headless.
// Run with: npm run smoke
import assert from "node:assert";
import { ExperimentController, type ExperimentState } from "./experiment";
import { HaB } from "./algorithms";
import { FixedIterations } from "./stopConditions";
import { EXP_BASE_CONFIG } from "./config";

let snap: ExperimentState | null = null;
const ctrl = new ExperimentController(
  { ...EXP_BASE_CONFIG, boundScheme: "equal_expectation" },
  () => new HaB(),
  () => new FixedIterations(5),
  (s) => { snap = s; }
);
ctrl.start();

let guard = 0;
while (snap!.phase !== "done") {
  if (snap!.phase === "choosing") ctrl.choose("left");
  else if (snap!.phase === "roundDone") ctrl.next();
  if (guard++ > 1000) throw new Error("controller did not reach 'done'");
}

const seq = snap!.result!.sequence;
assert.equal(seq.length, 2 * EXP_BASE_CONFIG.k + 1, "sequence length should be 2k+1");
assert.ok(seq.some((s) => s.name === "0"), "sequence must contain the zero anchor");
console.log("smoke OK — reached done, sequence length", seq.length);
