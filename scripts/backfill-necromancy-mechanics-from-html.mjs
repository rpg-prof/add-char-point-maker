#!/usr/bin/env node
/**
 * Mescla mecânicas de data/magias-necromanticas-mecanicas.html nas magias existentes
 * (mantém texto narrativo do grimório) e adiciona magias ofensivas novas.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseSpellsFromHtml, slugify, normalize } from "./import-necromancy-spells.mjs";
import {
  parseField,
  stripHtml,
  parseDescription,
  serializeSpellJson,
} from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "data/magias-necromanticas-mecanicas.html");
const INDEX_PATH = path.join(ROOT, "src/data/spellls/mage-spells.json");
const SPELLS_DIR = path.join(ROOT, "src/data/spellls/mage-spells");

const NAME_ALIASES = {
  "roubar memoria": "Roubo de Memória",
};

const SKIP_TITLE =
  /^(Novas Magias|Magias Ofensivas|Volume|AD&amp;D)/i;

function parseMechanicsSpells(html) {
  const spells = [];
  const re =
    /<(h1|h2) class="western">([^<]+)<\/\1>([\s\S]*?)(?=<(?:h1|h2) class="western">|<hr\/>|$)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = stripHtml(m[2]);
    const body = m[3];
    if (SKIP_TITLE.test(title)) continue;
    if (!/<strong>\s*Escola:\s*<\/strong>\s*Necromancia/i.test(body)) continue;

    const level = parseInt(parseField(body, "Nível"), 10);
    if (!level) continue;

    const description = parseDescription(body);
    if (!description) continue;

    const name = NAME_ALIASES[normalize(title)] ?? title;
    spells.push({
      name,
      level,
      school: "Necromancia",
      range: parseField(body, "Alcance") || parseField(body, "Alcance ") || "—",
      duration: parseField(body, "Duração") || "—",
      castingTime: parseField(body, "Tempo de Execução") || String(level),
      components: parseField(body, "Componentes") || undefined,
      area:
        parseField(body, "Área de Efeito") ||
        parseField(body, "Área") ||
        undefined,
      savingThrow: parseField(body, "Resistência à Magia") || undefined,
      description,
    });
  }
  return spells;
}

function dedupeByName(spells) {
  const byName = new Map();
  for (const spell of spells) {
    const key = normalize(spell.name);
    if (!byName.has(key)) byName.set(key, spell);
  }
  return [...byName.values()];
}

function isEmptyMeta(value) {
  return value === undefined || value === null || value === "" || value === "—";
}

function mergeMetadata(current, fromHtml) {
  const out = { ...current };
  for (const field of [
    "range",
    "duration",
    "castingTime",
    "components",
    "area",
    "savingThrow",
  ]) {
    const htmlVal = fromHtml[field];
    if (!isEmptyMeta(htmlVal)) out[field] = htmlVal;
  }
  return out;
}

function stripFlavorHeader(text) {
  return text.replace(/^Descrição\s*\n+/i, "").trim();
}

function mergeDescription(mechanics, flavor) {
  if (/Mecânica de jogo/i.test(flavor)) return flavor;
  const body = stripFlavorHeader(flavor);
  const mech = mechanics.replace(/^(Efeito|Descrição)\s*\n+/i, "").trim();
  if (body.startsWith("Descrição\n") || /^Descrição\s*\n/i.test(flavor)) {
    return `Mecânica de jogo\n\n${mech}\n\n${flavor.trim()}`;
  }
  return `Mecânica de jogo\n\n${mech}\n\nDescrição\n\n${body}`;
}

function loadIndex() {
  return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
}

function saveIndex(index) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 4) + "\n");
}

function removeFromIndex(index, name, file) {
  for (const list of Object.values(index["by-level"])) {
    const i = list.findIndex((e) => e.name === name || e.file === file);
    if (i >= 0) list.splice(i, 1);
  }
  for (const list of Object.values(index["by-school"])) {
    const i = list.findIndex((e) => e.name === name || e.file === file);
    if (i >= 0) list.splice(i, 1);
  }
}

function addToIndex(index, spell, file) {
  removeFromIndex(index, spell.name, file);
  const entry = {
    name: spell.name,
    file,
    level: spell.level,
    school: spell.school,
  };
  const levelKey = String(spell.level);
  if (!index["by-level"][levelKey]) index["by-level"][levelKey] = [];
  index["by-level"][levelKey].push(entry);
  index["by-level"][levelKey].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );

  const schoolKey = spell.school;
  if (!index["by-school"][schoolKey]) index["by-school"][schoolKey] = [];
  index["by-school"][schoolKey].push(entry);
  index["by-school"][schoolKey].sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR"),
  );
}

function findJsonByName(name) {
  for (const file of fs.readdirSync(SPELLS_DIR).filter((f) => f.endsWith(".json"))) {
    const spell = JSON.parse(fs.readFileSync(path.join(SPELLS_DIR, file), "utf8"));
    if (normalize(spell.name) === normalize(name)) {
      return { file, spell, path: path.join(SPELLS_DIR, file) };
    }
  }
  return null;
}

// --- main ---
const html = fs.readFileSync(HTML_PATH, "utf8");
const parsed = dedupeByName(parseMechanicsSpells(html));
const index = loadIndex();

const updated = [];
const added = [];
const skipped = [];

for (const fromHtml of parsed) {
  const hit = findJsonByName(fromHtml.name);

  if (hit) {
    const oldLevel = hit.spell.level;
    const merged = mergeMetadata(hit.spell, fromHtml);
    merged.description = mergeDescription(fromHtml.description, hit.spell.description);

    fs.writeFileSync(
      hit.path,
      JSON.stringify(serializeSpellJson(merged), null, 4) + "\n",
    );

    const fileRef = `mage-spells/${hit.file}`;
    addToIndex(index, { ...merged, level: oldLevel }, fileRef);
    updated.push(merged.name);
    continue;
  }

  const slug = slugify(fromHtml.name);
  let filename = `${slug}.json`;
  let filePath = path.join(SPELLS_DIR, filename);
  if (fs.existsSync(filePath)) {
    skipped.push(`${fromHtml.name}: slug ${slug}.json já existe com outro nome`);
    continue;
  }

  const json = {
    ...fromHtml,
    description: fromHtml.description.replace(/^(Efeito|Descrição)\s*\n+/i, "Mecânica de jogo\n\n"),
  };
  if (!json.description.startsWith("Mecânica de jogo")) {
    json.description = `Mecânica de jogo\n\n${json.description}`;
  }

  fs.writeFileSync(filePath, JSON.stringify(serializeSpellJson(json), null, 4) + "\n");
  addToIndex(index, json, `mage-spells/${filename}`);
  added.push(fromHtml.name);
}

saveIndex(index);

console.log(`Magias no HTML (únicas): ${parsed.length}`);
console.log(`\nAtualizadas (${updated.length}):`);
for (const n of updated.sort()) console.log(`  ~ ${n}`);
if (added.length) {
  console.log(`\nAdicionadas (${added.length}):`);
  for (const n of added.sort()) console.log(`  + ${n}`);
}
if (skipped.length) {
  console.log("\nIgnoradas:");
  for (const n of skipped) console.log(`  ? ${n}`);
}
