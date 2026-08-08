import type { EquipmentItem } from "@/data/equipment";
import { weaponGroups, type WeaponGroup } from "@/data/weaponProficiencies";

export type WeaponExpertiseLevel = "nenhuma" | "pericia" | "especializacao" | "maestria";

export interface WeaponProficiencyMatch {
  proficient: boolean;
  group: WeaponGroup | null;
  weaponName: string | null;
  penaltyNoProficiency: number;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Localiza a perícia de armas correspondente a um item do inventário. */
export function matchWeaponProficiency(
  item: EquipmentItem,
  selectedWeapons: string[],
  selectedWeaponGroups: string[],
): WeaponProficiencyMatch {
  const itemName = normalizeName(item.name);
  const itemId = normalizeName(item.id.replace(/-/g, " "));

  for (const group of weaponGroups) {
    const weapon = group.weapons.find((w) => {
      const byName = normalizeName(w.name) === itemName;
      const byCode = normalizeName(w.code.replace(/-/g, " ")) === itemId;
      return byName || byCode;
    });
    if (!weapon) continue;

    const key = `${group.name}::${weapon.name}`;
    const proficient =
      selectedWeaponGroups.includes(group.name) || selectedWeapons.includes(key);

    return {
      proficient,
      group,
      weaponName: weapon.name,
      penaltyNoProficiency: group.penaltyNoProficiency,
    };
  }

  return {
    proficient: false,
    group: null,
    weaponName: null,
    penaltyNoProficiency: -4,
  };
}

export function resolveWeaponExpertiseLevel(
  proficient: boolean,
  mastery: "especializacao" | "maestria" | undefined,
): WeaponExpertiseLevel {
  if (!proficient) return "nenhuma";
  if (mastery === "maestria") return "maestria";
  if (mastery === "especializacao") return "especializacao";
  return "pericia";
}

export function weaponExpertiseLabel(level: WeaponExpertiseLevel): string {
  switch (level) {
    case "maestria":
      return "Maestria";
    case "especializacao":
      return "Especialização";
    case "pericia":
      return "Perícia";
    default:
      return "Sem perícia";
  }
}

/** Bônus típicos AD&D 2e para especialização / maestria. */
export function getWeaponExpertiseBonuses(level: WeaponExpertiseLevel): {
  attack: number;
  damage: number;
} {
  switch (level) {
    case "especializacao":
      return { attack: 1, damage: 2 };
    case "maestria":
      return { attack: 3, damage: 3 };
    default:
      return { attack: 0, damage: 0 };
  }
}

export function countWeaponMasterySlots(params: {
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
}): { specialization: number; mastery: number } {
  const all = [...params.selectedAdvantages, ...params.selectedRaceClassAdv];
  let specialization = 0;
  let mastery = 0;
  for (const name of all) {
    if (name === "Especialização em armas") specialization += 1;
    if (name === "Múltipla especialização em armas") specialization += 1;
    if (name === "Maestria com arma") mastery += 1;
  }
  return { specialization, mastery };
}
