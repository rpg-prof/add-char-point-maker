import type { DivineAccessLevel } from "@/components/MagicAccessPanel";
import { migratePurchasedItems, type CustomInventoryItem, type PurchasedItems } from "@/data/equipment";
import {
  attributeNames,
  type AttributeName,
} from "@/data/characterData";
import { subAttributeMap } from "@/data/subAttributes";
import { clampAttributesForRace } from "@/lib/clampAttributesForRace";
import {
  defaultCombatLoadout,
  sanitizeCombatLoadout,
  type CombatLoadout,
} from "@/lib/combatStats";
import { normalizeGrimoire, type GrimoireEntry } from "@/lib/grimoire";
import {
  mergeInventory,
  normalizeCustomItems,
  normalizeInventoryOrder,
} from "@/lib/inventory";
import {
  defaultMagicComponents,
  normalizeMagicComponents,
  type MagicComponentEntry,
} from "@/lib/magicComponents";
import type { ProgressionEntry } from "@/lib/pointBreakdown";
import {
  defaultEvolutionProgress,
  normalizeEvolutionProgress,
  type EvolutionProgress,
} from "@/lib/evolutionProgress";
import { chiPointsForLevel } from "@/data/characterEvolution";

export interface CharacterSaveData {
  charName: string;
  playerName: string;
  sexo: string;
  idade: string;
  peso: string;
  altura: string;
  cabelos: string;
  olhos: string;
  tendencia: string;
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
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
  grimoire: GrimoireEntry[];
  divineAccess: Record<string, DivineAccessLevel>;
  arcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
  progressionHistory: ProgressionEntry[];
  evolutionProgress?: EvolutionProgress;
  purchasedItems: PurchasedItems;
  addedItems: PurchasedItems;
  customItems: CustomInventoryItem[];
  /** Ordem de exibição dos itens do inventário (ids de catálogo e customizados). */
  inventoryOrder: string[];
  extraMoneyPc: number;
  combatLoadout: CombatLoadout;
  notesItems: string;
  notesGeneral: string;
  magicComponents: MagicComponentEntry[];
  characterHistory: string;
}

export function defaultAttributes(): Record<AttributeName, number> {
  return Object.fromEntries(attributeNames.map((a) => [a, 10])) as Record<
    AttributeName,
    number
  >;
}

export function defaultSubAttributes(): Record<string, number> {
  const init: Record<string, number> = {};
  subAttributeMap.forEach((def) => {
    init[def.sub1] = 10;
    init[def.sub2] = 10;
  });
  return init;
}

export function createEmptyCharacterSave(): CharacterSaveData {
  return {
    charName: "",
    playerName: "",
    sexo: "",
    idade: "",
    peso: "",
    altura: "",
    cabelos: "",
    olhos: "",
    tendencia: "Neutro",
    attributes: defaultAttributes(),
    subAttributes: defaultSubAttributes(),
    selectedRace: "Humano",
    selectedClass: "Sem Classe",
    selectedSocialClass: "Classe média baixa",
    selectedReputation: 0,
    selectedAdvantages: [],
    selectedRaceClassAdv: [],
    selectedSkills: [],
    selectedWeapons: [],
    selectedWeaponGroups: [],
    selectedShields: [],
    grimoire: [],
    divineAccess: {},
    arcaneAccess: {},
    arcaneSpecialist: null,
    progressionHistory: [],
    evolutionProgress: defaultEvolutionProgress(),
    purchasedItems: {},
    addedItems: {},
    customItems: [],
    inventoryOrder: [],
    extraMoneyPc: 0,
    combatLoadout: defaultCombatLoadout(),
    notesItems: "",
    notesGeneral: "",
    magicComponents: defaultMagicComponents,
    characterHistory: "",
  };
}

export function parseCharacterSave(raw: unknown): CharacterSaveData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<CharacterSaveData>;
  if (data.charName === undefined && data.selectedRace === undefined) return null;

  const base = createEmptyCharacterSave();
  const loadedRace = data.selectedRace ?? base.selectedRace;
  const loadedAttrs = data.attributes ?? base.attributes;
  const loadedSubs = data.subAttributes ?? base.subAttributes;
  const clamped = clampAttributesForRace(loadedAttrs, loadedSubs, loadedRace);

  const migratedPurchased = data.purchasedItems
    ? migratePurchasedItems(data.purchasedItems)
    : {};
  const migratedAdded = data.addedItems ? migratePurchasedItems(data.addedItems) : {};
  const customItems = normalizeCustomItems(data.customItems);
  const mergedOnLoad = mergeInventory(migratedPurchased, migratedAdded);

  let combatLoadout = defaultCombatLoadout();
  if (data.combatLoadout) {
    combatLoadout = sanitizeCombatLoadout(
      { ...defaultCombatLoadout(), ...data.combatLoadout },
      mergedOnLoad,
      customItems,
    );
  }

  return {
    ...base,
    charName: data.charName ?? "",
    playerName: data.playerName ?? "",
    sexo: data.sexo ?? "",
    idade: data.idade ?? "",
    peso: data.peso ?? "",
    altura: data.altura ?? "",
    cabelos: data.cabelos ?? "",
    olhos: data.olhos ?? "",
    tendencia: data.tendencia ?? base.tendencia,
    attributes: clamped.attributes,
    subAttributes: clamped.subAttributes,
    selectedRace: loadedRace,
    selectedClass: data.selectedClass ?? base.selectedClass,
    selectedSocialClass: data.selectedSocialClass ?? base.selectedSocialClass,
    selectedReputation:
      typeof data.selectedReputation === "number"
        ? data.selectedReputation
        : base.selectedReputation,
    selectedAdvantages: data.selectedAdvantages ?? [],
    selectedRaceClassAdv: (data.selectedRaceClassAdv ?? []).filter(
      (n) => n !== "Magia Anotada",
    ),
    selectedSkills: data.selectedSkills ?? [],
    selectedWeapons: data.selectedWeapons ?? [],
    selectedWeaponGroups: data.selectedWeaponGroups ?? [],
    selectedShields: data.selectedShields ?? [],
    grimoire: data.grimoire ? normalizeGrimoire(data.grimoire) : [],
    divineAccess: data.divineAccess ?? {},
    arcaneAccess: data.arcaneAccess ?? {},
    arcaneSpecialist: data.arcaneSpecialist ?? null,
    progressionHistory: data.progressionHistory ?? [],
    evolutionProgress: normalizeEvolutionProgress(data.evolutionProgress),
    purchasedItems: migratedPurchased,
    addedItems: migratedAdded,
    customItems,
    inventoryOrder: normalizeInventoryOrder(
      Array.isArray(data.inventoryOrder)
        ? data.inventoryOrder.filter((id): id is string => typeof id === "string")
        : [],
      migratedPurchased,
      migratedAdded,
      customItems,
    ),
    extraMoneyPc: typeof data.extraMoneyPc === "number" ? data.extraMoneyPc : 0,
    combatLoadout,
    notesItems: data.notesItems ?? "",
    notesGeneral: data.notesGeneral ?? "",
    magicComponents: data.magicComponents
      ? normalizeMagicComponents(data.magicComponents)
      : defaultMagicComponents,
    characterHistory: data.characterHistory ?? "",
  };
}

const ACTIVE_CHARACTER_STORAGE_KEY = "add-char-point-maker:active-character";
const CHARACTER_HANDOFF_STORAGE_KEY = "add-char-point-maker:character-handoff";

/** Mantém o personagem ativo da sessão (ficha de jogo). */
export function setActiveCharacter(data: CharacterSaveData): void {
  sessionStorage.setItem(ACTIVE_CHARACTER_STORAGE_KEY, JSON.stringify(data));
}

export function getActiveCharacter(): CharacterSaveData | null {
  const raw = sessionStorage.getItem(ACTIVE_CHARACTER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return parseCharacterSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearActiveCharacter(): void {
  sessionStorage.removeItem(ACTIVE_CHARACTER_STORAGE_KEY);
}

/** Entrega o personagem para outra tela (edição / evolução). */
export function stashCharacterHandoff(data: CharacterSaveData): void {
  sessionStorage.setItem(CHARACTER_HANDOFF_STORAGE_KEY, JSON.stringify(data));
}

export function consumeCharacterHandoff(): CharacterSaveData | null {
  const raw = sessionStorage.getItem(CHARACTER_HANDOFF_STORAGE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(CHARACTER_HANDOFF_STORAGE_KEY);
  try {
    return parseCharacterSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** @deprecated Use stashCharacterHandoff */
export function stashCharacterForEvolution(data: CharacterSaveData): void {
  stashCharacterHandoff(data);
}

/** @deprecated Use consumeCharacterHandoff */
export function consumeStashedCharacterForEvolution(): CharacterSaveData | null {
  return consumeCharacterHandoff();
}

export function downloadCharacterSave(data: CharacterSaveData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.charName || "personagem"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Mescla compras de evolução nos arrays principais antes de salvar. */
export function mergeEvolutionIntoCharacter(data: CharacterSaveData): CharacterSaveData {
  const evo = data.evolutionProgress ?? defaultEvolutionProgress();
  const mergedSkills = [...new Set([...data.selectedSkills, ...evo.evolutionSkills])];
  const mergedWeapons = [...new Set([...data.selectedWeapons, ...evo.evolutionWeapons])];
  const mergedGroups = [...new Set([...data.selectedWeaponGroups, ...evo.evolutionWeaponGroups])];
  const mergedShields = [...new Set([...data.selectedShields, ...evo.evolutionShields])];
  const mergedAdv = [...data.selectedRaceClassAdv, ...evo.evolutionRaceClassAdv];

  const loadout = { ...data.combatLoadout };
  if (evo.attackBaseLevel > 0) {
    loadout.attackBaseBonus = evo.attackBaseLevel;
  }
  if (evo.arcaneManaPurchased > 0 || evo.divineManaPurchased > 0) {
    loadout.maxMana = (loadout.maxMana ?? 0) + evo.arcaneManaPurchased + evo.divineManaPurchased;
  }
  if (evo.specialistManaPurchased > 0) {
    loadout.maxSpecialistMana =
      (loadout.maxSpecialistMana ?? 0) + evo.specialistManaPurchased;
  }
  if (evo.chiLevel > 1) {
    loadout.maxChi = Math.max(loadout.maxChi ?? 0, chiPointsForLevel(evo.chiLevel));
    loadout.showChi = true;
  }

  return {
    ...data,
    selectedSkills: mergedSkills,
    selectedWeapons: mergedWeapons,
    selectedWeaponGroups: mergedGroups,
    selectedShields: mergedShields,
    selectedRaceClassAdv: mergedAdv,
    divineAccess: {
      ...data.divineAccess,
      ...evo.evolutionDivineAccess,
    },
    arcaneAccess: {
      ...data.arcaneAccess,
      ...evo.evolutionArcaneAccess,
    },
    combatLoadout: loadout,
  };
}
