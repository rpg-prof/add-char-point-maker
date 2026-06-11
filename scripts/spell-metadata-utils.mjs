/** Utilitários compartilhados para parse e inferência de metadados de magias. */

export const EN_TO_PT = {
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

export function stripHtml(html) {
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

export function parseField(block, field) {
  const fieldPattern = field.split(/\s+/).join("\\s+");
  const re = new RegExp(
    `<strong>\\s*${fieldPattern}\\s*:\\s*</strong>\\s*([\\s\\S]*?)(?=<strong>|<h3|<hr)`,
    "i",
  );
  const m = block.match(re);
  if (!m) return "";
  return stripHtml(m[1].replace(/<br\s*\/?>/gi, " ")).trim();
}

export function parseDescription(block) {
  const idx = block.search(/<h3[^>]*>\s*Descrição\s*<\/h3>/i);
  if (idx === -1) return "";
  const afterDesc = block
    .slice(idx)
    .replace(/<h3[^>]*>\s*Descrição\s*<\/h3>/i, "");
  const end = afterDesc.search(/<h3[^>]*>/i);
  const section = end >= 0 ? afterDesc.slice(0, end) : afterDesc.slice(0, 2000);
  return stripHtml(section);
}

export function parseMetadataFromBlock(body) {
  const range = parseField(body, "Alcance");
  const duration = parseField(body, "Duração");
  const castingTime = parseField(body, "Tempo de Execução");
  const components = parseField(body, "Componentes");
  const area = parseField(body, "Área de Efeito");
  const savingThrow = parseField(body, "Resistência à Magia");
  const hasAny = [range, duration, castingTime, components, area, savingThrow].some(
    Boolean,
  );
  if (!hasAny) return null;
  return {
    ...(range ? { range } : {}),
    ...(duration ? { duration } : {}),
    ...(castingTime ? { castingTime } : {}),
    ...(components ? { components } : {}),
    ...(area ? { area } : {}),
    ...(savingThrow ? { savingThrow } : {}),
  };
}

export function parseGrimoireMetadataByKey(html) {
  const byKey = new Map();
  const re =
    /<(h1|h2) class="western">([^<]+)<\/\1>([\s\S]*?)(?=<(?:h1|h2) class="western">|<hr\/>|$)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const title = stripHtml(m[2]);
    const body = m[3];
    if (!/<strong>\s*Escola:\s*<\/strong>\s*Necromancia/i.test(body)) continue;
    const level = parseInt(parseField(body, "Nível"), 10);
    if (!level) continue;
    const meta = parseMetadataFromBlock(body);
    if (!meta) continue;
    const name = EN_TO_PT[title] ?? title;
    byKey.set(`${name}::${level}`, meta);
  }
  return byKey;
}

export function isEmptyMeta(value) {
  return value === undefined || value === null || value === "" || value === "—";
}

const META_FIELDS = [
  "range",
  "duration",
  "castingTime",
  "components",
  "area",
  "savingThrow",
];

export function inferMetadata(spell) {
  const d = (spell.description || "").toLowerCase();
  const meta = {};

  if (/\b(toque|toca um|tocar um|ao tocar)\b/.test(d)) meta.range = "Toque";
  else if (/\b(conjurador|em si|próprio corpo|ao redor do conjurador)\b/.test(d))
    meta.range = "0";
  else if (/(\d+)\s*metros/.test(d)) meta.range = d.match(/(\d+)\s*metros/)[0];
  else if (/\b(área|região|vasta|local|templo|cripta|necrópole)\b/.test(d))
    meta.range = "Médio";
  else meta.range = "Médio";

  if (/\bcadáver|corpo morto|restos mortais\b/.test(d)) meta.area = "Um cadáver";
  else if (/\bo alvo|a vítima|uma criatura|criatura viva\b/.test(d))
    meta.area = "Uma criatura";
  else if (/\bárea\b/.test(d)) meta.area = "Especial";
  else if (meta.range === "0") meta.area = "O conjurador";
  else meta.area = "Especial";

  if (/\bpermanente|eternamente\b/.test(d)) meta.duration = "Permanente";
  else if (/\binstantâne|imediatamente|no mesmo instante\b/.test(d))
    meta.duration = "Instantânea";
  else if (/\brodada por nível\b/.test(d)) meta.duration = "1 rodada/nível";
  else if (/\balguns minutos\b/.test(d)) meta.duration = "Alguns minutos";
  else if (/\bdurante a duração\b|\bpor algumas rodadas\b/.test(d))
    meta.duration = "Especial";
  else if (/\b24 horas\b/.test(d)) meta.duration = "Especial (até 24 h)";
  else meta.duration = "Especial";

  meta.castingTime = String(spell.level);

  if (/\bcomponente material\b|\bfragmento\b|\bpedaço\b/.test(d))
    meta.components = "V, S, M";
  else meta.components = "V, S";

  if (
    /\bteste de resistência|resistência à magia|falharem em sua resistência|falham em\b/.test(
      d,
    )
  )
    meta.savingThrow = "Sim";
  else if (/\bnão possui resistência|não pode resistir|sem teste\b/.test(d))
    meta.savingThrow = "Não";
  else if (meta.area === "Uma criatura" || /\bárea\b/.test(d))
    meta.savingThrow = "Sim";
  else meta.savingThrow = "Especial";

  return meta;
}

export function mergeMetadata(spell, fromHtml, inferred) {
  const out = { ...spell };
  for (const field of META_FIELDS) {
    if (!isEmptyMeta(out[field])) continue;
    if (fromHtml?.[field]) out[field] = fromHtml[field];
    else if (inferred?.[field]) out[field] = inferred[field];
  }
  return out;
}

export function countMissingMeta(spell) {
  return META_FIELDS.filter((f) => isEmptyMeta(spell[f])).length;
}
