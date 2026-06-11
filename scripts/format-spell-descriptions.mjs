#!/usr/bin/env node
/** Formata descrições de magias (parágrafos, listas, remoção de metadados duplicados). */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import {
  formatSpellDescription,
  isAlreadyFormatted,
  serializeSpellJson,
} from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DIRS = [
  { dir: path.join(ROOT, "src/data/spellls/mage-spells"), git: "mage-spells" },
  { dir: path.join(ROOT, "src/data/spellls/cleric-spells"), git: "cleric-spells" },
];

function gitDescription(gitSubdir, file) {
  try {
    const raw = execSync(`git show HEAD:src/data/spellls/${gitSubdir}/${file}`, {
      encoding: "utf8",
      cwd: ROOT,
    });
    return JSON.parse(raw).description?.trim() || "";
  } catch {
    return "";
  }
}

let updated = 0;

for (const { dir, git } of DIRS) {
  const label = path.basename(path.dirname(dir)) + "/" + path.basename(dir);
  let dirCount = 0;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const fp = path.join(dir, file);
    const spell = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (!spell.description?.trim()) continue;
    if (isAlreadyFormatted(spell.description)) continue;

    const fromGit = gitDescription(git, file);
    const source =
      fromGit && !isAlreadyFormatted(fromGit) ? fromGit : spell.description.trim();

    const formatted = formatSpellDescription(source);
    if (formatted === spell.description.trim()) continue;

    spell.description = formatted;
    fs.writeFileSync(fp, JSON.stringify(serializeSpellJson(spell), null, 4) + "\n");
    updated++;
    dirCount++;
  }

  console.log(`${label}: ${dirCount} descrições formatadas`);
}

console.log(`\nTotal: ${updated} magias atualizadas.`);
