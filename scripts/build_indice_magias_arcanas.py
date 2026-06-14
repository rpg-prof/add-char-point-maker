#!/usr/bin/env python3
"""Lê todos os JSON em mage-spells/ e gera mage-spells.json."""

import json
import re
from collections import defaultdict
from pathlib import Path

CANONICAL_SCHOOLS = [
    "Abjuração",
    "Alteração",
    "Augúrio",
    "Conjuração/Convocação",
    "Encantamento/Feitiço",
    "Ilusão",
    "Invocação/Evocação",
    "Necromancia",
    "Profecia",
]

# Nomes compostos com "/" que representam UMA ÚNICA escola canônica
_COMPOUND = {
    "conjuração/convocação": "Conjuração/Convocação",
    "convocação/conjuração": "Conjuração/Convocação",
    "encantamento/feitiço": "Encantamento/Feitiço",
    "invocação/evocação": "Invocação/Evocação",
    "ilusão/visão": "Ilusão",
    "encantamento/charme": "Encantamento/Feitiço",
    "encanto/charme": "Encantamento/Feitiço",
}

# Fragmentos individuais → escola canônica
_ALIAS = {
    "abjuração": "Abjuração",
    "alteração": "Alteração",
    "augúrio": "Augúrio",
    "conjuração": "Conjuração/Convocação",
    "convocação": "Conjuração/Convocação",
    "encantamento": "Encantamento/Feitiço",
    "encanto": "Encantamento/Feitiço",
    "feitiço": "Encantamento/Feitiço",
    "charme": "Encantamento/Feitiço",
    "ilusão": "Ilusão",
    "visão": "Ilusão",
    "invocação": "Invocação/Evocação",
    "evocação": "Invocação/Evocação",
    "necromancia": "Necromancia",
    "profecia": "Profecia",
    "adivinhação": "Profecia",
}


def normalize_schools(raw: str) -> list[str]:
    """Extrai lista de escolas canônicas a partir do campo 'school' bruto."""
    cleaned = re.sub(r"\*+", "", raw)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return []
    if cleaned.lower() == "todas as escolas":
        return list(CANONICAL_SCHOOLS)

    fragments = re.split(r"[;,]", cleaned)
    result: set[str] = set()

    for frag in fragments:
        frag = frag.strip()
        if not frag:
            continue
        key = re.sub(r"\s*/\s*", "/", frag.lower())

        if key in _COMPOUND:
            result.add(_COMPOUND[key])
            continue
        if key in _ALIAS:
            result.add(_ALIAS[key])
            continue

        if "/" in key:
            parts = [p.strip() for p in key.split("/") if p.strip()]
            resolved = [_ALIAS[p] for p in parts if p in _ALIAS]
            if resolved:
                result.update(resolved)
                continue

        result.add(frag)

    return sorted(result)


def entry_from_spell(data: dict, rel_file: str) -> dict:
    entry = {
        "name": data["name"],
        "file": rel_file,
        "level": data["level"],
        "school": data["school"],
    }
    if data.get("source"):
        entry["source"] = data["source"]
    return entry


def spell_data_root() -> Path:
    return Path(__file__).resolve().parent.parent / "src" / "data" / "spell"


def main() -> None:
    root = spell_data_root()
    spells_dir = root / "mage-spells"
    out_path = root / "mage-spells.json"

    if not spells_dir.is_dir():
        raise SystemExit(f"Diretório não encontrado: {spells_dir}")

    entries = []
    for path in sorted(spells_dir.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        rel = f"mage-spells/{path.name}"
        entries.append(entry_from_spell(data, rel))

    sort_key = lambda e: (e["name"].casefold(), e["file"])

    by_level: dict[str, list] = defaultdict(list)
    by_school: dict[str, list] = defaultdict(list)
    by_source: dict[str, list] = defaultdict(list)
    unrecognized: dict[str, list[str]] = defaultdict(list)

    for e in entries:
        by_level[str(e["level"])].append(e)
        schools = normalize_schools(e["school"])
        for s in schools:
            by_school[s].append(e)
            if s not in CANONICAL_SCHOOLS:
                unrecognized[s].append(e["name"])
        source = e.get("source") or "Desconhecida"
        by_source[source].append(e)

    for lst in by_level.values():
        lst.sort(key=sort_key)
    for lst in by_school.values():
        lst.sort(key=sort_key)
    for lst in by_source.values():
        lst.sort(key=sort_key)

    level_keys = sorted(by_level.keys(), key=int)
    school_keys = sorted(by_school.keys(), key=str.casefold)
    source_keys = sorted(by_source.keys(), key=str.casefold)

    index = {
        "by-level": {k: by_level[k] for k in level_keys},
        "by-school": {k: by_school[k] for k in school_keys},
        "by-source": {k: by_source[k] for k in source_keys},
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=4)
        f.write("\n")

    print(f"Índice escrito: {out_path}")
    print(f"  Magias: {len(entries)}")
    print(f"  Níveis: {len(level_keys)} ({', '.join(level_keys)})")
    print(f"  Escolas no índice: {len(school_keys)}")
    for s in school_keys:
        tag = "  ✓" if s in CANONICAL_SCHOOLS else "  ?"
        print(f"    {tag} {s}: {len(by_school[s])} magias")

    print(f"  Fontes no índice: {len(source_keys)}")
    for s in source_keys:
        print(f"      {s}: {len(by_source[s])} magias")

    if unrecognized:
        print(f"\n  ⚠ Escolas NÃO canônicas ({len(unrecognized)}):")
        for s in sorted(unrecognized):
            names = ", ".join(unrecognized[s][:5])
            more = f" (+{len(unrecognized[s]) - 5})" if len(unrecognized[s]) > 5 else ""
            print(f"      '{s}': {names}{more}")


if __name__ == "__main__":
    main()
