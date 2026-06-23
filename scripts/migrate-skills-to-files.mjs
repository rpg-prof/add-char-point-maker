#!/usr/bin/env node
/**
 * Migra perícias de characterData.ts para arquivos individuais JSON + MD.
 * Preserva .md existentes em src/data/skills/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { serializeSkillJson, writeSkillPair } from "./skill-io.mjs";
import { slugify } from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "src/data/skills");
const CHARACTER_DATA = path.join(ROOT, "src/data/characterData.ts");
const INDEX_PATH = path.join(SKILLS_DIR, "skills-index.json");

const GROUP_TO_COST_KEY = {
  Guerreiro: "guerreiro",
  "Ladrão/Bardo": "ladrao",
  Sacerdote: "sacerdote",
  Mago: "arcano",
};

const GROUP_ORDER = ["Geral", "Guerreiro", "Ladrão/Bardo", "Sacerdote", "Mago"];

function parseSkillsFromCharacterData(content) {
  const anchor = content.indexOf("export const skills:");
  if (anchor === -1) throw new Error("skills array not found");

  const arrayStart = content.indexOf("= [", anchor);
  if (arrayStart === -1) throw new Error("skills array start not found");

  const bracketStart = arrayStart + 2; // points to '['
  let depth = 0;
  let arrayEnd = -1;

  for (let i = bracketStart; i < content.length; i++) {
    if (content[i] === "[") depth++;
    else if (content[i] === "]") {
      depth--;
      if (depth === 0) {
        arrayEnd = i;
        break;
      }
    }
  }

  const block = content.slice(bracketStart + 1, arrayEnd);
  const skills = [];
  const entryRe =
    /\{\s*name:\s*"((?:\\.|[^"\\])*)"\s*,\s*cost:\s*(\d+)\s*,\s*attribute:\s*"((?:\\.|[^"\\])*)"\s*,\s*group:\s*"((?:\\.|[^"\\])*)"(?:\s*,\s*additionalGroups:\s*\[([^\]]*)\])?(?:\s*,\s*description:\s*"((?:\\.|[^"\\])*)")?\s*\}/g;

  let match;
  while ((match = entryRe.exec(block)) !== null) {
    const [, name, cost, attribute, group, additionalRaw, description] = match;
    const additionalGroups = additionalRaw
      ? [...additionalRaw.matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => m[1])
      : [];

    skills.push({
      name: name.replace(/\\"/g, '"'),
      cost: Number(cost),
      attribute,
      group,
      additionalGroups,
      description: (description ?? "").replace(/\\"/g, '"'),
    });
  }

  return skills;
}

function normalizeName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function loadUserOverrides() {
  const overrides = new Map();
  for (const file of ["common-skills.json", "specific-skills.json"]) {
    const fp = path.join(SKILLS_DIR, file);
    if (!fs.existsSync(fp)) continue;
    const raw = fs.readFileSync(fp, "utf8").trim();
    if (!raw) continue;
    let entries;
    try {
      entries = JSON.parse(raw);
    } catch {
      console.warn(`Ignorando ${file}: JSON inválido`);
      continue;
    }
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      overrides.set(normalizeName(entry.name), entry);
    }
  }
  return overrides;
}

function toCostByClass(skill) {
  if (skill.group === "Geral") return { all: skill.cost };

  const costByClass = { other: skill.cost * 2 };
  const primaryKey = GROUP_TO_COST_KEY[skill.group];
  if (primaryKey) costByClass[primaryKey] = skill.cost;

  for (const ag of skill.additionalGroups) {
    const key = GROUP_TO_COST_KEY[ag];
    if (key) costByClass[key] = skill.cost;
  }

  return costByClass;
}

function toGroups(skill) {
  if (skill.group === "Geral") return ["Geral"];
  return [skill.group, ...skill.additionalGroups];
}

function buildMetadata(legacy, override) {
  if (override) {
    const { description: _desc, ...meta } = override;
    return {
      ...meta,
      name: legacy.name,
      groups:
        override.groups?.map((g) => {
          const map = {
            geral: "Geral",
            guerreiro: "Guerreiro",
            ladrao: "Ladrão/Bardo",
            sacerdote: "Sacerdote",
            arcano: "Mago",
          };
          return map[g.toLowerCase()] ?? g;
        }) ?? toGroups(legacy),
    };
  }

  return {
    name: legacy.name,
    costByClass: toCostByClass(legacy),
    attribute: legacy.attribute,
    groups: toGroups(legacy),
    penaltyNoProficiency: -6,
  };
}

function main() {
  const content = fs.readFileSync(CHARACTER_DATA, "utf8");
  const legacySkills = parseSkillsFromCharacterData(content);
  const overrides = loadUserOverrides();

  if (!legacySkills.length) {
    console.error("Nenhuma perícia encontrada em characterData.ts");
    process.exit(1);
  }

  fs.mkdirSync(SKILLS_DIR, { recursive: true });

  const index = { "by-group": {} };
  for (const g of GROUP_ORDER) index["by-group"][g] = [];

  const usedSlugs = new Set();

  for (const legacy of legacySkills) {
    const override = overrides.get(normalizeName(legacy.name));
    let slug = slugify(legacy.name);
    if (usedSlugs.has(slug)) slug = `${slug}-${legacy.cost}`;
    usedSlugs.add(slug);

    const jsonPath = path.join(SKILLS_DIR, `${slug}.json`);
    const mdPath = path.join(SKILLS_DIR, `${slug}.md`);

    const meta = buildMetadata(legacy, override);
    const description = fs.existsSync(mdPath)
      ? fs.readFileSync(mdPath, "utf8")
      : legacy.description?.trim()
        ? `${legacy.description.trim()}\n`
        : "";

    writeSkillPair(jsonPath, { ...meta, description });

    const primaryGroup = meta.groups[0];
    if (!index["by-group"][primaryGroup]) index["by-group"][primaryGroup] = [];
    index["by-group"][primaryGroup].push({
      name: meta.name,
      file: `${slug}.json`,
      attribute: meta.attribute,
      groups: meta.groups,
    });
  }

  for (const g of Object.keys(index["by-group"])) {
    index["by-group"][g].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 4) + "\n");

  for (const file of ["common-skills.json", "specific-skills.json"]) {
    const fp = path.join(SKILLS_DIR, file);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  console.log(`Migradas ${legacySkills.length} perícias para ${SKILLS_DIR}`);
  for (const g of GROUP_ORDER) {
    console.log(`  ${g}: ${index["by-group"][g]?.length ?? 0}`);
  }
}

main();
