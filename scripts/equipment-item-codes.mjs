#!/usr/bin/env node
/**
 * Gera códigos em inglês para itens de catálogo a partir do id legado ou nome.
 */
import { slugify } from "./spell-metadata-utils.mjs";

/** Nome de exibição (PT) → code em inglês. */
export const ENGLISH_CODE_BY_NAME = {
  // Armaduras e escudos
  "Armadura Completa": "full-plate",
  "Armadura de Batalha": "field-plate",
  "Armadura de Bronze": "bronze-plate",
  "Armadura Simples": "plate-mail",
  Brigandina: "brigandine",
  Broquel: "buckler",
  Brunea: "brigandine-coat",
  "Corselete de Couro": "leather-cuirass",
  "Corselete de Couro Acolchoado": "padded-leather-cuirass",
  "Corselete de Couro Batido": "studded-leather-cuirass",
  "Cota de Malha": "chain-mail",
  "Cota de Talas": "scale-mail",
  "Escudo Corporal": "body-shield",
  "Escudo Médio": "medium-shield",
  "Escudo Pequeno": "small-shield",
  "Gibão de Peles": "hide-armor",
  Loriga: "hauberk",
  "Loriga Segmentada": "splint-mail",

  // Munição e suplementos de armas (não estão nos grupos de proficiência)
  "Flecha de caça": "hunting-arrow",
  "Flecha de guerra": "war-arrow",
  dardo: "crossbow-dart",
  "Quadrelo de mão": "hand-quarrel",
  "Quadrelo grande": "large-quarrel",
  "Quadrelo pequeno": "small-quarrel",
  "Chumbo de funda": "sling-bullet",
  "Dardo agulha": "needle-dart",
  "Dardo farpado": "barbed-dart",
};

/** Id legado (slug PT) → code em inglês. */
export const LEGACY_ID_TO_CODE = {
  acolchoado: "padded-leather-cuirass",
  couro: "leather-cuirass",
  "couro-batido": "studded-leather-cuirass",
  "armadura-placas-parcial": "splint-mail",
  "brunea-completa": "brigandine-coat",
  "brunea-parcial": "brigandine-coat",
  corselete: "padded-leather-cuirass",
  "corselete-acolchoado-parcial": "padded-leather-cuirass",
  "proteção-de-couro-ou-acolchoada": "padded-leather-cuirass",
  "arco-curto-composto": "composite-bow",
  "arco-longo-composto": "composite-bow",
  "adaga-ou-punhal": "dagger",
  "besta-de-mão": "repeating-crossbow",
  "espada-bastarda": "bastard-sword-one-handed",
  "espada-bastarda-2": "bastard-sword-two-handed",
  cimitarra: "short-scimitar",
};

const SEGMENT_EN = {
  armadura: "armor",
  completa: "full",
  batalha: "battle",
  bronze: "bronze",
  simples: "simple",
  couro: "leather",
  acolchoado: "padded",
  batido: "studded",
  malha: "mail",
  talas: "scale",
  escudo: "shield",
  pequeno: "small",
  medio: "medium",
  mediana: "medium",
  corporal: "body",
  corselete: "cuirass",
  brunea: "brigandine",
  brigandina: "brigandine",
  broquel: "buckler",
  loriga: "hauberk",
  segmentada: "splint",
  gibao: "hide",
  peles: "hide",
  cota: "coat",
  vaca: "cow",
  boi: "ox",
  bode: "goat",
  carneiro: "sheep",
  cavalo: "horse",
  camelo: "camel",
  asno: "donkey",
  jumento: "donkey",
  mula: "mule",
  cao: "dog",
  gato: "cat",
  porco: "pig",
  galinha: "chicken",
  pato: "duck",
  ganso: "goose",
  cisne: "swan",
  pombo: "pigeon",
  agulha: "needle",
  aljava: "quiver",
  ampulheta: "hourglass",
  anzol: "hook",
  apito: "whistle",
  balanca: "scale",
  cerveja: "beer",
  vinho: "wine",
  pao: "bread",
  queijo: "cheese",
  mel: "honey",
  sopa: "soup",
  carne: "meat",
  ovos: "eggs",
  verduras: "vegetables",
  refeicoes: "meals",
  acomodacao: "lodging",
  latrina: "latrine",
  festim: "feast",
  banquete: "banquet",
  comida: "food",
  estrebaria: "stable",
  montaria: "mount",
  montarias: "mounts",
  transporte: "transport",
  carroca: "cart",
  carruagem: "carriage",
  barco: "boat",
  navio: "ship",
  selas: "saddle",
  sela: "saddle",
  arreio: "harness",
  arreios: "harness",
  freio: "bridle",
  bridao: "bridle",
  cabo: "rope",
  corda: "rope",
  tocha: "torch",
  lanterna: "lantern",
  oleo: "oil",
  vela: "candle",
  mapa: "map",
  pergaminho: "parchment",
  tinta: "ink",
  pena: "quill",
  livro: "book",
  bolsa: "pouch",
  mochila: "backpack",
  saco: "bag",
  baú: "chest",
  bau: "chest",
  cama: "bed",
  cobertor: "blanket",
  tenda: "tent",
  odre: "waterskin",
  cantil: "flask",
  panela: "pot",
  caldeirao: "cauldron",
  faca: "knife",
  garfo: "fork",
  colher: "spoon",
  prato: "plate",
  copo: "cup",
  taça: "goblet",
  veste: "robe",
  tunica: "tunic",
  camisa: "shirt",
  calca: "pants",
  calças: "pants",
  bota: "boot",
  botas: "boots",
  luva: "glove",
  luvas: "gloves",
  capa: "cloak",
  chapeu: "hat",
  chapéu: "hat",
  cinto: "belt",
  anel: "ring",
  colar: "necklace",
  diaria: "daily",
  diária: "daily",
  mensal: "monthly",
  quarto: "room",
  comum: "common",
  pobre: "poor",
  boa: "good",
  simples: "simple",
  guerra: "war",
  caca: "hunting",
  caça: "hunting",
  sela: "saddle",
  tração: "draft",
  tracao: "draft",
  guerreiro: "war",
  leve: "light",
  pesado: "heavy",
  pesada: "heavy",
};

const SKIP_SEGMENTS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "em",
  "para",
  "por",
  "com",
  "e",
  "ou",
  "a",
  "o",
  "as",
  "os",
  "um",
  "uma",
  "1",
  "5",
  "litros",
  "litro",
  "refeição",
  "refeicao",
  "pessoa",
  "aposentos",
  "cidades",
  "jarro",
  "canora",
  "caça",
  "caca",
]);

function translateLegacyId(legacyId) {
  const parts = legacyId
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split("-")
    .filter((p) => p && !SKIP_SEGMENTS.has(p));

  const translated = parts.map((p) => SEGMENT_EN[p] ?? p);
  return translated.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "") || slugify(legacyId);
}

export function getEnglishItemCode(name, legacyId, usedCodes = new Set()) {
  let code =
    ENGLISH_CODE_BY_NAME[name] ??
    LEGACY_ID_TO_CODE[legacyId] ??
    translateLegacyId(legacyId);

  if (!usedCodes.has(code)) {
    usedCodes.add(code);
    return code;
  }

  let suffix = 2;
  while (usedCodes.has(`${code}-${suffix}`)) suffix++;
  const unique = `${code}-${suffix}`;
  usedCodes.add(unique);
  return unique;
}
