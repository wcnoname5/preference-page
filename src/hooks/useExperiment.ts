import { useCallback, useRef, useState } from "react";
import { ExperimentController, type ExperimentState } from "../logic/experiment";
import type {
  ExperimentConfig,
  Selection,
  StopCondition,
  UpdateAlgorithm,
} from "../logic/types";

// React 端對 ExperimentController 的封裝：controller 存在 ref，state 存在 useState。
// controller 每次 emit 就 setState，觸發重畫。
export function useExperiment() {
  const controller = useRef<ExperimentController | null>(null);
  const [state, setState] = useState<ExperimentState | null>(null);

  const start = useCallback(
    (
      config: ExperimentConfig,
      makeAlgorithm: () => UpdateAlgorithm,
      makeStopCondition: () => StopCondition
    ) => {
      const c = new ExperimentController(config, makeAlgorithm, makeStopCondition, setState);
      controller.current = c;
      c.start();
    },
    []
  );

  const choose = useCallback((s: Selection) => controller.current?.choose(s), []);
  const next = useCallback(() => controller.current?.next(), []);
  const slideTo = useCallback((v: number) => controller.current?.slideTo(v), []);
  const confirmSlider = useCallback((v: number) => controller.current?.confirmSlider(v), []);
  const reset = useCallback(() => {
    controller.current = null;
    setState(null);
  }, []);

  return { state, start, choose, next, slideTo, confirmSlider, reset };
}
