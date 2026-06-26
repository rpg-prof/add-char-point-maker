import { Minus, Plus } from "lucide-react";

const labelCls =
  "font-display text-[9px] sm:text-[10px] tracking-wider uppercase text-center text-muted-foreground leading-tight";
const hintCls =
  "text-[8px] sm:text-[9px] text-muted-foreground text-center leading-tight line-clamp-2 min-h-[1.25rem]";

interface ResourcePoolRowProps {
  max: number;
  current: number;
  tracksCurrent: boolean;
  onMaxChange: (value: number) => void;
  onAdjustMax: (delta: number) => void;
  onCurrentChange: (value: number) => void;
  onAdjustCurrent: (delta: number) => void;
  onFollowMax: () => void;
  hint?: string;
}

export default function ResourcePoolRow({
  max,
  current,
  tracksCurrent,
  onMaxChange,
  onAdjustMax,
  onCurrentChange,
  onAdjustCurrent,
  onFollowMax,
  hint,
}: ResourcePoolRowProps) {
  const controlBtnCls =
    "w-6 h-6 shrink-0 rounded border border-border flex items-center justify-center hover:bg-muted";
  const inputCls =
    "w-10 sm:w-11 h-7 text-center bg-background/50 border border-border rounded px-0.5 font-display text-xs font-bold tabular-nums";
  const controlRowCls = "flex items-center justify-center gap-0.5 h-9 sm:h-10";

  return (
    <div className="space-y-2">
      <div className="mx-auto w-max max-w-full">
        <div className="grid grid-cols-2 gap-x-6 sm:gap-x-8">
          <div className={`${labelCls} text-center`}>Máximo</div>
          <div className={`${labelCls} text-center`}>Atuais</div>

          <div className={controlRowCls}>
            <button
              type="button"
              onClick={() => onAdjustMax(-1)}
              className={controlBtnCls}
              title="Diminuir máximo"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min={0}
              value={max}
              onChange={(e) => onMaxChange(Number(e.target.value) || 0)}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onAdjustMax(1)}
              className={controlBtnCls}
              title="Aumentar máximo"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className={controlRowCls}>
            <button
              type="button"
              onClick={() => onAdjustCurrent(-1)}
              className={controlBtnCls}
              title="Gastar"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min={0}
              value={current}
              onChange={(e) => onCurrentChange(Number(e.target.value) || 0)}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onAdjustCurrent(1)}
              className={controlBtnCls}
              title="Recuperar"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="min-h-[1.25rem]" aria-hidden />
          <div className={`${hintCls} text-center max-w-[7rem] mx-auto`}>
            de <span className="font-display text-gold font-semibold">{max}</span> máx.
            {tracksCurrent && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onFollowMax}
                  className="underline hover:text-foreground"
                >
                  Seguir máx.
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {hint && (
        <p className="text-[10px] text-muted-foreground font-body text-center leading-snug px-1 min-h-[2rem]">
          {hint}
        </p>
      )}
    </div>
  );
}
