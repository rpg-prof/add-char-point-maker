/** Serialização de grupos de armas e catálogo de itens (peso/preço). */

export const GROUP_SLUGS = {
  "Adagas e Facas": "daggers",
  "Espadas Menores": "short-swords",
  "Espadas Grandes (Uma Mão)": "one-handed-swords",
  "Espadas Grandes (Duas Mãos)": "two-handed-swords",
  "Machados Menores": "hand-axes",
  "Machados Grandes Simples": "battle-axes",
  "Machados Grandes Duplos": "double-axes",
  "Maças e Armas de Impacto": "maces",
  Martelos: "hammers",
  Manguais: "flails",
  "Armas de Haste": "polearms",
  Chicotes: "whips",
  "Outras Armas Menores": "misc-small",
  "Outras Armas Maiores": "misc-large",
  Bestas: "crossbows",
  Arcos: "bows",
};

export function serializeWeaponGroup(group, weapons) {
  return {
    "group-name": group.name,
    "group-size-category": group.sizeCategory,
    "group-cost-per-weapon": group.costPerWeapon,
    "group-cost-group": group.costGroup,
    "group-cost-specialization": group.costSpecialization,
    "group-penalty-no-proficiency": group.penaltyNoProficiency,
    "group-penalty-similar": group.penaltySimilar,
    weapons: weapons.map((w) => ({
      code: w.code,
      name: w.name,
      weight: w.weight,
      size: w.size,
      type: w.type,
      speed: w.speed,
      damagePM: w.damagePM,
      damageG: w.damageG,
    })),
  };
}

export function serializeWeaponItems(weapons) {
  return weapons.map((w) => ({
    code: w.code,
    name: w.name,
    weight: w.weight,
    cost: w.price,
  }));
}
