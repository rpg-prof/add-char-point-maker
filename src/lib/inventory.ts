import { equipmentById, type PurchasedItems } from "@/data/equipment";
import type { CustomInventoryItem, CustomWeaponStats, EquipmentItem } from "@/data/equipmentTypes";

export function createCustomItemId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeWeaponStats(raw: unknown): CustomWeaponStats | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const entry = raw as Record<string, unknown>;
  const damagePM = typeof entry.damagePM === "string" ? entry.damagePM.trim() : "";
  const damageG = typeof entry.damageG === "string" ? entry.damageG.trim() : "";
  if (!damagePM && !damageG) return undefined;
  return {
    damagePM: damagePM || damageG,
    damageG: damageG || damagePM,
    ...(typeof entry.type === "string" && entry.type.trim() ? { type: entry.type.trim() } : {}),
    ...(typeof entry.speed === "string" && entry.speed.trim() ? { speed: entry.speed.trim() } : {}),
  };
}

export function isCustomWeapon(item: CustomInventoryItem): boolean {
  return !!item.weaponStats;
}

export function customWeaponToEquipment(item: CustomInventoryItem): EquipmentItem {
  const stats = item.weaponStats!;
  return {
    id: item.id,
    name: item.name,
    category: "arma",
    tab: "armas",
    pricePc: 0,
    weightKg: item.weightKg,
    weaponStats: {
      size: "",
      type: stats.type ?? "",
      speed: stats.speed ?? "",
      damagePM: stats.damagePM,
      damageG: stats.damageG,
    },
  };
}

export function normalizeCustomItems(raw: unknown): CustomInventoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === "object")
    .map((entry) => {
      const weaponStats = normalizeWeaponStats(entry.weaponStats);
      return {
        id:
          typeof entry.id === "string" && entry.id.trim()
            ? entry.id.trim()
            : createCustomItemId(),
        name: typeof entry.name === "string" ? entry.name.trim() : "",
        weightKg: Math.max(0, Number(entry.weightKg) || 0),
        qty: Math.max(1, Math.floor(Number(entry.qty) || 1)),
        ...(weaponStats ? { weaponStats } : {}),
      };
    })
    .filter((entry) => entry.name.length > 0);
}

export function getCustomItemsWeightKg(items: CustomInventoryItem[]): number {
  return items.reduce((sum, item) => {
    if (item.qty <= 0) return sum;
    return sum + item.weightKg * item.qty;
  }, 0);
}

export function mergeInventory(
  purchased: PurchasedItems,
  added: PurchasedItems,
): PurchasedItems {
  const merged: PurchasedItems = { ...added };
  for (const [id, qty] of Object.entries(purchased)) {
    if (qty <= 0) continue;
    merged[id] = (merged[id] ?? 0) + qty;
  }
  return merged;
}

export interface InventoryEntry {
  id: string;
  qty: number;
  item: EquipmentItem;
  boughtQty: number;
  addedQty: number;
}

export function buildInventoryEntries(
  purchased: PurchasedItems,
  added: PurchasedItems,
  order?: string[],
): InventoryEntry[] {
  const ids = new Set([
    ...Object.keys(purchased).filter((id) => (purchased[id] ?? 0) > 0),
    ...Object.keys(added).filter((id) => (added[id] ?? 0) > 0),
  ]);

  const entries = [...ids]
    .map((id) => {
      const item = equipmentById[id];
      if (!item) return null;
      const boughtQty = purchased[id] ?? 0;
      const addedQty = added[id] ?? 0;
      return { id, item, boughtQty, addedQty, qty: boughtQty + addedQty };
    })
    .filter((e): e is InventoryEntry => e != null && e.qty > 0);

  if (!order || order.length === 0) {
    return entries.sort((a, b) => a.item.name.localeCompare(b.item.name, "pt-BR"));
  }

  const rank = new Map(order.map((id, index) => [id, index]));
  return entries.sort((a, b) => {
    const ra = rank.get(a.id);
    const rb = rank.get(b.id);
    if (ra == null && rb == null) {
      return a.item.name.localeCompare(b.item.name, "pt-BR");
    }
    if (ra == null) return 1;
    if (rb == null) return -1;
    return ra - rb;
  });
}

/** IDs atuais do inventário (catálogo + customizados). */
export function collectPresentInventoryIds(
  purchased: PurchasedItems,
  added: PurchasedItems,
  customItems: CustomInventoryItem[],
): string[] {
  const catalogIds = [
    ...Object.keys(purchased).filter((id) => (purchased[id] ?? 0) > 0),
    ...Object.keys(added).filter((id) => (added[id] ?? 0) > 0),
  ].filter((id, index, arr) => arr.indexOf(id) === index && !!equipmentById[id]);

  const customIds = customItems.filter((item) => item.qty > 0).map((item) => item.id);
  return [...catalogIds, ...customIds];
}

/** Mantém a ordem salva e acrescenta itens novos no fim. */
export function normalizeInventoryOrder(
  order: string[] | undefined,
  purchased: PurchasedItems,
  added: PurchasedItems,
  customItems: CustomInventoryItem[],
): string[] {
  const present = collectPresentInventoryIds(purchased, added, customItems);
  const presentSet = new Set(present);
  const kept = (order ?? []).filter((id) => presentSet.has(id));
  const keptSet = new Set(kept);
  const missing = present.filter((id) => !keptSet.has(id));

  const nameOf = (id: string) => {
    const catalog = equipmentById[id];
    if (catalog) return catalog.name;
    return customItems.find((item) => item.id === id)?.name ?? id;
  };

  missing.sort((a, b) => nameOf(a).localeCompare(nameOf(b), "pt-BR"));
  return [...kept, ...missing];
}

export function moveInventoryOrderItem(
  order: string[],
  id: string,
  direction: -1 | 1,
): string[] {
  const index = order.indexOf(id);
  if (index < 0) return order;
  const swap = index + direction;
  if (swap < 0 || swap >= order.length) return order;
  const next = [...order];
  [next[index], next[swap]] = [next[swap], next[index]];
  return next;
}

export function reorderInventoryOrder(
  order: string[],
  fromId: string,
  toId: string,
): string[] {
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return order;
  const next = [...order];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ensureInventoryOrderId(order: string[], id: string): string[] {
  if (order.includes(id)) return order;
  return [...order, id];
}

export function removeInventoryOrderId(order: string[], id: string): string[] {
  return order.filter((entry) => entry !== id);
}

export function isHelmet(item: EquipmentItem): boolean {
  return /elmo/i.test(item.name);
}

export function isShield(item: EquipmentItem): boolean {
  if (item.category !== "armadura") return false;
  const id = item.id.toLowerCase();
  return (
    typeof item.armorClass === "string" ||
    id === "buckler" ||
    /escudo|broquel/i.test(item.name)
  );
}

export function isBodyArmor(item: EquipmentItem): boolean {
  return item.category === "armadura" && !isShield(item) && !isHelmet(item);
}

export function isWeapon(item: EquipmentItem): boolean {
  return item.category === "arma" || item.tab === "armas";
}

export function isOtherGear(item: EquipmentItem): boolean {
  return !isWeapon(item) && !isBodyArmor(item) && !isShield(item) && !isHelmet(item);
}
