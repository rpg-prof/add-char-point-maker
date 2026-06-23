import skillsIndex from "./skills/skills-index.json";

export interface SkillCostByClass {
  all?: number;
  guerreiro?: number;
  ladrao?: number;
  sacerdote?: number;
  arcano?: number;
  other?: number;
}

export interface SkillMetadata {
  name: string;
  costByClass: SkillCostByClass;
  attribute: string;
  groups: string[];
  penaltyNoProficiency?: number;
  /** Legado: descrição ainda embutida em JSON antigos. */
  description?: string;
}

export interface Skill extends SkillMetadata {
  description: string;
  /** Arquivo .md irmão do JSON (ex.: agricultura.md). */
  descriptionFile: string;
}

export const SKILL_GROUP_ORDER = [
  "Geral",
  "Guerreiro",
  "Ladrão/Bardo",
  "Sacerdote",
  "Mago",
] as const;

export const CLASS_TO_SKILL_GROUPS: Record<string, string[]> = {
  Guerreiro: ["Guerreiro"],
  Paladino: ["Guerreiro"],
  Ranger: ["Guerreiro"],
  Ladrão: ["Ladrão/Bardo"],
  Bardo: ["Ladrão/Bardo"],
  Sacerdote: ["Sacerdote"],
  Arcano: ["Mago"],
};

const CLASS_TO_COST_KEY: Record<string, keyof SkillCostByClass> = {
  Guerreiro: "guerreiro",
  Paladino: "guerreiro",
  Ranger: "guerreiro",
  Ladrão: "ladrao",
  Bardo: "ladrao",
  Sacerdote: "sacerdote",
  Arcano: "arcano",
};

const skillJsonFiles = import.meta.glob<{ default: SkillMetadata }>(
  "./skills/*.json",
  { eager: true },
);

const skillDescriptions = import.meta.glob<string>("./skills/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export const skillMdLoaders = import.meta.glob<string>("./skills/*.md", {
  query: "?raw",
  import: "default",
});

export function unwrapRawText(
  module: string | { default: string } | undefined,
): string {
  if (module == null) return "";
  if (typeof module === "string") return module;
  if (typeof module === "object" && "default" in module) {
    return typeof module.default === "string" ? module.default : "";
  }
  return "";
}

export async function fetchSkillDescription(mdFile: string): Promise<string> {
  const path = `./skills/${mdFile}`;
  const loader = skillMdLoaders[path];
  if (!loader) return "";
  const mod = await loader();
  return unwrapRawText(mod);
}

function unwrapSkillModule(
  module: SkillMetadata | { default: SkillMetadata } | undefined,
): SkillMetadata | undefined {
  if (!module) return undefined;
  if ("default" in module && module.default) return module.default;
  return module as SkillMetadata;
}

function resolveDescription(
  filePath: string,
  detail: SkillMetadata,
  descriptionFiles: Record<string, string | { default: string }>,
): string {
  const mdPath = filePath.replace(/\.json$/, ".md");
  const fromMd = unwrapRawText(descriptionFiles[mdPath]);
  if (fromMd) return fromMd;
  return detail.description ?? "";
}

function loadSkills(): Skill[] {
  const index = skillsIndex["by-group"] as Record<
    string,
    Array<{ name: string; file: string; attribute: string; groups: string[] }>
  >;

  const skills: Skill[] = [];
  const seen = new Set<string>();

  for (const entries of Object.values(index)) {
    for (const entry of entries) {
      if (seen.has(entry.name)) continue;
      seen.add(entry.name);

      const filePath = `./skills/${entry.file}`;
      if (entry.file === "skills-index.json") continue;

      const detail = unwrapSkillModule(skillJsonFiles[filePath]);
      if (!detail) continue;

      const descriptionFile = entry.file.replace(/\.json$/, ".md");

      skills.push({
        name: detail.name || entry.name,
        costByClass: detail.costByClass,
        attribute: detail.attribute || entry.attribute,
        groups: detail.groups?.length ? detail.groups : entry.groups,
        penaltyNoProficiency: detail.penaltyNoProficiency,
        description: resolveDescription(filePath, detail, skillDescriptions),
        descriptionFile,
      });
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function isSkillForClass(skill: Skill, characterClass: string): boolean {
  if (skill.groups.includes("Geral")) return true;
  const matchGroups = CLASS_TO_SKILL_GROUPS[characterClass] || [];
  return skill.groups.some((g) => matchGroups.includes(g));
}

export type SkillPanelCategory = "geral" | "class" | "other";

/** Agrupa perícias para o painel: Geral / da classe / de outras classes. */
export function getSkillPanelCategory(
  skill: Skill,
  characterClass: string,
): SkillPanelCategory {
  if (skill.groups.includes("Geral")) return "geral";
  if (isSkillForClass(skill, characterClass)) return "class";
  return "other";
}

export function groupSkillsForPanel(
  characterClass: string,
): Record<SkillPanelCategory, Skill[]> {
  const grouped: Record<SkillPanelCategory, Skill[]> = {
    geral: [],
    class: [],
    other: [],
  };

  for (const skill of skills) {
    grouped[getSkillPanelCategory(skill, characterClass)].push(skill);
  }

  return grouped;
}

export function getSkillCost(skill: Skill, characterClass: string): number {
  const { costByClass: cb } = skill;
  if (cb.all != null) return cb.all;

  const key = CLASS_TO_COST_KEY[characterClass];
  if (key && cb[key] != null) return cb[key]!;

  return cb.other ?? 0;
}

export function getSkillPrimaryGroup(skill: Skill): string {
  return skill.groups[0] ?? "Geral";
}

export const skills: Skill[] = loadSkills();

/** @deprecated Use Skill from @/data/skills */
export type SkillOption = Skill;
