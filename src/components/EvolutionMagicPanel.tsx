import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  arcaneManaUnitCost,
  divineManaUnitCost,
  EVOLUTION_COSTS,
  getMagicCircleAccess,
  magicLevelUpgradeCost,
  magicLevelUpgradeMultiplier,
  MAX_MAGIC_LEVEL,
} from "@/data/characterEvolution";
import type { EvolutionProgress } from "@/lib/evolutionProgress";

interface EvolutionMagicPanelProps {
  selectedClass: string;
  progress: EvolutionProgress;
  availablePoints: number;
  hasArcaneAccess: boolean;
  hasDivineAccess: boolean;
  arcaneSpecialist: string | null;
  onChange: (progress: EvolutionProgress) => void;
}

const rowCls =
  "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5";

const EvolutionMagicPanel = ({
  selectedClass,
  progress,
  availablePoints,
  hasArcaneAccess,
  hasDivineAccess,
  arcaneSpecialist,
  onChange,
}: EvolutionMagicPanelProps) => {
  const update = (patch: Partial<EvolutionProgress>) =>
    onChange({ ...progress, ...patch });

  const trySpend = (cost: number, action: () => void) => {
    if (cost > availablePoints) return;
    action();
  };

  const hasMagicAccess = hasArcaneAccess || hasDivineAccess;

  if (!hasMagicAccess) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        Compre acesso a uma escola ou esfera no passo Acesso à Magia para liberar nível e
        pontos de magia.
      </p>
    );
  }

  const magicMult = magicLevelUpgradeMultiplier(selectedClass);
  const magicUpgradeCost = magicLevelUpgradeCost(progress.magicLevel, selectedClass);
  const arcaneUnit = arcaneManaUnitCost(selectedClass);
  const divineUnit = divineManaUnitCost(selectedClass);
  const specialistUnit = EVOLUTION_COSTS.arcaneSpecialistMana;

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground text-xs">
        Nível de magia: nível anterior × {magicMult} (círculos a cada 2 níveis).
        Pontos de magia só podem ser comprados ao alcançar um novo nível.
      </p>

      <div className="space-y-2">
        <div className={rowCls}>
          <div>
            <div className="font-display text-xs tracking-wider uppercase text-foreground">
              Nível de Magia
            </div>
            <div className="text-[11px] text-muted-foreground font-body">
              Nv. {progress.magicLevel}/{MAX_MAGIC_LEVEL} · Círculo{" "}
              {getMagicCircleAccess(progress.magicLevel)}°
              {progress.magicLevel < MAX_MAGIC_LEVEL && (
                <> · Próximo: {magicUpgradeCost} PP</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() =>
                progress.magicLevel > 1 &&
                update({ magicLevel: progress.magicLevel - 1 })
              }
              disabled={progress.magicLevel <= 1}
            >
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-display font-bold tabular-nums">
              {progress.magicLevel}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() =>
                trySpend(magicUpgradeCost, () =>
                  update({ magicLevel: progress.magicLevel + 1 }),
                )
              }
              disabled={
                progress.magicLevel >= MAX_MAGIC_LEVEL ||
                availablePoints < magicUpgradeCost
              }
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {hasArcaneAccess && (
          <div className={rowCls}>
            <div>
              <div className="font-display text-xs tracking-wider uppercase text-foreground">
                Pontos de Magia Arcana
              </div>
              <div className="text-[11px] text-muted-foreground font-body">
                +{progress.arcaneManaPurchased} · {arcaneUnit} PP cada
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  progress.arcaneManaPurchased > 0 &&
                  update({ arcaneManaPurchased: progress.arcaneManaPurchased - 1 })
                }
                disabled={progress.arcaneManaPurchased <= 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-display font-bold tabular-nums">
                {progress.arcaneManaPurchased}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  trySpend(arcaneUnit, () =>
                    update({ arcaneManaPurchased: progress.arcaneManaPurchased + 1 }),
                  )
                }
                disabled={availablePoints < arcaneUnit}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {arcaneSpecialist && (
          <div className={rowCls}>
            <div>
              <div className="font-display text-xs tracking-wider uppercase text-foreground">
                Pontos Escola Especialista
              </div>
              <div className="text-[11px] text-muted-foreground font-body">
                +{progress.specialistManaPurchased} · {specialistUnit} PP cada
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  progress.specialistManaPurchased > 0 &&
                  update({
                    specialistManaPurchased: progress.specialistManaPurchased - 1,
                  })
                }
                disabled={progress.specialistManaPurchased <= 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-display font-bold tabular-nums">
                {progress.specialistManaPurchased}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  trySpend(specialistUnit, () =>
                    update({
                      specialistManaPurchased: progress.specialistManaPurchased + 1,
                    }),
                  )
                }
                disabled={availablePoints < specialistUnit}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {hasDivineAccess && (
          <div className={rowCls}>
            <div>
              <div className="font-display text-xs tracking-wider uppercase text-foreground">
                Pontos de Magia Divina
              </div>
              <div className="text-[11px] text-muted-foreground font-body">
                +{progress.divineManaPurchased} · {divineUnit} PP cada
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  progress.divineManaPurchased > 0 &&
                  update({ divineManaPurchased: progress.divineManaPurchased - 1 })
                }
                disabled={progress.divineManaPurchased <= 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-display font-bold tabular-nums">
                {progress.divineManaPurchased}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  trySpend(divineUnit, () =>
                    update({ divineManaPurchased: progress.divineManaPurchased + 1 }),
                  )
                }
                disabled={availablePoints < divineUnit}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvolutionMagicPanel;
