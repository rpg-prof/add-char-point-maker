import { Button } from "@/components/ui/button";
import {
  arcaneSchools,
  arcaneSchoolCost,
  divineSpheres,
  divineSphereCost,
} from "@/data/magicAccess";
import {
  sanitizeMagicProgressAfterAccessChange,
  type EvolutionProgress,
} from "@/lib/evolutionProgress";

interface EvolutionMagicAccessPanelProps {
  selectedClass: string;
  selectedRace: string;
  progress: EvolutionProgress;
  availablePoints: number;
  creationDivineAccess: Record<string, "minor" | "major">;
  creationArcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
  onChange: (progress: EvolutionProgress) => void;
}

type DivineLevel = "none" | "minor" | "major";

const EvolutionMagicAccessPanel = ({
  selectedClass,
  selectedRace,
  progress,
  availablePoints,
  creationDivineAccess,
  creationArcaneAccess,
  arcaneSpecialist,
  onChange,
}: EvolutionMagicAccessPanelProps) => {
  const applyAccessChange = (patch: Partial<EvolutionProgress>) => {
    const merged: EvolutionProgress = { ...progress, ...patch };
    const hasArcaneAccess =
      Object.keys(creationArcaneAccess).length > 0 ||
      Object.keys(merged.evolutionArcaneAccess).length > 0 ||
      arcaneSpecialist !== null;
    const hasDivineAccess =
      Object.keys(creationDivineAccess).length > 0 ||
      Object.keys(merged.evolutionDivineAccess).length > 0;
    onChange(
      sanitizeMagicProgressAfterAccessChange(merged, {
        hasArcaneAccess,
        hasDivineAccess,
      }),
    );
  };

  const setDivineAccess = (sphereName: string, level: DivineLevel) => {
    if (creationDivineAccess[sphereName]) return;

    const prev = progress.evolutionDivineAccess[sphereName];
    const prevCost = prev
      ? divineSphereCost(
          divineSpheres.find((s) => s.name === sphereName)!,
          prev,
          selectedClass,
        )
      : 0;
    const sphere = divineSpheres.find((s) => s.name === sphereName);
    if (!sphere) return;
    const nextCost =
      level === "none" ? 0 : divineSphereCost(sphere, level, selectedClass);
    const delta = nextCost - prevCost;
    if (delta > availablePoints) return;

    const wasFirstDivine =
      Object.keys(creationDivineAccess).length === 0 &&
      Object.keys(progress.evolutionDivineAccess).length === 0 &&
      level !== "none";

    const next = { ...progress.evolutionDivineAccess };
    if (level === "none") delete next[sphereName];
    else next[sphereName] = level;

    applyAccessChange({
      evolutionDivineAccess: next,
      divineManaPurchased: wasFirstDivine
        ? progress.divineManaPurchased + 1
        : progress.divineManaPurchased,
    });
  };

  const setArcaneAccess = (schoolName: string, enable: boolean) => {
    if (creationArcaneAccess[schoolName] || arcaneSpecialist === schoolName) return;

    const school = arcaneSchools.find((s) => s.name === schoolName);
    if (!school) return;
    const cost = arcaneSchoolCost(school, selectedClass, selectedRace);
    const has = !!progress.evolutionArcaneAccess[schoolName];

    if (enable && !has) {
      if (cost > availablePoints) return;
      const wasFirstArcane =
        Object.keys(creationArcaneAccess).length === 0 &&
        Object.keys(progress.evolutionArcaneAccess).length === 0 &&
        !arcaneSpecialist;

      applyAccessChange({
        evolutionArcaneAccess: {
          ...progress.evolutionArcaneAccess,
          [schoolName]: "access",
        },
        arcaneManaPurchased: wasFirstArcane
          ? progress.arcaneManaPurchased + 1
          : progress.arcaneManaPurchased,
      });
      return;
    }

    if (!enable && has) {
      const next = { ...progress.evolutionArcaneAccess };
      delete next[schoolName];
      applyAccessChange({ evolutionArcaneAccess: next });
    }
  };

  return (
    <div className="space-y-3">
      <p className="font-body text-muted-foreground text-xs">
        Compre escolas/esferas com pontos de progressão. O primeiro acesso de cada tipo
        concede +1 ponto de magia. Especialização arcana não pode ser comprada na evolução.
      </p>

      <div className="space-y-1 max-h-[36vh] overflow-y-auto pr-1">
        <p className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">
          Esferas Divinas
        </p>
        {divineSpheres.map((sphere) => {
          const fromCreation = creationDivineAccess[sphere.name];
          const fromEvo = progress.evolutionDivineAccess[sphere.name];
          const current: DivineLevel = fromCreation ?? fromEvo ?? "none";
          const locked = !!fromCreation;
          const minorCost = divineSphereCost(sphere, "minor", selectedClass);
          const majorCost = divineSphereCost(sphere, "major", selectedClass);
          const currentCost =
            current === "minor" ? minorCost : current === "major" ? majorCost : 0;

          return (
            <div
              key={sphere.name}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-sm ${
                current !== "none"
                  ? "border-gold/40 bg-gold/10"
                  : "border-border bg-card/40"
              }`}
            >
              <span className="font-body text-xs text-foreground flex-1 min-w-0 truncate">
                {sphere.name}
                {locked && <span className="text-muted-foreground"> · criação</span>}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {(["none", "minor", "major"] as DivineLevel[]).map((lvl) => {
                  const targetCost =
                    lvl === "minor" ? minorCost : lvl === "major" ? majorCost : 0;
                  const delta = targetCost - currentCost;
                  const disabled =
                    locked || (lvl !== current && delta > availablePoints);
                  const label =
                    lvl === "none"
                      ? "—"
                      : lvl === "minor"
                        ? `Menor (${minorCost})`
                        : `Maior (${majorCost})`;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={disabled}
                      onClick={() => setDivineAccess(sphere.name, lvl)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-display tracking-wider border transition-all ${
                        current === lvl
                          ? "bg-gold/30 border-gold text-gold"
                          : disabled
                            ? "border-border/40 text-muted-foreground/40 cursor-not-allowed"
                            : "border-border text-muted-foreground hover:border-gold/50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1 max-h-[36vh] overflow-y-auto pr-1">
        <p className="font-display text-[10px] tracking-wider uppercase text-muted-foreground pt-1">
          Escolas Arcanas
        </p>
        {arcaneSchools.map((school) => {
          const fromCreation =
            !!creationArcaneAccess[school.name] || arcaneSpecialist === school.name;
          const fromEvo = !!progress.evolutionArcaneAccess[school.name];
          const has = fromCreation || fromEvo;
          const cost = arcaneSchoolCost(school, selectedClass, selectedRace);
          const canBuy = !fromCreation && !has && cost <= availablePoints;
          const canRemove = fromEvo;

          return (
            <div
              key={school.name}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border text-sm ${
                has ? "border-gold/40 bg-gold/10" : "border-border bg-card/40"
              }`}
            >
              <span className="font-body text-xs text-foreground flex-1 min-w-0 truncate">
                {school.name}
                {fromCreation && (
                  <span className="text-muted-foreground"> · criação</span>
                )}
              </span>
              {fromCreation ? (
                <span className="text-[10px] font-display text-gold">Acesso</span>
              ) : has ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-1.5"
                  disabled={!canRemove}
                  onClick={() => setArcaneAccess(school.name, false)}
                >
                  Remover
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] px-1.5"
                  disabled={!canBuy}
                  onClick={() => setArcaneAccess(school.name, true)}
                >
                  +{cost} PP
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvolutionMagicAccessPanel;
