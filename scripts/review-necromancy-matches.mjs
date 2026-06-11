#!/usr/bin/env node
/**
 * Revisa matches do grimório contra a base PRÉ-importação (git HEAD).
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import {
  parseSpellsFromHtml,
  EN_TO_PT,
  jaccard,
  normalize,
} from "./import-necromancy-spells.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "data/magias-necromanticas.html");

function gitShow(file) {
  try {
    return execSync(`git show HEAD:${file}`, { encoding: "utf8", cwd: ROOT });
  } catch {
    return null;
  }
}

function loadPreImportSpells() {
  const raw = gitShow("src/data/spellls/mage-spells.json");
  if (!raw) throw new Error("Não foi possível ler mage-spells.json do HEAD");
  const index = JSON.parse(raw);
  const spells = [];
  for (const entries of Object.values(index["by-level"])) {
    for (const e of entries) {
      const gitPath = `src/data/spellls/${e.file}`;
      const detailRaw = gitShow(gitPath);
      const detail = detailRaw ? JSON.parse(detailRaw) : {};
      spells.push({
        name: detail.name || e.name,
        level: detail.level ?? e.level,
        school: detail.school || e.school,
        description: detail.description || "",
        file: e.file,
      });
    }
  }
  return spells;
}

function findMatch(spell, existing) {
  const byName = existing.find(
    (e) => normalize(e.name) === normalize(spell.name),
  );
  if (byName) return { match: byName, reason: "nome", score: 1 };

  const aliasKey = Object.entries(EN_TO_PT).find(
    ([en, pt]) =>
      normalize(spell.originalTitle) === normalize(en) &&
      normalize(spell.name) === normalize(pt),
  );
  if (aliasKey) {
    const alias = existing.find(
      (e) => normalize(e.name) === normalize(aliasKey[1]),
    );
    if (alias) return { match: alias, reason: "alias", score: 1 };
  }

  let best = null;
  let bestScore = 0;
  const scores = [];
  for (const e of existing) {
    if (!e.description?.trim()) continue;
    const score = jaccard(spell.description, e.description);
    scores.push({ e, score });
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  scores.sort((a, b) => b.score - a.score);

  if (best && bestScore >= 0.28) {
    return {
      match: best,
      reason: "descricao",
      score: bestScore,
      runnersUp: scores.slice(1, 4),
    };
  }
  return { match: null, runnersUp: scores.slice(0, 3) };
}

function verdict(spell, hit) {
  if (!hit.match) return { status: "NOVO", note: "Sem match na base antiga" };
  if (hit.reason === "nome" || hit.reason === "alias") {
    return { status: "OK", note: `Match por ${hit.reason}` };
  }

  const nameDiff = normalize(spell.name) !== normalize(hit.match.name);
  const levelDiff = spell.level !== hit.match.level;
  const low = hit.score < 0.4;
  const borderline = hit.score < 0.5;

  if (!nameDiff && !levelDiff) {
    return { status: "OK", note: `Mesmo nome/nível (${(hit.score * 100).toFixed(0)}%)` };
  }
  if (nameDiff && levelDiff && low) {
    return {
      status: "FALSO_POSITIVO",
      note: `Nomes e níveis diferentes com score baixo (${(hit.score * 100).toFixed(0)}%)`,
    };
  }
  if (nameDiff && borderline) {
    return {
      status: "DUVIDOSO",
      note: `Nomes diferentes, score ${(hit.score * 100).toFixed(0)}%`,
    };
  }
  if (levelDiff && borderline) {
    return {
      status: "DUVIDOSO",
      note: `Níveis diferentes (grimório nv${spell.level} vs base nv${hit.match.level}), score ${(hit.score * 100).toFixed(0)}%`,
    };
  }
  return {
    status: "OK",
    note: `Match por descrição (${(hit.score * 100).toFixed(0)}%)`,
  };
}

const PT_TO_EN = Object.fromEntries(
  Object.entries(EN_TO_PT).map(([en, pt]) => [normalize(pt), en]),
);

function restoreEnglishTitles(spells) {
  return spells.map((spell) => {
    const en =
      PT_TO_EN[normalize(spell.originalTitle)] ??
      Object.entries(EN_TO_PT).find(
        ([enKey]) => normalize(enKey) === normalize(spell.originalTitle),
      )?.[0];
    if (!en) return spell;
    return {
      ...spell,
      originalTitle: en,
      name: EN_TO_PT[en] ?? spell.name,
    };
  });
}

const existing = loadPreImportSpells();
const html = fs.readFileSync(HTML_PATH, "utf8");
const parsed = restoreEnglishTitles(parseSpellsFromHtml(html));

const results = [];
for (const spell of parsed) {
  const hit = findMatch(spell, existing);
  const v = verdict(spell, hit);
  results.push({ spell, hit, verdict: v });
}

const dubious = results.filter(
  (r) => r.verdict.status === "DUVIDOSO" || r.verdict.status === "FALSO_POSITIVO",
);
const descMatches = results.filter((r) => r.hit.reason === "descricao");
const novos = results.filter((r) => !r.hit.match);

console.log("Base pré-importação:", existing.length, "magias");
console.log("Grimório parseado:", parsed.length, "magias");
console.log("Matches por descrição:", descMatches.length);
console.log("Sem match (seriam novas):", novos.length);
console.log("Duvidosos/falsos positivos:", dubious.length);
console.log("");

if (descMatches.length) {
  console.log("=== MATCHES POR DESCRIÇÃO ===");
  for (const r of descMatches.sort((a, b) => a.hit.score - b.hit.score)) {
    const { spell, hit, verdict: v } = r;
    console.log(
      `[${v.status}] ${(hit.score * 100).toFixed(0)}% | "${spell.originalTitle}" (nv${spell.level}) → ${hit.match.name} (nv${hit.match.level}) | ${hit.match.file}`,
    );
    console.log(`       ${v.note}`);
    if (hit.runnersUp?.length) {
      const alt = hit.runnersUp
        .filter((x) => x.score >= 0.2)
        .map((x) => `${x.e.name} (${(x.score * 100).toFixed(0)}%)`)
        .join(", ");
      if (alt) console.log(`       Alternativas: ${alt}`);
    }
  }
  console.log("");
}

if (dubious.length) {
  console.log("=== CASOS A REVISAR ===");
  for (const r of dubious) {
    const { spell, hit, verdict: v } = r;
    console.log(`\n## ${spell.originalTitle} (nv${spell.level})`);
    console.log(`Veredito: ${v.status} — ${v.note}`);
    console.log(`Match: ${hit.match.name} (nv${hit.match.level})`);
    console.log(`Grimório: ${spell.description.slice(0, 200)}...`);
    console.log(`Base:     ${hit.match.description.slice(0, 200)}...`);
  }
}

// Pares conceituais: similaridade entre magias NOVAS (adicionadas) e base antiga
console.log("\n=== PARES CONCEITUAIS (novas vs base, score >= 25%) ===");
const newSpells = novos.map((r) => r.spell);
for (const spell of newSpells) {
  let best = null;
  let bestScore = 0;
  for (const e of existing) {
    if (!e.description?.trim()) continue;
    const score = jaccard(spell.description, e.description);
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  if (best && bestScore >= 0.25) {
    console.log(
      `${(bestScore * 100).toFixed(0)}% | ${spell.name} (nv${spell.level}) ~ ${best.name} (nv${best.level})`,
    );
  }
}
