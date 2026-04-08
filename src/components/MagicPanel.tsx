import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, BookOpen } from "lucide-react";
import { spellLists, type Spell } from "@/data/spells";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface MagicPanelProps {
  selectedClass: string;
}

const SpellItem = ({ spell }: { spell: Spell }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border border-border bg-card/40 hover:bg-card/80 text-muted-foreground transition-all text-left"
      >
        <span className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
        <span className="flex-1 truncate text-foreground">{spell.name}</span>
        <span className="text-xs text-muted-foreground font-display">{spell.school}</span>
      </button>
      {expanded && (
        <div className="ml-5 mt-1 mb-1 px-3 py-2 text-xs font-body text-muted-foreground bg-card/60 border border-border/50 rounded space-y-1">
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {spell.range && <span><span className="text-foreground font-semibold">Alcance:</span> {spell.range}</span>}
            {spell.duration && <span><span className="text-foreground font-semibold">Duração:</span> {spell.duration}</span>}
            {spell.castingTime && <span><span className="text-foreground font-semibold">Tempo:</span> {spell.castingTime}</span>}
            {spell.components && <span><span className="text-foreground font-semibold">Componentes:</span> {spell.components}</span>}
            {spell.area && <span><span className="text-foreground font-semibold">Área:</span> {spell.area}</span>}
          </div>
          <p className="pt-1 border-t border-border/50">{spell.description}</p>
        </div>
      )}
    </div>
  );
};

const MagicPanel = ({ selectedClass }: MagicPanelProps) => {
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});

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
    <div className="space-y-6">
      {relevantLists.map((list) => {
        const levels = [...new Set(list.spells.map((s) => s.level))].sort();

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
                const levelSpells = list.spells.filter((s) => s.level === level);
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
                        {levelSpells.length} magias
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <div className="grid grid-cols-1 gap-1 pl-2">
                        {levelSpells.map((spell) => (
                          <SpellItem key={spell.name} spell={spell} />
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
