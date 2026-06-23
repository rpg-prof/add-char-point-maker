import weaponsIndex from "./weapons/weapons-index.json";

export interface Weapon {
  code: string;
  name: string;
  weight: string;
  size: string;
  type: string;
  speed: string;
  damagePM: string;
  damageG: string;
  price: string;
}

export interface WeaponGroup {
  name: string;
  sizeCategory: "P" | "M" | "G";
  costPerWeapon: number;
  costGroup: number | null;
  costSpecialization: number;
  penaltyNoProficiency: number;
  penaltySimilar: number;
  weapons: Weapon[];
}

export interface WeaponItem {
  code: string;
  name: string;
  weight: string;
  cost: string;
}

interface WeaponGroupFile {
  "group-name": string;
  "group-size-category": "P" | "M" | "G";
  "group-cost-per-weapon": number;
  "group-cost-group": number | null;
  "group-cost-specialization": number;
  "group-penalty-no-proficiency": number;
  "group-penalty-similar": number;
  weapons: Array<{
    code: string;
    name: string;
    weight: string;
    size: string;
    type: string;
    speed: string;
    damagePM: string;
    damageG: string;
  }>;
}

const weaponGroupModules = import.meta.glob<{ default: WeaponGroupFile }>(
  "./weapons/*.json",
  { eager: true },
);

const weaponItemSlugs = new Set(
  (weaponsIndex as { groups: Array<{ slug: string }> }).groups.map((g) => g.slug),
);

const weaponItemModules = import.meta.glob<{ default: WeaponItem[] }>(
  "./items/*.json",
  { eager: true },
);

function unwrapDefault<T>(mod: T | { default: T }): T {
  if (mod != null && typeof mod === "object" && "default" in mod) {
    return (mod as { default: T }).default;
  }
  return mod as T;
}

function buildItemsByCode(): Map<string, WeaponItem> {
  const map = new Map<string, WeaponItem>();
  for (const [filePath, mod] of Object.entries(weaponItemModules)) {
    const fileName = filePath.split("/").pop()?.replace(/\.json$/, "");
    if (!fileName || !weaponItemSlugs.has(fileName)) continue;
    const items = unwrapDefault(mod);
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      map.set(item.code, item);
    }
  }
  return map;
}

const itemsByCode = buildItemsByCode();

function normalizeGroup(file: WeaponGroupFile): WeaponGroup {
  return {
    name: file["group-name"],
    sizeCategory: file["group-size-category"],
    costPerWeapon: file["group-cost-per-weapon"],
    costGroup: file["group-cost-group"],
    costSpecialization: file["group-cost-specialization"],
    penaltyNoProficiency: file["group-penalty-no-proficiency"],
    penaltySimilar: file["group-penalty-similar"],
    weapons: file.weapons.map((w) => {
      const item = itemsByCode.get(w.code);
      return {
        code: w.code,
        name: w.name,
        weight: item?.weight ?? w.weight,
        size: w.size,
        type: w.type,
        speed: w.speed,
        damagePM: w.damagePM,
        damageG: w.damageG,
        price: item?.cost ?? "",
      };
    }),
  };
}

function loadWeaponGroups(): WeaponGroup[] {
  const index = weaponsIndex as { groups: Array<{ slug: string; name: string }> };
  const groups: WeaponGroup[] = [];

  for (const entry of index.groups) {
    const filePath = `./weapons/${entry.slug}.json`;
    const mod = weaponGroupModules[filePath];
    if (!mod) {
      console.warn(`Grupo de armas não encontrado: ${filePath}`);
      continue;
    }
    groups.push(normalizeGroup(unwrapDefault(mod)));
  }

  return groups;
}

export function getWeaponItemByCode(code: string): WeaponItem | undefined {
  return itemsByCode.get(code);
}

export function getAllWeaponItems(): WeaponItem[] {
  return [...itemsByCode.values()];
}

export const weaponGroups: WeaponGroup[] = loadWeaponGroups();
