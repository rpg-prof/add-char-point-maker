import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EVOLUTION_COSTS } from "@/data/characterEvolution";
import {
  getResistancePurchasedAtLevel,
  getTotalEvolutionResistanceBonus,
  type EvolutionProgress,
} from "@/lib/evolutionProgress";
import { computeResistanceBreakdown, RESISTANCE_DEFS } from "@/lib/resistanceStats";

interface EvolutionResistancePanelProps {
  characterLevel: number;
  progress: EvolutionProgress;
  availablePoints: number;
  subAttributes: Record<string, number>;
  selectedRaceClassAdv: string[];
  onChange: (progress: EvolutionProgress) => void;
}

const rowCls =
  "flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card/30 px-3 py-2.5";

const EvolutionResistancePanel = ({
  characterLevel,
  progress,
  availablePoints,
  subAttributes,
  selectedRaceClassAdv,
  onChange,
}: EvolutionResistancePanelProps) => {
  const spendableLevels = useMemo(() => {
    const levels: number[] = [];
    for (let level = 2; level <= characterLevel; level++) levels.push(level);
    return levels;
  }, [characterLevel]);

  const [selectedLevel, setSelectedLevel] = useState(() =>
    Math.max(2, characterLevel),
  );

  useEffect(() => {
    if (spendableLevels.length === 0) return;
    if (!spendableLevels.includes(selectedLevel)) {
      setSelectedLevel(spendableLevels[spendableLevels.length - 1]);
    }
  }, [selectedLevel, spendableLevels]);

  const evolutionBonuses = useMemo(() => {
    const map: Record<string, number> = {};
    for (const def of RESISTANCE_DEFS) {
      map[def.key] = getTotalEvolutionResistanceBonus(progress, def.key);
    }
    return map;
  }, [progress]);

  const breakdown = useMemo(
    () =>
      computeResistanceBreakdown({
        subAttributes,
        selectedRaceClassAdv,
        evolutionResistanceBonus: evolutionBonuses,
      }),
    [subAttributes, selectedRaceClassAdv, evolutionBonuses],
  );

  const update = (patch: Partial<EvolutionProgress>) =>
    onChange({ ...progress, ...patch });

  const trySpend = (cost: number, action: () => void) => {
    if (cost > availablePoints) return;
    action();
  };

  const addResistance = (key: string) => {
    const current = getResistancePurchasedAtLevel(progress, key, selectedLevel);
    if (current >= EVOLUTION_COSTS.maxResistancePercentPerLevel) return;
    trySpend(EVOLUTION_COSTS.resistancePerPercent, () => {
      update({
        resistanceByLevel: {
          ...progress.resistanceByLevel,
          [key]: {
            ...(progress.resistanceByLevel[key] ?? {}),
            [selectedLevel]: current + 1,
          },
        },
      });
    });
  };

  const removeResistance = (key: string) => {
    const current = getResistancePurchasedAtLevel(progress, key, selectedLevel);
    if (current <= 0) return;
    const nextLevel = { ...(progress.resistanceByLevel[key] ?? {}) };
    if (current === 1) delete nextLevel[selectedLevel];
    else nextLevel[selectedLevel] = current - 1;

    const next = { ...progress.resistanceByLevel };
    if (Object.keys(nextLevel).length === 0) delete next[key];
    else next[key] = nextLevel;

    update({ resistanceByLevel: next });
  };

  if (characterLevel < 2) {
    return (
      <p className="font-body text-muted-foreground text-xs">
        Suba para o nível 2 ou superior para melhorar resistências com pontos de progressão.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground text-xs">
        +1% por ponto de progressão, máximo 5% por resistência por nível.
        Compras são registradas por nível alcançado.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
          Nível da compra
        </span>
        <div className="flex flex-wrap gap-1">
          {spendableLevels.map((level) => (
            <Button
              key={level}
              size="sm"
              variant={selectedLevel === level ? "default" : "outline"}
              className={`h-7 px-2.5 text-xs font-display ${
                selectedLevel === level ? "bg-gold text-parchment-dark hover:bg-gold-glow" : ""
              }`}
              onClick={() => setSelectedLevel(level)}
            >
              {level}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-2">
          <Shield className="w-4 h-4 inline mr-1" />
          Resistências (total com evolução)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {breakdown.map((r) => (
            <div key={r.key} className="rounded border border-border bg-card/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-foreground">{r.label}</span>
                <span className="font-display text-lg font-bold text-gold">{r.total}%</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-body mt-1">
                Base {r.base}% · {r.subAttr}({r.subVal}) {r.attrMod >= 0 ? "+" : ""}{r.attrMod}%
                {r.bonus !== 0 && <> · Vant. {r.bonus >= 0 ? "+" : ""}{r.bonus}%</>}
                {r.evolutionBonus > 0 && <> · Evol. +{r.evolutionBonus}%</>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-xs tracking-wider uppercase text-gold">
          Compras no nível {selectedLevel}
        </h3>
        {breakdown.map((r) => {
          const atLevel = getResistancePurchasedAtLevel(progress, r.key, selectedLevel);
          const totalEvo = evolutionBonuses[r.key] ?? 0;
          return (
            <div key={r.key} className={rowCls}>
              <div>
                <div className="font-display text-xs tracking-wider uppercase text-foreground">
                  {r.label}
                </div>
                <div className="text-[11px] text-muted-foreground font-body">
                  Nível {selectedLevel}: {atLevel}/{EVOLUTION_COSTS.maxResistancePercentPerLevel}%
                  · Total evolução: +{totalEvo}% · {EVOLUTION_COSTS.resistancePerPercent} PP/%
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => removeResistance(r.key)}
                  disabled={atLevel <= 0}
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="font-display text-sm w-8 text-center tabular-nums">
                  +{atLevel}%
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={() => addResistance(r.key)}
                  disabled={
                    atLevel >= EVOLUTION_COSTS.maxResistancePercentPerLevel ||
                    availablePoints < EVOLUTION_COSTS.resistancePerPercent
                  }
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

export default EvolutionResistancePanel;
