import type { AttributeName } from "@/data/characterData";
import { subAttributeMap } from "@/data/subAttributes";

interface PlayAttributesPanelProps {
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
}

const PlayAttributesPanel = ({ attributes, subAttributes }: PlayAttributesPanelProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
      {subAttributeMap.map(({ main, sub1, sub2 }) => {
        const mainVal = attributes[main as AttributeName];
        const sub1Val = subAttributes[sub1] ?? mainVal;
        const sub2Val = subAttributes[sub2] ?? mainVal;
        return (
          <div
            key={main}
            className="rounded-lg border border-border/60 bg-background/50 px-3 py-2.5 hover:border-gold/30 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-display text-xs tracking-wide text-foreground truncate">{main}</span>
              <span className="font-display text-xl font-bold text-gold tabular-nums leading-none">
                {mainVal}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between gap-2 text-[11px] font-body">
                <span className="text-muted-foreground truncate">{sub2}</span>
                <span className="tabular-nums text-foreground/80 font-medium">{sub2Val}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-body">
                <span className="text-muted-foreground truncate">{sub1}</span>
                <span className="tabular-nums text-foreground/80 font-medium">{sub1Val}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayAttributesPanel;
