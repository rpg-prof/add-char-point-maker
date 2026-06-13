#!/usr/bin/env node
/** Atualiza descrições de magias a partir do grimório HTML (texto completo). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseGrimoireSpellsByKey } from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "data/spells/magias-necromanticas.html");
const SPELLS_DIR = path.join(ROOT, "src/data/spell/mage-spells");

const html = fs.readFileSync(HTML_PATH, "utf8");
const grimoire = parseGrimoireSpellsByKey(html);

let updated = 0;

for (const file of fs.readdirSync(SPELLS_DIR).filter((f) => f.endsWith(".json"))) {
  const fp = path.join(SPELLS_DIR, file);
  const spell = JSON.parse(fs.readFileSync(fp, "utf8"));
  const fromHtml = grimoire.get(`${spell.name}::${spell.level}`);
  if (!fromHtml) continue;

  const current = spell.description?.trim() ?? "";
  const next = fromHtml.description.trim();
  if (!next) continue;
  if (next === current) continue;
  // Atualiza se o HTML trouxer mais conteúdo ou formatação (seções, listas, exemplos).
  if (next.length < current.length && !current.startsWith("Descrição")) continue;

  const ordered = { ...spell, description: next };
  fs.writeFileSync(fp, JSON.stringify(ordered, null, 4) + "\n");
  updated++;
  console.log(
    `  ${spell.name} (nv${spell.level}): ${current.length} → ${next.length} chars`,
  );
}

console.log(`\nDescrições ampliadas em ${updated} magias.`);
