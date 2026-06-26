import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { generalAdvantages, generalDisadvantages, type AdvantageOption } from "@/data/characterData";
import { raceClassAdvantages, categoryLabels, type RaceClassAdvantage } from "@/data/raceClassAdvantages";
import AdvantageDescription from "@/components/AdvantageDescription";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AdvCategory = RaceClassAdvantage["category"];

interface AdvantagesPanelProps {
  selected: string[];
  onToggle: (name: string, cost: number) => void;
  selectedRaceClassAdvantages: string[];
  onRaceClassToggle: (name: string, cost: number) => void;
  selectedRace: string;
  selectedClass: string;
  /** If provided, only these race/class categories will be rendered. */
  categoriesFilter?: AdvCategory[];
  /** Show the general advantages/disadvantages section. Default true. */
  showGeneral?: boolean;
  /** Show race/class-specific section. Default true. */
  showRaceClass?: boolean;
  /** Heading shown above race/class section. */
  raceClassHeading?: string;
  /** Total disadvantage points already committed (incl. classe social). */
  disadvantagePoints?: number;
  /** Maximum disadvantage points allowed. */
  maxDisadvantagePoints?: number;
}

const AdvantagesPanel = ({
  selected,
  onToggle,
  selectedRaceClassAdvantages,
  onRaceClassToggle,
  selectedRace,
  selectedClass,
  categoriesFilter,
  showGeneral = true,
  showRaceClass = true,
  raceClassHeading = "Vantagens por Raça & Classe",
  disadvantagePoints = 0,
  maxDisadvantagePoints,
}: AdvantagesPanelProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const wouldExceedDisadvantageLimit = (additional: number) =>
    maxDisadvantagePoints != null &&
    disadvantagePoints + additional > maxDisadvantagePoints;

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderGeneralItem = (item: AdvantageOption) => {
    const isSelected = selected.includes(item.name);
    const isAdv = item.type === "advantage";
    const blocked =
      !isSelected &&
      item.type === "disadvantage" &&
      wouldExceedDisadvantageLimit(Math.abs(item.cost));

    const button = (
      <button
        key={item.name}
        type="button"
        disabled={blocked}
        onClick={() => onToggle(item.name, item.cost)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left ${
          blocked
            ? "bg-card/20 border-border/40 text-muted-foreground/40 cursor-not-allowed"
            : isSelected
            ? isAdv
              ? "bg-gold/20 border-gold text-foreground"
              : "bg-blood/15 border-blood/50 text-foreground"
            : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
        }`}
      >
        <span
          className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
            isSelected
              ? isAdv
                ? "bg-gold border-gold"
                : "bg-blood border-blood"
              : "border-border"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </span>
        <span className="flex-1 truncate">{item.name}</span>
        <span
          className={`text-xs font-display ${
            item.cost > 0 ? "text-gold-dark" : "text-blood"
          }`}
        >
          {item.cost > 0 ? `+${item.cost}` : item.cost}
        </span>
      </button>
    );

    if (item.description || item.link) {
      return (
        <Tooltip key={item.name}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-md text-xs font-body">
            <AdvantageDescription
              description={item.description ?? ""}
              link={item.link}
              className=""
            />
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  const matchesRaceOf = (item: RaceClassAdvantage) =>
    !!item.applicableRaces?.some((r) => r === "Todas" || r === selectedRace);
  const matchesClassOf = (item: RaceClassAdvantage) =>
    !!item.applicableClasses?.some((c) => c === "Todas" || c === selectedClass);

  const getItemCost = (item: RaceClassAdvantage): number => {
    if (matchesRaceOf(item) || matchesClassOf(item)) return item.cost;
    return item.costOthers ?? item.cost;
  };

  const isAvailable = (item: RaceClassAdvantage): boolean => {
    if (matchesRaceOf(item) || matchesClassOf(item)) return true;
    return item.costOthers !== null;
  };


  const renderRaceClassItem = (item: RaceClassAdvantage) => {
    const available = isAvailable(item);
    const isSelected = selectedRaceClassAdvantages.includes(item.name);
    const isAdv = item.type === "advantage";
    const cost = getItemCost(item);
    const isNative = matchesRaceOf(item) || matchesClassOf(item);
    const blocked =
      !isSelected &&
      item.type === "disadvantage" &&
      wouldExceedDisadvantageLimit(Math.abs(cost));

    if (!available) return null;

    return (
      <Tooltip key={item.name}>
        <TooltipTrigger asChild>
          <button
            type="button"
            disabled={blocked}
            onClick={() => onRaceClassToggle(item.name, cost)}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left ${
              blocked
                ? "bg-card/20 border-border/40 text-muted-foreground/40 cursor-not-allowed"
                : isSelected
                ? isAdv
                  ? "bg-gold/20 border-gold text-foreground"
                  : "bg-blood/15 border-blood/50 text-foreground"
                : !isNative
                ? "bg-card/20 border-border/50 hover:bg-card/60 text-muted-foreground/70"
                : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? isAdv
                    ? "bg-gold border-gold"
                    : "bg-blood border-blood"
                  : "border-border"
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
            </span>
            <span className="flex-1 truncate text-xs">{item.name}</span>
            {!isNative && (
              <span className="text-[10px] text-muted-foreground/50 font-display">*</span>
            )}
            <span
              className={`text-xs font-display ${
                cost > 0 ? "text-gold-dark" : "text-blood"
              }`}
            >
              {cost > 0 ? `+${cost}` : cost}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md text-xs font-body space-y-1">
          <p className="font-semibold text-foreground">{item.name}</p>
          {(item.applicableRaces?.length || item.applicableClasses?.length) && (
            <p className="text-muted-foreground">
              {item.applicableRaces?.length ? `Raças: ${item.applicableRaces.join(", ")}` : ""}
              {item.applicableRaces?.length && item.applicableClasses?.length ? " · " : ""}
              {item.applicableClasses?.length ? `Classes: ${item.applicableClasses.join(", ")}` : ""}
            </p>
          )}
          <p className="text-muted-foreground">
            Custo p/ Classe/Raça: <span className="text-foreground font-semibold">{item.cost > 0 ? `+${item.cost}` : item.cost}</span>
            {item.costOthers !== null && (
              <> · Demais: <span className="text-foreground font-semibold">{item.costOthers > 0 ? `+${item.costOthers}` : item.costOthers}</span></>
            )}
          </p>
          {(item.description || item.link) && (
            <AdvantageDescription description={item.description} link={item.link} />
          )}
        </TooltipContent>
      </Tooltip>
    );
  };

  // Group race/class advantages by category
  const allCategories: AdvCategory[] = ["ofensivo", "defensivo", "magica", "outros", "aversao", "poder", "antecedente"];
  const categories = categoriesFilter ?? allCategories;
  const isFlatLayout = categoriesFilter?.length === 1;

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-4">
      {showGeneral && (
        <>
          {/* General Advantages */}
          <div>
            <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-2">
              Vantagens Gerais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {generalAdvantages.map(renderGeneralItem)}
            </div>
          </div>

          {/* General Disadvantages */}
          <div>
            <h3 className="font-display text-xs tracking-wider uppercase text-blood mb-2">
              Desvantagens Gerais
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {generalDisadvantages.map(renderGeneralItem)}
            </div>
          </div>
        </>
      )}

      {/* Race/Class Specific */}
      {showRaceClass && (
      <div className={showGeneral ? "border-t border-border pt-4" : ""}>
        <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-3">
          {raceClassHeading}
        </h3>
        <p className="text-xs text-muted-foreground mb-3 font-body">
          Raça: <span className="text-foreground font-semibold">{selectedRace}</span> · Classe: <span className="text-foreground font-semibold">{selectedClass}</span>
          <span className="ml-2 text-muted-foreground/60">(<span className="font-display">*</span> = custo diferente para outras raças/classes)</span>
        </p>

        <div className="space-y-1">
          {categories.map((cat) => {
            const items = raceClassAdvantages.filter(
              (a) => a.category === cat && isAvailable(a)
            );
            if (items.length === 0) return null;

            if (isFlatLayout) {
              return (
                <div key={cat} className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {items.map(renderRaceClassItem)}
                </div>
              );
            }

            const isOpen = openSections[cat] ?? false;
            const selectedCount = items.filter((i) =>
              selectedRaceClassAdvantages.includes(i.name)
            ).length;

            return (
              <Collapsible key={cat} open={isOpen} onOpenChange={() => toggleSection(cat)}>
                <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 rounded border border-border bg-card/40 hover:bg-card/80 transition-all">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gold" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-display text-xs tracking-wider uppercase text-foreground flex-1 text-left">
                    {categoryLabels[cat]}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">
                    {items.length} itens
                  </span>
                  {selectedCount > 0 && (
                    <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded font-display">
                      {selectedCount}
                    </span>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-2">
                    {items.map(renderRaceClassItem)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
      )}
    </div>
    </TooltipProvider>
  );
};

export default AdvantagesPanel;
