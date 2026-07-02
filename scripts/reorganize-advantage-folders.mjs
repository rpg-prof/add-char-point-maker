#!/usr/bin/env node
/**
 * Reorganiza vantagens por raça/classe de race-class/ para pastas por tipo.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADV_DIR = path.join(__dirname, "../src/data/advantages");
const INDEX_PATH = path.join(ADV_DIR, "advantages-index.json");
const LEGACY_DIR = path.join(ADV_DIR, "race-class");

/** Categoria interna (JSON) → pasta no disco */
const CATEGORY_TO_FOLDER = {
  ofensivo: "ofensive",
  defensivo: "defensive",
  resistencia: "others",
  magica: "magic",
  outros: "others",
  aversao: "aversions",
  poder: "powers",
  antecedente: "background",
};

const FOLDERS = [
  "general",
  "ofensive",
  "defensive",
  "magic",
  "powers",
  "aversions",
  "others",
  "background",
];

function movePair(baseName, fromDir, toDir) {
  for (const ext of [".json", ".md"]) {
    const from = path.join(fromDir, `${baseName}${ext}`);
    const to = path.join(toDir, `${baseName}${ext}`);
    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    }
  }
}

function main() {
  if (!fs.existsSync(LEGACY_DIR)) {
    console.error("Pasta race-class/ não encontrada — já reorganizado?");
    process.exit(1);
  }

  const legacyIndex = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const raceClassIndex = legacyIndex["race-class"];
  if (!raceClassIndex) {
    console.error("Índice race-class não encontrado");
    process.exit(1);
  }

  for (const folder of FOLDERS) {
    if (folder === "general") continue;
    fs.mkdirSync(path.join(ADV_DIR, folder), { recursive: true });
  }

  const newIndex = {
    general: legacyIndex.general,
    ofensive: [],
    defensive: [],
    magic: [],
    powers: [],
    aversions: [],
    others: [],
    background: [],
  };

  for (const [category, entries] of Object.entries(raceClassIndex)) {
    const folder = CATEGORY_TO_FOLDER[category];
    if (!folder) {
      console.warn(`Categoria desconhecida: ${category}`);
      continue;
    }

    const targetDir = path.join(ADV_DIR, folder);

    for (const entry of entries) {
      const baseName = entry.file.replace(/\.json$/, "");
      movePair(baseName, LEGACY_DIR, targetDir);
      newIndex[folder].push({ name: entry.name, file: entry.file, category });
    }
  }

  for (const folder of Object.keys(newIndex)) {
    if (folder === "general") continue;
    newIndex[folder].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(newIndex, null, 4) + "\n");

  const remaining = fs.readdirSync(LEGACY_DIR);
  if (remaining.length === 0) {
    fs.rmdirSync(LEGACY_DIR);
  } else {
    console.warn(`Aviso: ${remaining.length} arquivo(s) restantes em race-class/`);
  }

  console.log("Reorganização concluída:");
  for (const folder of FOLDERS) {
    if (folder === "general") {
      const g = newIndex.general;
      console.log(
        `  general: ${g.advantages.length} vantagens, ${g.disadvantages.length} desvantagens`,
      );
    } else {
      console.log(`  ${folder}: ${newIndex[folder].length}`);
    }
  }
}

main();
