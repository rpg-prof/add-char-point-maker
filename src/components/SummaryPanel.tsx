import type { ReactNode } from "react";
import {
  Backpack,
  Heart,
  ShieldAlert,
  Sparkles,
  Swords,
  User,
  Shield,
  Crosshair,
  BookOpen,
} from "lucide-react";
import {
  generalAdvantages,
  generalDisadvantages,
  reputations,
  socialClasses,
  type AttributeName,
} from "@/data/characterData";
import { skills, getSkillCost } from "@/data/skills";
import {
  equipmentById,
  formatMoney,
  getRemainingCopper,
  getSpentCopper,
  getStartingCapitalPc,
  getTotalWeightKg,
  type CustomInventoryItem,
  type PurchasedItems,
} from "@/data/equipment";
import { parseCargaKg } from "@/data/currency";
import { mergeInventory } from "@/lib/inventory";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import { getSubAttributeBonuses, subAttributeMap } from "@/data/subAttributes";
import { computeResistanceBreakdown } from "@/lib/resistanceStats";
import {
  computeHitPointsBreakdown,
  computeArmorClassBreakdown,
  type CombatLoadout,
  defaultCombatLoadout,
} from "@/lib/combatStats";
import { weaponGroups } from "@/data/weaponProficiencies";
import { shieldProficiencies } from "@/data/weaponProficiencies";

interface AdvantageEntry {
  name: string;
  cost: number;
  isAdvantage: boolean;
}

export interface SummaryPanelProps {
  charName: string;
  playerName: string;
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  selectedReputation: number;
  characterLevel?: number;
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  purchasedItems: PurchasedItems;
  addedItems?: PurchasedItems;
  customItems?: CustomInventoryItem[];
  extraMoneyPc?: number;
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
  selectedSkills: string[];
  // Physical description
  sexo?: string;
  idade?: string;
  peso?: string;
  altura?: string;
  cabelos?: string;
  olhos?: string;
  tendencia?: string;
  // Combat
  combatLoadout?: CombatLoadout;
  // Weapon proficiencies
  selectedWeapons?: string[];
  selectedWeaponGroups?: string[];
  selectedShields?: string[];
}

function splitInTwo<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function getSkillPointCost(skillName: string, characterClass: string): number {
  const skill = skills.find((s) => s.name === skillName);
  if (!skill) return 0;
  return getSkillCost(skill, characterClass);
}

function formatSigned(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

function SummaryCard({
  icon,
  title,
  count,
  children,
  accent,
}: {
  icon: ReactNode;
  title: string;
  count?: number;
  children: ReactNode;
  accent?: "gold" | "blood";
}) {
  const accentBorder =
    accent === "blood"
      ? "border-l-blood/40"
      : accent === "gold"
        ? "border-l-gold/40"
        : "";
  return (
    <div
      className={`rounded-xl border border-gold/20 bg-card/90 shadow-sm overflow-hidden border-l-[3px] ${accentBorder}`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gold/10 bg-gradient-to-r from-gold/[0.05] to-transparent">
        <span className="text-gold shrink-0">{icon}</span>
        <h4 className="font-display text-[11px] tracking-wider uppercase text-foreground flex-1 min-w-0 truncate">
          {title}
        </h4>
        {count != null && count > 0 && (
          <span className="text-[10px] font-display tabular-nums text-muted-foreground shrink-0">
            {count}
          </span>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function StatPill({
  label,
  value,
  variant = "default",
  title,
}: {
  label: string;
  value: ReactNode;
  variant?: "default" | "gold" | "danger";
  title?: string;
}) {
  const valueCls =
    variant === "gold"
      ? "text-gold"
      : variant === "danger"
        ? "text-blood"
        : "text-foreground";
  return (
    <div
      className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-2 min-w-0"
      title={title}
    >
      <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground truncate">
        {label}
      </p>
      <p className={`font-display text-sm font-bold tabular-nums leading-tight mt-0.5 ${valueCls}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground font-body italic py-2 text-center">{children}</p>
  );
}

function TagChip({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "gold" | "blood" | "neutral" | "custom";
}) {
  const cls = {
    gold: "bg-gold/10 border-gold/30 text-gold-dark",
    blood: "bg-blood/10 border-blood/30 text-blood",
    neutral: "bg-background/60 border-border/70 text-foreground",
    custom: "bg-background/60 border-gold/25 border-dashed text-foreground",
  }[variant];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-body border ${cls}`}>
      {children}
    </span>
  );
}

const SummaryPanel = ({
  charName,
  playerName,
  selectedRace,
  selectedClass,
  selectedSocialClass,
  selectedReputation,
  characterLevel = 1,
  attributes,
  subAttributes,
  purchasedItems,
  addedItems = {},
  customItems = [],
  extraMoneyPc = 0,
  selectedAdvantages,
  selectedRaceClassAdv,
  selectedSkills,
  sexo,
  idade,
  peso,
  altura,
  cabelos,
  olhos,
  tendencia,
  combatLoadout,
  selectedWeapons = [],
  selectedWeaponGroups = [],
  selectedShields = [],
}: SummaryPanelProps) => {
  const allAdvItems = [...generalAdvantages, ...generalDisadvantages, ...raceClassAdvantages];

  const advantageEntries: AdvantageEntry[] = [
    ...selectedAdvantages.map((name) => {
      const item = allAdvItems.find((a) => a.name === name);
      return { name, cost: item?.cost ?? 0, isAdvantage: item?.type === "advantage" };
    }),
    ...selectedRaceClassAdv.map((name) => {
      const item = raceClassAdvantages.find((a) => a.name === name);
      const matchesRace = item?.applicableRaces?.includes(selectedRace);
      const matchesClass = item?.applicableClasses?.includes(selectedClass);
      const cost =
        matchesRace || matchesClass ? (item?.cost ?? 0) : (item?.costOthers ?? item?.cost ?? 0);
      return { name, cost, isAdvantage: item?.type === "advantage" };
    }),
  ];

  const advantages = advantageEntries.filter((e) => e.isAdvantage);
  const disadvantages = advantageEntries.filter((e) => !e.isAdvantage);

  const sortedSkills = [...selectedSkills].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const [skillsLeft, skillsRight] = splitInTwo(sortedSkills);

  const resistenciaValue = subAttributes["Resistência"] ?? attributes.Força;
  const cargaBonus =
    getSubAttributeBonuses("Resistência", resistenciaValue)["Carga Permitida"] ?? "—";
  const cargaKg = parseCargaKg(cargaBonus);
  const startingPc = getStartingCapitalPc(selectedSocialClass, socialClasses);
  const spentPc = getSpentCopper(purchasedItems);
  const remainingPc = getRemainingCopper(
    selectedSocialClass,
    socialClasses,
    purchasedItems,
    extraMoneyPc,
  );
  const inventory = mergeInventory(purchasedItems, addedItems);
  const totalWeight = getTotalWeightKg(purchasedItems, addedItems, customItems);
  const overweight = cargaKg > 0 && totalWeight > cargaKg;
  const ownedItems = Object.entries(inventory)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: equipmentById[id], qty }))
    .filter((e) => e.item)
    .sort((a, b) => a.item!.name.localeCompare(b.item!.name, "pt-BR"));
  const customOwned = [...customItems]
    .filter((item) => item.qty > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const reputationLabel =
    reputations.find((r) => r.level === selectedReputation)?.description ?? "";

  const displayName = charName.trim() || "Personagem Sem Nome";
  const resistances = computeResistanceBreakdown({ subAttributes, selectedRaceClassAdv });

  // Combat stats
  const loadout = combatLoadout ?? defaultCombatLoadout();
  const hpBreakdown = computeHitPointsBreakdown({
    subAttributes,
    constMain: attributes.Constituição,
    selectedClass,
  });
  const caBreakdown = computeArmorClassBreakdown({
    subAttributes,
    purchased: mergeInventory(purchasedItems, addedItems),
    selectedRaceClassAdv,
    destrezaMain: attributes.Destreza,
    sabedoriaMain: attributes.Sabedoria,
    loadout,
  });
  const activeWeaponSlots = loadout.weaponSlots.filter((s) => s.name.trim() !== "");

  // Weapon proficiencies
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
      const [groupName, weaponCode] = wk.split("::");
      const group = weaponGroups.find((g) => g.name === groupName);
      const weapon = group?.weapons.find((w) => w.code === weaponCode);
      return { key: wk, name: weapon?.name ?? weaponCode };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const shieldItems = selectedShields.map((sName) => {
    const shield = shieldProficiencies.find((s) => s.name === sName);
    return { name: sName, bonus: shield?.bonusCA ?? "" };
  });
  const totalWeaponProf =
    weaponGroupItems.length + individualWeaponItems.length + shieldItems.length;

  // Physical description fields
  const physicalFacts = [
    { label: "Tendência", value: tendencia || "—" },
    { label: "Sexo", value: sexo || "—" },
    { label: "Idade", value: idade || "—" },
    { label: "Peso", value: peso || "—" },
    { label: "Altura", value: altura || "—" },
    { label: "Cabelos", value: cabelos || "—" },
    { label: "Olhos", value: olhos || "—" },
  ].filter((f) => f.value !== "—");

  const headerFacts = [
    { label: "Raça", value: selectedRace || "—" },
    { label: "Classe", value: selectedClass || "—" },
    { label: "Classe Social", value: selectedSocialClass || "—" },
    {
      label: "Reputação",
      value: `Nv. ${selectedReputation}`,
      hint: reputationLabel,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="dark-panel rounded-xl overflow-hidden border border-gold/25 shadow-sm">
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-gold/55 mb-1">
              Ficha de Personagem
            </p>
            <h3 className="font-display text-lg md:text-xl tracking-wide text-gold leading-tight truncate">
              {displayName}
            </h3>
            {playerName.trim() && (
              <p className="text-xs font-body text-parchment/55 mt-1 flex items-center gap-1.5">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">{playerName}</span>
              </p>
            )}
          </div>
          <div className="shrink-0 text-right rounded-lg border border-gold/25 bg-gold/10 px-3 py-2">
            <p className="font-display text-[9px] tracking-wider uppercase text-gold/70">Nível</p>
            <p className="font-display text-2xl font-bold text-gold tabular-nums leading-none">
              {characterLevel}
            </p>
          </div>
        </div>
        <div className="gold-rule mx-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gold/10 mt-3">
          {headerFacts.map(({ label, value, hint }) => (
            <div key={label} className="bg-parchment-dark/40 px-3 py-2.5 min-w-0">
              <p className="font-display text-[9px] tracking-wider uppercase text-parchment/45 truncate">
                {label}
              </p>
              <p
                className="font-display text-xs text-parchment/90 leading-snug truncate mt-0.5"
                title={hint}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
        {physicalFacts.length > 0 && (
          <div className="px-4 py-2.5 flex flex-wrap gap-x-4 gap-y-1 border-t border-gold/10">
            {physicalFacts.map(({ label, value }) => (
              <span key={label} className="text-[11px] font-body text-parchment/60">
                <span className="font-display tracking-wide text-parchment/40 uppercase text-[9px] mr-1">
                  {label}:
                </span>
                {value}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Combate */}
      <SummaryCard icon={<Swords className="w-4 h-4" />} title="Combate" accent="blood">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <StatPill
            label="PV Máx."
            value={hpBreakdown.total}
            variant="gold"
            title={`Base ${hpBreakdown.base} + Condicionamento (${hpBreakdown.condicionamentoValue}) ${formatSigned(hpBreakdown.condicionamentoBonus)}`}
          />
          <StatPill
            label="C.A."
            value={caBreakdown.total}
            variant="gold"
            title={`Base ${caBreakdown.base} + Armadura ${caBreakdown.armadura} + Destreza ${formatSigned(caBreakdown.destreza)} + Outros ${formatSigned(caBreakdown.outros)}`}
          />
          <StatPill
            label="Armadura"
            value={caBreakdown.equippedArmorName ?? "—"}
          />
          <StatPill
            label="Escudo"
            value={caBreakdown.equippedShieldName ?? "—"}
          />
        </div>
        {activeWeaponSlots.length > 0 ? (
          <div className="space-y-1.5">
            <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-1">
              Armas Equipadas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {activeWeaponSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/40 px-2.5 py-1.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-xs truncate">{slot.name}</p>
                    {slot.tipo && (
                      <p className="text-[10px] text-muted-foreground font-body">
                        {slot.tipo}
                        {slot.damageSm && (
                          <span className="ml-1.5 text-foreground/60">
                            {slot.damageSm} / {slot.damageLg}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  {slot.weaponBonus !== 0 && (
                    <span className="text-[10px] font-display tabular-nums text-gold shrink-0">
                      {formatSigned(slot.weaponBonus)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyNote>Nenhuma arma equipada no loadout.</EmptyNote>
        )}
      </SummaryCard>

      {/* Atributos + Perícias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <SummaryCard icon={<Shield className="w-4 h-4" />} title="Atributos">
          <div className="grid grid-cols-2 gap-2">
            {subAttributeMap.map(({ main, sub1, sub2 }) => {
              const mainVal = attributes[main as AttributeName];
              const sub1Val = subAttributes[sub1] ?? mainVal;
              const sub2Val = subAttributes[sub2] ?? mainVal;
              return (
                <div
                  key={main}
                  className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-2 hover:border-gold/25 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-display text-[11px] tracking-wide text-foreground/90 truncate">
                      {main}
                    </span>
                    <span className="font-display font-bold text-lg text-gold tabular-nums leading-none">
                      {mainVal}
                    </span>
                  </div>
                  <div className="flex justify-between gap-1 mt-1 text-[10px] text-muted-foreground font-body">
                    <span className="truncate">
                      {sub2}{" "}
                      <span className="tabular-nums text-foreground/65">{sub2Val}</span>
                    </span>
                    <span className="truncate text-right">
                      {sub1}{" "}
                      <span className="tabular-nums text-foreground/65">{sub1Val}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SummaryCard>

        <SummaryCard
          icon={<BookOpen className="w-4 h-4" />}
          title="Perícias"
          count={sortedSkills.length}
        >
          {sortedSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0 max-h-[220px] overflow-y-auto pr-1">
              {[skillsLeft, skillsRight].map((col, colIdx) => (
                <div key={colIdx} className="space-y-0.5">
                  {col.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-background/50 text-xs font-body border-b border-border/30 last:border-0"
                    >
                      <span className="min-w-0 flex-1 truncate leading-snug">{name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                        {getSkillPointCost(name, selectedClass)} pts
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <EmptyNote>Nenhuma perícia selecionada.</EmptyNote>
          )}
        </SummaryCard>
      </div>

      {/* Proficiências com Armas */}
      {totalWeaponProf > 0 && (
        <SummaryCard
          icon={<Crosshair className="w-4 h-4" />}
          title="Proficiências com Armas"
          count={totalWeaponProf}
          accent="gold"
        >
          <div className="space-y-2">
            {weaponGroupItems.length > 0 && (
              <div>
                <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-1.5">
                  Grupos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {weaponGroupItems.map(({ name, label }) => (
                    <TagChip key={name} variant="gold">
                      {label}
                    </TagChip>
                  ))}
                </div>
              </div>
            )}
            {individualWeaponItems.length > 0 && (
              <div>
                <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-1.5">
                  Armas Individuais
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {individualWeaponItems.map(({ key, name }) => (
                    <TagChip key={key} variant="neutral">
                      {name}
                    </TagChip>
                  ))}
                </div>
              </div>
            )}
            {shieldItems.length > 0 && (
              <div>
                <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-1.5">
                  Escudos
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {shieldItems.map(({ name, bonus }) => (
                    <TagChip key={name} variant="neutral">
                      {name}
                      {bonus && (
                        <span className="opacity-60 ml-1 text-[10px]">{bonus}</span>
                      )}
                    </TagChip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SummaryCard>
      )}

      {/* Inventário */}
      <SummaryCard
        icon={<Backpack className="w-4 h-4" />}
        title="Inventário"
        count={ownedItems.length + customOwned.length}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <StatPill label="Capital" value={formatMoney(startingPc)} />
          <StatPill
            label="Restante"
            value={formatMoney(remainingPc)}
            variant={remainingPc < 0 ? "danger" : "gold"}
          />
          <StatPill label="Gasto" value={formatMoney(spentPc)} />
          <StatPill
            label="Peso"
            value={
              <>
                {totalWeight.toFixed(1).replace(".", ",")}
                {cargaKg > 0 && (
                  <span className="text-muted-foreground font-normal text-xs">
                    {" "}
                    / {cargaKg.toFixed(1).replace(".", ",")}
                  </span>
                )}
                <span className="text-muted-foreground font-normal text-xs"> kg</span>
              </>
            }
            variant={overweight ? "danger" : "default"}
            title={`Resistência ${resistenciaValue} — ${cargaBonus}`}
          />
        </div>
        {ownedItems.length > 0 || customOwned.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
            {ownedItems.map(({ item, qty }) => (
              <TagChip key={item!.id} variant="neutral">
                {item!.name}
                {qty > 1 && <span className="text-muted-foreground ml-1">×{qty}</span>}
              </TagChip>
            ))}
            {customOwned.map((item) => (
              <TagChip key={item.id} variant="custom">
                {item.name}
                {item.qty > 1 && <span className="text-muted-foreground ml-1">×{item.qty}</span>}
              </TagChip>
            ))}
          </div>
        ) : (
          <EmptyNote>Nenhum item no inventário.</EmptyNote>
        )}
      </SummaryCard>

      {/* Resistências */}
      <SummaryCard icon={<Heart className="w-4 h-4" />} title="Resistências">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {resistances.map((r) => {
            const barWidth = Math.min(100, Math.max(0, r.total));
            const isNegative = r.total < 0;
            return (
              <div
                key={r.key}
                className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-2"
                title={`Base ${r.base}% · ${r.subAttr}(${r.subVal}) ${formatSigned(r.attrMod)}%${
                  r.bonus !== 0 ? ` · Vant. ${formatSigned(r.bonus)}%` : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-display text-[10px] leading-tight text-foreground/85 line-clamp-2">
                    {r.label}
                  </span>
                  <span
                    className={`font-display text-sm font-bold tabular-nums leading-none shrink-0 ${
                      isNegative ? "text-blood" : "text-gold"
                    }`}
                  >
                    {r.total}%
                  </span>
                </div>
                <div className="h-1 rounded-full bg-muted/40 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isNegative ? "bg-blood/70" : "bg-gold/70"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground font-body mt-1 leading-tight truncate">
                  {r.subAttr} {formatSigned(r.attrMod)}%
                  {r.bonus !== 0 && <> · vant. {formatSigned(r.bonus)}%</>}
                </p>
              </div>
            );
          })}
        </div>
      </SummaryCard>

      {/* Vantagens + Desvantagens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SummaryCard
          icon={<Sparkles className="w-4 h-4" />}
          title="Vantagens"
          count={advantages.length}
          accent="gold"
        >
          {advantages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {advantages.map(({ name, cost }) => (
                <TagChip key={name} variant="gold">
                  {name}
                  <span className="opacity-70 ml-1 tabular-nums">
                    ({cost > 0 ? `+${cost}` : cost})
                  </span>
                </TagChip>
              ))}
            </div>
          ) : (
            <EmptyNote>Nenhuma vantagem.</EmptyNote>
          )}
        </SummaryCard>

        <SummaryCard
          icon={<ShieldAlert className="w-4 h-4" />}
          title="Desvantagens"
          count={disadvantages.length}
          accent="blood"
        >
          {disadvantages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
              {disadvantages.map(({ name, cost }) => (
                <TagChip key={name} variant="blood">
                  {name}
                  <span className="opacity-70 ml-1 tabular-nums">({cost})</span>
                </TagChip>
              ))}
            </div>
          ) : (
            <EmptyNote>Nenhuma desvantagem.</EmptyNote>
          )}
        </SummaryCard>
      </div>
    </div>
  );
};

export default SummaryPanel;
