import { Check } from "lucide-react";
import { skills, type SkillOption } from "@/data/characterData";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SkillsPanelProps {
  selected: string[];
  onToggle: (name: string, cost: number) => void;
  characterClass: string;
}

const groupOrder = ["Geral", "Guerreiro", "Ladrão/Bardo", "Sacerdote", "Mago"];

const SkillsPanel = ({ selected, onToggle, characterClass }: SkillsPanelProps) => {
  const groupedSkills = groupOrder.reduce<Record<string, SkillOption[]>>((acc, group) => {
    acc[group] = skills.filter((s) => s.group === group);
    return acc;
  }, {});

  const isClassSkill = (skill: SkillOption) => {
    if (skill.group === "Geral") return true;
    const classMap: Record<string, string[]> = {
      Guerreiro: ["Guerreiro"],
      "Ladrão/Bardo": ["Ladrão", "Bardo"],
      Sacerdote: ["Sacerdote"],
      Mago: ["Arcano"],
      Paladino: ["Guerreiro"],
      Ranger: ["Guerreiro"],
    };
    for (const [group, classList] of Object.entries(classMap)) {
      if (skill.group === group && classList.includes(characterClass)) return true;
    }
    if (skill.group === "Guerreiro" && ["Paladino", "Ranger"].includes(characterClass)) return true;
    return false;
  };

  const renderSkillButton = (skill: SkillOption, isSelected: boolean, isClass: boolean, displayCost: number) => (
    <button
      onClick={() => onToggle(skill.name, displayCost)}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left ${
        isSelected
          ? "bg-gold/20 border-gold text-foreground"
          : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
          isSelected ? "bg-gold border-gold" : "border-border"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
      </span>
      <span className="flex-1 truncate">{skill.name}</span>
      <span className="text-xs text-muted-foreground">{skill.attribute}</span>
      <span className="text-xs font-display text-gold-dark">
        {displayCost} pts{!isClass && " (2x)"}
      </span>
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {groupOrder.map((group) => {
          const groupSkills = groupedSkills[group];
          if (!groupSkills?.length) return null;

          return (
            <div key={group}>
              <h3 className="font-display text-sm tracking-wider uppercase text-gold mb-2">
                {group === "Guerreiro" ? "Guerreiro / Paladino / Ranger" : group}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {groupSkills.map((skill) => {
                  const isSelected = selected.includes(skill.name);
                  const isClass = isClassSkill(skill);
                  const displayCost = isClass ? skill.cost : skill.cost * 2;
                  const button = renderSkillButton(skill, isSelected, isClass, displayCost);

                  if (skill.description) {
                    return (
                      <Tooltip key={skill.name}>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs font-body">
                          {skill.description}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <span key={skill.name}>{button}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default SkillsPanel;
