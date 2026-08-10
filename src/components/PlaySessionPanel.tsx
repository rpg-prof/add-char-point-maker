import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Heart,
  Minus,
  NotebookPen,
  Package,
  PackagePlus,
  Plus,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Wallet,
  Wind,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ItemPickerModal, {
  type ItemPickerMainTab,
  type ItemPickerMode,
} from "@/components/ItemPickerModal";
import NotesPanel from "@/components/NotesPanel";
import { formatMoney, getRemainingCopper } from "@/data/equipment";
import { COPPER_PER_GOLD, COPPER_PER_SILVER } from "@/data/currency";
import { socialClasses } from "@/data/characterData";
import type { CharacterSaveData } from "@/lib/characterSave";
import {
  computeHitPointsBreakdown,
  resolveCurrentHp,
  type CombatLoadout,
} from "@/lib/combatStats";
import { resolveResourceCurrent } from "@/lib/combatResources";
import { chiPointsForLevel } from "@/data/characterEvolution";
import {
  buildInventoryEntries,
  ensureInventoryOrderId,
  moveInventoryOrderItem,
  normalizeInventoryOrder,
  removeInventoryOrderId,
  reorderInventoryOrder,
} from "@/lib/inventory";

type PlayInventoryRow =
  | {
      kind: "catalog";
      id: string;
      name: string;
      qty: number;
      weightKg: number;
    }
  | {
      kind: "custom";
      id: string;
      name: string;
      qty: number;
      weightKg: number;
    };

type ModalId = "hp" | "mana" | "inventory" | "notes" | null;

type PendingDelete =
  | { kind: "catalog"; id: string; name: string }
  | { kind: "custom"; id: string; name: string }
  | null;

function formatWeightKg(weightKg: number, qty: number): string {
  const total = weightKg * qty;
  if (total <= 0) return "—";
  const rounded = Number.isInteger(total) ? String(total) : total.toFixed(2).replace(/\.?0+$/, "");
  return `${rounded} kg`;
}

interface PlaySessionPanelProps {
  char: CharacterSaveData;
  onChange: (char: CharacterSaveData) => void;
  /** Coluna estreita: PV/Magia/Dinheiro/botões empilhados. */
  compact?: boolean;
  /** Se definido, mostra botão do grimório/livro de orações ao lado do inventário. */
  grimoireLabel?: string | null;
  onOpenGrimoire?: () => void;
}

const actionBtnCls =
  "h-auto py-2.5 px-3 flex flex-col items-center gap-1 bg-card border border-border hover:border-gold-dark/50 hover:bg-secondary text-foreground font-body";

const actionBtnCompactCls =
  "h-auto py-2 px-2 flex flex-col items-center gap-0.5 bg-card border border-border hover:border-gold-dark/50 hover:bg-secondary text-foreground font-body w-full";

function ModalShell({
  icon,
  title,
  description,
  children,
  className,
  headerAction,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}) {
  return (
    <DialogContent className={className ?? "sm:max-w-md"}>
      <div className="px-5 pt-5 pb-3 border-b border-border bg-secondary/70 pr-12">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="p-2 rounded-lg border border-gold-dark/40 bg-gold/15 text-gold-dark shrink-0">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="font-display tracking-wide text-field text-gold-dark">
                  {title}
                </DialogTitle>
                {headerAction}
              </div>
              <DialogDescription className="font-body text-meta text-foreground/65 mt-1">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
      </div>
      <div className="px-5 py-4 space-y-3 bg-background">{children}</div>
    </DialogContent>
  );
}

function hpBarColor(ratio: number): string {
  if (ratio >= 0.67) return "bg-emerald-600";
  if (ratio >= 0.34) return "bg-amber-500";
  return "bg-blood";
}

function AdjustRow({
  label,
  value,
  max,
  onAdjust,
  onSet,
  accent = "gold",
}: {
  label: string;
  value: number;
  max: number;
  onAdjust: (delta: number) => void;
  onSet: (value: number) => void;
  accent?: "gold" | "blood";
}) {
  const accentCls = accent === "blood" ? "text-blood" : "text-gold-dark";
  const overMax = value > max;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3 space-y-2 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-micro tracking-wider uppercase text-muted-foreground">
          {label}
        </span>
        <span className={`font-display text-stat font-bold tabular-nums ${accentCls}`}>
          {value}
          <span className="text-muted-foreground text-field font-normal"> / {max}</span>
          {overMax && (
            <span className="ml-1 text-micro font-body font-normal text-emerald-700">
              acima do máx.
            </span>
          )}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 border-border bg-card hover:bg-secondary"
          onClick={() => onAdjust(-1)}
          disabled={value <= 0}
        >
          <Minus className="w-4 h-4" />
        </Button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onSet(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="w-16 h-9 text-center bg-card border-2 border-border rounded-lg font-display text-field font-bold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold-dark"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 border-border bg-card hover:bg-secondary"
          onClick={() => onAdjust(1)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

const PlaySessionPanel = ({
  char,
  onChange,
  compact = false,
  grimoireLabel = null,
  onOpenGrimoire,
}: PlaySessionPanelProps) => {
  const [modal, setModal] = useState<ModalId>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<ItemPickerMode>("add");
  const [pickerTab, setPickerTab] = useState<ItemPickerMainTab>("equipamento");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [moneyDialogOpen, setMoneyDialogOpen] = useState(false);
  const [moneyDialogMode, setMoneyDialogMode] = useState<"add" | "remove">("add");
  const [moneyPo, setMoneyPo] = useState("");
  const [moneyPp, setMoneyPp] = useState("");
  const [moneyPc, setMoneyPc] = useState("");

  const loadout = char.combatLoadout;
  const evo = char.evolutionProgress;
  const hasMagic =
    Object.keys(char.divineAccess).length > 0 ||
    Object.keys(char.arcaneAccess).length > 0 ||
    Object.keys(evo?.evolutionDivineAccess ?? {}).length > 0 ||
    Object.keys(evo?.evolutionArcaneAccess ?? {}).length > 0 ||
    char.arcaneSpecialist !== null;

  const maxHp = useMemo(() => {
    const base = computeHitPointsBreakdown({
      subAttributes: char.subAttributes,
      constMain: char.attributes.Constituição,
      selectedClass: char.selectedClass,
    }).total;
    const evoHp = Object.values(char.evolutionProgress?.hpByLevel ?? {}).reduce(
      (sum, n) => sum + n,
      0,
    );
    return base + evoHp;
  }, [char]);

  const currentHp = resolveCurrentHp(loadout.currentHp, maxHp);

  const maxMana =
    (loadout.maxMana ?? 0) +
    (evo?.arcaneManaPurchased ?? 0) +
    (evo?.divineManaPurchased ?? 0);
  const currentMana = resolveResourceCurrent(loadout.currentMana, maxMana);

  const maxSpecialistMana =
    (loadout.maxSpecialistMana ?? 0) + (evo?.specialistManaPurchased ?? 0);
  const currentSpecialistMana = resolveResourceCurrent(
    loadout.currentSpecialistMana,
    maxSpecialistMana,
  );

  const evoChiMax = evo && evo.chiLevel > 1 ? chiPointsForLevel(evo.chiLevel) : 0;
  const maxChi = Math.max(loadout.maxChi ?? 0, evoChiMax);
  const currentChi = resolveResourceCurrent(loadout.currentChi, maxChi);
  const showChi = loadout.showChi || maxChi > 0;

  const inventoryOrder = useMemo(
    () =>
      normalizeInventoryOrder(
        char.inventoryOrder,
        char.purchasedItems,
        char.addedItems,
        char.customItems,
      ),
    [char.inventoryOrder, char.purchasedItems, char.addedItems, char.customItems],
  );

  const inventoryRows = useMemo((): PlayInventoryRow[] => {
    const catalog = buildInventoryEntries(
      char.purchasedItems,
      char.addedItems,
      inventoryOrder,
    );
    const byId = new Map<string, PlayInventoryRow>();
    for (const entry of catalog) {
      byId.set(entry.id, {
        kind: "catalog",
        id: entry.id,
        name: entry.item.name,
        qty: entry.qty,
        weightKg: entry.item.weightKg,
      });
    }
    for (const item of char.customItems) {
      if (item.qty <= 0) continue;
      byId.set(item.id, {
        kind: "custom",
        id: item.id,
        name: item.name,
        qty: item.qty,
        weightKg: item.weightKg,
      });
    }
    return inventoryOrder
      .map((id) => byId.get(id))
      .filter((row): row is PlayInventoryRow => row != null);
  }, [char.purchasedItems, char.addedItems, char.customItems, inventoryOrder]);

  const syncOrder = (order: string[]) =>
    normalizeInventoryOrder(
      order,
      char.purchasedItems,
      char.addedItems,
      char.customItems,
    );

  const remainingPc = getRemainingCopper(
    char.selectedSocialClass,
    socialClasses,
    char.purchasedItems,
    char.extraMoneyPc,
  );

  const openMoneyDialog = (mode: "add" | "remove") => {
    setMoneyDialogMode(mode);
    setMoneyPo("");
    setMoneyPp("");
    setMoneyPc("");
    setMoneyDialogOpen(true);
  };

  const confirmMoneyAdjust = () => {
    const po = parseInt(moneyPo, 10) || 0;
    const pp = parseInt(moneyPp, 10) || 0;
    const pc = parseInt(moneyPc, 10) || 0;
    const total = po * COPPER_PER_GOLD + pp * COPPER_PER_SILVER + pc;
    if (total <= 0) {
      setMoneyDialogOpen(false);
      return;
    }
    if (moneyDialogMode === "add") {
      onChange({ ...char, extraMoneyPc: char.extraMoneyPc + total });
    } else {
      const maxRemoval = Math.max(0, remainingPc);
      onChange({
        ...char,
        extraMoneyPc: char.extraMoneyPc - Math.min(total, maxRemoval),
      });
    }
    setMoneyPo("");
    setMoneyPp("");
    setMoneyPc("");
    setMoneyDialogOpen(false);
  };

  const updateLoadout = (patch: Partial<CombatLoadout>) => {
    onChange({
      ...char,
      combatLoadout: { ...char.combatLoadout, ...patch },
    });
  };

  const adjustHp = (delta: number) => {
    updateLoadout({ currentHp: Math.max(0, currentHp + delta) });
  };

  const setHp = (value: number) => {
    updateLoadout({ currentHp: Math.max(0, Math.floor(value)) });
  };

  const adjustMana = (delta: number) => {
    updateLoadout({ currentMana: Math.max(0, currentMana + delta) });
  };

  const setMana = (value: number) => {
    updateLoadout({ currentMana: Math.max(0, Math.floor(value)) });
  };

  const adjustSpecialistMana = (delta: number) => {
    updateLoadout({ currentSpecialistMana: Math.max(0, currentSpecialistMana + delta) });
  };

  const setSpecialistMana = (value: number) => {
    updateLoadout({
      currentSpecialistMana: Math.max(0, Math.floor(value)),
    });
  };

  const adjustChi = (delta: number) => {
    updateLoadout({ currentChi: Math.max(0, currentChi + delta) });
  };

  const setChi = (value: number) => {
    updateLoadout({ currentChi: Math.max(0, Math.floor(value)) });
  };

  const setCatalogQuantity = (id: string, nextQty: number) => {
    const qty = Math.max(0, Math.floor(nextQty));
    const purchased = { ...char.purchasedItems };
    const added = { ...char.addedItems };
    const bought = purchased[id] ?? 0;

    if (qty <= 0) {
      delete purchased[id];
      delete added[id];
    } else if (bought > 0) {
      if (qty >= bought) {
        purchased[id] = bought;
        const extra = qty - bought;
        if (extra > 0) added[id] = extra;
        else delete added[id];
      } else {
        purchased[id] = qty;
        delete added[id];
      }
    } else {
      delete purchased[id];
      added[id] = qty;
    }

    const nextOrder =
      qty <= 0
        ? removeInventoryOrderId(inventoryOrder, id)
        : ensureInventoryOrderId(inventoryOrder, id);

    onChange({
      ...char,
      purchasedItems: purchased,
      addedItems: added,
      inventoryOrder: normalizeInventoryOrder(
        nextOrder,
        purchased,
        added,
        char.customItems,
      ),
    });
  };

  const setCustomQuantity = (id: string, nextQty: number) => {
    const qty = Math.max(0, Math.floor(nextQty));
    const customItems =
      qty <= 0
        ? char.customItems.filter((c) => c.id !== id)
        : char.customItems.map((c) => (c.id === id ? { ...c, qty } : c));
    const nextOrder =
      qty <= 0
        ? removeInventoryOrderId(inventoryOrder, id)
        : ensureInventoryOrderId(inventoryOrder, id);

    onChange({
      ...char,
      customItems,
      inventoryOrder: normalizeInventoryOrder(
        nextOrder,
        char.purchasedItems,
        char.addedItems,
        customItems,
      ),
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "catalog") {
      setCatalogQuantity(pendingDelete.id, 0);
    } else {
      setCustomQuantity(pendingDelete.id, 0);
    }
    setPendingDelete(null);
  };

  const moveRow = (id: string, direction: -1 | 1) => {
    onChange({
      ...char,
      inventoryOrder: syncOrder(moveInventoryOrderItem(inventoryOrder, id, direction)),
    });
  };

  const handleDropOnRow = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    onChange({
      ...char,
      inventoryOrder: syncOrder(reorderInventoryOrder(inventoryOrder, dragId, targetId)),
    });
    setDragId(null);
  };

  const openAcquire = (mode: ItemPickerMode, tab: ItemPickerMainTab = "equipamento") => {
    setPickerMode(mode);
    setPickerTab(tab);
    setPickerOpen(true);
  };

  const handlePickItem = (itemId: string) => {
    const nextOrder = ensureInventoryOrderId(inventoryOrder, itemId);
    if (pickerMode === "buy") {
      const purchasedItems = {
        ...char.purchasedItems,
        [itemId]: (char.purchasedItems[itemId] ?? 0) + 1,
      };
      onChange({
        ...char,
        purchasedItems,
        inventoryOrder: normalizeInventoryOrder(
          nextOrder,
          purchasedItems,
          char.addedItems,
          char.customItems,
        ),
      });
    } else {
      const addedItems = {
        ...char.addedItems,
        [itemId]: (char.addedItems[itemId] ?? 0) + 1,
      };
      onChange({
        ...char,
        addedItems,
        inventoryOrder: normalizeInventoryOrder(
          nextOrder,
          char.purchasedItems,
          addedItems,
          char.customItems,
        ),
      });
    }
  };

  const hpRatio = maxHp > 0 ? currentHp / maxHp : 0;
  const hpPct = Math.min(100, Math.max(0, hpRatio * 100));
  const hpFillCls = hpBarColor(hpRatio);
  const showSpecialist = Boolean(char.arcaneSpecialist && maxSpecialistMana > 0);
  const showResources = hasMagic || showSpecialist || showChi;

  const resourceRows: { key: string; label: string; current: number; max: number }[] = [];
  if (hasMagic) {
    resourceRows.push({
      key: "mana",
      label: compact ? "Magia" : "Pontos de Magia",
      current: currentMana,
      max: maxMana,
    });
  }
  if (showSpecialist && char.arcaneSpecialist) {
    resourceRows.push({
      key: "specialist",
      label: compact ? char.arcaneSpecialist : `Escola: ${char.arcaneSpecialist}`,
      current: currentSpecialistMana,
      max: maxSpecialistMana,
    });
  }
  if (showChi) {
    resourceRows.push({
      key: "chi",
      label: "Chi",
      current: currentChi,
      max: maxChi,
    });
  }

  const hpCard = (
    <button
      type="button"
      onClick={() => setModal("hp")}
      className={`rounded-lg border border-border/70 bg-card/40 text-left hover:border-gold/40 transition-colors w-full ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-display text-micro tracking-wider uppercase text-muted-foreground flex items-center gap-1">
          <Heart className="w-3.5 h-3.5 text-blood shrink-0" />
          {compact ? "PV" : "Pontos de Vida"}
        </span>
        <span className="font-display text-field font-bold tabular-nums text-foreground">
          {currentHp}/{maxHp}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${hpFillCls}`}
          style={{ width: `${hpPct}%` }}
        />
      </div>
    </button>
  );

  const resourcesCard = showResources ? (
    <button
      type="button"
      onClick={() => setModal("mana")}
      className={`rounded-lg border border-border/70 bg-card/40 text-left hover:border-gold/40 transition-colors w-full ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}
    >
      <div className="flex items-center gap-1 mb-1.5">
        <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
        <span className="font-display text-micro tracking-wider uppercase text-muted-foreground">
          Recursos
        </span>
      </div>
      <div className="space-y-1">
        {resourceRows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-2 leading-tight">
            <span
              className="text-meta font-body text-foreground/80 truncate min-w-0"
              title={row.label}
            >
              {row.label}
            </span>
            <span className="font-display text-meta font-bold tabular-nums text-gold-dark shrink-0">
              {row.current}/{row.max}
            </span>
          </div>
        ))}
      </div>
    </button>
  ) : null;

  const moneyCard = (
    <div
      className={`rounded-lg border border-gold/30 bg-gold/5 w-full ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-display text-micro tracking-wider uppercase text-muted-foreground flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5 text-gold shrink-0" />
          Dinheiro
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => openMoneyDialog("add")}
            className="h-6 w-6 inline-flex items-center justify-center rounded border border-gold/40 bg-gold/15 text-gold-dark hover:bg-gold/25"
            title="Achar dinheiro"
            aria-label="Achar dinheiro"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => openMoneyDialog("remove")}
            disabled={remainingPc <= 0}
            className="h-6 w-6 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted disabled:opacity-30"
            title="Gastar dinheiro"
            aria-label="Gastar dinheiro"
          >
            <Minus className="w-3 h-3" />
          </button>
        </div>
      </div>
      <p
        className={`font-display text-field font-bold tabular-nums ${
          remainingPc < 0 ? "text-destructive" : "text-gold-dark"
        }`}
      >
        {formatMoney(remainingPc)}
      </p>
    </div>
  );

  return (
    <div
      className={
        compact
          ? "flex flex-col gap-2 h-full min-h-0"
          : "space-y-3"
      }
    >
      {compact ? (
        <>
          <div className="flex flex-col gap-2">
            {hpCard}
            {resourcesCard}
          </div>
          {moneyCard}
          <div className={`grid gap-1.5 mt-auto ${grimoireLabel ? "grid-cols-2" : "grid-cols-1"}`}>
            <Button
              type="button"
              variant="outline"
              className={actionBtnCompactCls}
              onClick={() => setModal("inventory")}
            >
              <Package className="w-3.5 h-3.5 text-gold" />
              <span className="text-meta leading-tight">Inventário</span>
            </Button>
            {grimoireLabel && onOpenGrimoire && (
              <Button
                type="button"
                variant="outline"
                className={actionBtnCompactCls}
                onClick={onOpenGrimoire}
                title={grimoireLabel}
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                <span className="text-meta leading-tight truncate max-w-full px-0.5">
                  {grimoireLabel === "Livro de Orações" ? "Orações" : grimoireLabel.includes("/") ? "Magias" : "Grimório"}
                </span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className={`${actionBtnCompactCls}${grimoireLabel ? " col-span-2" : ""}`}
              onClick={() => setModal("notes")}
            >
              <NotebookPen className="w-3.5 h-3.5 text-gold" />
              <span className="text-meta leading-tight">Anotações</span>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 gap-2 ${
              showResources ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            {hpCard}
            {resourcesCard}
            {moneyCard}
          </div>
          <div
            className={`grid gap-2 ${
              grimoireLabel ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            <Button
              type="button"
              variant="outline"
              className={actionBtnCls}
              onClick={() => setModal("inventory")}
            >
              <Package className="w-4 h-4 text-gold" />
              <span className="text-meta leading-tight">Inventário</span>
            </Button>
            {grimoireLabel && onOpenGrimoire && (
              <Button
                type="button"
                variant="outline"
                className={actionBtnCls}
                onClick={onOpenGrimoire}
                title={grimoireLabel}
              >
                <BookOpen className="w-4 h-4 text-gold" />
                <span className="text-meta leading-tight">
                  {grimoireLabel === "Livro de Orações"
                    ? "Orações"
                    : grimoireLabel.includes("/")
                      ? "Magias"
                      : "Grimório"}
                </span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className={actionBtnCls}
              onClick={() => setModal("notes")}
            >
              <NotebookPen className="w-4 h-4 text-gold" />
              <span className="text-meta leading-tight">Anotações</span>
            </Button>
          </div>
        </>
      )}

      {/* Modal PV */}
      <Dialog open={modal === "hp"} onOpenChange={(open) => !open && setModal(null)}>
        <ModalShell
          icon={<Heart className="w-4 h-4" />}
          title="Pontos de Vida"
          description="Registre dano sofrido ou cura recebida durante a sessão."
        >
          <AdjustRow
            label="PV atuais"
            value={currentHp}
            max={maxHp}
            onAdjust={adjustHp}
            onSet={setHp}
            accent="blood"
          />
        </ModalShell>
      </Dialog>

      {/* Modal Magia */}
      <Dialog open={modal === "mana"} onOpenChange={(open) => !open && setModal(null)}>
        <ModalShell
          icon={<Sparkles className="w-4 h-4" />}
          title="Recursos Mágicos"
          description="Gaste ou recupere pontos de magia (e Chi, se houver)."
        >
          {hasMagic && (
            <AdjustRow
              label="Pontos de Magia"
              value={currentMana}
              max={maxMana}
              onAdjust={adjustMana}
              onSet={setMana}
            />
          )}
          {char.arcaneSpecialist && maxSpecialistMana > 0 && (
            <AdjustRow
              label={`Escola: ${char.arcaneSpecialist}`}
              value={currentSpecialistMana}
              max={maxSpecialistMana}
              onAdjust={adjustSpecialistMana}
              onSet={setSpecialistMana}
            />
          )}
          {showChi && (
            <AdjustRow
              label="Chi"
              value={currentChi}
              max={maxChi}
              onAdjust={adjustChi}
              onSet={setChi}
            />
          )}
          {!hasMagic && !showChi && (
            <p className="text-field text-muted-foreground font-body">
              Este personagem não possui pontos de magia ou Chi.
            </p>
          )}
        </ModalShell>
      </Dialog>

      {/* Modal Inventário */}
      <Dialog open={modal === "inventory"} onOpenChange={(open) => !open && setModal(null)}>
        <ModalShell
          icon={<Package className="w-4 h-4" />}
          title="Inventário"
          description="Descrição · Quantidade · Peso"
          className="sm:max-w-3xl max-h-[85vh]"
          headerAction={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-gold text-parchment-dark hover:bg-gold-glow shadow-[var(--shadow-gold)]"
                  title="Adicionar item"
                  aria-label="Adicionar item"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-display text-micro tracking-wider uppercase text-muted-foreground">
                  Adicionar item
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="font-body cursor-pointer"
                  onSelect={() => openAcquire("add")}
                >
                  <PackagePlus className="w-4 h-4 mr-2 text-gold-dark" />
                  Ganhar item
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="font-body cursor-pointer"
                  onSelect={() => openAcquire("buy")}
                >
                  <ShoppingBag className="w-4 h-4 mr-2 text-gold-dark" />
                  Comprar item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        >
          <div className="overflow-y-auto max-h-[55vh] -mx-1 px-1">
            {inventoryRows.length === 0 ? (
              <p className="text-field text-muted-foreground font-body py-6 text-center">
                Nenhum item no inventário. Use o + para ganhar ou comprar.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="hidden sm:grid grid-cols-[1.75rem_minmax(0,1fr)_7.5rem_4.5rem_4.25rem_2rem] gap-2 px-2.5 text-micro font-display tracking-wider uppercase text-muted-foreground">
                  <span />
                  <span>Descrição</span>
                  <span className="text-center">Quantidade</span>
                  <span className="text-right">Peso</span>
                  <span className="text-center">Ordem</span>
                  <span />
                </div>

                {inventoryRows.map((row, index) => (
                  <div
                    key={row.id}
                    draggable
                    onDragStart={() => setDragId(row.id)}
                    onDragEnd={() => setDragId(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnRow(row.id)}
                    className={`grid grid-cols-1 sm:grid-cols-[1.75rem_minmax(0,1fr)_7.5rem_4.5rem_4.25rem_2rem] gap-2 items-center rounded-lg border bg-card px-2.5 py-2 shadow-sm transition-colors ${
                      dragId === row.id
                        ? "border-gold-dark/60 bg-secondary/80 opacity-80"
                        : "border-border"
                    }`}
                  >
                    <button
                      type="button"
                      className="hidden sm:flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground cursor-grab active:cursor-grabbing hover:bg-secondary"
                      title="Arrastar para reordenar"
                      aria-label={`Mover ${row.name}`}
                      onMouseDown={() => setDragId(row.id)}
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>

                    <div className="min-w-0">
                      <div className="font-body text-field text-foreground truncate">
                        {row.name}
                      </div>
                      <div className="text-micro text-muted-foreground mt-0.5">
                        {row.kind === "custom" ? "Customizado · " : ""}
                        <span className="sm:hidden">
                          Peso: {formatWeightKg(row.weightKg, row.qty)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 shrink-0 bg-card"
                        onClick={() =>
                          row.kind === "catalog"
                            ? setCatalogQuantity(row.id, row.qty - 1)
                            : setCustomQuantity(row.id, row.qty - 1)
                        }
                        disabled={row.qty <= 1}
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <input
                        type="number"
                        min={1}
                        value={row.qty}
                        onChange={(e) => {
                          const next = Math.max(1, Math.floor(Number(e.target.value) || 1));
                          if (row.kind === "catalog") setCatalogQuantity(row.id, next);
                          else setCustomQuantity(row.id, next);
                        }}
                        className="w-12 h-7 text-center bg-background border border-border rounded font-display text-meta font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-gold/30"
                        aria-label={`Quantidade de ${row.name}`}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 shrink-0 bg-card"
                        onClick={() =>
                          row.kind === "catalog"
                            ? setCatalogQuantity(row.id, row.qty + 1)
                            : setCustomQuantity(row.id, row.qty + 1)
                        }
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="hidden sm:block text-right font-body text-meta tabular-nums text-muted-foreground">
                      {formatWeightKg(row.weightKg, row.qty)}
                    </div>

                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 bg-card"
                        onClick={() => moveRow(row.id, -1)}
                        disabled={index === 0}
                        aria-label="Mover para cima"
                        title="Subir"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 bg-card"
                        onClick={() => moveRow(row.id, 1)}
                        disabled={index === inventoryRows.length - 1}
                        aria-label="Mover para baixo"
                        title="Descer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 shrink-0 justify-self-end text-blood border-blood/35 bg-card hover:bg-blood/10"
                      onClick={() =>
                        setPendingDelete({
                          kind: row.kind,
                          id: row.id,
                          name: row.name,
                        })
                      }
                      aria-label={`Excluir ${row.name}`}
                      title="Excluir item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalShell>
      </Dialog>

      <AlertDialog
        open={pendingDelete != null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-gold-dark tracking-wide">
              Excluir item?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              Remover{" "}
              <span className="font-semibold text-foreground">
                {pendingDelete?.name ?? "este item"}
              </span>{" "}
              do inventário? Esta ação não pode ser desfeita aqui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-blood text-destructive-foreground hover:bg-blood/90 font-body"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Anotações */}
      <Dialog open={modal === "notes"} onOpenChange={(open) => !open && setModal(null)}>
        <ModalShell
          icon={<NotebookPen className="w-4 h-4" />}
          title="Anotações"
          description="Registre o que aconteceu na sessão, loot e lembretes."
          className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          <NotesPanel
            notesItems={char.notesItems}
            notesGeneral={char.notesGeneral}
            onNotesItemsChange={(value) => onChange({ ...char, notesItems: value })}
            onNotesGeneralChange={(value) => onChange({ ...char, notesGeneral: value })}
          />
        </ModalShell>
      </Dialog>

      <ItemPickerModal
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        mode={pickerMode}
        mainTab={pickerTab}
        onMainTabChange={setPickerTab}
        selectedSocialClass={char.selectedSocialClass}
        subAttributes={char.subAttributes}
        purchased={char.purchasedItems}
        added={char.addedItems}
        extraMoneyPc={char.extraMoneyPc}
        onSelectItem={handlePickItem}
      />

      <Dialog
        open={moneyDialogOpen}
        onOpenChange={(open) => {
          setMoneyDialogOpen(open);
          if (!open) {
            setMoneyPo("");
            setMoneyPp("");
            setMoneyPc("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <div
            className={`px-5 pt-5 pb-3 border-b-2 border-border ${
              moneyDialogMode === "add" ? "bg-secondary" : "bg-red-100"
            }`}
          >
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <span
                  className={`p-2 rounded-lg border-2 ${
                    moneyDialogMode === "add"
                      ? "border-gold-dark/50 bg-gold-dark/15 text-gold-dark"
                      : "border-destructive/50 bg-red-200 text-destructive"
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                </span>
                <div>
                  <DialogTitle
                    className={`font-display tracking-wide text-field ${
                      moneyDialogMode === "add" ? "text-gold-dark" : "text-destructive"
                    }`}
                  >
                    {moneyDialogMode === "add" ? "Achar dinheiro" : "Gastar dinheiro"}
                  </DialogTitle>
                  <DialogDescription className="font-body text-meta text-foreground/70 mt-0.5">
                    {moneyDialogMode === "add"
                      ? "Informe o valor encontrado (loot, pagamento, etc.)."
                      : `Disponível: ${formatMoney(remainingPc)}. Informe o valor gasto.`}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-5 py-4 space-y-4 bg-background">
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  {
                    label: "PO",
                    val: moneyPo,
                    set: setMoneyPo,
                    badge: "text-amber-900 border-amber-600 bg-amber-100",
                    ring: "focus:ring-amber-600/40 focus:border-amber-600",
                  },
                  {
                    label: "PP",
                    val: moneyPp,
                    set: setMoneyPp,
                    badge: "text-slate-800 border-slate-500 bg-slate-100",
                    ring: "focus:ring-slate-500/40 focus:border-slate-500",
                  },
                  {
                    label: "PC",
                    val: moneyPc,
                    set: setMoneyPc,
                    badge: "text-orange-900 border-orange-700 bg-orange-100",
                    ring: "focus:ring-orange-700/40 focus:border-orange-700",
                  },
                ] as const
              ).map(({ label, val, set, badge, ring }) => (
                <label key={label} className="space-y-1.5">
                  <span
                    className={`inline-block text-micro font-display font-bold tracking-wider px-2 py-0.5 rounded border ${badge}`}
                  >
                    {label}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder="0"
                    className={`w-full px-2 py-2.5 rounded-lg border-2 border-border bg-card text-field font-display font-semibold text-center text-foreground focus:outline-none focus:ring-2 ${ring}`}
                  />
                </label>
              ))}
            </div>

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
                  <div className="flex justify-between items-center text-field font-body text-foreground/80">
                    <span>{isRemove ? "Valor a gastar" : "Valor a receber"}</span>
                    <span
                      className={`font-display font-bold ${
                        isRemove ? "text-destructive" : "text-gold-dark"
                      }`}
                    >
                      {isRemove ? "−" : "+"}
                      {formatMoney(previewPc)}
                    </span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center text-field font-body text-foreground/80">
                    <span>Saldo resultante</span>
                    <span
                      className={`font-display font-bold ${
                        after < 0 ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {formatMoney(Math.max(0, after))}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="px-5 pb-5 flex justify-end gap-2 bg-card border-t-2 border-border">
            <Button
              type="button"
              variant="outline"
              className="border-2"
              onClick={() => setMoneyDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmMoneyAdjust}
              className={
                moneyDialogMode === "add"
                  ? "bg-gold-dark hover:bg-gold-dark/90 text-primary-foreground border-0 font-semibold"
                  : "bg-destructive hover:bg-destructive/90 text-white border-0 font-semibold"
              }
            >
              {moneyDialogMode === "add" ? "Receber" : "Gastar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaySessionPanel;
