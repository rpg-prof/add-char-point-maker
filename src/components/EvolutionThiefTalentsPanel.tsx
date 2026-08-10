import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getThiefTalentCostPerPercent,
  THIEF_TALENT_CAP,
  THIEF_TALENTS,
  type ThiefTalentKey,
} from "@/data/thiefTalents";
import { computeThiefTalentBreakdown } from "@/lib/thiefTalentStats";
import type { EvolutionProgress } from "@/lib/evolutionProgress";

interface EvolutionThiefTalentsPanelProps {
  selectedClass: string;
  selectedRace: string;
  subAttributes: Record<string, number>;
  selectedAdvantages: string[];
  progress: EvolutionProgress;
  availablePoints: number;
  onChange: (progress: EvolutionProgress) => void;
}

const EvolutionThiefTalentsPanel = ({
  selectedClass,
  selectedRace,
  subAttributes,
  selectedAdvantages,
  progress,
  availablePoints,
  onChange,
}: EvolutionThiefTalentsPanelProps) => {
  const rows = computeThiefTalentBreakdown({
    selectedClass,
    selectedRace,
    subAttributes,
    selectedAdvantages,
    purchasedBonuses: progress.thiefTalentBonuses,
  });

  const setPurchased = (key: ThiefTalentKey, next: number) => {
    const bonuses = { ...progress.thiefTalentBonuses };
    if (next <= 0) delete bonuses[key];
    else bonuses[key] = next;
    onChange({ ...progress, thiefTalentBonuses: bonuses });
  };

  if (!rows) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        Esta classe não usa a tabela de talentos ladinos.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-body text-muted-foreground text-xs">
        Compre +1% por vez com pontos de progressão (custo conforme a classe). Teto usual:{" "}
        {THIEF_TALENT_CAP}%.
      </p>

      <div className="space-y-1.5 max-h-[58vh] overflow-y-auto pr-1">
        {rows.map((row) => {
          const talent = THIEF_TALENTS.find((t) => t.key === row.key)!;
          const unit = getThiefTalentCostPerPercent(talent, selectedClass);
          const atCap = row.total >= THIEF_TALENT_CAP;
          const canBuy = !atCap && availablePoints >= unit;

          return (
            <div
              key={row.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="font-body text-xs text-foreground truncate">{row.label}</div>
                <div className="text-[11px] text-muted-foreground font-body">
                  Total {row.total}% · Comprado +{row.purchased}% · {unit} PP/%
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={row.purchased <= 0}
                  onClick={() => setPurchased(row.key, row.purchased - 1)}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="w-8 text-center font-display font-bold tabular-nums text-sm">
                  +{row.purchased}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  disabled={!canBuy}
                  onClick={() => setPurchased(row.key, row.purchased + 1)}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvolutionThiefTalentsPanel;
