import { Fragment, useMemo, useState } from "react";
import { Heart, Minus, Plus, Shield, Swords, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ResourcePoolRow from "@/components/ResourcePoolRow";
import {
  computeArmorClassBreakdown,
  computeAttackRollBreakdown,
  computeHitPointsBreakdown,
  getMartialArtsDamageByLevel,
  hasArtesMarciais,
  resolveCurrentHp,
  getPurchasedBodyArmors,
  getPurchasedShields,
  getAvailableWeapons,
  weaponSlotFromEquipment,
  type CombatLoadout,
  type MagicCaBonus,
  type WeaponAttackSlot,
} from "@/lib/combatStats";
import { formatArmorClass } from "@/data/equipment";
import type { CustomInventoryItem, PurchasedItems } from "@/data/equipment";
import type { AttributeName } from "@/data/characterData";
import { resolveResourceCurrent } from "@/lib/combatResources";

interface CombatPanelProps {
  subAttributes: Record<string, number>;
  attributes: Record<AttributeName, number>;
  purchased: PurchasedItems;
  customItems?: CustomInventoryItem[];
  selectedRaceClassAdv: string[];
  selectedClass: string;
  characterLevel: number;
  loadout: CombatLoadout;
  onLoadoutChange: (loadout: CombatLoadout) => void;
}

const COL_W = "w-[3rem] sm:w-[3.25rem]";
const OP_W = "w-4 sm:w-5 shrink-0";
const boxCls = `h-9 sm:h-10 ${COL_W} flex items-center justify-center rounded border-2 border-foreground/80 bg-card font-display text-sm sm:text-base font-bold tabular-nums shrink-0`;
const totalBoxCls = `h-9 sm:h-10 ${COL_W} flex items-center justify-center rounded border-2 border-foreground bg-gold/15 font-display text-sm sm:text-base font-bold tabular-nums text-gold shrink-0`;
const labelCls =
  "font-display text-[9px] sm:text-[10px] tracking-wider uppercase text-center text-muted-foreground leading-tight";
const hintCls =
  "text-[8px] sm:text-[9px] text-muted-foreground text-center leading-tight line-clamp-2 min-h-[1.25rem]";
const sectionTitleCls =
  "font-display text-xs sm:text-sm tracking-widest uppercase mb-2 flex items-center justify-center gap-1.5";

interface CaField {
  label: string;
  value: number | string;
  hint?: string;
  isTotal?: boolean;
}

const HP_COL_W = "w-[2.5rem] sm:w-[2.65rem]";
const HP_BOX_CLS = `h-9 sm:h-10 ${HP_COL_W} flex items-center justify-center rounded border-2 border-foreground/80 bg-card font-display text-sm font-bold tabular-nums shrink-0`;
const HP_TOTAL_CLS = `h-9 sm:h-10 ${HP_COL_W} flex items-center justify-center rounded border-2 border-foreground bg-gold/15 font-display text-sm font-bold tabular-nums text-gold shrink-0`;
const HP_GRID_COLS = "2.65rem 0.85rem 3.5rem 0.85rem 2.65rem";

function HitPointsFormulaRow({
  base,
  condBonus,
  total,
  condHint,
  currentHp,
  maxHp,
  tracksCurrentHp,
  formatSigned,
  onCurrentHpChange,
  onAdjustCurrentHp,
  onFollowMax,
}: {
  base: number;
  condBonus: number;
  total: number;
  condHint: string;
  currentHp: number;
  maxHp: number;
  tracksCurrentHp: boolean;
  formatSigned: (n: number) => string;
  onCurrentHpChange: (value: number) => void;
  onAdjustCurrentHp: (delta: number) => void;
  onFollowMax: () => void;
}) {
  const gridStyle = { gridTemplateColumns: HP_GRID_COLS };
  const valueRowCls = "h-9 sm:h-10 flex items-center";

  return (
    <div className="overflow-x-auto pb-0.5">
      <div className="flex items-end justify-center gap-2.5 sm:gap-3 mx-auto w-max">
        <div className="grid gap-x-0 items-end" style={gridStyle}>
          <div className={`${labelCls} col-start-1`}>Base</div>
          <div className={`${labelCls} col-start-3`}>Cond.</div>
          <div className={`${labelCls} col-start-5`}>Total</div>

          <div className={`${HP_BOX_CLS} col-start-1 row-start-2`}>{base}</div>
          <span className="col-start-2 row-start-2 self-center text-center font-display text-xs text-muted-foreground leading-none">
            +
          </span>
          <div className={`${HP_BOX_CLS} col-start-3 row-start-2`}>{formatSigned(condBonus)}</div>
          <span className="col-start-4 row-start-2 self-center text-center font-display text-xs text-muted-foreground leading-none">
            =
          </span>
          <div className={`${HP_TOTAL_CLS} col-start-5 row-start-2`}>{total}</div>

          <div className={`${hintCls} col-start-3 row-start-3`}>{condHint}</div>
        </div>

        <div className="flex flex-col items-center shrink-0">
          <div className={`${labelCls} w-full text-center`}>Atuais</div>
          <div className={`${valueRowCls} gap-0.5 my-0.5`}>
            <button
              type="button"
              onClick={() => onAdjustCurrentHp(-1)}
              className="w-6 h-6 shrink-0 rounded border border-border flex items-center justify-center hover:bg-muted"
              title="Dano"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              min={0}
              value={currentHp}
              onChange={(e) => onCurrentHpChange(Number(e.target.value) || 0)}
              className="w-9 sm:w-10 h-7 text-center bg-background/50 border border-border rounded px-0.5 font-display text-sm font-bold tabular-nums"
            />
            <button
              type="button"
              onClick={() => onAdjustCurrentHp(1)}
              className="w-6 h-6 shrink-0 rounded border border-border flex items-center justify-center hover:bg-muted"
              title="Cura"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <div className={`${hintCls} text-center max-w-[5.5rem]`}>
            de <span className="font-display text-gold font-semibold">{maxHp}</span> máx.
            {tracksCurrentHp && (
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
    </div>
  );
}

function CaFormulaRow({ fields }: { fields: CaField[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex flex-col items-center w-max mx-auto">
        <div className="flex items-center justify-center">
          {fields.map((field, i) => (
            <Fragment key={field.label}>
              {i > 0 && <span className={OP_W} aria-hidden />}
              <div className={`${COL_W} px-0.5 ${labelCls}`}>{field.label}</div>
            </Fragment>
          ))}
        </div>

        <div className="flex items-center justify-center my-0.5">
          {fields.map((field, i) => (
            <Fragment key={field.label}>
              {i > 0 && (
                <span className={`${OP_W} text-center font-display text-sm text-muted-foreground leading-none`}>
                  {field.isTotal ? "=" : "+"}
                </span>
              )}
              <div className={field.isTotal ? totalBoxCls : boxCls}>{field.value}</div>
            </Fragment>
          ))}
        </div>

        <div className="flex items-start justify-center">
          {fields.map((field, i) => (
            <Fragment key={field.label}>
              {i > 0 && <span className={OP_W} aria-hidden />}
              <div className={`${COL_W} px-0.5 ${hintCls}`}>{field.hint ?? "\u00A0"}</div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

const atkThCls =
  "font-display text-[9px] sm:text-[10px] tracking-wider uppercase text-muted-foreground text-center border border-border bg-muted/25 px-1.5 py-1.5 leading-tight";
const atkTdCls = "border border-border px-1 py-1 align-middle h-10 sm:h-11";
const atkOpTdCls =
  "border border-border px-0 py-1 align-middle h-10 sm:h-11 w-5 sm:w-6 text-center font-display text-xs sm:text-sm text-muted-foreground";
const atkInputCls =
  "h-8 sm:h-9 w-full min-w-[2.5rem] bg-background/50 border border-border rounded px-1 text-center text-xs sm:text-sm font-display tabular-nums";
const atkReadonlyCls =
  "h-8 sm:h-9 w-full min-w-[2.5rem] flex items-center justify-center bg-muted/30 border border-border rounded text-xs sm:text-sm font-display tabular-nums";
const atkTotalCls =
  "h-8 sm:h-9 w-full min-w-[2.5rem] flex items-center justify-center rounded border-[3px] border-foreground bg-gold/15 font-display text-sm font-bold tabular-nums text-gold";

function AttackOpCell({ children }: { children: string }) {
  return <td className={atkOpTdCls}>{children}</td>;
}

const CombatPanel = ({
  subAttributes,
  attributes,
  purchased,
  customItems = [],
  selectedRaceClassAdv,
  selectedClass,
  characterLevel,
  loadout,
  onLoadoutChange,
}: CombatPanelProps) => {
  const [newMagicLabel, setNewMagicLabel] = useState("");
  const [newMagicValue, setNewMagicValue] = useState("0");

  const bodyArmors = useMemo(() => getPurchasedBodyArmors(purchased), [purchased]);
  const shields = useMemo(() => getPurchasedShields(purchased), [purchased]);
  const weapons = useMemo(
    () => getAvailableWeapons(purchased, customItems),
    [purchased, customItems],
  );
  const artesMarciaisAtivas = hasArtesMarciais(selectedRaceClassAdv);
  const martialArtsDamage = getMartialArtsDamageByLevel(characterLevel);

  const breakdown = useMemo(
    () =>
      computeArmorClassBreakdown({
        subAttributes,
        purchased,
        selectedRaceClassAdv,
        destrezaMain: attributes.Destreza,
        sabedoriaMain: attributes.Sabedoria,
        loadout,
      }),
    [subAttributes, purchased, selectedRaceClassAdv, attributes.Destreza, attributes.Sabedoria, loadout]
  );

  const hpBreakdown = useMemo(
    () =>
      computeHitPointsBreakdown({
        subAttributes,
        constMain: attributes.Constituição,
        selectedClass,
      }),
    [subAttributes, attributes.Constituição, selectedClass]
  );

  const update = (patch: Partial<CombatLoadout>) => {
    onLoadoutChange({ ...loadout, ...patch });
  };

  const updateWeaponSlot = (index: number, patch: Partial<WeaponAttackSlot>) => {
    const slots = loadout.weaponSlots.map((slot, i) => {
      if (i !== index) return slot;
      const next = { ...slot, ...patch };
      if (patch.equipmentId !== undefined) {
        if (patch.equipmentId) {
          const item = weapons.find((w) => w.id === patch.equipmentId);
          if (item) {
            return {
              ...next,
              ...weaponSlotFromEquipment(item),
              forcaOverride: null,
              destrezaOverride: null,
              baseOverride: null,
            };
          }
        } else {
          return {
            ...next,
            equipmentId: null,
          };
        }
      }
      return next;
    });
    update({ weaponSlots: slots });
  };

  const addMagicBonus = () => {
    const label = newMagicLabel.trim();
    const value = Number(newMagicValue);
    if (!label || Number.isNaN(value) || value === 0) return;
    const entry: MagicCaBonus = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      value,
    };
    update({ magicBonuses: [...loadout.magicBonuses, entry] });
    setNewMagicLabel("");
    setNewMagicValue("0");
  };

  const removeMagicBonus = (id: string) => {
    update({ magicBonuses: loadout.magicBonuses.filter((b) => b.id !== id) });
  };

  const formatSigned = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  const maxHp = hpBreakdown.total;
  const currentHp = resolveCurrentHp(loadout.currentHp, maxHp);

  const setCurrentHp = (value: number) => {
    update({ currentHp: Math.max(0, value) });
  };

  const adjustCurrentHp = (delta: number) => {
    const base = resolveCurrentHp(loadout.currentHp, maxHp);
    setCurrentHp(base + delta);
  };

  const maxChi = loadout.maxChi;
  const currentChi = resolveResourceCurrent(loadout.currentChi, maxChi);
  const chiHint = "Inicia em 0. Aumente conforme o personagem evoluir.";

  const caFields: CaField[] = [
    { label: "Base", value: breakdown.base },
    {
      label: "Destreza",
      value: formatSigned(breakdown.destreza),
      hint: `Equilíbrio ${subAttributes["Equilíbrio"] ?? attributes.Destreza}`,
    },
    {
      label: "Armadura",
      value: formatSigned(breakdown.armadura),
      hint: breakdown.equippedArmorName ?? "Nenhuma",
    },
    { label: "Elmo", value: formatSigned(breakdown.elmo) },
    {
      label: "Escudo",
      value: formatSigned(breakdown.escudo),
      hint: breakdown.equippedShieldName ?? "Nenhum",
    },
    { label: "Outros", value: formatSigned(breakdown.outros) },
    { label: "Magia", value: formatSigned(breakdown.magia) },
    ...(breakdown.hasWisdomDefense
      ? [
          {
            label: "Sabedoria",
            value: formatSigned(breakdown.sabedoria),
            hint: `Força de Vontade ${subAttributes["Força de Vontade"] ?? attributes.Sabedoria}`,
          } satisfies CaField,
        ]
      : []),
    { label: "Total", value: breakdown.total, isTotal: true },
  ];

  const showChi = loadout.showChi;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-3 rounded-lg border border-border bg-card/40 px-3 py-2 sm:px-4">
        <Label
          htmlFor="show-chi-toggle"
          className="font-display text-xs tracking-wider uppercase text-muted-foreground cursor-pointer flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 text-gold" />
          Pontos de Chi
        </Label>
        <Switch
          id="show-chi-toggle"
          checked={showChi}
          onCheckedChange={(checked) => update({ showChi: checked })}
        />
      </div>

      <div className="rounded-lg border border-border bg-card/60 p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-4">
          <div className="shrink-0 min-w-0">
            <h3 className={sectionTitleCls}>
              <Heart className="w-4 h-4 text-gold" />
              Pontos de Vida
            </h3>
            <HitPointsFormulaRow
              base={hpBreakdown.base}
              condBonus={hpBreakdown.condicionamentoBonus}
              total={maxHp}
              condHint={`Cond. ${hpBreakdown.condicionamentoValue} — ${hpBreakdown.ajstPVRaw}${
                hpBreakdown.usesFighterModifier ? " (marcial)" : ""
              }`}
              currentHp={currentHp}
              maxHp={maxHp}
              tracksCurrentHp={loadout.currentHp != null}
              formatSigned={formatSigned}
              onCurrentHpChange={setCurrentHp}
              onAdjustCurrentHp={adjustCurrentHp}
              onFollowMax={() => update({ currentHp: null })}
            />
            <p className="text-[10px] text-muted-foreground font-body mt-2 text-center md:text-left">
              8 PV base + Ajst. PV (Cond.).
              {hpBreakdown.usesFighterModifier
                ? " Marciais usam o valor entre parênteses."
                : " Demais classes usam o valor normal."}
            </p>
          </div>

          <div className="hidden md:block w-px self-stretch bg-border/60 shrink-0" />

          <div className="flex-1 min-w-0 md:border-0 border-t border-border/60 pt-4 md:pt-0">
            <h3 className={sectionTitleCls}>
              <Shield className="w-4 h-4 text-gold" />
              Categoria de Armadura (CA)
            </h3>
            <CaFormulaRow fields={caFields} />
          </div>
        </div>
      </div>

      {showChi && (
      <div className="rounded-lg border border-border bg-card/60 p-3 sm:p-4">
        <h3 className={sectionTitleCls}>
          <Zap className="w-4 h-4 text-gold" />
          Pontos de Chi
        </h3>
        <div className="max-w-sm mx-auto">
          <ResourcePoolRow
            max={maxChi}
            current={currentChi}
            tracksCurrent={loadout.currentChi != null}
            onMaxChange={(value) => update({ maxChi: Math.max(0, value) })}
            onAdjustMax={(delta) => update({ maxChi: Math.max(0, loadout.maxChi + delta) })}
            onCurrentChange={(value) => update({ currentChi: Math.max(0, value) })}
            onAdjustCurrent={(delta) => {
              const base = resolveResourceCurrent(loadout.currentChi, maxChi);
              update({ currentChi: Math.max(0, base + delta) });
            }}
            onFollowMax={() => update({ currentChi: null })}
            hint={chiHint}
          />
        </div>
      </div>
      )}

      <div className="rounded-lg border border-border bg-card/60 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className={`${sectionTitleCls} sm:justify-start mb-0`}>
            <Swords className="w-4 h-4 text-gold" />
            Jogada de Ataque
          </h3>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <span className="font-display text-xs tracking-wider uppercase text-muted-foreground">
              Base de Ataque
            </span>
            <button
              type="button"
              onClick={() =>
                update({ attackBaseBonus: Math.max(0, loadout.attackBaseBonus - 1) })
              }
              className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              min={0}
              value={loadout.attackBaseBonus}
              onChange={(e) =>
                update({
                  attackBaseBonus: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-14 text-center bg-background/50 border border-border rounded px-2 py-1.5 font-display text-sm"
            />
            <button
              type="button"
              onClick={() => update({ attackBaseBonus: loadout.attackBaseBonus + 1 })}
              className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted-foreground font-body">
              Nível {characterLevel}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-body text-center sm:text-left mb-4">
          A base de ataque começa em 0. Aumente conforme o personagem evolui de nível.
        </p>

        <div className="overflow-x-auto pb-1">
          <div className="inline-flex items-start gap-8 sm:gap-14 min-w-full justify-center">
            <table className="border-collapse shrink-0">
              <thead>
                <tr>
                  <th rowSpan={2} className={`${atkThCls} min-w-[8rem] sm:min-w-[10rem] text-left`}>
                    Arma
                  </th>
                  <th rowSpan={2} className={`${atkThCls} w-10 sm:w-12`}>
                    Tipo
                  </th>
                  <th colSpan={3} className={atkThCls}>
                    Dano
                  </th>
                </tr>
                <tr>
                  <th className={`${atkThCls} w-14 sm:w-16`}>P/M</th>
                  <th className={`${atkThCls} w-14 sm:w-16`}>G</th>
                  <th className={`${atkThCls} w-12 sm:w-14`}>Bônus</th>
                </tr>
              </thead>
              <tbody>
                {loadout.weaponSlots.map((slot, index) => {
                  const isMartialArtsRow = artesMarciaisAtivas && index === 0;
                  const attackBreakdown = computeAttackRollBreakdown({
                    slot,
                    subAttributes,
                    forcaMain: attributes.Força,
                    destrezaMain: attributes.Destreza,
                    selectedRaceClassAdv,
                    attackBaseBonus: loadout.attackBaseBonus,
                    isMartialArts: isMartialArtsRow,
                    customItems,
                  });

                  return (
                    <tr key={slot.id}>
                      <td className={atkTdCls}>
                        {isMartialArtsRow ? (
                          <div
                            className="h-8 sm:h-9 flex items-center px-2 text-xs font-body font-medium text-foreground"
                            title="Golpes desarmados ou com armas marciais"
                          >
                            Artes Marciais
                          </div>
                        ) : slot.equipmentId ? (
                          <select
                            value={slot.equipmentId}
                            onChange={(e) =>
                              updateWeaponSlot(index, {
                                equipmentId: e.target.value || null,
                              })
                            }
                            className="w-full h-8 sm:h-9 bg-background/50 border border-border rounded px-2 text-xs font-body"
                          >
                            <option value="">Arma personalizada</option>
                            {weapons.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex gap-1 min-w-0">
                            <input
                              type="text"
                              value={slot.name}
                              onChange={(e) =>
                                updateWeaponSlot(index, { name: e.target.value })
                              }
                              placeholder="Nome da arma"
                              className="flex-1 min-w-0 h-8 sm:h-9 bg-background/50 border border-border rounded px-2 text-xs font-body"
                            />
                            <select
                              value=""
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateWeaponSlot(index, {
                                    equipmentId: e.target.value,
                                  });
                                }
                              }}
                              className="w-8 shrink-0 h-8 sm:h-9 bg-background/50 border border-border rounded text-[10px] text-muted-foreground"
                              title="Escolher do inventário"
                            >
                              <option value="">▼</option>
                              {weapons.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className={atkTdCls}>
                        {isMartialArtsRow ? (
                          <div className={atkReadonlyCls}>—</div>
                        ) : (
                          <input
                            type="text"
                            value={slot.tipo}
                            onChange={(e) =>
                              updateWeaponSlot(index, { tipo: e.target.value })
                            }
                            placeholder="—"
                            className={`${atkInputCls} uppercase`}
                            title="Tipo (p, c, e…)"
                          />
                        )}
                      </td>
                      <td className={atkTdCls}>
                        {isMartialArtsRow ? (
                          <div
                            className={atkReadonlyCls}
                            title={`Dano evolutivo (nível ${characterLevel})`}
                          >
                            {martialArtsDamage}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={slot.damageSm}
                            onChange={(e) =>
                              updateWeaponSlot(index, { damageSm: e.target.value })
                            }
                            placeholder="P/M"
                            className={atkInputCls}
                            title="Dano P/M"
                          />
                        )}
                      </td>
                      <td className={atkTdCls}>
                        {isMartialArtsRow ? (
                          <div
                            className={atkReadonlyCls}
                            title={`Dano evolutivo (nível ${characterLevel})`}
                          >
                            {martialArtsDamage}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={slot.damageLg}
                            onChange={(e) =>
                              updateWeaponSlot(index, { damageLg: e.target.value })
                            }
                            placeholder="G"
                            className={atkInputCls}
                            title="Dano G"
                          />
                        )}
                      </td>
                      <td className={atkTdCls}>
                        <div
                          className={atkReadonlyCls}
                          title={
                            attackBreakdown.martialArtsUsesAtaqueDestro
                              ? "Ataque Destro: maior entre Chance de Acerto (Músculos) e Ajuste de Defesa (Equilíbrio)"
                              : "Ajuste de Dano (Músculos)"
                          }
                        >
                          {formatSigned(attackBreakdown.damageBonus)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <table className="border-collapse shrink-0">
              <thead>
                <tr>
                  <th colSpan={11} className={atkThCls}>
                    Jogada de Ataque
                  </th>
                </tr>
                <tr>
                  <th className={`${atkThCls} w-12 sm:w-14`}>Base</th>
                  <th className={`${atkThCls} w-5 sm:w-6 border-0 bg-transparent`} aria-hidden />
                  <th className={`${atkThCls} w-12 sm:w-14`}>Força</th>
                  <th className={`${atkThCls} w-5 sm:w-6 border-0 bg-transparent`} aria-hidden />
                  <th className={`${atkThCls} w-12 sm:w-14`}>Destreza</th>
                  <th className={`${atkThCls} w-5 sm:w-6 border-0 bg-transparent`} aria-hidden />
                  <th className={`${atkThCls} w-12 sm:w-14`}>Perícia</th>
                  <th className={`${atkThCls} w-5 sm:w-6 border-0 bg-transparent`} aria-hidden />
                  <th className={`${atkThCls} w-12 sm:w-14`}>Magia</th>
                  <th className={`${atkThCls} w-5 sm:w-6 border-0 bg-transparent`} aria-hidden />
                  <th className={`${atkThCls} w-12 sm:w-14`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {loadout.weaponSlots.map((slot, index) => {
                  const isMartialArtsRow = artesMarciaisAtivas && index === 0;
                  const attackBreakdown = computeAttackRollBreakdown({
                    slot,
                    subAttributes,
                    forcaMain: attributes.Força,
                    destrezaMain: attributes.Destreza,
                    selectedRaceClassAdv,
                    attackBaseBonus: loadout.attackBaseBonus,
                    isMartialArts: isMartialArtsRow,
                    customItems,
                  });

                  return (
                    <tr key={slot.id}>
                      <td className={atkTdCls}>
                        <input
                          type="number"
                          value={slot.baseOverride ?? attackBreakdown.base}
                          onChange={(e) =>
                            updateWeaponSlot(index, {
                              baseOverride:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className={atkInputCls}
                        />
                      </td>
                      <AttackOpCell>+</AttackOpCell>
                      <td className={atkTdCls}>
                        <input
                          type="number"
                          value={slot.forcaOverride ?? attackBreakdown.forca}
                          onChange={(e) =>
                            updateWeaponSlot(index, {
                              forcaOverride:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          title={
                            attackBreakdown.isRanged
                              ? "Somente armas de mão — use Destreza para ataque à distância"
                              : attackBreakdown.usesAtaqueDestro
                                ? "Ataque Destro: maior entre Chance de Acerto (Músculos) e Equilíbrio"
                                : "Chance de Acerto (Músculos)"
                          }
                          className={atkInputCls}
                        />
                      </td>
                      <AttackOpCell>+</AttackOpCell>
                      <td className={atkTdCls}>
                        <input
                          type="number"
                          value={slot.destrezaOverride ?? attackBreakdown.destreza}
                          onChange={(e) =>
                            updateWeaponSlot(index, {
                              destrezaOverride:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          title={
                            attackBreakdown.isRanged
                              ? "Atq. Dist. (Precisão) — arcos, bestas e ataque à distância"
                              : "Somente ataque à distância — use Força em armas de mão"
                          }
                          className={atkInputCls}
                        />
                      </td>
                      <AttackOpCell>+</AttackOpCell>
                      <td className={atkTdCls}>
                        <input
                          type="number"
                          value={slot.periciaOverride ?? attackBreakdown.pericia}
                          onChange={(e) =>
                            updateWeaponSlot(index, {
                              periciaOverride:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          className={atkInputCls}
                        />
                      </td>
                      <AttackOpCell>+</AttackOpCell>
                      <td className={atkTdCls}>
                        <input
                          type="number"
                          value={slot.magiaAttack}
                          onChange={(e) =>
                            updateWeaponSlot(index, {
                              magiaAttack: Number(e.target.value) || 0,
                            })
                          }
                          className={atkInputCls}
                        />
                      </td>
                      <AttackOpCell>=</AttackOpCell>
                      <td className={atkTdCls}>
                        <div className={atkTotalCls}>{attackBreakdown.total}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-body mt-4 text-center">
          <Swords className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
          Força soma em armas de mão (Chance de Acerto / Músculos). Destreza soma só em
          ataque à distância (Atq. Dist. / Precisão). Nas demais linhas, o bônus ao lado do
          dano é o Ajuste de Dano (Músculos). Com Artes Marciais, a primeira linha mostra o
          dano evolutivo; com Ataque Destro, ataque e bônus de dano usam o maior entre
          Chance de Acerto (Músculos) e Ajuste de Defesa (Equilíbrio).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <section className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
          <h4 className="font-display text-sm tracking-wider uppercase flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold" />
            Equipamento vestido
          </h4>

          <div>
            <label className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block">
              Armadura
            </label>
            <select
              value={loadout.equippedArmorId ?? ""}
              onChange={(e) =>
                update({ equippedArmorId: e.target.value || null })
              }
              className="w-full bg-background/50 border border-border rounded px-3 py-2 text-sm font-body"
            >
              <option value="">Sem armadura</option>
              {bodyArmors.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.armorClass != null ? ` (${formatArmorClass(item.armorClass)})` : ""}
                </option>
              ))}
            </select>
            {bodyArmors.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Compre armaduras na aba Inventário.
              </p>
            )}
          </div>

          <div>
            <label className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block">
              Escudo
            </label>
            <select
              value={loadout.equippedShieldId ?? ""}
              onChange={(e) =>
                update({ equippedShieldId: e.target.value || null })
              }
              className="w-full bg-background/50 border border-border rounded px-3 py-2 text-sm font-body"
            >
              <option value="">Sem escudo</option>
              {shields.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.armorClass != null ? ` (${formatArmorClass(item.armorClass)})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block">
              Elmo (bônus)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  update({ helmetBonus: loadout.helmetBonus - 1 })
                }
                className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={loadout.helmetBonus}
                onChange={(e) =>
                  update({ helmetBonus: Number(e.target.value) || 0 })
                }
                className="w-20 text-center bg-background/50 border border-border rounded px-2 py-1.5 font-display"
              />
              <button
                type="button"
                onClick={() =>
                  update({ helmetBonus: loadout.helmetBonus + 1 })
                }
                className="w-8 h-8 rounded border border-border flex items-center justify-center hover:bg-muted"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
          <h4 className="font-display text-sm tracking-wider uppercase">Outros bônus</h4>

          {breakdown.outrosAuto.length > 0 ? (
            <ul className="text-sm font-body space-y-1">
              {breakdown.outrosAuto.map((entry) => (
                <li key={entry.label} className="flex justify-between text-muted-foreground">
                  <span>{entry.label}</span>
                  <span className="text-gold font-display">+{entry.value}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum bônus automático (Pele dura, Bom de esquiva, etc.).
            </p>
          )}

          <div>
            <label className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-1 block">
              Ajuste manual em Outros
            </label>
            <input
              type="number"
              value={loadout.outrosBonus}
              onChange={(e) =>
                update({ outrosBonus: Number(e.target.value) || 0 })
              }
              className="w-full bg-background/50 border border-border rounded px-3 py-2 text-sm font-body"
            />
          </div>

          <div className="pt-2 border-t border-border/60">
            <h5 className="font-display text-xs tracking-wider uppercase text-muted-foreground mb-2">
              Magia
            </h5>
            {loadout.magicBonuses.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {loadout.magicBonuses.map((bonus) => (
                  <li
                    key={bonus.id}
                    className="flex items-center justify-between gap-2 text-sm font-body bg-background/40 rounded px-2 py-1.5"
                  >
                    <span className="truncate">
                      {bonus.label}{" "}
                      <span className="text-gold font-display">
                        {formatSigned(bonus.value)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMagicBonus(bonus.id)}
                      className="text-destructive hover:text-destructive/80 shrink-0"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="Descrição"
                value={newMagicLabel}
                onChange={(e) => setNewMagicLabel(e.target.value)}
                className="flex-1 min-w-[8rem] bg-background/50 border border-border rounded px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                value={newMagicValue}
                onChange={(e) => setNewMagicValue(e.target.value)}
                className="w-16 bg-background/50 border border-border rounded px-2 py-1.5 text-sm text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMagicBonus}
                className="font-display text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CombatPanel;
