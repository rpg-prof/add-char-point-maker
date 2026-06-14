#!/usr/bin/env python3
"""Lê todos os JSON em cleric-spells/ e gera cleric-spells.json."""

import json
import re
from collections import defaultdict
from pathlib import Path

CANONICAL_SPHERES = [
    "Adivinhação",
    "Animal",
    "Astral",
    "Clima",
    "Combate",
    "Convocação",
    "Criação",
    "Cura",
    "Elemental",
    "Feitiço",
    "Guarda",
    "Necromântica",
    "Proteção",
    "Solar",
    "Todas",
    "Vegetal",
]

_SPHERE_ALIAS = {
    "adivinhação": "Adivinhação",
    "animal": "Animal",
    "astral": "Astral",
    "clima": "Clima",
    "combate": "Combate",
    "convocação": "Convocação",
    "criação": "Criação",
    "cura": "Cura",
    "elemental": "Elemental",
    "elementar": "Elemental",
    "feitiço": "Feitiço",
    "feitiços": "Feitiço",
    "guarda": "Guarda",
    "necromântica": "Necromântica",
    "necromancia": "Necromântica",
    "proteção": "Proteção",
    "solar": "Solar",
    "todas": "Todas",
    "vegetal": "Vegetal",
}


def normalize_spheres(raw: str) -> list[str]:
    """Extrai lista de esferas canônicas a partir do campo 'sphere' bruto."""
    cleaned = re.sub(r"\*+", "", raw)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if not cleaned:
        return []

    # "Elemental (Fogo)", "Elemental (Terra, Água)" → "Elemental"
    cleaned = re.sub(r"[Ee]lemental(?:ar)?\s*\([^)]*\)", "Elemental", cleaned)

    # "Adivinhação (Animal, Vegetal)" → "Adivinhação, Animal, Vegetal"
    m = re.match(r"^(\w[\wâãéèêíïóôõöúüç]*)\s*\(([^)]+)\)$", cleaned)
    if m:
        first = m.group(1)
        inside = m.group(2)
        cleaned = f"{first}, {inside}"

    # Separar por , ; .
    fragments = re.split(r"[;,.]", cleaned)
    result: set[str] = set()

    for frag in fragments:
        frag = frag.strip()
        if not frag:
            continue
        key = frag.lower()

        if key in _SPHERE_ALIAS:
            result.add(_SPHERE_ALIAS[key])
            continue

        # OCR noise: tentar extrair o início que bate com uma esfera
        for alias, canonical in sorted(_SPHERE_ALIAS.items(), key=lambda x: -len(x[0])):
            if key.startswith(alias):
                result.add(canonical)
                break

    return sorted(result)


def entry_from_spell(data: dict, rel_file: str) -> dict:
    entry = {
        "name": data["name"],
        "file": rel_file,
        "level": data["level"],
        "school": data["school"],
        "sphere": data["sphere"],
    }
    if data.get("source"):
        entry["source"] = data["source"]
    return entry


def spell_data_root() -> Path:
    return Path(__file__).resolve().parent.parent / "src" / "data" / "spell"


def main() -> None:
    root = spell_data_root()
    spells_dir = root / "cleric-spells"
    out_path = root / "cleric-spells.json"

    if not spells_dir.is_dir():
        raise SystemExit(f"Diretório não encontrado: {spells_dir}")

    entries = []
    for path in sorted(spells_dir.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        rel = f"cleric-spells/{path.name}"
        entries.append(entry_from_spell(data, rel))

    sort_key = lambda e: (e["name"].casefold(), e["file"])

    by_level: dict[str, list] = defaultdict(list)
    by_sphere: dict[str, list] = defaultdict(list)
    by_source: dict[str, list] = defaultdict(list)
    unrecognized: dict[str, list[str]] = defaultdict(list)

    for e in entries:
        by_level[str(e["level"])].append(e)
        spheres = normalize_spheres(e["sphere"])
        for s in spheres:
            by_sphere[s].append(e)
            if s not in CANONICAL_SPHERES:
                unrecognized[s].append(e["name"])
        source = e.get("source") or "Desconhecida"
        by_source[source].append(e)

    for lst in by_level.values():
        lst.sort(key=sort_key)
    for lst in by_sphere.values():
        lst.sort(key=sort_key)
    for lst in by_source.values():
        lst.sort(key=sort_key)

    level_keys = sorted(by_level.keys(), key=int)
    sphere_keys = sorted(by_sphere.keys(), key=str.casefold)
    source_keys = sorted(by_source.keys(), key=str.casefold)

    index = {
        "by-level": {k: by_level[k] for k in level_keys},
        "by-sphere": {k: by_sphere[k] for k in sphere_keys},
        "by-source": {k: by_source[k] for k in source_keys},
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=4)
        f.write("\n")

    print(f"Índice escrito: {out_path}")
    print(f"  Magias: {len(entries)}")
    print(f"  Níveis: {len(level_keys)} ({', '.join(level_keys)})")
    print(f"  Esferas no índice: {len(sphere_keys)}")
    for s in sphere_keys:
        tag = "  ✓" if s in CANONICAL_SPHERES else "  ?"
        print(f"    {tag} {s}: {len(by_sphere[s])} magias")

    print(f"  Fontes no índice: {len(source_keys)}")
    for s in source_keys:
        print(f"      {s}: {len(by_source[s])} magias")

    if unrecognized:
        print(f"\n  ⚠ Esferas NÃO canônicas ({len(unrecognized)}):")
        for s in sorted(unrecognized):
            names = ", ".join(unrecognized[s][:5])
            more = f" (+{len(unrecognized[s]) - 5})" if len(unrecognized[s]) > 5 else ""
            print(f"      '{s}': {names}{more}")


if __name__ == "__main__":
    main()
