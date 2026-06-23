import itemsIndex from "./items/items-index.json";
import legacyIdMigration from "./items/legacy-id-migration.json";
import { weaponGroups, type Weapon } from "./weapons";
import type {
  EquipmentCategory,
  EquipmentItem,
  EquipmentTabId,
  WeaponGroupId,
  WeaponStats,
} from "./equipmentTypes";
import { parseCostPc } from "./itemUnits";
import { parseWeightKg } from "./currency";

export interface CatalogItemJson {
  code: string;
  name: string;
  category: EquipmentCategory;
  weight: string;
  cost: string;
  armorClass?: number | string;
  description?: string;
  weaponGroup?: WeaponGroupId;
  weaponStats?: WeaponStats;
}

interface ItemsIndex {
  weaponItemFiles: string[];
  catalogFiles: Array<{ tab: EquipmentTabId; file: string }>;
}

const index = itemsIndex as ItemsIndex;

const catalogModules = import.meta.glob<{ default: CatalogItemJson[] }>(
  "./items/*.json",
  { eager: true },
);

const GROUP_NAME_TO_WEAPON_GROUP: Record<string, WeaponGroupId> = {
  Arcos: "arco",
  Bestas: "besta",
  "Armas de Haste": "haste",
  "Espadas Menores": "espada",
  "Espadas Grandes (Uma Mão)": "espada",
  "Espadas Grandes (Duas Mãos)": "espada",
};

const WEAPON_ITEM_FILES = new Set(index.weaponItemFiles ?? []);
const CATALOG_FILE_TABS = Object.fromEntries(
  (index.catalogFiles ?? []).map((entry) => [entry.file, entry.tab]),
);

function unwrapDefault<T>(mod: T | { default: T }): T {
  if (mod != null && typeof mod === "object" && "default" in mod) {
    return (mod as { default: T }).default;
  }
  return mod as T;
}

function catalogItemToEquipment(
  item: CatalogItemJson,
  tab: EquipmentTabId,
): EquipmentItem {
  return {
    id: item.code,
    name: item.name,
    category: item.category,
    tab,
    pricePc: parseCostPc(item.cost),
    weightKg: parseWeightKg(item.weight),
    section: tab,
    ...(item.armorClass != null ? { armorClass: item.armorClass } : {}),
    ...(item.description ? { description: item.description } : {}),
    ...(item.weaponGroup ? { weaponGroup: item.weaponGroup } : {}),
    ...(item.weaponStats ? { weaponStats: item.weaponStats } : {}),
  };
}

function weaponToEquipment(weapon: Weapon, weaponGroup: WeaponGroupId): EquipmentItem {
  return {
    id: weapon.code,
    name: weapon.name,
    category: "arma",
    tab: "armas",
    pricePc: parseCostPc(weapon.price),
    weightKg: parseWeightKg(weapon.weight),
    section: "lista de armas",
    weaponGroup,
    weaponStats: {
      size: weapon.size,
      type: weapon.type,
      speed: weapon.speed,
      damagePM: weapon.damagePM,
      damageG: weapon.damageG,
    },
  };
}

function loadCatalogItems(): EquipmentItem[] {
  const items: EquipmentItem[] = [];

  for (const [filePath, mod] of Object.entries(catalogModules)) {
    const fileName = filePath.split("/").pop() ?? "";
    if (fileName === "items-index.json" || fileName === "legacy-id-migration.json") {
      continue;
    }
    if (WEAPON_ITEM_FILES.has(fileName)) continue;

    const tab = CATALOG_FILE_TABS[fileName];
    if (!tab) continue;

    const entries = unwrapDefault(mod);
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      items.push(catalogItemToEquipment(entry, tab));
    }
  }

  return items;
}

function loadWeaponShopItems(): EquipmentItem[] {
  const items: EquipmentItem[] = [];

  for (const group of weaponGroups) {
    const weaponGroup = GROUP_NAME_TO_WEAPON_GROUP[group.name] ?? "outras";
    for (const weapon of group.weapons) {
      items.push(weaponToEquipment(weapon, weaponGroup));
    }
  }

  return items;
}

export function loadEquipmentItems(): EquipmentItem[] {
  const items = [...loadWeaponShopItems(), ...loadCatalogItems()];
  return items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export const LEGACY_EQUIPMENT_ID_MIGRATION: Record<string, string> = {
  ...(legacyIdMigration as Record<string, string>),
};

export const equipmentItemsFromCatalog: EquipmentItem[] = loadEquipmentItems();

export const equipmentById = Object.fromEntries(
  equipmentItemsFromCatalog.map((item) => [item.id, item]),
) as Record<string, EquipmentItem>;
