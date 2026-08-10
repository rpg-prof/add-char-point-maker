import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  chiPointsForLevel,
  MAX_CHI_LEVEL,
  scaledLevelUpgradeCost,
} from "@/data/characterEvolution";
import type { EvolutionProgress } from "@/lib/evolutionProgress";
import EvolutionChiTechniquesPanel from "@/components/EvolutionChiTechniquesPanel";

interface EvolutionChiPanelProps {
  selectedClass: string;
  progress: EvolutionProgress;
  availablePoints: number;
  onChange: (progress: EvolutionProgress) => void;
}

const rowCls =
  "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5";

const EvolutionChiPanel = ({
  selectedClass,
  progress,
  availablePoints,
  onChange,
}: EvolutionChiPanelProps) => {
  const update = (patch: Partial<EvolutionProgress>) =>
    onChange({ ...progress, ...patch });

  const trySpend = (cost: number, action: () => void) => {
    if (cost > availablePoints) return;
    action();
  };

  const chiUpgradeCost = scaledLevelUpgradeCost(progress.chiLevel, 5);
  const chiPoints = chiPointsForLevel(progress.chiLevel);

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground text-xs">
        Nível de Chi: nível anterior × 5 (todos começam no nível 1, com 0 pontos de Chi).
        Técnicas são compradas à parte com pontos de progressão.
      </p>

      <div className={rowCls}>
        <div>
          <div className="font-display text-xs tracking-wider uppercase text-foreground">
            Nível de Chi
          </div>
          <div className="text-[11px] text-muted-foreground font-body">
            Nv. {progress.chiLevel}/{MAX_CHI_LEVEL} · {chiPoints} pontos de Chi
            {progress.chiLevel < MAX_CHI_LEVEL && <> · Próximo: {chiUpgradeCost} PP</>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() =>
              progress.chiLevel > 1 && update({ chiLevel: progress.chiLevel - 1 })
            }
            disabled={progress.chiLevel <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="w-8 text-center font-display font-bold tabular-nums">
            {progress.chiLevel}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() =>
              trySpend(chiUpgradeCost, () =>
                update({ chiLevel: progress.chiLevel + 1 }),
              )
            }
            disabled={
              progress.chiLevel >= MAX_CHI_LEVEL || availablePoints < chiUpgradeCost
            }
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <EvolutionChiTechniquesPanel
        selectedClass={selectedClass}
        progress={progress}
        availablePoints={availablePoints}
        onChange={onChange}
      />
    </div>
  );
};

export default EvolutionChiPanel;
