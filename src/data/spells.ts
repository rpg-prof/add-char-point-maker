import mageSpellIndex from "./spellls/mage-spells.json";

export interface Spell {
  name: string;
  level: number;
  school: string;
  range: string;
  duration: string;
  castingTime: string;
  components?: string;
  area?: string;
  description: string;
}

export interface SpellList {
  type: "arcane" | "divine";
  label: string;
  classes: string[];
  spells: Spell[];
}

// Eagerly import all individual mage spell JSON files
const mageSpellFiles = import.meta.glob<{
  name: string;
  level: number;
  school: string;
  castingTime: string;
  duration: string;
  range: string;
  area?: string;
  components?: string;
  description: string;
}>("./spellls/mage-spells/*.json", { eager: true });

// Build mage spells array from index + detail files
function loadMageSpells(): Spell[] {
  const spells: Spell[] = [];
  const byLevel = mageSpellIndex["by-level"] as Record<string, Array<{ name: string; file: string; level: number; school: string }>>;

  for (const [, entries] of Object.entries(byLevel)) {
    for (const entry of entries) {
      const filePath = `./spellls/${entry.file}`;
      const detail = mageSpellFiles[filePath];
      if (detail) {
        spells.push({
          name: detail.name || entry.name,
          level: detail.level ?? entry.level,
          school: detail.school || entry.school,
          range: detail.range || "",
          duration: detail.duration || "",
          castingTime: detail.castingTime || "",
          components: detail.components,
          area: detail.area,
          description: detail.description || "",
        });
      } else {
        // Fallback: use index data only
        spells.push({
          name: entry.name,
          level: entry.level,
          school: entry.school,
          range: "",
          duration: "",
          castingTime: "",
          description: "",
        });
      }
    }
  }

  return spells;
}

export const arcaneSpells: Spell[] = loadMageSpells();

// Divine spells - keep hardcoded until divine JSON files are added
export const divineSpells: Spell[] = [
  // === Level 1 ===
  { name: "Abençoar", level: 1, school: "Conjuração", range: "18m", duration: "6 rodadas", castingTime: "1 rodada", components: "V, S, M", description: "Aliados em uma área de 15m x 15m ganham +1 nas jogadas de ataque e moral. Não pode ser conjurada em combate já iniciado. A versão reversa, Amaldiçoar, causa -1 (teste de resistência)." },
  { name: "Comando", level: 1, school: "Encantamento", range: "9m", duration: "1 rodada", castingTime: "1", components: "V", description: "O sacerdote pronuncia uma única palavra de comando (Fuja, Pare, Caia, etc.) que a criatura-alvo deve obedecer. Teste de resistência para negar. Não funciona em mortos-vivos com 6 DV+ ou criaturas de Inteligência 13+." },
  { name: "Criar Água", level: 1, school: "Alteração", range: "9m", duration: "Permanente", castingTime: "1 rodada", components: "V, S, M", description: "Cria 15 litros de água pura por nível do conjurador. A água pode encher recipientes ou criar uma pequena poça. A versão reversa, Destruir Água, elimina a mesma quantidade." },
  { name: "Curar Ferimentos Leves", level: 1, school: "Necromancia", range: "Toque", duration: "Permanente", castingTime: "5", components: "V, S", description: "Cura 1d8 pontos de vida pelo toque. Não afeta mortos-vivos, construtos ou criaturas extraplanares. A versão reversa, Causar Ferimentos Leves, causa 1d8 de dano (requer ataque de toque)." },
  { name: "Detectar Mal", level: 1, school: "Divinação", range: "36m", duration: "1 turno + 5 rodadas/nível", castingTime: "1 rodada", components: "V, S, M", description: "Permite detectar emanações malignas em criaturas, objetos ou locais em um cone de 3m de largura e 36m de comprimento. Intensidade varia com a força do mal." },
  { name: "Detectar Magia", level: 1, school: "Divinação", range: "0", duration: "1 turno", castingTime: "1 rodada", components: "V, S, M", description: "O sacerdote detecta emanações mágicas em um caminho de 3m de largura e 9m de comprimento. A intensidade da aura pode ser determinada com concentração adicional." },
  { name: "Luz", level: 1, school: "Alteração", range: "36m", duration: "6 turnos + 1 turno/nível", castingTime: "4", components: "V, S", description: "Cria um globo de luz equivalente a uma tocha (raio de 6m). Pode ser lançada em um objeto. Se lançada nos olhos, teste de resistência para evitar cegueira temporária. A versão reversa cria Escuridão." },
  { name: "Proteção contra o Mal", level: 1, school: "Abjuração", range: "Toque", duration: "3 rodadas/nível", castingTime: "4", components: "V, S, M", description: "O alvo recebe -2 em ataques de criaturas malignas e +2 em testes de resistência contra ataques delas. Criaturas encantadas/conjuradas não podem tocar o protegido." },
  { name: "Purificar Comida e Bebida", level: 1, school: "Alteração", range: "9m", duration: "Permanente", castingTime: "1 rodada", components: "V, S", description: "Torna comida e água estragada, envenenada ou contaminada pura e segura para consumo. Afeta aproximadamente 500g/nível de comida ou 500ml/nível de líquido." },
  { name: "Remover Medo", level: 1, school: "Abjuração", range: "3m", duration: "Especial", castingTime: "1", components: "V, S", description: "Remove efeitos de medo de 1 criatura +1/4 níveis. Alvos sob efeito de medo mágico ganham um novo teste de resistência com +1/nível. A versão reversa causa medo (teste de resistência)." },
  { name: "Santuário", level: 1, school: "Abjuração", range: "0", duration: "2 rodadas + 1 rodada/nível", castingTime: "4", components: "V, S, M", description: "Inimigos que tentam atacar o sacerdote devem fazer teste de resistência ou desistir do ataque e escolher outro alvo. Se o sacerdote atacar, o efeito termina." },
  // === Level 2 ===
  { name: "Augúrio", level: 2, school: "Divinação", range: "0", duration: "Especial", castingTime: "2 rodadas", components: "V, S, M", description: "Prevê se uma ação planejada nas próximas 3 turnos trará resultado favorável (ventura), desfavorável (desventura), ambos ou nenhum. Chance de 70% + 1%/nível de acerto." },
  { name: "Atrasar Veneno", level: 2, school: "Necromancia", range: "Toque", duration: "1h/nível", castingTime: "1", components: "V, S, M", description: "Suspende os efeitos de veneno no alvo pelo tempo da duração. O veneno continua no sistema e fará efeito quando a magia terminar, a menos que seja neutralizado." },
  { name: "Encontrar Armadilhas", level: 2, school: "Divinação", range: "9m", duration: "3 turnos", castingTime: "5", components: "V, S", description: "Revela a presença de armadilhas mecânicas e mágicas em um caminho de 3m de largura. Não identifica o tipo nem a localização exata, apenas indica a direção geral." },
  { name: "Falar com Animais", level: 2, school: "Alteração", range: "0", duration: "2 rodadas/nível", castingTime: "5", components: "V, S", description: "Permite comunicação com animais normais ou gigantes. Os animais cooperam se possível, mas não são controlados. Podem realizar tarefas simples se bem dispostos." },
  { name: "Imobilizar Pessoa", level: 2, school: "Encantamento", range: "36m", duration: "2 rodadas/nível", castingTime: "5", components: "V, S, M", description: "Paralisa 1d4 humanos, semi-humanos ou humanoides (1 alvo = -1 no teste de resistência, ou até 4 alvos = sem penalidade). Criaturas paralisadas estão conscientes mas não podem agir." },
  { name: "Resistir ao Fogo", level: 2, school: "Alteração", range: "Toque", duration: "1 rodada/nível", castingTime: "5", components: "V, S, M", description: "Concede resistência ao calor e fogo. Fogo normal não causa dano. Contra fogo mágico, o alvo ganha +3 no teste de resistência e dano reduzido em -1/dado (mínimo 1/dado)." },
  { name: "Silêncio 4,5m", level: 2, school: "Alteração", range: "36m", duration: "2 rodadas/nível", castingTime: "5", components: "V, S", description: "Cria uma esfera de silêncio absoluto de 4,5m de raio. Nenhum som entra ou sai. Impede conjuração de magias com componente verbal. Se lançada em uma criatura, teste de resistência." },
  { name: "Suporte Espiritual", level: 2, school: "Evocação", range: "0", duration: "3 rodadas + 1 rodada/nível", castingTime: "5", components: "V, S, M", description: "Cria uma arma espiritual que flutua e ataca inimigos do sacerdote. A arma ataca como o sacerdote mas com +1. Causa 1d6+1 de dano. Não pode ser atacada fisicamente." },
  // === Level 3 ===
  { name: "Curar Cegueira ou Surdez", level: 3, school: "Abjuração", range: "Toque", duration: "Permanente", castingTime: "1 rodada", components: "V, S", description: "Remove cegueira ou surdez, seja causada por doença, ferimento ou magia. Não restaura membros perdidos. A versão reversa causa Cegueira ou Surdez (teste de resistência)." },
  { name: "Curar Doença", level: 3, school: "Abjuração", range: "Toque", duration: "Permanente", castingTime: "1 rodada", components: "V, S", description: "Cura todas as doenças do alvo, incluindo doenças mágicas como Licantropia (se tratada no primeiro dia). Não restaura PV perdidos pela doença. A versão reversa, Causar Doença, infecta o alvo." },
  { name: "Curar Ferimentos Graves", level: 3, school: "Necromancia", range: "Toque", duration: "Permanente", castingTime: "7", components: "V, S", description: "Cura 2d8+1 pontos de vida pelo toque. Não afeta mortos-vivos, construtos ou criaturas extraplanares. A versão reversa causa 2d8+1 de dano." },
  { name: "Dissipar Magia", level: 3, school: "Abjuração", range: "18m", duration: "Instantâneo", castingTime: "6", components: "V, S", description: "Remove efeitos mágicos em uma esfera de 9m de raio. Chance base de 50%, ±5% por diferença de nível. Funciona contra magias arcanas e divinas." },
  { name: "Glifo de Proteção", level: 3, school: "Abjuração/Evocação", range: "Toque", duration: "Até ativação", castingTime: "Especial", components: "V, S, M", description: "Inscreve um glifo protetor em um objeto ou área. Quando ativado por intrusos, causa dano de energia (elétrico, fogo, frio, etc.) de 2/nível do conjurador. O sacerdote e aliados designados não ativam." },
  { name: "Localizar Objeto", level: 3, school: "Divinação", range: "18m + 3m/nível", duration: "8 horas", castingTime: "1 turno", components: "V, S, M", description: "Indica a direção de um objeto familiar ou de tipo específico. Pode buscar objetos religiosos, armas ou itens específicos conhecidos pelo sacerdote. Chumbo bloqueia a magia." },
  { name: "Oração", level: 3, school: "Conjuração", range: "0", duration: "1 rodada/nível", castingTime: "6", components: "V, S, M", description: "Aliados em um raio de 18m ganham +1 em ataque, dano e testes de resistência. Inimigos na mesma área sofrem -1 nos mesmos testes. Requer concentração contínua." },
  { name: "Proteção contra Fogo", level: 3, school: "Abjuração", range: "Toque", duration: "Especial", castingTime: "6", components: "V, S, M", description: "Se conjurada em si mesmo, imunidade total a fogo normal e +4/metade do dano contra fogo mágico até absorver 12/nível de dano. Em outros, apenas +4 em testes de resistência." },
  { name: "Remover Maldição", level: 3, school: "Abjuração", range: "Toque", duration: "Permanente", castingTime: "6", components: "V, S", description: "Remove uma maldição de um objeto ou pessoa. Não remove a maldição do item em si (ex: espada amaldiçoada ainda é amaldiçoada, mas pode ser largada). A versão reversa lança uma maldição." },
  { name: "Rocha em Lama", level: 3, school: "Alteração", range: "36m", duration: "Especial", castingTime: "6", components: "V, S, M", description: "Transforma um volume de rocha de até 6m x 6m x 6m em lama espessa. Criaturas na área ficam presas. A versão reversa solidifica lama em rocha permanentemente." },
];

export const spellLists: SpellList[] = [
  {
    type: "arcane",
    label: "Magias Arcanas",
    classes: ["Arcano", "Bardo"],
    spells: arcaneSpells,
  },
  {
    type: "divine",
    label: "Magias Divinas",
    classes: ["Sacerdote", "Paladino", "Ranger"],
    spells: divineSpells,
  },
];

export const spellcastingClasses = ["Arcano", "Bardo", "Sacerdote", "Paladino", "Ranger"];
