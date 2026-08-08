import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import { mergePowerLevels } from "@/lib/evolutionProgress";
import type { EvolutionProgress } from "@/lib/evolutionProgress";

interface PlayPowersPanelProps {
  selectedRaceClassAdv: string[];
  evolutionProgress?: EvolutionProgress | null;
}

const PlayPowersPanel = ({
  selectedRaceClassAdv,
  evolutionProgress,
}: PlayPowersPanelProps) => {
  const powerLevels = mergePowerLevels(
    selectedRaceClassAdv,
    evolutionProgress?.powerLevels ?? {},
  );

  const powers = Object.entries(powerLevels)
    .filter(([, level]) => level > 0)
    .map(([name, level]) => {
      const item = raceClassAdvantages.find((a) => a.name === name);
      return { name, level, category: item?.category ?? "poder" };
    })
    .filter((p) => {
      const item = raceClassAdvantages.find((a) => a.name === p.name);
      return !item || item.category === "poder";
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  if (powers.length === 0) {
    return (
      <p className="text-field text-muted-foreground font-body py-2 text-center">
        Nenhum poder especial.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {powers.map(({ name, level }) => (
        <span
          key={name}
          className="inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-meta font-body text-foreground"
        >
          {name}
          <span className="font-display text-micro text-gold-dark tabular-nums">
            Nv. {level}
          </span>
        </span>
      ))}
    </div>
  );
};

export default PlayPowersPanel;
