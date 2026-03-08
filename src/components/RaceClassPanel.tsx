import { races, classes, socialClasses, type RaceOption, type ClassOption, type SocialClassOption } from "@/data/characterData";

interface RaceClassPanelProps {
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  onRaceChange: (race: string) => void;
  onClassChange: (cls: string) => void;
  onSocialClassChange: (sc: string) => void;
}

const RaceClassPanel = ({
  selectedRace,
  selectedClass,
  selectedSocialClass,
  onRaceChange,
  onClassChange,
  onSocialClassChange,
}: RaceClassPanelProps) => {
  const raceObj = races.find((r) => r.name === selectedRace);
  const classObj = classes.find((c) => c.name === selectedClass);
  const socialObj = socialClasses.find((s) => s.name === selectedSocialClass);

  return (
    <div className="space-y-4">
      {/* Race */}
      <div>
        <label className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-1.5 block">
          Raça <span className="text-gold">{raceObj ? `(${raceObj.cost} pts)` : ""}</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {races.map((r) => (
            <button
              key={r.name}
              onClick={() => onRaceChange(r.name)}
              className={`px-2 py-1.5 rounded text-sm font-body border transition-all ${
                selectedRace === r.name
                  ? "bg-gold/20 border-gold text-foreground font-semibold"
                  : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
              }`}
            >
              {r.name}
              <span className="block text-xs opacity-70">{r.cost} pts</span>
            </button>
          ))}
        </div>
      </div>

      {/* Class */}
      <div>
        <label className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-1.5 block">
          Classe <span className="text-gold">{classObj ? `(${classObj.cost} pts)` : ""}</span>
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {classes.map((c) => (
            <button
              key={c.name}
              onClick={() => onClassChange(c.name)}
              className={`px-2 py-1.5 rounded text-sm font-body border transition-all ${
                selectedClass === c.name
                  ? "bg-gold/20 border-gold text-foreground font-semibold"
                  : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
              }`}
            >
              {c.name}
              <span className="block text-xs opacity-70">{c.cost} pts</span>
            </button>
          ))}
        </div>
      </div>

      {/* Social Class */}
      <div>
        <label className="font-display text-sm tracking-wider uppercase text-muted-foreground mb-1.5 block">
          Classe Social <span className="text-gold">{socialObj ? `(${socialObj.cost} pts)` : ""}</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {socialClasses.map((s) => (
            <button
              key={s.name}
              onClick={() => onSocialClassChange(s.name)}
              className={`px-2 py-1.5 rounded text-sm font-body border transition-all ${
                selectedSocialClass === s.name
                  ? "bg-gold/20 border-gold text-foreground font-semibold"
                  : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
              }`}
            >
              {s.name}
              <span className="block text-xs opacity-70">{s.cost} pts · {s.capital}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RaceClassPanel;
