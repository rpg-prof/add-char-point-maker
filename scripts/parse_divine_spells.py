#!/usr/bin/env python3
"""Parse divine spell markdown (magias-divinas-LDJ.md) and generate individual JSON files."""

import json
import os
import re
import unicodedata
from collections import OrderedDict

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "cleric-spells")
DADOS_DIR = os.path.join(BASE_DIR, "dados")


def slugify(name):
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_text = ''.join(c for c in nfkd if not unicodedata.combining(c))
    slug = re.sub(r'[^a-z0-9]+', '-', ascii_text.lower()).strip('-')
    return slug


def make_spell(name, level, school, sphere='', casting_time='', duration='',
               range_='', area='', description=''):
    spell = OrderedDict()
    spell['name'] = name.strip()
    spell['level'] = level
    spell['school'] = school.strip()
    spell['sphere'] = (sphere or '').strip()
    spell['castingTime'] = (casting_time or '').strip()
    spell['duration'] = (duration or '').strip()
    spell['range'] = (range_ or '').strip()
    spell['area'] = (area or '').strip()
    spell['description'] = clean_description(description or '')
    return spell


def clean_description(text):
    text = re.sub(r'\*\*\d+\*\*', '', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)
    text = re.sub(r'\|[^\n]*\|', '', text)
    text = re.sub(r'\n?---\n?', ' ', text)
    text = re.sub(r'^#+ .*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def split_value_and_description(field_key, text, spell_name=''):
    text = text.strip()
    if not text:
        return '', ''

    if field_key == 'resistance':
        resistance_vals = [
            'Nenhuma (veja abaixo)', 'Especial (veja abaixo)',
            'Nenhuma', 'nenhuma', 'Nenhum', 'nenhum',
            'Anula', 'Especial', 'especial', '½', '1/2',
            'Neg.', 'Negativo', 'Neg',
        ]
        for rv in resistance_vals:
            if text.startswith(rv):
                rest = text[len(rv):].strip()
                return rv, rest
        m = re.match(r'(\S+(?:\s+\S+){0,2})\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜ].*)', text, re.DOTALL)
        if m:
            return m.group(1), m.group(2)
        return text, ''

    desc_start = (
        r'(?:'
        r'Ess[ae] (?:magia|feitiço|efeito)|'
        r'Est[ae] (?:magia|feitiço|efeito)|'
        r'Ao (?:utilizar|completar|realizar|lançar|conjurar|controlar|tocar)|'
        r'Uma? vez |'
        r'Quando |'
        r'Com (?:ess[ae]|est[ae]|o |a |essa|esta)|'
        r'Por (?:meio|exemplo)|'
        r'Através d|'
        r'Se (?:o |a |um|uma|for|houver)|'
        r'Além d|'
        r'Qualquer |'
        r'Todos? (?:os|as|que)|'
        r'Cada |'
        r'Permitindo |'
        r'O [a-záàâãéèêíïóôõöúüç]{3,}[, ]|'
        r'A [a-záàâãéèêíïóôõöúüç]{3,}[, ]|'
        r'Os [a-záàâãéèêíïóôõöúüç]{3,}[, ]|'
        r'As [a-záàâãéèêíïóôõöúüç]{3,}[, ]|'
        r'Um [a-záàâãéèêíïóôõöúüç]{3,}[, ]|'
        r'Uma? [a-záàâãéèêíïóôõöúüç]{3,}[, ]|'
        r'Truques? são|'
        r'Detectar |'
        r'Nesse |Nesta |Depois |Antes |Durante |Enquanto |'
        r'Para (?:cada|o|a|usar|utilizar)|'
        r'Sobre |Sob |Contra |Entre |Dentro |Fora |'
        r'Nos? |Nas? |Em |Pela?o?s? |'
        r'Ao ser |'
        r'Após |'
        r'Usando |Lançando |Pelo |'
        r'[A-Z][a-záàâãéèêíïóôõöúüç]{3,} (?:permite|cria|faz|pode|deve|causa|transforma|habilita|revela|remove|não |funciona|altera|afeta|atinge|lança|utiliz|conjur|gera|produz|oferece|fornece|indica|confere)'
        r')'
    )

    candidates = []

    if spell_name and len(spell_name) > 2:
        idx = text.find(spell_name)
        if 0 < idx < 150:
            candidates.append((idx, text[:idx].strip(), text[idx:].strip()))

    m = re.match(r'^(.{1,120}?)\s+(' + desc_start + r'.*)', text, re.DOTALL)
    if m:
        val = m.group(1).strip()
        if not val.endswith(' de') and not val.endswith(' da') and not val.endswith(' do'):
            candidates.append((len(val), val, m.group(2).strip()))

    m = re.match(r'^(.{1,80}?)\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜ][a-záàâãéèêíïóôõöúüç]{3,}\s.*)', text, re.DOTALL)
    if m and len(m.group(2)) > 50:
        val = m.group(1).strip()
        if not val.endswith(' de') and not val.endswith(' da') and not val.endswith(' do'):
            candidates.append((len(val), val, m.group(2).strip()))

    if candidates:
        candidates.sort(key=lambda x: x[0])
        return candidates[0][1], candidates[0][2]

    return text, ''


def extract_inline_fields(text, spell_name=''):
    marker_patterns = [
        ('sphere', r'Esfera:\s*'),
        ('range', r'Alcance:\s*'),
        ('components_raw', r'Componentes?:\s*'),
        ('duration', r'Duração:\s*'),
        ('castingTime', r'Tempo de (?:Execução|Lançamento):\s*'),
        ('area', r'Área de [Ee]feito:\s*'),
        ('resistance', r'Resistência:\s*'),
    ]

    found = []
    for key, pattern in marker_patterns:
        m = re.search(pattern, text)
        if m:
            found.append((m.start(), m.end(), key))

    if not found:
        return {}, text

    found.sort(key=lambda x: x[0])

    filtered = [found[0]]
    for i in range(1, len(found)):
        prev_end = filtered[-1][1]
        curr_start = found[i][0]
        if curr_start - prev_end < 200:
            filtered.append(found[i])
    found = filtered

    fields = {}
    description = ''

    for i, (start, end, key) in enumerate(found):
        if i + 1 < len(found):
            value = text[end:found[i + 1][0]].strip()
        else:
            remaining = text[end:]
            value, description = split_value_and_description(key, remaining, spell_name)
        fields[key] = value.strip()

    return fields, description.strip()


def parse_comp_line(comp_text):
    result = {}
    ct_match = re.search(r'Tempo de (?:Execução|Lançamento):\s*(.+?)(?:\s+Resistência:|$)', comp_text)
    if ct_match:
        result['castingTime'] = ct_match.group(1).strip()
    res_match = re.search(r'Resistência:\s*(\S+(?:\s+\S+)?)', comp_text)
    if res_match:
        result['resistance'] = res_match.group(1).strip()
    comp_match = re.search(r'Componentes?:\s*(.+?)(?:\s+Tempo\s|$)', comp_text)
    if comp_match:
        result['components'] = comp_match.group(1).strip()
    return result


def parse_divine_ldj(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    spell_entries = []
    comp_entries = []
    current_level = 1

    for i, line in enumerate(lines):
        level_match = re.match(
            r'^##\s+Magias\s+Divinas\s+d[eo]\s+(\d+)[ºª°]?\s*[Cc]írculo',
            line, re.IGNORECASE
        )
        if level_match:
            current_level = int(level_match.group(1))
            continue

        spell_match = re.match(r'^###\s+(.+)$', line)
        if spell_match:
            name = spell_match.group(1).strip()
            if re.match(r'^\d+$', name):
                continue
            spell_entries.append({
                'line': i, 'name': name, 'level': current_level
            })
            continue

        if re.match(r'^\s*Componentes?:\s+', line) and 'Alcance:' not in line:
            stripped = line.strip()
            if re.search(r'Tempo de (?:Execução|Lançamento):', stripped):
                comp_entries.append({'line': i, 'text': stripped})

    events = []
    for s in spell_entries:
        events.append((s['line'], 'spell', s))
    for c in comp_entries:
        events.append((c['line'], 'comp', c))
    events.sort(key=lambda x: x[0])

    comp_mapping = {}
    pending = []
    for _, etype, data in events:
        if etype == 'spell':
            pending.append(data['name'])
        elif etype == 'comp':
            if pending:
                spell_name = pending.pop(0)
                comp_mapping[spell_name] = data['text']

    spells = []
    for idx, entry in enumerate(spell_entries):
        line_num = entry['line']
        name = entry['name']
        level = entry['level']

        if idx + 1 < len(spell_entries):
            next_line = spell_entries[idx + 1]['line']
        else:
            next_line = len(lines)

        block_lines = lines[line_num + 1:next_line]

        school = ''
        cleaned = []
        found_school = False
        for bl in block_lines:
            stripped = bl.strip()
            if not found_school:
                sm = re.match(r'^\(([^)]+)\)\s*(?:Reversível\s*)?$', stripped)
                if sm:
                    school = sm.group(1).strip()
                    found_school = True
                    continue
                sm2 = re.match(r'^\(([^)]+)\)\s*(?:Reversível\s+)?(Esfera:.+)', stripped)
                if sm2:
                    school = sm2.group(1).strip()
                    found_school = True
                    cleaned.append(sm2.group(2))
                    continue
                sm3 = re.match(r'^\(([^)]+)\)\s*(?:Reversível\s+)?(Alcance:.+)', stripped)
                if sm3:
                    school = sm3.group(1).strip()
                    found_school = True
                    cleaned.append(sm3.group(2))
                    continue

            if re.match(r'^\s*Componentes?:\s+', stripped) and 'Alcance:' not in stripped:
                if re.search(r'Tempo de (?:Execução|Lançamento):', stripped):
                    continue

            if re.match(r'^#\s+(Magias Divinas|Apêndice)', stripped):
                continue
            if re.match(r'^Reversível\s*$', stripped):
                continue
            if stripped == '---':
                continue
            if re.match(r'^\*\*\d+\*\*$', stripped):
                continue
            if re.match(r'^####\s+\d+', stripped):
                continue
            if re.match(r'^Sumário ', stripped):
                continue

            cleaned.append(bl)

        block_text = '\n'.join(cleaned)
        block_text = re.sub(r'\|[^\n]*\|', '', block_text)
        block_text = re.sub(r'\s+', ' ', block_text).strip()

        if not school and block_text:
            sm = re.match(r'^\(([^)]+)\)\s*(?:Reversível\s+)?', block_text)
            if sm:
                school = sm.group(1).strip()
                block_text = block_text[sm.end():].strip()

        fields, description = extract_inline_fields(block_text, spell_name=name)

        casting_time = fields.get('castingTime', '')
        if name in comp_mapping:
            comp_data = parse_comp_line(comp_mapping[name])
            if not casting_time and comp_data.get('castingTime'):
                casting_time = comp_data['castingTime']

        spell = make_spell(
            name=name,
            level=level,
            school=school,
            sphere=fields.get('sphere', ''),
            casting_time=casting_time,
            duration=fields.get('duration', ''),
            range_=fields.get('range', ''),
            area=fields.get('area', ''),
            description=description
        )
        spells.append(spell)

    return spells


def write_spell(spell, output_dir, existing_files):
    slug = slugify(spell['name'])
    filename = f'{slug}.json'

    if filename in existing_files:
        filename = f'{slug}-{spell["level"]}.json'

    filepath = os.path.join(output_dir, filename)
    existing_files.add(filename)

    description = spell.get('description', '') or ''
    meta = {k: v for k, v in spell.items() if k != 'description'}

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(meta, f, ensure_ascii=False, indent=4)

    if description.strip():
        md_path = filepath.replace('.json', '.md')
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(description.strip() + '\n')

    return filepath


def parse_opcoes_divinas(filepath):
    """Parse the well-structured magias-opcoes-divinas.md with bold markdown fields."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    FIELD_MAP = {
        'Círculo': 'level',
        'Esfera': 'sphere',
        'Alcance': 'range',
        'Duração': 'duration',
        'Tempo de Execução': 'castingTime',
        'Área de Efeito': 'area',
        'Resistência': 'resistance',
    }

    spells = []
    blocks = re.split(r'(?=^#{1,2}\s+(?!Magias|FIM|Parte))', content, flags=re.MULTILINE)

    for block in blocks:
        block = block.strip()
        if not block or not re.match(r'^#{1,2}\s+', block):
            continue
        if not re.search(r'\*\*Círculo:\*\*', block):
            continue

        name_m = re.match(r'^#{1,2}\s+(.+)', block)
        name = name_m.group(1).strip() if name_m else ''
        school_m = re.search(r'^\*\((.+?)\)\*', block, re.MULTILINE)
        school = school_m.group(1).strip() if school_m else ''

        fields = {}
        for fm in re.finditer(r'\*\*(.+?):\*\*\s*(.+?)(?:\s{2,}|$)', block, re.MULTILINE):
            key_raw = fm.group(1).strip()
            val = fm.group(2).strip()
            if key_raw in FIELD_MAP:
                fields[FIELD_MAP[key_raw]] = val

        level_str = fields.pop('level', '1')
        level = int(re.search(r'\d+', level_str).group()) if re.search(r'\d+', level_str) else 1
        sphere = fields.pop('sphere', '')

        last_field_m = None
        for m in re.finditer(r'\*\*(?:Resistência|Componentes?):\*\*\s*.+', block):
            last_field_m = m
        if last_field_m:
            desc_start = last_field_m.end()
        else:
            desc_start = 0

        description = block[desc_start:].strip()
        description = re.sub(r'^---\s*$', '', description, flags=re.MULTILINE)
        description = re.sub(r'^#{1,4}\s+.*$', '', description, flags=re.MULTILINE)
        description = re.sub(r'\*\*Componentes? materiais?:\*\*', 'Componente material:', description)
        description = re.sub(r'\*\*(.+?)\*\*', r'\1', description)
        description = re.sub(r'\*(.+?)\*', r'\1', description)

        spell = make_spell(
            name=name, level=level, school=school, sphere=sphere,
            casting_time=fields.get('castingTime', ''),
            duration=fields.get('duration', ''),
            range_=fields.get('range', ''),
            area=fields.get('area', ''),
            description=description
        )
        spells.append(spell)

    return spells


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    existing_files = set()

    ldj_path = os.path.join(DADOS_DIR, 'magias-divinas-LDJ.md')
    print(f"Parsing {os.path.basename(ldj_path)}...")
    spells = parse_divine_ldj(ldj_path)
    print(f"  {len(spells)} spells found")

    all_spells = OrderedDict()
    for spell in spells:
        key = (spell['name'], spell['level'])
        all_spells[key] = spell

    opcoes_path = os.path.join(DADOS_DIR, 'magias-opcoes-divinas.md')
    if os.path.exists(opcoes_path):
        print(f"Parsing {os.path.basename(opcoes_path)}...")
        opcoes_spells = parse_opcoes_divinas(opcoes_path)
        new_count = 0
        replaced = 0
        for spell in opcoes_spells:
            key = (spell['name'], spell['level'])
            if key in all_spells:
                replaced += 1
            else:
                new_count += 1
            all_spells[key] = spell
        print(f"  {len(opcoes_spells)} spells found ({new_count} new, {replaced} replaced)")

    print(f"\nWriting {len(all_spells)} spell files to {OUTPUT_DIR}...")
    written = 0
    for key, spell in sorted(all_spells.items(), key=lambda x: (x[0][1], x[0][0])):
        write_spell(spell, OUTPUT_DIR, existing_files)
        written += 1

    print(f"\nDone! {written} spell JSON files created.")

    empty_desc = [s['name'] for _, s in all_spells.items() if not s['description']]
    if empty_desc:
        print(f"\nWarning: {len(empty_desc)} spells with empty descriptions:")
        for name in empty_desc[:20]:
            print(f"  - {name}")
        if len(empty_desc) > 20:
            print(f"  ... and {len(empty_desc) - 20} more")

    empty_sphere = sum(1 for _, s in all_spells.items() if not s['sphere'])
    if empty_sphere:
        print(f"\nWarning: {empty_sphere} spells with empty sphere")

    levels = {}
    for _, s in all_spells.items():
        lvl = s['level']
        levels[lvl] = levels.get(lvl, 0) + 1
    print(f"\nBy level:")
    for lvl in sorted(levels):
        print(f"  {lvl}º: {levels[lvl]} spells")


if __name__ == '__main__':
    main()
