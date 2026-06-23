import {
  equipmentById,
  migrateEquipmentId,
  type EquipmentItem,
  type PurchasedItems,
} from "@/data/equipment";
import { getSubAttributeBonuses } from "@/data/subAttributes";
import {
  isBodyArmor,
  isHelmet,
  isShield,
  customWeaponToEquipment,
  isCustomWeapon,
} from "@/lib/inventory";
import type { CustomInventoryItem } from "@/data/equipmentTypes";
import {
  normalizeResourceCurrent,
  normalizeResourceMax,
} from "@/lib/combatResources";

export const CA_BASE = 10;
export const HP_BASE = 8;
export const WEAPON_SLOT_COUNT = 4;

const FIGHTER_CLASSES = new Set(["Guerreiro", "Paladino", "Ranger"]);

export interface MagicCaBonus {
  id: string;
  label: string;
  value: number;
}

export interface WeaponAttackSlot {
  id: string;
  equipmentId: string | null;
  name: string;
  tipo: string;
  damageSm: string;
  damageLg: string;
  weaponBonus: number;
  baseOverride: number | null;
  forcaOverride: number | null;
  destrezaOverride: number | null;
  periciaOverride: number | null;
  magiaAttack: number;
}

export interface CombatLoadout {
  equippedArmorId: string | null;
  equippedShieldId: string | null;
  helmetBonus: number;
  outrosBonus: number;
  /** Base de ataque global (inicia em 0; aumenta com a evolução do personagem). */
  attackBaseBonus: number;
  magicBonuses: MagicCaBonus[];
  weaponSlots: WeaponAttackSlot[];
  /** PV atuais; null = igual ao máximo calculado. */
  currentHp: number | null;
  /** Máximo de pontos de magia (editável conforme evolução). */
  maxMana: number;
  /** Pontos de magia atuais; null = igual ao máximo. */
  currentMana: number | null;
  /** Máximo de pontos da escola especialista. */
  maxSpecialistMana: number;
  /** Pontos da escola atuais; null = igual ao máximo. */
  currentSpecialistMana: number | null;
  /** Máximo de pontos de Chi (editável conforme evolução). */
  maxChi: number;
  /** Chi atual; null = igual ao máximo. */
  currentChi: number | null;
  /** Exibir o pool de Chi na aba Combate. */
  showChi: boolean;
}

export function createEmptyWeaponSlot(index: number): WeaponAttackSlot {
  return {
    id: `weapon-slot-${index}`,
    equipmentId: null,
    name: "",
    tipo: "",
    damageSm: "",
    damageLg: "",
    weaponBonus: 0,
    baseOverride: null,
    forcaOverride: null,
    destrezaOverride: null,
    periciaOverride: null,
    magiaAttack: 0,
  };
}

export const defaultWeaponSlots = (): WeaponAttackSlot[] =>
  Array.from({ length: WEAPON_SLOT_COUNT }, (_, i) => createEmptyWeaponSlot(i));

export const defaultCombatLoadout = (): CombatLoadout => ({
  equippedArmorId: null,
  equippedShieldId: null,
  helmetBonus: 0,
  outrosBonus: 0,
  attackBaseBonus: 0,
  magicBonuses: [],
  weaponSlots: defaultWeaponSlots(),
  currentHp: null,
  maxMana: 0,
  currentMana: null,
  maxSpecialistMana: 0,
  currentSpecialistMana: null,
  maxChi: 0,
  currentChi: null,
  showChi: false,
});

export function isShieldItem(item: EquipmentItem): boolean {
  return isShield(item);
}

export function isBodyArmorItem(item: EquipmentItem): boolean {
  return isBodyArmor(item);
}

export function isHelmetItem(item: EquipmentItem): boolean {
  return isHelmet(item);
}

export function getPurchasedBodyArmors(purchased: PurchasedItems): EquipmentItem[] {
  return Object.entries(purchased)
    .filter(([, qty]) => qty > 0)
    .map(([id]) => equipmentById[id])
    .filter((item): item is EquipmentItem => !!item && isBodyArmorItem(item))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function getPurchasedShields(purchased: PurchasedItems): EquipmentItem[] {
  return Object.entries(purchased)
    .filter(([, qty]) => qty > 0)
    .map(([id]) => equipmentById[id])
    .filter((item): item is EquipmentItem => !!item && isShieldItem(item))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function isWeaponItem(item: EquipmentItem): boolean {
  return item.category === "arma" && item.tab === "armas";
}

export function getPurchasedWeapons(
  purchased: PurchasedItems,
  customItems: CustomInventoryItem[] = [],
): EquipmentItem[] {
  return getAvailableWeapons(purchased, customItems);
}

export function getAvailableWeapons(
  inventory: PurchasedItems,
  customItems: CustomInventoryItem[] = [],
): EquipmentItem[] {
  const catalog = Object.entries(inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id]) => equipmentById[id])
    .filter((item): item is EquipmentItem => !!item && isWeaponItem(item));

  const custom = customItems
    .filter((item) => item.qty > 0 && isCustomWeapon(item))
    .map(customWeaponToEquipment);

  return [...catalog, ...custom].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function resolveWeaponById(
  id: string,
  customItems: CustomInventoryItem[] = [],
): EquipmentItem | undefined {
  const catalog = equipmentById[id];
  if (catalog && isWeaponItem(catalog)) return catalog;
  const custom = customItems.find((item) => item.id === id && isCustomWeapon(item));
  return custom ? customWeaponToEquipment(custom) : undefined;
}

function isWeaponOwned(
  id: string,
  inventory: PurchasedItems,
  customItems: CustomInventoryItem[],
): boolean {
  if ((inventory[id] ?? 0) > 0) {
    const catalog = equipmentById[id];
    return !!catalog && isWeaponItem(catalog);
  }
  const custom = customItems.find((item) => item.id === id);
  return !!custom && custom.qty > 0 && isCustomWeapon(custom);
}

const RANGED_AMMO_NAME_HINTS = ["flecha", "quadrelo", "virote", "chumbo de funda", "pedra de funda"];

/** Arcos, bestas e demais ataques à distância (não armas de mão corpo a corpo). */
export function isRangedWeapon(item: EquipmentItem): boolean {
  const name = item.name.toLowerCase();
  if (RANGED_AMMO_NAME_HINTS.some((hint) => name.includes(hint))) {
    return false;
  }
  if (item.weaponGroup === "arco" || item.weaponGroup === "besta") {
    return true;
  }
  const id = item.id.toLowerCase();
  if (id === "funda" || id === "zarabatana" || id === "dardo") {
    return true;
  }
  if (name.includes("funda") || name.includes("zarabatana")) {
    return true;
  }
  return false;
}

export function weaponSlotFromEquipment(item: EquipmentItem): Partial<WeaponAttackSlot> {
  const stats = item.weaponStats;
  return {
    equipmentId: item.id,
    name: item.name,
    tipo: stats?.type ?? "",
    damageSm: stats?.damagePM ?? "",
    damageLg: stats?.damageG ?? "",
  };
}

export function getForcaAttackBonus(musculosValue: number): number {
  return parseSignedStat(getSubAttributeBonuses("Músculos", musculosValue).Acerto ?? "0");
}

export function getMusculosDamageBonus(musculosValue: number): number {
  return parseSignedStat(getSubAttributeBonuses("Músculos", musculosValue).Dano ?? "0");
}

export function getEquilibrioDefensiveAdj(equilibrioValue: number): number {
  return parseSignedStat(getSubAttributeBonuses("Equilíbrio", equilibrioValue).Defesa ?? "0");
}

/**
 * Ajuste de Defesa (Equilíbrio) como bônus positivo para ataque e dano (Ataque Destro e CA).
 * Na tabela AD&D, valor negativo indica melhor defesa; na ficha, alto Equilíbrio vira bônus +.
 */
export function getEquilibrioAtaqueDestroBonus(equilibrioValue: number): number {
  return -getEquilibrioDefensiveAdj(equilibrioValue);
}

export function hasArtesMarciais(selectedRaceClassAdv: string[]): boolean {
  return selectedRaceClassAdv.includes("Artes Marciais");
}

/** Dano de artes marciais por nível (inicia em 1d6, evolui a cada 4 níveis). */
export function getMartialArtsDamageByLevel(level: number): string {
  const lv = Math.max(1, Math.floor(level));
  if (lv <= 4) return "1d6";
  if (lv <= 8) return "1d8";
  if (lv <= 12) return "1d10";
  if (lv <= 16) return "2d6";
  if (lv <= 20) return "2d8";
  return "3d6";
}

export function getForcaVontadeDefMagiaAdj(forcaVontadeValue: number): number {
  return parseSignedStat(
    getSubAttributeBonuses("Força de Vontade", forcaVontadeValue)["Def. Magia"] ?? "0"
  );
}

/**
 * Bônus de dano na linha de artes marciais: Ajuste de Dano (Músculos), ou com Ataque Destro
 * o maior entre Chance de Acerto (Músculos) e Ajuste de Defesa (Equilíbrio).
 */
export function getMartialArtsDamageBonus(
  musculosValue: number,
  equilibrioValue: number,
  selectedRaceClassAdv: string[]
): number {
  const musclesDamage = getMusculosDamageBonus(musculosValue);
  if (!selectedRaceClassAdv.includes("Ataque Destro")) {
    return musclesDamage;
  }
  return Math.max(
    getForcaAttackBonus(musculosValue),
    getEquilibrioAtaqueDestroBonus(equilibrioValue)
  );
}

/** Bônus de dano ao lado do dano da arma: Ajuste de Dano (Músculos). */
export function getWeaponDamageBonus(musculosValue: number): number {
  return getMusculosDamageBonus(musculosValue);
}

/** Precisão → Atq. Dist.; somente armas à distância. */
export function getDestrezaAttackBonus(precisaoValue: number, isRanged: boolean): number {
  if (!isRanged) {
    return 0;
  }
  return parseSignedStat(
    getSubAttributeBonuses("Precisão", precisaoValue)["Atq. Dist."] ?? "0"
  );
}

/** Músculos → Chance de Acerto; somente armas de mão (corpo a corpo). */
export function getForcaAttackBonusWithAdvantages(
  musculosValue: number,
  equilibrioValue: number,
  selectedRaceClassAdv: string[],
  isRanged: boolean,
  applyAtaqueDestro = false
): number {
  if (isRanged) {
    return 0;
  }
  const muscles = getForcaAttackBonus(musculosValue);
  if (
    !applyAtaqueDestro ||
    !selectedRaceClassAdv.includes("Ataque Destro")
  ) {
    return muscles;
  }
  return Math.max(muscles, getEquilibrioAtaqueDestroBonus(equilibrioValue));
}

export interface AttackRollBreakdown {
  base: number;
  forca: number;
  destreza: number;
  pericia: number;
  magia: number;
  /** Ajuste de Dano (Músculos) — exibido ao lado do dano, não soma na jogada. */
  damageBonus: number;
  total: number;
  isRanged: boolean;
  usesAtaqueDestro: boolean;
  isMartialArts: boolean;
  /** Artes marciais + Ataque Destro: bônus de dano usa Músculos Acerto vs Equilíbrio. */
  martialArtsUsesAtaqueDestro: boolean;
}

export function computeAttackRollBreakdown(params: {
  slot: WeaponAttackSlot;
  subAttributes: Record<string, number>;
  forcaMain: number;
  destrezaMain: number;
  selectedRaceClassAdv: string[];
  attackBaseBonus: number;
  isMartialArts?: boolean;
  customItems?: CustomInventoryItem[];
}): AttackRollBreakdown {
  const {
    slot,
    subAttributes,
    forcaMain,
    destrezaMain,
    selectedRaceClassAdv,
    attackBaseBonus,
    isMartialArts = false,
    customItems = [],
  } = params;

  const musculosVal = subAttributes["Músculos"] ?? forcaMain;
  const precisaoVal = subAttributes["Precisão"] ?? destrezaMain;
  const equilibrioVal = subAttributes["Equilíbrio"] ?? destrezaMain;

  const equipment = slot.equipmentId
    ? resolveWeaponById(slot.equipmentId, customItems)
    : undefined;
  const isRanged = isMartialArts ? false : equipment ? isRangedWeapon(equipment) : false;
  const martialArtsUsesAtaqueDestro =
    isMartialArts && selectedRaceClassAdv.includes("Ataque Destro") && !isRanged;
  const usesAtaqueDestro = martialArtsUsesAtaqueDestro;

  const autoForca = getForcaAttackBonusWithAdvantages(
    musculosVal,
    equilibrioVal,
    selectedRaceClassAdv,
    isRanged,
    isMartialArts
  );
  const autoDestreza = getDestrezaAttackBonus(precisaoVal, isRanged);

  const base = slot.baseOverride ?? attackBaseBonus;
  const forca = slot.forcaOverride ?? autoForca;
  const destreza = slot.destrezaOverride ?? autoDestreza;
  const pericia = slot.periciaOverride ?? 0;
  const magia = slot.magiaAttack;
  const damageBonus = isMartialArts
    ? getMartialArtsDamageBonus(musculosVal, equilibrioVal, selectedRaceClassAdv)
    : getWeaponDamageBonus(musculosVal);

  const total = base + forca + destreza + pericia + magia;

  return {
    base,
    forca,
    destreza,
    pericia,
    magia,
    damageBonus,
    total,
    isRanged,
    usesAtaqueDestro,
    isMartialArts,
    martialArtsUsesAtaqueDestro,
  };
}

export function parseSignedStat(value: string): number {
  const text = value.trim();
  if (!text || text === "—" || text === "-") return 0;
  const match = text.match(/^([+-])?\s*(\d+)/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * Number(match[2]);
}

/** Interpreta Ajst. PV: valor padrão e valor entre parênteses (classes marciais). */
export function parseAjstPV(ajstPV: string): { standard: number; fighter: number } {
  const text = ajstPV.replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, "").trim();
  const match = text.match(/^([+-]?\d+)\(([+-]?\d+)\)$/);
  if (match) {
    return {
      standard: parseSignedStat(match[1]),
      fighter: parseSignedStat(match[2]),
    };
  }
  const single = parseSignedStat(text);
  return { standard: single, fighter: single };
}

export function isFighterClass(className: string): boolean {
  return FIGHTER_CLASSES.has(className);
}

export interface HitPointsBreakdown {
  base: number;
  condicionamentoBonus: number;
  total: number;
  condicionamentoValue: number;
  ajstPVRaw: string;
  usesFighterModifier: boolean;
}

export function computeHitPointsBreakdown(params: {
  subAttributes: Record<string, number>;
  constMain: number;
  selectedClass: string;
}): HitPointsBreakdown {
  const { subAttributes, constMain, selectedClass } = params;
  const condicionamentoValue = subAttributes["Condicionamento"] ?? constMain;
  const ajstPVRaw =
    getSubAttributeBonuses("Condicionamento", condicionamentoValue)["Ajst. PV"] ?? "0";
  const { standard, fighter } = parseAjstPV(ajstPVRaw);
  const usesFighterModifier = isFighterClass(selectedClass);
  const condicionamentoBonus = usesFighterModifier ? fighter : standard;

  return {
    base: HP_BASE,
    condicionamentoBonus,
    total: HP_BASE + condicionamentoBonus,
    condicionamentoValue,
    ajstPVRaw,
    usesFighterModifier,
  };
}

/**
 * Bônus de Destreza para a soma da CA.
 * A tabela de Equilíbrio usa "ajuste defensivo" no sentido AD&D (negativo = melhor CA);
 * na ficha, Destreza alto deve aparecer como bônus positivo e baixo como negativo.
 */
export function getDestrezaCaBonus(equilibrioValue: number): number {
  return getEquilibrioAtaqueDestroBonus(equilibrioValue);
}

/** Converte C.A. do catálogo em bônus numérico para a soma da CA. */
export function parseArmorClassBonus(ca: number | string | undefined): number {
  if (ca === undefined || ca === null || ca === "") return 0;
  if (typeof ca === "number") return ca;
  const parts = String(ca)
    .split("/")
    .map((p) => parseSignedStat(p.trim().startsWith("+") ? p.trim() : `+${p.trim()}`));
  return Math.max(...parts, 0);
}

export interface OutrosCaEntry {
  label: string;
  value: number;
}

export function getAutoOutrosBonuses(
  selectedRaceClassAdv: string[],
  hasBodyArmor: boolean,
  destrezaMain: number
): OutrosCaEntry[] {
  const entries: OutrosCaEntry[] = [];

  if (selectedRaceClassAdv.includes("Pele dura") && !hasBodyArmor) {
    entries.push({ label: "Pele dura", value: 2 });
  }
  if (selectedRaceClassAdv.includes("Bom de esquiva") && !hasBodyArmor && destrezaMain >= 14) {
    entries.push({ label: "Bom de esquiva", value: 2 });
  }
  if (selectedRaceClassAdv.includes("Armadura Arcana") && !hasBodyArmor) {
    entries.push({ label: "Armadura Arcana", value: 4 });
  }

  return entries;
}

/** Bônus de CA por Defesa por Sabedoria (Ajst. Defesa Contra Magias / Força de Vontade). */
export function getSabedoriaCaBonus(forcaVontadeValue: number): number {
  return getForcaVontadeDefMagiaAdj(forcaVontadeValue);
}

export interface ArmorClassBreakdown {
  base: number;
  destreza: number;
  armadura: number;
  elmo: number;
  escudo: number;
  outrosAuto: OutrosCaEntry[];
  outrosManual: number;
  outros: number;
  magia: number;
  sabedoria: number;
  hasWisdomDefense: boolean;
  total: number;
  equippedArmorName: string | null;
  equippedShieldName: string | null;
}

export function computeArmorClassBreakdown(params: {
  subAttributes: Record<string, number>;
  purchased: PurchasedItems;
  selectedRaceClassAdv: string[];
  destrezaMain: number;
  sabedoriaMain?: number;
  loadout: CombatLoadout;
}): ArmorClassBreakdown {
  const { subAttributes, purchased, selectedRaceClassAdv, destrezaMain, sabedoriaMain = 10, loadout } =
    params;

  const equilibrioVal = subAttributes["Equilíbrio"] ?? destrezaMain;
  const destreza = getDestrezaCaBonus(equilibrioVal);

  const armorItem = loadout.equippedArmorId
    ? equipmentById[loadout.equippedArmorId]
    : undefined;
  const shieldItem = loadout.equippedShieldId
    ? equipmentById[loadout.equippedShieldId]
    : undefined;

  const hasBodyArmor = !!armorItem && isBodyArmorItem(armorItem);
  const armadura = hasBodyArmor ? parseArmorClassBonus(armorItem.armorClass) : 0;
  const escudo =
    shieldItem && isShieldItem(shieldItem)
      ? parseArmorClassBonus(shieldItem.armorClass)
      : 0;

  const outrosAuto = getAutoOutrosBonuses(selectedRaceClassAdv, hasBodyArmor, destrezaMain);
  const outrosAutoSum = outrosAuto.reduce((sum, e) => sum + e.value, 0);
  const outrosManual = loadout.outrosBonus;
  const outros = outrosAutoSum + outrosManual;

  const magia = loadout.magicBonuses.reduce((sum, b) => sum + b.value, 0);

  const hasWisdomDefense = selectedRaceClassAdv.includes("Defesa por Sabedoria");
  const forcaVontadeVal = subAttributes["Força de Vontade"] ?? sabedoriaMain;
  const sabedoria = hasWisdomDefense ? getSabedoriaCaBonus(forcaVontadeVal) : 0;

  const total =
    CA_BASE +
    destreza +
    armadura +
    loadout.helmetBonus +
    escudo +
    outros +
    magia +
    sabedoria;

  return {
    base: CA_BASE,
    destreza,
    armadura,
    elmo: loadout.helmetBonus,
    escudo,
    outrosAuto,
    outrosManual,
    outros,
    magia,
    sabedoria,
    hasWisdomDefense,
    total,
    equippedArmorName: armorItem?.name ?? null,
    equippedShieldName: shieldItem?.name ?? null,
  };
}

export function normalizeWeaponSlots(slots: WeaponAttackSlot[] | undefined): WeaponAttackSlot[] {
  const normalized = (slots ?? []).slice(0, WEAPON_SLOT_COUNT).map((slot, i) => ({
    ...createEmptyWeaponSlot(i),
    ...slot,
    id: slot.id ?? `weapon-slot-${i}`,
  }));
  while (normalized.length < WEAPON_SLOT_COUNT) {
    normalized.push(createEmptyWeaponSlot(normalized.length));
  }
  return normalized;
}

export function sanitizeCombatLoadout(
  loadout: CombatLoadout,
  purchased: PurchasedItems,
  customItems: CustomInventoryItem[] = [],
): CombatLoadout {
  const equippedArmorId = loadout.equippedArmorId
    ? migrateEquipmentId(loadout.equippedArmorId)
    : null;
  const equippedShieldId = loadout.equippedShieldId
    ? migrateEquipmentId(loadout.equippedShieldId)
    : null;

  const armorOk =
    equippedArmorId &&
    purchased[equippedArmorId] > 0 &&
    equipmentById[equippedArmorId] &&
    isBodyArmorItem(equipmentById[equippedArmorId]);
  const shieldOk =
    equippedShieldId &&
    purchased[equippedShieldId] > 0 &&
    equipmentById[equippedShieldId] &&
    isShieldItem(equipmentById[equippedShieldId]);

  const weaponSlots = normalizeWeaponSlots(loadout.weaponSlots).map((slot) => {
    const equipmentId = slot.equipmentId ? migrateEquipmentId(slot.equipmentId) : null;
    const weaponOk = equipmentId && isWeaponOwned(equipmentId, purchased, customItems);
    if (!weaponOk) {
      return { ...slot, equipmentId: null };
    }
    const item = resolveWeaponById(equipmentId, customItems);
    if (item) {
      return { ...slot, equipmentId, ...weaponSlotFromEquipment(item) };
    }
    return { ...slot, equipmentId };
  });

  return {
    ...loadout,
    equippedArmorId: armorOk ? equippedArmorId : null,
    equippedShieldId: shieldOk ? equippedShieldId : null,
    attackBaseBonus: loadout.attackBaseBonus ?? 0,
    magicBonuses: loadout.magicBonuses ?? [],
    weaponSlots,
    currentHp:
      loadout.currentHp == null || Number.isNaN(loadout.currentHp)
        ? null
        : Math.max(0, loadout.currentHp),
    maxMana: normalizeResourceMax(loadout.maxMana),
    currentMana: normalizeResourceCurrent(loadout.currentMana),
    maxSpecialistMana: normalizeResourceMax(loadout.maxSpecialistMana),
    currentSpecialistMana: normalizeResourceCurrent(loadout.currentSpecialistMana),
    maxChi: normalizeResourceMax(loadout.maxChi),
    currentChi: normalizeResourceCurrent(loadout.currentChi),
    showChi: loadout.showChi === true,
  };
}

export function resolveCurrentHp(currentHp: number | null | undefined, maxHp: number): number {
  if (currentHp == null || Number.isNaN(currentHp)) {
    return maxHp;
  }
  return Math.max(0, currentHp);
}
