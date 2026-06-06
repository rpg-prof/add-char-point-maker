import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { PointBreakdown } from "@/lib/pointBreakdown";

type PointDetailsVariant = "default" | "attributes" | "progression";

interface PointDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  breakdown: PointBreakdown;
  spent: number;
  total: number;
  variant?: PointDetailsVariant;
}

function BreakdownColumn({
  title,
  entries,
  total,
  variant,
}: {
  title: string;
  entries: { label: string; value: number }[];
  total: number;
  variant: "positive" | "negative";
}) {
  const isPositive = variant === "positive";
  const valueColor = isPositive ? "text-gold" : "text-teal-300";
  const panelClass = isPositive
    ? "bg-gold/10 border-gold/30"
    : "bg-teal-500/10 border-teal-400/30";

  return (
    <div className={`flex flex-col gap-2 min-w-0 rounded-lg border p-3 ${panelClass}`}>
      <div className="flex items-center justify-between border-b border-parchment/20 pb-1.5">
        <h3 className="font-display text-xs tracking-wider uppercase text-parchment/90">
          {title}
        </h3>
        <span className={`font-display text-sm font-bold tabular-nums ${valueColor}`}>
          {isPositive ? "+" : "−"}
          {total}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-parchment/55 italic py-2">Nenhum</p>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li
              key={entry.label}
              className="flex items-start justify-between gap-2 text-sm font-body"
            >
              <span className="text-parchment leading-snug">{entry.label}</span>
              <span className={`shrink-0 font-display font-semibold tabular-nums ${valueColor}`}>
                {isPositive ? "+" : "−"}
                {entry.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ATTRIBUTE_BASE_TOTAL = 60;

const PointDetailsModal = ({
  open,
  onOpenChange,
  title,
  breakdown,
  spent,
  total,
  variant = "default",
}: PointDetailsModalProps) => {
  const positiveTotal = breakdown.positive.reduce((sum, e) => sum + e.value, 0);
  const negativeTotal = breakdown.negative.reduce((sum, e) => sum + e.value, 0);
  const remaining = total - spent;
  const isOver = remaining < 0;

  const negativeColumnTitle =
    variant === "progression" ? "Pontos Ganhos" : "Pontos Recuperados";

  const summary =
    variant === "attributes"
      ? `base ${ATTRIBUTE_BASE_TOTAL} + ${positiveTotal} − ${negativeTotal} = ${spent}`
      : variant === "progression"
      ? `${positiveTotal} gastos − ${negativeTotal} ganhos (saldo ${remaining})`
      : `${positiveTotal} gastos − ${negativeTotal} recuperados = ${spent} líquido`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark-panel border-gold/40 sm:max-w-2xl [&>button]:text-parchment/70 [&>button]:hover:text-parchment">
        <DialogHeader>
          <DialogTitle className="font-display text-gold tracking-wider">
            {title}
          </DialogTitle>
          <DialogDescription className="text-parchment/80">
            Saldo:{" "}
            <span className={isOver ? "text-red-400 font-bold" : "text-gold font-bold"}>
              {remaining}
            </span>{" "}
            <span className="text-parchment/60">/ {total}</span>
            <span className="block mt-1 text-parchment/65 text-xs">({summary})</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
          <BreakdownColumn
            title="Pontos Gastos"
            entries={breakdown.positive}
            total={positiveTotal}
            variant="positive"
          />
          <BreakdownColumn
            title={negativeColumnTitle}
            entries={breakdown.negative}
            total={negativeTotal}
            variant="negative"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PointDetailsModal;
