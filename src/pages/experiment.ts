import { stdSeq, ExperimentConfig, StopCondition, UpdateAlgorithm } from "../types.js";
import { View, ViewElements } from "../view.js";
import { Experiment } from "../runner.js";
import { LossAversionResult } from "../taskLogger.js";

export type DoneCallback = (
  sequence: stdSeq,
  lossAversion: LossAversionResult
) => void;

export interface ExperimentPageElements extends ViewElements {
  nextButton: HTMLButtonElement;
}

export class ExperimentPage {
  private readonly view: View;
  private experiment: Experiment | null = null;

  constructor(els: ExperimentPageElements, private readonly onDone: DoneCallback) {
    this.view = new View(els);
    els.buttons[0].onclick = () => this.experiment?.choose("left");
    els.buttons[1].onclick = () => this.experiment?.choose("right");
    els.nextButton.onclick = () => this.experiment?.next();
  }

  start(
    config: ExperimentConfig,
    makeAlgorithm: () => UpdateAlgorithm,
    makeStopCondition: () => StopCondition
  ): void {
    this.experiment = new Experiment(config, makeAlgorithm, makeStopCondition, this.view, this.onDone);
    this.experiment.start();
  }
}
