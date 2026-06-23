import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import SkillMdDescription from "@/components/SkillMdDescription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getSkillCost,
  groupSkillsForPanel,
  isSkillForClass,
  type Skill,
  type SkillPanelCategory,
} from "@/data/skills";

interface SkillsPanelProps {
  selected: string[];
  onToggle: (name: string, cost: number) => void;
  characterClass: string;
}

const PANEL_SECTIONS: Array<{ id: SkillPanelCategory; label: string }> = [
  { id: "geral", label: "Geral" },
  { id: "class", label: "Da minha classe" },
  { id: "other", label: "De outras classes" },
];

const SkillsPanel = ({ selected, onToggle, characterClass }: SkillsPanelProps) => {
  const [viewingSkill, setViewingSkill] = useState<Skill | null>(null);

  const groupedSkills = useMemo(
    () => groupSkillsForPanel(characterClass),
    [characterClass],
  );

  const viewingCost = viewingSkill ? getSkillCost(viewingSkill, characterClass) : 0;
  const viewingIsClass = viewingSkill ? isSkillForClass(viewingSkill, characterClass) : false;

  const sectionLabel = (id: SkillPanelCategory) => {
    if (id === "class" && characterClass) {
      return `Da minha classe (${characterClass})`;
    }
    return PANEL_SECTIONS.find((s) => s.id === id)?.label ?? id;
  };

  return (
    <>
      <div className="space-y-5">
        {PANEL_SECTIONS.map(({ id }) => {
          const sectionSkills = groupedSkills[id];
          if (!sectionSkills.length) return null;

          return (
            <div key={id}>
              <h3 className="font-display text-sm tracking-wider uppercase text-gold mb-2">
                {sectionLabel(id)}
                <span className="ml-2 text-xs font-body normal-case tracking-normal text-muted-foreground">
                  ({sectionSkills.length})
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {sectionSkills.map((skill) => {
                  const isSelected = selected.includes(skill.name);
                  const isClass = isSkillForClass(skill, characterClass);
                  const displayCost = getSkillCost(skill, characterClass);

                  return (
                    <div key={skill.name} className="flex items-center gap-0.5">
                      {skill.descriptionFile && (
                        <button
                          type="button"
                          onClick={() => setViewingSkill(skill)}
                          title="Ver descrição"
                          aria-label={`Ver descrição de ${skill.name}`}
                          className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-gold hover:border-gold/50 hover:bg-gold/10 transition-all flex-shrink-0"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggle(skill.name, displayCost)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left flex-1 min-w-0 ${
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
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {skill.attribute}
                        </span>
                        <span className="text-xs font-display text-gold-dark flex-shrink-0">
                          {displayCost} pts{!isClass && " (2x)"}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!viewingSkill} onOpenChange={(open) => !open && setViewingSkill(null)}>
        <DialogContent className="parchment-bg border-gold/50 sm:max-w-2xl max-h-[85vh] overflow-y-auto text-foreground shadow-xl gap-5">
          {viewingSkill && (
            <>
              <DialogHeader className="space-y-2 border-b border-gold/30 pb-3">
                <DialogTitle className="font-display text-xl tracking-wide text-foreground pr-8">
                  {viewingSkill.name}
                </DialogTitle>
                <DialogDescription className="font-body text-sm text-muted-foreground">
                  <span className="text-foreground/80">{viewingSkill.attribute}</span>
                  {" · "}
                  <span className="text-gold-dark font-semibold">
                    {viewingCost} pts{!viewingIsClass && " (2x)"}
                  </span>
                  {viewingSkill.penaltyNoProficiency != null && (
                    <>
                      {" · "}
                      Sem proficiência: {viewingSkill.penaltyNoProficiency}
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md border border-border/60 bg-background/40 px-4 py-3">
                <SkillMdDescription
                  mdFile={viewingSkill.descriptionFile}
                  variant="reading"
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SkillsPanel;
