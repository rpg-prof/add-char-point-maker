import { useMemo } from "react";
import { FlaskConical, Minus, Plus, Sparkles } from "lucide-react";
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
import {
  emptyMagicComponentRow,
  type MagicComponentEntry,
} from "@/lib/magicComponents";

const resourceCardTitleCls =
  "font-display text-[10px] tracking-widest uppercase mb-3 min-h-[2rem] flex items-center justify-center gap-1.5 text-center leading-tight text-muted-foreground";

const componentInputCls =
  "w-full min-w-0 bg-background/50 border border-border rounded px-1.5 py-1 text-foreground font-body text-[11px] placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold";

interface MagicResourcePanelProps {
  loadout: CombatLoadout;
  onLoadoutChange: (loadout: CombatLoadout) => void;
  hasMagicAccess: boolean;
  arcaneSpecialist: string | null;
  selectedRaceClassAdv: string[];
  magicComponents: MagicComponentEntry[];
  onMagicComponentsChange: (entries: MagicComponentEntry[]) => void;
}

const MagicResourcePanel = ({
  loadout,
  onLoadoutChange,
  hasMagicAccess,
  arcaneSpecialist,
  selectedRaceClassAdv,
  magicComponents,
  onMagicComponentsChange,
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

  const updateComponent = (index: number, patch: Partial<MagicComponentEntry>) => {
    onMagicComponentsChange(
      magicComponents.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeComponentRow = (index: number) => {
    if (magicComponents.length <= 1) {
      onMagicComponentsChange([emptyMagicComponentRow()]);
      return;
    }
    onMagicComponentsChange(magicComponents.filter((_, i) => i !== index));
  };

  const addComponentRow = () => {
    onMagicComponentsChange([...magicComponents, emptyMagicComponentRow()]);
  };

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

      <div className="rounded-xl border border-border bg-card/50 p-3 flex flex-col">
        <h4 className={resourceCardTitleCls}>
          <FlaskConical className="w-3.5 h-3.5 text-gold shrink-0" />
          Componentes
        </h4>
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_2.5rem_1.25rem] gap-1 px-0.5">
            <span className="text-[9px] font-display uppercase tracking-wider text-muted-foreground">
              Item
            </span>
            <span className="text-[9px] font-display uppercase tracking-wider text-muted-foreground text-center">
              Qtd
            </span>
            <span className="sr-only">Remover</span>
          </div>
          {magicComponents.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_2.5rem_1.25rem] gap-1 items-center">
              <input
                type="text"
                value={row.item}
                onChange={(e) => updateComponent(index, { item: e.target.value })}
                placeholder="Item"
                className={componentInputCls}
              />
              <input
                type="text"
                inputMode="numeric"
                value={row.qty}
                onChange={(e) => updateComponent(index, { qty: e.target.value })}
                placeholder="0"
                className={`${componentInputCls} text-center tabular-nums`}
              />
              <button
                type="button"
                onClick={() => removeComponentRow(index)}
                title="Remover linha"
                className="w-5 h-5 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addComponentRow}
            className="w-full mt-1.5 flex items-center justify-center gap-1 py-1 rounded border border-dashed border-border text-[10px] font-display uppercase tracking-wider text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
          >
            <Plus className="w-3 h-3" />
            Linha
          </button>
        </div>
      </div>
    </div>
  );
};

export default MagicResourcePanel;
