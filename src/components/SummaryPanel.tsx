import type { ReactNode } from "react";
import {
  Award,
  Coins,
  Heart,
  Scroll,
  ShieldAlert,
  Sparkles,
  Swords,
} from "lucide-react";
import {
  generalAdvantages,
  generalDisadvantages,
  reputations,
  skills,
  socialClasses,
  type AttributeName,
} from "@/data/characterData";
import {
  equipmentById,
  formatMoney,
  getRemainingCopper,
  getSpentCopper,
  getStartingCapitalPc,
  getTotalWeightKg,
  type PurchasedItems,
} from "@/data/equipment";
import { parseCargaKg } from "@/data/currency";
import { raceClassAdvantages } from "@/data/raceClassAdvantages";
import { getSubAttributeBonuses, subAttributeMap } from "@/data/subAttributes";
import { computeResistanceBreakdown } from "@/lib/resistanceStats";

const sectionCardCls = "rounded-lg border border-border bg-card/40 p-3";

function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h4 className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
      <span className="text-gold">{icon}</span>
      {children}
    </h4>
  );
}

function splitInTwo<T>(items: T[]): [T[], T[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

function getSkillPointCost(skillName: string, characterClass: string): number {
  const skill = skills.find((s) => s.name === skillName);
  if (!skill) return 0;
  const classToGroups: Record<string, string[]> = {
    Guerreiro: ["Guerreiro"],
    Paladino: ["Guerreiro"],
    Ranger: ["Guerreiro"],
    Ladrão: ["Ladrão/Bardo"],
    Bardo: ["Ladrão/Bardo"],
    Sacerdote: ["Sacerdote"],
    Arcano: ["Mago"],
  };
  const allGroups = [skill.group, ...(skill.additionalGroups || [])];
  const matchGroups = classToGroups[characterClass] || [];
  const isClass =
    skill.group === "Geral" || allGroups.some((g) => matchGroups.includes(g));
  return isClass ? skill.cost : skill.cost * 2;
}

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
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  purchasedItems: PurchasedItems;
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
  selectedSkills: string[];
  attributePointsSpent: number;
  characterPointsSpent: number;
}

function SkillColumn({ items, selectedClass }: { items: string[]; selectedClass: string }) {
  return (
    <div className="space-y-1">
      {items.map((name) => (
        <div key={name} className="flex items-baseline gap-1.5 text-sm font-body leading-snug">
          <span className="w-1 h-1 rounded-full bg-gold/70 shrink-0 translate-y-[-2px]" />
          <span className="min-w-0">{name}</span>
          <span className="ml-auto text-xs text-muted-foreground tabular-nums shrink-0">
            {getSkillPointCost(name, selectedClass)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PointsBar({
  label,
  spent,
  max,
}: {
  label: string;
  spent: number;
  max: number;
}) {
  const over = spent > max;
  const pct = Math.min(100, Math.max(0, (spent / max) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-display text-xs tracking-wider uppercase text-muted-foreground">
          {label}
        </span>
        <span
          className={`font-display text-sm font-bold tabular-nums ${
            over ? "text-blood" : "text-gold"
          }`}
        >
          {spent} <span className="text-muted-foreground font-normal text-xs">/ {max}</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            over ? "bg-blood" : "bg-gold/80"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const SummaryPanel = ({
  charName,
  playerName,
  selectedRace,
  selectedClass,
  selectedSocialClass,
  selectedReputation,
  attributes,
  subAttributes,
  purchasedItems,
  selectedAdvantages,
  selectedRaceClassAdv,
  selectedSkills,
  attributePointsSpent,
  characterPointsSpent,
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
  const remainingPc = getRemainingCopper(selectedSocialClass, socialClasses, purchasedItems);
  const totalWeight = getTotalWeightKg(purchasedItems);
  const overweight = cargaKg > 0 && totalWeight > cargaKg;
  const ownedItems = Object.entries(purchasedItems)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: equipmentById[id], qty }))
    .filter((e) => e.item)
    .sort((a, b) => a.item!.name.localeCompare(b.item!.name, "pt-BR"));

  const reputationLabel =
    reputations.find((r) => r.level === selectedReputation)?.description ?? "";

  const displayName = charName.trim() || "Personagem Sem Nome";
  const resistances = computeResistanceBreakdown({ subAttributes, selectedRaceClassAdv });

  const formatSigned = (n: number) => (n > 0 ? `+${n}` : `${n}`);

  const headerFacts = [
    { label: "Raça", value: selectedRace || "—" },
    { label: "Classe", value: selectedClass || "—" },
    { label: "Classe Social", value: selectedSocialClass || "—" },
    { label: "Reputação", value: `Nv ${selectedReputation}`, hint: reputationLabel },
  ];

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="dark-panel rounded-lg overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-gold/20">
          <p className="font-display text-[10px] tracking-[0.25em] uppercase text-gold/60 mb-0.5">
            Ficha de Personagem
          </p>
          <h3 className="font-display text-xl md:text-2xl tracking-wider text-gold leading-tight">
            {displayName}
          </h3>
          {playerName.trim() && (
            <p className="text-sm font-body text-parchment/60 mt-0.5">
              Jogador: <span className="text-parchment/85">{playerName}</span>
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gold/10">
          {headerFacts.map(({ label, value, hint }) => (
            <div key={label} className="px-4 py-2.5">
              <p className="font-display text-[10px] tracking-wider uppercase text-parchment/45">
                {label}
              </p>
              <p className="font-display text-sm text-parchment/90 leading-snug" title={hint}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Atributos | Perícias | Dinheiro & Equipamento */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,14rem)_1fr_1fr] gap-3 items-start">
        <div className={sectionCardCls}>
          <SectionTitle icon={<Swords className="w-4 h-4" />}>Atributos</SectionTitle>
          <div className="space-y-1.5">
            {subAttributeMap.map(({ main, sub1, sub2 }) => {
              const mainVal = attributes[main as AttributeName];
              const sub1Val = subAttributes[sub1] ?? mainVal;
              const sub2Val = subAttributes[sub2] ?? mainVal;
              return (
                <div
                  key={main}
                  className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-xs tracking-wide">{main}</span>
                    <span className="font-display font-bold text-base text-gold tabular-nums leading-none">
                      {mainVal}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground font-body mt-0.5">
                    <span>
                      {sub2} <span className="tabular-nums text-foreground/70">{sub2Val}</span>
                    </span>
                    <span>
                      {sub1} <span className="tabular-nums text-foreground/70">{sub1Val}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`${sectionCardCls} h-full`}>
          <SectionTitle icon={<Scroll className="w-4 h-4" />}>
            Perícias
            {sortedSkills.length > 0 && (
              <span className="text-[10px] text-muted-foreground/70 normal-case tracking-normal">
                ({sortedSkills.length})
              </span>
            )}
          </SectionTitle>
          {sortedSkills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0.5">
              <SkillColumn items={skillsLeft} selectedClass={selectedClass} />
              <SkillColumn items={skillsRight} selectedClass={selectedClass} />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">
              Nenhuma perícia selecionada.
            </p>
          )}
        </div>

        <div className={`${sectionCardCls} h-full`}>
          <SectionTitle icon={<Coins className="w-4 h-4" />}>
            Dinheiro & Equipamento
          </SectionTitle>
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            <div className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5">
              <p className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">
                Capital
              </p>
              <p className="font-display text-sm font-bold">{formatMoney(startingPc)}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5">
              <p className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">
                Restante
              </p>
              <p
                className={`font-display text-sm font-bold ${
                  remainingPc < 0 ? "text-blood" : "text-gold"
                }`}
              >
                {formatMoney(remainingPc)}
              </p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5">
              <p className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">
                Gasto
              </p>
              <p className="font-display text-sm font-bold">{formatMoney(spentPc)}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5">
              <p className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">
                Peso
              </p>
              <p
                className={`font-display text-sm font-bold ${overweight ? "text-blood" : ""}`}
                title={`Resistência ${resistenciaValue} — ${cargaBonus}`}
              >
                {totalWeight.toFixed(1).replace(".", ",")}
                {cargaKg > 0 && (
                  <span className="text-muted-foreground font-normal text-xs">
                    {" "}
                    / {cargaKg.toFixed(1).replace(".", ",")} kg
                  </span>
                )}
              </p>
            </div>
          </div>
          {ownedItems.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {ownedItems.map(({ item, qty }) => (
                <span
                  key={item!.id}
                  className="px-2 py-0.5 rounded-full text-[11px] font-body border bg-card border-border/70"
                >
                  {item!.name}
                  {qty > 1 && <span className="text-muted-foreground"> ×{qty}</span>}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Nenhum item comprado.</p>
          )}
        </div>
      </div>

      {/* Resistências */}
      <div className={sectionCardCls}>
        <SectionTitle icon={<Heart className="w-4 h-4" />}>Resistências</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {resistances.map((r) => (
            <div
              key={r.key}
              className="rounded-md border border-border/60 bg-background/40 px-2.5 py-2"
              title={`Base ${r.base}% · ${r.subAttr}(${r.subVal}) ${formatSigned(r.attrMod)}%${
                r.bonus !== 0 ? ` · Vant. ${formatSigned(r.bonus)}%` : ""
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="font-display text-[11px] leading-tight text-foreground/90">
                  {r.label}
                </span>
                <span
                  className={`font-display text-base font-bold tabular-nums leading-none shrink-0 ${
                    r.total < 0 ? "text-blood" : "text-gold"
                  }`}
                >
                  {r.total}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-body mt-1 leading-tight">
                {r.subAttr} {formatSigned(r.attrMod)}%
                {r.bonus !== 0 && <> · vant. {formatSigned(r.bonus)}%</>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Vantagens + Desvantagens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={`${sectionCardCls} border-l-2 border-l-gold/50`}>
          <SectionTitle icon={<Sparkles className="w-4 h-4" />}>
            Vantagens
            {advantages.length > 0 && (
              <span className="text-[10px] text-muted-foreground/70 normal-case tracking-normal">
                ({advantages.length})
              </span>
            )}
          </SectionTitle>
          {advantages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {advantages.map(({ name, cost }) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded-full text-xs font-body border bg-gold/10 border-gold/30 text-gold-dark"
                >
                  {name} <span className="opacity-70">({cost > 0 ? `+${cost}` : cost})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Nenhuma vantagem.</p>
          )}
        </div>

        <div className={`${sectionCardCls} border-l-2 border-l-blood/50`}>
          <SectionTitle icon={<ShieldAlert className="w-4 h-4 text-blood" />}>
            Desvantagens
            {disadvantages.length > 0 && (
              <span className="text-[10px] text-muted-foreground/70 normal-case tracking-normal">
                ({disadvantages.length})
              </span>
            )}
          </SectionTitle>
          {disadvantages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {disadvantages.map(({ name, cost }) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded-full text-xs font-body border bg-blood/10 border-blood/30 text-blood"
                >
                  {name} <span className="opacity-70">({cost})</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Nenhuma desvantagem.</p>
          )}
        </div>
      </div>

      {/* Total de pontos */}
      <div className="rounded-lg border-2 border-gold/40 bg-gold/5 p-3.5">
        <h4 className="font-display text-sm tracking-wider uppercase text-gold mb-2.5 flex items-center gap-1.5">
          <Award className="w-4 h-4" />
          Total de Pontos
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <PointsBar label="Atributos" spent={attributePointsSpent} max={75} />
          <PointsBar label="Personagem" spent={characterPointsSpent} max={100} />
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
