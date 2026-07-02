// ===== RACES =====
export interface RaceOption {
  name: string;
  cost: number;
}

export const races: RaceOption[] = [
  { name: "Humano", cost: 0 },
  { name: "Anão", cost: 10 },
  { name: "Elfo", cost: 10 },
  { name: "Gnomo", cost: 5 },
  { name: "Halfling", cost: 5 },
  { name: "Meio-Elfo", cost: 10 },
];

// ===== CLASSES =====
export interface ClassOption {
  name: string;
  cost: number;
}

export const classes: ClassOption[] = [
  { name: "Sem Classe", cost: 0 },
  { name: "Guerreiro", cost: 5 },
  { name: "Paladino", cost: 10 },
  { name: "Ranger", cost: 15 },
  { name: "Ladrão", cost: 10 },
  { name: "Bardo", cost: 15 },
  { name: "Sacerdote", cost: 15 },
  { name: "Arcano", cost: 20 },
  { name: "Monge", cost: 20 },
];

// ===== SOCIAL CLASS =====
export interface SocialClassOption {
  name: string;
  cost: number;
  /** Capital inicial em peças de ouro (po). */
  capitalPo: number;
  capital: string;
}

export const socialClasses: SocialClassOption[] = [
  { name: "Escravo", cost: -40, capitalPo: 0, capital: "0 po" },
  { name: "Classe baixa", cost: -20, capitalPo: 40, capital: "40 po" },
  { name: "Classe média baixa", cost: 0, capitalPo: 80, capital: "80 po" },
  { name: "Classe média alta", cost: 20, capitalPo: 160, capital: "160 po" },
  { name: "Classe alta / Nobreza menor", cost: 30, capitalPo: 320, capital: "320 po" },
  { name: "Nobreza Maior", cost: 50, capitalPo: 640, capital: "640 po" },
];

// ===== REPUTATION =====
export interface ReputationOption {
  level: number;
  cost: number;
  description: string;
}

export const reputations: ReputationOption[] = [
  { level: 0, cost: 0, description: "Ninguém nunca ouviu falar do personagem" },
  { level: 1, cost: 5, description: "Personagem conhecido em sua cidade" },
  { level: 2, cost: 10, description: "Nome do personagem já foi falado nas cidades vizinhas" },
  { level: 3, cost: 25, description: "Em muitos lugares já se ouviu alguma estória dele" },
  { level: 4, cost: 50, description: "É reconhecido (querido ou temido) em todos lugares" },
];

// ===== ALIGNMENT / TENDÊNCIAS =====
export const alignments: string[] = [
  "Leal e Bom",
  "Leal e Neutro",
  "Leal e Mal",
  "Neutro e Bom",
  "Neutro",
  "Neutro e Mal",
  "Caótico e Bom",
  "Caótico e Neutro",
  "Caótico e Mal",
];

// ===== ADVANTAGES / DISADVANTAGES =====
// Carregadas de src/data/advantages/ (JSON + MD). Ver @/data/advantages.
export type { GeneralAdvantage as AdvantageOption, AdvantageType } from "./advantages";
export {
  generalAdvantages,
  generalDisadvantages,
} from "./advantages";

// ===== SKILLS =====
// Perícias carregadas de src/data/skills/ (JSON + MD). Ver @/data/skills.
export type { Skill as SkillOption } from "./skills";
export { skills } from "./skills";

// ===== ATTRIBUTES =====
export const attributeNames = [
  "Força",
  "Destreza", 
  "Constituição",
  "Inteligência",
  "Sabedoria",
  "Carisma",
] as const;

export type AttributeName = typeof attributeNames[number];

/** Tabela 8: Exigências Raciais de Habilidades — ajuste ao mín/máx (base 3–18). */
export const raceAttributeAdjustments: Partial<
  Record<string, Partial<Record<AttributeName, number>>>
> = {
  Anão: { Constituição: 1, Carisma: -1 },
  Elfo: { Destreza: 1, Constituição: -1 },
  Gnomo: { Inteligência: 1, Sabedoria: -1 },
  Halfling: { Destreza: 1, Força: -1 },
};

export const ATTRIBUTE_MIN_DEFAULT = 3;
export const ATTRIBUTE_MAX_DEFAULT = 18;

export function getRaceAttributeAdjustment(
  race: string,
  attr: AttributeName
): number {
  return raceAttributeAdjustments[race]?.[attr] ?? 0;
}

export function getAttributeLimits(
  race: string,
  attr: AttributeName
): { min: number; max: number } {
  const adjustment = getRaceAttributeAdjustment(race, attr);
  return {
    min: ATTRIBUTE_MIN_DEFAULT + adjustment,
    max: ATTRIBUTE_MAX_DEFAULT + adjustment,
  };
}

export function clampAttributeValue(
  race: string,
  attr: AttributeName,
  value: number
): number {
  const { min, max } = getAttributeLimits(race, attr);
  return Math.max(min, Math.min(max, value));
}

// Cost table: attribute value -> cumulative cost
// Base value is 8 (costs 0). Each point costs more as you go higher.
export const attributeCosts: Record<number, number> = {
  3: -10,
  4: -8,
  5: -6,
  6: -4,
  7: -2,
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 5,
  13: 7,
  14: 10,
  15: 13,
  16: 17,
  17: 22,
  18: 28,
};
