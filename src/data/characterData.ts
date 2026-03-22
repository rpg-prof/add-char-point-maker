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
  { name: "Alergias (Moderada)", cost: -3, type: "disadvantage", severity: "moderate", description: "Reação alérgica moderada a uma substância comum (pólen, poeira, etc). Causa desconforto e penalidades leves." },
  { name: "Alergias (Severa)", cost: -8, type: "disadvantage", severity: "severe", description: "Reação alérgica severa que pode causar incapacitação temporária quando exposto ao alérgeno." },
  { name: "Altruísmo (Moderado)", cost: -2, type: "disadvantage", severity: "moderate", description: "Tendência a ajudar os outros mesmo em detrimento próprio. Dificuldade em recusar pedidos de ajuda." },
  { name: "Altruísmo (Severo)", cost: -7, type: "disadvantage", severity: "severe", description: "Compulsão em ajudar qualquer pessoa em necessidade, mesmo arriscando a própria vida." },
  { name: "Avareza", cost: -7, type: "disadvantage", description: "Obsessão por acumular riquezas. Relutância extrema em gastar dinheiro ou dividir tesouros." },
  { name: "Cleptomania (Moderada)", cost: -3, type: "disadvantage", severity: "moderate", description: "Impulso ocasional de furtar objetos pequenos, mesmo sem necessidade." },
  { name: "Cleptomania (Severa)", cost: -7, type: "disadvantage", severity: "severe", description: "Compulsão irresistível de furtar qualquer objeto interessante que veja." },
  { name: "Complexo de Culpa", cost: -5, type: "disadvantage", description: "Sentimento constante de culpa que afeta decisões e pode causar hesitação em momentos críticos." },
  { name: "Covardia (Moderada)", cost: -7, type: "disadvantage", severity: "moderate", description: "Tendência a evitar confrontos e situações perigosas. Teste de moral com penalidade." },
  { name: "Covardia (Severa)", cost: -15, type: "disadvantage", severity: "severe", description: "Medo paralisante de confrontos. Fuga automática em situações de perigo real." },
  { name: "Curiosidade (Moderada)", cost: -4, type: "disadvantage", severity: "moderate", description: "Necessidade de investigar coisas interessantes, mesmo quando perigoso." },
  { name: "Curiosidade (Severa)", cost: -8, type: "disadvantage", severity: "severe", description: "Compulsão irresistível de explorar e investigar qualquer mistério ou novidade." },
  { name: "Daltônico", cost: -3, type: "disadvantage", description: "Incapacidade de distinguir certas cores, dificultando identificação de poções, gemas e sinais." },
  { name: "Desastrado (Moderado)", cost: -4, type: "disadvantage", severity: "moderate", description: "Tendência a tropeçar, derrubar objetos e causar acidentes menores." },
  { name: "Desastrado (Severo)", cost: -8, type: "disadvantage", severity: "severe", description: "Extremamente desajeitado, causando acidentes frequentes que podem afetar o grupo." },
  { name: "Excesso de Confiança (Moderado)", cost: -2, type: "disadvantage", severity: "moderate", description: "Superestima suas próprias habilidades, assumindo riscos desnecessários." },
  { name: "Excesso de Confiança (Severo)", cost: -7, type: "disadvantage", severity: "severe", description: "Acredita ser invencível, ignorando perigos óbvios e recusando ajuda." },
  { name: "Fácil Contusão", cost: -8, type: "disadvantage", description: "O personagem sofre dano extra de ataques contundentes e contusões." },
  { name: "Fala Presa", cost: -6, type: "disadvantage", description: "Dificuldade de fala que afeta comunicação, conjuração de magias verbais e interações sociais." },
  { name: "Falta De Sorte", cost: -8, type: "disadvantage", description: "O personagem tem azar crônico. O mestre pode forçar uma nova jogada em um resultado favorável por sessão." },
  { name: "Fanatismo", cost: -8, type: "disadvantage", description: "Devoção extrema a uma causa, religião ou ideal que sobrepõe o bom senso." },
  { name: "Honestidade Compulsiva", cost: -8, type: "disadvantage", description: "Incapacidade de mentir ou enganar, mesmo quando a verdade pode ser prejudicial." },
  { name: "Impulsividade (Moderada)", cost: -3, type: "disadvantage", severity: "moderate", description: "Tendência a agir antes de pensar, sem considerar consequências." },
  { name: "Impulsividade (Severa)", cost: -7, type: "disadvantage", severity: "severe", description: "Age por impulso em quase todas as situações, ignorando planos e estratégias." },
  { name: "Inimigo Poderoso", cost: -10, type: "disadvantage", description: "Possui um inimigo influente e perigoso que busca ativamente prejudicá-lo." },
  { name: "Mau Temperamento", cost: -6, type: "disadvantage", description: "Irrita-se facilmente, podendo iniciar conflitos desnecessários e alienar aliados." },
  { name: "Medo: Água (Moderado)", cost: -6, type: "disadvantage", severity: "moderate", description: "Medo de águas profundas. Penalidade em testes quando perto de rios, lagos ou mar." },
  { name: "Medo: Água (Severo)", cost: -12, type: "disadvantage", severity: "severe", description: "Pavor paralisante de qualquer corpo d'água. Recusa-se a nadar ou atravessar pontes." },
  { name: "Medo: Altura (Moderado)", cost: -5, type: "disadvantage", severity: "moderate", description: "Desconforto em alturas elevadas. Penalidade em testes quando acima do nível do chão." },
  { name: "Medo: Altura (Severo)", cost: -10, type: "disadvantage", severity: "severe", description: "Pavor paralisante de alturas. Incapaz de subir escadas altas, torres ou montanhas." },
  { name: "Medo: Escuro (Moderado)", cost: -5, type: "disadvantage", severity: "moderate", description: "Desconforto em ambientes escuros. Penalidade em testes na escuridão." },
  { name: "Medo: Escuro (Severo)", cost: -11, type: "disadvantage", severity: "severe", description: "Pavor paralisante do escuro. Recusa-se a entrar em locais sem iluminação." },
  { name: "Medo: Magia (Moderado)", cost: -8, type: "disadvantage", severity: "moderate", description: "Desconforto na presença de magia. Penalidade quando próximo a efeitos mágicos." },
  { name: "Medo: Magia (Severo)", cost: -14, type: "disadvantage", severity: "severe", description: "Pavor paralisante de magia. Foge de qualquer manifestação mágica." },
  { name: "Medo: Mortos-Vivos (Moderado)", cost: -8, type: "disadvantage", severity: "moderate", description: "Desconforto na presença de mortos-vivos. Penalidade em combate contra eles." },
  { name: "Medo: Mortos-Vivos (Severo)", cost: -14, type: "disadvantage", severity: "severe", description: "Pavor paralisante de mortos-vivos. Foge automaticamente ao encontrá-los." },
  { name: "Megalomania (Moderada)", cost: -2, type: "disadvantage", severity: "moderate", description: "Acredita ser destinado a grandes feitos, buscando poder e reconhecimento." },
  { name: "Megalomania (Severa)", cost: -7, type: "disadvantage", severity: "severe", description: "Delírios de grandeza extremos, acreditando ser superior a todos." },
  { name: "Mentalidade de Escravo", cost: -4, type: "disadvantage", description: "Submissão automática a figuras de autoridade, dificuldade em tomar iniciativa própria." },
  { name: "Personalidade Irritante", cost: -6, type: "disadvantage", description: "Maneirismos e comportamentos que irritam os outros, causando reações negativas em PdMs." },
  { name: "Piromania (Moderada)", cost: -3, type: "disadvantage", severity: "moderate", description: "Fascínio por fogo. Tendência a acender fogueiras e brincar com chamas." },
  { name: "Piromania (Severa)", cost: -7, type: "disadvantage", severity: "severe", description: "Compulsão irresistível de atear fogo em coisas, mesmo em situações perigosas." },
  { name: "Preguiça", cost: -7, type: "disadvantage", description: "Relutância em realizar esforço físico ou mental, preferindo sempre o caminho mais fácil." },
  { name: "Sadismo", cost: -4, type: "disadvantage", description: "Prazer em causar dor e sofrimento aos outros, podendo alienar aliados e causar problemas morais." },
  { name: "Sono Profundo", cost: -7, type: "disadvantage", description: "Dorme muito pesado, sendo extremamente difícil de acordar. Vulnerável a ataques noturnos e surpresas." },
  { name: "Teimosia (Moderada)", cost: -2, type: "disadvantage", severity: "moderate", description: "Dificuldade em mudar de opinião ou aceitar sugestões dos outros." },
  { name: "Teimosia (Severa)", cost: -6, type: "disadvantage", severity: "severe", description: "Recusa absoluta em mudar de ideia, mesmo diante de evidências contrárias." },
  { name: "Vício (Moderado)", cost: -5, type: "disadvantage", severity: "moderate", description: "Dependência moderada de uma substância (álcool, tabaco, etc). Desconforto sem ela." },
  { name: "Vício (Severo)", cost: -10, type: "disadvantage", severity: "severe", description: "Dependência severa que causa penalidades significativas quando privado da substância." },
];

// ===== SKILLS =====
export interface SkillOption {
  name: string;
  cost: number;
  attribute: string;
  group: string;
  description?: string;
}

export const skills: SkillOption[] = [
  // Grupo Geral
  { name: "Agricultura", cost: 3, attribute: "Inteligência", group: "Geral", description: "Conhecimento básico de agricultura: plantio, colheita, estocagem de grãos, domesticar animais e trabalhos típicos de fazenda." },
  { name: "Alfaiate", cost: 3, attribute: "Destreza/Inteligência", group: "Geral", description: "Pode costurar e desenhar roupas, fazer bordados e ornamentos. Precisa de agulha e linha." },
  { name: "Artesanato em Couro", cost: 3, attribute: "Inteligência/Destreza", group: "Geral", description: "Habilita a tingir e trabalhar com couro, fazer roupas, corseletes, mochilas, alforjes, selas e arreios." },
  { name: "Cantar", cost: 2, attribute: "Carisma", group: "Geral", description: "Bom cantor, pode entreter e ganhar dinheiro. Teste para criar peças de coral." },
  { name: "Carpintaria", cost: 3, attribute: "Força/Inteligência", group: "Geral", description: "Permite trabalhos em madeira: construir casas, armários, etc. Itens complexos requerem teste de perícia." },
  { name: "Cavalgar Criatura Alada", cost: 4, attribute: "Sabedoria/Destreza", group: "Geral", description: "Treinado para lidar com montaria voadora. Permite saltar na sela, esporear para velocidade extra, guiar com joelhos e saltar em voo." },
  { name: "Cavalgar Criatura Terrestre", cost: 2, attribute: "Sabedoria/Destreza", group: "Geral", description: "Perito em montar cavalos ou outras montarias terrestres. Permite saltos, esporear para velocidade, guiar com joelhos e usar montaria como escudo." },
  { name: "Cerâmica", cost: 3, attribute: "Destreza", group: "Geral", description: "Pode criar vasos de argila e recipientes. Precisa de roda giratória, forno e argila. Cria 2 itens pequenos/médios ou 1 grande por dia." },
  { name: "Conhecimento do Clima", cost: 2, attribute: "Sabedoria", group: "Geral", description: "Prever condições do tempo nas próximas 6 horas. Cada 6h de observação dá +1 cumulativo no teste." },
  { name: "Cozinhar", cost: 3, attribute: "Inteligência", group: "Geral", description: "Cozinheiro nato. Teste só para refeições realmente magníficas, dignas de um grande chef." },
  { name: "Dança", cost: 2, attribute: "Destreza/Carisma", group: "Geral", description: "Conhece muitos estilos de dança, de variedades folclóricas a danças de salão." },
  { name: "Engenharia", cost: 4, attribute: "Inteligência/Sabedoria", group: "Geral", description: "Pode preparar projetos de máquinas e construções. Familiarizado com técnicas de cerco e pode detectar falhas em fortificações." },
  { name: "Escultor", cost: 2, attribute: "Destreza/Sabedoria", group: "Geral", description: "Talento artístico natural. Pode criar trabalhos de mérito artístico. +1 para testes de outras perícias artísticas." },
  { name: "Etiqueta", cost: 2, attribute: "Carisma/Sabedoria", group: "Geral", description: "Entendimento das formas corretas de comportamento, especialmente com nobreza e figuras de poder." },
  { name: "Forjaria", cost: 4, attribute: "Força/Inteligência", group: "Geral", description: "Pode fazer ferramentas e implementos de ferro. Requer forja, bigorna e martelo. Não faz armaduras ou armas." },
  { name: "Heráldica", cost: 2, attribute: "Inteligência", group: "Geral", description: "Identifica escudos e símbolos de nobres, famílias, guildas, facções e classes sociais em bandeiras, escudos, moedas, etc." },
  { name: "Idiomas Modernos", cost: 2, attribute: "Inteligência", group: "Geral", description: "Pode falar uma língua moderna do mundo conhecido, desde que haja professor disponível." },
  { name: "Instrumento Musical", cost: 2, attribute: "Carisma", group: "Geral", description: "Pode tocar um instrumento musical. Pontos extras permitem aprender instrumentos adicionais." },
  { name: "Jogo", cost: 2, attribute: "Sabedoria/Inteligência", group: "Geral", description: "Conhece jogos de sorte e perícia (cartas, dados, xadrez). Pode trapacear com +1, mas resultado 17-20 significa ser pego." },
  { name: "Lidar com Animais", cost: 3, attribute: "Sabedoria", group: "Geral", description: "Controlar excepcionalmente manadas e animais de carga. Teste para acalmar animal excitado (sem a perícia, só 20% de chance)." },
  { name: "Natação", cost: 2, attribute: "Força", group: "Geral", description: "O personagem sabe nadar e se mover na água. Sem essa perícia, só pode prender a respiração e flutuar." },
  { name: "Navegação", cost: 3, attribute: "Inteligência/Sabedoria", group: "Geral", description: "Arte da navegação pelas estrelas, correntes e sinais. No mar, sucesso diminui chances de se perder em 20%." },
  { name: "Pesca", cost: 3, attribute: "Sabedoria/Inteligência", group: "Geral", description: "Habilidoso com caniço, rede ou lança. Teste por hora: sucesso captura peixes proporcional ao resultado. Rede pesca 3x mais." },
  { name: "Pintura", cost: 2, attribute: "Destreza/Sabedoria", group: "Geral", description: "Talento artístico para pintura. Pode criar obras de arte e desenhar mapas realistas." },
  { name: "Preparar Bebidas", cost: 3, attribute: "Inteligência", group: "Geral", description: "Treinado em fermentar cervejas e bebidas fortes. Pode preparar fórmulas, separar ingredientes e controlar fermentação." },
  { name: "Preparar Fogueira", cost: 2, attribute: "Sabedoria/Inteligência", group: "Geral", description: "Não precisa de estojo de pavio e pederneira. Com gravetos secos, acende fogo em 2d20 minutos. Condições adversas: 3d20 + teste." },
  { name: "Uso de Cordas", cost: 2, attribute: "Destreza/Sabedoria", group: "Geral", description: "Conhece qualquer tipo de nó. +2 para ataques com laço. +10% para testes de escalada com corda." },
  { name: "Liderança", cost: 3, attribute: "Carisma", group: "Geral", description: "Capacidade de liderar e inspirar outros, organizando grupos e tomando decisões em situações de pressão." },
  { name: "Pressentir Perigo", cost: 4, attribute: "Sabedoria", group: "Geral", description: "Intuição aguçada para detectar perigos iminentes. Teste de Sabedoria para sentir emboscadas ou armadilhas." },
  { name: "Vontade de Ferro", cost: 2, attribute: "Sabedoria/Constituição", group: "Geral", description: "Resistência mental excepcional contra efeitos de medo, charme e controle mental." },
  // Sacerdotes
  { name: "Astrologia", cost: 3, attribute: "Sabedoria/Inteligência", group: "Sacerdote", description: "Pode preparar estudo do futuro (30 dias) baseado em data/local de nascimento. Previsão vaga de eventos genéricos. +1 em Navegação se estrelas visíveis." },
  { name: "Conhecimento Místico", cost: 3, attribute: "Inteligência", group: "Sacerdote", description: "Familiaridade com formas e cerimônias mágicas. Pode identificar magias sendo lançadas e reconhecer objetos mágicos (metade da chance)." },
  { name: "Cura", cost: 4, attribute: "Sabedoria/Carisma", group: "Sacerdote", description: "Primeiros-socorros e remédios naturais. Restaura 1d3 PV se atender até 1 rodada após ferimento. Recuperação de 1-2 PV/dia sob cuidados. Pode tratar venenos e doenças." },
  { name: "Herbalismo", cost: 3, attribute: "Inteligência/Sabedoria", group: "Sacerdote", description: "Identificar plantas e fungos, preparar poções, cataplasmas, pós, ungüentos e venenos naturais. Combinado com Cura, bônus no tratamento." },
  { name: "História Antiga", cost: 3, attribute: "Sabedoria/Inteligência", group: "Sacerdote", description: "Conhecimento de lendas, tradições e história de tempos antigos. Familiaridade com eventos, vultos históricos, batalhas e mistérios." },
  { name: "História Local", cost: 2, attribute: "Inteligência/Carisma", group: "Sacerdote", description: "Depósito de fatos sobre a história de uma região. Conhece heróis, vilões, tesouros e eventos locais. Pode contar histórias (+2 Carisma)." },
  { name: "Idiomas Antigos", cost: 4, attribute: "Inteligência", group: "Sacerdote", description: "Dominou língua obscura encontrada em textos de sábios e magos. Pode ler segredos escritos por místicos antigos." },
  { name: "Ler/Escrever", cost: 2, attribute: "Inteligência", group: "Sacerdote", description: "Pode ler e escrever numa linguagem moderna que também fale. Não permite ler textos antigos." },
  { name: "Religião", cost: 2, attribute: "Sabedoria", group: "Sacerdote", description: "Conhece crenças e cultos da região. Informações comuns são automáticas; específicas requerem teste. Pontos extras ampliam para outras regiões." },
  // Ladrão / Bardo
  { name: "Acrobacia", cost: 3, attribute: "Destreza/Força", group: "Ladrão/Bardo", description: "Mergulhar, cambalhotas, saltos mortais. Melhora CA em 4 se tiver iniciativa (sem atacar). +2 em combate desarmado. Metade do dano em quedas ≤20m." },
  { name: "Andar na Corda Bamba", cost: 3, attribute: "Destreza", group: "Ladrão/Bardo", description: "Andar sobre cordas e vigas estreitas. 20m/rodada com teste. Penalidade varia com espessura (-10 para corda, -5 para 5-15cm). Pode lutar com -5." },
  { name: "Arremessador", cost: 2, attribute: "Destreza/Força", group: "Ladrão/Bardo", description: "Habilidade excepcional com armas de arremesso, ganhando bônus em precisão e distância." },
  { name: "Avaliação", cost: 2, attribute: "Inteligência/Sabedoria", group: "Ladrão/Bardo", description: "Estimar valor e autenticidade de antiguidades, jóias, gemas e objetos de arte. Identifica falsificações. Resultado 20 = estimativa errada." },
  { name: "Criptografia", cost: 3, attribute: "Inteligência/Sabedoria", group: "Ladrão/Bardo", description: "Habilidade de criar e decifrar códigos e mensagens cifradas." },
  { name: "Disfarce", cost: 4, attribute: "Sabedoria/Carisma", group: "Ladrão/Bardo", description: "Arte dos disfarces. Pode parecer outra pessoa de mesma altura/peso/raça. Sexo oposto ou outra raça: -7. Pessoa específica: -10. Cumulativo." },
  { name: "Falsificação", cost: 3, attribute: "Destreza/Sabedoria", group: "Ladrão/Bardo", description: "Criar duplicatas de documentos e imitar caligrafia. Assinatura: -2. Documento longo: -3. Também pode detectar falsificações." },
  { name: "Lapidação", cost: 3, attribute: "Destreza", group: "Ladrão/Bardo", description: "Lapidar pedras brutas: 1d10 pedras/dia. Sucesso aumenta valor ao nível apropriado. Resultado 1 = trabalho excepcional, sobe uma categoria." },
  { name: "Leitura de Lábios", cost: 3, attribute: "Inteligência/Sabedoria", group: "Ladrão/Bardo", description: "Entender fala sem ouvir, a menos de 10m. Sucesso compreende 70% da conversa. Deve especificar idioma ao escolher." },
  { name: "Malabarismo", cost: 3, attribute: "Destreza", group: "Ladrão/Bardo", description: "Entreter com malabarismos. Pode pegar itens pequenos arremessados (ataque CA 0). Falha = dano automático." },
  { name: "Saltar", cost: 2, attribute: "Força/Destreza", group: "Ladrão/Bardo", description: "Saltos excepcionais. Com impulso: 2d6+nível×30cm distância, 1d3+½nível×30cm altura. Máx: 6× e 1½× a própria altura. Salto com vara possível." },
  { name: "Ventriloquismo", cost: 4, attribute: "Inteligência", group: "Ladrão/Bardo", description: "Fazer outros acreditarem que o som vem de outra fonte. Objeto inanimado: -5. Fonte verossímil: +2. Só funciona em seres inteligentes." },
  // Guerreiro / Paladino / Ranger
  { name: "Caça", cost: 2, attribute: "Sabedoria", group: "Guerreiro", description: "Espreitar e capturar presas. -1 por pessoa sem perícia no grupo. Sucesso chega a 101-200m do animal. Sucesso na espreita = surpresa automática." },
  { name: "Conduzir Carruagem", cost: 4, attribute: "Destreza/Sabedoria", group: "Guerreiro", description: "Guiar carruagem sobre qualquer terreno com velocidade 1/3 superior ao normal." },
  { name: "Conhecimento dos Animais", cost: 3, attribute: "Inteligência/Sabedoria", group: "Guerreiro", description: "Observar e interpretar ações de animais. Detectar perigo, água, manadas. Pode imitar sons animais. +2 para armadilhas de caça." },
  { name: "Correr", cost: 2, attribute: "Força/Constituição", group: "Guerreiro", description: "Mover-se com dobro da taxa de movimentação por um dia. Teste diário para continuar. -1 para ataque se lutar no dia de corrida." },
  { name: "Fabricação de Arcos e Flechas", cost: 5, attribute: "Inteligência/Destreza", group: "Guerreiro", description: "Construir arcos (1-2 semanas) e flechas (1d6/dia). Falha = arma utilizável mas frágil. Opção de qualidade superior com bônus de Força." },
  { name: "Fazer Armaduras", cost: 5, attribute: "Inteligência/Força", group: "Guerreiro", description: "Fabricar todos os tipos de armaduras. 2 semanas por nível de CA abaixo de 10. Falha por ≤4 = armadura defeituosa (CA -1). Armadura pesada requer ajuste." },
  { name: "Forjar Armas", cost: 5, attribute: "Inteligência/Destreza", group: "Guerreiro", description: "Arte de criar armas de metal com lâminas. Requer ferraria bem equipada. Tempo varia por tipo de arma (5-45 dias)." },
  { name: "Montanhismo", cost: 4, attribute: "Força/Sabedoria", group: "Guerreiro", description: "Escaladas difíceis com pinos, ganchos e cordas. Lidera grupo por locais inacessíveis. +10%/ponto na chance de escalar muros." },
  { name: "Rastrear", cost: 4, attribute: "Sabedoria", group: "Guerreiro", description: "Seguir trilhas de criaturas. Não-rangers: -6. Modificadores por terreno, clima e luz. Pode identificar tipo e quantidade de criaturas." },
  { name: "Sobrevivência", cost: 3, attribute: "Inteligência/Sabedoria", group: "Guerreiro", description: "Aplicada a terreno específico (ártico, floresta, deserto, etc.). Localizar água e comida, entender riscos climáticos. Pontos extras para outros terrenos." },
  { name: "Vigor", cost: 2, attribute: "Constituição", group: "Guerreiro", description: "Atividades físicas extenuantes pelo dobro do tempo normal antes de fadiga. Não aumenta sobrevivência sem comida/água/ar." },
  // Magos
  { name: "Astronomia", cost: 2, attribute: "Inteligência", group: "Mago", description: "Conhecimento dos corpos celestes, suas posições e movimentos. Útil para navegação e rituais mágicos." },
  { name: "Magia Tática", cost: 3, attribute: "Inteligência", group: "Mago", description: "Conhecimento de como usar magias de forma eficiente em combate, maximizando efeitos e minimizando riscos." },
  { name: "Pesquisar", cost: 1, attribute: "Inteligência", group: "Mago", description: "Habilidade de pesquisar informações em bibliotecas, arquivos e tomos antigos de forma eficiente." },
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
