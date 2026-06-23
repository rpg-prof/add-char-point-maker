#!/usr/bin/env node
/** Atualiza o campo code em weapons/*.json e items/*.json para nomes em inglês. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEnglishWeaponCode } from "./weapon-codes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WEAPONS_DIR = path.join(ROOT, "src/data/weapons");
const ITEMS_DIR = path.join(ROOT, "src/data/items");

function updateWeaponGroup(filePath, usedCodes) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const codeMap = new Map();

  for (const weapon of data.weapons) {
    const newCode = getEnglishWeaponCode(weapon.name, usedCodes);
    codeMap.set(weapon.code, newCode);
    weapon.code = newCode;
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 4)}\n`);
  return codeMap;
}

function updateItems(filePath, codeMap) {
  if (!fs.existsSync(filePath)) return;
  const items = JSON.parse(fs.readFileSync(filePath, "utf8"));
  for (const item of items) {
    const newCode = codeMap.get(item.code);
    if (!newCode) {
      throw new Error(`Código legado não mapeado em ${filePath}: ${item.code}`);
    }
    item.code = newCode;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(items, null, 4)}\n`);
}

function main() {
  const usedCodes = new Set();
  const files = fs
    .readdirSync(WEAPONS_DIR)
    .filter((f) => f.endsWith(".json") && f !== "weapons-index.json")
    .sort();

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const weaponPath = path.join(WEAPONS_DIR, file);
    const itemPath = path.join(ITEMS_DIR, `${slug}.json`);
    const codeMap = updateWeaponGroup(weaponPath, usedCodes);
    updateItems(itemPath, codeMap);
    console.log(`Atualizado ${slug} (${codeMap.size} armas)`);
  }

  console.log(`\nTotal: ${usedCodes.size} códigos em inglês.`);
}

main();
