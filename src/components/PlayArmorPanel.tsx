import { Minus, Plus, Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatArmorClass } from "@/data/equipment";
import type { PurchasedItems } from "@/data/equipment";
import type { AttributeName } from "@/data/characterData";
import {
  computeArmorClassBreakdown,
  getPurchasedBodyArmors,
  getPurchasedShields,
  type CombatLoadout,
} from "@/lib/combatStats";
import { mergeInventory } from "@/lib/inventory";

const NONE_EQUIP_VALUE = "__none__";

function formatSigned(n: number) {
  return n > 0 ? `+${n}` : `${n}`;
}

interface PlayArmorPanelProps {
  attributes: Record<AttributeName, number>;
  subAttributes: Record<string, number>;
  purchasedItems: PurchasedItems;
  addedItems?: PurchasedItems;
  selectedRaceClassAdv: string[];
  loadout: CombatLoadout;
  onLoadoutChange: (loadout: CombatLoadout) => void;
}

const PlayArmorPanel = ({
  attributes,
  subAttributes,
  purchasedItems,
  addedItems = {},
  selectedRaceClassAdv,
  loadout,
  onLoadoutChange,
}: PlayArmorPanelProps) => {
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2.5 col-span-2 sm:col-span-1">
          <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground">
            C.A.
          </p>
          <p
            className="font-display text-2xl font-bold text-gold tabular-nums leading-none mt-1"
            title={`Base ${ca.base} + Armadura ${ca.armadura} + Elmo ${ca.elmo} + Escudo ${ca.escudo} + Destreza ${formatSigned(ca.destreza)} + Outros ${formatSigned(ca.outros)}`}
          >
            {ca.total}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
          <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-1">
            Armadura
          </p>
          <Select
            value={loadout.equippedArmorId ?? NONE_EQUIP_VALUE}
            onValueChange={(next) =>
              update({ equippedArmorId: next === NONE_EQUIP_VALUE ? null : next })
            }
          >
            <SelectTrigger className="h-8 border-border/70 bg-background/80 px-2 text-xs font-body shadow-none">
              <SelectValue placeholder="Sem armadura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_EQUIP_VALUE} className="text-xs font-body">
                Sem armadura
              </SelectItem>
              {bodyArmors.map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs font-body">
                  {item.name}
                  {item.armorClass != null ? ` (${formatArmorClass(item.armorClass)})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
          <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-1">
            Escudo
          </p>
          <Select
            value={loadout.equippedShieldId ?? NONE_EQUIP_VALUE}
            onValueChange={(next) =>
              update({ equippedShieldId: next === NONE_EQUIP_VALUE ? null : next })
            }
          >
            <SelectTrigger className="h-8 border-border/70 bg-background/80 px-2 text-xs font-body shadow-none">
              <SelectValue placeholder="Sem escudo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_EQUIP_VALUE} className="text-xs font-body">
                Sem escudo
              </SelectItem>
              {shields.map((item) => (
                <SelectItem key={item.id} value={item.id} className="text-xs font-body">
                  {item.name}
                  {item.armorClass != null ? ` (${formatArmorClass(item.armorClass)})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/50 px-3 py-2">
          <p className="font-display text-[9px] tracking-wider uppercase text-muted-foreground mb-1">
            Elmo
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => update({ helmetBonus: loadout.helmetBonus - 1 })}
              className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-muted"
              aria-label="Diminuir bônus de elmo"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="flex-1 text-center font-display text-sm font-bold tabular-nums">
              {formatSigned(loadout.helmetBonus)}
            </span>
            <button
              type="button"
              onClick={() => update({ helmetBonus: loadout.helmetBonus + 1 })}
              className="h-8 w-8 rounded border border-border flex items-center justify-center hover:bg-muted"
              aria-label="Aumentar bônus de elmo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-body text-muted-foreground px-0.5">
        <span>Base {ca.base}</span>
        <span>Armadura {formatSigned(ca.armadura)}</span>
        <span>Elmo {formatSigned(ca.elmo)}</span>
        <span>Escudo {formatSigned(ca.escudo)}</span>
        <span>Destreza {formatSigned(ca.destreza)}</span>
        <span>Outros {formatSigned(ca.outros)}</span>
        {ca.magia !== 0 && <span>Magia {formatSigned(ca.magia)}</span>}
        {ca.sabedoria !== 0 && <span>Sabedoria {formatSigned(ca.sabedoria)}</span>}
      </div>

      {bodyArmors.length === 0 && shields.length === 0 && (
        <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Nenhuma armadura ou escudo no inventário. Use Ganhar/Comprar no inventário.
        </p>
      )}
    </div>
  );
};

export default PlayArmorPanel;
