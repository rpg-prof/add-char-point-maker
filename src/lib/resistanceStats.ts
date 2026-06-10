import { raceClassAdvantages } from "@/data/raceClassAdvantages";

export const RESISTANCE_DEFS: { key: string; label: string; base: number; subAttr: string }[] = [
  { key: "veneno", label: "Veneno / Doenças", base: 20, subAttr: "Saúde" },
  { key: "calor", label: "Calor", base: 20, subAttr: "Equilíbrio" },
  { key: "frio", label: "Frio", base: 20, subAttr: "Condicionamento" },
  { key: "sono", label: "Encantamento / Sono", base: 15, subAttr: "Força de Vontade" },
  { key: "ilusoes", label: "Ilusões", base: 15, subAttr: "Conhecimento" },
  { key: "magia", label: "Magia", base: 15, subAttr: "Força de Vontade" },
  { key: "som", label: "Som", base: 0, subAttr: "Força de Vontade" },
  { key: "dreno", label: "Dreno de Energia", base: 0, subAttr: "Força de Vontade" },
];

export function attrModifier(value: number): number {
  if (value <= 3) return -15;
  if (value === 4) return -10;
  if (value >= 5 && value <= 7) return -5;
  if (value >= 8 && value <= 14) return 0;
  if (value === 15) return 5;
  if (value === 16) return 10;
  if (value === 17) return 15;
  return 20;
}

function perThreeHalf(attrValue: number): number {
  return Math.floor(attrValue / 3.5) * 5;
}

export function advantageResistanceBonus(
  name: string,
  subAttributes: Record<string, number>
): Partial<Record<string, number>> {
  switch (name) {
    case "Proteção contra magias de sono e feitiço (Raça)":
      return { sono: 30 };
    case "Resistência à magia (Raça)":
      return { magia: perThreeHalf(subAttributes["Razão"] ?? 10) };
    case "Resistência à veneno (Raça)":
      return { veneno: perThreeHalf(subAttributes["Saúde"] ?? 10) };
    case "Resistência à magias de sono e feitiço (Raça)":
      return { sono: perThreeHalf(subAttributes["Força de Vontade"] ?? 10) };
    case "Resistência à ilusões (Raça)":
      return { ilusoes: perThreeHalf(subAttributes["Conhecimento"] ?? 10) };
    case "Acreditar em ilusões":
      return { ilusoes: -15 };
    case "Resistência ao calor":
      return { calor: 5 };
    case "Resistência ao frio":
      return { frio: 5 };
    case "Resistência a ilusões (Classe)":
      return { ilusoes: 5 };
    case "Resistência a magia (Classe)":
      return { magia: 5 };
    case "Resistência ao Som":
      return { som: 15 };
    case "Resistência a sono e feitiço (Classe)":
      return { sono: 5 };
    case "Resistência a veneno (Classe)":
      return { veneno: 5 };
    case "Resistir a dreno de energia":
      return { dreno: 15 };
    default:
      return {};
  }
}

export interface ResistanceBreakdown {
  key: string;
  label: string;
  base: number;
  subAttr: string;
  subVal: number;
  attrMod: number;
  bonus: number;
  total: number;
}

export function computeResistanceBreakdown(params: {
  subAttributes: Record<string, number>;
  selectedRaceClassAdv: string[];
}): ResistanceBreakdown[] {
  const { subAttributes, selectedRaceClassAdv } = params;
  const resistanceItems = raceClassAdvantages.filter((a) => a.category === "resistencia");

  const countOf = (name: string) => selectedRaceClassAdv.filter((n) => n === name).length;

  return RESISTANCE_DEFS.map((def) => {
    const subVal = subAttributes[def.subAttr] ?? 10;
    const attrMod = attrModifier(subVal);
    let bonus = 0;
    for (const item of resistanceItems) {
      const count = countOf(item.name);
      if (!count) continue;
      const b = advantageResistanceBonus(item.name, subAttributes)[def.key];
      if (b) bonus += b * count;
    }
    return {
      ...def,
      subVal,
      attrMod,
      bonus,
      total: def.base + attrMod + bonus,
    };
  });
}
