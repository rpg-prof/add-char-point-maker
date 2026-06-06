#!/usr/bin/env python3
"""Gera tabelas de sub-atributos (Tabelas 2–13) a partir do PDF sub-atributos.pdf."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src" / "data" / "subAttributeTables.ts"


def expand_ranges(rows: list[tuple]) -> dict[int, dict]:
    """Expande entradas como (range(4, 6), data) para cada inteiro."""
    out: dict[int, dict] = {}
    for key, data in rows:
        if isinstance(key, int):
            out[key] = data
        else:
            for v in key:
                out[v] = data
    return out


def emit_table(name: str, interface: str, fields: list[str], data: dict[int, dict]) -> str:
    lines = [f"export interface {interface} {{"] + [
        f"  {f}: string;" for f in fields
    ] + ["}", f"export const {name}: Record<number, {interface}> = {{"]
    for k in sorted(data.keys()):
        row = data[k]
        parts = ", ".join(f'{f}: {json.dumps(row[f], ensure_ascii=False)}' for f in fields)
        lines.append(f"  {k}: {{ {parts} }},")
    lines.append("};")
    return "\n".join(lines)


# --- Tabela 2: Resistência ---
resistencia_rows = [
    (3, {"cargaPermitida": "2 kg"}),
    (range(4, 6), {"cargaPermitida": "4,5 kg"}),
    (range(6, 8), {"cargaPermitida": "9 kg"}),
    (range(8, 10), {"cargaPermitida": "16 kg"}),
    (range(10, 12), {"cargaPermitida": "18 kg"}),
    (range(12, 14), {"cargaPermitida": "20,5 kg"}),
    (range(14, 16), {"cargaPermitida": "25 kg"}),
    (16, {"cargaPermitida": "32 kg"}),
    (17, {"cargaPermitida": "38,5 kg"}),
    (18, {"cargaPermitida": "50 kg"}),
    (19, {"cargaPermitida": "219,5 kg"}),
    (20, {"cargaPermitida": "242,5 kg"}),
    (21, {"cargaPermitida": "287,5 kg"}),
    (22, {"cargaPermitida": "356,5 kg"}),
    (23, {"cargaPermitida": "423,5 kg"}),
    (24, {"cargaPermitida": "559,5 kg"}),
    (25, {"cargaPermitida": "695,5 kg"}),
]

# --- Tabela 3: Músculos ---
musculos_template = [
    (3, "-3", "-1", "4,5 kg", "2", "0%"),
    (range(4, 6), "-2", "-1", "11 kg", "3", "0%"),
    (range(6, 8), "-1", "0", "25 kg", "4", "0%"),
    (range(8, 10), "0", "0", "41 kg", "5", "1%"),
    (range(10, 12), "0", "0", "52 kg", "6", "2%"),
    (range(12, 14), "0", "0", "63,5 kg", "7", "4%"),
    (range(14, 16), "0", "0", "77 kg", "8", "7%"),
    (16, "0", "+1", "88,5 kg", "9", "10%"),
    (17, "+1", "+1", "99,5 kg", "10", "13%"),
    (18, "+1", "+3", "115,5 kg", "11", "16%"),
    (19, "+3", "+7", "290 kg", "19(17)", "95%"),
    (20, "+3", "+8", "317 kg", "19(18)", "99%"),
    (21, "+3", "+9", "367 kg", "19(18)", "99%"),
    (22, "+4", "+10", "439,5 kg", "19(18)", "99%"),
    (23, "+4", "+11", "512 kg", "19(18)", "99%"),
    (24, "+5", "+12", "653 kg", "19(18)", "99%"),
    (25, "+6", "+14", "695 kg", "19(18)", "99%"),
]
musculos_rows = [
    (
        key,
        {
            "chancAcerto": a,
            "ajstDano": b,
            "sustentacao": c,
            "abrirPortas": d,
            "dobrarBarras": e,
        },
    )
    for key, a, b, c, d, e in musculos_template
]

# --- Tabela 4: Precisão ---
precisao_template = [
    (3, "-3", "-30%", "-30%"),
    (4, "-2", "-25%", "-25%"),
    (5, "-1", "-25%", "-20%"),
    (6, "0", "-20%", "-20%"),
    (7, "0", "-20%", "-15%"),
    (8, "0", "-15%", "-15%"),
    (9, "0", "-15%", "-10%"),
    (10, "0", "-10%", "-5%"),
    (11, "0", "-5%", "0%"),
    (range(12, 16), "0", "0%", "0%"),
    (16, "+1", "0%", "+5%"),
    (17, "+2", "+5%", "+10%"),
    (18, "+2", "+10%", "+15%"),
    (19, "+3", "+20%", "+20%"),
    (20, "+3", "+20%", "+25%"),
    (21, "+4", "+25%", "+25%"),
    (22, "+4", "+30%", "+30%"),
    (23, "+4", "+30%", "+30%"),
    (24, "+5", "+30%", "+35%"),
    (25, "+5", "+30%", "+35%"),
]
precisao_rows = [
    (key, {"ataqueDistancia": a, "furtarBolsos": b, "abrirFechaduras": c})
    for key, a, b, c in precisao_template
]

# --- Tabela 5: Equilíbrio ---
equilibrio_template = [
    (3, "-3", "+4", "-30%", "-30%"),
    (4, "-2", "+3", "-30%", "-25%"),
    (5, "-1", "+2", "-30%", "-20%"),
    (6, "0", "+1", "-25%", "-20%"),
    (7, "0", "0", "-25%", "-15%"),
    (8, "0", "0", "-20%", "-15%"),
    (9, "0", "0", "-20%", "-10%"),
    (10, "0", "0", "-15%", "-5%"),
    (11, "0", "0", "-10%", "0%"),
    (12, "0", "0", "-5%", "0%"),
    (range(13, 15), "0", "0", "0%", "0%"),
    (15, "0", "-1", "0%", "0%"),
    (16, "+1", "-2", "0%", "0%"),
    (17, "+2", "-3", "+5%", "+5%"),
    (18, "+2", "-4", "+10%", "+10%"),
    (19, "+3", "-4", "+15%", "+15%"),
    (20, "+3", "-4", "+15%", "+20%"),
    (21, "+4", "-5", "+20%", "+20%"),
    (22, "+4", "-5", "+20%", "+25%"),
    (23, "+5", "-6", "+25%", "+25%"),
    (24, "+5", "-6", "+25%", "+30%"),
    (25, "+5", "-6", "+30%", "+30%"),
]
equilibrio_rows = [
    (
        key,
        {
            "ajusteReacao": a,
            "ajusteDefensivo": b,
            "moverSilencio": c,
            "escalarMuros": d,
        },
    )
    for key, a, b, c, d in equilibrio_template
]

# --- Tabela 6: Saúde ---
saude_colapso = [
    "35%", "40%", "45%", "50%", "55%", "60%", "65%", "70%", "75%", "80%",
    "85%", "88%", "90%", "95%", "97%", "99%",
] + ["99%"] * 7
saude_veneno = ["0"] * 16 + ["+1", "+1", "+2", "+2", "+3", "+3", "+4"]
saude_rows = [
    (v, {"colapso": saude_colapso[v - 3], "resistenciaVeneno": saude_veneno[v - 3]})
    for v in range(3, 26)
]

# --- Tabela 7: Condicionamento ---
cond_template = [
    (3, "-2", "40%"),
    (4, "-1", "45%"),
    (5, "-1", "50%"),
    (6, "-1", "55%"),
    (7, "0", "60%"),
    (8, "0", "65%"),
    (9, "0", "70%"),
    (10, "0", "75%"),
    (11, "0", "80%"),
    (12, "0", "85%"),
    (13, "0", "90%"),
    (14, "0", "92%"),
    (15, "+1", "94%"),
    (16, "+2", "96%"),
    (17, "+2(+3)", "98%"),
    (18, "+2(+4)", "100%"),
    (19, "+2(+5)", "100%"),
    (20, "+2(+5)¹", "100%"),
    (21, "+2(+6)²", "100%"),
    (22, "+2(+6)²", "100%"),
    (23, "+2(+6)³", "100%"),
    (24, "+2(+7)", "100%"),
    (25, "+2(+7)³", "100%"),
]
cond_rows = [
    (k, {"ajustePV": a, "ressurreicao": b}) for k, a, b in cond_template
]

# --- Tabela 8: Razão ---
razao_template = [
    (range(3, 9), "—", "—", "—"),
    (9, "4º", "6", "—"),
    (range(10, 12), "5º", "7", "—"),
    (12, "6º", "7", "—"),
    (13, "6º", "9", "—"),
    (14, "7º", "9", "—"),
    (15, "7º", "11", "—"),
    (16, "8º", "11", "—"),
    (17, "8º", "14", "—"),
    (18, "9º", "18", "—"),
    (19, "9º", "Todas", "1"),
    (20, "9º", "Todas", "2"),
    (21, "9º", "Todas", "3"),
    (22, "9º", "Todas", "4"),
    (23, "9º", "Todas", "5"),
    (24, "9º", "Todas", "6"),
    (25, "9º", "Todas", "7"),
]
razao_rows = [
    (key, {"circMagia": a, "maxMagias": b, "imunidadeMagia": c})
    for key, a, b, c in razao_template
]

# --- Tabela 9: Conhecimento ---
conhec_template = [
    (range(3, 9), "1", "—"),
    (9, "2", "35%"),
    (10, "2", "40%"),
    (11, "2", "45%"),
    (12, "3", "50%"),
    (13, "3", "55%"),
    (14, "4", "60%"),
    (15, "4", "65%"),
    (16, "5", "70%"),
    (17, "6", "75%"),
    (18, "7", "85%"),
    (19, "8", "95%"),
    (20, "9", "96%"),
    (21, "10", "97%"),
    (22, "11", "98%"),
    (23, "12", "99%"),
    (24, "15", "100%"),
    (25, "20", "100%"),
]
conhec_rows = [
    (key, {"pontosLingua": a, "aprenderMagias": b}) for key, a, b in conhec_template
]

# --- Tabela 10: Intuição ---
intuicao_bonus = [
    "0", "0", "0", "0", "0", "0", "0", "0", "0", "0",
    "1º", "1º", "2º", "2º", "3º", "4º",
    "1º, 3º", "2º, 4º", "3º, 5º", "4º, 5º", "1º, 6º", "5º, 6º", "6º, 7º",
]
intuicao_falha = [
    "50%", "45%", "40%", "35%", "30%", "25%", "20%", "15%", "10%", "5%",
] + ["0%"] * 13
intuicao_rows = [
    (
        v,
        {"bonus": intuicao_bonus[v - 3], "falhasMagia": intuicao_falha[v - 3]},
    )
    for v in range(3, 26)
]

# --- Tabela 11: Força de Vontade ---
fv_template = [
    (3, "-3", "—"),
    (4, "-2", "—"),
    (5, "-1", "—"),
    (6, "-1", "—"),
    (7, "-1", "—"),
    (range(8, 15), "0", "—"),
    (15, "+1", "—"),
    (16, "+2", "—"),
    (17, "+3", "—"),
    (18, "+4", "—"),
    (19, "+4", "1*"),
    (20, "+4", "2*"),
    (21, "+4", "3*"),
    (22, "+4", "4*"),
    (23, "+4", "5*"),
    (24, "+4", "6*"),
    (25, "+4", "7*"),
]
fv_rows = [
    (key, {"ajusteDefesaMagia": a, "imunidadeMagia": b}) for key, a, b in fv_template
]

# --- Tabela 12: Liderança ---
lid_template = [
    (3, "-6", "1"),
    (4, "-5", "1"),
    (5, "-4", "2"),
    (6, "-3", "2"),
    (7, "-2", "3"),
    (8, "-1", "3"),
    (range(9, 12), "0", "4"),
    (range(12, 14), "0", "5"),
    (14, "+1", "6"),
    (15, "+3", "7"),
    (16, "+4", "8"),
    (17, "+6", "10"),
    (18, "+8", "15"),
    (19, "+10", "20"),
    (20, "+12", "25"),
    (21, "+14", "30"),
    (22, "+16", "35"),
    (23, "+18", "40"),
    (24, "+20", "45"),
    (25, "+20", "50"),
]
lid_rows = [
    (key, {"lealdade": a, "numAliados": b}) for key, a, b in lid_template
]

# --- Tabela 13: Aparência ---
ap_template = [
    (3, "-5"),
    (4, "-4"),
    (5, "-3"),
    (6, "-2"),
    (7, "-1"),
    (range(8, 13), "0"),
    (13, "+1"),
    (14, "+2"),
    (15, "+3"),
    (16, "+5"),
    (17, "+6"),
    (18, "+7"),
    (19, "+8"),
    (20, "+9"),
    (21, "+10"),
    (22, "+11"),
    (23, "+12"),
    (24, "+13"),
    (25, "+14"),
]
ap_rows = [(key, {"ajusteReacao": a}) for key, a in ap_template]


def main() -> None:
    tables = [
        emit_table(
            "tabelaResistencia",
            "ResistenciaRow",
            ["cargaPermitida"],
            expand_ranges(resistencia_rows),
        ),
        emit_table(
            "tabelaMusculos",
            "MusculosRow",
            ["chancAcerto", "ajstDano", "sustentacao", "abrirPortas", "dobrarBarras"],
            expand_ranges(musculos_rows),
        ),
        emit_table(
            "tabelaPrecisao",
            "PrecisaoRow",
            ["ataqueDistancia", "furtarBolsos", "abrirFechaduras"],
            expand_ranges(precisao_rows),
        ),
        emit_table(
            "tabelaEquilibrio",
            "EquilibrioRow",
            ["ajusteReacao", "ajusteDefensivo", "moverSilencio", "escalarMuros"],
            expand_ranges(equilibrio_rows),
        ),
        emit_table(
            "tabelaSaude",
            "SaudeRow",
            ["colapso", "resistenciaVeneno"],
            expand_ranges(saude_rows),
        ),
        emit_table(
            "tabelaCondicionamento",
            "CondicionamentoRow",
            ["ajustePV", "ressurreicao"],
            expand_ranges(cond_rows),
        ),
        emit_table(
            "tabelaRazao",
            "RazaoRow",
            ["circMagia", "maxMagias", "imunidadeMagia"],
            expand_ranges(razao_rows),
        ),
        emit_table(
            "tabelaConhecimento",
            "ConhecimentoRow",
            ["pontosLingua", "aprenderMagias"],
            expand_ranges(conhec_rows),
        ),
        emit_table(
            "tabelaIntuicao",
            "IntuicaoRow",
            ["bonus", "falhasMagia"],
            expand_ranges(intuicao_rows),
        ),
        emit_table(
            "tabelaForcaVontade",
            "ForcaVontadeRow",
            ["ajusteDefesaMagia", "imunidadeMagia"],
            expand_ranges(fv_rows),
        ),
        emit_table(
            "tabelaLideranca",
            "LiderancaRow",
            ["lealdade", "numAliados"],
            expand_ranges(lid_rows),
        ),
        emit_table(
            "tabelaAparencia",
            "AparenciaRow",
            ["ajusteReacao"],
            expand_ranges(ap_rows),
        ),
    ]

    header = (
        "// Gerado por scripts/generate-sub-attribute-tables.py — não editar manualmente.\n"
        "// Fonte: data/sub-atributos.pdf (Tabelas 2–13)\n\n"
        "export const SUB_ATTRIBUTE_TABLE_MIN = 3;\n"
        "export const SUB_ATTRIBUTE_TABLE_MAX = 25;\n\n"
        "export function clampSubAttributeTableValue(value: number): number {\n"
        "  return Math.max(SUB_ATTRIBUTE_TABLE_MIN, Math.min(SUB_ATTRIBUTE_TABLE_MAX, value));\n"
        "}\n\n"
    )

    OUT.write_text(header + "\n\n".join(tables) + "\n", encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
