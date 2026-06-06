// Sub-attribute definitions: each main attribute splits into two sub-attributes
// The user can adjust each sub-attribute by +2/-2 from the base attribute value
// The sum of both sub-attributes must equal 2x the main attribute value

import {
  clampSubAttributeTableValue,
  tabelaAparencia,
  tabelaCondicionamento,
  tabelaConhecimento,
  tabelaEquilibrio,
  tabelaForcaVontade,
  tabelaIntuicao,
  tabelaLideranca,
  tabelaMusculos,
  tabelaPrecisao,
  tabelaRazao,
  tabelaResistencia,
  tabelaSaude,
} from "@/data/subAttributeTables";

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

/** Retorna os bônus/modificadores da tabela do sub-atributo (Tabelas 2–13, valores 3–25). */
export function getSubAttributeBonuses(subName: SubAttributeName, value: number): Record<string, string> {
  const v = clampSubAttributeTableValue(value);

  switch (subName) {
    case "Resistência": {
      const r = tabelaResistencia[v];
      return r ? { "Carga Permitida": r.cargaPermitida } : {};
    }
    case "Músculos": {
      const r = tabelaMusculos[v];
      return r
        ? {
            Acerto: r.chancAcerto,
            Dano: r.ajstDano,
            Sustentação: r.sustentacao,
            "Abrir Portas": r.abrirPortas,
            "Dobrar Barras": r.dobrarBarras,
          }
        : {};
    }
    case "Precisão": {
      const r = tabelaPrecisao[v];
      return r
        ? {
            "Atq. Dist.": r.ataqueDistancia,
            Furtar: r.furtarBolsos,
            Fechaduras: r.abrirFechaduras,
          }
        : {};
    }
    case "Equilíbrio": {
      const r = tabelaEquilibrio[v];
      return r
        ? {
            Reação: r.ajusteReacao,
            Defesa: r.ajusteDefensivo,
            Silêncio: r.moverSilencio,
            Escalar: r.escalarMuros,
        }
        : {};
    }
    case "Saúde": {
      const r = tabelaSaude[v];
      return r ? { Colapso: r.colapso, "Res. Veneno": r.resistenciaVeneno } : {};
    }
    case "Condicionamento": {
      const r = tabelaCondicionamento[v];
      return r ? { "Ajst. PV": r.ajustePV, "Ressurr.": r.ressurreicao } : {};
    }
    case "Razão": {
      const r = tabelaRazao[v];
      return r
        ? {
            "Círc. Magia": r.circMagia,
            "Max Magias": r.maxMagias,
            Imunidade: r.imunidadeMagia,
          }
        : {};
    }
    case "Conhecimento": {
      const r = tabelaConhecimento[v];
      return r ? { "Pts Língua": r.pontosLingua, Aprender: r.aprenderMagias } : {};
    }
    case "Intuição": {
      const r = tabelaIntuicao[v];
      return r ? { "Magias Bônus": r.bonus, "Falha Magia": r.falhasMagia } : {};
    }
    case "Força de Vontade": {
      const r = tabelaForcaVontade[v];
      return r ? { "Def. Magia": r.ajusteDefesaMagia, Imunidade: r.imunidadeMagia } : {};
    }
    case "Liderança": {
      const r = tabelaLideranca[v];
      return r ? { Lealdade: r.lealdade, Aliados: r.numAliados } : {};
    }
    case "Aparência": {
      const r = tabelaAparencia[v];
      return r ? { Reação: r.ajusteReacao } : {};
    }
    default:
      return {};
  }
}

// Re-export tables for direct access if needed
export {
  clampSubAttributeTableValue,
  SUB_ATTRIBUTE_TABLE_MIN,
  SUB_ATTRIBUTE_TABLE_MAX,
  tabelaResistencia,
  tabelaMusculos,
  tabelaPrecisao,
  tabelaEquilibrio,
  tabelaSaude,
  tabelaCondicionamento,
  tabelaRazao,
  tabelaConhecimento,
  tabelaIntuicao,
  tabelaForcaVontade,
  tabelaLideranca,
  tabelaAparencia,
} from "@/data/subAttributeTables";
