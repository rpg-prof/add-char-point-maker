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
}

const PlayAdvantagesPanel = ({
  selectedAdvantages,
  selectedRaceClassAdv,
  selectedRace,
  selectedClass,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-lg border border-gold/25 bg-gold/5 p-3">
        <p className="font-display text-[10px] tracking-wider uppercase text-gold-dark mb-2">
          Vantagens ({advantages.length})
        </p>
        {advantages.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {advantages.map(({ name, cost }) => (
              <span
                key={name}
                className="inline-flex items-center rounded-md border border-gold/30 bg-background/60 px-2 py-1 text-xs font-body"
              >
                {name}
                <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                  ({cost > 0 ? `+${cost}` : cost})
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground font-body">Nenhuma vantagem.</p>
        )}
      </div>

      <div className="rounded-lg border border-blood/25 bg-blood/5 p-3">
        <p className="font-display text-[10px] tracking-wider uppercase text-blood mb-2">
          Desvantagens ({disadvantages.length})
        </p>
        {disadvantages.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {disadvantages.map(({ name, cost }) => (
              <span
                key={name}
                className="inline-flex items-center rounded-md border border-blood/30 bg-background/60 px-2 py-1 text-xs font-body"
              >
                {name}
                <span className="ml-1 text-[10px] text-muted-foreground tabular-nums">
                  ({cost})
                </span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground font-body">Nenhuma desvantagem.</p>
        )}
      </div>
    </div>
  );
};

export default PlayAdvantagesPanel;
