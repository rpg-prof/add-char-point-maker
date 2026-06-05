import type { ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { attributeNames, type AttributeName } from "@/data/characterData";
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

const btnCls =
  "w-7 h-7 rounded flex items-center justify-center bg-parchment-dark/10 border border-border hover:bg-parchment-dark/20 disabled:opacity-30 transition-colors shrink-0";

const labelCls =
  "font-display text-sm tracking-wide text-foreground truncate w-[9rem] shrink-0";

const AttributePanel = ({ attributes, subAttributes, onChange, onSubChange }: AttributePanelProps) => {
  const totalCost = Object.entries(attributes).reduce((sum, [, val]) => sum + val, 0);

  const handleMainChange = (attr: AttributeName, newValue: number) => {
    const oldValue = attributes[attr];
    const def = subAttributeMap.find((d) => d.main === attr);
    if (!def) return;

    onChange(attr, newValue);

    const diff = newValue - oldValue;
    const oldSub1 = subAttributes[def.sub1] ?? oldValue;
    const oldSub2 = subAttributes[def.sub2] ?? oldValue;
    let newSub1 = oldSub1 + diff;
    let newSub2 = oldSub2;
    const targetSum = newValue * 2;
    const currentSum = newSub1 + newSub2;
    if (currentSum !== targetSum) {
      newSub2 = targetSum - newSub1;
    }
    newSub1 = Math.max(newValue - 2, Math.min(newValue + 2, newSub1));
    newSub2 = targetSum - newSub1;
    if (newSub2 < newValue - 2 || newSub2 > newValue + 2) {
      newSub2 = Math.max(newValue - 2, Math.min(newValue + 2, newSub2));
      newSub1 = targetSum - newSub2;
    }
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

    if (newVal < mainVal - 2 || newVal > mainVal + 2) return;
    if (newOther < mainVal - 2 || newOther > mainVal + 2) return;
    if (newVal < 3 || newVal > 18 || newOther < 3 || newOther > 18) return;

    onSubChange(subName, newVal);
    onSubChange(otherSub, newOther);
  };

  const renderBonuses = (subName: SubAttributeName, subVal: number) => {
    const bonuses = getSubAttributeBonuses(subName, subVal);
    if (Object.keys(bonuses).length === 0) return null;

    return (
      <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5">
        {Object.entries(bonuses).map(([key, val]) => (
          <span key={key} className="text-[10px] font-body text-muted-foreground leading-tight whitespace-nowrap">
            <span className="text-foreground/55">{key}:</span>{" "}
            <span
              className={
                val.startsWith("+") ? "text-gold" : val.startsWith("-") ? "text-blood" : "text-foreground/80"
              }
            >
              {val}
            </span>
          </span>
        ))}
      </div>
    );
  };

  const renderColumn = (
    label: string,
    value: number,
    onDec: () => void,
    onInc: () => void,
    decDisabled: boolean,
    incDisabled: boolean,
    bonuses?: ReactNode,
    deltaFromMain?: number
  ) => (
    <div className="min-w-0">
      <div className="grid grid-cols-[9rem_1.75rem_1.75rem_1.75rem_auto] gap-x-1.5 items-center">
        <span className={labelCls} title={label}>
          {label}
        </span>
        <button type="button" onClick={onDec} disabled={decDisabled} className={btnCls}>
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="font-display text-lg text-center font-bold text-foreground tabular-nums">
          {value}
        </span>
        <button type="button" onClick={onInc} disabled={incDisabled} className={btnCls}>
          <Plus className="w-3.5 h-3.5" />
        </button>
        {deltaFromMain !== undefined && deltaFromMain !== 0 ? (
          <span className="text-[10px] text-gold/80 font-body whitespace-nowrap">
            ({deltaFromMain >= 0 ? "+" : ""}
            {deltaFromMain})
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
      {bonuses && <div className="pl-[calc(9rem+0.375rem)]">{bonuses}</div>}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg tracking-wider text-foreground">Atributos</h2>
        <span className="font-display text-sm text-gold">Gastos: {totalCost} / 75</span>
      </div>

      <div className="grid gap-3">
        {attributeNames.map((attr) => {
          const value = attributes[attr];
          const def = subAttributeMap.find((d) => d.main === attr)!;
          const sub1Val = subAttributes[def.sub1] ?? value;
          const sub2Val = subAttributes[def.sub2] ?? value;

          return (
            <div key={attr} className="rounded-md bg-card/60 border border-border px-3 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                {renderColumn(
                  attr,
                  value,
                  () => handleMainChange(attr, Math.max(3, value - 1)),
                  () => handleMainChange(attr, Math.min(18, value + 1)),
                  value <= 3,
                  value >= 18
                )}

                {renderColumn(
                  def.sub2,
                  sub2Val,
                  () => handleSubAttrChange(attr, def.sub2, -1),
                  () => handleSubAttrChange(attr, def.sub2, 1),
                  sub2Val <= value - 2 || sub2Val <= 3,
                  sub2Val >= value + 2 || sub2Val >= 18,
                  renderBonuses(def.sub2 as SubAttributeName, sub2Val),
                  sub2Val - value
                )}

                {renderColumn(
                  def.sub1,
                  sub1Val,
                  () => handleSubAttrChange(attr, def.sub1, -1),
                  () => handleSubAttrChange(attr, def.sub1, 1),
                  sub1Val <= value - 2 || sub1Val <= 3,
                  sub1Val >= value + 2 || sub1Val >= 18,
                  renderBonuses(def.sub1 as SubAttributeName, sub1Val),
                  sub1Val - value
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttributePanel;
