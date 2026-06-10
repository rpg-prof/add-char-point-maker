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

const sectionTitleCls =
  "font-display text-sm tracking-wider uppercase text-muted-foreground mb-1.5";
const sectionCardCls = "rounded-lg border border-border p-3";

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

function TwoColumnTextList({
  items,
  renderItem,
  emptyLabel = "—",
}: {
  items: string[];
  renderItem: (item: string) => string;
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground font-body">{emptyLabel}</p>;
  }

  const [left, right] = splitInTwo(items);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
      <div className="space-y-0.5">
        {left.map((item) => (
          <p key={item} className="text-sm font-body leading-snug">
            {renderItem(item)}
          </p>
        ))}
      </div>
      <div className="space-y-0.5">
        {right.map((item) => (
          <p key={item} className="text-sm font-body leading-snug">
            {renderItem(item)}
          </p>
        ))}
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

  const resistenciaValue = subAttributes["Resistência"] ?? attributes.Força;
  const cargaBonus =
    getSubAttributeBonuses("Resistência", resistenciaValue)["Carga Permitida"] ?? "—";
  const cargaKg = parseCargaKg(cargaBonus);
  const startingPc = getStartingCapitalPc(selectedSocialClass, socialClasses);
  const spentPc = getSpentCopper(purchasedItems);
  const remainingPc = getRemainingCopper(selectedSocialClass, socialClasses, purchasedItems);
  const totalWeight = getTotalWeightKg(purchasedItems);
  const ownedItems = Object.entries(purchasedItems)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: equipmentById[id], qty }))
    .filter((e) => e.item)
    .sort((a, b) => a.item!.name.localeCompare(b.item!.name, "pt-BR"));

  const reputationLabel =
    reputations.find((r) => r.level === selectedReputation)?.description ?? `Nv${selectedReputation}`;

  const displayName = charName.trim() || "Personagem Sem Nome";

  return (
    <div className="space-y-3">
      {/* Cabeçalho */}
      <div className="dark-panel rounded-lg p-3.5">
        <h3 className="font-display text-lg tracking-wider text-gold mb-1">
          {displayName}
          {playerName.trim() && (
            <span className="text-parchment/70 font-body text-base font-normal">
              {" "}
              – {playerName}
            </span>
          )}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-parchment/80">
          <div>
            <span className="text-parchment/50">Raça:</span> {selectedRace || "—"}
          </div>
          <div>
            <span className="text-parchment/50">Classe:</span> {selectedClass || "—"}
          </div>
          <div>
            <span className="text-parchment/50">Classe Social:</span>{" "}
            {selectedSocialClass || "—"}
          </div>
          <div>
            <span className="text-parchment/50">Reputação:</span> Nv{selectedReputation}
            {selectedReputation > 0 && (
              <span className="block text-xs text-parchment/50 mt-0.5">{reputationLabel}</span>
            )}
          </div>
        </div>
      </div>

      {/* Atributos | Perícias | Dinheiro & Equipamento */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,13.5rem)_1fr_1fr] gap-3 items-start">
        <div className={sectionCardCls}>
          <h4 className={sectionTitleCls}>Atributos</h4>
          <div className="space-y-1">
            {subAttributeMap.map(({ main, sub1, sub2 }) => {
              const mainVal = attributes[main as AttributeName];
              const sub1Val = subAttributes[sub1] ?? mainVal;
              const sub2Val = subAttributes[sub2] ?? mainVal;
              return (
                <div
                  key={main}
                  className="rounded border border-border/50 bg-card/20 px-2 py-1"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-xs">{main}</span>
                    <span className="font-bold text-sm tabular-nums">{mainVal}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                    {sub2} {sub2Val} · {sub1} {sub1Val}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={sectionCardCls}>
          <h4 className={sectionTitleCls}>Perícias</h4>
          <TwoColumnTextList
            items={sortedSkills}
            renderItem={(name) => `${name} (${getSkillPointCost(name, selectedClass)})`}
            emptyLabel="Nenhuma perícia selecionada."
          />
        </div>

        <div className={sectionCardCls}>
          <h4 className={sectionTitleCls}>Dinheiro & Equipamento</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-x-2 gap-y-1 text-sm mb-2">
            <div>
              <span className="text-muted-foreground">Capital:</span> {formatMoney(startingPc)}
            </div>
            <div>
              <span className="text-muted-foreground">Restante:</span>{" "}
              <span className={remainingPc < 0 ? "text-blood font-bold" : "font-bold"}>
                {formatMoney(remainingPc)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Gasto:</span> {formatMoney(spentPc)}
            </div>
            <div>
              <span className="text-muted-foreground">Peso:</span>{" "}
              <span
                className={
                  cargaKg > 0 && totalWeight > cargaKg ? "text-blood font-bold" : "font-bold"
                }
              >
                {totalWeight.toFixed(1).replace(".", ",")} kg
                {cargaKg > 0 && ` / ${cargaKg.toFixed(1).replace(".", ",")} kg`}
              </span>
              <span className="text-xs text-muted-foreground block">
                (Resistência {resistenciaValue} — {cargaBonus})
              </span>
            </div>
          </div>
          {ownedItems.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {ownedItems.map(({ item, qty }) => (
                <span
                  key={item!.id}
                  className="px-2 py-0.5 rounded text-xs font-body border bg-card border-border"
                >
                  {item!.name} ×{qty}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Nenhum item comprado.</p>
          )}
        </div>
      </div>

      {/* Vantagens + Desvantagens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className={sectionCardCls}>
          <h4 className={sectionTitleCls}>Vantagens</h4>
          {advantages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {advantages.map(({ name, cost }) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded text-xs font-body border bg-gold/10 border-gold/30 text-gold-dark"
                >
                  {name} ({cost > 0 ? `+${cost}` : cost})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Nenhuma vantagem.</p>
          )}
        </div>

        <div className={sectionCardCls}>
          <h4 className={sectionTitleCls}>Desvantagens</h4>
          {disadvantages.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {disadvantages.map(({ name, cost }) => (
                <span
                  key={name}
                  className="px-2 py-0.5 rounded text-xs font-body border bg-blood/10 border-blood/30 text-blood"
                >
                  {name} ({cost})
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Nenhuma desvantagem.</p>
          )}
        </div>
      </div>

      {/* Total de pontos */}
      <div className="rounded-lg border-2 border-gold/40 p-3 bg-gold/5">
        <h4 className="font-display text-sm tracking-wider uppercase text-gold mb-1.5">
          Total de Pontos
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Atributos:</span>{" "}
            <span className={attributePointsSpent > 75 ? "text-blood font-bold" : "font-bold"}>
              {attributePointsSpent} / 75
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Personagem:</span>{" "}
            <span className={characterPointsSpent > 100 ? "text-blood font-bold" : "font-bold"}>
              {characterPointsSpent} / 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;
