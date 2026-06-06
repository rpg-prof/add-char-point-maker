// Gerado por scripts/generate-sub-attribute-tables.py — não editar manualmente.
// Fonte: data/sub-atributos.pdf (Tabelas 2–13)

export const SUB_ATTRIBUTE_TABLE_MIN = 3;
export const SUB_ATTRIBUTE_TABLE_MAX = 25;

export function clampSubAttributeTableValue(value: number): number {
  return Math.max(SUB_ATTRIBUTE_TABLE_MIN, Math.min(SUB_ATTRIBUTE_TABLE_MAX, value));
}

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
  19: { cargaPermitida: "219,5 kg" },
  20: { cargaPermitida: "242,5 kg" },
  21: { cargaPermitida: "287,5 kg" },
  22: { cargaPermitida: "356,5 kg" },
  23: { cargaPermitida: "423,5 kg" },
  24: { cargaPermitida: "559,5 kg" },
  25: { cargaPermitida: "695,5 kg" },
};

export interface MusculosRow {
  chancAcerto: string;
  ajstDano: string;
  sustentacao: string;
  abrirPortas: string;
  dobrarBarras: string;
}
export const tabelaMusculos: Record<number, MusculosRow> = {
  3: { chancAcerto: "-3", ajstDano: "-1", sustentacao: "4,5 kg", abrirPortas: "2", dobrarBarras: "0%" },
  4: { chancAcerto: "-2", ajstDano: "-1", sustentacao: "11 kg", abrirPortas: "3", dobrarBarras: "0%" },
  5: { chancAcerto: "-2", ajstDano: "-1", sustentacao: "11 kg", abrirPortas: "3", dobrarBarras: "0%" },
  6: { chancAcerto: "-1", ajstDano: "0", sustentacao: "25 kg", abrirPortas: "4", dobrarBarras: "0%" },
  7: { chancAcerto: "-1", ajstDano: "0", sustentacao: "25 kg", abrirPortas: "4", dobrarBarras: "0%" },
  8: { chancAcerto: "0", ajstDano: "0", sustentacao: "41 kg", abrirPortas: "5", dobrarBarras: "1%" },
  9: { chancAcerto: "0", ajstDano: "0", sustentacao: "41 kg", abrirPortas: "5", dobrarBarras: "1%" },
  10: { chancAcerto: "0", ajstDano: "0", sustentacao: "52 kg", abrirPortas: "6", dobrarBarras: "2%" },
  11: { chancAcerto: "0", ajstDano: "0", sustentacao: "52 kg", abrirPortas: "6", dobrarBarras: "2%" },
  12: { chancAcerto: "0", ajstDano: "0", sustentacao: "63,5 kg", abrirPortas: "7", dobrarBarras: "4%" },
  13: { chancAcerto: "0", ajstDano: "0", sustentacao: "63,5 kg", abrirPortas: "7", dobrarBarras: "4%" },
  14: { chancAcerto: "0", ajstDano: "0", sustentacao: "77 kg", abrirPortas: "8", dobrarBarras: "7%" },
  15: { chancAcerto: "0", ajstDano: "0", sustentacao: "77 kg", abrirPortas: "8", dobrarBarras: "7%" },
  16: { chancAcerto: "0", ajstDano: "+1", sustentacao: "88,5 kg", abrirPortas: "9", dobrarBarras: "10%" },
  17: { chancAcerto: "+1", ajstDano: "+1", sustentacao: "99,5 kg", abrirPortas: "10", dobrarBarras: "13%" },
  18: { chancAcerto: "+1", ajstDano: "+3", sustentacao: "115,5 kg", abrirPortas: "11", dobrarBarras: "16%" },
  19: { chancAcerto: "+3", ajstDano: "+7", sustentacao: "290 kg", abrirPortas: "19(17)", dobrarBarras: "95%" },
  20: { chancAcerto: "+3", ajstDano: "+8", sustentacao: "317 kg", abrirPortas: "19(18)", dobrarBarras: "99%" },
  21: { chancAcerto: "+3", ajstDano: "+9", sustentacao: "367 kg", abrirPortas: "19(18)", dobrarBarras: "99%" },
  22: { chancAcerto: "+4", ajstDano: "+10", sustentacao: "439,5 kg", abrirPortas: "19(18)", dobrarBarras: "99%" },
  23: { chancAcerto: "+4", ajstDano: "+11", sustentacao: "512 kg", abrirPortas: "19(18)", dobrarBarras: "99%" },
  24: { chancAcerto: "+5", ajstDano: "+12", sustentacao: "653 kg", abrirPortas: "19(18)", dobrarBarras: "99%" },
  25: { chancAcerto: "+6", ajstDano: "+14", sustentacao: "695 kg", abrirPortas: "19(18)", dobrarBarras: "99%" },
};

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
  19: { ataqueDistancia: "+3", furtarBolsos: "+20%", abrirFechaduras: "+20%" },
  20: { ataqueDistancia: "+3", furtarBolsos: "+20%", abrirFechaduras: "+25%" },
  21: { ataqueDistancia: "+4", furtarBolsos: "+25%", abrirFechaduras: "+25%" },
  22: { ataqueDistancia: "+4", furtarBolsos: "+30%", abrirFechaduras: "+30%" },
  23: { ataqueDistancia: "+4", furtarBolsos: "+30%", abrirFechaduras: "+30%" },
  24: { ataqueDistancia: "+5", furtarBolsos: "+30%", abrirFechaduras: "+35%" },
  25: { ataqueDistancia: "+5", furtarBolsos: "+30%", abrirFechaduras: "+35%" },
};

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
  19: { ajusteReacao: "+3", ajusteDefensivo: "-4", moverSilencio: "+15%", escalarMuros: "+15%" },
  20: { ajusteReacao: "+3", ajusteDefensivo: "-4", moverSilencio: "+15%", escalarMuros: "+20%" },
  21: { ajusteReacao: "+4", ajusteDefensivo: "-5", moverSilencio: "+20%", escalarMuros: "+20%" },
  22: { ajusteReacao: "+4", ajusteDefensivo: "-5", moverSilencio: "+20%", escalarMuros: "+25%" },
  23: { ajusteReacao: "+5", ajusteDefensivo: "-6", moverSilencio: "+25%", escalarMuros: "+25%" },
  24: { ajusteReacao: "+5", ajusteDefensivo: "-6", moverSilencio: "+25%", escalarMuros: "+30%" },
  25: { ajusteReacao: "+5", ajusteDefensivo: "-6", moverSilencio: "+30%", escalarMuros: "+30%" },
};

export interface SaudeRow {
  colapso: string;
  resistenciaVeneno: string;
}
export const tabelaSaude: Record<number, SaudeRow> = {
  3: { colapso: "35%", resistenciaVeneno: "0" },
  4: { colapso: "40%", resistenciaVeneno: "0" },
  5: { colapso: "45%", resistenciaVeneno: "0" },
  6: { colapso: "50%", resistenciaVeneno: "0" },
  7: { colapso: "55%", resistenciaVeneno: "0" },
  8: { colapso: "60%", resistenciaVeneno: "0" },
  9: { colapso: "65%", resistenciaVeneno: "0" },
  10: { colapso: "70%", resistenciaVeneno: "0" },
  11: { colapso: "75%", resistenciaVeneno: "0" },
  12: { colapso: "80%", resistenciaVeneno: "0" },
  13: { colapso: "85%", resistenciaVeneno: "0" },
  14: { colapso: "88%", resistenciaVeneno: "0" },
  15: { colapso: "90%", resistenciaVeneno: "0" },
  16: { colapso: "95%", resistenciaVeneno: "0" },
  17: { colapso: "97%", resistenciaVeneno: "0" },
  18: { colapso: "99%", resistenciaVeneno: "0" },
  19: { colapso: "99%", resistenciaVeneno: "+1" },
  20: { colapso: "99%", resistenciaVeneno: "+1" },
  21: { colapso: "99%", resistenciaVeneno: "+2" },
  22: { colapso: "99%", resistenciaVeneno: "+2" },
  23: { colapso: "99%", resistenciaVeneno: "+3" },
  24: { colapso: "99%", resistenciaVeneno: "+3" },
  25: { colapso: "99%", resistenciaVeneno: "+4" },
};

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
  19: { ajustePV: "+2(+5)", ressurreicao: "100%" },
  20: { ajustePV: "+2(+5)¹", ressurreicao: "100%" },
  21: { ajustePV: "+2(+6)²", ressurreicao: "100%" },
  22: { ajustePV: "+2(+6)²", ressurreicao: "100%" },
  23: { ajustePV: "+2(+6)³", ressurreicao: "100%" },
  24: { ajustePV: "+2(+7)", ressurreicao: "100%" },
  25: { ajustePV: "+2(+7)³", ressurreicao: "100%" },
};

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
  19: { circMagia: "9º", maxMagias: "Todas", imunidadeMagia: "1" },
  20: { circMagia: "9º", maxMagias: "Todas", imunidadeMagia: "2" },
  21: { circMagia: "9º", maxMagias: "Todas", imunidadeMagia: "3" },
  22: { circMagia: "9º", maxMagias: "Todas", imunidadeMagia: "4" },
  23: { circMagia: "9º", maxMagias: "Todas", imunidadeMagia: "5" },
  24: { circMagia: "9º", maxMagias: "Todas", imunidadeMagia: "6" },
  25: { circMagia: "9º", maxMagias: "Todas", imunidadeMagia: "7" },
};

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
  19: { pontosLingua: "8", aprenderMagias: "95%" },
  20: { pontosLingua: "9", aprenderMagias: "96%" },
  21: { pontosLingua: "10", aprenderMagias: "97%" },
  22: { pontosLingua: "11", aprenderMagias: "98%" },
  23: { pontosLingua: "12", aprenderMagias: "99%" },
  24: { pontosLingua: "15", aprenderMagias: "100%" },
  25: { pontosLingua: "20", aprenderMagias: "100%" },
};

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
  19: { bonus: "1º, 3º", falhasMagia: "0%" },
  20: { bonus: "2º, 4º", falhasMagia: "0%" },
  21: { bonus: "3º, 5º", falhasMagia: "0%" },
  22: { bonus: "4º, 5º", falhasMagia: "0%" },
  23: { bonus: "1º, 6º", falhasMagia: "0%" },
  24: { bonus: "5º, 6º", falhasMagia: "0%" },
  25: { bonus: "6º, 7º", falhasMagia: "0%" },
};

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
  19: { ajusteDefesaMagia: "+4", imunidadeMagia: "1*" },
  20: { ajusteDefesaMagia: "+4", imunidadeMagia: "2*" },
  21: { ajusteDefesaMagia: "+4", imunidadeMagia: "3*" },
  22: { ajusteDefesaMagia: "+4", imunidadeMagia: "4*" },
  23: { ajusteDefesaMagia: "+4", imunidadeMagia: "5*" },
  24: { ajusteDefesaMagia: "+4", imunidadeMagia: "6*" },
  25: { ajusteDefesaMagia: "+4", imunidadeMagia: "7*" },
};

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
  19: { lealdade: "+10", numAliados: "20" },
  20: { lealdade: "+12", numAliados: "25" },
  21: { lealdade: "+14", numAliados: "30" },
  22: { lealdade: "+16", numAliados: "35" },
  23: { lealdade: "+18", numAliados: "40" },
  24: { lealdade: "+20", numAliados: "45" },
  25: { lealdade: "+20", numAliados: "50" },
};

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
  19: { ajusteReacao: "+8" },
  20: { ajusteReacao: "+9" },
  21: { ajusteReacao: "+10" },
  22: { ajusteReacao: "+11" },
  23: { ajusteReacao: "+12" },
  24: { ajusteReacao: "+13" },
  25: { ajusteReacao: "+14" },
};
