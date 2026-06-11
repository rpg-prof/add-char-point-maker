#!/usr/bin/env node
/**
 * Importa magias de data/magias-necromanticas.html:
 * - Traduz títulos em inglês no HTML
 * - Compara com a base existente (nome + similaridade de descrição)
 * - Adiciona magias novas em src/data/spellls/mage-spells/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HTML_PATH = path.join(ROOT, "data/magias-necromanticas.html");
const INDEX_PATH = path.join(ROOT, "src/data/spellls/mage-spells.json");
const SPELLS_DIR = path.join(ROOT, "src/data/spellls/mage-spells");

const EN_TO_PT = {
  "Chill Touch": "Toque Macabro",
  "Cause Fear": "Causar Medo",
  "Detect Undead": "Detectar Mortos-Vivos",
  "Ray of Enfeeblement": "Raio de Enfraquecimento",
  "Ghoul Touch": "Toque do Carniçal",
  "Spectral Hand": "Mão Espectral",
  "Blindness": "Cegueira",
  "Deafness": "Surdez",
  "Animate Dead": "Animar os Mortos",
  "Vampiric Touch": "Toque Vampírico",
  "Speak with Dead": "Falar com Mortos",
  "Hold Undead": "Imobilizar Mortos-Vivos",
  Enervation: "Dreno Temporário",
  Fear: "Medo",
  Contagion: "Praga",
  "Spirit Armor": "Armadura Espiritual",
  "Magic Jar": "Recipiente Arcano",
  Cloudkill: "Névoa Mortal",
  "Create Undead": "Criar Mortos-Vivos",
  "Death Spell": "Magia da Morte",
  "Finger of Death": "Dedo da Morte",
  "Control Undead": "Controlar Mortos-Vivos",
  Clone: "Clone",
  "Abi-Dalzim's Horrid Wilting": "Desidratação Horrível de Abi-Dalzim",
  "Energy Drain": "Drenar Energia",
  "Wail of the Banshee": "Lamúrio da Banshee",
  "Trap the Soul": "Aprisionar a Alma",
};

const SKIP_TITLE =
  /^(Capítulo|Grimório|Tomo|Volume|Magias de |Considerações|O Significado|Os Quatro|Táticas|Estratégias|Combinações|Filosofia|Problemas|Lendas|Preparação|Reações|Histórias|O Necromante|Estudos|O Caminho|O Medo|Conclusão|Magias Lendárias|Magias Icônicas|Magias Raras|Cem Magias|1º Círculo|2º Círculo|3º Círculo|4º Círculo|5º Círculo|6º Círculo|7º Círculo|8º Círculo|9º Círculo|Mestre dos|Mestre do|Predador da|Investigador do|A Fraqueza|O Terror|A Decadência|A Proteção|O Ceifador|O Arauto|O General|O Sobrevivente|O Infiltrador|A Criação|A Extinção|O Senhor|O Guardião|O Executor|O Caçador|O Direito|O Imortal|O Arquinecromante|A Preservação|A Degradação|Roubar$|Ceifar$|Possuir$|Excesso|Dependência|Atenção|Igrejas$|Reis$|Magos$|Mortos-Vivos Inteligentes|O Corpo Não|A Morte Não|O Arquinecromante$)/i;

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text) {
  return new Set(
    normalize(text)
      .split(" ")
      .filter((w) => w.length > 3),
  );
}

function jaccard(a, b) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseField(block, field) {
  const fieldPattern = field.split(/\s+/).join("\\s+");
  const re = new RegExp(
    `<strong>\\s*${fieldPattern}\\s*:\\s*</strong>\\s*([\\s\\S]*?)(?=<strong>|<h3|<hr)`,
    "i",
  );
  const m = block.match(re);
  if (!m) return "";
  return stripHtml(m[1].replace(/<br\s*\/?>/gi, " ")).trim();
}

function parseDescription(block) {
  const idx = block.search(/<h3[^>]*>\s*Descrição\s*<\/h3>/i);
  if (idx === -1) return "";
  const afterDesc = block.slice(idx).replace(/<h3[^>]*>\s*Descrição\s*<\/h3>/i, "");
  const end = afterDesc.search(/<h3[^>]*>/i);
  const section = end >= 0 ? afterDesc.slice(0, end) : afterDesc.slice(0, 2000);
  return stripHtml(section);
}

function parseSpellsFromHtml(html) {
  const spells = [];
  const re =
    /<(h1|h2) class="western">([^<]+)<\/\1>([\s\S]*?)(?=<(?:h1|h2) class="western">|<hr\/>|$)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = stripHtml(m[2]);
    const body = m[3];
    if (SKIP_TITLE.test(title)) continue;
    if (!/<strong>Escola:<\/strong>\s*Necromancia/i.test(body)) continue;

    const levelStr = parseField(body, "Nível");
    const level = parseInt(levelStr, 10) || 0;
    if (!level) continue;

    const desc = parseDescription(body);
    if (!desc) continue;

    const ptName = EN_TO_PT[title] ?? title;
    spells.push({
      originalTitle: title,
      name: ptName,
      level,
      school: "Necromancia",
      range: parseField(body, "Alcance") || "—",
      duration: parseField(body, "Duração") || "—",
      castingTime: parseField(body, "Tempo de Execução") || "—",
      components: parseField(body, "Componentes") || undefined,
      area: parseField(body, "Área de Efeito") || undefined,
      savingThrow: parseField(body, "Resistência à Magia") || undefined,
      description: desc,
    });
  }
  return spells;
}

function loadExistingSpells() {
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const spells = [];
  for (const entries of Object.values(index["by-level"])) {
    for (const e of entries) {
      const filePath = path.join(ROOT, "src/data/spellls", e.file);
      let detail = {};
      if (fs.existsSync(filePath)) {
        detail = JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
      spells.push({
        name: detail.name || e.name,
        level: detail.level ?? e.level,
        school: detail.school || e.school,
        description: detail.description || "",
        file: e.file,
      });
    }
  }
  return { index, spells };
}

function sameSpellName(a, b) {
  return normalize(a) === normalize(b);
}

function pickByLevel(candidates, level) {
  if (!candidates.length) return null;
  const sameLevel = candidates.filter((e) => e.level === level);
  if (sameLevel.length === 1) return sameLevel[0];
  if (sameLevel.length > 1) return sameLevel[0];
  return candidates[0];
}

function findMatch(spell, existing) {
  const byName = pickByLevel(
    existing.filter((e) => sameSpellName(e.name, spell.name)),
    spell.level,
  );
  if (byName) return { match: byName, reason: "nome" };

  const aliasName = EN_TO_PT[spell.originalTitle];
  if (aliasName) {
    const alias = pickByLevel(
      existing.filter((e) => sameSpellName(e.name, aliasName)),
      spell.level,
    );
    if (alias) return { match: alias, reason: "alias" };
  }

  let best = null;
  let bestScore = 0;
  for (const e of existing) {
    if (!e.description?.trim()) continue;
    if (Math.abs(e.level - spell.level) > 1) continue;
    const score = jaccard(spell.description, e.description);
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  if (best && bestScore >= 0.35) {
    return { match: best, reason: `descrição (${(bestScore * 100).toFixed(0)}%)` };
  }
  return null;
}

function addToIndex(index, spell, file) {
  const entry = {
    name: spell.name,
    file,
    level: spell.level,
    school: spell.school,
  };
  const levelKey = String(spell.level);
  if (!index["by-level"][levelKey]) index["by-level"][levelKey] = [];
  if (!index["by-level"][levelKey].some((e) => e.name === spell.name)) {
    index["by-level"][levelKey].push(entry);
    index["by-level"][levelKey].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }
  const schoolKey = "Necromancia";
  if (!index["by-school"][schoolKey]) index["by-school"][schoolKey] = [];
  if (!index["by-school"][schoolKey].some((e) => e.name === spell.name)) {
    index["by-school"][schoolKey].push(entry);
    index["by-school"][schoolKey].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }
}

function translateHtmlTitles(html, titleMap) {
  let out = html;
  for (const [en, pt] of Object.entries(titleMap)) {
    if (en === pt) continue;
    out = out.replace(
      new RegExp(`(<h[12] class="western">)${escapeRe(en)}(</h[12]>)`, "g"),
      `$1${pt}$2`,
    );
    out = out.replace(
      new RegExp(`(<h1 class="western">)${escapeRe(en)}(</h1>)`, "g"),
      `$1${pt}$2`,
    );
  }
  return out;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// --- main ---
const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
const html = fs.readFileSync(HTML_PATH, "utf8");
const parsed = parseSpellsFromHtml(html);
const { index, spells: existing } = loadExistingSpells();

const matched = [];
const added = [];
const skipped = [];

for (const spell of parsed) {
  const hit = findMatch(spell, existing);
  if (hit) {
    matched.push({ spell, ...hit });
    continue;
  }

  const slug = slugify(spell.name);
  let filename = `mage-spells/${slug}.json`;
  let filePath = path.join(SPELLS_DIR, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    const existingJson = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (existingJson.level === spell.level) {
      skipped.push({ spell, reason: "arquivo já existe" });
      continue;
    }
    const slugWithLevel = `${slug}-${spell.level}`;
    filename = `mage-spells/${slugWithLevel}.json`;
    filePath = path.join(SPELLS_DIR, `${slugWithLevel}.json`);
    if (fs.existsSync(filePath)) {
      skipped.push({ spell, reason: "arquivo já existe (nível alternativo)" });
      continue;
    }
  }

  const json = {
    name: spell.name,
    level: spell.level,
    school: spell.school,
    castingTime: spell.castingTime,
    duration: spell.duration,
    range: spell.range,
    ...(spell.components ? { components: spell.components } : {}),
    ...(spell.area ? { area: spell.area } : {}),
    ...(spell.savingThrow ? { savingThrow: spell.savingThrow } : {}),
    description: spell.description,
  };

  fs.writeFileSync(filePath, JSON.stringify(json, null, 4) + "\n");
  addToIndex(index, spell, filename);
  existing.push({ ...spell, file: filename, description: spell.description });
  added.push(spell);
}

fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 4) + "\n");

const titleMap = { ...EN_TO_PT };
for (const s of parsed) {
  titleMap[s.originalTitle] = s.name;
}
for (const { spell, match } of matched) {
  titleMap[spell.originalTitle] = match.name;
}

const newHtml = translateHtmlTitles(html, titleMap);
fs.writeFileSync(HTML_PATH, newHtml);

console.log("=== MAGIAS NO HTML ===", parsed.length);
console.log("\n--- JÁ EXISTIAM (por nome/descrição) ---");
for (const { spell, match, reason } of matched) {
  console.log(
    `  [${reason}] "${spell.originalTitle}" → ${match.name} (${match.file})`,
  );
}
if (added.length) {
  console.log("\n--- ADICIONADAS ---", added.length);
  for (const s of added) {
    console.log(`  + Nv ${s.level} ${s.name} (${slugify(s.name)}.json)`);
  }
}
if (skipped.length) {
  console.log("\n--- IGNORADAS ---");
  for (const { spell, reason } of skipped) {
    console.log(`  ? ${spell.name}: ${reason}`);
  }
}
}

export { parseSpellsFromHtml, EN_TO_PT, slugify, normalize, jaccard };
