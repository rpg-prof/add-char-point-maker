import { Sparkles, BookOpen, Star } from "lucide-react";
import {
  divineSpheres,
  arcaneSchools,
  divineSphereCost,
  arcaneSchoolCost,
} from "@/data/magicAccess";

export type DivineAccessLevel = "none" | "minor" | "major";
export type ArcaneAccessLevel = "none" | "access" | "specialist";

interface MagicAccessPanelProps {
  selectedClass: string;
  selectedRace: string;
  divineAccess: Record<string, "minor" | "major">;
  arcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
  onDivineChange: (sphere: string, level: DivineAccessLevel) => void;
  onArcaneChange: (school: string, level: ArcaneAccessLevel) => void;
}

const MagicAccessPanel = ({
  selectedClass,
  selectedRace,
  divineAccess,
  arcaneAccess,
  arcaneSpecialist,
  onDivineChange,
  onArcaneChange,
}: MagicAccessPanelProps) => {
  return (
    <div className="space-y-6">
      <p className="font-body text-muted-foreground text-sm">
        Escolha as escolas (arcanas) e esferas (divinas) de magia que o personagem pode acessar.
        Apenas <span className="text-gold font-semibold">uma escola arcana</span> pode ser de Especialista.
      </p>

      {/* Divine spheres */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm tracking-wider uppercase text-gold">
            Esferas Divinas
          </h3>
        </div>
        <div className="space-y-1">
          {divineSpheres.map((sphere) => {
            const current = divineAccess[sphere.name] ?? "none";
            const minorCost = divineSphereCost(sphere, "minor", selectedClass);
            const majorCost = divineSphereCost(sphere, "major", selectedClass);
            return (
              <div
                key={sphere.name}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded border transition-all ${
                  current !== "none"
                    ? "border-gold/50 bg-gold/10"
                    : "border-border bg-card/40"
                }`}
              >
                <span className="font-body text-sm text-foreground flex-1">{sphere.name}</span>
                <div className="flex items-center gap-1">
                  {(["none", "minor", "major"] as DivineAccessLevel[]).map((lvl) => {
                    const isActive = current === lvl;
                    const cost = lvl === "minor" ? minorCost : lvl === "major" ? majorCost : 0;
                    const label =
                      lvl === "none" ? "Nenhum" : lvl === "minor" ? `Menor (${cost})` : `Maior (${cost})`;
                    return (
                      <button
                        key={lvl}
                        onClick={() => onDivineChange(sphere.name, lvl)}
                        className={`px-2 py-1 rounded text-xs font-display tracking-wider border transition-all ${
                          isActive
                            ? "bg-gold/30 border-gold text-gold"
                            : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
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
      </div>

      {/* Arcane schools */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-gold" />
          <h3 className="font-display text-sm tracking-wider uppercase text-gold">
            Escolas Arcanas
          </h3>
        </div>
        <div className="space-y-1">
          {arcaneSchools.map((school) => {
            const isAccess = !!arcaneAccess[school.name];
            const isSpec = arcaneSpecialist === school.name;
            const accessCost = arcaneSchoolCost(school, selectedClass, selectedRace);
            const canSpecialize = selectedClass === "Mago" || selectedClass === "Arcano";
            const specTotalCost = school.specialization ? accessCost + school.specialization.cost : 0;
            const specDisabled = !canSpecialize || (!isSpec && arcaneSpecialist !== null);
            const current: ArcaneAccessLevel = isSpec ? "specialist" : isAccess ? "access" : "none";

            return (
              <div
                key={school.name}
                className={`flex items-center justify-between gap-2 px-3 py-2 rounded border transition-all ${
                  current !== "none"
                    ? "border-gold/50 bg-gold/10"
                    : "border-border bg-card/40"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-body text-sm text-foreground flex items-center gap-2">
                    {school.name}
                    {isSpec && <Star className="w-3 h-3 text-gold fill-gold" />}
                  </div>
                  {school.specialization && (
                    <div className="text-[10px] text-muted-foreground font-body truncate">
                      Esp.: {school.specialization.title} • Req.: {school.specialization.requirement} • Opostas: {school.specialization.opposed.join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onArcaneChange(school.name, "none")}
                    className={`px-2 py-1 rounded text-xs font-display tracking-wider border transition-all ${
                      current === "none"
                        ? "bg-gold/30 border-gold text-gold"
                        : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                    }`}
                  >
                    Nenhum
                  </button>
                  <button
                    onClick={() => onArcaneChange(school.name, "access")}
                    className={`px-2 py-1 rounded text-xs font-display tracking-wider border transition-all ${
                      current === "access"
                        ? "bg-gold/30 border-gold text-gold"
                        : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                    }`}
                  >
                    Acesso ({accessCost})
                  </button>
                  {school.specialization && (
                    <button
                      onClick={() => onArcaneChange(school.name, "specialist")}
                      disabled={specDisabled}
                      title={specDisabled ? "Apenas uma especialização permitida" : undefined}
                      className={`px-2 py-1 rounded text-xs font-display tracking-wider border transition-all ${
                        current === "specialist"
                          ? "bg-gold/30 border-gold text-gold"
                          : specDisabled
                          ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                          : "border-border text-muted-foreground hover:border-gold/50 hover:text-foreground"
                      }`}
                    >
                      Especialista ({specCost})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MagicAccessPanel;
