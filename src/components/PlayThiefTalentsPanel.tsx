import { computeThiefTalentBreakdown } from "@/lib/thiefTalentStats";

interface PlayThiefTalentsPanelProps {
  selectedClass: string;
  selectedRace: string;
  subAttributes: Record<string, number>;
  selectedAdvantages?: string[];
  purchasedBonuses?: Record<string, number> | null;
}

function formatSigned(n: number) {
  if (n > 0) return `+${n}%`;
  if (n < 0) return `${n}%`;
  return "0%";
}

const PlayThiefTalentsPanel = ({
  selectedClass,
  selectedRace,
  subAttributes,
  selectedAdvantages,
  purchasedBonuses,
}: PlayThiefTalentsPanelProps) => {
  const rows = computeThiefTalentBreakdown({
    selectedClass,
    selectedRace,
    subAttributes,
    selectedAdvantages,
    purchasedBonuses,
  });

  if (!rows) return null;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_3.25rem] gap-2 px-2.5 py-1.5 text-micro font-display tracking-wider uppercase text-muted-foreground border-b border-border/40 bg-background/40">
        <span>Talento</span>
        <span className="text-right">%</span>
      </div>
      <ul className="divide-y divide-border/35">
        {rows.map((row) => {
          const parts = [
            `Base ${row.base}%`,
            row.racial !== 0 ? `Raça ${formatSigned(row.racial)}` : null,
            row.attrMod !== 0 ? `Atr. ${formatSigned(row.attrMod)}` : null,
            row.advantage !== 0 ? `Vant. ${formatSigned(row.advantage)}` : null,
            row.purchased > 0 ? `Compra +${row.purchased}%` : null,
          ].filter(Boolean);

          return (
            <li
              key={row.key}
              className="flex items-baseline justify-between gap-2 px-2.5 py-1.5 bg-background/30 hover:bg-gold/[0.04] transition-colors"
              title={parts.join(" · ")}
            >
              <span className="min-w-0 flex-1 text-meta font-body leading-snug text-foreground">
                {row.label}
              </span>
              <span className="shrink-0 font-display text-field font-bold tabular-nums text-gold-dark">
                {row.total}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PlayThiefTalentsPanel;
