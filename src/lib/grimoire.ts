/** Custo em pontos de personagem por magia inicial no Grimório / Livro de Orações. */
export const GRIMOIRE_SPELL_POINT_COST = 3;

/** Entrada no Grimório / Livro de Orações. */
export interface GrimoireEntry {
  name: string;
  /** Magia inicial — custa pontos de personagem quando true. */
  initial: boolean;
}

export function normalizeGrimoire(raw: unknown): GrimoireEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: GrimoireEntry[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const name = item.trim();
      if (name) entries.push({ name, initial: true });
      continue;
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      if (!name) continue;
      entries.push({
        name,
        initial: record.initial !== false,
      });
    }
  }
  return entries;
}

export function getGrimoirePointCost(grimoire: GrimoireEntry[]): number {
  return grimoire.filter((e) => e.initial).length * GRIMOIRE_SPELL_POINT_COST;
}

export function grimoireHasSpell(grimoire: GrimoireEntry[], name: string): boolean {
  return grimoire.some((e) => e.name === name);
}
