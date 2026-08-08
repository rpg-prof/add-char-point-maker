import {
  attackBaseTotalCost,
  EVOLUTION_COSTS,
  magicLevelTotalCost,
  progressionPointsForLevel,
  scaledLevelUpgradeCost,
} from "@/data/characterEvolution";
import { RESISTANCE_DEFS } from "@/lib/resistanceStats";
import { getProgressPointsCost, raceClassAdvantages } from "@/data/raceClassAdvantages";
import { getSkillCost, skills } from "@/data/skills";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import type { PointBreakdown } from "@/lib/pointBreakdown";
import type { ProgressionEntry } from "@/lib/pointBreakdown";

export interface EvolutionProgress {
  attackBaseLevel: number;
  magicLevel: number;
  chiLevel: number;
  attacksPerRoundLevel: number;
  backstabLevel: number;
  /** Nível de cada poder (nome → nível). */
  powerLevels: Record<string, number>;
  /** PV comprados por nível de personagem (máx. 12/nível). */
  hpByLevel: Record<number, number>;
  /** % de resistência comprada por nível: resistência → nível → % */
  resistanceByLevel: Record<string, Record<number, number>>;
  /** Bônus de teste de perícia (+1 por compra). */
  skillBonuses: Record<string, number>;
  /** Nível de cada perícia comum (nome → nível; base 1). */
  skillLevels: Record<string, number>;
  spokenLanguages: number;
  writtenLanguages: number;
  arcaneManaPurchased: number;
  divineManaPurchased: number;
  specialistManaPurchased: number;
  /** Itens adquiridos com pontos de progressão (além da criação). */
  evolutionSkills: string[];
  evolutionWeapons: string[];
  evolutionWeaponGroups: string[];
  evolutionShields: string[];
  evolutionRaceClassAdv: string[];
}

export const BACKSTAB_ADVANTAGE_NAME = "Ataque Pelas Costas";

export function hasBackstabAdvantage(
  selectedRaceClassAdv: string[],
  evolutionRaceClassAdv: string[] = [],
): boolean {
  const target = BACKSTAB_ADVANTAGE_NAME.toLowerCase();
  return [...selectedRaceClassAdv, ...evolutionRaceClassAdv].some(
    (name) => name.toLowerCase() === target,
  );
}

export const defaultEvolutionProgress = (): EvolutionProgress => ({
  attackBaseLevel: 0,
  magicLevel: 1,
  chiLevel: 1,
  attacksPerRoundLevel: 0,
  backstabLevel: 0,
  powerLevels: {},
  hpByLevel: {},
  resistanceByLevel: {},
  skillBonuses: {},
  skillLevels: {},
  spokenLanguages: 0,
  writtenLanguages: 0,
  arcaneManaPurchased: 0,
  divineManaPurchased: 0,
  specialistManaPurchased: 0,
  evolutionSkills: [],
  evolutionWeapons: [],
  evolutionWeaponGroups: [],
  evolutionShields: [],
  evolutionRaceClassAdv: [],
});

export function normalizeEvolutionProgress(raw: unknown): EvolutionProgress {
  const base = defaultEvolutionProgress();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<EvolutionProgress>;
  return {
    ...base,
    ...data,
    powerLevels: data.powerLevels ?? {},
    hpByLevel: data.hpByLevel ?? {},
    resistanceByLevel: data.resistanceByLevel ?? {},
    skillBonuses: data.skillBonuses ?? {},
    skillLevels: data.skillLevels ?? {},
    evolutionSkills: data.evolutionSkills ?? [],
    evolutionWeapons: data.evolutionWeapons ?? [],
    evolutionWeaponGroups: data.evolutionWeaponGroups ?? [],
    evolutionShields: data.evolutionShields ?? [],
    evolutionRaceClassAdv: data.evolutionRaceClassAdv ?? [],
  };
}

export function totalProgressionPoints(history: ProgressionEntry[]): number {
  return history.reduce((sum, entry) => sum + entry.points, 0);
}

export function characterLevelFromHistory(history: ProgressionEntry[]): number {
  if (history.length === 0) return 1;
  return Math.max(...history.map((e) => e.level));
}

function powerUpgradeMultiplier(powerName: string): number {
  const lower = powerName.toLowerCase();
  if (lower.includes("dominar")) return 5;
  return 3;
}

function pushPositive(breakdown: PointBreakdown, label: string, value: number) {
  if (value > 0) breakdown.positive.push({ label, value });
}

export interface EvolutionSpendContext {
  selectedClass: string;
  selectedRace: string;
  selectedSkills: string[];
  selectedRaceClassAdv: string[];
  evolutionRaceClassAdv: string[];
  arcaneSpecialist: string | null;
  hasArcaneAccess: boolean;
  hasDivineAccess: boolean;
}

export function getEvolutionSpendBreakdown(
  progress: EvolutionProgress,
  ctx: EvolutionSpendContext,
): PointBreakdown {
  const breakdown: PointBreakdown = { positive: [], negative: [] };

  if (progress.attackBaseLevel > 0) {
    pushPositive(
      breakdown,
      `Base de Ataque (nv. ${progress.attackBaseLevel})`,
      attackBaseTotalCost(progress.attackBaseLevel),
    );
  }

  if (progress.magicLevel > 1) {
    pushPositive(
      breakdown,
      `Nível de Magia (nv. ${progress.magicLevel})`,
      magicLevelTotalCost(progress.magicLevel),
    );
  }

  if (progress.chiLevel > 1) {
    let chiCost = 0;
    for (let level = 1; level < progress.chiLevel; level++) {
      chiCost += scaledLevelUpgradeCost(level, 5);
    }
    pushPositive(breakdown, `Nível de Chi (nv. ${progress.chiLevel})`, chiCost);
  }

  if (progress.attacksPerRoundLevel > 0) {
    pushPositive(
      breakdown,
      `Ataques/Rodada (nv. ${progress.attacksPerRoundLevel})`,
      progress.attacksPerRoundLevel * EVOLUTION_COSTS.attacksPerRoundLevel,
    );
  }

  if (
    progress.backstabLevel > 0 &&
    hasBackstabAdvantage(ctx.selectedRaceClassAdv, ctx.evolutionRaceClassAdv)
  ) {
    pushPositive(
      breakdown,
      `Ataque pelas Costas (nv. ${progress.backstabLevel})`,
      progress.backstabLevel * EVOLUTION_COSTS.backstabLevel,
    );
  }

  for (const [levelStr, hp] of Object.entries(progress.hpByLevel)) {
    if (hp > 0) {
      pushPositive(breakdown, `PV (nível ${levelStr})`, hp * EVOLUTION_COSTS.hpPerPoint);
    }
  }

  for (const [resKey, byLevel] of Object.entries(progress.resistanceByLevel)) {
    const label =
      RESISTANCE_DEFS.find((d) => d.key === resKey)?.label ?? resKey;
    for (const [levelStr, pct] of Object.entries(byLevel)) {
      if (pct > 0) {
        pushPositive(
          breakdown,
          `Resistência ${label} (nível ${levelStr})`,
          pct * EVOLUTION_COSTS.resistancePerPercent,
        );
      }
    }
  }

  if (progress.spokenLanguages > 0) {
    pushPositive(
      breakdown,
      `Idiomas falados (+${progress.spokenLanguages})`,
      progress.spokenLanguages * EVOLUTION_COSTS.spokenLanguage,
    );
  }
  if (progress.writtenLanguages > 0) {
    pushPositive(
      breakdown,
      `Idiomas escritos (+${progress.writtenLanguages})`,
      progress.writtenLanguages * EVOLUTION_COSTS.writtenLanguage,
    );
  }

  if (progress.arcaneManaPurchased > 0) {
    const unit = ctx.arcaneSpecialist
      ? EVOLUTION_COSTS.arcaneSpecialistMana
      : EVOLUTION_COSTS.arcaneMana;
    pushPositive(
      breakdown,
      `Pontos de Magia Arcana (+${progress.arcaneManaPurchased})`,
      progress.arcaneManaPurchased * unit,
    );
  }
  if (progress.divineManaPurchased > 0) {
    pushPositive(
      breakdown,
      `Pontos de Magia Divina (+${progress.divineManaPurchased})`,
      progress.divineManaPurchased * EVOLUTION_COSTS.divineMana,
    );
  }
  if (progress.specialistManaPurchased > 0) {
    pushPositive(
      breakdown,
      `Pontos Escola Especialista (+${progress.specialistManaPurchased})`,
      progress.specialistManaPurchased * EVOLUTION_COSTS.arcaneSpecialistMana,
    );
  }

  for (const name of progress.evolutionSkills) {
    const skill = skills.find((s) => s.name === name);
    if (skill) {
      pushPositive(
        breakdown,
        `Perícia: ${name}`,
        getSkillCost(skill, ctx.selectedClass),
      );
    }
  }

  for (const [skillName, bonus] of Object.entries(progress.skillBonuses)) {
    if (bonus <= 0) continue;
    const skill = skills.find((s) => s.name === skillName);
    if (!skill) continue;
    const unit = getSkillCost(skill, ctx.selectedClass);
    pushPositive(breakdown, `Bônus perícia: ${skillName} (+${bonus})`, unit * bonus);
  }

  for (const groupName of progress.evolutionWeaponGroups) {
    const group = weaponGroups.find((g) => g.name === groupName);
    if (group?.costGroup != null) {
      pushPositive(breakdown, `Grupo de Armas: ${groupName}`, group.costGroup);
    }
  }

  for (const weaponKey of progress.evolutionWeapons) {
    const [groupName, weaponName] = weaponKey.split("::");
    if (progress.evolutionWeaponGroups.includes(groupName)) continue;
    const group = weaponGroups.find((g) => g.name === groupName);
    if (group) {
      const label = weaponName ? `${group.name}: ${weaponName}` : group.name;
      pushPositive(breakdown, `Arma: ${label}`, group.costPerWeapon);
    }
  }

  for (const shieldName of progress.evolutionShields) {
    const shield = shieldProficiencies.find((s) => s.name === shieldName);
    if (shield) pushPositive(breakdown, `Escudo: ${shieldName}`, shield.cost);
  }

  for (const name of progress.evolutionRaceClassAdv) {
    const item = raceClassAdvantages.find((a) => a.name === name);
    if (!item) continue;
    const cost = getProgressPointsCost(item, ctx.selectedRace, ctx.selectedClass);
    if (cost != null) pushPositive(breakdown, item.name, cost);
  }

  for (const [powerName, level] of Object.entries(progress.powerLevels)) {
    if (level <= 1) continue;
    const mult = powerUpgradeMultiplier(powerName);
    let total = 0;
    for (let lv = 1; lv < level; lv++) {
      total += lv * mult;
    }
    if (total > 0) pushPositive(breakdown, `${powerName} (nv. ${level})`, total);
  }

  return breakdown;
}

export function sumEvolutionSpent(breakdown: PointBreakdown): number {
  return breakdown.positive.reduce((sum, e) => sum + e.value, 0);
}

export function getHpPurchasedAtLevel(progress: EvolutionProgress, level: number): number {
  return progress.hpByLevel[level] ?? 0;
}

export function getResistancePurchasedAtLevel(
  progress: EvolutionProgress,
  resistanceKey: string,
  level: number,
): number {
  return progress.resistanceByLevel[resistanceKey]?.[level] ?? 0;
}

/** Soma o bônus de evolução (%) de uma resistência em todos os níveis. */
export function getTotalEvolutionResistanceBonus(
  progress: EvolutionProgress,
  resistanceKey: string,
): number {
  const byLevel = progress.resistanceByLevel[resistanceKey];
  if (!byLevel) return 0;
  return Object.values(byLevel).reduce((sum, pct) => sum + pct, 0);
}

/** Mapa resistência → bônus total (%) adquirido com pontos de progressão. */
export function getEvolutionResistanceBonuses(
  progress: EvolutionProgress,
): Record<string, number> {
  const bonuses: Record<string, number> = {};
  for (const def of RESISTANCE_DEFS) {
    const total = getTotalEvolutionResistanceBonus(progress, def.key);
    if (total > 0) bonuses[def.key] = total;
  }
  return bonuses;
}

export function inferInitialPowerLevels(selectedRaceClassAdv: string[]): Record<string, number> {
  const levels: Record<string, number> = {};
  for (const name of selectedRaceClassAdv) {
    const item = raceClassAdvantages.find((a) => a.name === name);
    if (item?.category === "poder") levels[name] = 1;
  }
  return levels;
}

export function mergePowerLevels(
  fromCreation: string[],
  fromProgress: Record<string, number>,
): Record<string, number> {
  const merged = inferInitialPowerLevels(fromCreation);
  for (const [name, level] of Object.entries(fromProgress)) {
    merged[name] = Math.max(merged[name] ?? 0, level);
  }
  return merged;
}

/** Nível de uma perícia comum (mínimo 1). */
export function getSkillLevel(
  skillName: string,
  skillLevels?: Record<string, number> | null,
): number {
  const level = skillLevels?.[skillName];
  if (level == null || !Number.isFinite(level)) return 1;
  return Math.max(1, Math.floor(level));
}

export function nextEvolveLevel(history: ProgressionEntry[]): number {
  if (history.length === 0) return 2;
  return Math.max(...history.map((e) => e.level)) + 1;
}

export function createProgressionEntry(level: number): ProgressionEntry {
  return {
    level,
    points: progressionPointsForLevel(level),
    timestamp: new Date().toISOString(),
  };
}
