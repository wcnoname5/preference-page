import { Router } from "./router.js";
import { SetupPage } from "./pages/setup.js";
import { ExperimentPage } from "./pages/experiment.js";
import { ResultPage } from "./pages/result.js";
import { byId } from "./dom.js";

function main(): void {
  const router = new Router({
    setup: byId("setup"),
    experiment: byId("experiment"),
    result: byId("result"),
  });

  const resultPage = new ResultPage(byId("result"), () => {
    byId("end").hidden = true;
    router.navigate("setup");
  });

  const experimentPage = new ExperimentPage(
    {
      leftA: byId("left-a"),
      leftB: byId("left-b"),
      rightA: byId("right-a"),
      rightB: byId("right-b"),
      tableBody: byId("debug-body"),
      status: byId("status"),
      choices: byId("choices"),
      buttons: [byId<HTMLButtonElement>("choose-left"), byId<HTMLButtonElement>("choose-right")],
      sliderArea: byId("slider-area"),
      slider: byId<HTMLInputElement>("slider"),
      sliderValue: byId("slider-value"),
      sliderConfirm: byId<HTMLButtonElement>("slider-confirm"),
      next: byId("next"),
      nextButton: byId<HTMLButtonElement>("next-button"),
    },
    (sequence, lossAversion) => {
      router.navigate("result");
      resultPage.show(sequence, lossAversion);
    }
  );

  new SetupPage((config, makeAlgorithm, makeStopCondition) => {
    router.navigate("experiment");
    experimentPage.start(config, makeAlgorithm, makeStopCondition);
  });
}

main();
