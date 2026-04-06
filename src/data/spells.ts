export interface Spell {
  name: string;
  level: number;
  school: string;
  range: string;
  duration: string;
  castingTime: string;
  components: string;
  description: string;
}

export interface SpellList {
  type: "arcane" | "divine";
  label: string;
  classes: string[];
  spells: Spell[];
}

export const arcaneSpells: Spell[] = [
  // === Level 1 ===
  { name: "Alarme", level: 1, school: "Abjuração", range: "3m", duration: "4h + 1h/nível", castingTime: "1 rodada", components: "V, S, M", description: "Protege uma área de até 6m de diâmetro. Quando uma criatura de tamanho Pequeno ou maior entra na área, o conjurador é alertado por um alarme mental (se estiver a até 1,5km) ou sonoro (audível a 18m)." },
  { name: "Amizade", level: 1, school: "Encantamento", range: "0", duration: "1d4 rodadas", castingTime: "1", components: "V, S, M", description: "Aumenta o Carisma do conjurador em 2d4 pontos temporariamente. Quando o efeito acaba, as criaturas afetadas percebem a manipulação e podem ficar hostis." },
  { name: "Armadura", level: 1, school: "Conjuração", range: "Toque", duration: "Especial", castingTime: "1 rodada", components: "V, S, M", description: "Cria um campo de força invisível equivalente a cota de malha (CA 6). Não pode ser combinada com armaduras físicas. Dura até ser dissipada ou absorver dano suficiente." },
  { name: "Compreender Idiomas", level: 1, school: "Alteração", range: "Toque", duration: "5 rodadas/nível", castingTime: "1 rodada", components: "V, S, M", description: "Permite ao alvo compreender (mas não falar) qualquer idioma falado ou escrito. Permite ler textos em línguas desconhecidas. Não decifra códigos ou mensagens ocultas." },
  { name: "Detectar Magia", level: 1, school: "Divinação", range: "0", duration: "2 rodadas/nível", castingTime: "1", components: "V, S", description: "O conjurador percebe emanações mágicas em um cone de 18m de comprimento e 3m de largura na extremidade. Pode determinar a intensidade (fraca, moderada, forte, avassaladora)." },
  { name: "Disco Flutuante", level: 1, school: "Evocação", range: "6m", duration: "3 turnos + 1 turno/nível", castingTime: "1", components: "V, S, M", description: "Cria um disco de força circular de 90cm de diâmetro que flutua a 90cm do chão. Segue o conjurador e pode carregar até 50kg/nível. Desaparece ao fim da duração." },
  { name: "Escudo", level: 1, school: "Evocação", range: "0", duration: "5 rodadas/nível", castingTime: "1", components: "V, S", description: "Cria um escudo invisível que melhora a CA do conjurador para 2 contra projéteis, 3 contra ataques corpo a corpo e 4 contra outros. Nega Mísseis Mágicos direcionados ao conjurador." },
  { name: "Identificar", level: 1, school: "Divinação", range: "0", duration: "1 rodada/nível", castingTime: "Especial", components: "V, S, M", description: "Permite determinar as propriedades mágicas de um item. Chance de 10%/nível de identificar cada propriedade. Requer uma pérola de 100 po que é consumida no processo." },
  { name: "Luz", level: 1, school: "Alteração", range: "18m", duration: "1 turno/nível", castingTime: "1", components: "V, M", description: "Cria um globo de luz equivalente à luz de uma tocha (raio de 6m). Pode ser lançada em um objeto ou ponto fixo. Pode ser usada para cegar temporariamente se lançada nos olhos (teste de resistência)." },
  { name: "Mãos Flamejantes", level: 1, school: "Alteração", range: "0", duration: "Instantâneo", castingTime: "1", components: "V, S", description: "Um jato de fogo sai das mãos do conjurador em leque de 1,5m de comprimento e 1,5m de largura na extremidade. Causa 1d3+2/nível de dano (máximo 1d3+20). Teste de resistência para metade do dano." },
  { name: "Mísseis Mágicos", level: 1, school: "Evocação", range: "18m + 3m/nível", duration: "Instantâneo", castingTime: "1", components: "V, S", description: "Cria mísseis de energia que acertam automaticamente. 1 míssil no 1º nível, +1 míssil a cada 2 níveis (máx 5). Cada míssil causa 1d4+1 de dano. Podem ser direcionados a alvos diferentes." },
  { name: "Queda Suave", level: 1, school: "Alteração", range: "3m/nível", duration: "1 rodada/nível", castingTime: "1", components: "V", description: "Reduz a velocidade de queda para 60cm/segundo. O alvo não sofre dano de queda enquanto o efeito durar. Pode afetar até o peso do conjurador + 100kg/nível." },
  { name: "Sono", level: 1, school: "Encantamento", range: "9m", duration: "5 rodadas/nível", castingTime: "1", components: "V, S, M", description: "Afeta 2d4 DV de criaturas em uma área de 9m de raio. Criaturas mais fracas são afetadas primeiro. Não afeta mortos-vivos. Criaturas adormecidas podem ser acordadas com um tapa ou dano." },
  { name: "Ventriloquismo", level: 1, school: "Ilusão", range: "Máx 18m/nível", duration: "4 rodadas + 1 rodada/nível", castingTime: "1", components: "V, M", description: "Permite ao conjurador projetar sua voz, fazendo parecer que ela vem de outro local dentro do alcance. Teste de Inteligência para perceber o truque." },

  // === Level 2 ===
  { name: "Alterar-se", level: 2, school: "Alteração", range: "0", duration: "3d4 rodadas + 2 rodadas/nível", castingTime: "2", components: "V, S", description: "Altera a aparência do conjurador, incluindo roupa e equipamento. Pode parecer de 30cm mais baixo ou mais alto. Não altera habilidades, apenas aparência visual." },
  { name: "Cegueira", level: 2, school: "Ilusão", range: "9m/nível", duration: "Especial", castingTime: "2", components: "V", description: "Cega magicamente uma criatura. Teste de resistência para negar. Se falhar, a cegueira dura até ser removida por Curar Cegueira, Dissipar Magia ou similar." },
  { name: "Darkvision", level: 2, school: "Alteração", range: "Toque", duration: "2h + 1h/nível", castingTime: "2", components: "V, S", description: "Concede ao alvo a capacidade de enxergar no escuro total até 18m. A visão é em preto e branco. Não funciona em escuridão mágica." },
  { name: "Detectar Invisibilidade", level: 2, school: "Divinação", range: "3m/nível", duration: "5 rodadas/nível", castingTime: "2", components: "V, S, M", description: "Permite ao conjurador ver criaturas e objetos invisíveis, etéreos ou astrais dentro do alcance. Criaturas ocultas por magia ilusória também são reveladas." },
  { name: "Escuridão", level: 2, school: "Alteração", range: "3m/nível", duration: "1 turno + 1 rodada/nível", castingTime: "2", components: "V, M", description: "Cria uma esfera de escuridão total de 4,5m de raio. Nenhuma luz normal penetra. Infravermência e ultravermência funcionam. Pode ser lançada em um objeto." },
  { name: "Força Espectral", level: 2, school: "Ilusão", range: "18m + 3m/nível", duration: "Especial", castingTime: "2", components: "V, S", description: "Cria a ilusão visual de qualquer objeto ou criatura. A ilusão segue um roteiro definido pelo conjurador. Se atacada, desaparece. Teste de resistência para desacreditar." },
  { name: "Invisibilidade", level: 2, school: "Ilusão", range: "Toque", duration: "Especial", castingTime: "2", components: "V, S, M", description: "Torna o alvo invisível, junto com seu equipamento. Termina se o alvo atacar ou conjurar uma magia. Criaturas que podem Detectar Invisibilidade ainda veem o alvo." },
  { name: "Levitar", level: 2, school: "Alteração", range: "6m/nível", duration: "1 turno/nível", castingTime: "2", components: "V, S, M", description: "Permite subir ou descer verticalmente a 6m por rodada. Pode levantar até 50kg/nível. Não permite movimento horizontal, mas o alvo pode se empurrar em superfícies." },
  { name: "Localizar Objeto", level: 2, school: "Divinação", range: "6m/nível", duration: "1 rodada/nível", castingTime: "2", components: "V, S, M", description: "Indica a direção de um objeto conhecido ou familiar dentro do alcance. Pode buscar por tipo genérico (a escada mais próxima) ou um objeto específico conhecido." },
  { name: "Raio Enfraquecedor", level: 2, school: "Encantamento", range: "3m + 3m/nível", duration: "1 rodada/nível", castingTime: "2", components: "V, S", description: "Um raio negro atinge o alvo, reduzindo sua Força em 1d4 pontos por nível do conjurador (máx 10d4). Teste de resistência para metade. Força não pode cair abaixo de 1." },
  { name: "Teia", level: 2, school: "Evocação", range: "1,5m/nível", duration: "2 turnos/nível", castingTime: "2", components: "V, S, M", description: "Cria uma massa de teias pegajosas que prendem criaturas em uma área de 2,5m³. Criaturas presas devem testar Força a cada rodada para se libertar. As teias são inflamáveis." },
  { name: "Trancar", level: 2, school: "Alteração", range: "3m/nível", duration: "Permanente", castingTime: "2", components: "V, S, M", description: "Tranca magicamente uma porta, baú ou portal. Funciona como se fosse trancado normalmente, mas só pode ser aberto por Dissipar Magia, Bater ou pelo próprio conjurador." },

  // === Level 3 ===
  { name: "Bola de Fogo", level: 3, school: "Evocação", range: "30m + 3m/nível", duration: "Instantâneo", castingTime: "3", components: "V, S, M", description: "Cria uma explosão de fogo que preenche uma esfera de 6m de raio. Causa 1d6/nível de dano (máx 10d6). Teste de resistência para metade. O fogo incendeia materiais combustíveis." },
  { name: "Clarividência", level: 3, school: "Divinação", range: "Especial", duration: "1 rodada/nível", castingTime: "3", components: "V, S, M", description: "Permite ao conjurador ver um local familiar ou óbvio dentro de 1,5km/nível como se estivesse lá. Barreiras de chumbo bloqueiam a magia. Só permite visão, não audição." },
  { name: "Dissipar Magia", level: 3, school: "Abjuração", range: "36m", duration: "Instantâneo", castingTime: "3", components: "V, S", description: "Remove efeitos mágicos em uma área de 9m³. Chance base de 50%, ±5% por diferença de nível entre o conjurador e o criador do efeito. Pode afetar múltiplos efeitos na área." },
  { name: "Fireball Retardada", level: 3, school: "Evocação/Alteração", range: "30m + 3m/nível", duration: "Especial", castingTime: "3", components: "V, S, M", description: "Como Bola de Fogo, mas a detonação pode ser retardada em até 5 rodadas. A esfera de fogo permanece flutuando até o tempo determinado, quando explode normalmente." },
  { name: "Idiomas", level: 3, school: "Alteração", range: "0", duration: "1 rodada/nível", castingTime: "3", components: "V, M", description: "Permite ao conjurador falar e entender qualquer idioma de criaturas inteligentes. Também permite ler textos em outros idiomas, mas não decifra códigos mágicos." },
  { name: "Invisibilidade 3m", level: 3, school: "Ilusão", range: "Toque", duration: "Especial", castingTime: "3", components: "V, S, M", description: "Como Invisibilidade, mas afeta todas as criaturas em um raio de 3m do alvo no momento da conjuração. Cada criatura que ataca se torna visível individualmente." },
  { name: "Lentidão", level: 3, school: "Alteração", range: "27m + 3m/nível", duration: "3 rodadas + 1 rodada/nível", castingTime: "3", components: "V, S, M", description: "Afeta 1 criatura/nível em uma área de 12m x 12m. Alvos se movem e atacam com metade da velocidade. Teste de resistência para negar. Cancela efeitos de Velocidade." },
  { name: "Língua da Serpente", level: 3, school: "Alteração", range: "0", duration: "1 rodada/nível", castingTime: "3", components: "V, M", description: "Permite ao conjurador comunicar-se com qualquer tipo de serpente. As serpentes são inclinadas a cooperar, embora não sejam controladas. Funciona com serpentes mágicas." },
  { name: "Proteção contra Projéteis Normais", level: 3, school: "Abjuração", range: "Toque", duration: "1 turno/nível", castingTime: "3", components: "V, S, M", description: "Torna o alvo imune a projéteis não-mágicos de tamanho pequeno e médio (flechas, virotes, balas de funda). Projéteis mágicos e armas de cerco não são afetados." },
  { name: "Relâmpago", level: 3, school: "Evocação", range: "12m + 3m/nível", duration: "Instantâneo", castingTime: "3", components: "V, S, M", description: "Dispara um raio de eletricidade de 30m de comprimento e 1,5m de largura. Causa 1d6/nível de dano (máx 10d6). Teste de resistência para metade. Ricocheia em superfícies sólidas." },
  { name: "Sugestão", level: 3, school: "Encantamento", range: "9m", duration: "1h/nível", castingTime: "3", components: "V, M", description: "Influencia magicamente as ações de uma criatura com uma sugestão razoável de uma ou duas frases. Teste de resistência para negar. Sugestões claramente prejudiciais são negadas automaticamente." },
  { name: "Velocidade", level: 3, school: "Alteração", range: "18m", duration: "3 rodadas + 1 rodada/nível", castingTime: "3", components: "V, S, M", description: "Dobra a velocidade de movimento e ataques de 1 criatura/nível em uma área de 12m x 12m. Criaturas afetadas envelhecem 1 ano magicamente. Cancela Lentidão." },
  { name: "Voo", level: 3, school: "Alteração", range: "Toque", duration: "1 turno/nível + 1d6 turnos", castingTime: "3", components: "V, S, M", description: "Concede ao alvo a habilidade de voar a uma velocidade de 54m/rodada (metade em subida). Manobras dependem de testes. Quando a magia acaba, o alvo desce suavemente por 1d6 rodadas." },
];

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
