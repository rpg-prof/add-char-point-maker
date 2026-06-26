import { Shield, Minus, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AdvantageDescription from "@/components/AdvantageDescription";
import { raceClassAdvantages, type RaceClassAdvantage } from "@/data/raceClassAdvantages";
import { computeResistanceBreakdown } from "@/lib/resistanceStats";

interface ResistancePanelProps {
  subAttributes: Record<string, number>;
  selectedRace: string;
  selectedClass: string;
  selectedRaceClassAdv: string[];
  onAddResistance: (name: string, cost: number) => void;
  onRemoveResistance: (name: string) => void;
}

const ResistancePanel = ({
  subAttributes,
  selectedRace,
  selectedClass,
  selectedRaceClassAdv,
  onAddResistance,
  onRemoveResistance,
}: ResistancePanelProps) => {
  const resistanceItems = raceClassAdvantages.filter((a) => a.category === "resistencia");

  const matchesRaceOf = (item: RaceClassAdvantage) =>
    !!item.applicableRaces?.some((r) => r === "Todas" || r === selectedRace);
  const matchesClassOf = (item: RaceClassAdvantage) =>
    !!item.applicableClasses?.some((c) => c === "Todas" || c === selectedClass);

  const isAvailable = (item: RaceClassAdvantage): boolean => {
    if (matchesRaceOf(item) || matchesClassOf(item)) return true;
    return item.costOthers !== null;
  };

  const getItemCost = (item: RaceClassAdvantage): number => {
    if (matchesRaceOf(item) || matchesClassOf(item)) return item.cost;
    return item.costOthers ?? item.cost;
  };

  const countOf = (name: string) => selectedRaceClassAdv.filter((n) => n === name).length;

  const totals = computeResistanceBreakdown({ subAttributes, selectedRaceClassAdv });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        <div>
          <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-3">
            <Shield className="w-4 h-4 inline mr-1" />
            Resistências Calculadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {totals.map((r) => (
              <div key={r.key} className="rounded border border-border bg-card/40 px-3 py-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm text-foreground">{r.label}</span>
                  <span className="font-display text-lg font-bold text-gold">{r.total}%</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-body mt-1">
                  Base {r.base}% · {r.subAttr}({r.subVal}) {r.attrMod >= 0 ? "+" : ""}{r.attrMod}%
                  {r.bonus !== 0 && (<> · Vant. {r.bonus >= 0 ? "+" : ""}{r.bonus}%</>)}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-body mt-2">
            Valor base + modificador da habilidade + vantagens/desvantagens.
          </p>
        </div>

        <div>
          <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-2">
            Vantagens & Desvantagens de Resistência
          </h3>
          <p className="text-xs text-muted-foreground font-body mb-3">
            Raça: <span className="text-foreground font-semibold">{selectedRace}</span> · Classe: <span className="text-foreground font-semibold">{selectedClass}</span>
            <span className="ml-2 text-muted-foreground/60">(<span className="font-display">*</span> = custo diferente para outras raças/classes)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {resistanceItems.map((item) => {
              if (!isAvailable(item)) return null;
              const cost = getItemCost(item);
              const isNative = matchesRaceOf(item) || matchesClassOf(item);
              const isAdv = item.type === "advantage";
              const count = countOf(item.name);
              const max = item.maxPurchases ?? 1;
              const canAdd = count < max;
              const canRemove = count > 0;
              const isActive = count > 0;

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <div
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all ${
                        isActive
                          ? isAdv
                            ? "bg-gold/20 border-gold text-foreground"
                            : "bg-blood/15 border-blood/50 text-foreground"
                          : !isNative
                          ? "bg-card/20 border-border/50 text-muted-foreground/70"
                          : "bg-card/40 border-border text-muted-foreground"
                      }`}
                    >
                      <span className="flex-1 truncate text-xs">{item.name}</span>
                      {!isNative && <span className="text-[10px] text-muted-foreground/50 font-display">*</span>}
                      <span className={`text-xs font-display ${cost > 0 ? "text-gold-dark" : "text-blood"}`}>
                        {cost > 0 ? `+${cost}` : cost}
                      </span>
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          disabled={!canRemove}
                          onClick={() => onRemoveResistance(item.name)}
                          className="w-5 h-5 rounded border border-border bg-card/60 flex items-center justify-center hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Remover"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-display text-xs w-4 text-center">
                          {count}{max > 1 ? `/${max}` : ""}
                        </span>
                        <button
                          type="button"
                          disabled={!canAdd}
                          onClick={() => onAddResistance(item.name, cost)}
                          className="w-5 h-5 rounded border border-border bg-card/60 flex items-center justify-center hover:bg-card disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Adicionar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-md text-xs font-body">
                    <p className="font-semibold text-foreground mb-1">{item.name}</p>
                    <AdvantageDescription
                      description={item.description}
                      link={item.link}
                      className="text-muted-foreground"
                    />
                    {item.costOthers !== null && (
                      <p className="text-muted-foreground mt-1">
                        Custo p/ Classe/Raça: <span className="text-foreground font-semibold">{item.cost > 0 ? `+${item.cost}` : item.cost}</span>
                        {" · Demais: "}<span className="text-foreground font-semibold">{item.costOthers > 0 ? `+${item.costOthers}` : item.costOthers}</span>
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ResistancePanel;
