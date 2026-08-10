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
import type { CustomInventoryItem, EquipmentItem, PurchasedItems } from "@/data/equipment";
import { weaponGroups, shieldProficiencies } from "@/data/weaponProficiencies";
import {
  computeAttackRollBreakdown,
  createEmptyWeaponSlot,
  getAvailableWeapons,
  getMartialArtsDamageByLevel,
  hasArtesMarciais,
  weaponSlotFromEquipment,
  type CombatLoadout,
  type WeaponAttackSlot,
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

function equipmentFromManualSlot(slot: WeaponAttackSlot): EquipmentItem {
  const name = slot.name.trim();
  return {
    id: slot.id,
    name,
    category: "arma",
    tab: "armas",
    pricePc: 0,
    weightKg: 0,
    weaponStats: {
      size: "",
      type: slot.tipo,
      speed: "",
      damagePM: slot.damageSm || slot.damageLg || "—",
      damageG: slot.damageLg || slot.damageSm || "—",
    },
  };
}

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
  const inventoryWeapons = useMemo(
    () => getAvailableWeapons(inventory, customItems),
    [inventory, customItems],
  );

  const weapons = useMemo(() => {
    const ownedNames = new Set(
      inventoryWeapons.map((w) => w.name.trim().toLowerCase()).filter(Boolean),
    );

    // Armas digitadas no Combate ("Arma personalizada") que não estão no inventário.
    const fromManualSlots = loadout.weaponSlots
      .filter((slot) => {
        if (slot.equipmentId) return false;
        const name = slot.name.trim();
        return name.length > 0 && !ownedNames.has(name.toLowerCase());
      })
      .map(equipmentFromManualSlot);

    return [...inventoryWeapons, ...fromManualSlots].sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [inventoryWeapons, loadout.weaponSlots]);

  const manualWeaponIds = useMemo(() => {
    const ids = new Set<string>();
    for (const slot of loadout.weaponSlots) {
      if (slot.equipmentId) continue;
      if (!slot.name.trim()) continue;
      ids.add(slot.id);
    }
    return ids;
  }, [loadout.weaponSlots]);

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
    const isManual = manualWeaponIds.has(item.id);
    const match = isManual
      ? {
          proficient: true,
          group: null,
          weaponName: item.name,
          penaltyNoProficiency: 0,
        }
      : matchWeaponProficiency(item, selectedWeapons, selectedWeaponGroups);
    const level = resolveWeaponExpertiseLevel(match.proficient, masteryMap[item.id]);
    const expertise = getWeaponExpertiseBonuses(level);
    const proficiencyAttack = match.proficient ? 0 : match.penaltyNoProficiency;

    const loadoutSlot = loadout.weaponSlots.find(
      (s) =>
        s.id === item.id ||
        s.equipmentId === item.id ||
        (!s.equipmentId &&
          s.name.trim().toLowerCase() === item.name.trim().toLowerCase()),
    );

    const slot: WeaponAttackSlot = {
      ...(loadoutSlot ?? createEmptyWeaponSlot(0)),
      ...weaponSlotFromEquipment(item),
      id: item.id,
      periciaOverride: proficiencyAttack + expertise.attack,
      ...(loadoutSlot && !loadoutSlot.equipmentId
        ? {
            equipmentId: null,
            name: loadoutSlot.name,
            tipo: loadoutSlot.tipo || item.weaponStats?.type || "",
            damageSm: loadoutSlot.damageSm || item.weaponStats?.damagePM || "",
            damageLg: loadoutSlot.damageLg || item.weaponStats?.damageG || "",
            weaponBonus: loadoutSlot.weaponBonus,
            magiaAttack: loadoutSlot.magiaAttack,
            forcaOverride: loadoutSlot.forcaOverride,
            destrezaOverride: loadoutSlot.destrezaOverride,
            baseOverride: loadoutSlot.baseOverride,
          }
        : { magiaAttack: loadoutSlot?.magiaAttack ?? 0 }),
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
      damageSm: slot.damageSm || item.weaponStats?.damagePM || "—",
      damageLg: slot.damageLg || item.weaponStats?.damageG || "—",
      tipo: slot.tipo || item.weaponStats?.type || "—",
    };
  });

  return (
    <div className="space-y-4">
      {hasProficiencies && (
        <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 space-y-2">
          <p className="font-display text-micro tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-gold" />
            Perícias com armas
          </p>
          {weaponGroupItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {weaponGroupItems.map(({ name, label }) => (
                <span
                  key={name}
                  className="inline-flex rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-meta font-body"
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
                  className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-meta font-body"
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
                  className="inline-flex rounded-md border border-border bg-card px-2 py-0.5 text-meta font-body"
                >
                  {name}
                  {bonus && <span className="text-muted-foreground ml-1">{bonus}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta font-body text-muted-foreground">
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
            <p className="font-body text-field font-medium text-foreground">Artes Marciais</p>
            <p className="text-micro text-muted-foreground font-display tracking-wider uppercase mt-0.5">
              Desarmado
            </p>
          </div>
          <div>
            <p className="font-display text-micro tracking-wider uppercase text-muted-foreground">
              Domínio
            </p>
            <p className="text-meta font-body text-gold-dark font-semibold">Perícia</p>
          </div>
          <div>
            <p className="font-display text-micro tracking-wider uppercase text-muted-foreground">
              Ataque
            </p>
            <p className="font-display text-field font-bold tabular-nums text-foreground">
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
            <p className="font-display text-micro tracking-wider uppercase text-muted-foreground">
              Dano
            </p>
            <p className="text-meta font-body tabular-nums">
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
        <p className="text-field text-muted-foreground font-body py-4 text-center flex flex-col items-center gap-2">
          <Swords className="w-6 h-6 opacity-40" />
          Nenhuma arma no inventário.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[minmax(0,1.4fr)_8.5rem_4.5rem_5rem_minmax(0,1.2fr)] gap-2 px-2.5 text-micro font-display tracking-wider uppercase text-muted-foreground">
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
                  <p className="font-body text-field text-foreground truncate">{row.item.name}</p>
                  {!row.match.proficient && (
                    <p className="text-micro text-blood/80 font-body">
                      Penalidade {row.match.penaltyNoProficiency}
                    </p>
                  )}
                </div>

                <div>
                  <p className="sm:hidden font-display text-micro tracking-wider uppercase text-muted-foreground mb-0.5">
                    Domínio
                  </p>
                  {canSpecialize || canMaster ? (
                    <Select
                      value={row.level}
                      onValueChange={(next) =>
                        setMastery(row.item.id, next as WeaponExpertiseLevel)
                      }
                    >
                      <SelectTrigger className="h-8 text-meta font-body border-border/70">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhuma" disabled={row.match.proficient} className="text-meta">
                          Sem perícia
                        </SelectItem>
                        <SelectItem value="pericia" disabled={!row.match.proficient} className="text-meta">
                          Perícia
                        </SelectItem>
                        {specializeAvailable && (
                          <SelectItem value="especializacao" className="text-meta">
                            Especialização
                          </SelectItem>
                        )}
                        {masteryAvailable && (
                          <SelectItem value="maestria" className="text-meta">
                            Maestria
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span
                      className={`inline-flex text-meta font-body font-medium px-2 py-1 rounded border ${
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
                  <p className="sm:hidden font-display text-micro tracking-wider uppercase text-muted-foreground">
                    Ataque
                  </p>
                  <p
                    className="font-display text-field font-bold tabular-nums"
                    title={`Base ${formatSigned(row.attack.base)} · Força ${formatSigned(row.attack.forca)} · Des ${formatSigned(row.attack.destreza)} · Perícia ${formatSigned(row.attack.pericia)}`}
                  >
                    {formatSigned(row.attack.total)}
                  </p>
                </div>

                <div className="text-left sm:text-center">
                  <p className="sm:hidden font-display text-micro tracking-wider uppercase text-muted-foreground">
                    Tipo
                  </p>
                  <p className="text-meta font-body uppercase text-muted-foreground">{row.tipo}</p>
                </div>

                <div>
                  <p className="sm:hidden font-display text-micro tracking-wider uppercase text-muted-foreground">
                    Dano
                  </p>
                  <p className="text-meta font-body tabular-nums text-foreground">
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
