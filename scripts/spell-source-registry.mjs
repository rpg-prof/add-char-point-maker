/**
 * Registro de fontes de magias e extração de nomes a partir de data/spells/.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseSpellsFromHtml } from "./import-necromancy-spells.mjs";
import {
  CBN_ARCANE_NAMES,
  CBN_DIVINE_NAMES,
} from "./cbn-spell-translations.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SPELLS_DATA_DIR = path.join(__dirname, "..", "data", "spells");

export const SOURCE_LDJ = "Livro do Jogador (AD&D 2ª Ed.)";
export const SOURCE_TOME = "Tome of Magic (AD&D 2ª Ed.)";
export const SOURCE_MANUAL = "Manual Completo do Arcano (AD&D 2ª Ed.)";
export const SOURCE_CBN = "The Complete Book of Necromancers (AD&D 2ª Ed.)";
export const SOURCE_OPCOES =
  "Opções para Jogadores — Habilidades e Poderes (AD&D 2ª Ed.)";
export const SOURCE_GRIMOIRE = "Grimório do Necromante";

const SKIP_HEADING =
  /^(?:\d+|Magias|Apêndice|Mágicas|Novas Magias|Lista de|Componentes|Inteligência|Tempo entre|Magias do|Magias Extraídas)/i;

const SCHOOL_HINT =
  /(?:Adivinhação|Evocação|Alteração|Ilusão|Encantamento|Conjuração|Abjuração|Necromancia|Invocação|Ilusão\/Visão|Encantamento\/Feitiço|Conjuração\/Convocação|Todas as escolas|Várias escolas|Pensamento)/i;

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanName(name) {
  return name
    .replace(/\*+$/, "")
    .replace(/\s*\([^)]+\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function addNames(set, names) {
  for (const name of names) {
    const cleaned = cleanName(name);
    if (!cleaned || cleaned.length < 2) continue;
    if (SKIP_HEADING.test(cleaned)) continue;
    set.add(normalize(cleaned));
  }
}

/** ### Nome da Magia */
export function extractLdjNames(text) {
  const names = [];
  for (const m of text.matchAll(/^###\s+(.+?)\s*$/gm)) {
    names.push(m[1]);
  }
  return names;
}

/** ###, ##, # ou ##Nome */
export function extractMarkdownSpellTitles(text) {
  const names = [];
  for (const m of text.matchAll(/^#{1,3}\s*(.+?)\s*$/gm)) {
    names.push(m[1]);
  }
  return names;
}

/** @deprecated use extractMarkdownSpellTitles */
export function extractMarkdownH2Names(text) {
  return extractMarkdownSpellTitles(text);
}

/** Lista com traço e corpo "Nome (Escola)\nAlcance:" */
export function extractTomeNames(text) {
  const names = [];
  const listEnd = text.search(/\nMágicas do \d/i);
  const listPart = listEnd >= 0 ? text.slice(0, listEnd) : text;
  for (const m of listPart.matchAll(/^-\s+(.+?)\s*$/gm)) {
    names.push(m[1]);
  }
  for (const m of text.matchAll(
    /(?:^|\n)([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ][^\n(]{2,}?)\s*\([^)]+\)\s*\n\s*Alcance:/g,
  )) {
    names.push(m[1]);
  }
  return names;
}

/** Nome inline com OCR colado ou quebra de linha no meio do título */
export function extractManualInlineNames(text) {
  const names = [];
  const flat = text.replace(/\n(?=[a-záàâãéèêíïóôõöúüç])/g, " ");
  const re = new RegExp(
    `(?:^|[.\\n])\\d*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇ][A-Za-zÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜÇáàâãéèêíïóôõöúüç' -]{2,}?)\\s{1,2}\\([^)]*${SCHOOL_HINT.source}`,
    "gi",
  );
  for (const m of flat.matchAll(re)) {
    names.push(m[1]);
  }
  return names;
}

export function extractGrimorioNarrativeNames(html) {
  return parseSpellsFromHtml(html).map((s) => s.name);
}

export function extractGrimorioMecanicasNames(html) {
  const names = [];
  const skip = /Novas Magias|Necromancia para AD/i;
  for (const m of html.matchAll(/<h1 class="western">\s*([^<]+)<\/h1>/gi)) {
    const name = m[1].replace(/&amp;/g, "&").trim();
    if (skip.test(name)) continue;
    names.push(name);
  }
  return names;
}

export function extractCbnNames() {
  return [...Object.values(CBN_ARCANE_NAMES), ...Object.values(CBN_DIVINE_NAMES)];
}

/** Nomes alternativos no JSON que diferem das fontes */
const NAME_ALIASES = new Map([
  [
    normalize("Transformar Seixos em Rochas (Alteração) Reversível"),
    normalize("Transformar Seixos em Rochas"),
  ],
  [
    normalize("Santuário Particular de Mordenkainen"),
    normalize("Santuário Particular de Monderkainen"),
  ],
]);

function readFile(relPath) {
  return fs.readFileSync(path.join(SPELLS_DATA_DIR, relPath), "utf8");
}

/**
 * Mapa nome normalizado → fonte.
 * Fontes mais específicas sobrescrevem as genéricas.
 */
export function buildSpellSourceMap() {
  const map = new Map();

  function assign(source, names) {
    for (const name of names) {
      const cleaned = cleanName(name);
      if (!cleaned || cleaned.length < 2) continue;
      if (SKIP_HEADING.test(cleaned)) continue;
      const key = normalize(cleaned);
      if (key) map.set(key, source);
    }
  }

  // Menos específico primeiro; mais específico por último (sobrescreve).
  assign(SOURCE_LDJ, extractLdjNames(readFile("magias-arcanas-LDJ.md")));
  assign(SOURCE_LDJ, extractLdjNames(readFile("magias-divinas-LDJ.md")));
  assign(SOURCE_MANUAL, extractMarkdownSpellTitles(readFile("magias-manual-arcano.md")));
  assign(SOURCE_MANUAL, extractManualInlineNames(readFile("magias-manual-arcano.md")));
  assign(SOURCE_TOME, extractTomeNames(readFile("magias-tome.md")));
  assign(SOURCE_OPCOES, extractMarkdownSpellTitles(readFile("magias-opcoes-arcanas.md")));
  assign(SOURCE_OPCOES, extractMarkdownSpellTitles(readFile("magias-opcoes-divinas.md")));
  assign(SOURCE_CBN, extractCbnNames());
  assign(
    SOURCE_GRIMOIRE,
    extractGrimorioNarrativeNames(readFile("magias-necromanticas.html")),
  );
  assign(
    SOURCE_GRIMOIRE,
    extractGrimorioMecanicasNames(readFile("magias-necromanticas-mecanicas.html")),
  );

  return map;
}

export function resolveSpellSource(spellName, sourceMap) {
  const key = normalize(spellName);
  const alias = NAME_ALIASES.get(key);
  return sourceMap.get(key) ?? (alias ? sourceMap.get(alias) : undefined) ?? SOURCE_LDJ;
}

export function isSpellInSourceMap(spellName, sourceMap) {
  const key = normalize(spellName);
  if (sourceMap.has(key)) return true;
  const alias = NAME_ALIASES.get(key);
  return alias ? sourceMap.has(alias) : false;
}
