#!/usr/bin/env node
/**
 * Padroniza descrições: Descrição (narrativa) antes de Mecânica de jogo.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SPELLS_ROOT = path.join(ROOT, "src/data/spell");

const SKIP = new Set(["mage-spells.json", "cleric-spells.json"]);

function walkJsonFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(fp));
    else if (entry.name.endsWith(".json") && !SKIP.has(entry.name)) files.push(fp);
  }
  return files;
}

export function reorderDescription(text) {
  if (!text?.includes("Mecânica de jogo")) return text;

  const descSplit = text.match(/\n\nDescrição\s*\n/);
  if (!descSplit) return text;

  const descIdx = text.search(/\n\nDescrição\s*\n/);
  const mechIdx = text.search(/^Mecânica de jogo\s*\n/m);
  if (mechIdx !== 0 || descIdx <= 0) return text;

  const mechanics = text.slice(0, descIdx).trim();
  const flavor = text.slice(descIdx + 1).trim();
  return `${flavor}\n\n${mechanics}`;
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  let updated = 0;
  for (const fp of walkJsonFiles(SPELLS_ROOT)) {
    const spell = JSON.parse(fs.readFileSync(fp, "utf8"));
    if (!spell.description) continue;
    const reordered = reorderDescription(spell.description);
    if (reordered === spell.description) continue;
    spell.description = reordered;
    fs.writeFileSync(fp, JSON.stringify(spell, null, 4) + "\n");
    console.log(`  ~ ${spell.name} (${path.relative(SPELLS_ROOT, fp)})`);
    updated++;
  }
  console.log(`\n${updated} magia(s) reordenada(s).`);
}
