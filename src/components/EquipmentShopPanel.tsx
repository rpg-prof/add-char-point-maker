import { useMemo, useState } from "react";
import { Minus, Plus, Search, Scale, Wallet } from "lucide-react";
import AdvantageDescription from "@/components/AdvantageDescription";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  equipmentItems,
  equipmentById,
  formatMoney,
  formatArmorClass,
  getRemainingCopper,
  getSpentCopper,
  getStartingCapitalPc,
  getTotalWeightKg,
  canAffordItem,
  wouldExceedCarga,
  type PurchasedItems,
} from "@/data/equipment";
import {
  SHOP_MAIN_TABS,
  WEAPON_SUB_TABS,
  EQUIPMENT_SUB_TABS,
  countMainTabItems,
  countEquipmentSubTabItems,
  itemMatchesShopView,
  shopViewLabel,
  type ShopMainTabId,
  type EquipmentSubTabId,
  type WeaponGroupId,
} from "@/data/equipmentTabs";
import { socialClasses } from "@/data/characterData";
import { getSubAttributeBonuses } from "@/data/subAttributes";
import { parseCargaKg } from "@/data/currency";

interface EquipmentShopPanelProps {
  selectedSocialClass: string;
  subAttributes: Record<string, number>;
  purchased: PurchasedItems;
  onPurchaseChange: (purchased: PurchasedItems) => void;
}

const EquipmentShopPanel = ({
  selectedSocialClass,
  subAttributes,
  purchased,
  onPurchaseChange,
}: EquipmentShopPanelProps) => {
  const [activeMainTab, setActiveMainTab] = useState<ShopMainTabId>("armas");
  const [weaponSubTab, setWeaponSubTab] = useState<WeaponGroupId>("todas");
  const [equipmentSubTab, setEquipmentSubTab] = useState<EquipmentSubTabId>("todas");
  const [search, setSearch] = useState("");

  const resistenciaValue = subAttributes["Resistência"] ?? 10;
  const cargaBonus = getSubAttributeBonuses("Resistência", resistenciaValue)["Carga Permitida"] ?? "—";
  const cargaKg = parseCargaKg(cargaBonus);

  const startingPc = getStartingCapitalPc(selectedSocialClass, socialClasses);
  const spentPc = getSpentCopper(purchased);
  const remainingPc = getRemainingCopper(selectedSocialClass, socialClasses, purchased);
  const totalWeight = getTotalWeightKg(purchased);
  const overCarga = cargaKg > 0 && totalWeight > cargaKg;

  const socialLabel = socialClasses.find((s) => s.name === selectedSocialClass);

  const ownedEntries = useMemo(
    () =>
      Object.entries(purchased)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ item: equipmentById[id], qty }))
        .filter((e) => e.item)
        .sort((a, b) => a.item!.name.localeCompare(b.item!.name, "pt")),
    [purchased]
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base =
      activeMainTab === "inventario"
        ? ownedEntries.map((e) => e.item!)
        : equipmentItems.filter((item) =>
            itemMatchesShopView(item, activeMainTab, weaponSubTab, equipmentSubTab)
          );

    if (!q) return base;

    return base.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.section ?? "").includes(q) ||
        (item.weaponGroup ?? "").includes(q)
    );
  }, [activeMainTab, weaponSubTab, equipmentSubTab, search, ownedEntries]);

  const mainTabCounts = useMemo(() => {
    const counts: Partial<Record<ShopMainTabId, number>> = {};
    for (const tab of SHOP_MAIN_TABS) {
      counts[tab.id] = countMainTabItems(equipmentItems, tab.id, purchased);
    }
    return counts;
  }, [purchased]);

  const setQty = (id: string, qty: number) => {
    const next = { ...purchased };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    onPurchaseChange(next);
  };

  const tryBuy = (id: string) => {
    const current = purchased[id] ?? 0;
    if (!canAffordItem(selectedSocialClass, socialClasses, purchased, id, 1)) return;
    if (wouldExceedCarga(purchased, id, cargaKg, 1)) return;
    setQty(id, current + 1);
  };

  const trySell = (id: string) => {
    const current = purchased[id] ?? 0;
    if (current <= 0) return;
    setQty(id, current - 1);
  };

  const handleMainTabChange = (tab: ShopMainTabId) => {
    setActiveMainTab(tab);
    if (tab !== "armas") setWeaponSubTab("todas");
    if (tab !== "equipamento") setEquipmentSubTab("todas");
  };

  const activeViewLabel = shopViewLabel(activeMainTab, equipmentSubTab);

  const renderItemRow = (item: (typeof filteredItems)[number]) => {
    const qty = purchased[item.id] ?? 0;
    const afford = canAffordItem(selectedSocialClass, socialClasses, purchased, item.id, 1);
    const cargaBlock = wouldExceedCarga(purchased, item.id, cargaKg, 1);
    const canBuy = afford && !cargaBlock;

    const caLabel = item.category === "armadura" ? formatArmorClass(item.armorClass) : null;

    const row = (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-card/30 hover:bg-card/50 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body text-foreground truncate">{item.name}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatMoney(item.pricePc)}
            {caLabel && (
              <> · CA {caLabel}</>
            )}
            {item.weightKg > 0 && <> · {item.weightKg.toFixed(2).replace(".", ",")} kg</>}
            {item.weaponStats && (
              <> · {item.weaponStats.damagePM}/{item.weaponStats.damageG}</>
            )}
            {item.weaponGroup && item.weaponGroup !== "outras" && (
              <> · {WEAPON_SUB_TABS.find((s) => s.id === item.weaponGroup)?.label}</>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {qty > 0 && (
            <>
              <button
                type="button"
                onClick={() => trySell(item.id)}
                className="p-1 rounded border border-border hover:bg-muted text-muted-foreground"
                title="Devolver 1 unidade"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-gold">{qty}</span>
            </>
          )}
          <button
            type="button"
            onClick={() => tryBuy(item.id)}
            disabled={!canBuy}
            title={
              !afford ? "Saldo insuficiente" : cargaBlock ? "Excede carga permitida" : "Comprar"
            }
            className="p-1 rounded border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );

    if (!item.description) {
      return row;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="rounded-lg outline-none focus-visible:ring-1 focus-visible:ring-gold/50">
            {row}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md text-xs font-body space-y-1">
          <p className="font-semibold text-foreground">{item.name}</p>
          {caLabel && (
            <p className="text-gold font-display text-[11px] tracking-wide">
              C.A. {caLabel}
            </p>
          )}
          <AdvantageDescription description={item.description} className="" />
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-4">
      {/* Saldo e carga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-gold">
            <Wallet className="w-4 h-4" />
            <h3 className="font-display text-sm tracking-wider uppercase">Dinheiro</h3>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            Capital da classe social ({socialLabel?.capital ?? selectedSocialClass}):{" "}
            <span className="text-foreground">{formatMoney(startingPc)}</span>
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm font-body">
            <div>
              <span className="text-muted-foreground">Gasto:</span>{" "}
              <span className={spentPc > startingPc ? "text-destructive font-semibold" : ""}>
                {formatMoney(spentPc)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Restante:</span>{" "}
              <span className={remainingPc < 0 ? "text-destructive font-semibold" : "text-gold font-semibold"}>
                {formatMoney(remainingPc)}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">1 po = 10 pp · 1 pp = 10 pc</p>
        </div>

        <div
          className={`rounded-lg border p-4 space-y-2 ${
            overCarga ? "border-destructive/60 bg-destructive/5" : "border-border bg-card/50"
          }`}
        >
          <div className="flex items-center gap-2 text-gold">
            <Scale className="w-4 h-4" />
            <h3 className="font-display text-sm tracking-wider uppercase">Carga</h3>
          </div>
          <p className="text-sm font-body">
            Resistência <span className="font-bold">{resistenciaValue}</span> → carga permitida:{" "}
            <span className="text-gold font-semibold">{cargaBonus}</span>
          </p>
          <p className={`text-sm font-body ${overCarga ? "text-destructive font-semibold" : ""}`}>
            Peso carregado: {totalWeight.toFixed(1).replace(".", ",")} kg
            {cargaKg > 0 && (
              <span className="text-muted-foreground font-normal">
                {" "}
                / {cargaKg.toFixed(1).replace(".", ",")} kg
              </span>
            )}
          </p>
          {overCarga && (
            <p className="text-xs text-destructive">
              O personagem excede a carga permitida. Remova itens ou aumente Resistência.
            </p>
          )}
        </div>
      </div>

      {/* Abas principais */}
      <div className="rounded-lg border border-border bg-card/40 overflow-hidden">
        <div className="flex flex-wrap gap-1 p-2 border-b border-border/60">
          {SHOP_MAIN_TABS.map((tab) => {
            const count = mainTabCounts[tab.id] ?? 0;
            const isActive = activeMainTab === tab.id;
            const ownedHighlight = tab.id === "inventario" && count > 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleMainTabChange(tab.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-display tracking-wide border transition-all ${
                  isActive
                    ? "bg-gold/25 text-gold border-gold/50"
                    : ownedHighlight
                    ? "bg-gold/10 text-foreground border-gold/30 hover:bg-gold/15"
                    : "text-muted-foreground border-transparent hover:bg-card/80 hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`ml-1 opacity-70 ${isActive ? "text-gold" : ""}`}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Sub-abas de armas */}
        {activeMainTab === "armas" && (
          <div className="flex flex-wrap gap-1 px-2 py-1.5 border-b border-border/40 bg-card/20">
            {WEAPON_SUB_TABS.map((sub) => {
              const subCount =
                sub.id === "todas"
                  ? countMainTabItems(equipmentItems, "armas", purchased)
                  : equipmentItems.filter((i) => i.tab === "armas" && i.weaponGroup === sub.id).length;
              const isActive = weaponSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setWeaponSubTab(sub.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-body border transition-all ${
                    isActive
                      ? "bg-gold/20 border-gold/40 text-gold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sub.label}
                  <span className="ml-1 opacity-60">({subCount})</span>
                </button>
              );
            })}
          </div>
        )}

        {activeMainTab === "equipamento" && (
          <div className="flex flex-wrap gap-1 px-2 py-1.5 border-b border-border/40 bg-card/20">
            {EQUIPMENT_SUB_TABS.map((sub) => {
              const subCount = countEquipmentSubTabItems(equipmentItems, sub.id);
              const isActive = equipmentSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setEquipmentSubTab(sub.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-body border transition-all ${
                    isActive
                      ? "bg-gold/20 border-gold/40 text-gold"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sub.label}
                  <span className="ml-1 opacity-60">({subCount})</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar em ${activeViewLabel}...`}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card/60 text-sm font-body"
              />
            </div>
            {activeMainTab === "inventario" && ownedEntries.length > 0 && (
              <span className="text-xs text-muted-foreground font-body shrink-0">
                {ownedEntries.reduce((s, e) => s + e.qty, 0)} un.
              </span>
            )}
          </div>

          {/* Lista de itens */}
          <div className="max-h-[38vh] overflow-y-auto pr-1 space-y-1">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body py-6 text-center">
                {activeMainTab === "inventario"
                  ? "Nenhum item comprado ainda."
                  : "Nenhum item encontrado nesta aba."}
              </p>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id}>{renderItemRow(item)}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>
  );
};

export default EquipmentShopPanel;
