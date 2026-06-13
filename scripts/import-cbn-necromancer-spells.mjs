#!/usr/bin/env node
/**
 * Importa magias de data/magias-*-necromancer-en.md (Complete Book of Necromancers).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  CBN_ARCANE_NAMES,
  CBN_DIVINE_NAMES,
  SOURCE_CBN,
} from "./cbn-spell-translations.mjs";
import { serializeSpellJson, slugify } from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const SKIP_NAMES =
  /^(Table \d+|New Priest Spells|Special undead|Both versions|Individuals of)/i;

const SCHOOL_MAP = {
  Necromancy: "Necromancia",
  Alteration: "Alteração",
  Evocation: "Evocação",
  Divination: "Adivinhação",
  Abjuration: "Abjuração",
  Summoning: "Convocação",
  Thought: "Pensamento",
};

const SPHERE_MAP = {
  Necromantic: "Necromântica",
  Divination: "Adivinhação",
  Summoning: "Convocação",
  Thought: "Pensamento",
};

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function translateSchool(raw) {
  return raw
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => SCHOOL_MAP[s] ?? s)
    .join("/");
}

function translateSphere(raw) {
  return raw
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => SPHERE_MAP[s] ?? s)
    .join(", ");
}

function convertUnits(value) {
  if (!value) return value;
  return value
    .replace(/\b(\d+)\s*feet\b/gi, (_, n) => `${Math.round(Number(n) * 0.3)} metros`)
    .replace(/\b(\d+)\s*'\b/g, (_, n) => `${Math.round(Number(n) * 0.3)} metros`)
    .replace(/\b(\d+)\s*yards?\b/gi, (_, n) => `${Math.round(Number(n) * 0.9)} metros`)
    .replace(/\b(\d+)\s*"\b/g, (_, n) => `${Math.round(Number(n) * 0.3)} metros`)
    .replace(/\b1 turn\b/gi, "1 turno")
    .replace(/\b(\d+)\s*turns?\b/gi, (_, n) => `${n} turno${n === "1" ? "" : "s"}`)
    .replace(/\b1 round\b/gi, "1 rodada")
    .replace(/\b(\d+)\s*rounds?\b/gi, (_, n) => `${n} rodada${n === "1" ? "" : "s"}`)
    .replace(/\bInstantaneous\b/gi, "Instantânea")
    .replace(/\bPermanent\b/gi, "Permanente")
    .replace(/\bSpecial\b/gi, "Especial")
    .replace(/\bPersonal\b/gi, "Pessoal")
    .replace(/\bNone\b/g, "Não")
    .replace(/\bNeg\.?\b/gi, "Neg.")
    .replace(/\b1\/2\b/g, "½")
    .replace(/\b(\d+)\s*\/\s*level\b/gi, (_, n) => `${n}/nível`)
    .replace(/\bper level\b/gi, "por nível")
    .replace(/\bcaster level\b/gi, "nível do conjurador")
    .replace(/\blevel\b/gi, "nível")
    .replace(/\bChange\b/gi, "Especial")
    .trim();
}

function parseMeta(headerTail) {
  const meta = {};
  const sphereM = headerTail.match(
    /Sphere:\s*([\s\S]*?)(?=Range:|Components:|Duration:|Casting Time:|Area|$)/i,
  );
  if (sphereM) meta.sphere = translateSphere(sphereM[1].trim());

  const rangeM = headerTail.match(
    /Range:\s*([\s\S]*?)(?=Components:|Duration:|Casting Time:|Area|$)/i,
  );
  if (rangeM) meta.range = convertUnits(rangeM[1].trim());

  const compM = headerTail.match(
    /Components:\s*([\s\S]*?)(?=Duration:|Casting Time:|Area|$)/i,
  );
  if (compM) meta.components = compM[1].trim();

  const durM = headerTail.match(
    /Duration:\s*([\s\S]*?)(?=Casting Time:|Area|$)/i,
  );
  if (durM) meta.duration = convertUnits(durM[1].trim());

  const timeM = headerTail.match(
    /Casting(?:\s|T)ime:\s*([\s\S]*?)(?=Area|$)/i,
  );
  if (timeM) meta.castingTime = convertUnits(timeM[1].trim());

  const areaM = headerTail.match(
    /Area(?:\s+of\s+Effect)?:\s*([\s\S]*?)(?=Saving Throw:|$)/i,
  );
  if (areaM) meta.area = convertUnits(areaM[1].trim().replace(/^Caster$/i, "O conjurador"));

  const saveM = headerTail.match(/Saving Throw:\s*(\S+)/i);
  if (saveM) {
    const raw = saveM[1].trim();
    meta.savingThrow = raw === "None" ? "Não" : raw;
  }

  return meta;
}

function splitHeaderAndBody(chunk) {
  const saveMatch = chunk.match(/Saving Throw:\s*[^\n]+/i);
  if (saveMatch) {
    const headerEnd = saveMatch.index + saveMatch[0].length;
    return {
      header: chunk.slice(0, headerEnd),
      body: chunk.slice(headerEnd).replace(/^\s+/, ""),
    };
  }
  const split = chunk.indexOf("\n\n");
  if (split >= 0) {
    return { header: chunk.slice(0, split), body: chunk.slice(split + 2) };
  }
  return { header: chunk, body: "" };
}

function cleanBody(body) {
  let text = body
    .replace(/^(?:Range:|Sphere:)[\s\S]*?Saving Throw:\s*[^\n]+\s*/i, "")
    .replace(/^Touch Components:[^\n]+\n+/i, "")
    .trim();

  const nextSpell = text.search(
    /\n\n[A-Z][A-Za-z' -]+\([A-Za-z]+(?:\/[A-Za-z]+)?\)\s*(?:Reversible\s*)?\n(?:Range:|Sphere:)/,
  );
  if (nextSpell >= 0) {
    text = text.slice(0, nextSpell).trim();
  }

  const inlineSpell = text.search(
    /\.\s+[A-Z][A-Za-z' -]+\([A-Za-z]+(?:\/[A-Za-z]+)?\)\s*(?:Reversible\s*)?(?:Range:|Sphere:)/,
  );
  if (inlineSpell >= 0) {
    text = text.slice(0, inlineSpell).trim();
  }

  text = text.replace(/\n#{1,6}\s*$/g, "").trim();

  return text;
}

function formatDescription(body) {
  body = cleanBody(body);
  const text = body
    .replace(/^—From[^\n]+\n+/m, "")
    .replace(/^---\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n•/g, "\n\n•")
    .trim();
  return `Descrição\n\n${text}`;
}

function preprocessInlineSpells(text) {
  return text.replace(
    /\.\s+([A-Z][A-Za-z' -]{2,}?\s*\((?:Necromancy|Evocation|Alteration|Abjuration|Divination|Summoning)[^)]*\)\s*(?:Reversible\s*)?(?:Range:|Sphere:))/g,
    ".\n\n$1",
  );
}

function findSpellStarts(text) {
  const processed = preprocessInlineSpells(text);
  const starts = [];
  const re =
    /(?:^|\n)(?:####\s+)?(?:\d+(?:st|nd|rd|th)-Leve[lI]?\s*Spells\s+)?([A-Z][A-Za-z' -]{2,}?)\s*\(([^)]+)\)\s*(?:Reversible\s*)?(?:Range:|Sphere:)/gm;
  let m;
  while ((m = re.exec(processed)) !== null) {
    const name = m[1].trim();
    if (SKIP_NAMES.test(name)) continue;
    if (/Level Spells$/i.test(name)) continue;
    starts.push({
      index: m.index + (m[0].startsWith("\n") ? 1 : 0),
      name,
      schools: m[2].trim(),
      headerStart: m.index + m[0].indexOf(name),
    });
  }
  return { processed, starts };
}

function parseLevelSections(text) {
  const sections = [];
  const re = /(\d+)(?:st|nd|rd|th)-Leve[lI]?\s*Spells/gi;
  let m;
  const hits = [];
  while ((m = re.exec(text)) !== null) {
    hits.push({ level: parseInt(m[1], 10), index: m.index });
  }
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index;
    const end = hits[i + 1]?.index ?? text.length;
    sections.push({ level: hits[i].level, text: text.slice(start, end) });
  }
  return sections;
}

function parseMarkdownFile(filePath, type) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r/g, "");
  const nameMap = type === "arcane" ? CBN_ARCANE_NAMES : CBN_DIVINE_NAMES;
  const spells = [];

  for (const section of parseLevelSections(raw)) {
    const { processed, starts } = findSpellStarts(section.text);
    for (let i = 0; i < starts.length; i++) {
      const start = starts[i];
      const end = starts[i + 1]?.index ?? processed.length;
      const chunk = processed.slice(start.index, end);

      const { header, body } = splitHeaderAndBody(chunk);
      const meta = parseMeta(header);

      const ptName = nameMap[start.name] ?? start.name;
      const school = translateSchool(start.schools.replace(/\/.*/, "").split(",")[0].trim());
      const fullSchool = translateSchool(start.schools);

      spells.push({
        originalName: start.name,
        name: ptName,
        level: section.level,
        school: fullSchool.includes("/") ? fullSchool : school,
        type,
        ...meta,
        description: formatDescription(body),
        source: SOURCE_CBN,
      });
    }
  }
  return spells;
}

function loadIndex(indexPath) {
  return JSON.parse(fs.readFileSync(indexPath, "utf8"));
}

function saveIndex(indexPath, index) {
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 4) + "\n");
}

function addToIndex(index, spell, file, isCleric) {
  const entry = {
    name: spell.name,
    file,
    level: spell.level,
    school: spell.school,
    ...(spell.sphere ? { sphere: spell.sphere } : {}),
  };
  const lk = String(spell.level);
  if (!index["by-level"][lk]) index["by-level"][lk] = [];
  const exists = index["by-level"][lk].some((e) => e.file === file || e.name === spell.name);
  if (!exists) {
    index["by-level"][lk].push(entry);
    index["by-level"][lk].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  const schoolKey = isCleric ? "by-sphere" : "by-school";

  if (isCleric) {
    for (const sphereKey of (spell.sphere ?? spell.school).split(",").map((s) => s.trim())) {
      if (!index[schoolKey][sphereKey]) index[schoolKey][sphereKey] = [];
      if (!index[schoolKey][sphereKey].some((e) => e.name === spell.name)) {
        index[schoolKey][sphereKey].push(entry);
        index[schoolKey][sphereKey].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR"),
        );
      }
    }
  } else {
    const sk = spell.school;
    if (!index[schoolKey][sk]) index[schoolKey][sk] = [];
    if (!index[schoolKey][sk].some((e) => e.name === spell.name)) {
      index[schoolKey][sk].push(entry);
      index[schoolKey][sk].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    }
  }
}

function findExistingByName(spellsDir, name) {
  if (!fs.existsSync(spellsDir)) return null;
  for (const file of fs.readdirSync(spellsDir).filter((f) => f.endsWith(".json"))) {
    const spell = JSON.parse(fs.readFileSync(path.join(spellsDir, file), "utf8"));
    if (normalize(spell.name) === normalize(name)) {
      return { file, spell, path: path.join(spellsDir, file) };
    }
  }
  return null;
}

function importSpells(spells, config) {
  const { spellsDir, indexPath, filePrefix, isCleric } = config;
  const index = loadIndex(indexPath);
  const added = [];
  const updated = [];
  const skipped = [];

  for (const spell of spells) {
    const slug = slugify(spell.name);
    let filename = `${slug}.json`;
    let filePath = path.join(spellsDir, filename);
    const fileRef = `${filePrefix}/${filename}`;

    const existing = findExistingByName(spellsDir, spell.name);
    const json = serializeSpellJson({
      name: spell.name,
      level: spell.level,
      school: spell.school,
      ...(spell.sphere ? { sphere: spell.sphere } : {}),
      castingTime: spell.castingTime || String(spell.level),
      duration: spell.duration || "Especial",
      range: spell.range || "—",
      ...(spell.components ? { components: spell.components } : {}),
      ...(spell.area ? { area: spell.area } : {}),
      ...(spell.savingThrow ? { savingThrow: spell.savingThrow } : {}),
      description: spell.description,
      source: spell.source,
    });

    if (existing) {
      const merged = {
        ...JSON.parse(fs.readFileSync(existing.path, "utf8")),
        ...json,
        source: spell.source,
      };
      fs.writeFileSync(existing.path, JSON.stringify(serializeSpellJson(merged), null, 4) + "\n");
      addToIndex(index, merged, `${filePrefix}/${existing.file}`, isCleric);
      updated.push(spell.name);
      continue;
    }

    if (fs.existsSync(filePath)) {
      filename = `${slug}-${spell.level}.json`;
      filePath = path.join(spellsDir, filename);
      if (fs.existsSync(filePath)) {
        skipped.push(`${spell.name}: slug ocupado`);
        continue;
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(json, null, 4) + "\n");
    addToIndex(index, spell, `${filePrefix}/${filename}`, isCleric);
    added.push(spell.name);
  }

  saveIndex(indexPath, index);
  return { added, updated, skipped };
}

export { parseMarkdownFile, importSpells };

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const arcane = parseMarkdownFile(
    path.join(ROOT, "data/spells/magias-arcanas-necromancer-en.md"),
    "arcane",
  );
  const divine = parseMarkdownFile(
    path.join(ROOT, "data/spells/magias-divinas-necromancer-en.md"),
    "divine",
  );

  console.log("Parseadas:", arcane.length, "arcanas,", divine.length, "divinas");
  for (const s of [...arcane, ...divine]) {
    console.log(`  nv${s.level} ${s.name} (${s.originalName})`);
  }

  const arcaneResult = importSpells(arcane, {
    spellsDir: path.join(ROOT, "src/data/spell/mage-spells"),
    indexPath: path.join(ROOT, "src/data/spell/mage-spells.json"),
    filePrefix: "mage-spells",
    isCleric: false,
  });
  const divineResult = importSpells(divine, {
    spellsDir: path.join(ROOT, "src/data/spell/cleric-spells"),
    indexPath: path.join(ROOT, "src/data/spell/cleric-spells.json"),
    filePrefix: "cleric-spells",
    isCleric: true,
  });

  for (const [label, r] of [
    ["Arcanas", arcaneResult],
    ["Divinas", divineResult],
  ]) {
    console.log(`\n=== ${label} ===`);
    if (r.added.length) console.log("Adicionadas:", r.added.join(", "));
    if (r.updated.length) console.log("Atualizadas:", r.updated.join(", "));
    if (r.skipped.length) console.log("Ignoradas:", r.skipped.join(", "));
  }
}
