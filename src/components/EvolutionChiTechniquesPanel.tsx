import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CHI_TECHNIQUES,
  getChiTechniqueCost,
} from "@/data/chiTechniques";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { EvolutionProgress } from "@/lib/evolutionProgress";

interface EvolutionChiTechniquesPanelProps {
  selectedClass: string;
  progress: EvolutionProgress;
  availablePoints: number;
  onChange: (progress: EvolutionProgress) => void;
}

const EvolutionChiTechniquesPanel = ({
  selectedClass,
  progress,
  availablePoints,
  onChange,
}: EvolutionChiTechniquesPanelProps) => {
  const owned = new Set(progress.chiTechniques);
  const isMonk = selectedClass === "Monge";

  const toggle = (name: string, cost: number) => {
    if (owned.has(name)) {
      onChange({
        ...progress,
        chiTechniques: progress.chiTechniques.filter((n) => n !== name),
      });
      return;
    }
    if (cost > availablePoints) return;
    onChange({
      ...progress,
      chiTechniques: [...progress.chiTechniques, name],
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-2">
        <div>
          <h3 className="font-display text-xs tracking-wider uppercase text-foreground">
            Técnicas de Chi
          </h3>
          <p className="font-body text-muted-foreground text-[11px] mt-0.5">
            Compre com pontos de progressão
            {isMonk ? " (custo de Monge)" : " (custo demais classes)"}.
            Ativação usa pontos de Chi em jogo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[42vh] overflow-y-auto pr-1">
          {CHI_TECHNIQUES.map((tech) => {
            const cost = getChiTechniqueCost(tech, selectedClass);
            const has = owned.has(tech.name);
            const chiLabel =
              tech.chiCost == null ? "Passiva" : `${tech.chiCost} Chi`;

            return (
              <Tooltip key={tech.name}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border ${
                      has
                        ? "bg-gold/15 border-gold/40 text-foreground"
                        : "bg-card/40 border-border text-muted-foreground"
                    }`}
                  >
                    {has ? (
                      <Check className="w-4 h-4 text-gold shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-sm border border-border shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs">{tech.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {chiLabel}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] px-1.5 shrink-0"
                      disabled={!has && availablePoints < cost}
                      onClick={() => toggle(tech.name, cost)}
                    >
                      {has ? "Remover" : `+${cost} PP`}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-xs font-body space-y-1">
                  <p className="font-semibold">{tech.name}</p>
                  <p>
                    {cost} PP · {chiLabel}
                    {!isMonk && (
                      <span className="text-muted-foreground">
                        {" "}
                        (Monge: {tech.costNative} PP)
                      </span>
                    )}
                  </p>
                  <p>{tech.summary}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EvolutionChiTechniquesPanel;
