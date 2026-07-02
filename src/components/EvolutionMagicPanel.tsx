import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  EVOLUTION_COSTS,
  getMagicCircleAccess,
  MAX_CHI_LEVEL,
  MAX_MAGIC_LEVEL,
  scaledLevelUpgradeCost,
} from "@/data/characterEvolution";
import type { EvolutionProgress } from "@/lib/evolutionProgress";

interface EvolutionMagicPanelProps {
  progress: EvolutionProgress;
  availablePoints: number;
  hasMagicAccess: boolean;
  hasArcaneAccess: boolean;
  hasDivineAccess: boolean;
  arcaneSpecialist: string | null;
  onChange: (progress: EvolutionProgress) => void;
}

const rowCls =
  "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5";

const EvolutionMagicPanel = ({
  progress,
  availablePoints,
  hasMagicAccess,
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

  if (!hasMagicAccess) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        Este personagem não possui acesso a magia. Nenhuma progressão mágica disponível.
      </p>
    );
  }

  const magicUpgradeCost = scaledLevelUpgradeCost(progress.magicLevel, 5);
  const chiUpgradeCost = scaledLevelUpgradeCost(progress.chiLevel, 5);

  const arcaneUnit = arcaneSpecialist
    ? EVOLUTION_COSTS.arcaneSpecialistMana
    : EVOLUTION_COSTS.arcaneMana;

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground text-xs">
        Nível de magia: nível anterior × 5 (acesso a círculos a cada 2 níveis).
        Pontos de magia só podem ser comprados ao alcançar um novo nível.
      </p>

      <div className="space-y-2">
        <div className={rowCls}>
          <div>
            <div className="font-display text-xs tracking-wider uppercase text-foreground">
              Nível de Magia
            </div>
            <div className="text-[11px] text-muted-foreground font-body">
              Nv. {progress.magicLevel}/{MAX_MAGIC_LEVEL} · Círculo {getMagicCircleAccess(progress.magicLevel)}°
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
                {arcaneSpecialist && " (escola especialista)"}
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
                +{progress.specialistManaPurchased} · {EVOLUTION_COSTS.arcaneSpecialistMana} PP cada
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={() =>
                  progress.specialistManaPurchased > 0 &&
                  update({ specialistManaPurchased: progress.specialistManaPurchased - 1 })
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
                  trySpend(EVOLUTION_COSTS.arcaneSpecialistMana, () =>
                    update({ specialistManaPurchased: progress.specialistManaPurchased + 1 }),
                  )
                }
                disabled={availablePoints < EVOLUTION_COSTS.arcaneSpecialistMana}
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
                +{progress.divineManaPurchased} · {EVOLUTION_COSTS.divineMana} PP cada
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
                  trySpend(EVOLUTION_COSTS.divineMana, () =>
                    update({ divineManaPurchased: progress.divineManaPurchased + 1 }),
                  )
                }
                disabled={availablePoints < EVOLUTION_COSTS.divineMana}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        <div className={rowCls}>
          <div>
            <div className="font-display text-xs tracking-wider uppercase text-foreground">
              Nível de Chi
            </div>
            <div className="text-[11px] text-muted-foreground font-body">
              Nv. {progress.chiLevel}/{MAX_CHI_LEVEL}
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
      </div>
    </div>
  );
};

export default EvolutionMagicPanel;
