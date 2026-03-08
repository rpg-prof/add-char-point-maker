interface PointTrackerProps {
  label: string;
  spent: number;
  total: number;
}

const PointTracker = ({ label, spent, total }: PointTrackerProps) => {
  const remaining = total - spent;
  const percentage = Math.min((spent / total) * 100, 100);
  const isOver = remaining < 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between font-display text-sm">
        <span className="tracking-wider uppercase">{label}</span>
        <span className={isOver ? "text-blood font-bold" : "text-gold"}>
          {remaining} / {total}
        </span>
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
  );
};

export default PointTracker;
