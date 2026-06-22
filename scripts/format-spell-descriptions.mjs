#!/usr/bin/env node
/** Formata descrições de magias em arquivos .md (parágrafos, listas, remoção de metadados duplicados). */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import {
  formatSpellDescription,
  isAlreadyFormatted,
} from "./spell-metadata-utils.mjs";
import { readSpellPair, writeSpellPair } from "./spell-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DIRS = [
  { dir: path.join(ROOT, "src/data/spell/mage-spells"), git: "mage-spells" },
  { dir: path.join(ROOT, "src/data/spell/cleric-spells"), git: "cleric-spells" },
];

function gitDescription(gitSubdir, file) {
  try {
    const raw = execSync(`git show HEAD:src/data/spell/${gitSubdir}/${file}`, {
      encoding: "utf8",
      cwd: ROOT,
    });
    const parsed = JSON.parse(raw);
    return parsed.description?.trim() || "";
  } catch {
    try {
      const mdFile = file.replace(/\.json$/, ".md");
      return execSync(`git show HEAD:src/data/spell/${gitSubdir}/${mdFile}`, {
        encoding: "utf8",
        cwd: ROOT,
      }).trim();
    } catch {
      return "";
    }
  }
}

let updated = 0;

for (const { dir, git } of DIRS) {
  const label = path.basename(path.dirname(dir)) + "/" + path.basename(dir);
  let dirCount = 0;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const fp = path.join(dir, file);
    const spell = readSpellPair(fp);
    if (!spell.description?.trim()) continue;
    if (isAlreadyFormatted(spell.description)) continue;

    const fromGit = gitDescription(git, file);
    const source =
      fromGit && !isAlreadyFormatted(fromGit) ? fromGit : spell.description.trim();

    const formatted = formatSpellDescription(source);
    if (formatted === spell.description.trim()) continue;

    writeSpellPair(fp, { ...spell, description: formatted });
    updated++;
    dirCount++;
  }

  console.log(`${label}: ${dirCount} descrições formatadas`);
}

console.log(`\nTotal: ${updated} magias atualizadas.`);
