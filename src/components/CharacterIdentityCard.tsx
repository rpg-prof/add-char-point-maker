import { User } from "lucide-react";
import { reputations } from "@/data/characterData";

export interface CharacterIdentityCardProps {
  charName: string;
  playerName?: string;
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  selectedReputation: number;
  characterLevel?: number;
  sexo?: string;
  idade?: string;
  peso?: string;
  altura?: string;
  cabelos?: string;
  olhos?: string;
  tendencia?: string;
}

const CharacterIdentityCard = ({
  charName,
  playerName = "",
  selectedRace,
  selectedClass,
  selectedSocialClass,
  selectedReputation,
  characterLevel = 1,
  sexo,
  idade,
  peso,
  altura,
  cabelos,
  olhos,
  tendencia,
}: CharacterIdentityCardProps) => {
  const displayName = charName.trim() || "Personagem Sem Nome";
  const reputationLabel =
    reputations.find((r) => r.level === selectedReputation)?.description ?? "";

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

  const physicalFacts = [
    { label: "Tendência", value: tendencia || "—" },
    { label: "Sexo", value: sexo || "—" },
    { label: "Idade", value: idade || "—" },
    { label: "Peso", value: peso || "—" },
    { label: "Altura", value: altura || "—" },
    { label: "Cabelos", value: cabelos || "—" },
    { label: "Olhos", value: olhos || "—" },
  ].filter((f) => f.value !== "—");

  return (
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
  );
};

export default CharacterIdentityCard;
