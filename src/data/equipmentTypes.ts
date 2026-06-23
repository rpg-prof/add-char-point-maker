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

export type PurchasedItems = Record<string, number>;

/** Stats opcionais — quando presentes, o item é tratado como arma customizada. */
export interface CustomWeaponStats {
  damagePM: string;
  damageG: string;
  type?: string;
  speed?: string;
}

/** Item inventário descrito pelo jogador (fora do catálogo). */
export interface CustomInventoryItem {
  id: string;
  name: string;
  weightKg: number;
  qty: number;
  weaponStats?: CustomWeaponStats;
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
