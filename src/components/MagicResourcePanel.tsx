import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import ResourcePoolRow from "@/components/ResourcePoolRow";
import type { CombatLoadout } from "@/lib/combatStats";
import {
  computeSuggestedManaMax,
  computeSuggestedSpecialistManaMax,
  countSelectedAdvantage,
  MAGIC_EXTRA_ADVANTAGE,
  MAGIC_EXTRA_SCHOOL_ADVANTAGE,
  resolveResourceCurrent,
} from "@/lib/combatResources";

const resourceCardTitleCls =
  "font-display text-[10px] tracking-widest uppercase mb-3 min-h-[2rem] flex items-center justify-center gap-1.5 text-center leading-tight text-muted-foreground";

interface MagicResourcePanelProps {
  loadout: CombatLoadout;
  onLoadoutChange: (loadout: CombatLoadout) => void;
  hasMagicAccess: boolean;
  arcaneSpecialist: string | null;
  selectedRaceClassAdv: string[];
}

const MagicResourcePanel = ({
  loadout,
  onLoadoutChange,
  hasMagicAccess,
  arcaneSpecialist,
  selectedRaceClassAdv,
}: MagicResourcePanelProps) => {
  const update = (patch: Partial<CombatLoadout>) => {
    onLoadoutChange({ ...loadout, ...patch });
  };

  const suggestedManaMax = useMemo(
    () => computeSuggestedManaMax(hasMagicAccess, selectedRaceClassAdv),
    [hasMagicAccess, selectedRaceClassAdv],
  );
  const suggestedSpecialistManaMax = useMemo(
    () => computeSuggestedSpecialistManaMax(arcaneSpecialist, selectedRaceClassAdv),
    [arcaneSpecialist, selectedRaceClassAdv],
  );
  const extraManaCount = countSelectedAdvantage(selectedRaceClassAdv, MAGIC_EXTRA_ADVANTAGE);
  const extraSchoolManaCount = countSelectedAdvantage(
    selectedRaceClassAdv,
    MAGIC_EXTRA_SCHOOL_ADVANTAGE,
  );

  const maxMana = loadout.maxMana;
  const currentMana = resolveResourceCurrent(loadout.currentMana, maxMana);
  const maxSpecialistMana = loadout.maxSpecialistMana;
  const currentSpecialistMana = resolveResourceCurrent(
    loadout.currentSpecialistMana,
    maxSpecialistMana,
  );

  const manaHint = hasMagicAccess
    ? `Inicial: 1${extraManaCount > 0 ? ` + ${extraManaCount} antecedente${extraManaCount > 1 ? "s" : ""} Extra` : ""} = ${suggestedManaMax} sugerido. Aumente conforme evoluir.`
    : undefined;
  const specialistManaHint = arcaneSpecialist
    ? `Inicial: 1${extraSchoolManaCount > 0 ? ` + ${extraSchoolManaCount} Extra (Escola)` : ""} = ${suggestedSpecialistManaMax} sugerido para ${arcaneSpecialist}.`
    : undefined;

  if (!hasMagicAccess && !arcaneSpecialist) return null;

  return (
    <div className="space-y-3">
      {hasMagicAccess && (
        <div className="rounded-xl border border-border bg-card/50 p-3 flex flex-col">
          <h4 className={resourceCardTitleCls}>
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
            Pontos de Magia
          </h4>
          <ResourcePoolRow
            max={maxMana}
            current={currentMana}
            tracksCurrent={loadout.currentMana != null}
            onMaxChange={(value) => update({ maxMana: Math.max(0, value) })}
            onAdjustMax={(delta) => update({ maxMana: Math.max(0, loadout.maxMana + delta) })}
            onCurrentChange={(value) => update({ currentMana: Math.max(0, value) })}
            onAdjustCurrent={(delta) => {
              const base = resolveResourceCurrent(loadout.currentMana, maxMana);
              update({ currentMana: Math.max(0, base + delta) });
            }}
            onFollowMax={() => update({ currentMana: null })}
            hint={manaHint}
          />
        </div>
      )}

      {arcaneSpecialist && (
        <div className="rounded-xl border border-border bg-card/50 p-3 flex flex-col">
          <h4 className={resourceCardTitleCls}>
            <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Escola — {arcaneSpecialist}</span>
          </h4>
          <ResourcePoolRow
            max={maxSpecialistMana}
            current={currentSpecialistMana}
            tracksCurrent={loadout.currentSpecialistMana != null}
            onMaxChange={(value) => update({ maxSpecialistMana: Math.max(0, value) })}
            onAdjustMax={(delta) =>
              update({ maxSpecialistMana: Math.max(0, loadout.maxSpecialistMana + delta) })
            }
            onCurrentChange={(value) => update({ currentSpecialistMana: Math.max(0, value) })}
            onAdjustCurrent={(delta) => {
              const base = resolveResourceCurrent(
                loadout.currentSpecialistMana,
                maxSpecialistMana,
              );
              update({ currentSpecialistMana: Math.max(0, base + delta) });
            }}
            onFollowMax={() => update({ currentSpecialistMana: null })}
            hint={specialistManaHint}
          />
        </div>
      )}
    </div>
  );
};

export default MagicResourcePanel;
