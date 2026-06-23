import {
  attributeNames,
  races,
  classes,
  socialClasses,
  reputations,
  generalAdvantages,
  generalDisadvantages,
  type AttributeName,
} from "@/data/characterData";
import { skills, getSkillCost } from "@/data/skills";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import {
  divineSpheres,
  arcaneSchools,
  divineSphereCost,
  arcaneSchoolCost,
} from "@/data/magicAccess";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import type { DivineAccessLevel } from "@/components/MagicAccessPanel";

export interface PointEntry {
  label: string;
  value: number;
}

export interface PointBreakdown {
  positive: PointEntry[];
  negative: PointEntry[];
}

const ATTRIBUTE_BASE = 10;
const CHARACTER_POINTS = 100;

function pushCost(breakdown: PointBreakdown, label: string, cost: number) {
  if (cost === 0) return;
  if (cost > 0) breakdown.positive.push({ label, value: cost });
  else breakdown.negative.push({ label, value: Math.abs(cost) });
}

export function getAttributeBreakdown(
  attributes: Record<AttributeName, number>
): PointBreakdown {
  const breakdown: PointBreakdown = { positive: [], negative: [] };

  for (const attr of attributeNames) {
    const val = attributes[attr];
    if (val > ATTRIBUTE_BASE) {
      breakdown.positive.push({ label: `${attr} (${val})`, value: val - ATTRIBUTE_BASE });
    } else if (val < ATTRIBUTE_BASE) {
      breakdown.negative.push({ label: `${attr} (${val})`, value: ATTRIBUTE_BASE - val });
    }
  }

  return breakdown;
}

/** Custo em pontos de personagem por magia no Grimório / Livro de Orações. */
export const GRIMOIRE_SPELL_POINT_COST = 3;

export interface CharacterPointContext {
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  selectedReputation: number;
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
  selectedSkills: string[];
  selectedWeapons: string[];
  selectedWeaponGroups: string[];
  selectedShields: string[];
  grimoire: string[];
  divineAccess: Record<string, DivineAccessLevel>;
  arcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
}

export function getCharacterPointBreakdown(ctx: CharacterPointContext): PointBreakdown {
  const breakdown: PointBreakdown = { positive: [], negative: [] };

  const race = races.find((r) => r.name === ctx.selectedRace);
  if (race) pushCost(breakdown, `Raça: ${race.name}`, race.cost);

  const cls = classes.find((c) => c.name === ctx.selectedClass);
  if (cls) pushCost(breakdown, `Classe: ${cls.name}`, cls.cost);

  const social = socialClasses.find((s) => s.name === ctx.selectedSocialClass);
  if (social) pushCost(breakdown, `Classe Social: ${social.name}`, social.cost);

  const reputation = reputations.find((r) => r.level === ctx.selectedReputation);
  if (reputation) pushCost(breakdown, `Reputação: Nv. ${reputation.level}`, reputation.cost);

  const allItems = [...generalAdvantages, ...generalDisadvantages];
  for (const name of ctx.selectedAdvantages) {
    const item = allItems.find((a) => a.name === name);
    if (item) pushCost(breakdown, item.name, item.cost);
  }

  for (const name of ctx.selectedRaceClassAdv) {
    const item = raceClassAdvantages.find((a) => a.name === name);
    if (!item) continue;
    const matchesRace = item.applicableRaces?.includes(ctx.selectedRace);
    const matchesClass = item.applicableClasses?.includes(ctx.selectedClass);
    const cost = matchesRace || matchesClass ? item.cost : (item.costOthers ?? item.cost);
    pushCost(breakdown, item.name, cost);
  }

  for (const name of ctx.selectedSkills) {
    const skill = skills.find((s) => s.name === name);
    if (skill) {
      pushCost(breakdown, `Perícia: ${skill.name}`, getSkillCost(skill, ctx.selectedClass));
    }
  }

  for (const groupName of ctx.selectedWeaponGroups) {
    const group = weaponGroups.find((g) => g.name === groupName);
    if (group?.costGroup != null) {
      pushCost(breakdown, `Grupo de Armas: ${group.name}`, group.costGroup);
    }
  }

  for (const weaponKey of ctx.selectedWeapons) {
    const [groupName, weaponName] = weaponKey.split("::");
    if (ctx.selectedWeaponGroups.includes(groupName)) continue;
    const group = weaponGroups.find((g) => g.name === groupName);
    if (group) {
      const label = weaponName ? `${group.name}: ${weaponName}` : group.name;
      pushCost(breakdown, `Arma: ${label}`, group.costPerWeapon);
    }
  }

  for (const name of ctx.selectedShields) {
    const shield = shieldProficiencies.find((s) => s.name === name);
    if (shield) pushCost(breakdown, `Escudo: ${shield.name}`, shield.cost);
  }

  for (const [name, level] of Object.entries(ctx.divineAccess)) {
    if (level !== "major" && level !== "minor") continue;
    const sphere = divineSpheres.find((s) => s.name === name);
    if (sphere) {
      const cost = divineSphereCost(sphere, level, ctx.selectedClass);
      const levelLabel = level === "minor" ? "menor" : "maior";
      pushCost(breakdown, `Esfera Divina: ${name} (${levelLabel})`, cost);
    }
  }

  for (const name of Object.keys(ctx.arcaneAccess)) {
    const school = arcaneSchools.find((s) => s.name === name);
    if (school) {
      pushCost(
        breakdown,
        `Escola Arcana: ${name}`,
        arcaneSchoolCost(school, ctx.selectedClass, ctx.selectedRace)
      );
    }
  }

  if (ctx.arcaneSpecialist) {
    const school = arcaneSchools.find((s) => s.name === ctx.arcaneSpecialist);
    if (school) {
      pushCost(
        breakdown,
        `Escola Arcana: ${school.name}`,
        arcaneSchoolCost(school, ctx.selectedClass, ctx.selectedRace)
      );
      if (school.specialization) {
        pushCost(breakdown, `Especialização: ${school.specialization.title}`, school.specialization.cost);
      }
    }
  }

  for (const spellName of ctx.grimoire) {
    pushCost(breakdown, `Magia: ${spellName}`, GRIMOIRE_SPELL_POINT_COST);
  }

  return breakdown;
}

export function sumBreakdown(breakdown: PointBreakdown): number {
  const positive = breakdown.positive.reduce((sum, e) => sum + e.value, 0);
  const negative = breakdown.negative.reduce((sum, e) => sum + e.value, 0);
  return positive - negative;
}

export interface ProgressionEntry {
  level: number;
  points: number;
}

export function getProgressionBreakdown(
  characterBreakdown: PointBreakdown,
  characterNetSpent: number,
  progressionHistory: ProgressionEntry[]
): PointBreakdown {
  const breakdown: PointBreakdown = { positive: [], negative: [] };

  for (const entry of progressionHistory) {
    breakdown.negative.push({
      label: `Nível ${entry.level}`,
      value: entry.points,
    });
  }

  if (characterNetSpent <= CHARACTER_POINTS) return breakdown;

  const creditPool =
    CHARACTER_POINTS +
    characterBreakdown.negative.reduce((sum, e) => sum + e.value, 0);
  let pool = creditPool;

  for (const item of characterBreakdown.positive) {
    if (pool >= item.value) {
      pool -= item.value;
      continue;
    }
    const fromProgression = item.value - Math.max(0, pool);
    if (fromProgression > 0) {
      breakdown.positive.push({ label: item.label, value: fromProgression });
    }
    pool = 0;
  }

  return breakdown;
}
