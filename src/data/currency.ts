/** 1 po = 10 pp = 100 pc */
export const COPPER_PER_SILVER = 10;
export const COPPER_PER_GOLD = 100;

export interface MoneyBreakdown {
  po: number;
  pp: number;
  pc: number;
  totalPc: number;
}

export function copperToBreakdown(totalPc: number): MoneyBreakdown {
  const safe = Math.max(0, Math.round(totalPc));
  const po = Math.floor(safe / COPPER_PER_GOLD);
  const remainder = safe % COPPER_PER_GOLD;
  const pp = Math.floor(remainder / COPPER_PER_SILVER);
  const pc = remainder % COPPER_PER_SILVER;
  return { po, pp, pc, totalPc: safe };
}

export function formatMoney(totalPc: number): string {
  const { po, pp, pc } = copperToBreakdown(totalPc);
  const parts: string[] = [];
  if (po > 0) parts.push(`${po} po`);
  if (pp > 0) parts.push(`${pp} pp`);
  if (pc > 0) parts.push(`${pc} pc`);
  return parts.length > 0 ? parts.join(", ") : "0 pc";
}

export function parseCapitalPo(capital: string): number {
  const match = capital.match(/(\d[\d.]*)/);
  if (!match) return 0;
  return parseInt(match[1].replace(/\./g, ""), 10) || 0;
}

export function socialClassCapitalPc(socialClassName: string, socialClasses: { name: string; capitalPo: number }[]): number {
  const sc = socialClasses.find((s) => s.name === socialClassName);
  return (sc?.capitalPo ?? 0) * COPPER_PER_GOLD;
}

export function parseWeightKg(value: string): number {
  if (!value || value === "-" || value === "*") return 0;
  const normalized = value.toLowerCase().replace(",", ".");
  const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) return parseFloat(kgMatch[1]);
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*g?\s*a\s*(\d+(?:\.\d+)?)\s*kg?/);
  if (rangeMatch) {
    const a = parseFloat(rangeMatch[1]);
    const b = parseFloat(rangeMatch[2]);
    const aKg = normalized.includes("g") && !normalized.includes("kg") ? a / 1000 : a;
    const bKg = b;
    return (aKg + bKg) / 2;
  }
  const gMatch = normalized.match(/(\d+(?:\.\d+)?)\s*g/);
  if (gMatch) return parseFloat(gMatch[1]) / 1000;
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
}

/** Converte texto de carga permitida (ex. "25 kg") em número. */
export function parseCargaKg(cargaText: string): number {
  const match = cargaText.replace(",", ".").match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}
