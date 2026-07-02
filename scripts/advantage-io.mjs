/** Leitura e escrita de vantagens: metadados em JSON, descrição em Markdown. */
import fs from "fs";

export function advantageMdPath(jsonPath) {
  return jsonPath.replace(/\.json$/i, ".md");
}

export function writeAdvantagePair(jsonPath, advantage) {
  const { description = "", ...meta } = advantage;
  const mdPath = advantageMdPath(jsonPath);

  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4) + "\n");

  if (description?.trim()) {
    const md = description.endsWith("\n") ? description : `${description}\n`;
    fs.writeFileSync(mdPath, md);
  } else if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
  }
}
