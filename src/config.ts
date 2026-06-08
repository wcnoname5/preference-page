import { ExperimentConfig } from "./types.js";

export const EXP_BASE_CONFIG: Omit<ExperimentConfig, "boundScheme"> = {
  G: 2000,
  g: 300,
  l: -300,
  k: 6,
};

export const DEFAULT_ASAc = 640; // twice of initial step size