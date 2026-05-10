import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, BookOpen, Plus, Check, Book } from "lucide-react";
import { spellLists, type Spell } from "@/data/spells";
import { spellMatchesArcane, spellMatchesDivine } from "@/data/magicAccess";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MagicPanelProps {
  grimoire: string[];
  onGrimoireToggle: (spellName: string) => void;
  divineAccess: Record<string, "minor" | "major">;
  arcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
}

const SpellItem = ({
  spell,
  inGrimoire,
  onToggle,
}: {
  spell: Spell;
  inGrimoire: boolean;
  onToggle: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggle}
          title={inGrimoire ? "Remover da coleção" : "Adicionar à coleção"}
          className={`w-6 h-6 flex items-center justify-center rounded border transition-all flex-shrink-0 ${
            inGrimoire
              ? "bg-gold/20 border-gold text-gold hover:bg-destructive/20 hover:border-destructive hover:text-destructive"
              : "border-border text-muted-foreground hover:border-gold hover:text-gold hover:bg-gold/10"
          }`}
        >
          {inGrimoire ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left flex-1 ${
            inGrimoire
              ? "border-gold/50 bg-gold/10 text-foreground"
              : "border-border bg-card/40 hover:bg-card/80 text-muted-foreground"
          }`}
        >
          <span className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
          <span className={`flex-1 truncate ${inGrimoire ? "text-foreground font-semibold" : "text-foreground"}`}>
            {spell.name}
          </span>
          <span className="text-xs text-muted-foreground font-display">{spell.school}</span>
        </button>
      </div>
      {expanded && (
        <div className="ml-7 mt-1 mb-1 px-3 py-2 text-xs font-body text-muted-foreground bg-card/60 border border-border/50 rounded space-y-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {spell.range && <span><span className="text-foreground font-semibold">Alcance:</span> {spell.range}</span>}
            {spell.duration && <span><span className="text-foreground font-semibold">Duração:</span> {spell.duration}</span>}
            {spell.castingTime && <span><span className="text-foreground font-semibold">Tempo:</span> {spell.castingTime}</span>}
            {spell.components && <span><span className="text-foreground font-semibold">Componentes:</span> {spell.components}</span>}
            {spell.area && <span><span className="text-foreground font-semibold">Área:</span> {spell.area}</span>}
            {spell.sphere && <span><span className="text-foreground font-semibold">Esfera:</span> {spell.sphere}</span>}
          </div>
          <p className="pt-1 border-t border-border/50">{spell.description}</p>
        </div>
      )}
    </div>
  );
};

const MagicPanel = ({ selectedClass, grimoire, onGrimoireToggle }: MagicPanelProps) => {
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});
  const [showGrimoireOnly, setShowGrimoireOnly] = useState(false);
  const divine = isDivineCaster(selectedClass);
  const collectionName = divine ? "Livro de Orações" : "Grimório";

  const relevantLists = spellLists.filter((list) =>
    list.classes.includes(selectedClass)
  );

  const toggleLevel = (key: string) => {
    setOpenLevels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (relevantLists.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground font-body">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>A classe <span className="text-foreground font-semibold">{selectedClass}</span> não possui magias.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grimoire summary & filter */}
      <div className="flex items-center justify-between px-3 py-2 rounded border border-gold/30 bg-gold/5">
        <div className="flex items-center gap-2">
          <Book className="w-4 h-4 text-gold" />
          <span className="font-display text-xs tracking-wider uppercase text-gold">
            {collectionName}
          </span>
          <span className="text-xs text-muted-foreground font-body">
            {grimoire.length} {grimoire.length === 1 ? "magia" : "magias"} selecionada{grimoire.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setShowGrimoireOnly(!showGrimoireOnly)}
          className={`text-xs font-body px-2 py-1 rounded border transition-all ${
            showGrimoireOnly
              ? "bg-gold/20 border-gold text-gold"
              : "border-border text-muted-foreground hover:border-gold hover:text-gold"
          }`}
        >
          {showGrimoireOnly ? "Mostrar todas" : `Só ${divine ? "orações" : "grimório"}`}
        </button>
      </div>

      {relevantLists.map((list) => {
        const allSpells = list.spells;
        const filteredSpells = showGrimoireOnly
          ? allSpells.filter((s) => grimoire.includes(s.name))
          : allSpells;
        const levels = [...new Set(filteredSpells.map((s) => s.level))].sort();

        if (showGrimoireOnly && filteredSpells.length === 0) {
          return (
            <div key={list.type} className="text-center py-4 text-muted-foreground text-sm font-body">
              Nenhuma magia adicionada ainda.
            </div>
          );
        }

        return (
          <div key={list.type}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-gold" />
              <h3 className="font-display text-sm tracking-wider uppercase text-gold">
                {list.label}
              </h3>
              <span className="text-xs text-muted-foreground font-body">
                ({list.classes.join(", ")})
              </span>
            </div>

            <div className="space-y-1">
              {levels.map((level) => {
                const levelSpells = filteredSpells.filter((s) => s.level === level);
                const grimoireCount = levelSpells.filter((s) => grimoire.includes(s.name)).length;
                const key = `${list.type}-${level}`;
                const isOpen = openLevels[key] ?? false;

                return (
                  <Collapsible key={key} open={isOpen} onOpenChange={() => toggleLevel(key)}>
                    <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 rounded border border-border bg-card/40 hover:bg-card/80 transition-all">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gold" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground rotate-180" />
                      )}
                      <span className="font-display text-xs tracking-wider uppercase text-foreground flex-1 text-left">
                        Nível {level}
                      </span>
                      <span className="text-xs text-muted-foreground font-body">
                        {grimoireCount > 0 && (
                          <span className="text-gold mr-1">{grimoireCount} selecionada{grimoireCount !== 1 ? "s" : ""} •</span>
                        )}
                        {levelSpells.length} magias
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <div className="grid grid-cols-1 gap-1 pl-2">
                        {levelSpells.map((spell) => (
                          <SpellItem
                            key={spell.name}
                            spell={spell}
                            inGrimoire={grimoire.includes(spell.name)}
                            onToggle={() => onGrimoireToggle(spell.name)}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MagicPanel;
