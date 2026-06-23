import { COPPER_PER_GOLD, COPPER_PER_SILVER } from "./currency";

/** Converte preço textual (ex.: "2 po", "5 pp") para cobre (pc). */
export function parseCostPc(raw: string): number {
  if (!raw || raw.trim() === "-" || raw.trim() === "—") return 0;
  const text = raw.trim().toLowerCase().replace(/\./g, "").replace(/,/g, ".");
  if (/\ba\s+\d/.test(text)) return 0;
  const left = text.includes("/") ? text.split("/")[0].trim() : text;
  let total = 0;
  let found = false;
  const re = /(\d+(?:\.\d+)?)\s*(po|pp|pc|p\.o\.|p\.p\.|p\.c\.)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(left)) !== null) {
    found = true;
    const value = parseFloat(match[1]);
    const unit = match[2];
    if (unit.startsWith("po")) total += value * COPPER_PER_GOLD;
    else if (unit.startsWith("pp")) total += value * COPPER_PER_SILVER;
    else total += value;
  }
  if (!found) return 0;
  return Math.max(0, Math.round(total));
}

/** Formata peso numérico (kg) para exibição em JSON de itens. */
export function formatWeightString(weightKg: number): string {
  if (!weightKg || weightKg <= 0) return "0";
  if (weightKg >= 1) {
    const rounded = Math.round(weightKg * 100) / 100;
    return Number.isInteger(rounded) ? `${rounded}kg` : `${rounded}kg`;
  }
  const grams = Math.round(weightKg * 1000);
  return grams > 0 ? `${grams}g` : "0";
}

/** Converte cobre (pc) para string de preço legível. */
export function formatCostString(pricePc: number): string {
  const po = Math.floor(pricePc / COPPER_PER_GOLD);
  const remainder = pricePc % COPPER_PER_GOLD;
  const pp = Math.floor(remainder / COPPER_PER_SILVER);
  const pc = remainder % COPPER_PER_SILVER;
  const parts: string[] = [];
  if (po > 0) parts.push(`${po} po`);
  if (pp > 0) parts.push(`${pp} pp`);
  if (pc > 0) parts.push(`${pc} pc`);
  return parts.length > 0 ? parts.join(" ") : "0 pc";
}
