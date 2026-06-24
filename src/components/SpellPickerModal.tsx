import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Search, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { spellLists, type Spell } from "@/data/spells";
import { spellMatchesArcane, spellMatchesDivine } from "@/data/magicAccess";
import SpellDetailsPanel from "@/components/SpellDetailsPanel";
import type { GrimoireEntry } from "@/lib/grimoire";
import { grimoireHasSpell } from "@/lib/grimoire";

interface SpellPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grimoire: GrimoireEntry[];
  onAddSpell: (spellName: string) => void;
  divineAccess: Record<string, "minor" | "major">;
  arcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
  collectionName: string;
}

function useAccessibleLists(
  divineAccess: Record<string, "minor" | "major">,
  arcaneAccess: Record<string, "access">,
  arcaneSpecialist: string | null,
) {
  return useMemo(() => {
    const accessibleDivineSpheres = Object.keys(divineAccess);
    const accessibleArcaneSchools = Object.keys(arcaneAccess);
    const hasDivine = accessibleDivineSpheres.length > 0;
    const hasArcane = accessibleArcaneSchools.length > 0 || !!arcaneSpecialist;

    const filterSpells = (list: (typeof spellLists)[number]): Spell[] => {
      if (list.type === "arcane") {
        if (!hasArcane) return [];
        return list.spells.filter((s) =>
          spellMatchesArcane(s.school, accessibleArcaneSchools, arcaneSpecialist),
        );
      }
      if (!hasDivine) return [];
      return list.spells.filter((s) => spellMatchesDivine(s.sphere, accessibleDivineSpheres));
    };

    return spellLists
      .map((list) => ({ ...list, spells: filterSpells(list) }))
      .filter((list) => list.spells.length > 0);
  }, [divineAccess, arcaneAccess, arcaneSpecialist]);
}

const SpellPickerModal = ({
  open,
  onOpenChange,
  grimoire,
  onAddSpell,
  divineAccess,
  arcaneAccess,
  arcaneSpecialist,
  collectionName,
}: SpellPickerModalProps) => {
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const relevantLists = useAccessibleLists(divineAccess, arcaneAccess, arcaneSpecialist);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  const availableCount = useMemo(() => {
    let count = 0;
    for (const list of relevantLists) {
      for (const spell of list.spells) {
        if (!grimoireHasSpell(grimoire, spell.name)) count++;
      }
    }
    return count;
  }, [relevantLists, grimoire]);

  const toggleLevel = (key: string) => {
    setOpenLevels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col bg-card border-2 border-gold-dark/40 shadow-2xl gap-0 p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b-2 border-border bg-secondary shrink-0">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide text-base text-gold-dark">
              Adicionar ao {collectionName}
            </DialogTitle>
            <DialogDescription className="font-body text-xs text-foreground/70 mt-0.5">
              Escolha magias acessíveis pelo personagem. Novas magias entram como magia inicial (3 pts).
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-4 py-2.5 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/50 pointer-events-none" />
            <input
              ref={searchRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar magia..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border-2 border-border bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-gold-dark/40"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
          {availableCount === 0 ? (
            <p className="text-sm text-muted-foreground font-body text-center py-8">
              Todas as magias acessíveis já foram adicionadas.
            </p>
          ) : (
            relevantLists.map((list) => {
              const q = search.trim().toLowerCase();
              const spells = list.spells.filter((s) => {
                if (grimoireHasSpell(grimoire, s.name)) return false;
                if (!q) return true;
                return (
                  s.name.toLowerCase().includes(q) ||
                  s.school.toLowerCase().includes(q) ||
                  (s.sphere ?? "").toLowerCase().includes(q)
                );
              });
              if (spells.length === 0) return null;

              const levels = [...new Set(spells.map((s) => s.level))].sort();

              return (
                <div key={list.type}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <h3 className="font-display text-xs tracking-wider uppercase text-gold">
                      {list.label}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {levels.map((level) => {
                      const levelSpells = spells.filter((s) => s.level === level);
                      const key = `${list.type}-${level}`;
                      const isOpen = openLevels[key] ?? !!q;
                      return (
                        <div key={key} className="border border-border/50 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleLevel(key)}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-card/40 hover:bg-card/70 transition-colors"
                          >
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-gold shrink-0" />
                            ) : (
                              <ChevronUp className="w-4 h-4 text-muted-foreground rotate-180 shrink-0" />
                            )}
                            <span className="font-display text-xs tracking-wider uppercase text-foreground flex-1 text-left">
                              Nível {level}
                            </span>
                            <span className="text-xs text-muted-foreground">{levelSpells.length}</span>
                          </button>
                          {isOpen && (
                            <div className="p-2 space-y-1 bg-background/50">
                              {levelSpells.map((spell) => (
                                <PickerSpellRow
                                  key={spell.name}
                                  spell={spell}
                                  onAdd={() => onAddSpell(spell.name)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

function PickerSpellRow({ spell, onAdd }: { spell: Spell; onAdd: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const tag = spell.sphere || spell.school;

  return (
    <div className="rounded-lg border border-border/50 bg-card/30">
      <div className="flex items-center gap-1 p-1">
        <button
          type="button"
          onClick={onAdd}
          title="Adicionar"
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border-2 border-gold-dark/50 bg-gold-dark/10 text-gold-dark hover:bg-gold-dark/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 px-2 py-1.5 text-left min-w-0 rounded hover:bg-card/60 transition-colors"
        >
          <span className="text-sm font-body truncate">{spell.name}</span>
          <span className="text-[10px] text-muted-foreground font-display shrink-0">{tag}</span>
        </button>
      </div>
      {expanded && <SpellDetailsPanel spell={spell} />}
    </div>
  );
}

export default SpellPickerModal;
