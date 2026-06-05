#!/usr/bin/env python3
"""Converte data/dinheiro-equipamento.html em Markdown estruturado."""

from __future__ import annotations

import html
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "data" / "dinheiro-equipamento.html"
OUT_PATH = ROOT / "data" / "dinheiro-equipamento.md"

VARIANT_WORDS = {
    "leve",
    "pesada",
    "pesado",
    "grande",
    "pequeno",
    "pequena",
    "comum",
    "simples",
    "completa",
    "completo",
    "parcial",
    "fino",
    "suntuoso",
    "ornamentado",
    "de montaria",
    "de viagem",
    "de guerra",
    "de passeio",
    "de caça",
    "de infantaria",
    "de cavalaria",
    "de mão",
    "com 1 mão",
    "com 2 mãos",
}

RULE_LABELS = {"tamanho", "tipo", "velocidade", "dano", "armaduras"}

DAMAGE_RE = re.compile(r"\d+d\d", re.I)
PRICE_RE = re.compile(r"\d|po|pp|pc|pe|pl", re.I)


def normalize_text(text: str) -> str:
    text = html.unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean_weapon_name(name: str) -> str:
    name = re.sub(r"\s+\d+$", "", name)
    name = name.replace("L ança", "Lança").replace("P rop", "Prop")
    return normalize_text(name)


def cell_text(raw: str) -> str:
    return normalize_text(raw)


class TableCollector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tables: list[list[list[str]]] = []
        self._depth = 0
        self._in_row = False
        self._in_cell = False
        self._current_table: list[list[str]] | None = None
        self._current_row: list[str] | None = None
        self._cell_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "table":
            if self._depth == 0:
                self._current_table = []
            self._depth += 1
        elif self._depth > 0 and tag == "tr":
            self._in_row = True
            self._current_row = []
        elif self._in_row and tag in ("td", "th"):
            self._in_cell = True
            self._cell_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag in ("td", "th") and self._in_cell:
            text = cell_text("".join(self._cell_parts))
            if self._current_row is not None:
                self._current_row.append(text)
            self._in_cell = False
            self._cell_parts = []
        elif tag == "tr" and self._in_row:
            if self._current_row is not None and self._current_table is not None:
                if any(c for c in self._current_row):
                    self._current_table.append(self._current_row)
            self._in_row = False
            self._current_row = None
        elif tag == "table":
            self._depth -= 1
            if self._depth == 0 and self._current_table:
                self.tables.append(self._current_table)
                self._current_table = None

    def handle_data(self, data: str) -> None:
        if self._in_cell:
            self._cell_parts.append(data)


class DescriptionCollector(HTMLParser):
    RED = "#ed1846"

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.blocks: list[tuple[str, str, str]] = []  # section, name, body
        self._section = "geral"
        self._in_p = False
        self._in_heading = False
        self._heading_parts: list[str] = []
        self._p_parts: list[tuple[str | None, str]] = []
        self._current_color: str | None = None
        self._font_stack: list[str | None] = []
        self._pending: tuple[str, str] | None = None  # section, name

    def handle_starttag(self, tag: str, attrs) -> None:
        attrs_dict = dict(attrs)
        if tag in ("h2", "h3"):
            self._flush_p()
            self._in_heading = True
            self._heading_parts = []
        elif tag == "p":
            self._in_p = True
            self._p_parts = []
        elif tag == "font" and (self._in_p or self._in_heading):
            color = attrs_dict.get("color")
            self._font_stack.append(self._current_color)
            self._current_color = color

    def handle_endtag(self, tag: str) -> None:
        if tag == "font" and (self._in_p or self._in_heading):
            self._current_color = self._font_stack.pop() if self._font_stack else None
        elif tag in ("h2", "h3") and self._in_heading:
            heading = normalize_text("".join(self._heading_parts)).lower()
            if "descrição" in heading and "armadura" in heading:
                self._section = "armaduras"
                self._pending = None
            elif "descrição" in heading and re.search(r"\barma", heading):
                self._section = "armas"
            elif heading == "armas":
                self._section = "armas"
            elif "equipamento" in heading:
                self._section = "equipamento"
            elif "transporte" in heading:
                self._section = "transporte"
            elif "arreios" in heading or "montaria" in heading:
                self._section = "montaria"
            self._in_heading = False
            self._heading_parts = []
        elif tag == "p" and self._in_p:
            self._flush_p()
            self._in_p = False

    def _flush_p(self) -> None:
        if not self._p_parts:
            return

        red_text: list[str] = []
        body_text: list[str] = []
        for color, chunk in self._p_parts:
            chunk = normalize_text(chunk)
            if not chunk:
                continue
            if color == self.RED:
                red_text.append(chunk)
            else:
                body_text.append(chunk)

        body = normalize_text(" ".join(body_text))

        if red_text:
            label = normalize_text("".join(red_text))
            if label.endswith(":"):
                label = label[:-1].strip()
            elif ":" in label:
                name, rest = label.split(":", 1)
                label = name.strip()
                body = normalize_text(rest + (" " + body if body else ""))

            if label.lower() in RULE_LABELS:
                return
            if len(label) > 80:
                return

            if body:
                self.blocks.append((self._section, label, body))
                self._pending = None
            else:
                self._pending = (self._section, label)
        elif body and self._pending:
            sec, name = self._pending
            self.blocks.append((sec, name, body))
            self._pending = None
        elif body and self._section == "armas" and self.blocks:
            sec, name, prev = self.blocks[-1]
            if sec == "armas" and prev and not prev.endswith("."):
                self.blocks[-1] = (sec, name, normalize_text(prev + " " + body))

    def handle_data(self, data: str) -> None:
        if self._in_heading:
            self._heading_parts.append(data)
        elif self._in_p:
            self._p_parts.append((self._current_color, data))


def table_flat_text(rows: list[list[str]]) -> str:
    return " ".join(" ".join(row) for row in rows).lower()


def is_reference_table(rows: list[list[str]]) -> bool:
    flat = table_flat_text(rows)
    markers = (
        "tabela 42",
        "tabela 43",
        "proporções de padrões de troca",
        "capital inicial de personagens",
        "valores de troca",
    )
    return any(m in flat for m in markers)


def row_is_category(name: str, cells: list[str]) -> bool:
    rest = cells[1:] if len(cells) > 1 else []
    if not name:
        return True
    if not rest:
        return False
    return all(not c or c == "-" for c in rest)


def looks_like_weapon_row(cells: list[str]) -> bool:
    if len(cells) < 6:
        return False
    name = cells[0]
    if not name or row_is_category(name, cells):
        return False
    size = cells[3] if len(cells) > 3 else ""
    dmg = " ".join(cells[6:8]) if len(cells) > 6 else ""
    if size.upper() in {"P", "M", "G", "I"}:
        return True
    if DAMAGE_RE.search(dmg):
        return True
    if cells[5] and cells[5].isdigit():
        return True
    return False


def is_weapon_table(rows: list[list[str]]) -> bool:
    flat = table_flat_text(rows)
    if "velocidade" in flat and "dano" in flat:
        return True
    weaponish = sum(1 for row in rows if looks_like_weapon_row(row))
    return weaponish >= 5 and max((len(r) for r in rows), default=0) >= 7


def parse_weapon_rows(rows: list[list[str]]) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    current_group = ""
    current_weapon = ""
    start_idx = 0

    for i, row in enumerate(rows):
        joined = " ".join(row).lower()
        if "velocidade" in joined and "dano" in joined:
            start_idx = i + 1
            break

    for row in rows[start_idx:]:
        if not row or not any(row):
            continue
        cells = row + [""] * (8 - len(row))
        cells = cells[:8]
        name = clean_weapon_name(cells[0])

        if not name:
            continue
        if name.lower() in {"arma", "armas", "p-m", "g"}:
            continue

        if row_is_category(name, cells):
            current_group = name
            items.append(
                {
                    "arma": f"**{name}**",
                    "preço": "",
                    "peso": "",
                    "tamanho": "",
                    "tipo": "",
                    "velocidade": "",
                    "dano_pm": "",
                    "dano_g": "",
                    "_group": "1",
                }
            )
            current_weapon = ""
            continue

        low = name.lower()
        if low in {"com 1 mão", "com 2 mãos"} and current_weapon:
            base = items[-1] if items else None
            if base and not base.get("_group"):
                prefix = f"{current_weapon} ({name})"
                items.append(
                    {
                        "arma": prefix,
                        "preço": cells[1] or base.get("preço", "-"),
                        "peso": cells[2] or base.get("peso", "-"),
                        "tamanho": cells[3] or base.get("tamanho", "-"),
                        "tipo": cells[4] or base.get("tipo", "-"),
                        "velocidade": cells[5],
                        "dano_pm": cells[6],
                        "dano_g": cells[7],
                    }
                )
            continue

        full_name = name
        if current_group and low in VARIANT_WORDS and current_group.lower() not in name.lower():
            full_name = f"{current_group} — {name}"

        entry = {
            "arma": full_name,
            "preço": cells[1] or "-",
            "peso": cells[2] or "-",
            "tamanho": cells[3] or "-",
            "tipo": cells[4] or "-",
            "velocidade": cells[5] or "-",
            "dano_pm": cells[6] or "-",
            "dano_g": cells[7] or "-",
        }
        items.append(entry)
        current_weapon = full_name

    return [i for i in items if i.get("arma")]


def detect_table_title(rows: list[list[str]]) -> str | None:
    for row in rows[:5]:
        joined = normalize_text(" ".join(row))
        if not joined or joined == "-":
            continue
        if re.match(r"^tabela\s+\d+", joined, re.I):
            continue
        if joined.lower() in {"preço", "peso", "item", "arma", "moeda"}:
            continue
        if len(joined) > 4 and row_is_category(joined, row) and "-" not in joined:
            return joined
        if any(
            kw in joined.lower()
            for kw in (
                "alimentação",
                "alojamento",
                "arreios",
                "armadura",
                "equipamento",
                "montaria",
                "serviço",
                "transporte",
                "vestuário",
                "ferramenta",
                "ladrões",
                "clérigo",
                "mago",
                "animal",
                "construção",
                "escriba",
            )
        ):
            return joined
    return None


def infer_item_columns(rows: list[list[str]], title: str | None) -> list[dict[str, str]]:
    data_rows = [r for r in rows if any(cell.strip() for cell in r)]
    if not data_rows:
        return []

    max_cols = max(len(r) for r in data_rows)
    headers_count = min(max_cols, 4)

    # Tabelas 3 colunas costumam ser: item | (vazio) | preço
    price_in_col3 = False
    if headers_count == 3:
        priced_col2 = sum(1 for r in data_rows if len(r) > 1 and PRICE_RE.search(r[1]))
        priced_col3 = sum(1 for r in data_rows if len(r) > 2 and PRICE_RE.search(r[2]))
        price_in_col3 = priced_col3 > priced_col2

    items: list[dict[str, str]] = []
    current_group = title or ""

    for row in data_rows:
        joined = normalize_text(" ".join(row))
        if title and joined == title:
            continue
        if re.match(r"^tabela\s+\d+", joined, re.I):
            continue
        if re.fullmatch(r"[\-\s]+", joined):
            continue

        cells = row + [""] * (headers_count - len(row))
        cells = cells[:headers_count]
        name = cells[0]
        if price_in_col3 and headers_count >= 3:
            price = cells[2]
            weight = ""
            extra = ""
        else:
            price = cells[1] if len(cells) > 1 else ""
            weight = cells[2] if len(cells) > 2 else ""
            extra = cells[3] if len(cells) > 3 else ""

        if not name:
            continue

        if row_is_category(name, cells):
            current_group = name
            continue

        low = name.lower()
        is_variant = low in VARIANT_WORDS or (
            len(name.split()) <= 2
            and price
            and PRICE_RE.search(price)
            and current_group
            and current_group.lower() not in name.lower()
        )

        full_name = f"{current_group} — {name}" if is_variant and current_group else name

        if full_name.lower() in {"preço", "peso", "item", "moeda"}:
            continue

        entry: dict[str, str] = {"item": full_name}
        if headers_count > 1:
            entry["preço"] = price or "-"
        if headers_count > 2:
            entry["peso"] = weight or "-"
        if headers_count > 3:
            entry["extra"] = extra or "-"
        items.append(entry)

    return items


def md_table(headers: list[str], rows: list[dict[str, str]]) -> str:
    if not rows:
        return ""
    keys = [k for k in rows[0].keys() if not k.startswith("_")]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(row.get(k, "-") for k in keys) + " |")
    return "\n".join(lines)


def section_to_desc_bucket(section: str) -> str:
    return "armas" if section == "armas" else "itens"


def normalize_desc_name(name: str) -> str:
    name = re.sub(r"(?<=[a-záéíóúãõâêôç])(?=[A-ZÁÉÍÓÚÃÕÂÊÔÇ])", " ", name)
    name = re.sub(r"(?<=[a-záéíóúãõâêôç])(?=\d)", " ", name)
    return normalize_text(name)


def main() -> None:
    html_content = HTML_PATH.read_text(encoding="utf-8")

    tc = TableCollector()
    tc.feed(html_content)

    dc = DescriptionCollector()
    dc.feed(html_content)

    all_weapons: list[dict[str, str]] = []
    item_tables: list[tuple[str | None, list[dict[str, str]]]] = []

    for table_rows in tc.tables:
        if is_reference_table(table_rows):
            continue
        if is_weapon_table(table_rows):
            weapons = parse_weapon_rows(table_rows)
            if weapons:
                all_weapons.extend(weapons)
            continue

        title = detect_table_title(table_rows)
        flat = table_flat_text(table_rows)
        if "limite de peso para personagem" in flat or "montaria normal movimento" in flat:
            continue
        items = infer_item_columns(table_rows, title)
        if len(items) < 1:
            continue
        if len(items) == 1 and not title:
            continue
        item_tables.append((title, items))

    weapon_names = {
        clean_weapon_name(w["arma"].replace("**", ""))
        for w in all_weapons
        if not w.get("_group")
    }

    weapon_desc: dict[str, str] = {}
    item_desc: dict[str, str] = {}

    for section, name, body in dc.blocks:
        bucket = section_to_desc_bucket(section)
        key = normalize_desc_name(name)
        if not key or not body:
            continue
        target = weapon_desc if bucket == "armas" else item_desc
        if key in target:
            target[key] = normalize_text(target[key] + " " + body)
        else:
            target[key] = body

    lines: list[str] = [
        "# Capítulo 6 — Dinheiro e Equipamento",
        "",
        "> Fonte: `data/dinheiro-equipamento.html` (AD&D 2.5)",
        "> Gerado automaticamente para importação no sistema.",
        "",
        "---",
        "",
        "## Tabelas de Armas",
        "",
        "Colunas: **Arma** | **Preço** | **Peso (kg)** | **Tamanho** | **Tipo** | **Velocidade** | **Dano P/M** | **Dano G**",
        "",
        "### Lista de Armas",
        "",
        md_table(
            ["Arma", "Preço", "Peso", "Tamanho", "Tipo", "Velocidade", "Dano P/M", "Dano G"],
            all_weapons,
        ),
        "",
        "---",
        "",
        "## Tabelas de Itens e Equipamento",
        "",
        "Colunas padrão: **Item** | **Preço** | **Peso** (e **Extra** quando houver).",
        "",
    ]

    seen_titles: set[str] = set()
    for title, items in item_tables:
        section = title or "Equipamento"
        if section in seen_titles:
            section = f"{section} (cont.)"
        seen_titles.add(section)
        lines.append(f"### {section}")
        lines.append("")
        keys = [k for k in items[0].keys() if k != "item"]
        hdrs = ["Item"] + [{"preço": "Preço", "peso": "Peso", "extra": "Extra"}.get(k, k) for k in keys]
        lines.append(md_table(hdrs, items))
        lines.append("")

    lines.extend(["---", "", "## Descrições das Armas", ""])

    for name in sorted(weapon_desc.keys(), key=lambda s: s.lower()):
        lines.extend([f"### {name}", "", weapon_desc[name], ""])

    lines.extend(["---", "", "## Descrições dos Itens", ""])

    for name in sorted(item_desc.keys(), key=lambda s: s.lower()):
        if name in weapon_desc:
            continue
        lines.extend([f"### {name}", "", item_desc[name], ""])

    OUT_PATH.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    print(f"Escrito: {OUT_PATH}")
    print(f"  Armas na tabela: {len(all_weapons)}")
    print(f"  Tabelas de itens: {len(item_tables)}")
    print(f"  Descrições armas: {len(weapon_desc)}")
    print(f"  Descrições itens: {len(item_desc)}")


if __name__ == "__main__":
    main()
