/** Leitura e escrita de perícias: metadados em JSON, descrição em Markdown. */
import fs from "fs";

export function skillMdPath(jsonPath) {
  return jsonPath.replace(/\.json$/i, ".md");
}

export function readSkillPair(jsonPath) {
  const skill = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const mdPath = skillMdPath(jsonPath);

  if (fs.existsSync(mdPath)) {
    skill.description = fs.readFileSync(mdPath, "utf8");
  } else if (typeof skill.description !== "string") {
    skill.description = "";
  }

  return skill;
}

export function writeSkillPair(jsonPath, skill) {
  const { description = "", ...meta } = skill;
  const mdPath = skillMdPath(jsonPath);

  fs.writeFileSync(jsonPath, JSON.stringify(meta, null, 4) + "\n");

  if (description?.trim()) {
    const md = description.endsWith("\n") ? description : `${description}\n`;
    fs.writeFileSync(mdPath, md);
  } else if (fs.existsSync(mdPath)) {
    fs.unlinkSync(mdPath);
  }
}

export function serializeSkillJson(skill) {
  return {
    name: skill.name,
    costByClass: skill.costByClass,
    attribute: skill.attribute,
    groups: skill.groups,
    ...(skill.penaltyNoProficiency != null
      ? { penaltyNoProficiency: skill.penaltyNoProficiency }
      : {}),
  };
}
