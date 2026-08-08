import { useMemo } from "react";
import { Crosshair, Swords } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AttributeName } from "@/data/characterData";
import type { CustomInventoryItem, PurchasedItems } from "@/data/equipment";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import {
  computeAttackRollBreakdown,
  createEmptyWeaponSlot,
  getAvailableWeapons,
  getMartialArtsDamageByLevel,
  hasArtesMarciais,
  weaponSlotFromEquipment,
  type CombatLoadout,
} from "@/lib/combatStats";
import { mergeInventory } from "@/lib/inventory";
import {
  countWeaponMasterySlots,
  getWeaponExpertiseBonuses,
  matchWeaponProficiency,
  resolveWeaponExpertiseLevel,
  weaponExpertiseLabel,
  type WeaponExpertiseLevel,
} from "@/lib/weaponPlayStats";

function formatSigned(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function formatDamage(dice: string, bonus: number): string {
  const base = dice.trim() || "—";
  if (base === "—" || bonus === 0) return base;
  return `${base}${formatSigned(bonus)}`;
}

interface PlayWeaponsPanelProps {
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  purchasedItems: PurchasedItems;
  addedItems?: PurchasedItems;
  customItems?: CustomInventoryItem[];
  selectedRaceClassAdv: string[];
  selectedAdvantages: string[];
  selectedWeapons: string[];
  selectedWeaponGroups: string[];
  selectedShields?: string[];
  characterLevel: number;
  loadout: CombatLoadout;
  onLoadoutChange: (loadout: CombatLoadout) => void;
}

const PlayWeaponsPanel = ({
  attributes,
  subAttributes,
  purchasedItems,
  addedItems = {},
  customItems = [],
  selectedRaceClassAdv,
  selectedAdvantages,
  selectedWeapons,
  selectedWeaponGroups,
  selectedShields = [],
  characterLevel,
  loadout,
  onLoadoutChange,
}: PlayWeaponsPanelProps) => {
  const inventory = mergeInventory(purchasedItems, addedItems);
  const weapons = useMemo(
    () => getAvailableWeapons(inventory, customItems),
    [inventory, customItems],
  );

  const weaponGroupItems = selectedWeaponGroups.map((gName) => {
    const group = weaponGroups.find((g) => g.name === gName);
    return { name: gName, label: group ? `${gName} (grupo)` : gName };
  });
  const individualWeaponItems = selectedWeapons
    .filter((wk) => {
      const [groupName] = wk.split("::");
      return !selectedWeaponGroups.includes(groupName);
    })
    .map((wk) => {
      const [, weaponName] = wk.split("::");
      return { key: wk, name: weaponName || wk };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const shieldItems = selectedShields.map((sName) => {
    const shield = shieldProficiencies.find((s) => s.name === sName);
    return { name: sName, bonus: shield?.bonusCA ?? "" };
  });
  const hasProficiencies =
    weaponGroupItems.length > 0 ||
    individualWeaponItems.length > 0 ||
    shieldItems.length > 0;
  const artesMarciais = hasArtesMarciais(selectedRaceClassAdv);
  const martialArtsDamage = getMartialArtsDamageByLevel(characterLevel);
  const slots = countWeaponMasterySlots({
    selectedAdvantages,
    selectedRaceClassAdv,
  });

  const masteryMap = loadout.weaponMastery ?? {};

  const usedSpecialization = Object.values(masteryMap).filter(
    (v) => v === "especializacao" || v === "maestria",
  ).length;
  const usedMastery = Object.values(masteryMap).filter((v) => v === "maestria").length;

  const setMastery = (weaponId: string, level: WeaponExpertiseLevel) => {
    const next = { ...masteryMap };
    if (level === "nenhuma" || level === "pericia") {
      delete next[weaponId];
    } else {
      next[weaponId] = level;
    }
    onLoadoutChange({ ...loadout, weaponMastery: next });
  };

  const rows = weapons.map((item) => {
    const match = matchWeaponProficiency(item, selectedWeapons, selectedWeaponGroups);
    const level = resolveWeaponExpertiseLevel(match.proficient, masteryMap[item.id]);
    const expertise = getWeaponExpertiseBonuses(level);
    const proficiencyAttack = match.proficient ? 0 : match.penaltyNoProficiency;

    const slot = {
      ...createEmptyWeaponSlot(0),
      ...weaponSlotFromEquipment(item),
      periciaOverride: proficiencyAttack + expertise.attack,
      magiaAttack: 0,
    };

    const attack = computeAttackRollBreakdown({
      slot,
      subAttributes,
      forcaMain: attributes.Força,
      destrezaMain: attributes.Destreza,
      selectedRaceClassAdv,
      attackBaseBonus: loadout.attackBaseBonus,
      customItems,
    });

    const damageBonus = attack.damageBonus + expertise.damage;

    return {
      item,
      match,
      level,
      attack,
      damageBonus,
      damageSm: item.weaponStats?.damagePM ?? "—",
      damageLg: item.weaponStats?.damageG ?? "—",
      tipo: item.weaponStats?.type ?? "—",
    };
  });

  return (
    <div className="space-y-4">
      {hasProficiencies && (
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 space-y-2">
          <p className="font-display text-[10px] tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-gold" />
            Perícias com armas
          </p>
          {weaponGroupItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {weaponGroupItems.map(({ name, label }) => (
                <span
                  key={name}
                  className="inline-flex rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-body"
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          {individualWeaponItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {individualWeaponItems.map(({ key, name }) => (
                <span
                  key={key}
                  className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-body"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
          {shieldItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {shieldItems.map(({ name, bonus }) => (
                <span
                  key={name}
                  className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-body"
                >
                  {name}
                  {bonus && <span className="text-muted-foreground ml-1">{bonus}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-body text-muted-foreground">
        <span>Base de ataque {formatSigned(loadout.attackBaseBonus)}</span>
        {slots.specialization > 0 && (
          <span>
            Especialização {usedSpecialization}/{slots.specialization}
          </span>
        )}
        {slots.mastery > 0 && (
          <span>
            Maestria {usedMastery}/{slots.mastery}
          </span>
        )}
      </div>

      {artesMarciais && (
        <div className="rounded-lg border border-gold/25 bg-gold/5 px-3 py-2.5 grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_7rem_6rem_minmax(0,1fr)_5.5rem] gap-2 items-center">
          <div className="min-w-0">
            <p className="font-body text-sm font-medium text-foreground">Artes Marciais</p>
            <p className="text-[10px] text-muted-foreground font-display tracking-wider uppercase mt-0.5">
              Desarmado
            </p>
          </div>
          <div>
            <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground">
              Domínio
            </p>
            <p className="text-xs font-body text-gold-dark font-semibold">Perícia</p>
          </div>
          <div>
            <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground">
              Ataque
            </p>
            <p className="font-display text-sm font-bold tabular-nums text-foreground">
              {formatSigned(
                computeAttackRollBreakdown({
                  slot: createEmptyWeaponSlot(0),
                  subAttributes,
                  forcaMain: attributes.Força,
                  destrezaMain: attributes.Destreza,
                  selectedRaceClassAdv,
                  attackBaseBonus: loadout.attackBaseBonus,
                  isMartialArts: true,
                }).total,
              )}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground">
              Dano
            </p>
            <p className="text-xs font-body tabular-nums">
              {martialArtsDamage}
              {(() => {
                const atk = computeAttackRollBreakdown({
                  slot: createEmptyWeaponSlot(0),
                  subAttributes,
                  forcaMain: attributes.Força,
                  destrezaMain: attributes.Destreza,
                  selectedRaceClassAdv,
                  attackBaseBonus: loadout.attackBaseBonus,
                  isMartialArts: true,
                });
                return atk.damageBonus !== 0 ? ` (${formatSigned(atk.damageBonus)})` : "";
              })()}
            </p>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body py-4 text-center flex flex-col items-center gap-2">
          <Swords className="w-6 h-6 opacity-40" />
          Nenhuma arma no inventário.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[minmax(0,1.4fr)_8.5rem_4.5rem_5rem_minmax(0,1.2fr)] gap-2 px-2.5 text-[10px] font-display tracking-wider uppercase text-muted-foreground">
            <span>Arma</span>
            <span>Domínio</span>
            <span className="text-center">Ataque</span>
            <span className="text-center">Tipo</span>
            <span>Dano P/M · G</span>
          </div>

          {rows.map((row) => {
            const canSpecialize =
              row.match.proficient &&
              (slots.specialization > 0 || masteryMap[row.item.id] != null);
            const canMaster =
              row.match.proficient &&
              (slots.mastery > 0 || masteryMap[row.item.id] === "maestria");

            const specializeAvailable =
              canSpecialize &&
              (masteryMap[row.item.id] != null ||
                usedSpecialization < slots.specialization ||
                row.level === "especializacao" ||
                row.level === "maestria");

            const masteryAvailable =
              canMaster &&
              (masteryMap[row.item.id] === "maestria" || usedMastery < slots.mastery);

            return (
              <div
                key={row.item.id}
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_8.5rem_4.5rem_5rem_minmax(0,1.2fr)] gap-2 items-center rounded-lg border border-border bg-card px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm text-foreground truncate">{row.item.name}</p>
                  {!row.match.proficient && (
                    <p className="text-[10px] text-blood/80 font-body">
                      Penalidade {row.match.penaltyNoProficiency}
                    </p>
                  )}
                </div>

                <div>
                  <p className="sm:hidden font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-0.5">
                    Domínio
                  </p>
                  {canSpecialize || canMaster ? (
                    <Select
                      value={row.level}
                      onValueChange={(next) =>
                        setMastery(row.item.id, next as WeaponExpertiseLevel)
                      }
                    >
                      <SelectTrigger className="h-8 text-xs font-body border-border/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhuma" disabled={row.match.proficient} className="text-xs">
                          Sem perícia
                        </SelectItem>
                        <SelectItem value="pericia" disabled={!row.match.proficient} className="text-xs">
                          Perícia
                        </SelectItem>
                        {specializeAvailable && (
                          <SelectItem value="especializacao" className="text-xs">
                            Especialização
                          </SelectItem>
                        )}
                        {masteryAvailable && (
                          <SelectItem value="maestria" className="text-xs">
                            Maestria
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={`inline-flex text-xs font-body font-medium px-2 py-1 rounded border ${
                        row.level === "nenhuma"
                          ? "border-blood/30 text-blood bg-blood/5"
                          : "border-gold/30 text-gold-dark bg-gold/10"
                      }`}
                    >
                      {weaponExpertiseLabel(row.level)}
                    </span>
                  )}
                </div>

                <div className="text-left sm:text-center">
                  <p className="sm:hidden font-display text-[9px] tracking-wider uppercase text-muted-foreground">
                    Ataque
                  </p>
                  <p
                    className="font-display text-sm font-bold tabular-nums"
                    title={`Base ${formatSigned(row.attack.base)} · Força ${formatSigned(row.attack.forca)} · Des ${formatSigned(row.attack.destreza)} · Perícia ${formatSigned(row.attack.pericia)}`}
                  >
                    {formatSigned(row.attack.total)}
                  </p>
                </div>

                <div className="text-left sm:text-center">
                  <p className="sm:hidden font-display text-[9px] tracking-wider uppercase text-muted-foreground">
                    Tipo
                  </p>
                  <p className="text-xs font-body uppercase text-muted-foreground">{row.tipo}</p>
                </div>

                <div>
                  <p className="sm:hidden font-display text-[9px] tracking-wider uppercase text-muted-foreground">
                    Dano
                  </p>
                  <p className="text-xs font-body tabular-nums text-foreground">
                    {formatDamage(row.damageSm, row.damageBonus)}
                    <span className="text-muted-foreground mx-1">·</span>
                    {formatDamage(row.damageLg, row.damageBonus)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlayWeaponsPanel;
