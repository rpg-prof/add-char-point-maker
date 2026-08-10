import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, FlaskConical, Minus, Plus, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SpellDetailsPanel from "@/components/SpellDetailsPanel";
import { spellLists, type Spell } from "@/data/spells";
import type { GrimoireEntry } from "@/lib/grimoire";
import {
  emptyMagicComponentRow,
  type MagicComponentEntry,
} from "@/lib/magicComponents";

interface PlayGrimoireModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  grimoire: GrimoireEntry[];
  magicComponents: MagicComponentEntry[];
  onMagicComponentsChange: (entries: MagicComponentEntry[]) => void;
}

const componentInputCls =
  "w-full min-w-0 bg-background/50 border border-border rounded px-2 py-1.5 text-foreground font-body text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold";

function useSpellLookup() {
  return useMemo(() => {
    const map = new Map<string, Spell & { listType: "arcane" | "divine" }>();
    for (const list of spellLists) {
      for (const spell of list.spells) {
        map.set(spell.name, { ...spell, listType: list.type });
      }
    }
    return map;
  }, []);
}

const PlayGrimoireModal = ({
  open,
  onOpenChange,
  title,
  grimoire,
  magicComponents,
  onMagicComponentsChange,
}: PlayGrimoireModalProps) => {
  const spellLookup = useSpellLookup();
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const groupedEntries = useMemo(() => {
    const groups: {
      listType: "arcane" | "divine";
      label: string;
      levels: { level: number; entries: GrimoireEntry[] }[];
    }[] = [];

    for (const listType of ["arcane", "divine"] as const) {
      const entries = grimoire.filter((e) => {
        const spell = spellLookup.get(e.name);
        if (!spell) return listType === "arcane";
        return spell.listType === listType;
      });
      if (entries.length === 0) continue;

      const byLevel = new Map<number, GrimoireEntry[]>();
      for (const entry of entries) {
        const spell = spellLookup.get(entry.name);
        const level = spell?.level ?? 0;
        const list = byLevel.get(level) ?? [];
        list.push(entry);
        byLevel.set(level, list);
      }

      const levels = [...byLevel.entries()]
        .sort(([a], [b]) => a - b)
        .map(([level, levelEntries]) => ({
          level,
          entries: levelEntries.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
        }));

      groups.push({
        listType,
        label: listType === "arcane" ? "Magias Arcanas" : "Magias Divinas",
        levels,
      });
    }

    const unknown = grimoire.filter((e) => !spellLookup.has(e.name));
    if (unknown.length > 0 && !groups.some((g) => g.listType === "arcane")) {
      groups.push({
        listType: "arcane",
        label: "Magias",
        levels: [{ level: 0, entries: unknown }],
      });
    }

    return groups;
  }, [grimoire, spellLookup]);

  const updateComponent = (index: number, patch: Partial<MagicComponentEntry>) => {
    onMagicComponentsChange(
      magicComponents.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const removeComponentRow = (index: number) => {
    if (magicComponents.length <= 1) {
      onMagicComponentsChange([emptyMagicComponentRow()]);
      return;
    }
    onMagicComponentsChange(magicComponents.filter((_, i) => i !== index));
  };

  const addComponentRow = () => {
    onMagicComponentsChange([...magicComponents, emptyMagicComponentRow()]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden bg-card border-2 border-gold-dark/40">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/60 shrink-0">
          <DialogTitle className="font-display tracking-wide text-gold-dark flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-muted-foreground">
            {grimoire.length === 0
              ? "Nenhuma magia registrada."
              : `${grimoire.length} ${grimoire.length === 1 ? "magia" : "magias"} · toque para ver detalhes`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-0">
          <div className="min-h-0 overflow-y-auto px-4 py-3 space-y-4 border-b md:border-b-0 md:border-r border-border/60">
            {grimoire.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-8 border border-dashed border-border rounded-lg">
                O personagem ainda não tem magias no {title.toLowerCase()}.
                Adicione magias na edição do personagem.
              </p>
            ) : (
              groupedEntries.map((group) => (
                <div key={group.listType}>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <h3 className="font-display text-xs tracking-wider uppercase text-gold">
                      {group.label}
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {group.levels.map(({ level, entries }) => {
                      const key = `${group.listType}-${level}`;
                      const isOpen = openLevels[key] ?? true;
                      return (
                        <div
                          key={key}
                          className="border border-border/50 rounded-lg overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenLevels((prev) => ({
                                ...prev,
                                [key]: !isOpen,
                              }))
                            }
                            className="w-full flex items-center gap-2 px-3 py-2 bg-card/40 hover:bg-card/70 transition-colors"
                          >
                            <ChevronDown
                              className={`w-4 h-4 text-gold shrink-0 transition-transform ${
                                isOpen ? "" : "-rotate-90"
                              }`}
                            />
                            <span className="font-display text-xs tracking-wider uppercase text-foreground flex-1 text-left">
                              {level > 0 ? `Nível ${level}` : "Sem nível"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {entries.length}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="p-2 space-y-1 bg-background/50">
                              {entries.map((entry) => {
                                const spell = spellLookup.get(entry.name);
                                const isExpanded = expanded[entry.name] ?? false;
                                const tag = spell
                                  ? spell.sphere || spell.school
                                  : "";
                                return (
                                  <div
                                    key={entry.name}
                                    className="rounded-lg border border-border/50 bg-card/30"
                                  >
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpanded((prev) => ({
                                          ...prev,
                                          [entry.name]: !isExpanded,
                                        }))
                                      }
                                      className="w-full flex items-center gap-2 px-2.5 py-2 text-left min-w-0 hover:bg-card/60 transition-colors"
                                    >
                                      <span className="text-sm font-body truncate flex-1">
                                        {entry.name}
                                      </span>
                                      {tag && (
                                        <span className="text-[10px] text-muted-foreground font-display shrink-0">
                                          {tag}
                                        </span>
                                      )}
                                    </button>
                                    {isExpanded && spell && (
                                      <SpellDetailsPanel spell={spell} />
                                    )}
                                    {isExpanded && !spell && (
                                      <p className="mx-2 mb-2 px-3 py-2 text-xs text-muted-foreground font-body">
                                        Detalhes não encontrados para esta magia.
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="min-h-0 overflow-y-auto px-4 py-3 bg-card/20">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-gold shrink-0" />
              <h3 className="font-display text-xs tracking-wider uppercase text-gold">
                Componentes
              </h3>
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_2.75rem_1.5rem] gap-1.5 px-0.5">
                <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                  Item
                </span>
                <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground text-center">
                  Qtd
                </span>
                <span className="sr-only">Remover</span>
              </div>
              {magicComponents.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_2.75rem_1.5rem] gap-1.5 items-center"
                >
                  <input
                    type="text"
                    value={row.item}
                    onChange={(e) => updateComponent(index, { item: e.target.value })}
                    placeholder="Item"
                    className={componentInputCls}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.qty}
                    onChange={(e) => updateComponent(index, { qty: e.target.value })}
                    placeholder="0"
                    className={`${componentInputCls} text-center tabular-nums`}
                  />
                  <button
                    type="button"
                    onClick={() => removeComponentRow(index)}
                    title="Remover linha"
                    className="w-6 h-6 flex items-center justify-center rounded border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addComponentRow}
                className="w-full mt-1 flex items-center justify-center gap-1 py-1.5 rounded border border-dashed border-border text-[10px] font-display uppercase tracking-wider text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Linha
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayGrimoireModal;
