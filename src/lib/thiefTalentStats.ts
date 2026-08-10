import {
  classHasThiefTalents,
  shouldShowThiefTalents,
  THIEF_TALENT_CAP,
  THIEF_TALENT_RACIAL,
  THIEF_TALENTS,
  type ThiefTalentKey,
} from "@/data/thiefTalents";
import {
  clampSubAttributeTableValue,
  tabelaEquilibrio,
  tabelaPrecisao,
} from "@/data/subAttributeTables";

function parsePercentMod(raw: string | undefined): number {
  if (!raw) return 0;
  const m = raw.replace(/\s/g, "").match(/([+-]?\d+)/);
  return m ? Number(m[1]) : 0;
}

function subAttrTalentMod(
  subAttributes: Record<string, number>,
  subAttr: "Precisão" | "Equilíbrio",
  field: "furtarBolsos" | "abrirFechaduras" | "moverSilencio" | "escalarMuros",
): number {
  const value = clampSubAttributeTableValue(subAttributes[subAttr] ?? 10);
  if (subAttr === "Precisão") {
    const row = tabelaPrecisao[value];
    if (!row) return 0;
    if (field === "furtarBolsos") return parsePercentMod(row.furtarBolsos);
    if (field === "abrirFechaduras") return parsePercentMod(row.abrirFechaduras);
    return 0;
  }
  const row = tabelaEquilibrio[value];
  if (!row) return 0;
  if (field === "moverSilencio") return parsePercentMod(row.moverSilencio);
  if (field === "escalarMuros") return parsePercentMod(row.escalarMuros);
  return 0;
}

function advantageTalentBonus(
  talentKey: ThiefTalentKey,
  selectedClass: string,
  selectedAdvantages: string[],
): number {
  if (
    talentKey === "ouvirRuidos" &&
    selectedClass === "Ladrão" &&
    selectedAdvantages.includes("Audição Aguçada")
  ) {
    return 10;
  }
  return 0;
}

export interface ThiefTalentBreakdown {
  key: ThiefTalentKey;
  label: string;
  base: number;
  racial: number;
  attrMod: number;
  advantage: number;
  purchased: number;
  total: number;
}

export function computeThiefTalentBreakdown(params: {
  selectedClass: string;
  selectedRace: string;
  subAttributes: Record<string, number>;
  selectedAdvantages?: string[];
  /** Pontos percentuais comprados / distribuídos por talento. */
  purchasedBonuses?: Record<string, number> | null;
}): ThiefTalentBreakdown[] | null {
  if (
    !shouldShowThiefTalents(params.selectedClass, params.purchasedBonuses)
  ) {
    return null;
  }

  const racialMap = THIEF_TALENT_RACIAL[params.selectedRace] ?? {};
  const purchased = params.purchasedBonuses ?? {};
  const advantages = params.selectedAdvantages ?? [];

  return THIEF_TALENTS.map((talent) => {
    const racial = racialMap[talent.key] ?? 0;
    const attrMod =
      talent.subAttr && talent.subAttrField
        ? subAttrTalentMod(params.subAttributes, talent.subAttr, talent.subAttrField)
        : 0;
    const advantage = advantageTalentBonus(
      talent.key,
      params.selectedClass,
      advantages,
    );
    const bought = Math.max(0, Math.floor(purchased[talent.key] ?? 0));
    const raw = talent.base + racial + attrMod + advantage + bought;
    const total = Math.max(0, Math.min(THIEF_TALENT_CAP, raw));

    return {
      key: talent.key,
      label: talent.label,
      base: talent.base,
      racial,
      attrMod,
      advantage,
      purchased: bought,
      total,
    };
  });
}
