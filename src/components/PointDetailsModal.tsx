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
  const valueColor = isPositive ? "text-gold-dark" : "text-teal-800";
  const panelClass = isPositive
    ? "bg-gold/10 border-gold-dark/30"
    : "bg-teal-700/10 border-teal-700/25";

  return (
    <div className={`flex flex-col gap-2 min-w-0 rounded-lg border p-3 bg-card ${panelClass}`}>
      <div className="flex items-center justify-between border-b border-border pb-1.5">
        <h3 className="font-display text-xs tracking-wider uppercase text-muted-foreground">
          {title}
        </h3>
        <span className={`font-display text-sm font-bold tabular-nums ${valueColor}`}>
          {isPositive ? "+" : "−"}
          {total}
        </span>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-2">Nenhum</p>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li
              key={entry.label}
              className="flex items-start justify-between gap-2 text-sm font-body"
            >
              <span className="text-foreground leading-snug">{entry.label}</span>
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
      <DialogContent className="sm:max-w-2xl">
        <div className="px-5 pt-5 pb-3 border-b border-border bg-secondary/70 pr-12">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-base text-gold-dark">
              {title}
            </DialogTitle>
            <DialogDescription className="font-body text-xs text-foreground/65 mt-1">
              Saldo:{" "}
              <span className={isOver ? "text-blood font-bold" : "text-gold-dark font-bold"}>
                {remaining}
              </span>{" "}
              <span className="text-muted-foreground">/ {total}</span>
              <span className="block mt-1 text-muted-foreground text-xs">({summary})</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-background">
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
