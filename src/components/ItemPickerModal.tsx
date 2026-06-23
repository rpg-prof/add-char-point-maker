import { useEffect, useMemo, useRef, useState } from "react";
import {
  Beef,
  Check,
  Crosshair,
  Layers,
  Package,
  Plus,
  Search,
  Shield,
  ShoppingCart,
  Shirt,
  Swords,
  Truck,
  Waves,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdvantageDescription from "@/components/AdvantageDescription";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  equipmentItems,
  formatMoney,
  formatArmorClass,
  canAffordItem,
  wouldExceedCarga,
  type PurchasedItems,
} from "@/data/equipment";
import {
  WEAPON_SUB_TABS,
  EQUIPMENT_SUB_TABS,
  itemMatchesShopView,
  type EquipmentSubTabId,
  type WeaponGroupId,
} from "@/data/equipmentTabs";
import { socialClasses } from "@/data/characterData";
import { parseCargaKg } from "@/data/currency";
import { getSubAttributeBonuses } from "@/data/subAttributes";

export type ItemPickerMode = "buy" | "add";
export type ItemPickerMainTab = "armas" | "armaduras" | "equipamento";

interface ItemPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ItemPickerMode;
  mainTab: ItemPickerMainTab;
  selectedSocialClass: string;
  subAttributes: Record<string, number>;
  purchased: PurchasedItems;
  added: PurchasedItems;
  extraMoneyPc: number;
  onSelectItem: (itemId: string) => void;
}

// ─── Ícones por grupo de arma ───────────────────────────────────────────────

const WEAPON_GROUP_ICONS: Record<WeaponGroupId, React.ReactNode> = {
  todas: <Layers className="w-3.5 h-3.5" />,
  arco: <Crosshair className="w-3.5 h-3.5" />,
  haste: <Zap className="w-3.5 h-3.5" />,
  besta: <Crosshair className="w-3.5 h-3.5" />,
  espada: <Swords className="w-3.5 h-3.5" />,
  lanca: <Zap className="w-3.5 h-3.5" />,
  outras: <Package className="w-3.5 h-3.5" />,
};

const EQUIPMENT_TAB_ICONS: Record<EquipmentSubTabId, React.ReactNode> = {
  todas: <Layers className="w-3.5 h-3.5" />,
  equipamento: <Package className="w-3.5 h-3.5" />,
  alimentacao: <Beef className="w-3.5 h-3.5" />,
  vestuario: <Shirt className="w-3.5 h-3.5" />,
  transporte: <Truck className="w-3.5 h-3.5" />,
  animais: <Waves className="w-3.5 h-3.5" />,
  montaria: <Shield className="w-3.5 h-3.5" />,
};

// ─── Mapa de texto de dano ──────────────────────────────────────────────────

const DAMAGE_TYPE: Record<string, string> = {
  p: "Perf.",
  c: "Cort.",
  e: "Esm.",
  "p/c": "P/C",
  "c/p": "C/P",
  "c/e": "C/E",
  "p/e": "P/E",
};

// ─── Componente principal ───────────────────────────────────────────────────

const ItemPickerModal = ({
  open,
  onOpenChange,
  mode,
  mainTab,
  selectedSocialClass,
  subAttributes,
  purchased,
  added,
  extraMoneyPc,
  onSelectItem,
}: ItemPickerModalProps) => {
  const [weaponSubTab, setWeaponSubTab] = useState<WeaponGroupId>("todas");
  const [equipmentSubTab, setEquipmentSubTab] = useState<EquipmentSubTabId>("todas");
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setWeaponSubTab("todas");
    setEquipmentSubTab("todas");
    setSearch("");
    setTimeout(() => searchRef.current?.focus(), 80);
  }, [open, mainTab]);

  const resistenciaValue = subAttributes["Resistência"] ?? 10;
  const cargaBonus =
    getSubAttributeBonuses("Resistência", resistenciaValue)["Carga Permitida"] ?? "—";
  const cargaKg = parseCargaKg(cargaBonus);

  // Contadores por categoria (para badges na sidebar)
  const weaponCounts = useMemo<Record<WeaponGroupId, number>>(() => {
    const counts = {} as Record<WeaponGroupId, number>;
    for (const sub of WEAPON_SUB_TABS) {
      counts[sub.id] = equipmentItems.filter((it) =>
        itemMatchesShopView(it, "armas", sub.id, "todas"),
      ).length;
    }
    return counts;
  }, []);

  const equipmentCounts = useMemo<Record<EquipmentSubTabId, number>>(() => {
    const counts = {} as Record<EquipmentSubTabId, number>;
    for (const sub of EQUIPMENT_SUB_TABS) {
      counts[sub.id] = equipmentItems.filter((it) =>
        itemMatchesShopView(it, "equipamento", "todas", sub.id),
      ).length;
    }
    return counts;
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = equipmentItems.filter((item) =>
      itemMatchesShopView(item, mainTab, weaponSubTab, equipmentSubTab),
    );
    if (!q) return base;
    return base.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.section ?? "").toLowerCase().includes(q) ||
        (item.weaponGroup ?? "").toLowerCase().includes(q),
    );
  }, [mainTab, weaponSubTab, equipmentSubTab, search]);

  const handleSelect = (itemId: string) => {
    if (mode === "buy") {
      if (!canAffordItem(selectedSocialClass, socialClasses, purchased, itemId, 1, extraMoneyPc))
        return;
      if (wouldExceedCarga(purchased, itemId, cargaKg, 1, added)) return;
    } else if (wouldExceedCarga(purchased, itemId, cargaKg, 1, added)) {
      return;
    }
    onSelectItem(itemId);
  };

  const renderItem = (item: (typeof filteredItems)[number]) => {
    const owned = (purchased[item.id] ?? 0) + (added[item.id] ?? 0);
    const afford =
      mode === "add" ||
      canAffordItem(selectedSocialClass, socialClasses, purchased, item.id, 1, extraMoneyPc);
    const cargaBlock = wouldExceedCarga(purchased, item.id, cargaKg, 1, added);
    const canSelect = afford && !cargaBlock;
    const caLabel = item.category === "armadura" ? formatArmorClass(item.armorClass) : null;

    const stats: { label: string; color?: string }[] = [];
    if (item.weaponStats) {
      const { damagePM, damageG, speed, type } = item.weaponStats;
      if (damagePM) stats.push({ label: damagePM });
      if (damageG && damageG !== damagePM) stats.push({ label: `G: ${damageG}` });
      if (speed) stats.push({ label: `Vel. ${speed}` });
      if (type && DAMAGE_TYPE[type]) stats.push({ label: DAMAGE_TYPE[type] });
    }
    if (caLabel) stats.push({ label: `CA ${caLabel}`, color: "text-blue-900 border-blue-300 bg-blue-100" });

    const card = (
      <div
        className={`flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-all ${
          !canSelect
            ? "border-border bg-muted/40 opacity-70 cursor-not-allowed"
            : "border-border bg-background hover:bg-secondary/50 hover:border-gold-dark/40 cursor-default shadow-sm"
        }`}
      >
        <div className="flex-1 min-w-0">
          {/* Nome + badge "possui" */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-body text-foreground font-medium leading-snug">{item.name}</p>
            {owned > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-display px-1.5 py-0.5 rounded-full bg-gold-dark/15 text-gold-dark border border-gold-dark/40">
                <Check className="w-2.5 h-2.5" />×{owned}
              </span>
            )}
          </div>

          {/* Chips de stats */}
          {stats.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {stats.map((s) => (
                <span
                  key={s.label}
                  className={`text-[10px] font-display tracking-wide px-1.5 py-0.5 rounded border ${
                    s.color ?? "text-foreground/80 border-border bg-secondary"
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          )}

          {/* Peso + alertas */}
          <div className="flex flex-wrap items-center gap-x-2 mt-1">
            {item.weightKg > 0 && (
              <span className="text-[11px] text-foreground/70 font-body">
                {item.weightKg.toFixed(2).replace(".", ",")} kg
              </span>
            )}
            {!afford && (
              <span className="text-[11px] text-destructive font-semibold font-body">saldo insuficiente</span>
            )}
            {cargaBlock && (
              <span className="text-[11px] text-destructive font-semibold font-body">excede carga</span>
            )}
          </div>
        </div>

        {/* Preço + botão */}
        <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
          {mode === "buy" && item.pricePc > 0 && (
            <span
              className={`text-xs font-display font-bold ${
                afford ? "text-gold-dark" : "text-destructive"
              }`}
            >
              {formatMoney(item.pricePc)}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleSelect(item.id)}
            disabled={!canSelect}
            title={
              !afford
                ? "Saldo insuficiente"
                : cargaBlock
                  ? "Excede carga"
                  : mode === "buy"
                    ? "Comprar"
                    : "Adicionar"
            }
            className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              mode === "buy"
                ? "border-gold-dark/60 bg-gold-dark/15 hover:bg-gold-dark/25 text-gold-dark"
                : "border-ink/40 bg-secondary hover:bg-muted text-ink"
            }`}
          >
            {mode === "buy" ? (
              <ShoppingCart className="w-3.5 h-3.5" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    );

    if (!item.description) return <div key={item.id}>{card}</div>;

    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <div className="rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-gold/50">
            {card}
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs text-xs font-body space-y-1 bg-card border-2 border-border text-foreground">
          <p className="font-semibold text-foreground">{item.name}</p>
          {caLabel && (
            <p className="text-blue-900 font-display text-[11px] tracking-wide font-semibold">C.A. {caLabel}</p>
          )}
          <AdvantageDescription description={item.description} className="" />
        </TooltipContent>
      </Tooltip>
    );
  };

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  const renderSidebar = () => {
    if (mainTab === "armas") {
      return (
        <nav className="flex flex-col gap-0.5 py-3 px-2">
          {WEAPON_SUB_TABS.map((sub) => {
            const active = weaponSubTab === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => { setWeaponSubTab(sub.id); setSearch(""); }}
                className={`group flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-xs font-body transition-all ${
                  active
                    ? "bg-background text-foreground border-2 border-gold-dark/50 shadow-sm font-semibold"
                    : "text-foreground/75 hover:text-foreground hover:bg-background/70 border-2 border-transparent"
                }`}
              >
                <span className={active ? "text-gold-dark" : "text-foreground/60 group-hover:text-foreground"}>
                  {WEAPON_GROUP_ICONS[sub.id]}
                </span>
                <span className="flex-1 truncate leading-tight">{sub.label}</span>
                <span
                  className={`text-[10px] font-display px-1.5 py-0.5 rounded tabular-nums ${
                    active ? "bg-gold-dark/20 text-gold-dark font-bold" : "bg-muted text-foreground/60"
                  }`}
                >
                  {weaponCounts[sub.id]}
                </span>
              </button>
            );
          })}
        </nav>
      );
    }

    if (mainTab === "equipamento") {
      return (
        <nav className="flex flex-col gap-0.5 py-3 px-2">
          {EQUIPMENT_SUB_TABS.map((sub) => {
            const active = equipmentSubTab === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => { setEquipmentSubTab(sub.id); setSearch(""); }}
                className={`group flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-xs font-body transition-all ${
                  active
                    ? "bg-background text-foreground border-2 border-gold-dark/50 shadow-sm font-semibold"
                    : "text-foreground/75 hover:text-foreground hover:bg-background/70 border-2 border-transparent"
                }`}
              >
                <span className={active ? "text-gold-dark" : "text-foreground/60 group-hover:text-foreground"}>
                  {EQUIPMENT_TAB_ICONS[sub.id]}
                </span>
                <span className="flex-1 truncate leading-tight">{sub.label}</span>
                <span
                  className={`text-[10px] font-display px-1.5 py-0.5 rounded tabular-nums ${
                    active ? "bg-gold-dark/20 text-gold-dark font-bold" : "bg-muted text-foreground/60"
                  }`}
                >
                  {equipmentCounts[sub.id]}
                </span>
              </button>
            );
          })}
        </nav>
      );
    }

    // armaduras — sem sub-tabs, apenas indicação visual
    return (
      <nav className="flex flex-col gap-0.5 py-3 px-2">
        <div className="flex items-center gap-2 w-full text-left px-2.5 py-2 rounded-lg text-xs font-body font-semibold bg-background text-foreground border-2 border-gold-dark/50 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-gold-dark" />
          <span className="flex-1">Todas</span>
          <span className="text-[10px] font-display px-1.5 py-0.5 rounded bg-gold-dark/20 text-gold-dark tabular-nums font-bold">
            {equipmentItems.filter((it) => it.tab === "armaduras").length}
          </span>
        </div>
      </nav>
    );
  };

  const isBuy = mode === "buy";
  const activeLabel =
    mainTab === "armas"
      ? WEAPON_SUB_TABS.find((t) => t.id === weaponSubTab)?.label ?? "Todas"
      : mainTab === "equipamento"
        ? EQUIPMENT_SUB_TABS.find((t) => t.id === equipmentSubTab)?.label ?? "Todos"
        : "Todas as proteções";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col bg-card text-foreground border-2 border-gold-dark/40 shadow-2xl gap-0 p-0 overflow-hidden">

        {/* ── Cabeçalho ── */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b-2 border-border shrink-0 bg-secondary"
        >
          <span
            className={`p-2 rounded-lg border-2 ${
              isBuy
                ? "border-gold-dark/50 bg-gold-dark/15 text-gold-dark"
                : "border-ink/30 bg-muted text-ink"
            }`}
          >
            {isBuy ? <ShoppingCart className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </span>
          <DialogHeader className="flex-1 space-y-0">
            <DialogTitle className="font-display tracking-wider text-base leading-none text-gold-dark">
              {isBuy ? "Comprar" : "Adicionar"} ·{" "}
              {mainTab === "armas"
                ? "Armas"
                : mainTab === "armaduras"
                  ? "Armaduras e proteções"
                  : "Equipamento"}
            </DialogTitle>
            <p className="text-xs text-foreground/70 font-body mt-1">
              {isBuy
                ? "O valor será descontado do saldo disponível."
                : "Item adicionado sem custo (loot, presente, etc.)."}
            </p>
          </DialogHeader>
        </div>

        {/* ── Corpo: sidebar + conteúdo ── */}
        <TooltipProvider delayDuration={150}>
          <div className="flex flex-1 min-h-0 overflow-hidden bg-background">

            {/* Sidebar */}
            <div className="w-44 shrink-0 border-r-2 border-border overflow-y-auto bg-secondary/70">
              {renderSidebar()}
            </div>

            {/* Conteúdo */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

              {/* Barra de busca */}
              <div className="px-3 py-2.5 border-b-2 border-border shrink-0 bg-card">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Buscar em ${activeLabel}…`}
                    className="w-full pl-9 pr-14 py-2.5 rounded-lg border-2 border-border bg-background text-sm font-body text-foreground placeholder:text-foreground/45 focus:outline-none focus:ring-2 focus:ring-gold-dark/40 focus:border-gold-dark/50"
                  />
                  {filteredItems.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/60 font-display font-semibold tabular-nums">
                      {filteredItems.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Lista */}
              <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-1.5">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-foreground/50 gap-2">
                    <Search className="w-8 h-8 opacity-40" />
                    <p className="text-sm font-body">Nenhum item encontrado.</p>
                  </div>
                ) : (
                  filteredItems.map((item) => renderItem(item))
                )}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
};

export default ItemPickerModal;
