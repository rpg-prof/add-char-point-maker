// ===== WEAPON PROFICIENCY SYSTEM =====

export type { Weapon, WeaponGroup, WeaponItem } from "./weapons";
export {
  weaponGroups,
  getWeaponItemByCode,
  getAllWeaponItems,
} from "./weapons";

export interface ShieldProficiency {
  name: string;
  cost: number;
  bonusCA: string;
  attackers: string;
}

export const shieldProficiencies: ShieldProficiency[] = [
  { name: "Broquel", cost: 2, bonusCA: "+1", attackers: "1" },
  { name: "Escudo Pequeno", cost: 3, bonusCA: "+2", attackers: "2" },
  { name: "Escudo Médio", cost: 5, bonusCA: "+3", attackers: "3" },
  { name: "Escudo Corporal", cost: 10, bonusCA: "+3/+4 vs. Projéteis", attackers: "4" },
  { name: "Todos os Escudos", cost: 15, bonusCA: "-", attackers: "-" },
];
