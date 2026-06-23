/** Utilitários de serialização para itens de catálogo (armaduras, equipamento, etc.). */

const COPPER_PER_SILVER = 10;
const COPPER_PER_GOLD = 100;

export function formatCostString(pricePc) {
  const po = Math.floor(pricePc / COPPER_PER_GOLD);
  const remainder = pricePc % COPPER_PER_GOLD;
  const pp = Math.floor(remainder / COPPER_PER_SILVER);
  const pc = remainder % COPPER_PER_SILVER;
  const parts = [];
  if (po > 0) parts.push(`${po} po`);
  if (pp > 0) parts.push(`${pp} pp`);
  if (pc > 0) parts.push(`${pc} pc`);
  return parts.length > 0 ? parts.join(" ") : "0 pc";
}

export function formatWeightString(weightKg) {
  if (!weightKg || weightKg <= 0) return "0";
  if (weightKg >= 1) {
    const rounded = Math.round(weightKg * 100) / 100;
    return Number.isInteger(rounded) ? `${rounded}kg` : `${rounded}kg`;
  }
  const grams = Math.round(weightKg * 1000);
  return grams > 0 ? `${grams}g` : "0";
}

export function serializeCatalogItem(item) {
  const entry = {
    code: item.code,
    name: item.name,
    category: item.category,
    weight: item.weight,
    cost: item.cost,
  };
  if (item.armorClass != null && item.armorClass !== "") {
    entry.armorClass = item.armorClass;
  }
  if (item.description) entry.description = item.description;
  if (item.weaponGroup) entry.weaponGroup = item.weaponGroup;
  if (item.weaponStats) entry.weaponStats = item.weaponStats;
  return entry;
}

export const CATALOG_TAB_FILES = {
  armaduras: "armor.json",
  equipamento: "equipment.json",
  alimentacao: "food.json",
  vestuario: "clothing.json",
  transporte: "transport.json",
  animais: "animals.json",
  montaria: "mount-gear.json",
  armas: "ammunition.json",
};
