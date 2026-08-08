import { skills, getSkillCost } from "@/data/skills";

interface PlaySkillsPanelProps {
  selectedSkills: string[];
  selectedClass: string;
  skillBonuses?: Record<string, number>;
}

function splitInTwo<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

const PlaySkillsPanel = ({
  selectedSkills,
  selectedClass,
  skillBonuses = {},
}: PlaySkillsPanelProps) => {
  const sorted = [...selectedSkills].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const [left, right] = splitInTwo(sorted);

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-body py-2 text-center">
        Nenhuma perícia comum selecionada.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">
      {[left, right].map((col, colIdx) => (
        <div key={colIdx} className="space-y-0.5">
          {col.map((name) => {
            const skill = skills.find((s) => s.name === name);
            const cost = skill ? getSkillCost(skill, selectedClass) : 0;
            const bonus = skillBonuses[name] ?? 0;
            return (
              <div
                key={name}
                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-background/50 text-xs font-body border-b border-border/30 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate leading-snug">{name}</span>
                {bonus > 0 && (
                  <span className="text-[10px] font-display text-gold-dark tabular-nums shrink-0">
                    +{bonus}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {cost} pts
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default PlaySkillsPanel;
