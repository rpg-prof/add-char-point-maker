import mageSpellIndex from "./spellls/mage-spells.json";
import clericSpellIndex from "./spellls/cleric-spells.json";

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
  description: string;
}

export interface SpellList {
  type: "arcane" | "divine";
  label: string;
  classes: string[];
  spells: Spell[];
}

// Eagerly import all individual mage spell JSON files
const mageSpellFiles = import.meta.glob<{
  name: string;
  level: number;
  school: string;
  castingTime: string;
  duration: string;
  range: string;
  area?: string;
  components?: string;
  description: string;
}>("./spellls/mage-spells/*.json", { eager: true });

// Eagerly import all individual cleric spell JSON files
const clericSpellFiles = import.meta.glob<{
  name: string;
  level: number;
  school: string;
  sphere?: string;
  castingTime: string;
  duration: string;
  range: string;
  area?: string;
  components?: string;
  description: string;
}>("./spellls/cleric-spells/*.json", { eager: true });

// Generic loader from index + detail files
function loadSpells(
  index: Record<string, Array<{ name: string; file: string; level: number; school: string; sphere?: string }>>,
  detailFiles: Record<string, any>,
  pathPrefix: string
): Spell[] {
  const spells: Spell[] = [];

  for (const [, entries] of Object.entries(index)) {
    for (const entry of entries) {
      const filePath = `./spellls/${entry.file}`;
      const detail = detailFiles[filePath];
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
          description: detail.description || "",
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

export const arcaneSpells: Spell[] = loadSpells(mageIndex, mageSpellFiles, "mage-spells");
export const divineSpells: Spell[] = loadSpells(clericIndex, clericSpellFiles, "cleric-spells");

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
