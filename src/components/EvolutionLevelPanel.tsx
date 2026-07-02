import { TrendingUp, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getXpForLevel,
  progressionPointsForLevel,
  MAX_CHARACTER_LEVEL,
} from "@/data/characterEvolution";
import type { ProgressionEntry } from "@/lib/pointBreakdown";

interface EvolutionLevelPanelProps {
  selectedClass: string;
  characterLevel: number;
  progressionHistory: ProgressionEntry[];
  totalProgressionPoints: number;
  progressionSpent: number;
  onEvolve: (level: number) => void;
  onUndoEvolve: () => void;
}

const EvolutionLevelPanel = ({
  selectedClass,
  characterLevel,
  progressionHistory,
  totalProgressionPoints,
  progressionSpent,
  onEvolve,
  onUndoEvolve,
}: EvolutionLevelPanelProps) => {
  const nextLevel = progressionHistory.length === 0
    ? 2
    : Math.max(...progressionHistory.map((e) => e.level)) + 1;
  const canEvolve = nextLevel <= MAX_CHARACTER_LEVEL;
  const available = totalProgressionPoints - progressionSpent;

  return (
    <div className="space-y-5">
      <p className="font-body text-muted-foreground text-xs">
        Ao alcançar um novo nível, o personagem recebe Nível × 10 pontos de progressão.
        Os pontos podem ser gastos imediatamente ou guardados para depois.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-center">
          <div className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
            Nível Atual
          </div>
          <div className="font-display text-3xl font-bold text-gold">{characterLevel}</div>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <div className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
            Total Recebido
          </div>
          <div className="font-display text-2xl font-bold tabular-nums">{totalProgressionPoints}</div>
        </div>
        <div className="rounded-lg border border-border p-3 text-center">
          <div className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
            Gastos
          </div>
          <div className="font-display text-2xl font-bold tabular-nums text-blood/80">
            {progressionSpent}
          </div>
        </div>
        <div className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-center">
          <div className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
            Disponíveis
          </div>
          <div className="font-display text-2xl font-bold tabular-nums text-gold">{available}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={!canEvolve}
          onClick={() => onEvolve(nextLevel)}
          className="bg-gold text-parchment-dark hover:bg-gold-glow font-body text-xs font-semibold"
        >
          <TrendingUp className="w-3.5 h-3.5 mr-1" />
          Evoluir para Nível {nextLevel}
          {canEvolve && (
            <span className="ml-1 opacity-80">(+{progressionPointsForLevel(nextLevel)} PP)</span>
          )}
        </Button>
        {progressionHistory.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={onUndoEvolve}
            className="font-body text-xs border-blood/40 text-blood hover:bg-blood/10"
          >
            <Undo2 className="w-3.5 h-3.5 mr-1" />
            Desfazer última evolução
          </Button>
        )}
      </div>

      {progressionHistory.length > 0 && (
        <div>
          <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-2">
            Histórico de Níveis
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {progressionHistory.map((entry, i) => (
              <span
                key={i}
                className="inline-block px-2 py-0.5 rounded text-xs bg-gold/10 border border-gold/25 text-gold-dark font-display"
              >
                Nv.{entry.level} (+{entry.points} PP)
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-2">
          XP necessário — {selectedClass}
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs font-body">
            <thead>
              <tr className="border-b border-border bg-card/50">
                <th className="px-2 py-1.5 text-left font-display tracking-wider">Nível</th>
                <th className="px-2 py-1.5 text-right font-display tracking-wider">XP</th>
                <th className="px-2 py-1.5 text-right font-display tracking-wider">PP ao subir</th>
                <th className="px-2 py-1.5 text-center font-display tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: MAX_CHARACTER_LEVEL }, (_, i) => i + 1).map((lvl) => {
                const reached = characterLevel >= lvl;
                const isCurrent = characterLevel === lvl;
                return (
                  <tr
                    key={lvl}
                    className={`border-b border-border/50 ${
                      isCurrent ? "bg-gold/10" : reached ? "bg-card/20" : ""
                    }`}
                  >
                    <td className="px-2 py-1 font-display">{lvl}</td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {getXpForLevel(selectedClass, lvl).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-1 text-right tabular-nums">
                      {progressionPointsForLevel(lvl) || "—"}
                    </td>
                    <td className="px-2 py-1 text-center">
                      {isCurrent ? (
                        <span className="text-gold font-semibold">Atual</span>
                      ) : reached ? (
                        <span className="text-muted-foreground">✓</span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EvolutionLevelPanel;
