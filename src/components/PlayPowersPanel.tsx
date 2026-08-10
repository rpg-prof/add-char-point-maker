import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import { findChiTechnique } from "@/data/chiTechniques";
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

  const chiTechniques = (evolutionProgress?.chiTechniques ?? [])
    .map((name) => findChiTechnique(name))
    .filter((t): t is NonNullable<typeof t> => t != null)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  if (powers.length === 0 && chiTechniques.length === 0) {
    return (
      <p className="text-field text-muted-foreground font-body py-2 text-center">
        Nenhum poder especial.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {powers.length > 0 && (
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
      )}

      {chiTechniques.length > 0 && (
        <div className="space-y-1">
          {powers.length > 0 && (
            <p className="font-display text-micro tracking-wider uppercase text-muted-foreground">
              Técnicas de Chi
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {chiTechniques.map((tech) => (
              <span
                key={tech.name}
                title={tech.summary}
                className="inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-gold/10 px-2.5 py-1 text-meta font-body text-foreground"
              >
                {tech.name}
                <span className="font-display text-micro text-gold-dark tabular-nums">
                  {tech.chiCost == null ? "Passiva" : `${tech.chiCost} Chi`}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayPowersPanel;
