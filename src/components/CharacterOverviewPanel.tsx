import { attributeNames, type AttributeName } from "@/data/characterData";
import { subAttributeMap } from "@/data/subAttributes";

interface CharacterOverviewPanelProps {
  charName: string;
  playerName: string;
  selectedRace: string;
  selectedClass: string;
  selectedSocialClass: string;
  characterLevel: number;
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  sexo?: string;
  idade?: string;
  tendencia?: string;
}

const labelCls =
  "font-display text-[10px] tracking-wider uppercase text-muted-foreground mb-0.5 block";

const CharacterOverviewPanel = ({
  charName,
  playerName,
  selectedRace,
  selectedClass,
  selectedSocialClass,
  characterLevel,
  attributes,
  subAttributes,
  sexo,
  idade,
  tendencia,
}: CharacterOverviewPanelProps) => (
  <div className="space-y-5">
    <p className="font-body text-muted-foreground text-xs">
      Dados fixos do personagem — atributos e escolhas de criação não podem ser alterados aqui.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border border-gold/25 bg-card/40 p-3 space-y-2">
        <h3 className="font-display text-xs tracking-wider uppercase text-gold">Identificação</h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-body">
          <div>
            <span className={labelCls}>Personagem</span>
            <span className="text-foreground">{charName || "—"}</span>
          </div>
          <div>
            <span className={labelCls}>Jogador</span>
            <span className="text-foreground">{playerName || "—"}</span>
          </div>
          {sexo && (
            <div>
              <span className={labelCls}>Sexo</span>
              <span>{sexo}</span>
            </div>
          )}
          {idade && (
            <div>
              <span className={labelCls}>Idade</span>
              <span>{idade}</span>
            </div>
          )}
          {tendencia && (
            <div>
              <span className={labelCls}>Tendência</span>
              <span>{tendencia}</span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gold/25 bg-card/40 p-3 space-y-2">
        <h3 className="font-display text-xs tracking-wider uppercase text-gold">Raça & Classe</h3>
        <div className="grid grid-cols-2 gap-2 text-sm font-body">
          <div>
            <span className={labelCls}>Raça</span>
            <span>{selectedRace}</span>
          </div>
          <div>
            <span className={labelCls}>Classe</span>
            <span>{selectedClass}</span>
          </div>
          <div>
            <span className={labelCls}>Classe Social</span>
            <span>{selectedSocialClass}</span>
          </div>
          <div>
            <span className={labelCls}>Nível Atual</span>
            <span className="text-gold font-display font-bold">{characterLevel}</span>
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-2">Atributos</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {attributeNames.map((attr) => (
          <div
            key={attr}
            className="rounded border border-border/60 bg-card/30 px-2.5 py-1.5 text-center"
          >
            <div className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">
              {attr}
            </div>
            <div className="font-display text-lg font-bold text-gold tabular-nums">
              {attributes[attr]}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div>
      <h3 className="font-display text-xs tracking-wider uppercase text-gold mb-2">
        Sub-atributos
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
        {subAttributeMap.flatMap((def) => [
          { key: def.sub1, label: def.sub1 },
          { key: def.sub2, label: def.sub2 },
        ]).map(({ key, label }) => (
          <div
            key={key}
            className="rounded border border-border/40 bg-card/20 px-2 py-1 text-xs font-body flex justify-between"
          >
            <span className="text-muted-foreground truncate">{label}</span>
            <span className="font-display font-bold tabular-nums">{subAttributes[key] ?? 10}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default CharacterOverviewPanel;
