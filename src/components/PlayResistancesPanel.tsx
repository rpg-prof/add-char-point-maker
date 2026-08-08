import { computeResistanceBreakdown } from "@/lib/resistanceStats";

function formatSigned(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

interface PlayResistancesPanelProps {
  subAttributes: Record<string, number>;
  selectedRaceClassAdv: string[];
  evolutionResistanceBonus?: Record<string, number>;
}

const PlayResistancesPanel = ({
  subAttributes,
  selectedRaceClassAdv,
  evolutionResistanceBonus,
}: PlayResistancesPanelProps) => {
  const resistances = computeResistanceBreakdown({
    subAttributes,
    selectedRaceClassAdv,
    evolutionResistanceBonus,
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {resistances.map((r) => {
        const barWidth = Math.min(100, Math.max(0, r.total));
        const isNegative = r.total < 0;
        return (
          <div
            key={r.key}
            className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-2"
            title={`Base ${r.base}% · ${r.subAttr}(${r.subVal}) ${formatSigned(r.attrMod)}%${
              r.bonus !== 0 ? ` · Vant. ${formatSigned(r.bonus)}%` : ""
            }${r.evolutionBonus !== 0 ? ` · Evol. ${formatSigned(r.evolutionBonus)}%` : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-[10px] leading-tight text-foreground/85 line-clamp-2">
                {r.label}
              </span>
              <span
                className={`font-display text-sm font-bold tabular-nums leading-none shrink-0 ${
                  isNegative ? "text-blood" : "text-gold"
                }`}
              >
                {r.total}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted/40 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isNegative ? "bg-blood/70" : "bg-gold/70"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground font-body mt-1 leading-tight truncate">
              {r.subAttr} {formatSigned(r.attrMod)}%
              {r.bonus !== 0 && <> · vant. {formatSigned(r.bonus)}%</>}
              {r.evolutionBonus !== 0 && <> · evol. {formatSigned(r.evolutionBonus)}%</>}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default PlayResistancesPanel;
