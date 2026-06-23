import {
  equipmentItemsFromCatalog,
  equipmentById as catalogById,
  LEGACY_EQUIPMENT_ID_MIGRATION,
} from "./itemCatalog";
import type { PurchasedItems } from "./equipmentTypes";
import type { CustomInventoryItem } from "./equipmentTypes";
import type { SocialClassOption } from "./characterData";
import { socialClassCapitalPc, copperToBreakdown, formatMoney } from "./currency";
import { getCustomItemsWeightKg } from "@/lib/inventory";

export { formatArmorClass } from "./equipmentTypes";
export type {
  EquipmentCategory,
  EquipmentItem,
  EquipmentTabId,
  WeaponGroupId,
  WeaponStats,
  PurchasedItems,
  CustomInventoryItem,
  CustomWeaponStats,
} from "./equipmentTypes";

/** IDs antigos → códigos atuais (compatibilidade ao carregar JSON salvo). */
export const PURCHASED_ITEM_ID_MIGRATION: Record<string, string> = {
  acolchoado: "padded-leather-cuirass",
  couro: "leather-cuirass",
  "couro-batido": "studded-leather-cuirass",
  "armadura-placas-parcial": "splint-mail",
  "brunea-completa": "brigandine-coat",
  "brunea-parcial": "brigandine-coat",
  corselete: "padded-leather-cuirass",
  "corselete-acolchoado-parcial": "padded-leather-cuirass",
  "proteção-de-couro-ou-acolchoada": "padded-leather-cuirass",
  "arco-curto-composto": "composite-bow",
  "arco-longo-composto": "composite-bow",
  "adaga-ou-punhal": "dagger",
  "besta-de-mão": "repeating-crossbow",
  "espada-bastarda": "bastard-sword-one-handed",
  "espada-bastarda-2": "bastard-sword-two-handed",
  cimitarra: "short-scimitar",
  ...LEGACY_EQUIPMENT_ID_MIGRATION,
};

export function migrateEquipmentId(id: string): string {
  return PURCHASED_ITEM_ID_MIGRATION[id] ?? id;
}

export function migratePurchasedItems(purchased: PurchasedItems): PurchasedItems {
  const next: PurchasedItems = {};
  for (const [id, qty] of Object.entries(purchased)) {
    if (qty <= 0) continue;
    const newId = migrateEquipmentId(id);
    next[newId] = (next[newId] ?? 0) + qty;
  }
  return next;
}

export const equipmentItems = equipmentItemsFromCatalog;
export const equipmentById = catalogById;

export function getStartingCapitalPc(
  socialClassName: string,
  socialClasses: SocialClassOption[],
): number {
  return socialClassCapitalPc(socialClassName, socialClasses);
}

export function getSpentCopper(purchased: PurchasedItems): number {
  return Object.entries(purchased).reduce((sum, [id, qty]) => {
    const item = equipmentById[id];
    if (!item || qty <= 0) return sum;
    return sum + item.pricePc * qty;
  }, 0);
}

export function getRemainingCopper(
  socialClassName: string,
  socialClasses: SocialClassOption[],
  purchased: PurchasedItems,
  extraMoneyPc = 0,
): number {
  return (
    getStartingCapitalPc(socialClassName, socialClasses) +
    extraMoneyPc -
    getSpentCopper(purchased)
  );
}

export function getTotalWeightKg(
  purchased: PurchasedItems,
  added: PurchasedItems = {},
  customItems: CustomInventoryItem[] = [],
): number {
  const merged = { ...added };
  for (const [id, qty] of Object.entries(purchased)) {
    if (qty <= 0) continue;
    merged[id] = (merged[id] ?? 0) + qty;
  }
  const catalogWeight = Object.entries(merged).reduce((sum, [id, qty]) => {
    const item = equipmentById[id];
    if (!item || qty <= 0) return sum;
    return sum + item.weightKg * qty;
  }, 0);
  return catalogWeight + getCustomItemsWeightKg(customItems);
}

export function canAffordItem(
  socialClassName: string,
  socialClasses: SocialClassOption[],
  purchased: PurchasedItems,
  itemId: string,
  qty = 1,
  extraMoneyPc = 0,
): boolean {
  const item = equipmentById[itemId];
  if (!item) return false;
  return (
    getRemainingCopper(socialClassName, socialClasses, purchased, extraMoneyPc) >=
    item.pricePc * qty
  );
}

export function wouldExceedCarga(
  purchased: PurchasedItems,
  itemId: string,
  cargaKg: number,
  qty = 1,
  added: PurchasedItems = {},
): boolean {
  const item = equipmentById[itemId];
  if (!item || cargaKg <= 0) return false;
  const addedWeight = item.weightKg * qty;
  return getTotalWeightKg(purchased, added) + addedWeight > cargaKg;
}

export { copperToBreakdown, formatMoney };
