#!/usr/bin/env python3
"""Gera src/data/equipmentCatalog.ts a partir dos dados de equipamento, armas e armaduras."""

from __future__ import annotations

import json
import re
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "data" / "dinheiro-equipamento.md"
EQUIPAMENTO_HTML_PATH = ROOT / "data" / "equipamento.html"
ARMOR_HTML_PATH = ROOT / "data" / "armaduras.html"
OUT_PATH = ROOT / "src" / "data" / "equipmentCatalog.ts"

EQUIPAMENTO_SECTION_KEYWORDS: list[tuple[str, str]] = [
    ("arreios e armaduras para montaria", "montaria"),
    ("meios de transporte", "transporte"),
    ("alimentação e alojamento", "alimentacao"),
    ("equipamento variado", "equipamento"),
    ("montaria", "montaria"),
    ("animais", "animais"),
    ("transporte", "transporte"),
    ("vestuário", "vestuario"),
]

ARMOR_KEYWORDS = (
    "cota de malha",
    "corselete",
    "proteção de couro",
    "brigandina",
    "brunea",
    "armadura de",
    "armadura completa",
    "escudo",
    "broquel",
    "couro batido",
    "acolchoad",
)

SKIP_SECTIONS = {
    "equipamento (cont.)",
    "descrições das armas",
    "descrições dos itens",
}

MOUNT_PREFIX = "armadura para cavalo"

SECTION_TO_TAB = {
    "lista de armas": "armas",
    "armaduras (complemento)": "armaduras",
    "equipamento": "equipamento",
    "vestuário": "vestuario",
    "alimentação e alojamento": "alimentacao",
    "suprimento doméstico": "suprimentos",
    "animais": "animais",
    "meios de transporte": "transporte",
    "serviços": "servicos",
    "arreios e armaduras para montaria": "montaria",
}

WEAPON_GROUP_ALIASES = {
    "arco": "arco",
    "armas de haste": "haste",
    "besta": "besta",
    "espada": "espada",
    "lança": "lanca",
    "lanca": "lanca",
}

WEAPON_GROUP_DESC_KEYS = {
    "arco": "arco",
    "besta": "besta",
    "lanca": "lanca",
    "haste": "armasdehaste",
}

# Nome do item (normalizado) → chave da descrição no MD
NAME_TO_DESC_KEY: dict[str, str] = {
    "acoite": "acoite",
    "adagaoupunhal": "adaga",
    "armaduradebatalha": "armaduradebatalha",
    "armaduradeplacasparcial": "lorigasegmentada",
    "balancadecomerciante": "balancadecomerciante",
    "becdecorbin": "becdecorbin",
    "billguisarme": "billguisarme",
    "brigandina": "brigandina",
    "brunea": "brunea",
    "lorigasegmentada": "lorigasegmentada",
    "broquel": "escudos",
    "conjuntodeferramentasparaladroes": "ferramentaseacessoriosparaladroes",
    "corseleteacolchoado": "corseleteacolchoado",
    "corseletedecouro": "corseletedecouro",
    "corseletedecourobatido": "corseletedecourobatido",
    "cotadetalas": "cotadetalas",
    "cotademalha": "cotademalha",
    "gibaodepeles": "gibaodepelesloriga",
    "loriga": "gibaodepelesloriga",
    "armaduradebronze": "armaduradebronze",
    "armadurasimples": "armadurasimplesbrigandina",
    "armaduracompleta": "armaduradebatalha",
    "escudocorporal": "escudos",
    "escudomedio": "escudos",
    "escudopequeno": "escudos",
    "espadabastarda": "espadabastarda",
    "fauchardgancho": "fauchardgancho",
    "glaiveguisarme": "glaiveguisarme",
    "guisarmevoulge": "guisarmevoulge",
    "khopesh": "espadakopesh",
    "martelolucerno": "martelolucerno",
    "protecaodecouroouacolchoada": "corseleteacolchoado",
    "selademontaria": "selas",
    "seladeviagem": "selas",
}


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text, flags=re.UNICODE)
    text = re.sub(r"\s+", "-", text.strip())
    return text[:80] or "item"


def parse_price_pc(raw: str) -> int | None:
    if not raw or raw.strip() in {"-", "—", ""}:
        return None
    text = raw.strip().lower().replace(".", "").replace(",", ".")
    if re.search(r"\ba\s+\d", text):
        return None
    if "/" in text:
        left = text.split("/", 1)[0].strip()
        return parse_price_pc(left)
    total = 0.0
    found = False
    for amount, unit in re.findall(
        r"(\d+(?:\.\d+)?)\s*(po|pp|pc|p\.o\.|p\.p\.|p\.c\.)", text
    ):
        found = True
        value = float(amount)
        if unit.startswith("po"):
            total += value * 100
        elif unit.startswith("pp"):
            total += value * 10
        else:
            total += value
    if not found:
        return None
    return max(0, round(total))


def parse_weight_kg(raw: str) -> float | None:
    if not raw or raw.strip() in {"-", "—", "*", "**", ""}:
        return 0.0
    text = raw.strip().lower().replace(",", ".")
    if "kg" in text:
        m = re.search(r"(\d+(?:\.\d+)?)\s*kg", text)
        if m:
            return float(m.group(1))
    if "g" in text and "kg" not in text:
        parts = re.findall(r"(\d+(?:\.\d+)?)\s*g", text)
        if parts:
            values = [float(p) / 1000 for p in parts]
            return sum(values) / len(values)
    if re.fullmatch(r"\d+(?:\.\d+)?", text):
        return float(text)
    if "x" in text and re.search(r"\d{2,}", text):
        return 0.0
    return 0.0


def classify_item(name: str, section: str) -> str:
    lower = name.lower()
    if section == "lista de armas" or section == "tabelas de armas":
        return "arma"
    if lower.startswith(MOUNT_PREFIX):
        return "equipamento"
    if any(k in lower for k in ARMOR_KEYWORDS):
        return "armadura"
    if "escudo" in lower or "broquel" in lower:
        return "armadura"
    return "equipamento"


def derive_tab(section: str, category: str) -> str:
    if category == "armadura":
        return "armaduras"
    return SECTION_TO_TAB.get(section, "equipamento")


def normalize_weapon_group(header: str) -> str:
    key = header.strip().lower()
    return WEAPON_GROUP_ALIASES.get(key, "outras")


def normalize_key(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^\w]", "", text)
    return text


def desc_keys_from_title(title: str) -> list[str]:
    keys: list[str] = []
    if ":" in title:
        for part in title.split(":"):
            keys.append(normalize_key(part))
    keys.append(normalize_key(title))
    keys.append(normalize_key(title.replace(" ", "")))
    seen: set[str] = set()
    unique: list[str] = []
    for key in keys:
        if key and key not in seen:
            seen.add(key)
            unique.append(key)
    return unique


def parse_descriptions(content: str) -> dict[str, str]:
    descriptions: dict[str, str] = {}
    mode: str | None = None
    lines = content.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip() == "## Descrições das Armas":
            mode = "armas"
            i += 1
            continue
        if line.strip() == "## Descrições dos Itens":
            mode = "itens"
            i += 1
            continue
        if mode and line.startswith("## ") and "descrições" not in line.lower():
            break
        if mode and line.startswith("### "):
            title = line[4:].strip()
            i += 1
            body_parts: list[str] = []
            while i < len(lines):
                next_line = lines[i]
                if next_line.startswith("### "):
                    break
                if next_line.startswith("## ") and "descrições" not in next_line.lower():
                    break
                if next_line.strip() and not next_line.startswith("---"):
                    body_parts.append(next_line.strip())
                i += 1
            body = " ".join(body_parts).strip()
            if not body or len(body) < 20:
                continue
            for key in desc_keys_from_title(title):
                descriptions.setdefault(key, body)
            continue
        i += 1
    return descriptions


def item_name_keys(name: str) -> list[str]:
    keys: list[str] = []
    base = re.sub(r"\s*\(.*?\)\s*", "", name).strip()
    for candidate in (name, base):
        keys.append(normalize_key(candidate))
        if "—" in candidate:
            keys.append(normalize_key(candidate.split("—")[-1]))
        if " - " in candidate:
            keys.append(normalize_key(candidate.split(" - ")[-1]))
        tail = re.sub(r"^[^—]+—\s*", "", candidate)
        if tail != candidate:
            keys.append(normalize_key(tail))
    seen: set[str] = set()
    unique: list[str] = []
    for key in keys:
        if key and key not in seen:
            seen.add(key)
            unique.append(key)
    return unique


def find_description(name: str, descriptions: dict[str, str], item: dict) -> str | None:
    for key in item_name_keys(name):
        if key in NAME_TO_DESC_KEY:
            mapped = NAME_TO_DESC_KEY[key]
            if mapped in descriptions:
                return descriptions[mapped]
        if key in descriptions:
            return descriptions[key]

    weapon_group = item.get("weaponGroup")
    if weapon_group and weapon_group in WEAPON_GROUP_DESC_KEYS:
        group_key = WEAPON_GROUP_DESC_KEYS[weapon_group]
        if group_key in descriptions:
            return descriptions[group_key]

    norm_name = normalize_key(name)
    best_key: str | None = None
    best_len = 0
    for key, desc in descriptions.items():
        if len(key) < 4:
            continue
        if key in norm_name or norm_name in key:
            if len(key) > best_len:
                best_key = key
                best_len = len(key)
    if best_key:
        return descriptions[best_key]

    tab = item.get("tab", "")
    section = item.get("section", "")
    transport_names = {
        "caravela", "cargueiro", "costeiro", "currach", "drakkar", "dromond",
        "galeote", "galera", "galeao", "knarr",
    }
    for key in item_name_keys(name):
        for part in re.findall(r"\w+", key):
            if part in transport_names and part in descriptions:
                return descriptions[part]
        if tab == "transporte":
            for tk in descriptions:
                if tk in key or key in tk:
                    return descriptions[tk]

    equipment_hints = {
        "clepsidra": "clepsidra",
        "ampulheta": "clepsidra",
        "lanterna": "lanternas",
        "tocha": "lanternas",
        "vela": "lanternas",
        "oleo": "oleo",
        "cadeado": "cadeados",
        "lentedeaumento": "lentedeaumento",
        "telescopio": "pequenotelescopio",
        "telescópio": "pequenotelescopio",
    }
    for key in item_name_keys(name):
        for hint, desc_key in equipment_hints.items():
            if hint in key and desc_key in descriptions:
                return descriptions[desc_key]

    return None


def attach_descriptions(items: list[dict], descriptions: dict[str, str]) -> int:
    matched = 0
    for item in items:
        desc = find_description(item["name"], descriptions, item)
        if desc:
            item["description"] = desc
            matched += 1
    return matched


class _FontTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []
        self._depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        if tag == "font":
            self._depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag == "font" and self._depth:
            self._depth -= 1

    def handle_data(self, data: str) -> None:
        if self._depth:
            self._parts.append(data)

    def text(self) -> str:
        return re.sub(r"\s+", " ", "".join(self._parts)).strip()


def _extract_font_text(fragment: str) -> str:
    parser = _FontTextExtractor()
    parser.feed(fragment)
    return parser.text()


def _margin_cm(td_html: str) -> float:
    match = re.search(r"margin-left:\s*([\d.]+)cm", td_html)
    return float(match.group(1)) if match else 0.0


def _plain_text(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", " ", fragment)
    text = unicodedata.normalize("NFC", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def _detect_equipamento_section(before_html: str) -> str:
    plain = _plain_text(before_html)
    best_pos = -1
    best_tab = "equipamento"
    for keyword, tab in EQUIPAMENTO_SECTION_KEYWORDS:
        pos = plain.rfind(keyword)
        if pos > best_pos:
            best_pos = pos
            best_tab = tab
    return best_tab


def _combine_names(parent: str, child: str) -> str:
    child = child.strip()
    parent = parent.strip()
    if not parent:
        return child
    if child.lower().startswith("de "):
        return f"{parent} {child}"
    return f"{parent} — {child}"


def parse_equipamento_html(path: Path) -> list[dict]:
    """Extrai itens (exceto armas e armaduras de personagem) de data/equipamento.html."""
    content = path.read_text(encoding="utf-8")
    items: list[dict] = []
    seen_ids: set[str] = set()

    for table_match in re.finditer(r"<table[^>]*>(.*?)</table>", content, re.S):
        before = content[max(0, table_match.start() - 1200) : table_match.start()]
        tab = _detect_equipamento_section(before)
        section = tab
        parent_name = ""

        for row in re.finditer(r"<tr[^>]*>(.*?)</tr>", table_match.group(1), re.S):
            tds = re.findall(r"<td([^>]*)>(.*?)</td>", row.group(1), re.S)
            if not tds:
                continue

            parsed_cells: list[dict] = []
            for attrs, inner in tds:
                parsed_cells.append(
                    {
                        "text": _extract_font_text(inner),
                        "margin": _margin_cm(attrs + inner),
                    }
                )

            if not parsed_cells or not parsed_cells[0]["text"]:
                continue

            name_text = parsed_cells[0]["text"]
            margin = parsed_cells[0]["margin"]
            other_texts = [c["text"] for c in parsed_cells[1:] if c["text"]]

            price_raw = ""
            weight_raw = ""
            for text in reversed(other_texts):
                if not price_raw and parse_price_pc(text) is not None:
                    price_raw = text
                elif not weight_raw and (
                    "kg" in text.lower()
                    or text in {"*", "**"}
                    or re.fullmatch(r"[\d,.]+", text)
                ):
                    weight_raw = text

            if not price_raw and other_texts:
                price_raw = other_texts[-1]

            price_pc = parse_price_pc(price_raw)
            if price_pc is None:
                if price_raw.strip() in {"-", "—", ""} or not price_raw.strip():
                    if margin < 0.22:
                        parent_name = name_text
                    elif parent_name:
                        parent_name = _combine_names(parent_name, name_text)
                continue

            if margin >= 0.22 and parent_name:
                full_name = _combine_names(parent_name, name_text)
            else:
                full_name = name_text
                if margin < 0.22:
                    parent_name = ""

            weight = parse_weight_kg(weight_raw) if weight_raw else 0.0

            base_id = slugify(full_name)
            item_id = base_id
            n = 2
            while item_id in seen_ids:
                item_id = f"{base_id}-{n}"
                n += 1
            seen_ids.add(item_id)

            items.append(
                {
                    "id": item_id,
                    "name": full_name,
                    "category": "equipamento",
                    "tab": tab,
                    "pricePc": price_pc,
                    "weightKg": weight,
                    "section": section,
                }
            )

    return items


def parse_md_weapons(content: str) -> list[dict]:
    """Extrai apenas armas de data/dinheiro-equipamento.md."""
    items: list[dict] = []
    seen_ids: set[str] = set()
    section = ""
    in_weapons = False
    weapon_group = "outras"

    for line in content.splitlines():
        if line.startswith("## "):
            section = line[3:].strip().lower()
            in_weapons = "armas" in section
            continue
        if line.startswith("### "):
            section = line[4:].strip().lower()
            if section in SKIP_SECTIONS:
                continue
            in_weapons = section == "lista de armas"
            continue
        if not in_weapons:
            continue
        if not line.startswith("|") or line.startswith("| ---"):
            continue

        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 2:
            continue

        name = cells[0]
        if not name or name in {"Item", "Arma"}:
            continue
        if name.startswith("**") and name.endswith("**"):
            weapon_group = normalize_weapon_group(name.strip("* "))
            continue

        price_raw = cells[1] if len(cells) > 1 else ""
        weight_raw = cells[2] if len(cells) > 2 else ""
        price_pc = parse_price_pc(price_raw)
        if price_pc is None:
            continue

        weight = parse_weight_kg(weight_raw)
        base_id = slugify(name)
        item_id = base_id
        n = 2
        while item_id in seen_ids:
            item_id = f"{base_id}-{n}"
            n += 1
        seen_ids.add(item_id)

        entry: dict = {
            "id": item_id,
            "name": name,
            "category": "arma",
            "tab": "armas",
            "pricePc": price_pc,
            "weightKg": weight,
            "section": "lista de armas",
            "weaponGroup": weapon_group,
        }
        if len(cells) >= 8:
            entry["weaponStats"] = {
                "size": cells[3],
                "type": cells[4],
                "speed": cells[5],
                "damagePM": cells[6],
                "damageG": cells[7],
            }
        items.append(entry)

    return items


# Peso aproximado (kg) — AD&D 2.5
ARMOR_WEIGHTS_KG: dict[str, float] = {
    "Loriga Segmentada": 11.0,
    "Corselete de Couro": 2.0,
    "Brigandina": 25.0,
    "Corselete Acolchoado": 4.0,
    "Armadura de Bronze": 25.0,
    "Armadura Simples": 40.0,
    "Cota de Malha": 11.0,
    "Loriga": 12.0,
    "Armadura de Batalha": 25.0,
    "Brunea": 20.0,
    "Armadura Completa": 32.0,
    "Corselete de Couro Batido": 6.0,
    "Gibão de Peles": 8.0,
    "Cota de Talas": 17.0,
}

# Nomes exibidos (correções em relação ao HTML, se necessário)
ARMOR_NAME_OVERRIDES: dict[str, str] = {
    "Corselete Acolchoado": "Corselete de Couro Acolchoado",
}

SHIELD_ENTRIES = [
    ("broquel", "Broquel", 100, 1.0, "+1"),
    ("escudo-pequeno", "Escudo Pequeno", 300, 3.0, "+2"),
    ("escudo-medio", "Escudo Médio", 700, 5.0, "+3"),
    ("escudo-corporal", "Escudo Corporal", 1000, 10.0, "+3/+4"),
]


def parse_armaduras_html(path: Path) -> list[dict]:
    """Extrai armaduras de personagem de data/armaduras.html."""
    content = path.read_text(encoding="utf-8")
    items: list[dict] = []
    seen_names: set[str] = set()

    for row in re.findall(r"<tr valign=\"top\">(.*?)</tr>", content, re.S):
        if "Nome da Armadura" in row:
            continue
        cells = re.findall(r'<font face="Arial, sans-serif">([^<]*)</font>', row)
        if len(cells) < 6:
            continue
        pairs = ((cells[0], cells[1], cells[2]), (cells[3], cells[4], cells[5]))
        for raw_name, raw_price, raw_ca in pairs:
            name = raw_name.strip()
            if not name:
                continue
            name = ARMOR_NAME_OVERRIDES.get(name, name)
            price_match = re.search(r"(\d+)", raw_price.replace(".", ""))
            ca_match = re.search(r"(\d+)", raw_ca.strip())
            if not price_match or not ca_match:
                continue
            price_pc = int(price_match.group(1)) * 100
            armor_class = int(ca_match.group(1))
            if name in seen_names:
                continue
            seen_names.add(name)
            items.append(
                {
                    "id": slugify(name),
                    "name": name,
                    "category": "armadura",
                    "tab": "armaduras",
                    "pricePc": price_pc,
                    "weightKg": ARMOR_WEIGHTS_KG.get(name, 10.0),
                    "armorClass": armor_class,
                    "section": "armaduras",
                }
            )
    return items


def extra_shields() -> list[dict]:
    return [
        {
            "id": item_id,
            "name": name,
            "category": "armadura",
            "tab": "armaduras",
            "pricePc": price,
            "weightKg": weight,
            "armorClass": ca,
            "section": "armaduras",
        }
        for item_id, name, price, weight, ca in SHIELD_ENTRIES
    ]


def main() -> None:
    content = MD_PATH.read_text(encoding="utf-8")
    items = parse_md_weapons(content)

    if EQUIPAMENTO_HTML_PATH.exists():
        items.extend(parse_equipamento_html(EQUIPAMENTO_HTML_PATH))
    else:
        print(f"Aviso: {EQUIPAMENTO_HTML_PATH} não encontrado; equipamento omitido.")

    if ARMOR_HTML_PATH.exists():
        items.extend(parse_armaduras_html(ARMOR_HTML_PATH))
    else:
        print(f"Aviso: {ARMOR_HTML_PATH} não encontrado; armaduras omitidas.")
    items.extend(extra_shields())

    descriptions = parse_descriptions(content)
    matched = attach_descriptions(items, descriptions)

    items.sort(key=lambda i: (i["tab"], i.get("weaponGroup", ""), i["name"].lower()))

    OUT_PATH.write_text(
        "// Gerado por scripts/generate-equipment-catalog.py — não editar manualmente.\n\n"
        f"export const equipmentCatalog = {json.dumps(items, ensure_ascii=False, indent=2)} as const;\n",
        encoding="utf-8",
    )
    print(f"Gerado {len(items)} itens ({matched} com descrição) em {OUT_PATH}")


if __name__ == "__main__":
    main()
