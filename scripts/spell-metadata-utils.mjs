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

export function htmlToReadableText(html) {
  return html
    .replace(/<h3[^>]*>\s*([^<]+)\s*<\/h3>/gi, "\n\n$1\n")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\n\t*•\s*/g, "\n• ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Texto completo do bloco: Descrição + Aplicações, Exemplos, etc. */
export function parseDescription(block) {
  const descHeading = /<h3[^>]*>\s*Descrição\s*<\/h3>/i;
  const anyHeading = /<h3[^>]*>/i;
  let content;
  if (descHeading.test(block)) {
    const idx = block.search(descHeading);
    content = block.slice(idx).replace(descHeading, "\n\nDescrição\n");
  } else {
    const idx = block.search(anyHeading);
    if (idx === -1) return "";
    content = block.slice(idx);
  }
  return htmlToReadableText(content);
}

const SKIP_TITLE =
  /^(Capítulo|Grimório|Tomo|Volume|Magias de |Considerações|O Significado|Os Quatro|Táticas|Estratégias|Combinações|Filosofia|Problemas|Lendas|Preparação|Reações|Histórias|O Necromante|Estudos|O Caminho|O Medo|Conclusão|Magias Lendárias|Magias Icônicas|Magias Raras|Cem Magias|1º Círculo|2º Círculo|3º Círculo|4º Círculo|5º Círculo|6º Círculo|7º Círculo|8º Círculo|9º Círculo|Mestre dos|Mestre do|Predador da|Investigador do|A Fraqueza|O Terror|A Decadência|A Proteção|O Ceifador|O Arauto|O General|O Sobrevivente|O Infiltrador|A Criação|A Extinção|O Senhor|O Guardião|O Executor|O Caçador|O Direito|O Imortal|O Arquinecromante|A Preservação|A Degradação|Roubar$|Ceifar$|Possuir$|Excesso|Dependência|Atenção|Igrejas$|Reis$|Magos$|Mortos-Vivos Inteligentes|O Corpo Não|A Morte Não|O Arquinecromante$)/i;

export function parseGrimoireSpellsByKey(html) {
  const byKey = new Map();
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
    const name = EN_TO_PT[title] ?? title;
    byKey.set(`${name}::${level}`, { name, level, description });
  }
  return byKey;
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

const BULLET_CHARS = /[\uF0B7\uF097\u2022\u25CF\u25AA]/g;

const PARAGRAPH_BREAK_BEFORE =
  /(?<=\.)\s+(?=(?:O componente|Os componentes|O reverso|A versão reversa|Observe que|Note que|Veja |Clérigos |Mortos-vivos |Portanto,|Logo,|Assim,|Além disso,|Dessa forma,|Finalmente,|Utilizá-la |Se o |Se a |Se houver |Quando |Durante |Após |Antes ))/gi;

/** Descrição já veio do grimório HTML com seções nomeadas. */
export function isAlreadyFormatted(text) {
  if (!text?.trim()) return true;
  if (/^\s*Descrição\s*\n/i.test(text)) return true;
  return /\n\n(?:Aplicações(?: Táticas)?|Exemplo|Uso em Campanha|Aparência|Combinações)\n/i.test(
    text,
  );
}

function stripEmbeddedMetadata(text) {
  return text
    .replace(/\s+Componentes:\s*.+$/i, "")
    .replace(/\s+Tempo de Execução:\s*.+$/i, "")
    .replace(/\s+Resistência(?: à Magia)?:\s*.+$/i, "")
    .trim();
}

function formatLetteredLists(text) {
  let out = text.replace(/:\s*([A-Z]\))/g, ":\n\n$1");
  out = out.replace(/\s+([B-Z]\))\s/g, "\n\n$1 ");
  return out;
}

function formatBulletLists(text) {
  let out = text.replace(/:\s*[\uF0B7\uF097\u2022\u25CF\u25AA]\s*/g, ":\n\n• ");
  out = out.replace(/([.!?])\s*[\uF0B7\uF097\u2022\u25CF\u25AA]\s*/g, "$1\n\n• ");
  out = out.replace(BULLET_CHARS, "\n• ");
  out = out.replace(/\n•\s+/g, "\n• ");
  return out;
}

function formatIntoParagraphs(text) {
  if (text.includes("\n")) {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n\n");
  }

  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) || [text];
  const paragraphs = [];
  let current = "";

  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    const next = current ? `${current} ${sentence}` : sentence;
    if (current && next.length > 380) {
      paragraphs.push(current.trim());
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) paragraphs.push(current.trim());
  return paragraphs.join("\n\n");
}

/** Formata descrições em parágrafo único para texto legível com quebras. */
export function formatSpellDescription(text) {
  if (!text?.trim() || isAlreadyFormatted(text)) return text?.trim() ?? "";

  let t = text.replace(/\s+/g, " ").trim();
  t = stripEmbeddedMetadata(t);
  t = formatBulletLists(t);
  t = formatLetteredLists(t);
  t = t.replace(PARAGRAPH_BREAK_BEFORE, "\n\n");
  t = t.replace(/\.{2,}/g, ".");
  t = formatIntoParagraphs(t);
  t = t.replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

export function serializeSpellJson(spell) {
  return {
    name: spell.name,
    level: spell.level,
    school: spell.school,
    ...(spell.sphere ? { sphere: spell.sphere } : {}),
    ...(spell.castingTime ? { castingTime: spell.castingTime } : {}),
    ...(spell.duration ? { duration: spell.duration } : {}),
    ...(spell.range ? { range: spell.range } : {}),
    ...(spell.components ? { components: spell.components } : {}),
    ...(spell.area ? { area: spell.area } : {}),
    ...(spell.savingThrow ? { savingThrow: spell.savingThrow } : {}),
    description: spell.description,
  };
}
