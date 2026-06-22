#!/usr/bin/env python3
"""Parse RPG arcane spell markdown files and generate individual JSON files."""

import json
import os
import re
import unicodedata
from collections import OrderedDict

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "mage-spells")
DADOS_DIR = os.path.join(BASE_DIR, "dados")


def slugify(name):
    nfkd = unicodedata.normalize('NFKD', name)
    ascii_text = ''.join(c for c in nfkd if not unicodedata.combining(c))
    slug = re.sub(r'[^a-z0-9]+', '-', ascii_text.lower()).strip('-')
    return slug


def make_spell(name, level, school, casting_time='', duration='', range_='', area='', description=''):
    spell = OrderedDict()
    spell['name'] = name.strip()
    spell['level'] = level
    spell['school'] = school.strip()
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
        r'Um (?:mago|personagem)|'
        r'Uma? [a-záàâãéèêíïóôõöúüç]{3,} |'
        r'Truques? são|'
        r'Detectar |'
        r'Nesse |Nesta |Depois |Antes |Durante |Enquanto |'
        r'Para (?:cada|o|a|usar|utilizar)|'
        r'Sobre |Sob |Contra |Entre |Dentro |Fora |'
        r'Nos? |Nas? |Em |Pela?o?s? |'
        r'Ao ser |'
        r'Após |'
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


def parse_ldj(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')

    spell_entries = []
    comp_entries = []
    current_level = 1

    for i, line in enumerate(lines):
        level_match = re.match(r'^##\s+Magias\s+Arcanas\s+d[eo]\s+(\d+)[ºª°]?\s*[Cc]írculo', line, re.IGNORECASE)
        if level_match:
            current_level = int(level_match.group(1))
            continue

        spell_match = re.match(r'^###\s+(.+)$', line)
        if spell_match:
            name = spell_match.group(1).strip()
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
                sm2 = re.match(r'^\(([^)]+)\)\s*(?:Reversível\s+)?(Alcance:.+)', stripped)
                if sm2:
                    school = sm2.group(1).strip()
                    found_school = True
                    cleaned.append(sm2.group(2))
                    continue

            if re.match(r'^\s*Componentes?:\s+', stripped) and 'Alcance:' not in stripped:
                if re.search(r'Tempo de (?:Execução|Lançamento):', stripped):
                    continue

            if re.match(r'^# Magias Arcanas\s*$', stripped):
                continue
            if re.match(r'^Reversível\s*$', stripped):
                continue
            if stripped == '---':
                continue
            if re.match(r'^\*\*\d+\*\*$', stripped):
                continue
            if re.match(r'^Sumário ', stripped):
                continue

            cleaned.append(bl)

        block_text = '\n'.join(cleaned)
        block_text = re.sub(r'\|[^\n]*\|', '', block_text)
        block_text = re.sub(r'\s+', ' ', block_text).strip()

        if not school and block_text:
            sm = re.match(r'^\(([^)]+)\)\s*', block_text)
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
            casting_time=casting_time,
            duration=fields.get('duration', ''),
            range_=fields.get('range', ''),
            area=fields.get('area', ''),
            description=description
        )
        spells.append(spell)

    return spells


def parse_manual_arcano(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        raw_lines = [l.rstrip() for l in f.readlines()]

    lines = []
    for line in raw_lines:
        s = line.strip()
        s = re.sub(r'^\d{2,3}(?=[A-Z])', '', s)
        # Fix OCR kerning artifacts: "T oque" → "Toque", "V erde" → "Verde"
        s = re.sub(r'\b([A-Z]) ([a-záàâãéèêíïóôõöúüç])', r'\1\2', s)
        lines.append(s)

    # Split lines where a spell name is glued to preceding text after "."
    expanded = []
    for s in lines:
        m = re.search(r'\.([A-Z][a-záàâãéèêíïóôõöúüç]+(?: (?:de |da |do |dos |das )?[A-Z]?[a-záàâãéèêíïóôõöúüç]+)*)\s{2,}\(', s)
        if m and m.start() > 5:
            expanded.append(s[:m.start() + 1])
            expanded.append(s[m.start() + 1:])
        else:
            expanded.append(s)
    lines = expanded

    FIELD_MARKERS = [
        ('range',       'Alcance:'),
        ('duration',    'Duração:'),
        ('castingTime', 'Tempo de Execução:'),
        ('castingTime', 'Tempo de Lançamento:'),
        ('area',        'Área de Efeito:'),
        ('area',        'Área de efeito:'),
        ('resistance',  'Resistência:'),
    ]
    SKIP_MARKERS = ['Componentes:', 'Componente:']

    def is_noise(s):
        return s in ('Novas Magias', '') or re.match(r'^Tabela \d+', s)

    # --- Pass 1: assign level to each line ---
    level_map = {}
    cur_level = 1
    for i, s in enumerate(lines):
        lm = re.match(r'^#\s+Magias\s+d[eo]\s+(\d+)[ºª°]?\s*[Cc]írculo', s)
        if lm:
            cur_level = int(lm.group(1))
        level_map[i] = cur_level

    # --- Pass 2: find each Alcance: line, look backward for spell name ---
    spell_blocks = []
    for i, s in enumerate(lines):
        if not s.startswith('Alcance:'):
            continue

        name = ''
        school = ''
        name_line = -1

        for back in range(1, 5):
            j = i - back
            if j < 0:
                break
            cand = lines[j]
            if not cand or is_noise(cand) or cand.startswith('**Escola:'):
                continue

            clean = re.sub(r'^#{1,3}\s*', '', cand).strip()
            if not clean:
                continue

            # Check if this is a `## SpellName` with `**Escola:**` below
            escola_match = None
            for ej in range(j + 1, min(j + 3, i)):
                em = re.match(r'\*\*Escola:\*\*\s*(.+)', lines[ej])
                if em:
                    escola_match = em
                    break
            if escola_match:
                name = clean
                school = escola_match.group(1).strip()
                name_line = j
                break

            # Inline: "SpellName  (School)"
            sm = re.match(r'^(.+?)\s{2,}\(([^)]+)\)\s*$', clean)
            if sm:
                name = sm.group(1).strip()
                school = sm.group(2).strip()
                name_line = j
                break

            # Standalone "(School)" on next line
            nxt = lines[j + 1] if j + 1 < i else ''
            sm_standalone = re.match(r'^\(([^)]+)\)\s*$', nxt)
            if sm_standalone:
                name = clean
                school = sm_standalone.group(1).strip()
                name_line = j
                break

            # Inline across two lines: "SpellName  (Part1/" + "Part2)"
            combined = clean + ' ' + nxt
            sm2 = re.match(r'^(.+?)\s{2,}\(([^)]+)\)\s*$', combined)
            if sm2:
                name = sm2.group(1).strip()
                school = sm2.group(2).strip()
                name_line = j
                break

            # ##SpellName  (School) without space after ##
            sm3 = re.match(r'^(.+?)\s+\(([^)]+)\)\s*$', clean)
            if sm3 and cand.startswith('#'):
                name = sm3.group(1).strip()
                school = sm3.group(2).strip()
                name_line = j
                break

        if not name or name_line < 0:
            continue

        name = name.rstrip('*').strip()
        if len(name) < 3 or len(name) > 80:
            continue

        # Multi-line name: if name has no spaces, check if prior line is the
        # beginning of the name (e.g., "Santuário Particular de\nMordenkainen")
        if ' ' not in name and name_line > 0:
            prev = lines[name_line - 1].strip()
            prev = re.sub(r'^#{1,3}\s*', '', prev).strip()
            if prev and prev[0].isupper() and prev.endswith((' de', ' da', ' do')):
                name = prev + ' ' + name
                name_line -= 1

        spell_blocks.append({
            'name_line': name_line,
            'alcance_line': i,
            'name': name,
            'school': school,
            'level': level_map[name_line],
        })

    # --- Pass 3: for each spell, extract fields + description ---
    spells = []
    for si, sb in enumerate(spell_blocks):
        end_line = spell_blocks[si + 1]['name_line'] if si + 1 < len(spell_blocks) else len(lines)

        fi = sb['alcance_line']
        fields = {}
        last_field_line = fi
        while fi < end_line:
            s = lines[fi]
            if is_noise(s):
                fi += 1
                continue
            matched = False
            for key, marker in FIELD_MARKERS:
                if s.startswith(marker):
                    val = s[len(marker):].strip()
                    if fi + 1 < end_line and not any(
                        lines[fi + 1].startswith(m) for _, m in FIELD_MARKERS
                    ) and not any(lines[fi + 1].startswith(m) for m in SKIP_MARKERS):
                        nxt = lines[fi + 1]
                        if nxt and not is_noise(nxt) and not nxt[0].isupper():
                            val += ' ' + nxt
                            fi += 1
                    fields[key] = val
                    last_field_line = fi
                    matched = True
                    break
            if not matched:
                for marker in SKIP_MARKERS:
                    if s.startswith(marker):
                        last_field_line = fi
                        matched = True
                        break
            if not matched and fields:
                break
            fi += 1

        desc_start = last_field_line + 1
        desc_parts = []
        for k in range(desc_start, end_line):
            s = lines[k]
            if is_noise(s) or s.startswith('# Magias'):
                continue
            if s:
                if desc_parts and desc_parts[-1].endswith('-'):
                    desc_parts[-1] = desc_parts[-1][:-1] + s
                else:
                    desc_parts.append(s)

        description = ' '.join(desc_parts)

        spell = make_spell(
            name=sb['name'], level=sb['level'], school=sb['school'],
            casting_time=fields.get('castingTime', ''),
            duration=fields.get('duration', ''),
            range_=fields.get('range', ''),
            area=fields.get('area', ''),
            description=description
        )
        spells.append(spell)

    return spells


def parse_tome(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = [l.rstrip() for l in f.readlines()]

    current_level = 1
    spell_starts = []

    level_re = re.compile(
        r'M[aá]gicas?\s+d[eo]\s+(\d+)[ºª°]?\s*[Cc]írculo', re.IGNORECASE
    )

    field_markers = [
        ('range',          'Alcance:'),
        ('components_raw', 'Componentes:'),
        ('components_raw', 'Componente:'),
        ('duration',       'Duração:'),
        ('castingTime',    'Tempo de Execução:'),
        ('castingTime',    'Tempo de Lançamento:'),
        ('area',           'Área de Efeito:'),
        ('area',           'Área de efeito:'),
        ('resistance',     'Resistência:'),
    ]

    def is_field_line(s):
        return any(s.startswith(mk) for _, mk in field_markers)

    for i, line in enumerate(lines):
        stripped = line.strip()

        lm = level_re.match(stripped)
        if lm:
            current_level = int(lm.group(1))
            continue

        if not stripped or is_field_line(stripped):
            continue

        alcance_nearby = False
        for j in range(i + 1, min(i + 4, len(lines))):
            if lines[j].strip().startswith('Alcance:'):
                alcance_nearby = True
                break
        if not alcance_nearby:
            continue

        name = ''
        school = ''

        sm = re.match(r'^(.+?)\*?\s*\(([^)]+)\)\s*$', stripped)
        if sm:
            name = sm.group(1).strip().rstrip('*').strip()
            school = sm.group(2).strip()
        else:
            nxt = lines[i + 1].strip() if i + 1 < len(lines) else ''
            sm2 = re.match(r'^\(([^)]+)\)\s*$', nxt)
            if sm2:
                name = stripped.rstrip('*').strip()
                school = sm2.group(1).strip()
            else:
                name = stripped.rstrip('*').strip()

        if not name or len(name) < 3 or len(name) > 80:
            continue
        if re.match(r'^\d+', name):
            continue
        if not re.match(r'^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÜ]', name):
            continue
        if re.search(r'[.!?;]', name):
            continue
        skip_words = ['mágicas', 'círculo', 'lista', 'tabela', 'resultado',
                      'tome of', 'magias arcanas', 'componente']
        if any(x in name.lower() for x in skip_words):
            continue
        low = name.lower().split()
        filler = {'de', 'do', 'da', 'dos', 'das', 'e', 'a', 'o', 'as', 'os',
                  'em', 'no', 'na', 'nos', 'nas', 'um', 'uma', 'que', 'se',
                  'por', 'para', 'com', 'não', 'ou', 'ao', 'pela', 'pelo'}
        capitalized = sum(1 for w in name.split() if w[0].isupper() and w.lower() not in filler)
        if capitalized == 0:
            continue

        spell_starts.append((i, name, school, current_level))

    spells = []
    for si, (start_line, name, school, level) in enumerate(spell_starts):
        end_line = spell_starts[si + 1][0] if si + 1 < len(spell_starts) else len(lines)

        fi = start_line + 1
        if fi < end_line and re.match(r'^\([^)]+\)\s*$', lines[fi].strip()):
            fi += 1

        fields = {}
        desc_start = fi
        while fi < end_line:
            s = lines[fi].strip()
            if not s:
                if fields:
                    desc_start = fi + 1
                    break
                fi += 1
                continue
            matched = False
            for key, marker in field_markers:
                if s.startswith(marker):
                    fields[key] = s[len(marker):].strip()
                    desc_start = fi + 1
                    matched = True
                    break
            if not matched and fields:
                desc_start = fi
                break
            fi += 1

        desc_parts = [lines[k].strip() for k in range(desc_start, end_line)
                      if lines[k].strip()]
        description = ' '.join(desc_parts)

        spell = make_spell(
            name=name, level=level, school=school,
            casting_time=fields.get('castingTime', ''),
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


def parse_opcoes_arcanas(filepath):
    """Parse the well-structured magias-opcoes-arcanas.md with bold markdown fields."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    FIELD_MAP = {
        'Círculo': 'level',
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
            elif key_raw == 'Componentes' or key_raw == 'Componente':
                pass

        level_str = fields.pop('level', '1')
        level = int(re.search(r'\d+', level_str).group()) if re.search(r'\d+', level_str) else 1

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
            name=name, level=level, school=school,
            casting_time=fields.get('castingTime', ''),
            duration=fields.get('duration', ''),
            range_=fields.get('range', ''),
            area=fields.get('area', ''),
            description=description
        )
        spells.append(spell)

    return spells


def main():
    if os.path.isdir(OUTPUT_DIR):
        for f in os.listdir(OUTPUT_DIR):
            if f.endswith('.json'):
                os.remove(os.path.join(OUTPUT_DIR, f))
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    all_spells = OrderedDict()
    existing_files = set()

    ldj_path = os.path.join(DADOS_DIR, 'magias-arcanas-LDJ.md')
    print(f"Parsing {os.path.basename(ldj_path)}...")
    ldj_spells = parse_ldj(ldj_path)
    for spell in ldj_spells:
        key = (spell['name'], spell['level'])
        all_spells[key] = spell
    print(f"  {len(ldj_spells)} spells found")

    manual_path = os.path.join(DADOS_DIR, 'magias-manual-arcano.md')
    print(f"Parsing {os.path.basename(manual_path)}...")
    manual_spells = parse_manual_arcano(manual_path)
    new_count = 0
    for spell in manual_spells:
        key = (spell['name'], spell['level'])
        if key not in all_spells:
            all_spells[key] = spell
            new_count += 1
    print(f"  {len(manual_spells)} spells found ({new_count} new)")

    tome_path = os.path.join(DADOS_DIR, 'magias-tome.md')
    print(f"Parsing {os.path.basename(tome_path)}...")
    tome_spells = parse_tome(tome_path)
    new_count = 0
    replaced = 0
    for spell in tome_spells:
        key = (spell['name'], spell['level'])
        if key in all_spells:
            replaced += 1
        else:
            new_count += 1
        all_spells[key] = spell
    print(f"  {len(tome_spells)} spells found ({new_count} new, {replaced} replaced)")

    opcoes_path = os.path.join(DADOS_DIR, 'magias-opcoes-arcanas.md')
    if os.path.exists(opcoes_path):
        print(f"Parsing {os.path.basename(opcoes_path)}...")
        opcoes_spells = parse_opcoes_arcanas(opcoes_path)
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
        filepath = write_spell(spell, OUTPUT_DIR, existing_files)
        written += 1

    print(f"\nDone! {written} spell JSON files created.")

    empty_desc = [s['name'] for _, s in all_spells.items() if not s['description']]
    if empty_desc:
        print(f"\nWarning: {len(empty_desc)} spells with empty descriptions:")
        for name in empty_desc[:20]:
            print(f"  - {name}")
        if len(empty_desc) > 20:
            print(f"  ... and {len(empty_desc) - 20} more")


if __name__ == '__main__':
    main()
