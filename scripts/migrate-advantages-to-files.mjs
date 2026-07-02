#!/usr/bin/env node
/**
 * Migra vantagens/desvantagens de characterData.ts e raceClassAdvantages.ts
 * para arquivos individuais JSON + MD em src/data/advantages/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeAdvantagePair } from "./advantage-io.mjs";
import { slugify } from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ADV_DIR = path.join(ROOT, "src/data/advantages");
const INDEX_PATH = path.join(ADV_DIR, "advantages-index.json");
const CHARACTER_DATA = path.join(ROOT, "src/data/characterData.ts");
const RACE_CLASS_DATA = path.join(ROOT, "src/data/raceClassAdvantages.ts");

const RACE_CLASS_CATEGORIES = [
  "ofensivo",
  "defensivo",
  "resistencia",
  "magica",
  "outros",
  "aversao",
  "poder",
  "antecedente",
];

const CATEGORY_TO_FOLDER = {
  ofensivo: "ofensive",
  defensivo: "defensive",
  resistencia: "others",
  magica: "magic",
  outros: "others",
  aversao: "aversions",
  poder: "powers",
  antecedente: "background",
};

/** Poderes podem ser pagos com pontos de progressão; custos especiais por classe. */
const PROGRESS_CLASS_OVERRIDES = {
  "Poder da Fé: Afugentar": { Paladino: 30 },
};

function extractArrayLiteral(source, exportName) {
  const marker = `export const ${exportName}`;
  const idx = source.indexOf(marker);
  if (idx === -1) throw new Error(`${exportName} not found`);

  const eqIdx = source.indexOf("=", idx);
  if (eqIdx === -1) throw new Error(`${exportName} assignment not found`);

  const bracketStart = source.indexOf("[", eqIdx);
  if (bracketStart === -1) throw new Error(`${exportName} array start not found`);

  let depth = 0;
  let bracketEnd = -1;
  for (let i = bracketStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        bracketEnd = i;
        break;
      }
    }
  }
  if (bracketEnd === -1) throw new Error(`${exportName} array end not found`);

  let literal = source.slice(bracketStart, bracketEnd + 1);
  literal = literal.replace(/,(\s*[}\]])/g, "$1");
  // eslint-disable-next-line no-eval
  return eval(literal);
}

function buildProgressPointsCost(item) {
  if (item.category !== "poder" || item.type !== "advantage") return undefined;

  const byClass = PROGRESS_CLASS_OVERRIDES[item.name];
  if (item.costOthers != null) {
    return {
      native: item.cost,
      others: item.costOthers,
      ...(byClass ? { byClass } : {}),
    };
  }
  if (byClass) {
    return { native: item.cost, byClass };
  }
  return item.cost;
}

function stripUndefined(obj) {
  const out = { ...obj };
  for (const key of Object.keys(out)) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

function writeEntry(dir, slug, meta, description, usedSlugs) {
  let finalSlug = slug;
  if (usedSlugs.has(finalSlug)) finalSlug = `${slug}-${String(meta.cost ?? "x")}`;
  usedSlugs.add(finalSlug);

  const jsonPath = path.join(dir, `${finalSlug}.json`);
  writeAdvantagePair(jsonPath, { ...meta, description });
  return `${finalSlug}.json`;
}

function main() {
  const characterData = fs.readFileSync(CHARACTER_DATA, "utf8");
  const raceClassData = fs.readFileSync(RACE_CLASS_DATA, "utf8");

  const generalAdvantages = extractArrayLiteral(characterData, "generalAdvantages");
  const generalDisadvantages = extractArrayLiteral(characterData, "generalDisadvantages");
  const raceClassAdvantages = extractArrayLiteral(raceClassData, "raceClassAdvantages");

  fs.mkdirSync(path.join(ADV_DIR, "general"), { recursive: true });
  for (const folder of new Set(Object.values(CATEGORY_TO_FOLDER))) {
    fs.mkdirSync(path.join(ADV_DIR, folder), { recursive: true });
  }

  const index = {
    general: { advantages: [], disadvantages: [] },
    ofensive: [],
    defensive: [],
    magic: [],
    powers: [],
    aversions: [],
    others: [],
    background: [],
  };

  const usedSlugs = new Set();

  for (const item of generalAdvantages) {
    const meta = stripUndefined({
      name: item.name,
      cost: item.cost,
      type: item.type,
      severity: item.severity,
      link: item.link,
    });
    const file = writeEntry(
      path.join(ADV_DIR, "general"),
      slugify(item.name),
      meta,
      item.description ?? "",
      usedSlugs,
    );
    index.general.advantages.push({ name: item.name, file });
  }

  for (const item of generalDisadvantages) {
    const meta = stripUndefined({
      name: item.name,
      cost: item.cost,
      type: item.type,
      severity: item.severity,
      link: item.link,
    });
    const file = writeEntry(
      path.join(ADV_DIR, "general"),
      slugify(item.name),
      meta,
      item.description ?? "",
      usedSlugs,
    );
    index.general.disadvantages.push({ name: item.name, file });
  }

  for (const item of raceClassAdvantages) {
    const progressPointsCost = buildProgressPointsCost(item);
    const meta = stripUndefined({
      name: item.name,
      category: item.category,
      applicableRaces: item.applicableRaces,
      applicableClasses: item.applicableClasses,
      cost: item.cost,
      costOthers: item.costOthers,
      type: item.type,
      maxPurchases: item.maxPurchases,
      link: item.link,
      progressPointsCost,
    });
    const folder = CATEGORY_TO_FOLDER[item.category];
    const file = writeEntry(
      path.join(ADV_DIR, folder),
      slugify(item.name),
      meta,
      item.description ?? "",
      usedSlugs,
    );
    index[folder].push({ name: item.name, file, category: item.category });
  }

  for (const list of [
    ...Object.values(index.general),
    ...Object.values(index).filter((v) => Array.isArray(v)),
  ]) {
    if (Array.isArray(list)) {
      list.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 4) + "\n");

  const folderTotals = Object.entries(index)
    .filter(([key]) => key !== "general")
    .reduce((n, [, arr]) => n + arr.length, 0);

  const total =
    index.general.advantages.length + index.general.disadvantages.length + folderTotals;

  console.log(`Migradas ${total} vantagens/desvantagens para ${ADV_DIR}`);
  console.log(`  Gerais (vantagens): ${index.general.advantages.length}`);
  console.log(`  Gerais (desvantagens): ${index.general.disadvantages.length}`);
  for (const cat of RACE_CLASS_CATEGORIES) {
    const folder = CATEGORY_TO_FOLDER[cat];
    console.log(`  ${folder} (${cat}): ${index[folder].filter((e) => e.category === cat).length}`);
  }
}

main();
