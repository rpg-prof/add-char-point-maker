import type { AttributeName } from "@/data/characterData";
import { subAttributeMap } from "@/data/subAttributes";

interface PlayAttributesPanelProps {
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
}

const PlayAttributesPanel = ({ attributes, subAttributes }: PlayAttributesPanelProps) => {
  return (
    <div className="space-y-1">
      {subAttributeMap.map(({ main, sub1, sub2 }) => {
        const mainVal = attributes[main as AttributeName];
        const sub1Val = subAttributes[sub1] ?? mainVal;
        const sub2Val = subAttributes[sub2] ?? mainVal;
        return (
          <div
            key={main}
            className="rounded-md border border-border/55 bg-gradient-to-r from-background/70 to-background/30 px-2.5 py-1.5"
          >
            <div className="flex items-center justify-between gap-2 leading-none">
              <span className="font-display text-meta tracking-wider uppercase text-foreground/90 truncate">
                {main}
              </span>
              <span className="font-display text-stat font-bold text-gold tabular-nums">
                {mainVal}
              </span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1 text-micro font-body text-muted-foreground leading-tight">
              <span className="truncate">
                {sub2}{" "}
                <span className="tabular-nums text-foreground/75 font-medium">{sub2Val}</span>
              </span>
              <span className="truncate text-right">
                {sub1}{" "}
                <span className="tabular-nums text-foreground/75 font-medium">{sub1Val}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayAttributesPanel;
