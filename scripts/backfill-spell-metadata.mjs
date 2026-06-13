#!/usr/bin/env node
/**
 * Preenche metadados de magias de mago a partir do grimório HTML
 * e, quando necessário, por inferência a partir da descrição.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  parseGrimoireMetadataByKey,
  inferMetadata,
  mergeMetadata,
  countMissingMeta,
  isEmptyMeta,
} from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "data/spells/magias-necromanticas.html");
const SPELLS_DIR = path.join(ROOT, "src/data/spell/mage-spells");

const html = fs.readFileSync(HTML_PATH, "utf8");
const grimoireMeta = parseGrimoireMetadataByKey(html);

let updated = 0;
let fromHtml = 0;
let inferred = 0;

for (const file of fs.readdirSync(SPELLS_DIR).filter((f) => f.endsWith(".json"))) {
  const fp = path.join(SPELLS_DIR, file);
  const spell = JSON.parse(fs.readFileSync(fp, "utf8"));
  const beforeMissing = countMissingMeta(spell);

  const htmlMeta = grimoireMeta.get(`${spell.name}::${spell.level}`) ?? null;
  const shouldInfer =
    spell.school === "Necromancia" ||
    spell.school?.includes("Necromancia") ||
    htmlMeta !== null;
  const inferredMeta =
    shouldInfer && beforeMissing > 0 ? inferMetadata(spell) : null;

  const merged = mergeMetadata(spell, htmlMeta, inferredMeta);
  const afterMissing = countMissingMeta(merged);

  if (afterMissing === beforeMissing) continue;

  const ordered = {
    name: merged.name,
    level: merged.level,
    school: merged.school,
    ...(merged.sphere ? { sphere: merged.sphere } : {}),
    ...(merged.castingTime ? { castingTime: merged.castingTime } : {}),
    ...(merged.duration ? { duration: merged.duration } : {}),
    ...(merged.range ? { range: merged.range } : {}),
    ...(merged.components ? { components: merged.components } : {}),
    ...(merged.area ? { area: merged.area } : {}),
    ...(merged.savingThrow ? { savingThrow: merged.savingThrow } : {}),
    description: merged.description,
  };

  fs.writeFileSync(fp, JSON.stringify(ordered, null, 4) + "\n");
  updated++;
  if (htmlMeta) fromHtml++;
  if (inferredMeta && afterMissing < beforeMissing) inferred++;
}

console.log(`Atualizados ${updated} arquivos.`);
console.log(`  Com dados do HTML: ${fromHtml}`);
console.log(`  Com inferência: ${inferred}`);
