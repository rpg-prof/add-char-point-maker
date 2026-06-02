import { Shield, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";

interface ResistancePanelProps {
  subAttributes: Record<string, number>;
  selectedRace: string;
  selectedClass: string;
  selectedRaceClassAdv: string[];
  onRaceClassToggle: (name: string, cost: number) => void;
}

// Constitution-based (Saúde): Veneno/Doenças
// Destreza (Equilíbrio): Calor
// Constituição (Condicionamento): Frio
// Sabedoria (Força de Vontade): Encantamento/Sono
// Inteligência (Conhecimento): Ilusões
const RESISTANCE_DEFS: { key: string; label: string; base: number; subAttr: string }[] = [
  { key: "veneno", label: "Veneno / Doenças", base: 20, subAttr: "Saúde" },
  { key: "calor", label: "Calor", base: 20, subAttr: "Equilíbrio" },
  { key: "frio", label: "Frio", base: 20, subAttr: "Condicionamento" },
  { key: "sono", label: "Encantamento / Sono", base: 15, subAttr: "Força de Vontade" },
  { key: "ilusoes", label: "Ilusões", base: 15, subAttr: "Conhecimento" },
  { key: "magia", label: "Magia", base: 15, subAttr: "Força de Vontade" },
];

function attrModifier(value: number): number {
  if (value <= 3) return -15;
  if (value === 4) return -10;
  if (value >= 5 && value <= 7) return -5;
  if (value >= 8 && value <= 14) return 0;
  if (value === 15) return 5;
  if (value === 16) return 10;
  if (value === 17) return 15;
  return 20; // 18+
}

// Mapping advantage name → which resistance key(s) it boosts and bonus calculation
function advantageBonus(name: string, subAttributes: Record<string, number>): Partial<Record<string, number>> {
  const tieredBonus = (val: number): number => {
    if (val >= 4 && val <= 6) return 5;
    if (val >= 7 && val <= 10) return 10;
    if (val >= 11 && val <= 13) return 15;
    if (val >= 14 && val <= 17) return 20;
    if (val >= 18) return 25;
    return 0;
  };
  switch (name) {
    case "Proteção contra magias de sono e feitiço (Raça)":
      return { sono: 30 };
    case "Resistência à magia (Raça)":
      return { magia: tieredBonus(subAttributes["Razão"] ?? 10) };
    case "Resistência à veneno (Raça)":
      return { veneno: tieredBonus(subAttributes["Saúde"] ?? 10) };
    case "Resistência à magias de sono e feitiço (Raça)":
      return { sono: tieredBonus(subAttributes["Força de Vontade"] ?? 10) };
    case "Resistência à ilusões (Raça)":
      return { ilusoes: tieredBonus(subAttributes["Conhecimento"] ?? 10) };
    case "Acreditar em ilusões":
      return { ilusoes: -15 };
    case "Resistência ao calor":
      return { calor: 5 };
    case "Resistência ao frio":
      return { frio: 5 };
    case "Resistência a ilusões (Classe)":
      return { ilusoes: 5 };
    case "Resistência a magia (Classe)":
      return { magia: 5 };
    case "Resistência ao Som":
      return {}; // separate resistance, not in our base list
    case "Resistência a sono e feitiço (Classe)":
      return { sono: 5 };
    case "Resistência a veneno (Classe)":
      return { veneno: 5 };
    case "Resistir a dreno de energia":
      return {}; // separate
    default:
      return {};
  }
}

const ResistancePanel = ({
  subAttributes,
  selectedRace,
  selectedClass,
  selectedRaceClassAdv,
  onRaceClassToggle,
}: ResistancePanelProps) => {
  const resistanceItems = raceClassAdvantages.filter((a) => a.category === "resistencia");

  const isAvailable = (item: typeof resistanceItems[number]): boolean => {
    const matchesRace = item.applicableRaces?.includes(selectedRace);
    const matchesClass = item.applicableClasses?.includes(selectedClass);
    if (matchesRace || matchesClass) return true;
    return item.costOthers !== null;
  };

  const getItemCost = (item: typeof resistanceItems[number]): number => {
    const matchesRace = item.applicableRaces?.includes(selectedRace);
    const matchesClass = item.applicableClasses?.includes(selectedClass);
    if (matchesRace || matchesClass) return item.cost;
    return item.costOthers ?? item.cost;
  };

  // Compute totals
  const totals = RESISTANCE_DEFS.map((def) => {
    const subVal = subAttributes[def.subAttr] ?? 10;
    const attrMod = attrModifier(subVal);
    let bonus = 0;
    for (const advName of selectedRaceClassAdv) {
      const b = advantageBonus(advName, subAttributes)[def.key];
      if (b) bonus += b;
    }
    const total = def.base + attrMod + bonus;
    return { ...def, subVal, attrMod, bonus, total };
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Resistance values */}
        <div>
          <h3 className="font-display text-sm tracking-wider uppercase text-gold mb-3">
            <Shield className="w-4 h-4 inline mr-1" />
            Resistências Calculadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {totals.map((r) => (
              <div
                key={r.key}
                className="rounded border border-border bg-card/40 px-3 py-2 flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm text-foreground">{r.label}</span>
                  <span className="font-display text-xl font-bold text-gold">{r.total}%</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-body mt-1">
                  Base {r.base}% · {r.subAttr}({r.subVal}) {r.attrMod >= 0 ? "+" : ""}{r.attrMod}%
                  {r.bonus !== 0 && (
                    <> · Vant. {r.bonus >= 0 ? "+" : ""}{r.bonus}%</>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-body mt-2">
            Valor base + modificador da habilidade + vantagens/desvantagens.
          </p>
        </div>

        {/* Resistance advantages */}
        <div>
          <h3 className="font-display text-sm tracking-wider uppercase text-gold mb-2">
            Vantagens & Desvantagens de Resistência
          </h3>
          <p className="text-xs text-muted-foreground font-body mb-3">
            Raça: <span className="text-foreground font-semibold">{selectedRace}</span> · Classe: <span className="text-foreground font-semibold">{selectedClass}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {resistanceItems.map((item) => {
              if (!isAvailable(item)) return null;
              const isSelected = selectedRaceClassAdv.includes(item.name);
              const isAdv = item.type === "advantage";
              const cost = getItemCost(item);
              const matchesRace = item.applicableRaces?.includes(selectedRace);
              const matchesClass = item.applicableClasses?.includes(selectedClass);
              const isNative = matchesRace || matchesClass;

              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onRaceClassToggle(item.name, cost)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left ${
                        isSelected
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
                      <span className={`text-xs font-display ${cost > 0 ? "text-gold-dark" : "text-blood"}`}>
                        {cost > 0 ? `+${cost}` : cost}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm text-xs font-body">
                    <p className="font-semibold text-foreground mb-1">{item.name}</p>
                    <p className="text-muted-foreground">{item.description}</p>
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
