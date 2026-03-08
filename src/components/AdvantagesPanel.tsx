import { Check } from "lucide-react";
import { generalAdvantages, generalDisadvantages, type AdvantageOption } from "@/data/characterData";

interface AdvantagesPanelProps {
  selected: string[];
  onToggle: (name: string, cost: number) => void;
}

const AdvantagesPanel = ({ selected, onToggle }: AdvantagesPanelProps) => {
  const allItems = [...generalAdvantages, ...generalDisadvantages];

  const renderItem = (item: AdvantageOption) => {
    const isSelected = selected.includes(item.name);
    const isAdv = item.type === "advantage";

    return (
      <button
        key={item.name}
        onClick={() => onToggle(item.name, item.cost)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left ${
          isSelected
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
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-sm tracking-wider uppercase text-gold mb-2">
          Vantagens
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {generalAdvantages.map(renderItem)}
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm tracking-wider uppercase text-blood mb-2">
          Desvantagens
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {generalDisadvantages.map(renderItem)}
        </div>
      </div>
    </div>
  );
};

export default AdvantagesPanel;
