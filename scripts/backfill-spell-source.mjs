#!/usr/bin/env node
/**
 * Preenche o campo `source` em todas as magias com base em data/spells/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  buildSpellSourceMap,
  isSpellInSourceMap,
  resolveSpellSource,
  SOURCE_CBN,
  SOURCE_GRIMOIRE,
  SOURCE_LDJ,
  SOURCE_MANUAL,
  SOURCE_OPCOES,
  SOURCE_TOME,
} from "./spell-source-registry.mjs";
import { serializeSpellJson } from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SKIP = new Set(["mage-spells.json", "cleric-spells.json"]);

const SOURCE_KEYS = {
  [SOURCE_LDJ]: "ldj",
  [SOURCE_TOME]: "tome",
  [SOURCE_MANUAL]: "manual",
  [SOURCE_CBN]: "cbn",
  [SOURCE_OPCOES]: "opcoes",
  [SOURCE_GRIMOIRE]: "grimorio",
};

function walkJsonFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(fp));
    else if (entry.name.endsWith(".json") && !SKIP.has(entry.name)) files.push(fp);
  }
  return files;
}

const sourceMap = buildSpellSourceMap();
const spellsRoot = path.join(ROOT, "src/data/spell");

let updated = 0;
const counts = { ldj: 0, tome: 0, manual: 0, cbn: 0, opcoes: 0, grimorio: 0, skipped: 0 };
const unmatched = [];

for (const fp of walkJsonFiles(spellsRoot)) {
  const spell = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!spell.name) continue;

  const source = resolveSpellSource(spell.name, sourceMap);
  const inMap = isSpellInSourceMap(spell.name, sourceMap);

  if (spell.source === source) {
    counts.skipped++;
    if (!inMap && source === SOURCE_LDJ) unmatched.push(spell.name);
    continue;
  }

  spell.source = source;
  fs.writeFileSync(fp, JSON.stringify(serializeSpellJson(spell), null, 4) + "\n");
  updated++;
  counts[SOURCE_KEYS[source]]++;
  if (!inMap && source === SOURCE_LDJ) unmatched.push(spell.name);
}

console.log(`Entradas no mapa de fontes: ${sourceMap.size}`);
console.log(`Magias atualizadas: ${updated}`);
console.log(`  Livro do Jogador: ${counts.ldj}`);
console.log(`  Tome of Magic: ${counts.tome}`);
console.log(`  Manual Completo do Arcano: ${counts.manual}`);
console.log(`  Complete Book of Necromancers: ${counts.cbn}`);
console.log(`  Opções para Jogadores: ${counts.opcoes}`);
console.log(`  Grimório do Necromante: ${counts.grimorio}`);
console.log(`  Já corretas: ${counts.skipped}`);
if (unmatched.length) {
  const unique = [...new Set(unmatched)].sort((a, b) => a.localeCompare(b, "pt-BR"));
  console.log(`\nSem correspondência nas fontes (${unique.length}), atribuídas ao LDJ:`);
  for (const name of unique.slice(0, 40)) {
    console.log(`  - ${name}`);
  }
  if (unique.length > 40) console.log(`  ... e mais ${unique.length - 40}`);
}
