// Vantagens/desvantagens por raça e classe — carregadas de src/data/advantages/ (JSON + MD).
export type {
  RaceClassAdvantage,
  RaceClassCategory,
  ProgressPointsCost,
  ProgressPointsCostByContext,
} from "./advantages";

export {
  raceClassAdvantages,
  categoryLabels,
  matchesApplicableRace,
  matchesApplicableClass,
  isRaceClassAdvantageNative,
  getRaceClassAdvantageCost,
  isRaceClassAdvantageAvailable,
  getProgressPointsCost,
} from "./advantages";
