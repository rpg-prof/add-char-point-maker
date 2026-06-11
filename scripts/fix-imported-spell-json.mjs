#!/usr/bin/env node
/** Re-parse spell blocks from HTML and refresh JSON files added by import. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Inline minimal re-parse (same logic as import script)
const HTML_PATH = path.join(ROOT, "data/magias-necromanticas.html");
const SPELLS_DIR = path.join(ROOT, "src/data/spellls/mage-spells");

const EN_TO_PT = {
  "Chill Touch": "Toque Macabro",
  "Cause Fear": "Causar Medo",
  "Detect Undead": "Detectar Mortos-Vivos",
  "Ray of Enfeeblement": "Raio de Enfraquecimento",
  "Ghoul Touch": "Toque do Carniçal",
  "Spectral Hand": "Mão Espectral",
  Blindness: "Cegueira",
  Deafness: "Surdez",
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

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
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

const html = fs.readFileSync(HTML_PATH, "utf8");
const re =
  /<(h1|h2) class="western">([^<]+)<\/\1>([\s\S]*?)(?=<(?:h1|h2) class="western">|<hr\/>|$)/gi;
const byKey = new Map();
let m;
while ((m = re.exec(html)) !== null) {
  const title = stripHtml(m[2]);
  const body = m[3];
  if (!/<strong>\s*Escola:\s*<\/strong>\s*Necromancia/i.test(body)) continue;
  const level = parseInt(parseField(body, "Nível"), 10);
  if (!level) continue;
  const desc = parseDescription(body);
  if (!desc) continue;
  const name = EN_TO_PT[title] ?? title;
  byKey.set(`${name}::${level}`, {
    name,
    level,
    school: "Necromancia",
    range: parseField(body, "Alcance") || undefined,
    duration: parseField(body, "Duração") || undefined,
    castingTime: parseField(body, "Tempo de Execução") || undefined,
    components: parseField(body, "Componentes") || undefined,
    area: parseField(body, "Área de Efeito") || undefined,
    description: desc,
  });
}

let fixed = 0;
for (const file of fs.readdirSync(SPELLS_DIR)) {
  if (!file.endsWith(".json")) continue;
  const fp = path.join(SPELLS_DIR, file);
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  const fresh = byKey.get(`${data.name}::${data.level}`);
  if (!fresh) continue;
  // Só corrige JSONs importados do grimório (evita sobrescrever magias oficiais)
  const needsFix =
    data.castingTime === "—" ||
    data.description?.includes("Aplicações Táticas") ||
    data.description?.includes("Limitações ") ||
    data.range?.includes("Componentes") ||
    data.duration?.includes("Área de Efeito");
  if (!needsFix) continue;
  const updated = {
    name: fresh.name,
    level: fresh.level,
    school: fresh.school,
    ...(fresh.castingTime ? { castingTime: fresh.castingTime } : {}),
    ...(fresh.duration ? { duration: fresh.duration } : {}),
    ...(fresh.range ? { range: fresh.range } : {}),
    ...(fresh.components ? { components: fresh.components } : {}),
    ...(fresh.area ? { area: fresh.area } : {}),
    description: fresh.description,
  };
  fs.writeFileSync(fp, JSON.stringify(updated, null, 4) + "\n");
  fixed++;
}
console.log(`Atualizados ${fixed} arquivos JSON a partir do HTML.`);
