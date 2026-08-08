import {
  generalAdvantages,
  generalDisadvantages,
} from "@/data/characterData";
import { raceClassAdvantages, getRaceClassAdvantageCost } from "@/data/raceClassAdvantages";

interface PlayAdvantagesPanelProps {
  selectedAdvantages: string[];
  selectedRaceClassAdv: string[];
  selectedRace: string;
  selectedClass: string;
  /** Coluna estreita: vantagens e desvantagens empilhadas. */
  compact?: boolean;
}

function EntryList({
  items,
  emptyLabel,
  costAccent,
}: {
  items: { name: string; cost: number }[];
  emptyLabel: string;
  costAccent: string;
}) {
  if (items.length === 0) {
    return <p className="text-meta text-muted-foreground font-body px-2.5 py-1.5">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-border/35">
      {items.map(({ name, cost }) => (
        <li
          key={name}
          className="flex items-baseline justify-between gap-2 px-2.5 py-1.5"
        >
          <span className="min-w-0 flex-1 text-meta font-body leading-snug text-foreground">
            {name}
          </span>
          <span className={`shrink-0 text-meta font-display tabular-nums ${costAccent}`}>
            {cost > 0 ? `+${cost}` : cost}
          </span>
        </li>
      ))}
    </ul>
  );
}

const PlayAdvantagesPanel = ({
  selectedAdvantages,
  selectedRaceClassAdv,
  selectedRace,
  selectedClass,
  compact = false,
}: PlayAdvantagesPanelProps) => {
  const allItems = [...generalAdvantages, ...generalDisadvantages, ...raceClassAdvantages];

  const entries = [
    ...selectedAdvantages.map((name) => {
      const item = allItems.find((a) => a.name === name);
      return {
        name,
        cost: item?.cost ?? 0,
        isAdvantage: item?.type === "advantage",
      };
    }),
    ...selectedRaceClassAdv
      .filter((name) => {
        const item = raceClassAdvantages.find((a) => a.name === name);
        // Poderes ficam na seção própria; resistências também
        return item && item.category !== "poder" && item.category !== "resistencia";
      })
      .map((name) => {
        const item = raceClassAdvantages.find((a) => a.name === name);
        const cost = item
          ? getRaceClassAdvantageCost(item, selectedRace, selectedClass)
          : 0;
        return {
          name,
          cost,
          isAdvantage: item?.type === "advantage",
        };
      }),
  ];

  const advantages = entries.filter((e) => e.isAdvantage);
  const disadvantages = entries.filter((e) => !e.isAdvantage);

  return (
    <div
      className={
        compact ? "flex flex-col gap-2" : "grid grid-cols-1 md:grid-cols-2 gap-3"
      }
    >
      <div
        className={`rounded-lg border border-gold/25 bg-gold/5 overflow-hidden ${
          compact ? "" : "p-0"
        }`}
      >
        <p
          className={`font-display text-micro tracking-wider uppercase text-gold-dark ${
            compact ? "px-2.5 pt-2 pb-1" : "px-3 pt-2.5 pb-1"
          }`}
        >
          Vantagens ({advantages.length})
        </p>
        <EntryList
          items={advantages}
          emptyLabel="Nenhuma vantagem."
          costAccent="text-gold-dark"
        />
      </div>

      <div className="rounded-lg border border-blood/25 bg-blood/5 overflow-hidden">
        <p
          className={`font-display text-micro tracking-wider uppercase text-blood ${
            compact ? "px-2.5 pt-2 pb-1" : "px-3 pt-2.5 pb-1"
          }`}
        >
          Desvantagens ({disadvantages.length})
        </p>
        <EntryList
          items={disadvantages}
          emptyLabel="Nenhuma desvantagem."
          costAccent="text-blood"
        />
      </div>
    </div>
  );
};

export default PlayAdvantagesPanel;
