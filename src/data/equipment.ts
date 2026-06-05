import { equipmentCatalog } from "./equipmentCatalog";
import { copperToBreakdown, formatMoney, socialClassCapitalPc } from "./currency";
import type { SocialClassOption } from "./characterData";

export type EquipmentCategory = "arma" | "armadura" | "equipamento";

export interface WeaponStats {
  size: string;
  type: string;
  speed: string;
  damagePM: string;
  damageG: string;
}

export type EquipmentTabId =
  | "armas"
  | "armaduras"
  | "equipamento"
  | "vestuario"
  | "alimentacao"
  | "suprimentos"
  | "animais"
  | "transporte"
  | "servicos"
  | "montaria";

export type WeaponGroupId = "arco" | "haste" | "besta" | "espada" | "lanca" | "outras";

export interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  tab: EquipmentTabId;
  pricePc: number;
  weightKg: number;
  section?: string;
  weaponGroup?: WeaponGroupId;
  weaponStats?: WeaponStats;
  /** C.A. base (armadura) ou bônus (escudo, ex. "+2"). */
  armorClass?: number | string;
  description?: string;
}

export function formatArmorClass(ca: number | string | undefined): string | null {
  if (ca === undefined || ca === null || ca === "") return null;
  if (typeof ca === "number") return `+${ca}`;
  const text = String(ca).trim();
  if (text.includes("/")) {
    return text
      .split("/")
      .map((part) => {
        const p = part.trim();
        return p.startsWith("+") ? p : `+${p}`;
      })
      .join("/");
  }
  return text.startsWith("+") ? text : `+${text}`;
}

/** IDs antigos de armaduras → IDs atuais (compatibilidade ao carregar JSON). */
export const PURCHASED_ITEM_ID_MIGRATION: Record<string, string> = {
  acolchoado: "corselete-de-couro-acolchoado",
  couro: "corselete-de-couro",
  "couro-batido": "corselete-de-couro-batido",
  "armadura-placas-parcial": "loriga-segmentada",
  "brunea-completa": "brunea",
  "brunea-parcial": "brunea",
  corselete: "corselete-de-couro-acolchoado",
  "corselete-acolchoado-parcial": "corselete-de-couro-acolchoado",
  "proteção-de-couro-ou-acolchoada": "corselete-de-couro-acolchoado",
};

export function migratePurchasedItems(purchased: PurchasedItems): PurchasedItems {
  const next: PurchasedItems = {};
  for (const [id, qty] of Object.entries(purchased)) {
    if (qty <= 0) continue;
    const newId = PURCHASED_ITEM_ID_MIGRATION[id] ?? id;
    next[newId] = (next[newId] ?? 0) + qty;
  }
  return next;
}

export const equipmentItems: EquipmentItem[] = equipmentCatalog as unknown as EquipmentItem[];

export const equipmentById = Object.fromEntries(
  equipmentItems.map((item) => [item.id, item])
) as Record<string, EquipmentItem>;

export type PurchasedItems = Record<string, number>;

export function getStartingCapitalPc(
  socialClassName: string,
  socialClasses: SocialClassOption[]
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
  purchased: PurchasedItems
): number {
  return getStartingCapitalPc(socialClassName, socialClasses) - getSpentCopper(purchased);
}

export function getTotalWeightKg(purchased: PurchasedItems): number {
  return Object.entries(purchased).reduce((sum, [id, qty]) => {
    const item = equipmentById[id];
    if (!item || qty <= 0) return sum;
    return sum + item.weightKg * qty;
  }, 0);
}

export function canAffordItem(
  socialClassName: string,
  socialClasses: SocialClassOption[],
  purchased: PurchasedItems,
  itemId: string,
  qty = 1
): boolean {
  const item = equipmentById[itemId];
  if (!item) return false;
  return getRemainingCopper(socialClassName, socialClasses, purchased) >= item.pricePc * qty;
}

export function wouldExceedCarga(
  purchased: PurchasedItems,
  itemId: string,
  cargaKg: number,
  qty = 1
): boolean {
  const item = equipmentById[itemId];
  if (!item || cargaKg <= 0) return false;
  const added = item.weightKg * qty;
  return getTotalWeightKg(purchased) + added > cargaKg;
}

export { copperToBreakdown, formatMoney };
