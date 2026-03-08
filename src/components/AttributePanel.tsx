import { Minus, Plus } from "lucide-react";
import { attributeNames, attributeCosts, type AttributeName } from "@/data/characterData";

interface AttributePanelProps {
  attributes: Record<AttributeName, number>;
  onChange: (attr: AttributeName, value: number) => void;
}

const AttributePanel = ({ attributes, onChange }: AttributePanelProps) => {
  const totalCost = Object.entries(attributes).reduce(
    (sum, [, val]) => sum + (attributeCosts[val] ?? 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg tracking-wider text-foreground">Atributos</h2>
        <span className="font-display text-sm text-gold">
          Gastos: {totalCost} / 75
        </span>
      </div>

      <div className="grid gap-2">
        {attributeNames.map((attr) => {
          const value = attributes[attr];
          const cost = attributeCosts[value] ?? 0;

          return (
            <div
              key={attr}
              className="flex items-center gap-3 rounded-md bg-card/60 border border-border px-3 py-2"
            >
              <span className="font-display text-sm w-28 tracking-wide">{attr}</span>
              
              <button
                onClick={() => onChange(attr, Math.max(3, value - 1))}
                disabled={value <= 3}
                className="w-7 h-7 rounded flex items-center justify-center bg-parchment-dark/10 border border-border hover:bg-parchment-dark/20 disabled:opacity-30 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <span className="font-display text-lg w-8 text-center font-bold text-foreground">
                {value}
              </span>

              <button
                onClick={() => onChange(attr, Math.min(18, value + 1))}
                disabled={value >= 18}
                className="w-7 h-7 rounded flex items-center justify-center bg-parchment-dark/10 border border-border hover:bg-parchment-dark/20 disabled:opacity-30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <span className="text-xs text-muted-foreground ml-auto font-body">
                Custo: {cost}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttributePanel;
