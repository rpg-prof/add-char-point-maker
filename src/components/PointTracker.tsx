import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PointBreakdown } from "@/lib/pointBreakdown";
import PointDetailsModal from "@/components/PointDetailsModal";

type PointDetailsVariant = "default" | "attributes" | "progression";

interface PointTrackerProps {
  label: string;
  spent: number;
  total: number;
  breakdown?: PointBreakdown;
  detailsVariant?: PointDetailsVariant;
}

const PointTracker = ({ label, spent, total, breakdown, detailsVariant }: PointTrackerProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const remaining = total - spent;
  const percentage = Math.min((spent / total) * 100, 100);
  const isOver = remaining < 0;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-display text-sm gap-2">
          <span className="tracking-wider uppercase truncate">{label}</span>
          <div className="flex items-center gap-2 shrink-0">
            {breakdown && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDetailsOpen(true)}
                className="h-6 px-2 text-[10px] font-display tracking-wider uppercase text-gold-dark hover:text-gold hover:bg-gold/10"
              >
                <Info className="w-3 h-3 mr-1" />
                Detalhes
              </Button>
            )}
            <span className={isOver ? "text-blood font-bold tabular-nums" : "text-gold tabular-nums"}>
              {remaining} / {total}
            </span>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-parchment-dark/20 overflow-hidden border border-border">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOver
                ? "bg-blood"
                : remaining <= 10
                ? "bg-accent"
                : "bg-gold"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {breakdown && (
        <PointDetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          title={label}
          breakdown={breakdown}
          spent={spent}
          total={total}
          variant={detailsVariant}
        />
      )}
    </>
  );
};

export default PointTracker;
