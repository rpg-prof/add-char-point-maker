// ===== RACES =====
export interface RaceOption {
  name: string;
  cost: number;
}

export const races: RaceOption[] = [
  { name: "Humano", cost: 0 },
  { name: "Anão", cost: 10 },
  { name: "Elfo", cost: 10 },
  { name: "Gnomo", cost: 5 },
  { name: "Halfling", cost: 5 },
  { name: "Meio-Elfo", cost: 10 },
];

// ===== CLASSES =====
export interface ClassOption {
  name: string;
  cost: number;
}

export const classes: ClassOption[] = [
  { name: "Sem Classe", cost: 0 },
  { name: "Guerreiro", cost: 5 },
  { name: "Paladino", cost: 10 },
  { name: "Ranger", cost: 15 },
  { name: "Ladrão", cost: 10 },
  { name: "Bardo", cost: 15 },
  { name: "Sacerdote", cost: 15 },
  { name: "Arcano", cost: 20 },
];

// ===== SOCIAL CLASS =====
export interface SocialClassOption {
  name: string;
  cost: number;
  capital: string;
}

export const socialClasses: SocialClassOption[] = [
  { name: "Escravo", cost: -40, capital: "0" },
  { name: "Classe baixa", cost: -20, capital: "40 p.o." },
  { name: "Classe média baixa", cost: 0, capital: "80 p.o." },
  { name: "Classe média alta", cost: 20, capital: "160 p.o." },
  { name: "Classe alta / Nobreza menor", cost: 30, capital: "320 p.o." },
  { name: "Nobreza Maior", cost: 50, capital: "640 p.o." },
];

// ===== ADVANTAGES / DISADVANTAGES =====
export interface AdvantageOption {
  name: string;
  cost: number;
  type: "advantage" | "disadvantage";
  severity?: "moderate" | "severe";
  description?: string;
}

export const generalAdvantages: AdvantageOption[] = [
  { name: "Afinado: Canto", cost: 5, type: "advantage", description: "O personagem possui talento natural para o canto, podendo entreter e impressionar com sua voz." },
  { name: "Afinado: Instrumento", cost: 4, type: "advantage", description: "O personagem possui talento natural com instrumentos musicais, podendo tocar com habilidade acima da média." },
  { name: "Ambidestria", cost: 4, type: "advantage", description: "O personagem possui habilidade igual no uso das duas mãos. Pode usar armas, escudo e realizar atos de força igualmente com ambas as mãos. Não sofre penalidades na primeira mão e somente -2 na outra ao lutar com duas armas." },
  { name: "Audição Aguçada", cost: 5, type: "advantage", description: "Excelente audição. +1 para evitar surpresa por ruído. Ladrões ganham +10% em ouvir ruídos. Halflings compram por 1 ponto a menos." },
  { name: "Bússola Interna", cost: 5, type: "advantage", description: "Ideia geral de localização e direção ao ar livre. Chance de se perder reduzida em 5%. +1 em testes de Navegação." },
  { name: "Cicatrização Rápida", cost: 6, type: "advantage", description: "Recupera 1 PV em 2-12 turnos após ferimento. Cura natural de 2 PV/dia ao invés de 1." },
  { name: "Conhecimento Obscuro", cost: 4, type: "advantage", description: "Mente que grava pequenos pedaços de informação. Teste de Inteligência/Conhecimento para lembrar fatos triviais sobre um assunto. Gnomos compram por 1 ponto a menos." },
  { name: "Empatia", cost: 4, type: "advantage", description: "Habilidade natural de sentir motivações, emoções e intenções dos outros. Após observar PdMs por 1d6 rodadas, teste de Sabedoria/Intuição para entender seus planos." },
  { name: "Empatia com Animais", cost: 4, type: "advantage", description: "Habilidade natural para relacionar-se com animais. Recebe reação positiva de animais domesticados. Teste de Sabedoria/Força-de-Vontade para acalmar ou encorajar animais." },
  { name: "Habilidade Artística", cost: 4, type: "advantage", description: "Talento com pincel, tinta, carvão e faca de escultor. Pode desenhar mapas realistas e moldar objetos. Com treinamento, cria trabalhos de mérito artístico valendo 1-50% a mais." },
  { name: "Juntas Flexíveis", cost: 4, type: "advantage", description: "Habilidade de livrar-se de cordas, algemas e amarras. Teste de Destreza/Agilidade, 1d6 rodadas por membro. Metal usa metade da Agilidade. Halflings ganham +1." },
  { name: "Lábia", cost: 4, type: "advantage", description: "Talento de dissuadir suspeitas de PdMs. Deve falar o mesmo idioma. Teste de Sabedoria/Intuição para convencer guardas, acalmar hostis ou retirar suspeitas." },
  { name: "Memória Precisa", cost: 4, type: "advantage", description: "Capacidade de lembrar detalhes com precisão incomum, como rostos, conversas e locais visitados." },
  { name: "Olfato Aguçado", cost: 6, type: "advantage", description: "Sentido de olfato excepcionalmente apurado, capaz de detectar odores sutis e identificar substâncias pelo cheiro." },
  { name: "Paladar Aguçado", cost: 4, type: "advantage", description: "Paladar refinado, capaz de detectar sabores sutis, identificar ingredientes e perceber venenos em alimentos." },
  { name: "Personificação", cost: 5, type: "advantage", description: "Habilidade de se passar por outra pessoa, imitando voz, maneirismos e aparência de forma convincente." },
  { name: "Sedução", cost: 4, type: "advantage", description: "Talento natural para atrair e influenciar outros através de charme e carisma pessoal." },
  { name: "Senso do Clima", cost: 4, type: "advantage", description: "Habilidade de prever mudanças climáticas com antecedência, sentindo alterações na pressão e temperatura." },
  { name: "Sono Leve", cost: 5, type: "advantage", description: "Acorda facilmente com qualquer ruído ou distúrbio, dificilmente sendo pego de surpresa enquanto dorme." },
  { name: "Sorte", cost: 6, type: "advantage", description: "O personagem possui uma sorte incomum, podendo refazer um teste por sessão ou receber bônus em situações críticas." },
  { name: "Tato Aguçado", cost: 4, type: "advantage", description: "Sentido de tato excepcionalmente apurado, capaz de detectar texturas, vibrações e detalhes através do toque." },
  { name: "Vigilância", cost: 6, type: "advantage", description: "Estado constante de alerta. Dificilmente é pego de surpresa e recebe bônus em testes de percepção." },
  { name: "Visão Aguçada", cost: 5, type: "advantage", description: "Visão excepcionalmente apurada, capaz de perceber detalhes a grandes distâncias e em condições de pouca luz." },
  { name: "Bom Senso", cost: 5, type: "advantage", description: "O mestre pode alertar o jogador quando ele está prestes a tomar uma decisão claramente imprudente." },
  { name: "Fleuma (não tem medo)", cost: 6, type: "advantage", description: "O personagem é imune a medo natural e recebe bônus contra efeitos mágicos de medo e pânico." },
];

export const generalDisadvantages: AdvantageOption[] = [
  { name: "Alergias (Moderada)", cost: -3, type: "disadvantage", severity: "moderate" },
  { name: "Alergias (Severa)", cost: -8, type: "disadvantage", severity: "severe" },
  { name: "Altruísmo (Moderado)", cost: -2, type: "disadvantage", severity: "moderate" },
  { name: "Altruísmo (Severo)", cost: -7, type: "disadvantage", severity: "severe" },
  { name: "Avareza", cost: -7, type: "disadvantage" },
  { name: "Cleptomania (Moderada)", cost: -3, type: "disadvantage", severity: "moderate" },
  { name: "Cleptomania (Severa)", cost: -7, type: "disadvantage", severity: "severe" },
  { name: "Complexo de Culpa", cost: -5, type: "disadvantage" },
  { name: "Covardia (Moderada)", cost: -7, type: "disadvantage", severity: "moderate" },
  { name: "Covardia (Severa)", cost: -15, type: "disadvantage", severity: "severe" },
  { name: "Curiosidade (Moderada)", cost: -4, type: "disadvantage", severity: "moderate" },
  { name: "Curiosidade (Severa)", cost: -8, type: "disadvantage", severity: "severe" },
  { name: "Daltônico", cost: -3, type: "disadvantage" },
  { name: "Desastrado (Moderado)", cost: -4, type: "disadvantage", severity: "moderate" },
  { name: "Desastrado (Severo)", cost: -8, type: "disadvantage", severity: "severe" },
  { name: "Excesso de Confiança (Moderado)", cost: -2, type: "disadvantage", severity: "moderate" },
  { name: "Excesso de Confiança (Severo)", cost: -7, type: "disadvantage", severity: "severe" },
  { name: "Fácil Contusão", cost: -8, type: "disadvantage" },
  { name: "Fala Presa", cost: -6, type: "disadvantage" },
  { name: "Falta De Sorte", cost: -8, type: "disadvantage" },
  { name: "Fanatismo", cost: -8, type: "disadvantage" },
  { name: "Honestidade Compulsiva", cost: -8, type: "disadvantage" },
  { name: "Impulsividade (Moderada)", cost: -3, type: "disadvantage", severity: "moderate" },
  { name: "Impulsividade (Severa)", cost: -7, type: "disadvantage", severity: "severe" },
  { name: "Inimigo Poderoso", cost: -10, type: "disadvantage" },
  { name: "Mau Temperamento", cost: -6, type: "disadvantage" },
  { name: "Medo: Água (Moderado)", cost: -6, type: "disadvantage", severity: "moderate" },
  { name: "Medo: Água (Severo)", cost: -12, type: "disadvantage", severity: "severe" },
  { name: "Medo: Altura (Moderado)", cost: -5, type: "disadvantage", severity: "moderate" },
  { name: "Medo: Altura (Severo)", cost: -10, type: "disadvantage", severity: "severe" },
  { name: "Medo: Escuro (Moderado)", cost: -5, type: "disadvantage", severity: "moderate" },
  { name: "Medo: Escuro (Severo)", cost: -11, type: "disadvantage", severity: "severe" },
  { name: "Medo: Magia (Moderado)", cost: -8, type: "disadvantage", severity: "moderate" },
  { name: "Medo: Magia (Severo)", cost: -14, type: "disadvantage", severity: "severe" },
  { name: "Medo: Mortos-Vivos (Moderado)", cost: -8, type: "disadvantage", severity: "moderate" },
  { name: "Medo: Mortos-Vivos (Severo)", cost: -14, type: "disadvantage", severity: "severe" },
  { name: "Megalomania (Moderada)", cost: -2, type: "disadvantage", severity: "moderate" },
  { name: "Megalomania (Severa)", cost: -7, type: "disadvantage", severity: "severe" },
  { name: "Mentalidade de Escravo", cost: -4, type: "disadvantage" },
  { name: "Personalidade Irritante", cost: -6, type: "disadvantage" },
  { name: "Piromania (Moderada)", cost: -3, type: "disadvantage", severity: "moderate" },
  { name: "Piromania (Severa)", cost: -7, type: "disadvantage", severity: "severe" },
  { name: "Preguiça", cost: -7, type: "disadvantage" },
  { name: "Sadismo", cost: -4, type: "disadvantage" },
  { name: "Sono Profundo", cost: -7, type: "disadvantage" },
  { name: "Teimosia (Moderada)", cost: -2, type: "disadvantage", severity: "moderate" },
  { name: "Teimosia (Severa)", cost: -6, type: "disadvantage", severity: "severe" },
  { name: "Vício (Moderado)", cost: -5, type: "disadvantage", severity: "moderate" },
  { name: "Vício (Severo)", cost: -10, type: "disadvantage", severity: "severe" },
];

// ===== SKILLS =====
export interface SkillOption {
  name: string;
  cost: number;
  attribute: string;
  group: string;
}

export const skills: SkillOption[] = [
  // Grupo Geral
  { name: "Agricultura", cost: 3, attribute: "Inteligência", group: "Geral" },
  { name: "Alfaiate", cost: 3, attribute: "Destreza/Inteligência", group: "Geral" },
  { name: "Artesanato em Couro", cost: 3, attribute: "Inteligência/Destreza", group: "Geral" },
  { name: "Cantar", cost: 2, attribute: "Carisma", group: "Geral" },
  { name: "Carpintaria", cost: 3, attribute: "Força/Inteligência", group: "Geral" },
  { name: "Cavalgar Criatura Alada", cost: 4, attribute: "Sabedoria/Destreza", group: "Geral" },
  { name: "Cavalgar Criatura Terrestre", cost: 2, attribute: "Sabedoria/Destreza", group: "Geral" },
  { name: "Cerâmica", cost: 3, attribute: "Destreza", group: "Geral" },
  { name: "Conhecimento do Clima", cost: 2, attribute: "Sabedoria", group: "Geral" },
  { name: "Cozinhar", cost: 3, attribute: "Inteligência", group: "Geral" },
  { name: "Dança", cost: 2, attribute: "Destreza/Carisma", group: "Geral" },
  { name: "Engenharia", cost: 4, attribute: "Inteligência/Sabedoria", group: "Geral" },
  { name: "Escultor", cost: 2, attribute: "Destreza/Sabedoria", group: "Geral" },
  { name: "Etiqueta", cost: 2, attribute: "Carisma/Sabedoria", group: "Geral" },
  { name: "Forjaria", cost: 4, attribute: "Força/Inteligência", group: "Geral" },
  { name: "Heráldica", cost: 2, attribute: "Inteligência", group: "Geral" },
  { name: "Idiomas Modernos", cost: 2, attribute: "Inteligência", group: "Geral" },
  { name: "Instrumento Musical", cost: 2, attribute: "Carisma", group: "Geral" },
  { name: "Jogo", cost: 2, attribute: "Sabedoria/Inteligência", group: "Geral" },
  { name: "Lidar com Animais", cost: 3, attribute: "Sabedoria", group: "Geral" },
  { name: "Natação", cost: 2, attribute: "Força", group: "Geral" },
  { name: "Navegação", cost: 3, attribute: "Inteligência/Sabedoria", group: "Geral" },
  { name: "Pesca", cost: 3, attribute: "Sabedoria/Inteligência", group: "Geral" },
  { name: "Pintura", cost: 2, attribute: "Destreza/Sabedoria", group: "Geral" },
  { name: "Preparar Bebidas", cost: 3, attribute: "Inteligência", group: "Geral" },
  { name: "Preparar Fogueira", cost: 2, attribute: "Sabedoria/Inteligência", group: "Geral" },
  { name: "Uso de Cordas", cost: 2, attribute: "Destreza/Sabedoria", group: "Geral" },
  { name: "Liderança", cost: 3, attribute: "Carisma", group: "Geral" },
  { name: "Pressentir Perigo", cost: 4, attribute: "Sabedoria", group: "Geral" },
  { name: "Vontade de Ferro", cost: 2, attribute: "Sabedoria/Constituição", group: "Geral" },
  // Sacerdotes
  { name: "Astrologia", cost: 3, attribute: "Sabedoria/Inteligência", group: "Sacerdote" },
  { name: "Conhecimento Místico", cost: 3, attribute: "Inteligência", group: "Sacerdote" },
  { name: "Cura", cost: 4, attribute: "Sabedoria/Carisma", group: "Sacerdote" },
  { name: "Herbalismo", cost: 3, attribute: "Inteligência/Sabedoria", group: "Sacerdote" },
  { name: "História Antiga", cost: 3, attribute: "Sabedoria/Inteligência", group: "Sacerdote" },
  { name: "História Local", cost: 2, attribute: "Inteligência/Carisma", group: "Sacerdote" },
  { name: "Idiomas Antigos", cost: 4, attribute: "Inteligência", group: "Sacerdote" },
  { name: "Ler/Escrever", cost: 2, attribute: "Inteligência", group: "Sacerdote" },
  { name: "Religião", cost: 2, attribute: "Sabedoria", group: "Sacerdote" },
  // Ladrão / Bardo
  { name: "Acrobacia", cost: 3, attribute: "Destreza/Força", group: "Ladrão/Bardo" },
  { name: "Andar na Corda Bamba", cost: 3, attribute: "Destreza", group: "Ladrão/Bardo" },
  { name: "Arremessador", cost: 2, attribute: "Destreza/Força", group: "Ladrão/Bardo" },
  { name: "Avaliação", cost: 2, attribute: "Inteligência/Sabedoria", group: "Ladrão/Bardo" },
  { name: "Criptografia", cost: 3, attribute: "Inteligência/Sabedoria", group: "Ladrão/Bardo" },
  { name: "Disfarce", cost: 4, attribute: "Sabedoria/Carisma", group: "Ladrão/Bardo" },
  { name: "Falsificação", cost: 3, attribute: "Destreza/Sabedoria", group: "Ladrão/Bardo" },
  { name: "Lapidação", cost: 3, attribute: "Destreza", group: "Ladrão/Bardo" },
  { name: "Leitura de Lábios", cost: 3, attribute: "Inteligência/Sabedoria", group: "Ladrão/Bardo" },
  { name: "Malabarismo", cost: 3, attribute: "Destreza", group: "Ladrão/Bardo" },
  { name: "Saltar", cost: 2, attribute: "Força/Destreza", group: "Ladrão/Bardo" },
  { name: "Ventriloquismo", cost: 4, attribute: "Inteligência", group: "Ladrão/Bardo" },
  // Guerreiro / Paladino / Ranger
  { name: "Caça", cost: 2, attribute: "Sabedoria", group: "Guerreiro" },
  { name: "Conduzir Carruagem", cost: 4, attribute: "Destreza/Sabedoria", group: "Guerreiro" },
  { name: "Conhecimento dos Animais", cost: 3, attribute: "Inteligência/Sabedoria", group: "Guerreiro" },
  { name: "Correr", cost: 2, attribute: "Força/Constituição", group: "Guerreiro" },
  { name: "Fabricação de Arcos e Flechas", cost: 5, attribute: "Inteligência/Destreza", group: "Guerreiro" },
  { name: "Fazer Armaduras", cost: 5, attribute: "Inteligência/Força", group: "Guerreiro" },
  { name: "Forjar Armas", cost: 5, attribute: "Inteligência/Destreza", group: "Guerreiro" },
  { name: "Montanhismo", cost: 4, attribute: "Força/Sabedoria", group: "Guerreiro" },
  { name: "Rastrear", cost: 4, attribute: "Sabedoria", group: "Guerreiro" },
  { name: "Sobrevivência", cost: 3, attribute: "Inteligência/Sabedoria", group: "Guerreiro" },
  { name: "Vigor", cost: 2, attribute: "Constituição", group: "Guerreiro" },
  // Magos
  { name: "Astronomia", cost: 2, attribute: "Inteligência", group: "Mago" },
  { name: "Magia Tática", cost: 3, attribute: "Inteligência", group: "Mago" },
  { name: "Pesquisar", cost: 1, attribute: "Inteligência", group: "Mago" },
];

// ===== ATTRIBUTES =====
export const attributeNames = [
  "Força",
  "Destreza", 
  "Constituição",
  "Inteligência",
  "Sabedoria",
  "Carisma",
] as const;

export type AttributeName = typeof attributeNames[number];

// Cost table: attribute value -> cumulative cost
// Base value is 8 (costs 0). Each point costs more as you go higher.
export const attributeCosts: Record<number, number> = {
  3: -10,
  4: -8,
  5: -6,
  6: -4,
  7: -2,
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 5,
  13: 7,
  14: 10,
  15: 13,
  16: 17,
  17: 22,
  18: 28,
};
