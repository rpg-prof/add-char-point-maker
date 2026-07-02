import advantagesIndex from "./advantages/advantages-index.json";

export type AdvantageType = "advantage" | "disadvantage";

export type RaceClassCategory =
  | "ofensivo"
  | "defensivo"
  | "resistencia"
  | "magica"
  | "outros"
  | "aversao"
  | "poder"
  | "antecedente";

/** Pastas em src/data/advantages/ (exceto general). */
export type AdvantageFolder =
  | "ofensive"
  | "defensive"
  | "magic"
  | "powers"
  | "aversions"
  | "others"
  | "background";

export const CATEGORY_TO_FOLDER: Record<RaceClassCategory, AdvantageFolder> = {
  ofensivo: "ofensive",
  defensivo: "defensive",
  resistencia: "others",
  magica: "magic",
  outros: "others",
  aversao: "aversions",
  poder: "powers",
  antecedente: "background",
};

export const FOLDER_TO_CATEGORY: Record<AdvantageFolder, RaceClassCategory[]> = {
  ofensive: ["ofensivo"],
  defensive: ["defensivo"],
  magic: ["magica"],
  powers: ["poder"],
  aversions: ["aversao"],
  others: ["outros", "resistencia"],
  background: ["antecedente"],
};

/** Custo em pontos de progressão (fixo ou por contexto raça/classe). */
export interface ProgressPointsCostByContext {
  /** Custo para raça/classe aplicável. */
  native: number;
  /** Custo para outros; null = indisponível com pontos de progressão. */
  others?: number | null;
  /** Sobrescritas por classe (ex.: Paladino paga o dobro em um poder). */
  byClass?: Partial<Record<string, number>>;
}

export type ProgressPointsCost = number | ProgressPointsCostByContext;

export interface GeneralAdvantageMetadata {
  name: string;
  cost: number;
  type: AdvantageType;
  severity?: "moderate" | "severe";
  link?: string;
}

export interface GeneralAdvantage extends GeneralAdvantageMetadata {
  description: string;
  descriptionFile: string;
}

export interface RaceClassAdvantageMetadata {
  name: string;
  category: RaceClassCategory;
  applicableRaces?: string[];
  applicableClasses?: string[];
  cost: number;
  costOthers: number | null;
  type: AdvantageType;
  maxPurchases?: number;
  link?: string;
  /** Quando definido, a vantagem pode ser comprada com pontos de progressão. */
  progressPointsCost?: ProgressPointsCost;
}

export interface RaceClassAdvantage extends RaceClassAdvantageMetadata {
  description: string;
  descriptionFile: string;
  /** Pasta de origem (ofensive, magic, …). */
  folder: AdvantageFolder;
}

export const categoryLabels: Record<RaceClassCategory, string> = {
  ofensivo: "Ajustes Ofensivos",
  defensivo: "Ajustes Defensivos",
  resistencia: "Bônus de Resistência",
  magica: "Mágicas",
  outros: "Outras Vantagens/Desvantagens",
  aversao: "Aversões",
  poder: "Poderes",
  antecedente: "Antecedentes",
};

const RACE_CLASS_FOLDERS: AdvantageFolder[] = [
  "ofensive",
  "defensive",
  "magic",
  "powers",
  "aversions",
  "others",
  "background",
];

const generalJsonFiles = import.meta.glob<{ default: GeneralAdvantageMetadata }>(
  "./advantages/general/*.json",
  { eager: true },
);

const raceClassJsonFiles = import.meta.glob<{ default: RaceClassAdvantageMetadata }>(
  "./advantages/*/*.json",
  { eager: true },
);

const generalDescriptions = import.meta.glob<string>("./advantages/general/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

const raceClassDescriptions = import.meta.glob<string>("./advantages/*/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const advantageMdLoaders = import.meta.glob<string>("./advantages/*/*.md", {
  query: "?raw",
  import: "default",
});

function unwrapRawText(
  module: string | { default: string } | undefined,
): string {
  if (module == null) return "";
  if (typeof module === "string") return module;
  if (typeof module === "object" && "default" in module) {
    return typeof module.default === "string" ? module.default : "";
  }
  return "";
}

function unwrapMetadata<T>(
  module: T | { default: T } | undefined,
): T | undefined {
  if (!module) return undefined;
  if (typeof module === "object" && module !== null && "default" in module) {
    return (module as { default: T }).default;
  }
  return module as T;
}

function resolveDescription(
  jsonPath: string,
  detail: { description?: string },
  descriptionFiles: Record<string, string | { default: string }>,
): string {
  const mdPath = jsonPath.replace(/\.json$/, ".md");
  const fromMd = unwrapRawText(descriptionFiles[mdPath]);
  if (fromMd) return fromMd;
  return detail.description ?? "";
}

function loadGeneralAdvantages(type: AdvantageType): GeneralAdvantage[] {
  const entries =
    type === "advantage"
      ? advantagesIndex.general.advantages
      : advantagesIndex.general.disadvantages;

  return entries
    .map((entry) => {
      const filePath = `./advantages/general/${entry.file}`;
      const detail = unwrapMetadata(generalJsonFiles[filePath]);
      if (!detail) return null;

      const descriptionFile = entry.file.replace(/\.json$/, ".md");
      return {
        name: detail.name || entry.name,
        cost: detail.cost,
        type: detail.type,
        severity: detail.severity,
        link: detail.link,
        description: resolveDescription(filePath, detail, generalDescriptions),
        descriptionFile,
      } satisfies GeneralAdvantage;
    })
    .filter((item): item is GeneralAdvantage => item != null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function loadRaceClassAdvantages(): RaceClassAdvantage[] {
  const items: RaceClassAdvantage[] = [];
  const seen = new Set<string>();

  for (const folder of RACE_CLASS_FOLDERS) {
    const entries = (advantagesIndex as Record<string, Array<{ name: string; file: string; category?: RaceClassCategory }>>)[folder] ?? [];

    for (const entry of entries) {
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);

      const filePath = `./advantages/${folder}/${entry.file}`;
      const detail = unwrapMetadata(raceClassJsonFiles[filePath]);
      if (!detail) continue;

      const descriptionFile = `${folder}/${entry.file.replace(/\.json$/, ".md")}`;
      items.push({
        name: detail.name || entry.name,
        category: detail.category,
        applicableRaces: detail.applicableRaces,
        applicableClasses: detail.applicableClasses,
        cost: detail.cost,
        costOthers: detail.costOthers ?? null,
        type: detail.type,
        maxPurchases: detail.maxPurchases,
        link: detail.link,
        progressPointsCost: detail.progressPointsCost,
        description: resolveDescription(filePath, detail, raceClassDescriptions),
        descriptionFile,
        folder,
      });
    }
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function matchesApplicableRace(
  item: Pick<RaceClassAdvantage, "applicableRaces">,
  selectedRace: string,
): boolean {
  return !!item.applicableRaces?.some((r) => r === "Todas" || r === selectedRace);
}

export function matchesApplicableClass(
  item: Pick<RaceClassAdvantage, "applicableClasses">,
  selectedClass: string,
): boolean {
  return !!item.applicableClasses?.some((c) => c === "Todas" || c === selectedClass);
}

export function isRaceClassAdvantageNative(
  item: Pick<RaceClassAdvantage, "applicableRaces" | "applicableClasses">,
  selectedRace: string,
  selectedClass: string,
): boolean {
  return matchesApplicableRace(item, selectedRace) || matchesApplicableClass(item, selectedClass);
}

export function getRaceClassAdvantageCost(
  item: Pick<RaceClassAdvantage, "applicableRaces" | "applicableClasses" | "cost" | "costOthers">,
  selectedRace: string,
  selectedClass: string,
): number {
  if (isRaceClassAdvantageNative(item, selectedRace, selectedClass)) return item.cost;
  return item.costOthers ?? item.cost;
}

export function isRaceClassAdvantageAvailable(
  item: Pick<RaceClassAdvantage, "applicableRaces" | "applicableClasses" | "costOthers">,
  selectedRace: string,
  selectedClass: string,
): boolean {
  if (isRaceClassAdvantageNative(item, selectedRace, selectedClass)) return true;
  return item.costOthers !== null;
}

/** Retorna o custo em pontos de progressão, ou null se não aplicável. */
export function getProgressPointsCost(
  item: Pick<
    RaceClassAdvantage,
    "progressPointsCost" | "applicableRaces" | "applicableClasses"
  >,
  selectedRace: string,
  selectedClass: string,
): number | null {
  const spec = item.progressPointsCost;
  if (spec == null) return null;

  if (typeof spec === "number") return spec;

  const classOverride = spec.byClass?.[selectedClass];
  if (classOverride != null) return classOverride;

  const isNative = isRaceClassAdvantageNative(item, selectedRace, selectedClass);
  if (isNative) return spec.native;
  if (spec.others == null) return null;
  return spec.others;
}

export async function fetchAdvantageDescription(
  descriptionFile: string,
): Promise<string> {
  const path = `./advantages/${descriptionFile}`;
  const loader = advantageMdLoaders[path];
  if (!loader) return "";
  const mod = await loader();
  return unwrapRawText(mod);
}

export const generalAdvantages: GeneralAdvantage[] = loadGeneralAdvantages("advantage");
export const generalDisadvantages: GeneralAdvantage[] = loadGeneralAdvantages("disadvantage");
export const raceClassAdvantages: RaceClassAdvantage[] = loadRaceClassAdvantages();

/** @deprecated Use GeneralAdvantage from @/data/advantages */
export type AdvantageOption = GeneralAdvantage;
