import { useState } from "react";
import { Minus, Plus, Shield, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { equipmentById, formatArmorClass } from "@/data/equipment";
import type { PurchasedItems } from "@/data/equipment";
import type { AttributeName } from "@/data/characterData";
import {
  computeArmorClassBreakdown,
  getPurchasedBodyArmors,
  getPurchasedShields,
  parseArmorClassBonus,
  type CombatLoadout,
  type MagicCaBonus,
} from "@/lib/combatStats";
import { mergeInventory } from "@/lib/inventory";

const NONE_EQUIP_VALUE = "__none__";

function formatSigned(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

type SourceTag = {
  key: string;
  label: string;
  value: number;
  kind: "armor" | "shield" | "helmet" | "magic" | "auto" | "other" | "wisdom";
};

const tagStyles: Record<SourceTag["kind"], string> = {
  armor: "border-border/60 bg-background/70 text-foreground",
  shield: "border-border/60 bg-background/70 text-foreground",
  helmet: "border-border/60 bg-background/70 text-foreground",
  magic: "border-gold/35 bg-gold/10 text-foreground",
  auto: "border-gold/30 bg-gold/5 text-foreground",
  other: "border-border/60 bg-secondary/50 text-foreground",
  wisdom: "border-gold/30 bg-gold/5 text-foreground",
};

interface PlayArmorPanelProps {
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  purchasedItems: PurchasedItems;
  addedItems?: PurchasedItems;
  selectedRaceClassAdv: string[];
  loadout: CombatLoadout;
  onLoadoutChange: (loadout: CombatLoadout) => void;
  editOpen: boolean;
  onEditOpenChange: (open: boolean) => void;
}

const PlayArmorPanel = ({
  attributes,
  subAttributes,
  purchasedItems,
  addedItems = {},
  selectedRaceClassAdv,
  loadout,
  onLoadoutChange,
  editOpen,
  onEditOpenChange,
}: PlayArmorPanelProps) => {
  const [newMagicLabel, setNewMagicLabel] = useState("");
  const [newMagicValue, setNewMagicValue] = useState("4");

  const inventory = mergeInventory(purchasedItems, addedItems);
  const bodyArmors = getPurchasedBodyArmors(inventory);
  const shields = getPurchasedShields(inventory);
  const ca = computeArmorClassBreakdown({
    subAttributes,
    purchased: inventory,
    selectedRaceClassAdv,
    destrezaMain: attributes.Destreza,
    sabedoriaMain: attributes.Sabedoria,
    loadout,
  });

  const update = (patch: Partial<CombatLoadout>) => {
    onLoadoutChange({ ...loadout, ...patch });
  };

  const addMagicBonus = () => {
    const label = newMagicLabel.trim();
    const value = Number(newMagicValue);
    if (!label || Number.isNaN(value) || value === 0) return;
    const entry: MagicCaBonus = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      value,
    };
    update({ magicBonuses: [...loadout.magicBonuses, entry] });
    setNewMagicLabel("");
    setNewMagicValue("4");
  };

  const removeMagicBonus = (id: string) => {
    update({ magicBonuses: loadout.magicBonuses.filter((b) => b.id !== id) });
  };

  const armorItem = loadout.equippedArmorId
    ? equipmentById[loadout.equippedArmorId]
    : undefined;
  const shieldItem = loadout.equippedShieldId
    ? equipmentById[loadout.equippedShieldId]
    : undefined;

  const sourceTags: SourceTag[] = [];
  if (armorItem) {
    sourceTags.push({
      key: `armor-${armorItem.id}`,
      label: armorItem.name,
      value: ca.armadura || parseArmorClassBonus(armorItem.armorClass),
      kind: "armor",
    });
  }
  if (shieldItem) {
    sourceTags.push({
      key: `shield-${shieldItem.id}`,
      label: shieldItem.name,
      value: ca.escudo,
      kind: "shield",
    });
  }
  if (loadout.helmetBonus !== 0) {
    sourceTags.push({
      key: "helmet",
      label: "Elmo",
      value: loadout.helmetBonus,
      kind: "helmet",
    });
  }
  for (const entry of ca.outrosAuto) {
    sourceTags.push({
      key: `auto-${entry.label}`,
      label: entry.label,
      value: entry.value,
      kind: "auto",
    });
  }
  if (ca.outrosManual !== 0) {
    sourceTags.push({
      key: "outros-manual",
      label: "Outros",
      value: ca.outrosManual,
      kind: "other",
    });
  }
  for (const bonus of loadout.magicBonuses) {
    sourceTags.push({
      key: `magic-${bonus.id}`,
      label: bonus.label,
      value: bonus.value,
      kind: "magic",
    });
  }
  if (ca.sabedoria !== 0) {
    sourceTags.push({
      key: "wisdom",
      label: "Defesa por Sabedoria",
      value: ca.sabedoria,
      kind: "wisdom",
    });
  }

  const components = [
    { label: "Base", value: String(ca.base) },
    { label: "Arm.", value: formatSigned(ca.armadura) },
    { label: "Elmo", value: formatSigned(ca.elmo) },
    { label: "Esc.", value: formatSigned(ca.escudo) },
    { label: "Des", value: formatSigned(ca.destreza) },
    { label: "Out.", value: formatSigned(ca.outros) },
    { label: "Mag", value: formatSigned(ca.magia) },
    ...(ca.sabedoria !== 0
      ? [{ label: "Sab", value: formatSigned(ca.sabedoria) }]
      : []),
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
        <span className="font-display text-micro tracking-wider uppercase text-muted-foreground shrink-0">
          CA
        </span>
        <span className="font-display text-stat font-bold text-gold tabular-nums leading-none">
          {ca.total}
        </span>
        <span className="text-meta font-body text-muted-foreground tabular-nums leading-none">
          {components.map(({ label, value }, i) => (
            <span key={label}>
              {i > 0 ? <span className="mx-1.5 text-border">·</span> : null}
              <span className="text-muted-foreground/75">{label}</span>{" "}
              <span className="text-foreground/80">{value}</span>
            </span>
          ))}
        </span>
      </div>

      {sourceTags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {sourceTags.map((tag) => (
            <span
              key={tag.key}
              className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-meta font-body leading-tight ${tagStyles[tag.kind]}`}
            >
              {tag.label}
              <span className="font-display text-micro text-gold-dark tabular-nums">
                ({formatSigned(tag.value)})
              </span>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-meta text-muted-foreground font-body flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Nenhum bônus de CA ativo.
        </p>
      )}

      <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <div className="px-5 pt-5 pb-3 border-b border-border bg-secondary/70 pr-12">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <span className="p-2 rounded-lg border border-gold-dark/40 bg-gold/15 text-gold-dark shrink-0">
                  <Shield className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="font-display tracking-wide text-field text-gold-dark">
                    Editar armadura
                  </DialogTitle>
                  <DialogDescription className="font-body text-meta text-foreground/65 mt-1">
                    Equipamento, elmo, ajuste manual e bônus mágicos de CA.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 space-y-4 bg-background max-h-[70vh] overflow-y-auto">
            <div className="rounded-lg border border-gold/30 bg-gold/5 px-3 py-2.5 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-micro tracking-wider uppercase text-muted-foreground">
                  CA atual
                </p>
                <p className="font-display text-stat font-bold text-gold tabular-nums leading-none mt-0.5">
                  {ca.total}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-x-2 gap-y-0.5 text-micro font-body text-muted-foreground text-right">
                {components.map(({ label, value }) => (
                  <span key={label}>
                    {label} {value}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 min-w-0 sm:col-span-2">
                <p className="font-display text-micro tracking-wider uppercase text-muted-foreground mb-1">
                  Armadura
                </p>
                <Select
                  value={loadout.equippedArmorId ?? NONE_EQUIP_VALUE}
                  onValueChange={(next) =>
                    update({ equippedArmorId: next === NONE_EQUIP_VALUE ? null : next })
                  }
                >
                  <SelectTrigger className="h-9 border-border/70 bg-background/80 px-2 text-meta font-body shadow-none">
                    <SelectValue placeholder="Sem armadura" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_EQUIP_VALUE} className="text-meta font-body">
                      Sem armadura
                    </SelectItem>
                    {bodyArmors.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-meta font-body">
                        {item.name}
                        {item.armorClass != null
                          ? ` (${formatArmorClass(item.armorClass)})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 min-w-0">
                <p className="font-display text-micro tracking-wider uppercase text-muted-foreground mb-1">
                  Escudo
                </p>
                <Select
                  value={loadout.equippedShieldId ?? NONE_EQUIP_VALUE}
                  onValueChange={(next) =>
                    update({ equippedShieldId: next === NONE_EQUIP_VALUE ? null : next })
                  }
                >
                  <SelectTrigger className="h-9 border-border/70 bg-background/80 px-2 text-meta font-body shadow-none">
                    <SelectValue placeholder="Sem escudo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_EQUIP_VALUE} className="text-meta font-body">
                      Sem escudo
                    </SelectItem>
                    {shields.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="text-meta font-body">
                        {item.name}
                        {item.armorClass != null
                          ? ` (${formatArmorClass(item.armorClass)})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
                <p className="font-display text-micro tracking-wider uppercase text-muted-foreground mb-1">
                  Elmo
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => update({ helmetBonus: loadout.helmetBonus - 1 })}
                    className="h-9 w-9 rounded border border-border flex items-center justify-center hover:bg-muted"
                    aria-label="Diminuir bônus de elmo"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="flex-1 text-center font-display text-field font-bold tabular-nums">
                    {formatSigned(loadout.helmetBonus)}
                  </span>
                  <button
                    type="button"
                    onClick={() => update({ helmetBonus: loadout.helmetBonus + 1 })}
                    className="h-9 w-9 rounded border border-border flex items-center justify-center hover:bg-muted"
                    aria-label="Aumentar bônus de elmo"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
              <p className="font-display text-micro tracking-wider uppercase text-muted-foreground mb-1">
                Ajuste manual (Outros)
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => update({ outrosBonus: loadout.outrosBonus - 1 })}
                  className="h-9 w-9 rounded border border-border flex items-center justify-center hover:bg-muted"
                  aria-label="Diminuir outros"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  value={loadout.outrosBonus}
                  onChange={(e) => update({ outrosBonus: Number(e.target.value) || 0 })}
                  className="flex-1 h-9 text-center bg-background border border-border rounded font-display text-field font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <button
                  type="button"
                  onClick={() => update({ outrosBonus: loadout.outrosBonus + 1 })}
                  className="h-9 w-9 rounded border border-border flex items-center justify-center hover:bg-muted"
                  aria-label="Aumentar outros"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {ca.outrosAuto.length > 0 && (
                <p className="text-micro text-muted-foreground font-body mt-1.5">
                  Automáticos:{" "}
                  {ca.outrosAuto
                    .map((e) => `${e.label} ${formatSigned(e.value)}`)
                    .join(" · ")}
                </p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 space-y-2">
              <p className="font-display text-micro tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                Bônus de magia (CA)
              </p>

              {loadout.magicBonuses.length > 0 ? (
                <ul className="space-y-1.5">
                  {loadout.magicBonuses.map((bonus) => (
                    <li
                      key={bonus.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-gold/25 bg-gold/5 px-2.5 py-1.5 text-meta font-body"
                    >
                      <span className="truncate min-w-0">
                        {bonus.label}{" "}
                        <span className="font-display text-gold-dark tabular-nums">
                          {formatSigned(bonus.value)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMagicBonus(bonus.id)}
                        className="text-blood/80 hover:text-blood shrink-0"
                        title={`Remover ${bonus.label}`}
                        aria-label={`Remover ${bonus.label}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-meta text-muted-foreground font-body">
                  Nenhum bônus mágico ativo. Ex.: Armadura Arcana.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Ex.: Armadura Arcana"
                  value={newMagicLabel}
                  onChange={(e) => setNewMagicLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMagicBonus();
                    }
                  }}
                  className="flex-1 min-w-[10rem] h-8 bg-background/80 border border-border/70 rounded px-2 text-meta font-body focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  type="number"
                  value={newMagicValue}
                  onChange={(e) => setNewMagicValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMagicBonus();
                    }
                  }}
                  className="w-16 h-8 bg-background/80 border border-border/70 rounded px-2 text-meta font-display font-bold text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-gold/30"
                  aria-label="Valor do bônus de magia"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMagicBonus}
                  disabled={!newMagicLabel.trim() || Number(newMagicValue) === 0}
                  className="h-8 font-body text-meta border-gold/40 hover:bg-gold/10"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>

            {bodyArmors.length === 0 && shields.length === 0 && (
              <p className="text-meta text-muted-foreground font-body flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Nenhuma armadura ou escudo no inventário. Use Ganhar/Comprar no inventário.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayArmorPanel;
