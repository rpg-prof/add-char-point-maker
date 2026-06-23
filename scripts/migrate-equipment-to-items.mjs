#!/usr/bin/env node
/**
 * Extrai itens não-armas de equipmentCatalog.ts para src/data/items/*.json
 * e gera items-index.json + legacy-id-migration.json.
 *
 * Armas de proficiência ficam nos arquivos por grupo (daggers.json, etc.).
 * Munição e itens extras de armas vão para ammunition.json.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEnglishItemCode } from "./equipment-item-codes.mjs";
import {
  CATALOG_TAB_FILES,
  serializeCatalogItem,
  formatCostString,
  formatWeightString,
} from "./catalog-item-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ITEMS_DIR = path.join(ROOT, "src/data/items");
const WEAPONS_INDEX = path.join(ROOT, "src/data/weapons/weapons-index.json");
const CATALOG_PATH = path.join(ROOT, "src/data/equipmentCatalog.ts");
const INDEX_PATH = path.join(ITEMS_DIR, "items-index.json");
const LEGACY_PATH = path.join(ITEMS_DIR, "legacy-id-migration.json");

function parseCatalog(content) {
  const anchor = content.indexOf("export const equipmentCatalog");
  const arrayStart = content.indexOf("= [", anchor);
  const bracketStart = arrayStart + 2;
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
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${content.slice(bracketStart, arrayEnd + 1)});`)();
}

function loadWeaponCodeByName() {
  const map = new Map();
  const weaponsDir = path.join(ROOT, "src/data/weapons");
  const itemsDir = ITEMS_DIR;
  for (const file of fs.readdirSync(weaponsDir)) {
    if (!file.endsWith(".json") || file === "weapons-index.json") continue;
    const slug = file.replace(/\.json$/, "");
    const group = JSON.parse(fs.readFileSync(path.join(weaponsDir, file), "utf8"));
    const itemsPath = path.join(itemsDir, `${slug}.json`);
    const items = fs.existsSync(itemsPath)
      ? JSON.parse(fs.readFileSync(itemsPath, "utf8"))
      : [];
    const codeByNameInItems = new Map(items.map((i) => [i.name, i.code]));
    for (const w of group.weapons ?? []) {
      map.set(w.name, codeByNameInItems.get(w.name) ?? w.code);
    }
  }
  return map;
}

function normalizeNameKey(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isProficiencyWeapon(item, weaponCodeByName) {
  if (item.tab !== "armas") return false;
  if (weaponCodeByName.has(item.name)) return true;
  // Nomes ligeiramente diferentes entre catálogo e JSON de proficiência
  const aliases = {
    glefe: "glefe (glaive)",
    "halberd longo": "halberd longo (alabarda)",
    naginata: "naginata (falchard)",
    "espada bastarda (com duas mãos)": "espada bastarda (duas mãos)",
    "espada bastarda (com uma mão)": "espada bastarda (uma mão)",
    "espada larga": "espada larga (broadsword)",
    "lança de haken": "lança de haken (bill)",
    "lança-machado": "lança-machado (bardiche)",
    "gato de nove caudas": "gato de nove caudas (scourge)",
    "maça de exercito / maça de infantaria": "maça de exército",
    "maça de guerra / maça de cavalaria": "maça de guerra",
    "maça estrela": "maça estrela (morningstar)",
  };
  const key = normalizeNameKey(item.name);
  for (const [from, to] of Object.entries(aliases)) {
    if (key === from && [...weaponCodeByName.keys()].some((n) => normalizeNameKey(n) === to)) {
      return true;
    }
  }
  return false;
}

function main() {
  const catalog = parseCatalog(fs.readFileSync(CATALOG_PATH, "utf8"));
  const weaponCodeByName = loadWeaponCodeByName();
  const weaponsIndex = JSON.parse(fs.readFileSync(WEAPONS_INDEX, "utf8"));

  fs.mkdirSync(ITEMS_DIR, { recursive: true });

  const usedCodes = new Set();
  const legacyMigration = {};
  const buckets = Object.fromEntries(
    Object.values(CATALOG_TAB_FILES).map((f) => [f, []]),
  );

  // Reservar códigos já usados pelas armas de proficiência
  for (const slug of weaponsIndex.groups.map((g) => g.slug)) {
    const itemPath = path.join(ITEMS_DIR, `${slug}.json`);
    if (!fs.existsSync(itemPath)) continue;
    for (const item of JSON.parse(fs.readFileSync(itemPath, "utf8"))) {
      usedCodes.add(item.code);
    }
  }

  for (const item of catalog) {
    if (item.tab === "armas" && isProficiencyWeapon(item, weaponCodeByName)) {
      legacyMigration[item.id] = weaponCodeByName.get(item.name) ?? item.id;
      continue;
    }

    const tab = item.tab === "armas" ? "armas" : item.tab;
    const fileName = CATALOG_TAB_FILES[tab];
    if (!fileName) {
      console.warn(`Tab ignorada: ${item.tab} (${item.name})`);
      continue;
    }

    const code = getEnglishItemCode(item.name, item.id, usedCodes);
    legacyMigration[item.id] = code;

    buckets[fileName].push(
      serializeCatalogItem({
        code,
        name: item.name,
        category: item.category,
        weight: formatWeightString(item.weightKg ?? 0),
        cost: formatCostString(item.pricePc ?? 0),
        armorClass: item.armorClass,
        description: item.description,
        weaponGroup: item.weaponGroup,
        weaponStats: item.weaponStats,
      }),
    );
  }

  for (const [fileName, items] of Object.entries(buckets)) {
    if (items.length === 0) {
      if (fs.existsSync(path.join(ITEMS_DIR, fileName))) {
        fs.unlinkSync(path.join(ITEMS_DIR, fileName));
      }
      continue;
    }
    items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const outPath = path.join(ITEMS_DIR, fileName);
    fs.writeFileSync(outPath, `${JSON.stringify(items, null, 4)}\n`);
    console.log(`Escrito ${outPath} (${items.length} itens)`);
  }

  const catalogFiles = Object.entries(CATALOG_TAB_FILES)
    .filter(([tab]) => tab !== "armas")
    .map(([tab, file]) => ({ tab, file }))
    .filter(({ file }) => buckets[file]?.length > 0);

  if (buckets["ammunition.json"]?.length) {
    catalogFiles.push({ tab: "armas", file: "ammunition.json" });
  }

  const itemsIndex = {
    weaponItemFiles: weaponsIndex.groups.map((g) => `${g.slug}.json`),
    catalogFiles,
  };

  fs.writeFileSync(INDEX_PATH, `${JSON.stringify(itemsIndex, null, 2)}\n`);
  console.log(`Escrito ${INDEX_PATH}`);

  fs.writeFileSync(
    LEGACY_PATH,
    `${JSON.stringify(legacyMigration, null, 2)}\n`,
  );
  console.log(`Escrito ${LEGACY_PATH} (${Object.keys(legacyMigration).length} entradas)`);
}

main();
