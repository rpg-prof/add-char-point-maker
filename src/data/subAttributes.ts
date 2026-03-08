// Sub-attribute definitions: each main attribute splits into two sub-attributes
// The user can adjust each sub-attribute by +2/-2 from the base attribute value
// The sum of both sub-attributes must equal 2x the main attribute value

export interface SubAttributeDefinition {
  main: string;
  sub1: string;
  sub2: string;
}

export const subAttributeMap: SubAttributeDefinition[] = [
  { main: "Força", sub1: "Resistência", sub2: "Músculos" },
  { main: "Destreza", sub1: "Precisão", sub2: "Equilíbrio" },
  { main: "Constituição", sub1: "Saúde", sub2: "Condicionamento" },
  { main: "Inteligência", sub1: "Razão", sub2: "Conhecimento" },
  { main: "Sabedoria", sub1: "Intuição", sub2: "Força de Vontade" },
  { main: "Carisma", sub1: "Liderança", sub2: "Aparência" },
];

export type SubAttributeName =
  | "Resistência" | "Músculos"
  | "Precisão" | "Equilíbrio"
  | "Saúde" | "Condicionamento"
  | "Razão" | "Conhecimento"
  | "Intuição" | "Força de Vontade"
  | "Liderança" | "Aparência";

// ===== LOOKUP TABLES =====

// Tabela 2: Resistência (Força sub1)
export interface ResistenciaRow {
  cargaPermitida: string;
}
export const tabelaResistencia: Record<number, ResistenciaRow> = {
  3: { cargaPermitida: "2 kg" },
  4: { cargaPermitida: "4,5 kg" },
  5: { cargaPermitida: "4,5 kg" },
  6: { cargaPermitida: "9 kg" },
  7: { cargaPermitida: "9 kg" },
  8: { cargaPermitida: "16 kg" },
  9: { cargaPermitida: "16 kg" },
  10: { cargaPermitida: "18 kg" },
  11: { cargaPermitida: "18 kg" },
  12: { cargaPermitida: "20,5 kg" },
  13: { cargaPermitida: "20,5 kg" },
  14: { cargaPermitida: "25 kg" },
  15: { cargaPermitida: "25 kg" },
  16: { cargaPermitida: "32 kg" },
  17: { cargaPermitida: "38,5 kg" },
  18: { cargaPermitida: "50 kg" },
};

// Tabela 3: Músculos (Força sub2)
export interface MusculosRow {
  chancAcerto: string;
  ajstDano: string;
  pesoMax: string;
  sustentacao: string;
  dobrarBarras: string;
}
export const tabelaMusculos: Record<number, MusculosRow> = {
  3: { chancAcerto: "-3", ajstDano: "-1", pesoMax: "4,5 kg", sustentacao: "2", dobrarBarras: "0%" },
  4: { chancAcerto: "-2", ajstDano: "-1", pesoMax: "11 kg", sustentacao: "3", dobrarBarras: "0%" },
  5: { chancAcerto: "-2", ajstDano: "-1", pesoMax: "11 kg", sustentacao: "3", dobrarBarras: "0%" },
  6: { chancAcerto: "-1", ajstDano: "0", pesoMax: "25 kg", sustentacao: "4", dobrarBarras: "0%" },
  7: { chancAcerto: "-1", ajstDano: "0", pesoMax: "25 kg", sustentacao: "4", dobrarBarras: "0%" },
  8: { chancAcerto: "0", ajstDano: "0", pesoMax: "41 kg", sustentacao: "5", dobrarBarras: "1%" },
  9: { chancAcerto: "0", ajstDano: "0", pesoMax: "41 kg", sustentacao: "5", dobrarBarras: "1%" },
  10: { chancAcerto: "0", ajstDano: "0", pesoMax: "52 kg", sustentacao: "6", dobrarBarras: "2%" },
  11: { chancAcerto: "0", ajstDano: "0", pesoMax: "52 kg", sustentacao: "6", dobrarBarras: "2%" },
  12: { chancAcerto: "0", ajstDano: "0", pesoMax: "63,5 kg", sustentacao: "7", dobrarBarras: "4%" },
  13: { chancAcerto: "0", ajstDano: "0", pesoMax: "63,5 kg", sustentacao: "7", dobrarBarras: "4%" },
  14: { chancAcerto: "0", ajstDano: "0", pesoMax: "77 kg", sustentacao: "8", dobrarBarras: "7%" },
  15: { chancAcerto: "0", ajstDano: "0", pesoMax: "77 kg", sustentacao: "8", dobrarBarras: "7%" },
  16: { chancAcerto: "0", ajstDano: "+1", pesoMax: "88,5 kg", sustentacao: "9", dobrarBarras: "10%" },
  17: { chancAcerto: "+1", ajstDano: "+1", pesoMax: "99,5 kg", sustentacao: "10", dobrarBarras: "13%" },
  18: { chancAcerto: "+1", ajstDano: "+3", pesoMax: "115,5 kg", sustentacao: "11", dobrarBarras: "16%" },
};

// Tabela 4: Precisão (Destreza sub1)
export interface PrecisaoRow {
  ataqueDistancia: string;
  furtarBolsos: string;
  abrirFechaduras: string;
}
export const tabelaPrecisao: Record<number, PrecisaoRow> = {
  3: { ataqueDistancia: "-3", furtarBolsos: "-30%", abrirFechaduras: "-30%" },
  4: { ataqueDistancia: "-2", furtarBolsos: "-25%", abrirFechaduras: "-25%" },
  5: { ataqueDistancia: "-1", furtarBolsos: "-25%", abrirFechaduras: "-20%" },
  6: { ataqueDistancia: "0", furtarBolsos: "-20%", abrirFechaduras: "-20%" },
  7: { ataqueDistancia: "0", furtarBolsos: "-20%", abrirFechaduras: "-15%" },
  8: { ataqueDistancia: "0", furtarBolsos: "-15%", abrirFechaduras: "-15%" },
  9: { ataqueDistancia: "0", furtarBolsos: "-15%", abrirFechaduras: "-10%" },
  10: { ataqueDistancia: "0", furtarBolsos: "-10%", abrirFechaduras: "-5%" },
  11: { ataqueDistancia: "0", furtarBolsos: "-5%", abrirFechaduras: "0%" },
  12: { ataqueDistancia: "0", furtarBolsos: "0%", abrirFechaduras: "0%" },
  13: { ataqueDistancia: "0", furtarBolsos: "0%", abrirFechaduras: "0%" },
  14: { ataqueDistancia: "0", furtarBolsos: "0%", abrirFechaduras: "0%" },
  15: { ataqueDistancia: "0", furtarBolsos: "0%", abrirFechaduras: "0%" },
  16: { ataqueDistancia: "+1", furtarBolsos: "0%", abrirFechaduras: "+5%" },
  17: { ataqueDistancia: "+2", furtarBolsos: "+5%", abrirFechaduras: "+10%" },
  18: { ataqueDistancia: "+2", furtarBolsos: "+10%", abrirFechaduras: "+15%" },
};

// Tabela 5: Equilíbrio (Destreza sub2)
export interface EquilibrioRow {
  ajusteReacao: string;
  ajusteDefensivo: string;
  moverSilencio: string;
  escalarMuros: string;
}
export const tabelaEquilibrio: Record<number, EquilibrioRow> = {
  3: { ajusteReacao: "-3", ajusteDefensivo: "+4", moverSilencio: "-30%", escalarMuros: "-30%" },
  4: { ajusteReacao: "-2", ajusteDefensivo: "+3", moverSilencio: "-30%", escalarMuros: "-25%" },
  5: { ajusteReacao: "-1", ajusteDefensivo: "+2", moverSilencio: "-30%", escalarMuros: "-20%" },
  6: { ajusteReacao: "0", ajusteDefensivo: "+1", moverSilencio: "-25%", escalarMuros: "-20%" },
  7: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "-25%", escalarMuros: "-15%" },
  8: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "-20%", escalarMuros: "-15%" },
  9: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "-20%", escalarMuros: "-10%" },
  10: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "-15%", escalarMuros: "-5%" },
  11: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "-10%", escalarMuros: "0%" },
  12: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "-5%", escalarMuros: "0%" },
  13: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "0%", escalarMuros: "0%" },
  14: { ajusteReacao: "0", ajusteDefensivo: "0", moverSilencio: "0%", escalarMuros: "0%" },
  15: { ajusteReacao: "0", ajusteDefensivo: "-1", moverSilencio: "0%", escalarMuros: "0%" },
  16: { ajusteReacao: "+1", ajusteDefensivo: "-2", moverSilencio: "0%", escalarMuros: "0%" },
  17: { ajusteReacao: "+2", ajusteDefensivo: "-3", moverSilencio: "+5%", escalarMuros: "+5%" },
  18: { ajusteReacao: "+2", ajusteDefensivo: "-4", moverSilencio: "+10%", escalarMuros: "+10%" },
};

// Tabela 6: Saúde (Constituição sub1)
export interface SaudeRow {
  resistencia: string;
  colapsoVeneno: string;
}
export const tabelaSaude: Record<number, SaudeRow> = {
  3: { resistencia: "35%", colapsoVeneno: "0" },
  4: { resistencia: "40%", colapsoVeneno: "0" },
  5: { resistencia: "45%", colapsoVeneno: "0" },
  6: { resistencia: "50%", colapsoVeneno: "0" },
  7: { resistencia: "55%", colapsoVeneno: "0" },
  8: { resistencia: "60%", colapsoVeneno: "0" },
  9: { resistencia: "65%", colapsoVeneno: "0" },
  10: { resistencia: "70%", colapsoVeneno: "0" },
  11: { resistencia: "75%", colapsoVeneno: "0" },
  12: { resistencia: "80%", colapsoVeneno: "0" },
  13: { resistencia: "85%", colapsoVeneno: "0" },
  14: { resistencia: "88%", colapsoVeneno: "0" },
  15: { resistencia: "90%", colapsoVeneno: "0" },
  16: { resistencia: "95%", colapsoVeneno: "0" },
  17: { resistencia: "97%", colapsoVeneno: "0" },
  18: { resistencia: "99%", colapsoVeneno: "0" },
};

// Tabela 7: Condicionamento (Constituição sub2)
export interface CondicionamentoRow {
  ajustePV: string;
  ressurreicao: string;
}
export const tabelaCondicionamento: Record<number, CondicionamentoRow> = {
  3: { ajustePV: "-2", ressurreicao: "40%" },
  4: { ajustePV: "-1", ressurreicao: "45%" },
  5: { ajustePV: "-1", ressurreicao: "50%" },
  6: { ajustePV: "-1", ressurreicao: "55%" },
  7: { ajustePV: "0", ressurreicao: "60%" },
  8: { ajustePV: "0", ressurreicao: "65%" },
  9: { ajustePV: "0", ressurreicao: "70%" },
  10: { ajustePV: "0", ressurreicao: "75%" },
  11: { ajustePV: "0", ressurreicao: "80%" },
  12: { ajustePV: "0", ressurreicao: "85%" },
  13: { ajustePV: "0", ressurreicao: "90%" },
  14: { ajustePV: "0", ressurreicao: "92%" },
  15: { ajustePV: "+1", ressurreicao: "94%" },
  16: { ajustePV: "+2", ressurreicao: "96%" },
  17: { ajustePV: "+2(+3)", ressurreicao: "98%" },
  18: { ajustePV: "+2(+4)", ressurreicao: "100%" },
};

// Tabela 8: Razão (Inteligência sub1)
export interface RazaoRow {
  circMagia: string;
  maxMagias: string;
  imunidadeMagia: string;
}
export const tabelaRazao: Record<number, RazaoRow> = {
  3: { circMagia: "—", maxMagias: "—", imunidadeMagia: "—" },
  4: { circMagia: "—", maxMagias: "—", imunidadeMagia: "—" },
  5: { circMagia: "—", maxMagias: "—", imunidadeMagia: "—" },
  6: { circMagia: "—", maxMagias: "—", imunidadeMagia: "—" },
  7: { circMagia: "—", maxMagias: "—", imunidadeMagia: "—" },
  8: { circMagia: "—", maxMagias: "—", imunidadeMagia: "—" },
  9: { circMagia: "4º", maxMagias: "6", imunidadeMagia: "—" },
  10: { circMagia: "5º", maxMagias: "7", imunidadeMagia: "—" },
  11: { circMagia: "5º", maxMagias: "7", imunidadeMagia: "—" },
  12: { circMagia: "6º", maxMagias: "7", imunidadeMagia: "—" },
  13: { circMagia: "6º", maxMagias: "9", imunidadeMagia: "—" },
  14: { circMagia: "7º", maxMagias: "9", imunidadeMagia: "—" },
  15: { circMagia: "7º", maxMagias: "11", imunidadeMagia: "—" },
  16: { circMagia: "8º", maxMagias: "11", imunidadeMagia: "—" },
  17: { circMagia: "8º", maxMagias: "14", imunidadeMagia: "—" },
  18: { circMagia: "9º", maxMagias: "18", imunidadeMagia: "—" },
};

// Tabela 9: Conhecimento (Inteligência sub2)
export interface ConhecimentoRow {
  pontosLingua: string;
  aprenderMagias: string;
}
export const tabelaConhecimento: Record<number, ConhecimentoRow> = {
  3: { pontosLingua: "1", aprenderMagias: "—" },
  4: { pontosLingua: "1", aprenderMagias: "—" },
  5: { pontosLingua: "1", aprenderMagias: "—" },
  6: { pontosLingua: "1", aprenderMagias: "—" },
  7: { pontosLingua: "1", aprenderMagias: "—" },
  8: { pontosLingua: "1", aprenderMagias: "—" },
  9: { pontosLingua: "2", aprenderMagias: "35%" },
  10: { pontosLingua: "2", aprenderMagias: "40%" },
  11: { pontosLingua: "2", aprenderMagias: "45%" },
  12: { pontosLingua: "3", aprenderMagias: "50%" },
  13: { pontosLingua: "3", aprenderMagias: "55%" },
  14: { pontosLingua: "4", aprenderMagias: "60%" },
  15: { pontosLingua: "4", aprenderMagias: "65%" },
  16: { pontosLingua: "5", aprenderMagias: "70%" },
  17: { pontosLingua: "6", aprenderMagias: "75%" },
  18: { pontosLingua: "7", aprenderMagias: "85%" },
};

// Tabela 10: Intuição (Sabedoria sub1)
export interface IntuicaoRow {
  bonus: string;
  falhasMagia: string;
}
export const tabelaIntuicao: Record<number, IntuicaoRow> = {
  3: { bonus: "0", falhasMagia: "50%" },
  4: { bonus: "0", falhasMagia: "45%" },
  5: { bonus: "0", falhasMagia: "40%" },
  6: { bonus: "0", falhasMagia: "35%" },
  7: { bonus: "0", falhasMagia: "30%" },
  8: { bonus: "0", falhasMagia: "25%" },
  9: { bonus: "0", falhasMagia: "20%" },
  10: { bonus: "0", falhasMagia: "15%" },
  11: { bonus: "0", falhasMagia: "10%" },
  12: { bonus: "0", falhasMagia: "5%" },
  13: { bonus: "1º", falhasMagia: "0%" },
  14: { bonus: "1º", falhasMagia: "0%" },
  15: { bonus: "2º", falhasMagia: "0%" },
  16: { bonus: "2º", falhasMagia: "0%" },
  17: { bonus: "3º", falhasMagia: "0%" },
  18: { bonus: "4º", falhasMagia: "0%" },
};

// Tabela 11: Força de Vontade (Sabedoria sub2)
export interface ForcaVontadeRow {
  ajusteDefesaMagia: string;
  imunidadeMagia: string;
}
export const tabelaForcaVontade: Record<number, ForcaVontadeRow> = {
  3: { ajusteDefesaMagia: "-3", imunidadeMagia: "—" },
  4: { ajusteDefesaMagia: "-2", imunidadeMagia: "—" },
  5: { ajusteDefesaMagia: "-1", imunidadeMagia: "—" },
  6: { ajusteDefesaMagia: "-1", imunidadeMagia: "—" },
  7: { ajusteDefesaMagia: "-1", imunidadeMagia: "—" },
  8: { ajusteDefesaMagia: "0", imunidadeMagia: "—" },
  9: { ajusteDefesaMagia: "0", imunidadeMagia: "—" },
  10: { ajusteDefesaMagia: "0", imunidadeMagia: "—" },
  11: { ajusteDefesaMagia: "0", imunidadeMagia: "—" },
  12: { ajusteDefesaMagia: "0", imunidadeMagia: "—" },
  13: { ajusteDefesaMagia: "0", imunidadeMagia: "—" },
  14: { ajusteDefesaMagia: "0", imunidadeMagia: "—" },
  15: { ajusteDefesaMagia: "+1", imunidadeMagia: "—" },
  16: { ajusteDefesaMagia: "+2", imunidadeMagia: "—" },
  17: { ajusteDefesaMagia: "+3", imunidadeMagia: "—" },
  18: { ajusteDefesaMagia: "+4", imunidadeMagia: "—" },
};

// Tabela 12: Liderança (Carisma sub1)
export interface LiderancaRow {
  lealdade: string;
  numAliados: string;
}
export const tabelaLideranca: Record<number, LiderancaRow> = {
  3: { lealdade: "-6", numAliados: "1" },
  4: { lealdade: "-5", numAliados: "1" },
  5: { lealdade: "-4", numAliados: "2" },
  6: { lealdade: "-3", numAliados: "2" },
  7: { lealdade: "-2", numAliados: "3" },
  8: { lealdade: "-1", numAliados: "3" },
  9: { lealdade: "0", numAliados: "4" },
  10: { lealdade: "0", numAliados: "4" },
  11: { lealdade: "0", numAliados: "4" },
  12: { lealdade: "0", numAliados: "5" },
  13: { lealdade: "0", numAliados: "5" },
  14: { lealdade: "+1", numAliados: "6" },
  15: { lealdade: "+3", numAliados: "7" },
  16: { lealdade: "+4", numAliados: "8" },
  17: { lealdade: "+6", numAliados: "10" },
  18: { lealdade: "+8", numAliados: "15" },
};

// Tabela 13: Aparência (Carisma sub2)
export interface AparenciaRow {
  ajusteReacao: string;
}
export const tabelaAparencia: Record<number, AparenciaRow> = {
  3: { ajusteReacao: "-5" },
  4: { ajusteReacao: "-4" },
  5: { ajusteReacao: "-3" },
  6: { ajusteReacao: "-2" },
  7: { ajusteReacao: "-1" },
  8: { ajusteReacao: "0" },
  9: { ajusteReacao: "0" },
  10: { ajusteReacao: "0" },
  11: { ajusteReacao: "0" },
  12: { ajusteReacao: "0" },
  13: { ajusteReacao: "+1" },
  14: { ajusteReacao: "+2" },
  15: { ajusteReacao: "+3" },
  16: { ajusteReacao: "+5" },
  17: { ajusteReacao: "+6" },
  18: { ajusteReacao: "+7" },
};

// Helper to get all bonuses for a sub-attribute value
export function getSubAttributeBonuses(subName: SubAttributeName, value: number): Record<string, string> {
  switch (subName) {
    case "Resistência": {
      const r = tabelaResistencia[value];
      return r ? { "Carga Permitida": r.cargaPermitida } : {};
    }
    case "Músculos": {
      const r = tabelaMusculos[value];
      return r ? { "Acerto": r.chancAcerto, "Dano": r.ajstDano, "Peso Max": r.pesoMax, "Dobrar Barras": r.dobrarBarras } : {};
    }
    case "Precisão": {
      const r = tabelaPrecisao[value];
      return r ? { "Atq. Dist.": r.ataqueDistancia, "Furtar": r.furtarBolsos, "Fechaduras": r.abrirFechaduras } : {};
    }
    case "Equilíbrio": {
      const r = tabelaEquilibrio[value];
      return r ? { "Reação": r.ajusteReacao, "Defesa": r.ajusteDefensivo, "Silêncio": r.moverSilencio, "Escalar": r.escalarMuros } : {};
    }
    case "Saúde": {
      const r = tabelaSaude[value];
      return r ? { "Resist.": r.resistencia, "Veneno": r.colapsoVeneno } : {};
    }
    case "Condicionamento": {
      const r = tabelaCondicionamento[value];
      return r ? { "Ajst. PV": r.ajustePV, "Ressurr.": r.ressurreicao } : {};
    }
    case "Razão": {
      const r = tabelaRazao[value];
      return r ? { "Círc. Magia": r.circMagia, "Max Magias": r.maxMagias } : {};
    }
    case "Conhecimento": {
      const r = tabelaConhecimento[value];
      return r ? { "Pts Língua": r.pontosLingua, "Aprender": r.aprenderMagias } : {};
    }
    case "Intuição": {
      const r = tabelaIntuicao[value];
      return r ? { "Bônus": r.bonus, "Falha Magia": r.falhasMagia } : {};
    }
    case "Força de Vontade": {
      const r = tabelaForcaVontade[value];
      return r ? { "Def. Magia": r.ajusteDefesaMagia, "Imunidade": r.imunidadeMagia } : {};
    }
    case "Liderança": {
      const r = tabelaLideranca[value];
      return r ? { "Lealdade": r.lealdade, "Aliados": r.numAliados } : {};
    }
    case "Aparência": {
      const r = tabelaAparencia[value];
      return r ? { "Reação": r.ajusteReacao } : {};
    }
    default:
      return {};
  }
}
