import { useState } from "react";
import { Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { attributeNames, attributeCosts, type AttributeName } from "@/data/characterData";
import {
  subAttributeMap,
  getSubAttributeBonuses,
  type SubAttributeName,
} from "@/data/subAttributes";

export type SubAttributes = Record<string, number>;

interface AttributePanelProps {
  attributes: Record<AttributeName, number>;
  subAttributes: SubAttributes;
  onChange: (attr: AttributeName, value: number) => void;
  onSubChange: (subAttr: string, value: number) => void;
}

const AttributePanel = ({ attributes, subAttributes, onChange, onSubChange }: AttributePanelProps) => {
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);

  const totalCost = Object.entries(attributes).reduce(
    (sum, [, val]) => sum + val,
    0
  );

  const handleMainChange = (attr: AttributeName, newValue: number) => {
    const oldValue = attributes[attr];
    const def = subAttributeMap.find((d) => d.main === attr);
    if (!def) return;

    onChange(attr, newValue);

    // Reset sub-attributes to equal the new main value
    const diff = newValue - oldValue;
    const oldSub1 = subAttributes[def.sub1] ?? oldValue;
    const oldSub2 = subAttributes[def.sub2] ?? oldValue;
    // Keep the ratio but clamp
    let newSub1 = oldSub1 + diff;
    let newSub2 = oldSub2;
    // Ensure sum = 2 * newValue
    const targetSum = newValue * 2;
    const currentSum = newSub1 + newSub2;
    if (currentSum !== targetSum) {
      newSub2 = targetSum - newSub1;
    }
    // Clamp both within +/-2 of main
    newSub1 = Math.max(newValue - 2, Math.min(newValue + 2, newSub1));
    newSub2 = targetSum - newSub1;
    if (newSub2 < newValue - 2 || newSub2 > newValue + 2) {
      newSub2 = Math.max(newValue - 2, Math.min(newValue + 2, newSub2));
      newSub1 = targetSum - newSub2;
    }
    // Final clamp to 3-18
    newSub1 = Math.max(3, Math.min(18, newSub1));
    newSub2 = Math.max(3, Math.min(18, newSub2));

    onSubChange(def.sub1, newSub1);
    onSubChange(def.sub2, newSub2);
  };

  const handleSubAttrChange = (attr: AttributeName, subName: string, delta: number) => {
    const def = subAttributeMap.find((d) => d.main === attr);
    if (!def) return;

    const mainVal = attributes[attr];
    const otherSub = subName === def.sub1 ? def.sub2 : def.sub1;
    const currentVal = subAttributes[subName] ?? mainVal;
    const otherVal = subAttributes[otherSub] ?? mainVal;

    const newVal = currentVal + delta;
    const newOther = otherVal - delta;

    // Constraints: within +/-2 of main, 3-18 range
    if (newVal < mainVal - 2 || newVal > mainVal + 2) return;
    if (newOther < mainVal - 2 || newOther > mainVal + 2) return;
    if (newVal < 3 || newVal > 18 || newOther < 3 || newOther > 18) return;

    onSubChange(subName, newVal);
    onSubChange(otherSub, newOther);
  };

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
          const def = subAttributeMap.find((d) => d.main === attr)!;
          const isExpanded = expandedAttr === attr;

          return (
            <div key={attr} className="rounded-md bg-card/60 border border-border overflow-hidden">
              {/* Main attribute row */}
              <div className="flex items-center gap-3 px-3 py-2">
                <button
                  onClick={() => setExpandedAttr(isExpanded ? null : attr)}
                  className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <span className="font-display text-sm w-24 tracking-wide">{attr}</span>

                <button
                  onClick={() => handleMainChange(attr, Math.max(3, value - 1))}
                  disabled={value <= 3}
                  className="w-7 h-7 rounded flex items-center justify-center bg-parchment-dark/10 border border-border hover:bg-parchment-dark/20 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="font-display text-lg w-8 text-center font-bold text-foreground">
                  {value}
                </span>

                <button
                  onClick={() => handleMainChange(attr, Math.min(18, value + 1))}
                  disabled={value >= 18}
                  className="w-7 h-7 rounded flex items-center justify-center bg-parchment-dark/10 border border-border hover:bg-parchment-dark/20 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs text-muted-foreground ml-auto font-body">
                  Custo: {cost}
                </span>
              </div>

              {/* Sub-attributes */}
              {isExpanded && (
                <div className="border-t border-border bg-background/30 px-3 py-2 space-y-2">
                  {[def.sub1, def.sub2].map((subName) => {
                    const subVal = subAttributes[subName] ?? value;
                    const bonuses = getSubAttributeBonuses(subName as SubAttributeName, subVal);

                    return (
                      <div key={subName} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-body text-xs text-muted-foreground w-32 truncate" title={subName}>
                            {subName}
                          </span>

                          <button
                            onClick={() => handleSubAttrChange(attr, subName, -1)}
                            disabled={subVal <= value - 2 || subVal <= 3}
                            className="w-6 h-6 rounded flex items-center justify-center bg-parchment-dark/10 border border-border hover:bg-parchment-dark/20 disabled:opacity-30 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <span className="font-display text-sm w-6 text-center font-bold text-foreground">
                            {subVal}
                          </span>

                          <button
                            onClick={() => handleSubAttrChange(attr, subName, 1)}
                            disabled={subVal >= value + 2 || subVal >= 18}
                            className="w-6 h-6 rounded flex items-center justify-center bg-parchment-dark/10 border border-border hover:bg-parchment-dark/20 disabled:opacity-30 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          <span className="text-[10px] text-gold/80 ml-1">
                            ({subVal - value >= 0 ? "+" : ""}{subVal - value})
                          </span>
                        </div>

                        {/* Bonuses from lookup table */}
                        {Object.keys(bonuses).length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 pl-[136px]">
                            {Object.entries(bonuses).map(([key, val]) => (
                              <span key={key} className="text-[10px] font-body text-muted-foreground">
                                <span className="text-foreground/60">{key}:</span>{" "}
                                <span className={val.startsWith("+") ? "text-gold" : val.startsWith("-") ? "text-blood" : ""}>
                                  {val}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttributePanel;
