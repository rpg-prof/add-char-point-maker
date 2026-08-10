/** Regras de progressão extraídas de data/character-evolution.html */

export type XpClassGroup =
  | "guerreiro"
  | "rangerPaladino"
  | "mago"
  | "sacerdote"
  | "ladraoBardo";

export const XP_BY_CLASS_GROUP: Record<XpClassGroup, Record<number, number>> = {
  guerreiro: {
    1: 0,
    2: 2000,
    3: 4000,
    4: 8000,
    5: 16000,
    6: 32000,
    7: 64000,
    8: 125000,
    9: 250000,
    10: 500000,
    11: 750000,
    12: 1000000,
    13: 1250000,
    14: 1500000,
    15: 1750000,
    16: 2000000,
    17: 2250000,
    18: 2500000,
    19: 2750000,
    20: 3000000,
  },
  rangerPaladino: {
    1: 0,
    2: 2250,
    3: 4500,
    4: 9000,
    5: 18000,
    6: 32000,
    7: 75000,
    8: 150000,
    9: 300000,
    10: 600000,
    11: 900000,
    12: 1200000,
    13: 1500000,
    14: 1800000,
    15: 2100000,
    16: 2400000,
    17: 2700000,
    18: 3000000,
    19: 3300000,
    20: 3600000,
  },
  mago: {
    1: 0,
    2: 2500,
    3: 5000,
    4: 10000,
    5: 20000,
    6: 40000,
    7: 60000,
    8: 90000,
    9: 135000,
    10: 250000,
    11: 375000,
    12: 750000,
    13: 1125000,
    14: 1500000,
    15: 1875000,
    16: 2250000,
    17: 2625000,
    18: 3000000,
    19: 3375000,
    20: 3750000,
  },
  sacerdote: {
    1: 0,
    2: 1500,
    3: 3000,
    4: 6000,
    5: 13000,
    6: 27500,
    7: 55000,
    8: 110000,
    9: 225000,
    10: 450000,
    11: 675000,
    12: 900000,
    13: 1125000,
    14: 1350000,
    15: 1575000,
    16: 1800000,
    17: 2025000,
    18: 2250000,
    19: 2475000,
    20: 2700000,
  },
  ladraoBardo: {
    1: 0,
    2: 1250,
    3: 2500,
    4: 5000,
    5: 10000,
    6: 20000,
    7: 40000,
    8: 70000,
    9: 110000,
    10: 160000,
    11: 220000,
    12: 440000,
    13: 660000,
    14: 880000,
    15: 1100000,
    16: 1320000,
    17: 1540000,
    18: 1760000,
    19: 1980000,
    20: 2200000,
  },
};

export function getXpClassGroup(className: string): XpClassGroup {
  switch (className) {
    case "Guerreiro":
      return "guerreiro";
    case "Ranger":
    case "Paladino":
      return "rangerPaladino";
    case "Mago":
    case "Arcano":
    case "Monge":
      return "mago";
    case "Sacerdote":
      return "sacerdote";
    case "Ladrão":
    case "Bardo":
      return "ladraoBardo";
    default:
      return "guerreiro";
  }
}

export function getXpForLevel(className: string, level: number): number {
  const group = getXpClassGroup(className);
  return XP_BY_CLASS_GROUP[group][level] ?? 0;
}

/** Pontos de progressão recebidos ao alcançar o nível N (N × 10). Nível 1 não concede pontos. */
export function progressionPointsForLevel(level: number): number {
  return level >= 2 ? level * 10 : 0;
}

/** Homens de Armas: Guerreiro, Paladino, Ranger. */
export function isWeaponManClass(className: string): boolean {
  return className === "Guerreiro" || className === "Paladino" || className === "Ranger";
}

export function isFullCasterClass(className: string): boolean {
  return (
    className === "Arcano" ||
    className === "Mago" ||
    className === "Sacerdote"
  );
}

export function isPartialCasterClass(className: string): boolean {
  return (
    className === "Paladino" ||
    className === "Bardo" ||
    className === "Ranger"
  );
}

export const EVOLUTION_COSTS = {
  hpPerPoint: 2,
  maxHpPerLevel: 12,
  resistancePerPercent: 1,
  maxResistancePercentPerLevel: 5,
  spokenLanguage: 3,
  writtenLanguage: 5,
  /** Magia arcana (Arcano). */
  arcaneMana: 7,
  /** Magia arcana na escola especialista. */
  arcaneSpecialistMana: 5,
  /** Magia divina (Sacerdote). */
  divineMana: 5,
  /** Magia arcana (Bardo). */
  bardArcaneMana: 10,
  /** Magia divina (Paladino / Ranger). */
  halfCasterDivineMana: 7,
  /** Magia arcana ou divina (demais classes). */
  otherMana: 15,
  /** Homens de Armas. Demais classes pagam o dobro. */
  attacksPerRoundLevel: 80,
  backstabLevel: 40,
} as const;

/** Multiplicador do nível de magia: ×5 / ×7 / ×10 conforme a classe. */
export function magicLevelUpgradeMultiplier(className: string): number {
  if (isFullCasterClass(className)) return 5;
  if (isPartialCasterClass(className)) return 7;
  return 10;
}

/** Custo por ponto de magia arcana (pool geral), conforme a classe. */
export function arcaneManaUnitCost(className: string): number {
  if (className === "Arcano" || className === "Mago") return EVOLUTION_COSTS.arcaneMana;
  if (className === "Bardo") return EVOLUTION_COSTS.bardArcaneMana;
  return EVOLUTION_COSTS.otherMana;
}

/** Custo por ponto de magia divina, conforme a classe. */
export function divineManaUnitCost(className: string): number {
  if (className === "Sacerdote") return EVOLUTION_COSTS.divineMana;
  if (className === "Paladino" || className === "Ranger") {
    return EVOLUTION_COSTS.halfCasterDivineMana;
  }
  return EVOLUTION_COSTS.otherMana;
}

/** Custo para subir base de ataque do nível atual para o próximo. */
export function attackBaseUpgradeCost(
  currentLevel: number,
  className = "",
): number {
  const base = Math.max(currentLevel, 1) * 3;
  return isWeaponManClass(className) ? base : base * 2;
}

/** Custo cumulativo para atingir base de ataque `targetLevel` a partir de 0. */
export function attackBaseTotalCost(targetLevel: number, className = ""): number {
  let total = 0;
  for (let level = 0; level < targetLevel; level++) {
    total += attackBaseUpgradeCost(level, className);
  }
  return total;
}

/** Custo por nível de quantidade de ataques por rodada. */
export function attacksPerRoundUpgradeCost(className: string): number {
  return isWeaponManClass(className)
    ? EVOLUTION_COSTS.attacksPerRoundLevel
    : EVOLUTION_COSTS.attacksPerRoundLevel * 2;
}

/** Custo para subir nível de magia ou Chi. */
export function scaledLevelUpgradeCost(currentLevel: number, multiplier = 5): number {
  return currentLevel * multiplier;
}

export function magicLevelUpgradeCost(
  currentLevel: number,
  className: string,
): number {
  return scaledLevelUpgradeCost(
    currentLevel,
    magicLevelUpgradeMultiplier(className),
  );
}

export function magicLevelTotalCost(targetLevel: number, className = ""): number {
  let total = 0;
  for (let level = 1; level < targetLevel; level++) {
    total += magicLevelUpgradeCost(level, className);
  }
  return total;
}

/** Pontos de Chi máximos por nível (nv. 1 = 0; +2 por nível). */
export function chiPointsForLevel(chiLevel: number): number {
  if (chiLevel <= 1) return 0;
  return (chiLevel - 1) * 2;
}

export function getMagicCircleAccess(magicLevel: number): number {
  if (magicLevel <= 1) return 1;
  return Math.min(9, Math.ceil(magicLevel / 2));
}

export const MAX_ATTACK_BASE_LEVEL = 20;
export const MAX_MAGIC_LEVEL = 20;
export const MAX_CHI_LEVEL = 20;
export const MAX_ATTACKS_PER_ROUND_LEVEL = 4;
export const MAX_CHARACTER_LEVEL = 20;
