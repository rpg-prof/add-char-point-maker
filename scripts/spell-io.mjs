/** Leitura e escrita de magias: metadados em JSON, descrição em Markdown. */
import fs from "fs";
import path from "path";

const SECTION_HEADERS =
  /^(Descrição|Aplicações(?: Táticas)?|Exemplo(?:s)?|Uso em Campanha|Aparência|Combinações|Mecânica de jogo)$/i;

const BULLET_CHARS = /^[•\uF0B7\uF097\u2022\u25CF\u25AA]\s*/;

/** Converte texto plano legado para Markdown básico. */
export function plainTextToMarkdown(text) {
  if (!text?.trim()) return "";

  if (/^#{1,6}\s/m.test(text) || /^-\s/m.test(text)) {
    return text.trimEnd() + "\n";
  }

  const out = [];
  for (const line of text.replace(/\t/g, " ").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (SECTION_HEADERS.test(trimmed)) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      out.push(`## ${trimmed}`);
      continue;
    }
    if (BULLET_CHARS.test(trimmed)) {
      out.push(`- ${trimmed.replace(BULLET_CHARS, "")}`);
      continue;
    }
    out.push(trimmed);
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

export function spellMdPath(jsonPath) {
  return jsonPath.replace(/\.json$/i, ".md");
}

export function readSpellDescription(jsonPath) {
  const mdPath = spellMdPath(jsonPath);
  if (fs.existsSync(mdPath)) {
    return fs.readFileSync(mdPath, "utf8");
  }

  try {
    const legacy = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    return legacy.description ?? "";
  } catch {
    return "";
  }
}

/** Lê metadados do JSON e descrição do .md (ou legado no JSON). */
export function readSpellPair(jsonPath) {
  const spell = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const mdPath = spellMdPath(jsonPath);

  if (fs.existsSync(mdPath)) {
    spell.description = fs.readFileSync(mdPath, "utf8");
  } else if (typeof spell.description !== "string") {
    spell.description = "";
  }

  return spell;
}

/** Grava metadados no JSON e descrição no .md irmão. */
export function writeSpellPair(jsonPath, spell, { convertPlainText = false } = {}) {
  const { description = "", ...meta } = spell;
  const mdPath = spellMdPath(jsonPath);

  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4) + "\n");

  const md =
    convertPlainText && description ? plainTextToMarkdown(description) : description;

  if (md?.trim()) {
    fs.writeFileSync(mdPath, md.endsWith("\n") ? md : `${md}\n`);
  } else if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
  }
}

/** Migra description embutida no JSON para arquivo .md. */
export function migrateJsonDescriptionToMd(jsonPath, { convertPlainText = true } = {}) {
  const spell = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const mdPath = spellMdPath(jsonPath);

  if (fs.existsSync(mdPath)) {
    if ("description" in spell) {
      const { description: _removed, ...meta } = spell;
      fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4) + "\n");
    }
    return { migrated: false, reason: "md-exists" };
  }

  const description = spell.description?.trim() ?? "";
  if (!description) {
    if ("description" in spell) {
      const { description: _removed, ...meta } = spell;
      fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4) + "\n");
    }
    return { migrated: false, reason: "empty" };
  }

  const { description: _removed, ...meta } = spell;
  const md = convertPlainText ? plainTextToMarkdown(description) : description;

  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4) + "\n");
  fs.writeFileSync(mdPath, md.endsWith("\n") ? md : `${md}\n`);

  return { migrated: true };
}
