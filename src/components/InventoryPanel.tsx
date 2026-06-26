import { useMemo, useState } from "react";
import {
  Minus,
  PenLine,
  Plus,
  Scale,
  ShoppingCart,
  Sword,
  Shield,
  Package,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ItemPickerModal, { type ItemPickerMainTab } from "@/components/ItemPickerModal";
import {
  formatMoney,
  formatArmorClass,
  getRemainingCopper,
  getSpentCopper,
  getStartingCapitalPc,
  getTotalWeightKg,
  type CustomInventoryItem,
  type EquipmentItem,
  type PurchasedItems,
} from "@/data/equipment";
import { socialClasses } from "@/data/characterData";
import { getSubAttributeBonuses } from "@/data/subAttributes";
import { COPPER_PER_GOLD, COPPER_PER_SILVER, copperToBreakdown, parseCargaKg } from "@/data/currency";
import {
  buildInventoryEntries,
  createCustomItemId,
  isBodyArmor,
  isCustomWeapon,
  isHelmet,
  isOtherGear,
  isShield,
  isWeapon,
  type InventoryEntry,
} from "@/lib/inventory";
import {
  formatWeaponDamageType,
  WEAPON_DAMAGE_TYPE_OPTIONS,
} from "@/data/weaponDamageTypes";

interface InventoryPanelProps {
  selectedSocialClass: string;
  subAttributes: Record<string, number>;
  purchased: PurchasedItems;
  added: PurchasedItems;
  customItems: CustomInventoryItem[];
  extraMoneyPc: number;
  onPurchaseChange: (purchased: PurchasedItems) => void;
  onAddedChange: (added: PurchasedItems) => void;
  onCustomItemsChange: (items: CustomInventoryItem[]) => void;
  onExtraMoneyChange: (extraMoneyPc: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ItemSubtext({ item, boughtQty, addedQty }: { item: EquipmentItem; boughtQty: number; addedQty: number }) {
  const caLabel = item.category === "armadura" ? formatArmorClass(item.armorClass) : null;
  const parts: string[] = [];

  if (item.weightKg > 0) {
    parts.push(`${item.weightKg.toFixed(2).replace(".", ",")} kg/un`);
  }
  if (caLabel) parts.push(`CA ${caLabel}`);
  if (item.weaponStats) {
    const { damagePM, speed } = item.weaponStats;
    if (damagePM) parts.push(`Dano ${damagePM}`);
    if (speed) parts.push(`Vel. ${speed}`);
  }

  return (
    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
      {parts.join(" · ")}
      {addedQty > 0 && boughtQty > 0 && (
        <span className="text-amber-400/80">
          {" · "}
          {addedQty} loot
        </span>
      )}
    </p>
  );
}

function SourceBadge({ boughtQty, addedQty }: { boughtQty: number; addedQty: number }) {
  if (boughtQty > 0 && addedQty === 0) {
    return (
      <span className="text-[9px] font-display tracking-wide px-1.5 py-0.5 rounded border border-gold/30 text-gold/60 bg-gold/5">
        comprado
      </span>
    );
  }
  if (addedQty > 0 && boughtQty === 0) {
    return (
      <span className="text-[9px] font-display tracking-wide px-1.5 py-0.5 rounded border border-gold-dark/30 text-gold-dark bg-gold-dark/5">
        loot
      </span>
    );
  }
  return null;
}

function QtyBadge({ qty }: { qty: number }) {
  if (qty <= 1) return null;
  return (
    <span className="min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-gold/15 text-gold font-display text-[10px] font-bold px-1">
      ×{qty}
    </span>
  );
}

// ─── Item Row ────────────────────────────────────────────────────────────────

function CatalogItemRow({
  entry,
  onAdd,
  onRemove,
}: {
  entry: InventoryEntry;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { id, item, qty, boughtQty, addedQty } = entry;
  return (
    <li className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/50 bg-card/40 hover:bg-card/60 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-body">{item.name}</p>
          <QtyBadge qty={qty} />
          <SourceBadge boughtQty={boughtQty} addedQty={addedQty} />
        </div>
        <ItemSubtext item={item} boughtQty={boughtQty} addedQty={addedQty} />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onRemove(id)}
          className="w-6 h-6 flex items-center justify-center rounded border border-border/70 hover:bg-destructive/10 hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-colors"
          title="Remover 1"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onAdd(id)}
          className="w-6 h-6 flex items-center justify-center rounded border border-border/70 hover:bg-gold/10 hover:border-gold/40 text-muted-foreground hover:text-gold transition-colors"
          title="Adicionar 1"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </li>
  );
}

function CustomWeaponRow({
  item,
  onAddOne,
  onRemoveOne,
}: {
  item: CustomInventoryItem;
  onAddOne: (id: string) => void;
  onRemoveOne: (id: string) => void;
}) {
  const stats = item.weaponStats;
  return (
    <li className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-dashed border-gold-dark/40 bg-gold-dark/5 hover:bg-gold-dark/10 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-body">{item.name}</p>
          <QtyBadge qty={item.qty} />
          <span className="text-[9px] font-display tracking-wide px-1.5 py-0.5 rounded border border-gold-dark/30 text-gold-dark bg-gold-dark/5">
            personalizada
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
          {stats && (
            <>
              {stats.type && (
                <>
                  {formatWeaponDamageType(stats.type)}
                  {" · "}
                </>
              )}
              Dano P/M {stats.damagePM}
              {stats.damageG && stats.damageG !== stats.damagePM && ` · G ${stats.damageG}`}
              {" · "}
            </>
          )}
          {item.weightKg > 0
            ? `${item.weightKg.toFixed(2).replace(".", ",")} kg/un`
            : "sem peso registrado"}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onRemoveOne(item.id)}
          className="w-6 h-6 flex items-center justify-center rounded border border-border/70 hover:bg-destructive/10 hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-colors"
          title="Remover 1"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onAddOne(item.id)}
          className="w-6 h-6 flex items-center justify-center rounded border border-border/70 hover:bg-gold/10 hover:border-gold/40 text-muted-foreground hover:text-gold transition-colors"
          title="Adicionar 1"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </li>
  );
}

function CustomItemRow({
  item,
  onAddOne,
  onRemoveOne,
}: {
  item: CustomInventoryItem;
  onAddOne: (id: string) => void;
  onRemoveOne: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-dashed border-gold/30 bg-gold/5 hover:bg-gold/10 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm font-body">{item.name}</p>
          <QtyBadge qty={item.qty} />
          <span className="text-[9px] font-display tracking-wide px-1.5 py-0.5 rounded border border-gold/30 text-gold/60 bg-gold/5">
            personalizado
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
          {item.weightKg > 0
            ? `${item.weightKg.toFixed(2).replace(".", ",")} kg/un · ${(item.weightKg * item.qty).toFixed(2).replace(".", ",")} kg total`
            : "sem peso registrado"}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onRemoveOne(item.id)}
          className="w-6 h-6 flex items-center justify-center rounded border border-border/70 hover:bg-destructive/10 hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-colors"
          title="Remover 1"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => onAddOne(item.id)}
          className="w-6 h-6 flex items-center justify-center rounded border border-border/70 hover:bg-gold/10 hover:border-gold/40 text-muted-foreground hover:text-gold transition-colors"
          title="Adicionar 1"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </li>
  );
}

// ─── Section Actions ─────────────────────────────────────────────────────────

function SectionActions({
  onBuy,
  onAdd,
  onDescribe,
  describeTitle = "Descrever item",
}: {
  onBuy: () => void;
  onAdd: () => void;
  onDescribe?: () => void;
  describeTitle?: string;
}) {
  return (
    <>
      <Button
        type="button"
        size="sm"
        className="h-7 w-7 p-0 bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25"
        onClick={onBuy}
        title="Comprar"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 w-7 p-0"
        onClick={onAdd}
        title="Adicionar"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
      {onDescribe && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={onDescribe}
          title={describeTitle}
        >
          <PenLine className="w-3.5 h-3.5" />
        </Button>
      )}
    </>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function InventorySection({
  title,
  count,
  icon,
  actions,
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-card/60 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gold/70 shrink-0">{icon}</span>
          <span className="font-display text-xs tracking-wider uppercase truncate">{title}</span>
          {count > 0 && (
            <span className="text-[10px] font-display font-bold bg-gold/15 text-gold px-1.5 py-0.5 rounded-full shrink-0">
              {count}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end shrink-0">{actions}</div>
      </div>
      <div className="p-2.5">{children}</div>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

const InventoryPanel = ({
  selectedSocialClass,
  subAttributes,
  purchased,
  added,
  customItems,
  extraMoneyPc,
  onPurchaseChange,
  onAddedChange,
  onCustomItemsChange,
  onExtraMoneyChange,
}: InventoryPanelProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<"buy" | "add">("buy");
  const [pickerMainTab, setPickerMainTab] = useState<ItemPickerMainTab>("armas");
  const [moneyDialogOpen, setMoneyDialogOpen] = useState(false);
  const [moneyDialogMode, setMoneyDialogMode] = useState<"add" | "remove">("add");
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customWeaponDialogOpen, setCustomWeaponDialogOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customWeight, setCustomWeight] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [customWeaponName, setCustomWeaponName] = useState("");
  const [customWeaponType, setCustomWeaponType] = useState("");
  const [customWeaponDamagePM, setCustomWeaponDamagePM] = useState("");
  const [customWeaponDamageG, setCustomWeaponDamageG] = useState("");
  const [customWeaponWeight, setCustomWeaponWeight] = useState("");
  const [customWeaponQty, setCustomWeaponQty] = useState("1");
  const [moneyPo, setMoneyPo] = useState("");
  const [moneyPp, setMoneyPp] = useState("");
  const [moneyPc, setMoneyPc] = useState("");

  const resistenciaValue = subAttributes["Resistência"] ?? 10;
  const cargaBonus =
    getSubAttributeBonuses("Resistência", resistenciaValue)["Carga Permitida"] ?? "—";
  const cargaKg = parseCargaKg(cargaBonus);

  const startingPc = getStartingCapitalPc(selectedSocialClass, socialClasses);
  const spentPc = getSpentCopper(purchased);
  const remainingPc = getRemainingCopper(selectedSocialClass, socialClasses, purchased, extraMoneyPc);
  const totalBudgetPc = startingPc + Math.max(0, extraMoneyPc);
  const totalWeight = getTotalWeightKg(purchased, added, customItems);
  const overCarga = cargaKg > 0 && totalWeight > cargaKg;

  const remainingBreakdown = copperToBreakdown(Math.max(0, remainingPc));
  const weightPct = cargaKg > 0 ? Math.min(100, (totalWeight / cargaKg) * 100) : 0;
  const weightColor =
    weightPct >= 100 ? "bg-destructive" : weightPct >= 80 ? "bg-amber-400" : "bg-gold-dark";

  const entries = useMemo(() => buildInventoryEntries(purchased, added), [purchased, added]);

  const weapons = useMemo(() => entries.filter((e) => isWeapon(e.item)), [entries]);
  const customWeapons = useMemo(() => customItems.filter(isCustomWeapon), [customItems]);
  const customGear = useMemo(() => customItems.filter((item) => !isCustomWeapon(item)), [customItems]);
  const bodyArmors = useMemo(() => entries.filter((e) => isBodyArmor(e.item)), [entries]);
  const shields = useMemo(() => entries.filter((e) => isShield(e.item)), [entries]);
  const helmets = useMemo(() => entries.filter((e) => isHelmet(e.item)), [entries]);
  const others = useMemo(() => entries.filter((e) => isOtherGear(e.item)), [entries]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openPicker = (mode: "buy" | "add", mainTab: ItemPickerMainTab) => {
    setPickerMode(mode);
    setPickerMainTab(mainTab);
    setPickerOpen(true);
  };

  const buyItem = (id: string) => onPurchaseChange({ ...purchased, [id]: (purchased[id] ?? 0) + 1 });
  const addItem = (id: string) => onAddedChange({ ...added, [id]: (added[id] ?? 0) + 1 });

  const removeOne = (id: string) => {
    if ((added[id] ?? 0) > 0) {
      const next = { ...added };
      const qty = next[id] - 1;
      if (qty <= 0) delete next[id]; else next[id] = qty;
      onAddedChange(next);
      return;
    }
    if ((purchased[id] ?? 0) > 0) {
      const next = { ...purchased };
      const qty = next[id] - 1;
      if (qty <= 0) delete next[id]; else next[id] = qty;
      onPurchaseChange(next);
    }
  };

  const addOneMore = (id: string) => {
    if ((purchased[id] ?? 0) > 0) {
      onPurchaseChange({ ...purchased, [id]: (purchased[id] ?? 0) + 1 });
    } else {
      onAddedChange({ ...added, [id]: (added[id] ?? 0) + 1 });
    }
  };

  const removeCustomOne = (id: string) => {
    onCustomItemsChange(
      customItems
        .map((item) => {
          if (item.id !== id) return item;
          const qty = item.qty - 1;
          return qty <= 0 ? null : { ...item, qty };
        })
        .filter((item): item is CustomInventoryItem => item != null),
    );
  };

  const addCustomOne = (id: string) => {
    onCustomItemsChange(
      customItems.map((item) => item.id === id ? { ...item, qty: item.qty + 1 } : item),
    );
  };

  const confirmCustomItem = () => {
    const name = customName.trim();
    if (!name) return;
    const weightKg = Math.max(0, parseFloat(customWeight.replace(",", ".")) || 0);
    const qty = Math.max(1, parseInt(customQty, 10) || 1);
    onCustomItemsChange([...customItems, { id: createCustomItemId(), name, weightKg, qty }]);
    setCustomName(""); setCustomWeight(""); setCustomQty("1");
    setCustomDialogOpen(false);
  };

  const confirmCustomWeapon = () => {
    const name = customWeaponName.trim();
    const damagePM = customWeaponDamagePM.trim();
    const damageG = customWeaponDamageG.trim();
    if (!name || (!damagePM && !damageG)) return;
    const weightKg = Math.max(0, parseFloat(customWeaponWeight.replace(",", ".")) || 0);
    const qty = Math.max(1, parseInt(customWeaponQty, 10) || 1);
    onCustomItemsChange([
      ...customItems,
      {
        id: createCustomItemId(),
        name,
        weightKg,
        qty,
        weaponStats: {
          damagePM: damagePM || damageG,
          damageG: damageG || damagePM,
          ...(customWeaponType ? { type: customWeaponType } : {}),
        },
      },
    ]);
    setCustomWeaponName("");
    setCustomWeaponType("");
    setCustomWeaponDamagePM("");
    setCustomWeaponDamageG("");
    setCustomWeaponWeight("");
    setCustomWeaponQty("1");
    setCustomWeaponDialogOpen(false);
  };

  const openMoneyDialog = (mode: "add" | "remove") => {
    setMoneyDialogMode(mode);
    setMoneyPo(""); setMoneyPp(""); setMoneyPc("");
    setMoneyDialogOpen(true);
  };

  const confirmMoneyAdjust = () => {
    const po = parseInt(moneyPo, 10) || 0;
    const pp = parseInt(moneyPp, 10) || 0;
    const pc = parseInt(moneyPc, 10) || 0;
    const total = po * COPPER_PER_GOLD + pp * COPPER_PER_SILVER + pc;
    if (total <= 0) { setMoneyDialogOpen(false); return; }
    if (moneyDialogMode === "add") {
      onExtraMoneyChange(extraMoneyPc + total);
    } else {
      const maxRemoval = Math.max(0, remainingPc);
      onExtraMoneyChange(extraMoneyPc - Math.min(total, maxRemoval));
    }
    setMoneyPo(""); setMoneyPp(""); setMoneyPc("");
    setMoneyDialogOpen(false);
  };

  return (
    <div className="flex gap-3 items-start">

      {/* ══ Coluna esquerda — Inventário (3/4) ══════════════════════════ */}
      <div className="flex-1 min-w-0 space-y-2">

        {/* Armas */}
        <InventorySection
          title="Armas"
          count={weapons.length + customWeapons.length}
          icon={<Sword className="w-3.5 h-3.5" />}
          actions={
            <SectionActions
              onBuy={() => openPicker("buy", "armas")}
              onAdd={() => openPicker("add", "armas")}
              onDescribe={() => setCustomWeaponDialogOpen(true)}
              describeTitle="Descrever arma"
            />
          }
        >
          {weapons.length === 0 && customWeapons.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body italic py-1 px-1">
              Nenhuma arma no inventário.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {weapons.map((entry) => (
                <CatalogItemRow key={entry.id} entry={entry} onAdd={addOneMore} onRemove={removeOne} />
              ))}
              {customWeapons.map((item) => (
                <CustomWeaponRow
                  key={item.id}
                  item={item}
                  onAddOne={addCustomOne}
                  onRemoveOne={removeCustomOne}
                />
              ))}
            </ul>
          )}
        </InventorySection>

        {/* Proteções */}
        <InventorySection
          title="Armaduras, escudos e elmos"
          count={bodyArmors.length + shields.length + helmets.length}
          icon={<Shield className="w-3.5 h-3.5" />}
          actions={
            <SectionActions
              onBuy={() => openPicker("buy", "armaduras")}
              onAdd={() => openPicker("add", "armaduras")}
            />
          }
        >
          {bodyArmors.length === 0 && shields.length === 0 && helmets.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body italic py-1 px-1">
              Nenhuma proteção no inventário.
            </p>
          ) : (
            <div className="space-y-3">
              {bodyArmors.length > 0 && (
                <div>
                  <p className="text-[9px] font-display uppercase tracking-widest text-muted-foreground px-1 mb-1">Armaduras</p>
                  <ul className="space-y-1.5">
                    {bodyArmors.map((entry) => (
                      <CatalogItemRow key={entry.id} entry={entry} onAdd={addOneMore} onRemove={removeOne} />
                    ))}
                  </ul>
                </div>
              )}
              {shields.length > 0 && (
                <div>
                  <p className="text-[9px] font-display uppercase tracking-widest text-muted-foreground px-1 mb-1">Escudos</p>
                  <ul className="space-y-1.5">
                    {shields.map((entry) => (
                      <CatalogItemRow key={entry.id} entry={entry} onAdd={addOneMore} onRemove={removeOne} />
                    ))}
                  </ul>
                </div>
              )}
              {helmets.length > 0 && (
                <div>
                  <p className="text-[9px] font-display uppercase tracking-widest text-muted-foreground px-1 mb-1">Elmos</p>
                  <ul className="space-y-1.5">
                    {helmets.map((entry) => (
                      <CatalogItemRow key={entry.id} entry={entry} onAdd={addOneMore} onRemove={removeOne} />
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </InventorySection>

        {/* Outros */}
        <InventorySection
          title="Outros itens"
          count={others.length + customGear.length}
          icon={<Package className="w-3.5 h-3.5" />}
          actions={
            <SectionActions
              onBuy={() => openPicker("buy", "equipamento")}
              onAdd={() => openPicker("add", "equipamento")}
              onDescribe={() => setCustomDialogOpen(true)}
            />
          }
        >
          {others.length === 0 && customGear.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body italic py-1 px-1">
              Nenhum outro item no inventário.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {others.map((entry) => (
                <CatalogItemRow key={entry.id} entry={entry} onAdd={addOneMore} onRemove={removeOne} />
              ))}
              {customGear.map((item) => (
                <CustomItemRow key={item.id} item={item} onAddOne={addCustomOne} onRemoveOne={removeCustomOne} />
              ))}
            </ul>
          )}
        </InventorySection>
      </div>

      {/* ══ Coluna direita — Dinheiro + Carga (1/4) ═════════════════════ */}
      <div className="w-1/4 shrink-0 space-y-3">

        {/* Dinheiro */}
        <div className="rounded-xl border border-border bg-card/50 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-gold" />
              <span className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">Dinheiro</span>
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => openMoneyDialog("add")}
                className="w-5 h-5 flex items-center justify-center rounded border border-gold/30 bg-gold/10 hover:bg-gold/20 text-gold transition-colors"
                title="Adicionar dinheiro"
              >
                <Plus className="w-2.5 h-2.5" />
              </button>
              <button
                type="button"
                onClick={() => openMoneyDialog("remove")}
                disabled={remainingPc <= 0}
                className="w-5 h-5 flex items-center justify-center rounded border border-border hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
                title="Remover dinheiro"
              >
                <Minus className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          <div>
            <p className={`text-lg font-display font-bold leading-none ${remainingPc < 0 ? "text-destructive" : "text-gold"}`}>
              {formatMoney(remainingPc)}
            </p>
            {remainingPc >= 0 && (remainingBreakdown.po > 0 || remainingBreakdown.pp > 0 || remainingBreakdown.pc > 0) && (
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {remainingBreakdown.po > 0 && (
                  <span className="text-[9px] font-display px-1 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    {remainingBreakdown.po} po
                  </span>
                )}
                {remainingBreakdown.pp > 0 && (
                  <span className="text-[9px] font-display px-1 py-0.5 rounded bg-slate-400/10 text-slate-400 border border-slate-400/20">
                    {remainingBreakdown.pp} pp
                  </span>
                )}
                {remainingBreakdown.pc > 0 && (
                  <span className="text-[9px] font-display px-1 py-0.5 rounded bg-orange-700/10 text-orange-400 border border-orange-700/20">
                    {remainingBreakdown.pc} pc
                  </span>
                )}
              </div>
            )}
          </div>

          {totalBudgetPc > 0 && (
            <div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${spentPc > totalBudgetPc ? "bg-destructive" : "bg-gold/70"}`}
                  style={{ width: `${Math.min(100, (spentPc / totalBudgetPc) * 100)}%` }}
                />
              </div>
              <div className="text-[9px] text-muted-foreground mt-1 font-body space-y-0.5">
                <div className="flex justify-between">
                  <span>Capital</span>
                  <span>{formatMoney(startingPc)}</span>
                </div>
                {extraMoneyPc !== 0 && (
                  <div className="flex justify-between">
                    <span>Ajuste</span>
                    <span className={extraMoneyPc > 0 ? "text-gold-dark" : "text-destructive"}>
                      {extraMoneyPc > 0 ? "+" : "−"}{formatMoney(Math.abs(extraMoneyPc))}
                    </span>
                  </div>
                )}
                <div className={`flex justify-between ${spentPc > totalBudgetPc ? "text-destructive" : ""}`}>
                  <span>Gasto</span>
                  <span>{formatMoney(spentPc)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Carga */}
        <div className={`rounded-xl border p-3 space-y-2.5 ${overCarga ? "border-destructive/50 bg-destructive/5" : "border-border bg-card/50"}`}>
          <div className="flex items-center gap-1.5">
            <Scale className={`w-3.5 h-3.5 ${overCarga ? "text-destructive" : "text-gold"}`} />
            <span className="font-display text-[10px] tracking-wider uppercase text-muted-foreground">Carga</span>
          </div>

          <div>
            <p className={`text-lg font-display font-bold leading-none ${overCarga ? "text-destructive" : "text-foreground"}`}>
              {totalWeight.toFixed(1).replace(".", ",")} kg
            </p>
            {cargaKg > 0 && (
              <p className="text-[9px] text-muted-foreground mt-0.5 font-body">
                Máx: <span className="text-foreground font-semibold">{cargaBonus}</span>
              </p>
            )}
          </div>

          {cargaKg > 0 && (
            <div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${weightColor}`}
                  style={{ width: `${weightPct}%` }}
                />
              </div>
              <div className="text-[9px] text-muted-foreground mt-1 font-body space-y-0.5">
                <div className="flex justify-between">
                  <span>Usado</span>
                  <span>{weightPct.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Livre</span>
                  <span>{Math.max(0, cargaKg - totalWeight).toFixed(1).replace(".", ",")} kg</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modais ─────────────────────────────────────────────────── */}
      <ItemPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={pickerMode}
        mainTab={pickerMainTab}
        selectedSocialClass={selectedSocialClass}
        subAttributes={subAttributes}
        purchased={purchased}
        added={added}
        extraMoneyPc={extraMoneyPc}
        onSelectItem={pickerMode === "buy" ? buyItem : addItem}
      />

      {/* Modal dinheiro */}
      <Dialog
        open={moneyDialogOpen}
        onOpenChange={(open) => {
          setMoneyDialogOpen(open);
          if (!open) { setMoneyPo(""); setMoneyPp(""); setMoneyPc(""); }
        }}
      >
        <DialogContent className="max-w-sm bg-card border-2 border-gold-dark/40 shadow-2xl gap-0 p-0 overflow-hidden">
          {/* Header */}
          <div className={`px-5 pt-5 pb-3 border-b-2 border-border ${moneyDialogMode === "add" ? "bg-secondary" : "bg-red-100"}`}>
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-lg border-2 ${moneyDialogMode === "add" ? "border-gold-dark/50 bg-gold-dark/15 text-gold-dark" : "border-destructive/50 bg-red-200 text-destructive"}`}>
                  <Wallet className="w-4 h-4" />
                </span>
                <div>
                  <DialogTitle className={`font-display tracking-wide text-base ${moneyDialogMode === "add" ? "text-gold-dark" : "text-destructive"}`}>
                    {moneyDialogMode === "add" ? "Receber dinheiro" : "Gastar / remover dinheiro"}
                  </DialogTitle>
                  <DialogDescription className="font-body text-xs text-foreground/70 mt-0.5">
                    {moneyDialogMode === "add"
                      ? "Informe o valor recebido (loot, pagamento, etc.)."
                      : `Disponível: ${formatMoney(remainingPc)}. Informe o valor a retirar.`}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 space-y-4 bg-background">
            {/* Inputs PO / PP / PC */}
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { label: "PO", val: moneyPo, set: setMoneyPo, badge: "text-amber-900 border-amber-600 bg-amber-100", ring: "focus:ring-amber-600/40 focus:border-amber-600" },
                  { label: "PP", val: moneyPp, set: setMoneyPp, badge: "text-slate-800 border-slate-500 bg-slate-100", ring: "focus:ring-slate-500/40 focus:border-slate-500" },
                  { label: "PC", val: moneyPc, set: setMoneyPc, badge: "text-orange-900 border-orange-700 bg-orange-100", ring: "focus:ring-orange-700/40 focus:border-orange-700" },
                ] as const
              ).map(({ label, val, set, badge, ring }) => (
                <label key={label} className="space-y-1.5">
                  <span className={`inline-block text-[11px] font-display font-bold tracking-wider px-2 py-0.5 rounded border ${badge}`}>
                    {label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder="0"
                    className={`w-full px-2 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-display font-semibold text-center text-foreground focus:outline-none focus:ring-2 ${ring}`}
                  />
                </label>
              ))}
            </div>

            {/* Preview total */}
            {(() => {
              const previewPc =
                (parseInt(moneyPo || "0") || 0) * COPPER_PER_GOLD +
                (parseInt(moneyPp || "0") || 0) * COPPER_PER_SILVER +
                (parseInt(moneyPc || "0") || 0);
              if (previewPc <= 0) return null;
              const isRemove = moneyDialogMode === "remove";
              const after = isRemove ? remainingPc - previewPc : remainingPc + previewPc;
              return (
                <div className="rounded-lg border-2 border-border bg-secondary px-3 py-3 space-y-2">
                  <div className="flex justify-between items-center text-sm font-body text-foreground/80">
                    <span>{isRemove ? "Valor a retirar" : "Valor a receber"}</span>
                    <span className={`font-display font-bold ${isRemove ? "text-destructive" : "text-gold-dark"}`}>
                      {isRemove ? "−" : "+"}{formatMoney(previewPc)}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center text-sm font-body text-foreground/80">
                    <span>Saldo resultante</span>
                    <span className={`font-display font-bold ${after < 0 ? "text-destructive" : "text-foreground"}`}>
                      {formatMoney(Math.max(0, after))}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="px-5 pb-5 flex justify-end gap-2 bg-card border-t-2 border-border">
            <Button type="button" variant="outline" className="border-2" onClick={() => setMoneyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmMoneyAdjust}
              className={moneyDialogMode === "add"
                ? "bg-gold-dark hover:bg-gold-dark/90 text-primary-foreground border-0 font-semibold"
                : "bg-destructive hover:bg-destructive/90 text-white border-0 font-semibold"}
            >
              {moneyDialogMode === "add" ? "Receber" : "Retirar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal arma personalizada */}
      <Dialog
        open={customWeaponDialogOpen}
        onOpenChange={(open) => {
          setCustomWeaponDialogOpen(open);
          if (!open) {
            setCustomWeaponName("");
            setCustomWeaponType("");
            setCustomWeaponDamagePM("");
            setCustomWeaponDamageG("");
            setCustomWeaponWeight("");
            setCustomWeaponQty("1");
          }
        }}
      >
        <DialogContent className="max-w-sm bg-card border-2 border-gold-dark/40 shadow-2xl gap-0 p-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b-2 border-border bg-secondary">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg border-2 border-gold-dark/50 bg-gold-dark/15 text-gold-dark">
                  <Sword className="w-4 h-4" />
                </span>
                <div>
                  <DialogTitle className="font-display tracking-wide text-base text-gold-dark">
                    Descrever arma
                  </DialogTitle>
                  <DialogDescription className="font-body text-xs text-foreground/70 mt-0.5">
                    Arma mágica ou única fora do catálogo (ex.: Espada Longa +2).
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 space-y-3 bg-background">
            <label className="block space-y-1.5">
              <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Nome</span>
              <input
                type="text"
                value={customWeaponName}
                onChange={(e) => setCustomWeaponName(e.target.value)}
                placeholder="Ex: Espada Longa +2"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                autoFocus
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Tipo de dano</span>
              <select
                value={customWeaponType}
                onChange={(e) => setCustomWeaponType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
              >
                <option value="">— Selecionar —</option>
                {WEAPON_DAMAGE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Dano P/M</span>
                <input
                  type="text"
                  value={customWeaponDamagePM}
                  onChange={(e) => setCustomWeaponDamagePM(e.target.value)}
                  placeholder="1d8+2"
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Dano G</span>
                <input
                  type="text"
                  value={customWeaponDamageG}
                  onChange={(e) => setCustomWeaponDamageG(e.target.value)}
                  placeholder="1d12+2"
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Peso (kg)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customWeaponWeight}
                  onChange={(e) => setCustomWeaponWeight(e.target.value)}
                  placeholder="3"
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Quantidade</span>
                <input
                  type="number"
                  min={1}
                  value={customWeaponQty}
                  onChange={(e) => setCustomWeaponQty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                />
              </label>
            </div>

            {customWeaponName.trim() && (customWeaponDamagePM.trim() || customWeaponDamageG.trim()) && (
              <div className="rounded-lg border-2 border-gold-dark/30 bg-secondary px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-body font-medium text-foreground truncate">{customWeaponName.trim()}</p>
                  <p className="text-xs text-foreground/70 font-body">
                    {customWeaponType && (
                      <>
                        {formatWeaponDamageType(customWeaponType)}
                        {" · "}
                      </>
                    )}
                    {customWeaponDamagePM.trim() || customWeaponDamageG.trim()}
                    {(customWeaponDamageG.trim() && customWeaponDamagePM.trim() !== customWeaponDamageG.trim())
                      ? ` / ${customWeaponDamageG.trim()}`
                      : ""}
                    {(() => {
                      const w = parseFloat(customWeaponWeight.replace(",", "."));
                      if (isNaN(w) || w <= 0) return "";
                      return ` · ${w.toFixed(2).replace(".", ",")} kg`;
                    })()}
                  </p>
                </div>
                <Sword className="w-5 h-5 text-gold-dark shrink-0" />
              </div>
            )}
          </div>

          <div className="px-5 pb-5 flex justify-end gap-2 bg-card border-t-2 border-border">
            <Button type="button" variant="outline" className="border-2" onClick={() => setCustomWeaponDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmCustomWeapon}
              disabled={!customWeaponName.trim() || (!customWeaponDamagePM.trim() && !customWeaponDamageG.trim())}
              className="bg-gold-dark hover:bg-gold-dark/90 text-primary-foreground border-0 font-semibold disabled:opacity-40"
            >
              Adicionar arma
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal item personalizado */}
      <Dialog
        open={customDialogOpen}
        onOpenChange={(open) => {
          setCustomDialogOpen(open);
          if (!open) { setCustomName(""); setCustomWeight(""); setCustomQty("1"); }
        }}
      >
        <DialogContent className="max-w-sm bg-card border-2 border-gold-dark/40 shadow-2xl gap-0 p-0 overflow-hidden">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 border-b-2 border-border bg-secondary">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg border-2 border-gold-dark/50 bg-gold-dark/15 text-gold-dark">
                  <PenLine className="w-4 h-4" />
                </span>
                <div>
                  <DialogTitle className="font-display tracking-wide text-base text-gold-dark">
                    Descrever item
                  </DialogTitle>
                  <DialogDescription className="font-body text-xs text-foreground/70 mt-0.5">
                    Item fora do catálogo (ex.: Pingente, amuleto, carta).
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 space-y-3 bg-background">
            {/* Nome */}
            <label className="block space-y-1.5">
              <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Nome do item</span>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Pingente de prata, Mapa do tesouro…"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                onKeyDown={(e) => e.key === "Enter" && confirmCustomItem()}
                autoFocus
              />
            </label>

            {/* Peso + Quantidade */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Peso (kg)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-display font-semibold tracking-wider text-foreground/80 uppercase">Quantidade</span>
                <input
                  type="number"
                  min={1}
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-border bg-card text-sm font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                />
              </label>
            </div>

            {/* Preview */}
            {customName.trim() && (
              <div className="rounded-lg border-2 border-gold-dark/30 bg-secondary px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-body font-medium text-foreground truncate">{customName.trim()}</p>
                  <p className="text-xs text-foreground/70 font-body">
                    ×{parseInt(customQty) || 1}
                    {(() => {
                      const wStr = customWeight.replace(",", ".");
                      const w = parseFloat(wStr);
                      const qty = parseInt(customQty) || 1;
                      if (isNaN(w) || w <= 0) return null;
                      return ` · ${(w * qty).toFixed(2).replace(".", ",")} kg total`;
                    })()}
                  </p>
                </div>
                <Package className="w-5 h-5 text-gold-dark shrink-0" />
              </div>
            )}
          </div>

          <div className="px-5 pb-5 flex justify-end gap-2 bg-card border-t-2 border-border">
            <Button type="button" variant="outline" className="border-2" onClick={() => setCustomDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmCustomItem}
              disabled={!customName.trim()}
              className="bg-gold-dark hover:bg-gold-dark/90 text-primary-foreground border-0 font-semibold disabled:opacity-40"
            >
              Adicionar item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPanel;
