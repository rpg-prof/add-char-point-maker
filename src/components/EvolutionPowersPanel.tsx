import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getProgressPointsCost,
  isRaceClassAdvantageAvailable,
  raceClassAdvantages,
} from "@/data/raceClassAdvantages";
import AdvantageDescription from "@/components/AdvantageDescription";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EvolutionProgress } from "@/lib/evolutionProgress";
import { mergePowerLevels } from "@/lib/evolutionProgress";

interface EvolutionPowersPanelProps {
  selectedRace: string;
  selectedClass: string;
  selectedRaceClassAdv: string[];
  progress: EvolutionProgress;
  availablePoints: number;
  onChange: (progress: EvolutionProgress) => void;
}

function powerLevelUpgradeCost(powerName: string, currentLevel: number): number {
  const mult = powerName.toLowerCase().includes("dominar") ? 5 : 3;
  return currentLevel * mult;
}

const EvolutionPowersPanel = ({
  selectedRace,
  selectedClass,
  selectedRaceClassAdv,
  progress,
  availablePoints,
  onChange,
}: EvolutionPowersPanelProps) => {
  const powerLevels = mergePowerLevels(selectedRaceClassAdv, progress.powerLevels);

  const powers = raceClassAdvantages.filter(
    (a) =>
      a.category === "poder" &&
      isRaceClassAdvantageAvailable(a, selectedRace, selectedClass) &&
      getProgressPointsCost(a, selectedRace, selectedClass) != null,
  );

  const updatePowerLevel = (name: string, level: number) => {
    const next = { ...progress.powerLevels };
    if (level <= 0) delete next[name];
    else next[name] = level;
    onChange({ ...progress, powerLevels: next });
  };

  const acquirePower = (name: string, cost: number) => {
    if (cost > availablePoints) return;
    const alreadyFromCreation = selectedRaceClassAdv.includes(name);
    const alreadyEvo = progress.evolutionRaceClassAdv.includes(name);
    if (alreadyFromCreation || alreadyEvo) return;

    onChange({
      ...progress,
      evolutionRaceClassAdv: [...progress.evolutionRaceClassAdv, name],
      powerLevels: { ...progress.powerLevels, [name]: 1 },
    });
  };

  if (powers.length === 0) {
    return (
      <p className="font-body text-muted-foreground text-sm">
        Nenhum poder disponível para evolução com esta raça/classe.
      </p>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-3">
        <p className="font-body text-muted-foreground text-xs">
          Adquira novos poderes ou aumente o nível dos existentes com pontos de progressão.
          Cada poder tem custo de acesso e de progressão por nível.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {powers.map((item) => {
            const accessCost = getProgressPointsCost(item, selectedRace, selectedClass)!;
            const fromCreation = selectedRaceClassAdv.includes(item.name);
            const fromEvo = progress.evolutionRaceClassAdv.includes(item.name);
            const hasPower = fromCreation || fromEvo;
            const level = powerLevels[item.name] ?? (hasPower ? 1 : 0);
            const upgradeCost = level > 0 ? powerLevelUpgradeCost(item.name, level) : accessCost;

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border ${
                      hasPower
                        ? "bg-gold/15 border-gold/40 text-foreground"
                        : "bg-card/40 border-border text-muted-foreground"
                    }`}
                  >
                    {hasPower ? (
                      <Check className="w-4 h-4 text-gold shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-sm border border-border shrink-0" />
                    )}
                    <span className="flex-1 truncate text-xs">{item.name}</span>
                    {!hasPower ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-1.5 shrink-0"
                        disabled={availablePoints < accessCost}
                        onClick={() => acquirePower(item.name, accessCost)}
                      >
                        +{accessCost} PP
                      </Button>
                    ) : (
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          disabled={level <= 1 || (fromCreation && level <= 1)}
                          onClick={() => updatePowerLevel(item.name, level - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-5 text-center font-display text-xs font-bold tabular-nums">
                          {level}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          disabled={availablePoints < upgradeCost}
                          onClick={() => updatePowerLevel(item.name, level + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-md text-xs font-body space-y-1">
                  <p className="font-semibold">{item.name}</p>
                  <p>
                    Acesso: {accessCost} PP
                    {level > 0 && (
                      <> · Nível atual: {level} · Próximo: {upgradeCost} PP</>
                    )}
                  </p>
                  {fromCreation && (
                    <p className="text-muted-foreground">Adquirido na criação (nível base 1).</p>
                  )}
                  {(item.description || item.link) && (
                    <AdvantageDescription description={item.description} link={item.link} />
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EvolutionPowersPanel;
