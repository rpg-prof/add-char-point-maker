import type { EquipmentItem } from "./equipment";

/** Aba principal da loja. */
export type ShopMainTabId = "inventario" | "armas" | "armaduras" | "equipamento";

/** Seção do catálogo (campo `tab` do item). */
export type CatalogTabId =
  | "armas"
  | "armaduras"
  | "equipamento"
  | "alimentacao"
  | "vestuario"
  | "transporte"
  | "animais"
  | "montaria";

export type EquipmentCatalogTabId = Exclude<CatalogTabId, "armas" | "armaduras">;

export type EquipmentSubTabId = "todas" | EquipmentCatalogTabId;

export const EQUIPMENT_CATALOG_TABS: EquipmentCatalogTabId[] = [
  "equipamento",
  "alimentacao",
  "vestuario",
  "transporte",
  "animais",
  "montaria",
];

export type WeaponGroupId = "todas" | "arco" | "haste" | "besta" | "espada" | "lanca" | "outras";

export const SHOP_MAIN_TABS: { id: ShopMainTabId; label: string }[] = [
  { id: "inventario", label: "Inventário" },
  { id: "armas", label: "Armas" },
  { id: "armaduras", label: "Armaduras" },
  { id: "equipamento", label: "Equipamento" },
];

export const WEAPON_SUB_TABS: { id: WeaponGroupId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "arco", label: "Arcos & Flechas" },
  { id: "haste", label: "Armas de Haste" },
  { id: "besta", label: "Bestas & Viros" },
  { id: "espada", label: "Espadas" },
  { id: "lanca", label: "Lanças" },
  { id: "outras", label: "Outras" },
];

export const EQUIPMENT_SUB_TABS: { id: EquipmentSubTabId; label: string }[] = [
  { id: "todas", label: "Todos" },
  { id: "equipamento", label: "Variado" },
  { id: "alimentacao", label: "Alimentação e Alojamento" },
  { id: "vestuario", label: "Vestuário" },
  { id: "transporte", label: "Meios de Transporte" },
  { id: "animais", label: "Animais" },
  { id: "montaria", label: "Arreios e Armaduras para Montaria" },
];

export function itemMatchesShopView(
  item: EquipmentItem,
  mainTab: ShopMainTabId,
  weaponGroup: WeaponGroupId = "todas",
  equipmentSubTab: EquipmentSubTabId = "todas"
): boolean {
  if (mainTab === "inventario") return false;
  if (mainTab === "armas") {
    if (item.tab !== "armas") return false;
    if (weaponGroup === "todas") return true;
    return (item.weaponGroup ?? "outras") === weaponGroup;
  }
  if (mainTab === "armaduras") return item.tab === "armaduras";
  if (mainTab === "equipamento") {
    if (equipmentSubTab === "todas") {
      return EQUIPMENT_CATALOG_TABS.includes(item.tab as EquipmentCatalogTabId);
    }
    return item.tab === equipmentSubTab;
  }
  return false;
}

export function countMainTabItems(
  items: EquipmentItem[],
  mainTab: ShopMainTabId,
  purchased: Record<string, number>
): number {
  if (mainTab === "inventario") {
    return Object.values(purchased).filter((q) => q > 0).length;
  }
  if (mainTab === "equipamento") {
    return items.filter((item) =>
      EQUIPMENT_CATALOG_TABS.includes(item.tab as EquipmentCatalogTabId)
    ).length;
  }
  return items.filter((item) => itemMatchesShopView(item, mainTab)).length;
}

export function countEquipmentSubTabItems(
  items: EquipmentItem[],
  subTab: EquipmentSubTabId
): number {
  if (subTab === "todas") {
    return items.filter((item) =>
      EQUIPMENT_CATALOG_TABS.includes(item.tab as EquipmentCatalogTabId)
    ).length;
  }
  return items.filter((item) => item.tab === subTab).length;
}

export function shopViewLabel(
  mainTab: ShopMainTabId,
  equipmentSubTab: EquipmentSubTabId
): string {
  if (mainTab === "equipamento") {
    if (equipmentSubTab === "todas") return "Equipamento";
    return EQUIPMENT_SUB_TABS.find((s) => s.id === equipmentSubTab)?.label ?? "Equipamento";
  }
  return SHOP_MAIN_TABS.find((t) => t.id === mainTab)?.label ?? "";
}
