// Magic access rules — costs from "Acesso á Magias" table

export interface DivineSphere {
  name: string;
  priest: { minor: number; major: number };
  paladin: { minor: number; major: number };
  others: { minor: number; major: number };
}

export const divineSpheres: DivineSphere[] = [
  { name: "Todas",        priest: { minor: 0,  major: 1  }, paladin: { minor: 5,  major: 15 }, others: { minor: 15, major: 40 } },
  { name: "Adivinhação",  priest: { minor: 2,  major: 4  }, paladin: { minor: 5,  major: 15 }, others: { minor: 15, major: 40 } },
  { name: "Animal",       priest: { minor: 2,  major: 4  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Astral",       priest: { minor: 1,  major: 3  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Clima",        priest: { minor: 2,  major: 5  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Combate",      priest: { minor: 2,  major: 4  }, paladin: { minor: 5,  major: 15 }, others: { minor: 15, major: 40 } },
  { name: "Convocação",   priest: { minor: 2,  major: 5  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Criação",      priest: { minor: 2,  major: 5  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Cura",         priest: { minor: 2,  major: 4  }, paladin: { minor: 5,  major: 15 }, others: { minor: 15, major: 40 } },
  { name: "Elemental (Água)", priest: { minor: 3, major: 5 }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Elemental (Ar)",   priest: { minor: 3, major: 5 }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Elemental (Fogo)", priest: { minor: 3, major: 5 }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Elemental (Terra)",priest: { minor: 3, major: 5 }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Feitiço",      priest: { minor: 2,  major: 5  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Guarda",       priest: { minor: 2,  major: 5  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Necromântica", priest: { minor: 2,  major: 5  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Proteção",     priest: { minor: 3,  major: 4  }, paladin: { minor: 5,  major: 15 }, others: { minor: 15, major: 40 } },
  { name: "Solar",        priest: { minor: 2,  major: 4  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
  { name: "Vegetal",      priest: { minor: 2,  major: 5  }, paladin: { minor: 10, major: 30 }, others: { minor: 15, major: 40 } },
];

export interface ArcaneSchool {
  name: string;
  predefinedRaces: string[];
  magePerRace: number;
  mageOthers: number;
  bard: number;
  others: number;
  specialization?: { opposed: string[]; title: string; requirement: string; cost: number };
}

export const arcaneSchools: ArcaneSchool[] = [
  { name: "Augúrio",              predefinedRaces: ["Todas"], magePerRace: 1, mageOthers: 0,  bard: 10, others: 20 },
  { name: "Abjuração",            predefinedRaces: ["Humano"], magePerRace: 5, mageOthers: 10, bard: 30, others: 30,
    specialization: { opposed: ["Alteração", "Ilusão"], title: "Abjurante", requirement: "15 Sab", cost: 10 } },
  { name: "Alteração",            predefinedRaces: ["Humano", "Meio-Elfo"], magePerRace: 5, mageOthers: 10, bard: 30, others: 30,
    specialization: { opposed: ["Abjuração", "Necromancia"], title: "Transmutador", requirement: "15 Des", cost: 10 } },
  { name: "Conjuração/Convocação",predefinedRaces: ["Humano", "Meio-Elfo"], magePerRace: 7, mageOthers: 15, bard: 45, others: 45,
    specialization: { opposed: ["Profecia", "Invocação/Evocação"], title: "Conjurador", requirement: "15 Con", cost: 10 } },
  { name: "Encantamento/Feitiço", predefinedRaces: ["Humano", "Elfo", "Meio-Elfo"], magePerRace: 7, mageOthers: 15, bard: 20, others: 45,
    specialization: { opposed: ["Invocação/Evocação", "Necromancia"], title: "Feiticeiro", requirement: "16 Car", cost: 12 } },
  { name: "Profecia",             predefinedRaces: ["Humano", "Elfo", "Meio-Elfo"], magePerRace: 5, mageOthers: 10, bard: 15, others: 30,
    specialization: { opposed: ["Conjuração/Convocação"], title: "Adivinho", requirement: "16 Sab", cost: 10 } },
  { name: "Ilusão",               predefinedRaces: ["Humano", "Gnomo"], magePerRace: 7, mageOthers: 15, bard: 20, others: 45,
    specialization: { opposed: ["Necromancia", "Invocação/Evocação", "Abjuração"], title: "Ilusionista", requirement: "16 Des", cost: 12 } },
  { name: "Invocação/Evocação",   predefinedRaces: ["Humano"], magePerRace: 5, mageOthers: 10, bard: 30, others: 30,
    specialization: { opposed: ["Encantamento/Feitiço", "Conjuração/Convocação"], title: "Invocador", requirement: "16 Con", cost: 10 } },
  { name: "Necromancia",          predefinedRaces: ["Humano"], magePerRace: 10, mageOthers: 20, bard: 40, others: 60,
    specialization: { opposed: ["Ilusão", "Encantamento/Feitiço"], title: "Necromante", requirement: "16 Sab", cost: 15 } },
  { name: "Alquimista",           predefinedRaces: ["Humano", "Meio-Elfo", "Gnomo"], magePerRace: 3, mageOthers: 8, bard: 15, others: 25,
    specialization: { opposed: ["Necromancia", "Ilusão"], title: "Alquimista", requirement: "15 Int, 14 Des", cost: 10 } },
  { name: "Geometria",            predefinedRaces: ["Humano", "Elfo", "Meio-Elfo"], magePerRace: 3, mageOthers: 8, bard: 25, others: 25,
    specialization: { opposed: ["Encantamento/Feitiço", "Ilusão"], title: "Geômetra", requirement: "15 Int, 14 Sab", cost: 10 } },
  { name: "Sombras",              predefinedRaces: ["Humano"], magePerRace: 5, mageOthers: 10, bard: 30, others: 30,
    specialization: { opposed: ["Invocação/Evocação", "Abjuração"], title: "Mago das Sombras", requirement: "15 Int, 14 Sab", cost: 10 } },
  { name: "Canção",               predefinedRaces: ["Humano", "Elfo", "Meio-Elfo"], magePerRace: 3, mageOthers: 8, bard: 10, others: 25,
    specialization: { opposed: ["Necromancia", "Adivinhação", "Invocação/Evocação"], title: "Mago Trovador", requirement: "15 Int, 14 Car", cost: 10 } },
];

// Cost helpers
export const divineSphereCost = (
  sphere: DivineSphere,
  level: "minor" | "major",
  className: string
): number => {
  if (className === "Sacerdote") return sphere.priest[level];
  if (className === "Paladino") return sphere.paladin[level];
  return sphere.others[level];
};

export const arcaneSchoolCost = (
  school: ArcaneSchool,
  className: string,
  race: string
): number => {
  if (className === "Arcano" || className === "Mago") {
    const isPredefined = school.predefinedRaces.includes("Todas") || school.predefinedRaces.includes(race);
    return isPredefined ? school.magePerRace : school.mageOthers;
  }
  if (className === "Bardo") return school.bard;
  return school.others;
};

// Spell matching helpers
const tokenize = (s: string): string[] =>
  s.split(/[,/]/).map((t) => t.trim()).filter(Boolean);

export const spellMatchesArcane = (
  spellSchool: string,
  accessSchools: string[],
  specialist: string | null
): boolean => {
  if (accessSchools.length === 0 && !specialist) return false;
  const spellTokens = tokenize(spellSchool);
  const allowed = new Set([...accessSchools, ...(specialist ? [specialist] : [])]);
  for (const a of allowed) {
    const accessTokens = tokenize(a);
    if (spellTokens.some((st) => accessTokens.some((at) => st === at || st.includes(at) || at.includes(st)))) {
      return true;
    }
  }
  return false;
};

export const spellMatchesDivine = (
  spellSphere: string | undefined,
  accessSpheres: string[]
): boolean => {
  if (!spellSphere || accessSpheres.length === 0) return false;
  const tokens = spellSphere.split(",").map((t) => t.trim());
  if (tokens.includes("Todas")) return true;
  return tokens.some((t) => accessSpheres.includes(t) || accessSpheres.includes("Todas"));
};
