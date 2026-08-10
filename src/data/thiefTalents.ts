/** Talentos ladinos — base e custos de data/character-evolution.html */

export type ThiefTalentKey =
  | "abrirFechaduras"
  | "acharArmadilhas"
  | "arteDaFuga"
  | "decifrarEscrita"
  | "detectarIlusao"
  | "detectarMagia"
  | "escalarMuros"
  | "esconderSombras"
  | "furtarBolsos"
  | "moverSilencio"
  | "ouvirRuidos"
  | "subornar";

export type ThiefTalentCostGroup = "ladrao" | "ranger" | "bardo" | "outras";

export interface ThiefTalentDef {
  key: ThiefTalentKey;
  label: string;
  /** Valor base (%) na criação. */
  base: number;
  /**
   * Sub-atributo que modifica o percentual (Tabelas de Precisão / Equilíbrio).
   * Ausente = sem modificador por sub-atributo nesta edição.
   */
  subAttr?: "Precisão" | "Equilíbrio";
  /** Campo da tabela do sub-atributo. */
  subAttrField?: "furtarBolsos" | "abrirFechaduras" | "moverSilencio" | "escalarMuros";
  /** Custo em PP por +1%, por grupo de classe. */
  costPerPercent: Record<ThiefTalentCostGroup, number>;
}

export const THIEF_TALENTS: ThiefTalentDef[] = [
  {
    key: "abrirFechaduras",
    label: "Abrir Fechaduras",
    base: 10,
    subAttr: "Precisão",
    subAttrField: "abrirFechaduras",
    costPerPercent: { ladrao: 2, ranger: 10, bardo: 10, outras: 10 },
  },
  {
    key: "acharArmadilhas",
    label: "Achar/Desarmar Armadilhas",
    base: 5,
    costPerPercent: { ladrao: 2, ranger: 5, bardo: 10, outras: 10 },
  },
  {
    key: "arteDaFuga",
    label: "Arte da Fuga",
    base: 10,
    costPerPercent: { ladrao: 2, ranger: 10, bardo: 10, outras: 10 },
  },
  {
    key: "decifrarEscrita",
    label: "Decifrar Escrita",
    base: 0,
    costPerPercent: { ladrao: 2, ranger: 10, bardo: 5, outras: 10 },
  },
  {
    key: "detectarIlusao",
    label: "Detectar Ilusão",
    base: 10,
    costPerPercent: { ladrao: 2, ranger: 10, bardo: 10, outras: 10 },
  },
  {
    key: "detectarMagia",
    label: "Detectar Magia",
    base: 5,
    costPerPercent: { ladrao: 2, ranger: 10, bardo: 10, outras: 10 },
  },
  {
    key: "escalarMuros",
    label: "Escalar Muros",
    base: 60,
    subAttr: "Equilíbrio",
    subAttrField: "escalarMuros",
    costPerPercent: { ladrao: 2, ranger: 4, bardo: 2, outras: 10 },
  },
  {
    key: "esconderSombras",
    label: "Esconder-se nas Sombras",
    base: 5,
    costPerPercent: { ladrao: 2, ranger: 5, bardo: 10, outras: 10 },
  },
  {
    key: "furtarBolsos",
    label: "Furtar Bolsos",
    base: 15,
    subAttr: "Precisão",
    subAttrField: "furtarBolsos",
    costPerPercent: { ladrao: 2, ranger: 10, bardo: 6, outras: 10 },
  },
  {
    key: "moverSilencio",
    label: "Mover-se em Silêncio",
    base: 10,
    subAttr: "Equilíbrio",
    subAttrField: "moverSilencio",
    costPerPercent: { ladrao: 2, ranger: 5, bardo: 10, outras: 10 },
  },
  {
    key: "ouvirRuidos",
    label: "Ouvir Ruídos",
    base: 15,
    costPerPercent: { ladrao: 2, ranger: 4, bardo: 2, outras: 10 },
  },
  {
    key: "subornar",
    label: "Subornar",
    base: 5,
    costPerPercent: { ladrao: 2, ranger: 10, bardo: 10, outras: 10 },
  },
];

/** Ajustes raciais (AD&D 2e / tabela padrão, nomes da ficha). */
export const THIEF_TALENT_RACIAL: Record<
  string,
  Partial<Record<ThiefTalentKey, number>>
> = {
  Anão: {
    abrirFechaduras: 10,
    acharArmadilhas: 15,
    escalarMuros: -10,
    decifrarEscrita: -5,
  },
  Elfo: {
    furtarBolsos: 5,
    abrirFechaduras: -5,
    moverSilencio: 5,
    esconderSombras: 10,
    ouvirRuidos: 5,
  },
  Gnomo: {
    abrirFechaduras: 5,
    acharArmadilhas: 10,
    moverSilencio: 5,
    esconderSombras: 5,
    ouvirRuidos: 10,
    escalarMuros: -15,
  },
  "Meio-Elfo": {
    furtarBolsos: 10,
    esconderSombras: 5,
  },
  Halfling: {
    furtarBolsos: 5,
    abrirFechaduras: 5,
    acharArmadilhas: 5,
    moverSilencio: 10,
    esconderSombras: 15,
    ouvirRuidos: 5,
    escalarMuros: -15,
    decifrarEscrita: -5,
  },
};

export function getThiefTalentCostGroup(className: string): ThiefTalentCostGroup {
  switch (className) {
    case "Ladrão":
      return "ladrao";
    case "Ranger":
      return "ranger";
    case "Bardo":
      return "bardo";
    default:
      return "outras";
  }
}

/** Custo em PP para +1% no talento, conforme a classe. */
export function getThiefTalentCostPerPercent(
  talent: Pick<ThiefTalentDef, "costPerPercent">,
  className: string,
): number {
  return talent.costPerPercent[getThiefTalentCostGroup(className)];
}

/** Classes com tabela nativa de talentos ladinos na ficha. */
export function classHasThiefTalents(className: string): boolean {
  return className === "Ladrão" || className === "Bardo" || className === "Ranger";
}

/** Exibe a tabela se a classe a possui ou se já comprou percentuais. */
export function shouldShowThiefTalents(
  className: string,
  purchasedBonuses?: Record<string, number> | null,
): boolean {
  if (classHasThiefTalents(className)) return true;
  return Object.values(purchasedBonuses ?? {}).some((n) => n > 0);
}

/** Teto usual de talentos ladinos (inclui ajustes). */
export const THIEF_TALENT_CAP = 95;
