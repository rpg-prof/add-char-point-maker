import { skills, getSkillCost } from "@/data/skills";
import { getSkillLevel } from "@/lib/evolutionProgress";

interface PlaySkillsPanelProps {
  selectedSkills: string[];
  selectedClass: string;
  skillLevels?: Record<string, number>;
}

const PlaySkillsPanel = ({
  selectedSkills,
  selectedClass,
  skillLevels,
}: PlaySkillsPanelProps) => {
  const sorted = [...selectedSkills].sort((a, b) => a.localeCompare(b, "pt-BR"));

  if (sorted.length === 0) {
    return (
      <p className="text-meta text-muted-foreground font-body py-2 text-center">
        Nenhuma perícia comum selecionada.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden divide-y divide-border/40">
      {sorted.map((name) => {
        const skill = skills.find((s) => s.name === name);
        const cost = skill ? getSkillCost(skill, selectedClass) : 0;
        const level = getSkillLevel(name, skillLevels);
        const attribute = skill?.attribute?.trim() || "—";
        return (
          <div
            key={name}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-background/30 hover:bg-gold/[0.04] transition-colors"
          >
            <span className="min-w-0 flex-1 truncate text-meta font-body leading-snug text-foreground">
              {name}
            </span>
            <span
              className="shrink-0 max-w-[8rem] truncate text-micro font-display tracking-wide text-muted-foreground"
              title="Atributo de teste"
            >
              {attribute}
            </span>
            <span
              className="shrink-0 text-micro font-display text-gold-dark tabular-nums"
              title="Nível da perícia"
            >
              Nv. {level}
            </span>
            <span className="text-micro text-muted-foreground tabular-nums shrink-0 w-9 text-right">
              {cost} pts
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default PlaySkillsPanel;
