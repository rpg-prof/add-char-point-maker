#!/usr/bin/env node
/** Migra description dos JSONs para arquivos .md irmãos. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { migrateJsonDescriptionToMd } from "./spell-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DIRS = [
  path.join(ROOT, "src/data/spell/mage-spells"),
  path.join(ROOT, "src/data/spell/cleric-spells"),
];

let migrated = 0;
let skipped = 0;
let empty = 0;

for (const dir of DIRS) {
  const label = path.basename(dir);
  let dirMigrated = 0;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const result = migrateJsonDescriptionToMd(path.join(dir, file));
    if (result.migrated) {
      migrated++;
      dirMigrated++;
    } else if (result.reason === "empty") {
      empty++;
    } else {
      skipped++;
    }
  }

  console.log(`${label}: ${dirMigrated} migradas`);
}

console.log(`\nTotal: ${migrated} descrições migradas para .md`);
console.log(`  Sem descrição: ${empty}`);
console.log(`  Já tinham .md: ${skipped}`);
