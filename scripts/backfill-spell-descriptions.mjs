#!/usr/bin/env node
/** Atualiza descrições de magias a partir do grimório HTML (texto completo). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseGrimoireSpellsByKey } from "./spell-metadata-utils.mjs";
import { readSpellPair, writeSpellPair } from "./spell-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "data/spells/magias-necromanticas.html");
const SPELLS_DIR = path.join(ROOT, "src/data/spell/mage-spells");

const html = fs.readFileSync(HTML_PATH, "utf8");
const grimoire = parseGrimoireSpellsByKey(html);

let updated = 0;

for (const file of fs.readdirSync(SPELLS_DIR).filter((f) => f.endsWith(".json"))) {
  const fp = path.join(SPELLS_DIR, file);
  const spell = readSpellPair(fp);
  const fromHtml = grimoire.get(`${spell.name}::${spell.level}`);
  if (!fromHtml) continue;

  const current = spell.description?.trim() ?? "";
  const next = fromHtml.description.trim();
  if (!next) continue;
  if (next === current) continue;
  if (next.length < current.length && !current.startsWith("Descrição")) continue;

  writeSpellPair(fp, { ...spell, description: next });
  updated++;
  console.log(
    `  ${spell.name} (nv${spell.level}): ${current.length} → ${next.length} chars`,
  );
}

console.log(`\nDescrições ampliadas em ${updated} magias.`);
