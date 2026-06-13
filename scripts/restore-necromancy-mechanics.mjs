#!/usr/bin/env node
/**
 * Restaura texto mecânico (dados, PV, resistências) de magias clássicas
 * cujo grimório narrativo substituiu a descrição original do livro de regras.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { serializeSpellJson } from "./spell-metadata-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SPELLS_DIR = path.join(ROOT, "src/data/spell/mage-spells");
const SOURCE_COMMIT = "ff4dc9c";

const MECH = /\d+d\d+|pontos de (vida|dano|força)|teste de resistência|jogada de ataque|penalidade/i;

/** Magias clássicas cujo grimório narrativo substituiu a mecânica do livro de regras. */
const TARGET_FILES = new Set([
  "cegueira.json",
  "dedo-da-morte.json",
  "mao-espectral.json",
  "praga.json",
  "surdez.json",
  "toque-do-carnical.json",
  "toque-macabro.json",
  "toque-vampirico.json",
]);

/** Metadados do commit original quando o HTML inferiu valores incorretos. */
const METADATA_OVERRIDES = {
  "toque-macabro.json": {
    range: "Toque",
    duration: "3 rodadas + 1 rodada/nível",
    area: "1 criatura",
    savingThrow: "Sim",
  },
  "toque-vampirico.json": {
    range: "Toque",
    duration: "Um toque",
    area: "O mago",
    savingThrow: "Não",
  },
  "toque-do-carnical.json": {
    range: "Toque",
    duration: "1 rodada/nível",
    area: "1 criatura",
    savingThrow: "Sim",
  },
  "mao-espectral.json": {
    range: "30 + 5 metros/nível",
    duration: "2 rodadas/nível",
    area: "1 oponente",
    savingThrow: "Não",
  },
};

function gitSpell(file) {
  try {
    const raw = execSync(`git show ${SOURCE_COMMIT}:src/data/spell/mage-spells/${file}`, {
      encoding: "utf8",
      cwd: ROOT,
    });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeDescription(mechanics, flavor) {
  if (/Mecânica de jogo/i.test(flavor)) return flavor;
  const mech = mechanics.replace(/^(Efeito|Descrição)\s*\n+/i, "").trim();
  return `${flavor.trim()}\n\nMecânica de jogo\n\n${mech}`;
}

function needsMechanics(text) {
  return !MECH.test(text || "");
}

let updated = 0;

for (const file of fs.readdirSync(SPELLS_DIR).filter((f) => f.endsWith(".json") && TARGET_FILES.has(f))) {
  const fp = path.join(SPELLS_DIR, file);
  const current = JSON.parse(fs.readFileSync(fp, "utf8"));
  const old = gitSpell(file);
  if (!old?.description?.trim()) continue;
  if (!needsMechanics(current.description)) continue;
  if (!MECH.test(old.description)) continue;

  const merged = {
    ...current,
    description: mergeDescription(old.description, current.description),
    ...(METADATA_OVERRIDES[file] ?? {}),
  };

  fs.writeFileSync(fp, JSON.stringify(serializeSpellJson(merged), null, 4) + "\n");
  console.log(`  + ${merged.name} (${file})`);
  updated++;
}

console.log(`\nMecânica restaurada em ${updated} magias.`);
