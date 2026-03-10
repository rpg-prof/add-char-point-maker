import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { weaponGroups, shieldProficiencies, type WeaponGroup } from "@/data/weaponProficiencies";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeaponProficiencyPanelProps {
  selectedWeapons: string[];
  selectedGroups: string[];
  selectedShields: string[];
  onWeaponToggle: (weaponKey: string, cost: number) => void;
  onGroupToggle: (groupName: string, cost: number) => void;
  onShieldToggle: (shieldName: string, cost: number) => void;
}

const WeaponProficiencyPanel = ({
  selectedWeapons,
  selectedGroups,
  selectedShields,
  onWeaponToggle,
  onGroupToggle,
  onShieldToggle,
}: WeaponProficiencyPanelProps) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  const toggleExpand = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName)
        ? prev.filter((g) => g !== groupName)
        : [...prev, groupName]
    );
  };

  const sizeLabel = (s: string) => {
    switch (s) {
      case "P": return "Pequena";
      case "M": return "Média";
      case "G": return "Grande";
      default: return s;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Weapon Groups */}
        <div className="space-y-2">
          <h3 className="font-display text-sm tracking-wider uppercase text-gold mb-3">
            Perícias com Armas
          </h3>

          {weaponGroups.map((group) => {
            const isGroupSelected = selectedGroups.includes(group.name);
            const isExpanded = expandedGroups.includes(group.name);
            const selectedWeaponsInGroup = group.weapons.filter((w) =>
              selectedWeapons.includes(`${group.name}::${w.name}`)
            );

            return (
              <div key={group.name} className="border border-border rounded-lg overflow-hidden">
                {/* Group Header */}
                <div className="flex items-center gap-2 bg-card/60 px-3 py-2">
                  <button
                    onClick={() => toggleExpand(group.name)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="font-display text-sm text-foreground truncate">
                      {group.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({sizeLabel(group.sizeCategory)})
                    </span>
                  </div>

                  {/* Group buy button */}
                  {group.costGroup !== null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => onGroupToggle(group.name, group.costGroup!)}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-body border transition-all ${
                            isGroupSelected
                              ? "bg-gold/20 border-gold text-foreground"
                              : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                              isGroupSelected ? "bg-gold border-gold" : "border-border"
                            }`}
                          >
                            {isGroupSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                          </span>
                          <span>Grupo</span>
                          <span className="font-display text-gold-dark">{group.costGroup} pts</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>Perícia com todas as armas deste grupo. Penalidade sem perícia: {group.penaltyNoProficiency}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {/* Summary of selected individual weapons */}
                  {!isGroupSelected && selectedWeaponsInGroup.length > 0 && (
                    <span className="text-xs text-gold-dark">
                      {selectedWeaponsInGroup.length} arma(s)
                    </span>
                  )}
                </div>

                {/* Expanded weapons list */}
                {isExpanded && (
                  <div className="border-t border-border bg-background/30">
                    <div className="px-3 py-1.5 text-xs text-muted-foreground flex gap-4 border-b border-border/50">
                      <span>Custo por arma: <strong className="text-gold-dark">{group.costPerWeapon} pts</strong></span>
                      <span>Especialização: <strong className="text-gold-dark">{group.costSpecialization} pts</strong></span>
                      <span>Pen. s/ perícia: <strong className="text-blood">{group.penaltyNoProficiency}</strong></span>
                    </div>

                    {/* Weapons table */}
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card/90">
                          <tr className="text-muted-foreground border-b border-border/50">
                            <th className="text-left px-3 py-1 font-display">Arma</th>
                            <th className="text-center px-1 py-1 font-display">Tipo</th>
                            <th className="text-center px-1 py-1 font-display">Vel.</th>
                            <th className="text-center px-1 py-1 font-display">Dano P/M</th>
                            <th className="text-center px-1 py-1 font-display">Dano G</th>
                            <th className="text-right px-3 py-1 font-display">Custo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.weapons.map((weapon) => {
                            const weaponKey = `${group.name}::${weapon.name}`;
                            const isSelected = selectedWeapons.includes(weaponKey) || isGroupSelected;
                            const isDisabledByGroup = isGroupSelected;

                            return (
                              <tr
                                key={weapon.name}
                                className={`border-b border-border/30 transition-colors ${
                                  isDisabledByGroup
                                    ? "opacity-50"
                                    : "hover:bg-card/40 cursor-pointer"
                                }`}
                                onClick={() => {
                                  if (!isDisabledByGroup) {
                                    onWeaponToggle(weaponKey, group.costPerWeapon);
                                  }
                                }}
                              >
                                <td className="px-3 py-1.5 flex items-center gap-1.5">
                                  <span
                                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                                      isSelected ? "bg-gold border-gold" : "border-border"
                                    }`}
                                  >
                                    {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                                  </span>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate">{weapon.name}</span>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs text-xs">
                                      <p><strong>{weapon.name}</strong></p>
                                      <p>Peso: {weapon.weight} | Tam: {weapon.size}</p>
                                      <p>Preço: {weapon.price}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </td>
                                <td className="text-center px-1 py-1.5 text-muted-foreground">{weapon.type}</td>
                                <td className="text-center px-1 py-1.5">{weapon.speed}</td>
                                <td className="text-center px-1 py-1.5 text-foreground">{weapon.damagePM}</td>
                                <td className="text-center px-1 py-1.5 text-foreground">{weapon.damageG}</td>
                                <td className="text-right px-3 py-1.5 font-display text-gold-dark">
                                  {group.costPerWeapon} pts
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Shield Proficiencies */}
        <div className="space-y-2">
          <h3 className="font-display text-sm tracking-wider uppercase text-gold mb-3">
            <Shield className="w-4 h-4 inline mr-1.5" />
            Perícias com Escudo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {shieldProficiencies.map((shield) => {
              const isSelected = selectedShields.includes(shield.name);
              const isAllSelected = selectedShields.includes("Todos os Escudos");
              const isDisabled = shield.name !== "Todos os Escudos" && isAllSelected;

              return (
                <Tooltip key={shield.name}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        if (!isDisabled) onShieldToggle(shield.name, shield.cost);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-sm font-body border transition-all text-left ${
                        isSelected || (isDisabled)
                          ? "bg-gold/20 border-gold text-foreground"
                          : "bg-card/40 border-border hover:bg-card/80 text-muted-foreground"
                      } ${isDisabled ? "opacity-50" : ""}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected || isDisabled ? "bg-gold border-gold" : "border-border"
                        }`}
                      >
                        {(isSelected || isDisabled) && <Check className="w-3 h-3 text-primary-foreground" />}
                      </span>
                      <span className="flex-1 truncate">{shield.name}</span>
                      <span className="text-xs text-muted-foreground">CA {shield.bonusCA}</span>
                      <span className="text-xs font-display text-gold-dark">{shield.cost} pts</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Bônus CA: {shield.bonusCA} | N° Atacantes: {shield.attackers}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default WeaponProficiencyPanel;
