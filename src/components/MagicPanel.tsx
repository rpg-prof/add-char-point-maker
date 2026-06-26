import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from "lucide-react";
import { spellLists, type Spell } from "@/data/spells";
import { spellMatchesArcane, spellMatchesDivine } from "@/data/magicAccess";
import SpellDetailsPanel from "@/components/SpellDetailsPanel";
import SpellPickerModal from "@/components/SpellPickerModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  type GrimoireEntry,
  getGrimoirePointCost,
  grimoireHasSpell,
} from "@/lib/grimoire";
import { GRIMOIRE_SPELL_POINT_COST } from "@/lib/grimoire";

interface MagicPanelProps {
  grimoire: GrimoireEntry[];
  onGrimoireChange: (grimoire: GrimoireEntry[]) => void;
  divineAccess: Record<string, "minor" | "major">;
  arcaneAccess: Record<string, "access">;
  arcaneSpecialist: string | null;
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

const MagicPanel = ({
  grimoire,
  onGrimoireChange,
  divineAccess,
  arcaneAccess,
  arcaneSpecialist,
}: MagicPanelProps) => {
  const [openLevels, setOpenLevels] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState(false);

  const relevantLists = useAccessibleLists(divineAccess, arcaneAccess, arcaneSpecialist);
  const spellLookup = useSpellLookup();

  const hasDivine = Object.keys(divineAccess).length > 0;
  const hasArcane = Object.keys(arcaneAccess).length > 0 || !!arcaneSpecialist;
  const hasAnyMagic = hasDivine || hasArcane;

  const isArcaneOnly = hasArcane && !hasDivine;
  const isDivineOnly = hasDivine && !hasArcane;
  const collectionName = isArcaneOnly ? "Grimório" : isDivineOnly ? "Livro de Orações" : "Grimório / Livro de Orações";

  const pointCost = getGrimoirePointCost(grimoire);
  const initialCount = grimoire.filter((e) => e.initial).length;

  const groupedEntries = useMemo(() => {
    const groups: {
      listType: "arcane" | "divine";
      label: string;
      levels: { level: number; entries: GrimoireEntry[] }[];
    }[] = [];

    for (const list of relevantLists) {
      const entries = grimoire.filter((e) => {
        const spell = spellLookup.get(e.name);
        return spell?.listType === list.type;
      });
      if (entries.length === 0) continue;

      const levels = [...new Set(entries.map((e) => spellLookup.get(e.name)?.level ?? 0))].sort(
        (a, b) => a - b,
      );

      groups.push({
        listType: list.type,
        label: list.label,
        levels: levels.map((level) => ({
          level,
          entries: entries
            .filter((e) => (spellLookup.get(e.name)?.level ?? 0) === level)
            .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
        })),
      });
    }

    const unknown = grimoire.filter((e) => !spellLookup.has(e.name));
    if (unknown.length > 0) {
      groups.push({
        listType: "arcane",
        label: "Outras",
        levels: [{ level: 0, entries: unknown }],
      });
    }

    return groups;
  }, [grimoire, relevantLists, spellLookup]);

  const handleAddSpell = (name: string) => {
    if (grimoireHasSpell(grimoire, name)) return;
    onGrimoireChange([...grimoire, { name, initial: true }]);
  };

  const handleRemoveSpell = (name: string) => {
    onGrimoireChange(grimoire.filter((e) => e.name !== name));
  };

  const handleToggleInitial = (name: string, initial: boolean) => {
    onGrimoireChange(
      grimoire.map((e) => (e.name === name ? { ...e, initial } : e)),
    );
  };

  const toggleLevel = (key: string) => {
    setOpenLevels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!hasAnyMagic) {
    return (
      <div className="panel-section">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-gold" />
          <h2 className="font-display text-base tracking-wider uppercase text-gold">Magia</h2>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          Selecione acesso a esferas divinas ou escolas arcanas para montar o grimório ou livro de orações.
        </p>
      </div>
    );
  }

  return (
    <div className="panel-section">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-5 h-5 text-gold shrink-0" />
          <div className="min-w-0">
            <h2 className="font-display text-base tracking-wider uppercase text-gold">{collectionName}</h2>
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              {grimoire.length} {grimoire.length === 1 ? "magia" : "magias"}
              {initialCount > 0 && (
                <>
                  {" "}
                  · {initialCount} inicial{initialCount !== 1 ? "is" : ""} ({pointCost} pts)
                </>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-gold-dark/50 bg-gold-dark/10 text-gold-dark font-display text-xs tracking-wider uppercase hover:bg-gold-dark/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </button>
      </div>

      {grimoire.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body text-center py-8 border border-dashed border-border rounded-lg">
          Nenhuma magia selecionada. Clique em Adicionar para escolher magias.
        </p>
      ) : (
        <div className="space-y-4">
          {groupedEntries.map((group) => (
            <div key={group.listType}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="font-display text-xs tracking-wider uppercase text-gold">{group.label}</h3>
              </div>
              <div className="space-y-1">
                {group.levels.map(({ level, entries }) => {
                  const key = `${group.listType}-${level}`;
                  const isOpen = openLevels[key] ?? true;
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
                          {level > 0 ? `Nível ${level}` : "Sem nível"}
                        </span>
                        <span className="text-xs text-muted-foreground">{entries.length}</span>
                      </button>
                      {isOpen && (
                        <div className="p-2 space-y-1 bg-background/50">
                          {entries.map((entry) => {
                            const spell = spellLookup.get(entry.name);
                            return (
                              <GrimoireSpellRow
                                key={entry.name}
                                entry={entry}
                                spell={spell ?? null}
                                collectionName={collectionName}
                                onRemove={() => handleRemoveSpell(entry.name)}
                                onToggleInitial={(initial) => handleToggleInitial(entry.name, initial)}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <SpellPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        grimoire={grimoire}
        onAddSpell={handleAddSpell}
        divineAccess={divineAccess}
        arcaneAccess={arcaneAccess}
        arcaneSpecialist={arcaneSpecialist}
        collectionName={collectionName}
      />
    </div>
  );
};

function GrimoireSpellRow({
  entry,
  spell,
  collectionName,
  onRemove,
  onToggleInitial,
}: {
  entry: GrimoireEntry;
  spell: Spell | null;
  collectionName: string;
  onRemove: () => void;
  onToggleInitial: (initial: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tag = spell ? spell.sphere || spell.school : "";

  return (
    <div className="rounded-lg border border-border/50 bg-card/30">
      <div className="flex items-center gap-1 p-1">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              title="Remover"
              className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-2 border-gold-dark/40">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display tracking-wide text-gold-dark">
                Remover magia?
              </AlertDialogTitle>
              <AlertDialogDescription className="font-body text-foreground/80">
                Remover <strong>{entry.name}</strong> do {collectionName}? Esta ação não pode ser desfeita
                automaticamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-display text-xs uppercase tracking-wider">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onRemove}
                className="font-display text-xs uppercase tracking-wider bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center gap-2 px-2 py-1.5 text-left min-w-0 rounded hover:bg-card/60 transition-colors"
        >
          <span className="text-sm font-body truncate">{entry.name}</span>
          {tag && (
            <span className="text-[10px] text-muted-foreground font-display shrink-0">{tag}</span>
          )}
        </button>
        <div
          className="flex items-center gap-1.5 px-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            id={`initial-${entry.name}`}
            checked={entry.initial}
            onCheckedChange={(checked) => onToggleInitial(checked === true)}
          />
          <Label
            htmlFor={`initial-${entry.name}`}
            className="text-[10px] font-display uppercase tracking-wide text-muted-foreground cursor-pointer whitespace-nowrap"
            title={`Magia inicial — ${GRIMOIRE_SPELL_POINT_COST} pts de personagem`}
          >
            Inicial
          </Label>
        </div>
      </div>
      {expanded && spell && <SpellDetailsPanel spell={spell} />}
    </div>
  );
}

export default MagicPanel;
