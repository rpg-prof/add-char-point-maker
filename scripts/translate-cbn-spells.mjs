#!/usr/bin/env node
/**
 * Traduz descrições (e metadados em inglês) das magias do Complete Book of Necromancers
 * via Google Translate (pt-BR).
 *
 * Uso:
 *   node scripts/translate-cbn-spells.mjs           # traduz todas
 *   node scripts/translate-cbn-spells.mjs --dry-run # só lista o que seria traduzido
 *   node scripts/translate-cbn-spells.mjs --fix-grammar  # só corrige pt sem retraduzir
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import translate from "google-translate-api-x";
import { SOURCE_CBN } from "./cbn-spell-translations.mjs";
import {
  formatSpellDescription,
  serializeSpellJson,
} from "./spell-metadata-utils.mjs";
import { readSpellPair, writeSpellPair } from "./spell-io.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SPELLS_ROOT = path.join(ROOT, "src/data/spell");
const SKIP = new Set(["mage-spells.json", "cleric-spells.json"]);

const DRY_RUN = process.argv.includes("--dry-run");
const FIX_GRAMMAR = process.argv.includes("--fix-grammar");
const ONLY = (() => {
  const arg = process.argv.find((a) => a.startsWith("--only="));
  if (!arg) return null;
  return new Set(
    arg
      .slice("--only=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
})();

const ENGLISH_HINT =
  /\b(the|this spell|caster|wizard|cleric|creature|per level|within the|allows the|can be|material component|area of effect|undead|spellcaster|animated zombie|demihuman|humanoid|turn left|walk forward)\b|^[A-Za-z][a-z]{1,12}\.$/i;

const META_FIELDS = ["area", "duration", "range", "savingThrow"];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function walkJsonFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkJsonFiles(fp));
    else if (entry.name.endsWith(".json") && !SKIP.has(entry.name)) files.push(fp);
  }
  return files;
}

function needsTranslation(text) {
  if (!text?.trim()) return false;
  return ENGLISH_HINT.test(text);
}

function mergeBrokenParagraphs(parts) {
  const merged = [];
  for (const part of parts) {
    const t = part.trim();
    if (!t) continue;
    const prev = merged[merged.length - 1];
    const continuesPrev =
      prev &&
      !/[.!?:]$/.test(prev) &&
      (/^[a-z(]/.test(t) || /^(um|uma|o|a|os|as)\s/i.test(t));
    if (continuesPrev) merged[merged.length - 1] = `${prev} ${t}`;
    else merged.push(t);
  }
  return merged;
}

function normalizeParagraphs(text) {
  const parts = text.split(/\n\n+/).map((p) => p.replace(/\s*\n\s*/g, " ").trim());
  const merged = mergeBrokenParagraphs(parts);
  const cleaned = [];
  for (const part of merged) {
    if (!part) continue;
    const isOrphan =
      part.length < 30 &&
      /^[A-Za-z][A-Za-z.' -]{0,24}\.?$/.test(part) &&
      !/[áàâãéêíóôõúç]/i.test(part);
    if (isOrphan && cleaned.length) cleaned[cleaned.length - 1] += ` ${part}`;
    else cleaned.push(part);
  }
  return cleaned.join("\n\n");
}

function splitDescription(desc) {
  const m = desc.match(/^([\s\S]*?Descrição\s*\n\n)([\s\S]*)$/i);
  if (m) return { prefix: m[1], body: m[2] };
  return { prefix: "", body: desc };
}

function protectTokens(text) {
  const tokens = [];
  let out = text.replace(/\b(\d+d\d+(?:\+\d+)?)\b/gi, (match) => {
    const key = `__DICE_${tokens.length}__`;
    tokens.push({ key, value: match });
    return key;
  });
  out = out.replace(/\b(V,\s*S(?:,\s*M)?|V,\s*G(?:,\s*M)?)\b/g, (match) => {
    const key = `__COMP_${tokens.length}__`;
    tokens.push({ key, value: match });
    return key;
  });
  return { text: out, tokens };
}

function restoreTokens(text, tokens) {
  let out = text;
  for (const { key, value } of tokens) {
    out = out.replaceAll(key, value);
  }
  return out;
}

function fixPtGrammar(text) {
  return text
    .replace(/\b[Ee]ste magia\b/g, "Esta magia")
    .replace(/\b[Oo] magia\b/g, "A magia")
    .replace(/\b[Aa] magia\b/g, "a magia")
    .replace(/\bpelo magia\b/gi, "pela magia")
    .replace(/\bdurante o magia\b/gi, "durante a magia")
    .replace(/\bduração do magia\b/gi, "duração da magia")
    .replace(/\balvo do magia\b/gi, "alvo da magia")
    .replace(/\benquanto o magia\b/gi, "enquanto a magia")
    .replace(/\bSe o magia\b/g, "Se a magia")
    .replace(/\brecém-nascido\b/gi, "recém animado")
    .replace(/\bligados\)\s+órgãos/g, "órgãos não vinculados")
    .replace(/\bfor lançado\b/gi, "for lançada")
    .replace(/\bnão pode ser empregado\b/gi, "não pode ser empregada");
}

function postProcessPt(text) {
  return fixPtGrammar(
    text
      .replace(/\bHP\b/g, "PV")
      .replace(/\bhp\b/g, "PV")
      .replace(/\blançador(es)?\b/gi, (_, pl) => (pl ? "conjuradores" : "conjurador"))
      .replace(/\bbruxos?\b/gi, (m) =>
        m[0] === "B" ? "Magos" : m.endsWith("s") ? "magos" : "mago",
      )
      .replace(/\bfeiticeiro(s)?\b/gi, (_, pl) => (pl ? "magos" : "mago"))
      .replace(/\bfeitiço(s)?\b/gi, (_, pl) => (pl ? "magias" : "magia")),
  );
}

async function translateChunk(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await translate(text, {
        from: "en",
        to: "pt",
        autoCorrect: true,
      });
      return postProcessPt(res.text);
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1500 * attempt);
    }
  }
}

async function translateText(text) {
  const paragraphs = normalizeParagraphs(text).split(/\n\n+/).filter((p) => p.trim());
  const translated = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!needsTranslation(trimmed)) {
      translated.push(trimmed);
      continue;
    }

    const { text: protectedText, tokens } = protectTokens(trimmed);
    let result = await translateChunk(protectedText);
    result = restoreTokens(result, tokens);
    translated.push(result);
    await sleep(350);
  }

  return translated.join("\n\n");
}

async function translateDescription(desc) {
  const { prefix, body } = splitDescription(desc);
  if (!body.trim()) return desc;
  if (!needsTranslation(body)) return desc;

  const translatedBody = await translateText(body);
  const formatted = formatSpellDescription(
    prefix ? `${prefix}${translatedBody}` : translatedBody,
  );
  return formatted.startsWith("Descrição") ? formatted : `Descrição\n\n${formatted}`;
}

async function translateMetaValue(value) {
  if (!value || !needsTranslation(value)) return value;
  const { text: protectedText, tokens } = protectTokens(value);
  let result = await translateChunk(protectedText);
  result = restoreTokens(result, tokens);
  await sleep(350);
  return result;
}

function listCbnSpells() {
  return walkJsonFiles(SPELLS_ROOT).filter((fp) => {
    if (ONLY && !ONLY.has(path.basename(fp, ".json"))) return false;
    const spell = readSpellPair(fp);
    return spell.source === SOURCE_CBN;
  });
}

async function main() {
  const files = listCbnSpells();
  console.log(`Magias CBN encontradas: ${files.length}${DRY_RUN ? " (dry-run)" : ""}`);

  let updated = 0;
  let skipped = 0;

  for (const fp of files) {
    const spell = readSpellPair(fp);
    const descNeeds = needsTranslation(spell.description ?? "");
    const metaNeeds = META_FIELDS.some((f) => needsTranslation(spell[f] ?? ""));

    if (!FIX_GRAMMAR && !descNeeds && !metaNeeds) {
      skipped++;
      continue;
    }

    if (!FIX_GRAMMAR) {
      console.log(`  ${spell.name}${descNeeds ? " [desc]" : ""}${metaNeeds ? " [meta]" : ""}`);
    } else {
      console.log(`  ${spell.name} [grammar]`);
    }

    if (DRY_RUN) continue;

    const next = { ...spell };
    if (FIX_GRAMMAR) {
      next.description = fixPtGrammar(spell.description ?? "");
      for (const field of META_FIELDS) {
        if (spell[field]) next[field] = fixPtGrammar(spell[field]);
      }
    } else {
      if (descNeeds) {
        next.description = await translateDescription(spell.description);
      }
      for (const field of META_FIELDS) {
        if (needsTranslation(spell[field] ?? "")) {
          next[field] = await translateMetaValue(spell[field]);
        }
      }
    }

    if (JSON.stringify(next) === JSON.stringify(spell)) {
      skipped++;
      continue;
    }

    writeSpellPair(fp, next);
    updated++;
  }

  console.log(`\nTraduzidas: ${updated}`);
  console.log(`Já em português: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
