import mageSpellIndex from "./spell/mage-spells.json";
import clericSpellIndex from "./spell/cleric-spells.json";

export interface Spell {
  name: string;
  level: number;
  school: string;
  sphere?: string;
  range: string;
  duration: string;
  castingTime: string;
  components?: string;
  area?: string;
  savingThrow?: string;
  source?: string;
  description: string;
}

export interface SpellList {
  type: "arcane" | "divine";
  label: string;
  classes: string[];
  spells: Spell[];
}

interface SpellMetadata {
  name: string;
  level: number;
  school: string;
  sphere?: string;
  castingTime: string;
  duration: string;
  range: string;
  area?: string;
  components?: string;
  savingThrow?: string;
  source?: string;
  /** Legado: descrição ainda embutida em JSON antigos. */
  description?: string;
}

// Eagerly import all individual mage spell JSON files
const mageSpellFiles = import.meta.glob<{ default: SpellMetadata }>(
  "./spell/mage-spells/*.json",
  { eager: true },
);

const mageSpellDescriptions = import.meta.glob<string>(
  "./spell/mage-spells/*.md",
  { query: "?raw", import: "default", eager: true },
);

// Eagerly import all individual cleric spell JSON files
const clericSpellFiles = import.meta.glob<{ default: SpellMetadata }>(
  "./spell/cleric-spells/*.json",
  { eager: true },
);

const clericSpellDescriptions = import.meta.glob<string>(
  "./spell/cleric-spells/*.md",
  { query: "?raw", import: "default", eager: true },
);

function unwrapSpellModule(
  module: SpellMetadata | { default: SpellMetadata } | undefined,
): SpellMetadata | undefined {
  if (!module) return undefined;
  if ("default" in module && module.default) return module.default;
  return module as SpellMetadata;
}

function resolveDescription(
  filePath: string,
  detail: SpellMetadata,
  descriptionFiles: Record<string, string>,
): string {
  const mdPath = filePath.replace(/\.json$/, ".md");
  if (descriptionFiles[mdPath]) return descriptionFiles[mdPath];
  return detail.description ?? "";
}

// Generic loader from index + detail files
function loadSpells(
  index: Record<string, Array<{ name: string; file: string; level: number; school: string; sphere?: string }>>,
  detailFiles: Record<string, { default: SpellMetadata }>,
  descriptionFiles: Record<string, string>,
): Spell[] {
  const spells: Spell[] = [];

  for (const [, entries] of Object.entries(index)) {
    for (const entry of entries) {
      const filePath = `./spell/${entry.file}`;
      const detail = unwrapSpellModule(detailFiles[filePath]);
      if (detail) {
        spells.push({
          name: detail.name || entry.name,
          level: detail.level ?? entry.level,
          school: detail.school || entry.school,
          sphere: detail.sphere || entry.sphere,
          range: detail.range || "",
          duration: detail.duration || "",
          castingTime: detail.castingTime || "",
          components: detail.components,
          area: detail.area,
          savingThrow: detail.savingThrow,
          source: detail.source,
          description: resolveDescription(filePath, detail, descriptionFiles),
        });
      } else {
        // Fallback: use index data only
        spells.push({
          name: entry.name,
          level: entry.level,
          school: entry.school,
          sphere: entry.sphere,
          range: "",
          duration: "",
          castingTime: "",
          description: "",
        });
      }
    }
  }

  return spells;
}

const mageIndex = mageSpellIndex["by-level"] as Record<string, Array<{ name: string; file: string; level: number; school: string }>>;
const clericIndex = clericSpellIndex["by-level"] as Record<string, Array<{ name: string; file: string; level: number; school: string; sphere?: string }>>;

export const arcaneSpells: Spell[] = loadSpells(mageIndex, mageSpellFiles, mageSpellDescriptions);
export const divineSpells: Spell[] = loadSpells(clericIndex, clericSpellFiles, clericSpellDescriptions);

export const spellLists: SpellList[] = [
  {
    type: "arcane",
    label: "Magias Arcanas",
    classes: ["Arcano", "Bardo"],
    spells: arcaneSpells,
  },
  {
    type: "divine",
    label: "Magias Divinas",
    classes: ["Sacerdote", "Paladino", "Ranger"],
    spells: divineSpells,
  },
];

export const spellcastingClasses = ["Arcano", "Bardo", "Sacerdote", "Paladino", "Ranger"];

// Helper to determine if a class uses divine magic
export const isDivineCaster = (className: string): boolean =>
  ["Sacerdote", "Paladino", "Ranger"].includes(className);
