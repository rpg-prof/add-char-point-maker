#!/usr/bin/env node
/**
 * Migra grupos de armas de weaponProficiencies.ts para JSON + catálogo de itens.
 * Preserva weapons/daggers.json e items/daggers.json (ou items/weapons.json legado).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getEnglishWeaponCode } from "./weapon-codes.mjs";
import {
  GROUP_SLUGS,
  serializeWeaponGroup,
  serializeWeaponItems,
} from "./weapon-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WEAPONS_DIR = path.join(ROOT, "src/data/weapons");
const ITEMS_DIR = path.join(ROOT, "src/data/items");
const SOURCE =
  process.env.WEAPON_SOURCE ??
  path.join(ROOT, "src/data/weaponProficiencies.ts");
const INDEX_PATH = path.join(WEAPONS_DIR, "weapons-index.json");

function parseWeaponGroupsFromTs(content) {
  const anchor = content.indexOf("export const weaponGroups:");
  if (anchor === -1) throw new Error("weaponGroups not found");

  const arrayStart = content.indexOf("= [", anchor);
  if (arrayStart === -1) throw new Error("weaponGroups array start not found");

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

  const arrayLiteral = content.slice(bracketStart, arrayEnd + 1);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${arrayLiteral});`)();
}

function loadExistingCodes(slug) {
  const weaponPath = path.join(WEAPONS_DIR, `${slug}.json`);
  if (!fs.existsSync(weaponPath)) return new Map();

  const data = JSON.parse(fs.readFileSync(weaponPath, "utf8"));
  const map = new Map();
  for (const w of data.weapons ?? []) {
    map.set(w.name, w.code);
  }
  return map;
}

function assignCodes(group, slug, usedCodes) {
  const existing = loadExistingCodes(slug);

  return group.weapons.map((weapon) => {
    let code = existing.get(weapon.name);
    if (!code) {
      code = getEnglishWeaponCode(weapon.name, usedCodes);
    } else {
      usedCodes.add(code);
    }
    return { ...weapon, code };
  });
}

function loadLegacyItems(slug) {
  const candidates = [
    path.join(ITEMS_DIR, `${slug}.json`),
    slug === "daggers" ? path.join(ITEMS_DIR, "weapons.json") : null,
  ].filter(Boolean);

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const items = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(items)) continue;
    const map = new Map();
    for (const item of items) {
      map.set(item.code, item);
    }
    return map;
  }
  return new Map();
}

function main() {
  const content = fs.readFileSync(SOURCE, "utf8");
  const groups = parseWeaponGroupsFromTs(content);

  fs.mkdirSync(WEAPONS_DIR, { recursive: true });
  fs.mkdirSync(ITEMS_DIR, { recursive: true });

  const usedCodes = new Set();
  const indexGroups = [];

  for (const group of groups) {
    const slug = GROUP_SLUGS[group.name];
    if (!slug) {
      throw new Error(`Slug não definido para grupo: ${group.name}`);
    }

    const weaponsWithCodes = assignCodes(group, slug, usedCodes);
    const weaponPath = path.join(WEAPONS_DIR, `${slug}.json`);
    const itemPath = path.join(ITEMS_DIR, `${slug}.json`);
    const legacyItems = loadLegacyItems(slug);

    if (slug === "daggers" && fs.existsSync(weaponPath)) {
      console.log(`Preservando ${weaponPath}`);
    } else {
      fs.writeFileSync(
        weaponPath,
        `${JSON.stringify(serializeWeaponGroup(group, weaponsWithCodes), null, 4)}\n`,
      );
      console.log(`Escrito ${weaponPath}`);
    }

    const items = weaponsWithCodes.map((w) => {
      const legacy = legacyItems.get(w.code);
      return {
        code: w.code,
        name: w.name,
        weight: legacy?.weight ?? w.weight,
        cost: legacy?.cost ?? w.price,
      };
    });

    fs.writeFileSync(
      itemPath,
      `${JSON.stringify(serializeWeaponItems(items.map((i) => ({ ...i, price: i.cost }))), null, 4)}\n`,
    );
    console.log(`Escrito ${itemPath}`);

    indexGroups.push({ slug, name: group.name });
  }

  fs.writeFileSync(
    INDEX_PATH,
    `${JSON.stringify({ groups: indexGroups }, null, 2)}\n`,
  );
  console.log(`Escrito ${INDEX_PATH}`);

  const legacyWeaponsJson = path.join(ITEMS_DIR, "weapons.json");
  if (fs.existsSync(legacyWeaponsJson)) {
    fs.unlinkSync(legacyWeaponsJson);
    console.log(`Removido legado ${legacyWeaponsJson} (substituído por items/daggers.json)`);
  }

  console.log(`\nMigrados ${groups.length} grupos de armas.`);
}

main();
