export const MAGIC_EXTRA_ADVANTAGE = "Ponto de Magia Extra";
export const MAGIC_EXTRA_SCHOOL_ADVANTAGE = "Ponto de Magia Extra (Escola)";

export function countSelectedAdvantage(
  selectedRaceClassAdv: string[],
  name: string
): number {
  return selectedRaceClassAdv.filter((n) => n === name).length;
}

/** Mínimo sugerido: 1 se tem magia + antecedentes extras. */
export function computeSuggestedManaMax(
  hasMagicAccess: boolean,
  selectedRaceClassAdv: string[]
): number {
  if (!hasMagicAccess) return 0;
  return 1 + countSelectedAdvantage(selectedRaceClassAdv, MAGIC_EXTRA_ADVANTAGE);
}

/** Mínimo sugerido: 1 se especialista + antecedente da escola. */
export function computeSuggestedSpecialistManaMax(
  arcaneSpecialist: string | null,
  selectedRaceClassAdv: string[]
): number {
  if (!arcaneSpecialist) return 0;
  return 1 + countSelectedAdvantage(selectedRaceClassAdv, MAGIC_EXTRA_SCHOOL_ADVANTAGE);
}

export function resolveResourceCurrent(
  current: number | null | undefined,
  max: number
): number {
  if (current == null || Number.isNaN(current)) {
    return Math.max(0, max);
  }
  return Math.max(0, current);
}

export function normalizeResourceMax(value: unknown): number {
  if (value == null || Number.isNaN(Number(value))) return 0;
  return Math.max(0, Math.floor(Number(value)));
}

export function normalizeResourceCurrent(
  value: unknown
): number | null {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Math.max(0, Math.floor(Number(value)));
}
