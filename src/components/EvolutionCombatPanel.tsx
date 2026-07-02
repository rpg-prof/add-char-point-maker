import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  attackBaseUpgradeCost,
  EVOLUTION_COSTS,
  MAX_ATTACK_BASE_LEVEL,
  MAX_ATTACKS_PER_ROUND_LEVEL,
} from "@/data/characterEvolution";
import type { EvolutionProgress } from "@/lib/evolutionProgress";
import { getHpPurchasedAtLevel } from "@/lib/evolutionProgress";

interface EvolutionCombatPanelProps {
  characterLevel: number;
  progress: EvolutionProgress;
  availablePoints: number;
  hasBackstabAdvantage: boolean;
  onChange: (progress: EvolutionProgress) => void;
}

const rowCls =
  "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5";

const EvolutionCombatPanel = ({
  characterLevel,
  progress,
  availablePoints,
  hasBackstabAdvantage,
  onChange,
}: EvolutionCombatPanelProps) => {
  const update = (patch: Partial<EvolutionProgress>) =>
    onChange({ ...progress, ...patch });

  const trySpend = (cost: number, action: () => void) => {
    if (cost > availablePoints) return;
    action();
  };

  const hpThisLevel = getHpPurchasedAtLevel(progress, characterLevel);
  const hpCost = EVOLUTION_COSTS.hpPerPoint;

  const addHp = () => {
    if (hpThisLevel >= EVOLUTION_COSTS.maxHpPerLevel) return;
    trySpend(hpCost, () => {
      update({
        hpByLevel: {
          ...progress.hpByLevel,
          [characterLevel]: hpThisLevel + 1,
        },
      });
    });
  };

  const removeHp = () => {
    if (hpThisLevel <= 0) return;
    const next = { ...progress.hpByLevel };
    if (hpThisLevel === 1) delete next[characterLevel];
    else next[characterLevel] = hpThisLevel - 1;
    update({ hpByLevel: next });
  };

  const upgradeAttackBase = () => {
    if (progress.attackBaseLevel >= MAX_ATTACK_BASE_LEVEL) return;
    const cost = attackBaseUpgradeCost(progress.attackBaseLevel);
    trySpend(cost, () =>
      update({ attackBaseLevel: progress.attackBaseLevel + 1 }),
    );
  };

  const downgradeAttackBase = () => {
    if (progress.attackBaseLevel <= 0) return;
    update({ attackBaseLevel: progress.attackBaseLevel - 1 });
  };

  const upgradeAttacksPerRound = () => {
    if (progress.attacksPerRoundLevel >= MAX_ATTACKS_PER_ROUND_LEVEL) return;
    trySpend(EVOLUTION_COSTS.attacksPerRoundLevel, () =>
      update({ attacksPerRoundLevel: progress.attacksPerRoundLevel + 1 }),
    );
  };

  const downgradeAttacksPerRound = () => {
    if (progress.attacksPerRoundLevel <= 0) return;
    update({ attacksPerRoundLevel: progress.attacksPerRoundLevel - 1 });
  };

  const upgradeBackstab = () => {
    trySpend(EVOLUTION_COSTS.backstabLevel, () =>
      update({ backstabLevel: progress.backstabLevel + 1 }),
    );
  };

  const downgradeBackstab = () => {
    if (progress.backstabLevel <= 0) return;
    update({ backstabLevel: progress.backstabLevel - 1 });
  };

  const totalHpPurchased = Object.values(progress.hpByLevel).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground text-xs">
        Compre pontos de vida, base de ataque e ataques por rodada com pontos de progressão.
        PV: 2 PP/ponto (máx. 12/nível). Base de ataque: nível anterior × 3.
      </p>

      <div className="space-y-2">
        <div className={rowCls}>
          <div>
            <div className="font-display text-xs tracking-wider uppercase text-foreground">
              Pontos de Vida
            </div>
            <div className="text-[11px] text-muted-foreground font-body">
              Nível {characterLevel}: {hpThisLevel}/{EVOLUTION_COSTS.maxHpPerLevel} · Total: {totalHpPurchased} PV
              · {hpCost} PP cada
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={removeHp} disabled={hpThisLevel <= 0}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-display font-bold tabular-nums">{hpThisLevel}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={addHp}
              disabled={
                hpThisLevel >= EVOLUTION_COSTS.maxHpPerLevel || availablePoints < hpCost
              }
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className={rowCls}>
          <div>
            <div className="font-display text-xs tracking-wider uppercase text-foreground">
              Base de Ataque
            </div>
            <div className="text-[11px] text-muted-foreground font-body">
              Nível {progress.attackBaseLevel}/{MAX_ATTACK_BASE_LEVEL}
              {progress.attackBaseLevel < MAX_ATTACK_BASE_LEVEL && (
                <> · Próximo: {attackBaseUpgradeCost(progress.attackBaseLevel)} PP</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={downgradeAttackBase} disabled={progress.attackBaseLevel <= 0}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-display font-bold tabular-nums">
              {progress.attackBaseLevel}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={upgradeAttackBase}
              disabled={
                progress.attackBaseLevel >= MAX_ATTACK_BASE_LEVEL ||
                availablePoints < attackBaseUpgradeCost(progress.attackBaseLevel)
              }
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className={rowCls}>
          <div>
            <div className="font-display text-xs tracking-wider uppercase text-foreground">
              Ataques por Rodada
            </div>
            <div className="text-[11px] text-muted-foreground font-body">
              Nível {progress.attacksPerRoundLevel}/{MAX_ATTACKS_PER_ROUND_LEVEL} · {EVOLUTION_COSTS.attacksPerRoundLevel} PP/nível
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="outline" className="h-7 w-7" onClick={downgradeAttacksPerRound} disabled={progress.attacksPerRoundLevel <= 0}>
              <Minus className="w-3 h-3" />
            </Button>
            <span className="w-8 text-center font-display font-bold tabular-nums">
              {progress.attacksPerRoundLevel}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={upgradeAttacksPerRound}
              disabled={
                progress.attacksPerRoundLevel >= MAX_ATTACKS_PER_ROUND_LEVEL ||
                availablePoints < EVOLUTION_COSTS.attacksPerRoundLevel
              }
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {hasBackstabAdvantage && (
          <div className={rowCls}>
            <div>
              <div className="font-display text-xs tracking-wider uppercase text-foreground">
                Ataque pelas Costas
              </div>
              <div className="text-[11px] text-muted-foreground font-body">
                Nível {progress.backstabLevel} · {EVOLUTION_COSTS.backstabLevel} PP/nível
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7" onClick={downgradeBackstab} disabled={progress.backstabLevel <= 0}>
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-8 text-center font-display font-bold tabular-nums">
                {progress.backstabLevel}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={upgradeBackstab}
                disabled={availablePoints < EVOLUTION_COSTS.backstabLevel}
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

export default EvolutionCombatPanel;
