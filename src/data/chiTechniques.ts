/** Técnicas de Chi — data/character-evolution.html */

export interface ChiTechniqueDef {
  name: string;
  /** Custo em PP para Monge. */
  costNative: number;
  /** Custo em PP para demais classes. */
  costOthers: number;
  /** Custo em pontos de Chi para ativar; null = passiva. */
  chiCost: number | null;
  /** Resumo curto para UI. */
  summary: string;
}

export const CHI_TECHNIQUES: ChiTechniqueDef[] = [
  {
    name: "Torrente de Golpes",
    costNative: 3,
    costOthers: 15,
    chiCost: 1,
    summary: "Dois ataques desarmados adicionais como ação bônus.",
  },
  {
    name: "Defesa Paciente",
    costNative: 3,
    costOthers: 15,
    chiCost: 1,
    summary: "+2 CA até o início do próximo turno.",
  },
  {
    name: "Passo do Vento",
    costNative: 3,
    costOthers: 15,
    chiCost: 1,
    summary: "Correr como ação bônus; distância de salto dobrada.",
  },
  {
    name: "Movimento sem Armadura",
    costNative: 3,
    costOthers: 15,
    chiCost: null,
    summary: "Bônus de movimento sem armadura/escudo (conforme nível de Chi).",
  },
  {
    name: "Defletir Ataques",
    costNative: 5,
    costOthers: 20,
    chiCost: 1,
    summary: "Reação: reduz dano físico em 1d4 × nível de Chi.",
  },
  {
    name: "Queda Serena",
    costNative: 5,
    costOthers: 20,
    chiCost: 1,
    summary: "Reação ao cair: reduz dano em 5 × nível de Chi.",
  },
  {
    name: "Golpe Preciso",
    costNative: 15,
    costOthers: 40,
    chiCost: 1,
    summary: "Antes da rolagem: +2 na jogada de ataque.",
  },
  {
    name: "Golpe Atordoante",
    costNative: 20,
    costOthers: 40,
    chiCost: 2,
    summary: "Após acerto: resistência ou perde a próxima ação.",
  },
  {
    name: "Cura Interior",
    costNative: 20,
    costOthers: 40,
    chiCost: 2,
    summary: "Recupera 1d8 + nível de Chi PV (1× por encontro).",
  },
  {
    name: "Golpes Potencializados",
    costNative: 25,
    costOthers: 50,
    chiCost: 2,
    summary: "Ataques desarmados contam como armas mágicas no combate.",
  },
  {
    name: "Evasão",
    costNative: 30,
    costOthers: 60,
    chiCost: 2,
    summary: "Em área: sucesso = sem dano; falha = metade (sem armadura).",
  },
  {
    name: "Passo Fantasma",
    costNative: 30,
    costOthers: 60,
    chiCost: 2,
    summary: "1 rodada: deslocamento ×3, ignora terreno difícil, etc.",
  },
  {
    name: "Mente Inabalável",
    costNative: 40,
    costOthers: 80,
    chiCost: 3,
    summary: "+50% resistência vs Encantamentos, Medo ou Confusão (1 turno).",
  },
  {
    name: "Corpo Invisível",
    costNative: 45,
    costOthers: 90,
    chiCost: 3,
    summary: "Invisível por 3 rodadas; termina ao atacar.",
  },
  {
    name: "Purificação",
    costNative: 50,
    costOthers: 120,
    chiCost: 3,
    summary: "Remove veneno ou doença de si mesmo.",
  },
  {
    name: "Linguagem Universal",
    costNative: 50,
    costOthers: 120,
    chiCost: 3,
    summary: "Compreende e fala qualquer idioma por 1 turno.",
  },
  {
    name: "Palma Vibrante",
    costNative: 55,
    costOthers: 140,
    chiCost: 3,
    summary: "1×/dia: toque; resistência ou 3d10 (metade se sucesso).",
  },
  {
    name: "Passo Dimensional",
    costNative: 60,
    costOthers: 150,
    chiCost: 3,
    summary: "Teleporta até 9 m para local visível.",
  },
  {
    name: "Alma Adamantina",
    costNative: 80,
    costOthers: 150,
    chiCost: 5,
    summary: "+50% em todos os testes de resistência por 1 hora.",
  },
  {
    name: "Corpo de Ferro",
    costNative: 90,
    costOthers: 180,
    chiCost: 5,
    summary: "−5 dano físico por ataque, 5 rodadas.",
  },
  {
    name: "Toque Paralisante",
    costNative: 110,
    costOthers: 220,
    chiCost: 5,
    summary: "Resistência ou paralisado por 1d4 rodadas.",
  },
  {
    name: "Forma Etérea",
    costNative: 130,
    costOthers: 260,
    chiCost: 7,
    summary: "Forma etérea por 5 rodadas.",
  },
  {
    name: "Serenidade Absoluta",
    costNative: 150,
    costOthers: 300,
    chiCost: 6,
    summary: "Recupera 50% dos PV máximos instantaneamente.",
  },
  {
    name: "Quivering Palm Verdadeiro",
    costNative: 200,
    costOthers: 500,
    chiCost: 8,
    summary: "Marca o alvo; em até 24h: morte ou 10d10 (1×/semana).",
  },
];

export function getChiTechniqueCost(
  technique: Pick<ChiTechniqueDef, "costNative" | "costOthers">,
  className: string,
): number {
  return className === "Monge" ? technique.costNative : technique.costOthers;
}

export function findChiTechnique(name: string): ChiTechniqueDef | undefined {
  return CHI_TECHNIQUES.find((t) => t.name === name);
}
