#!/usr/bin/env python3
"""Convert tools/foods.txt to data/foods.json and sanity-check the numbers (Atwater: 4/4/9 kcal per g)."""
import json, re, sys, os
here = os.path.dirname(os.path.abspath(__file__))
out, warn = [], []
for ln, raw in enumerate(open(os.path.join(here, 'foods.txt'), encoding='utf-8'), 1):
    raw = raw.strip()
    if not raw or raw.startswith('#'):
        continue
    parts = [x.strip() for x in raw.split('|')]
    if len(parts) != 6:
        sys.exit(f'line {ln}: expected 6 fields, got {len(parts)}: {raw}')
    name, k, p, c, f, sv = parts
    alias = ''
    if '~' in name:
        name, alias = [x.strip() for x in name.split('~', 1)]
    k, p, c, f = map(float, (k, p, c, f))
    est = 4 * p + 4 * c + 9 * f
    if k > 20 and abs(est - k) / k > 0.2:
        warn.append(f'{name}: kcal {k:g} vs macros {est:.0f}')
    servings = []
    for s in sv.split(';'):
        label, g = s.rsplit('=', 1)
        servings.append({'n': label.strip(), 'g': float(g)})
    item = {'name': name, 'k': k, 'p': p, 'c': c, 'f': f, 'sv': servings}
    if alias:
        item['al'] = alias
    out.append(item)
json.dump(out, open(os.path.join(here, '..', 'data', 'foods.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(out), 'foods written')
for w in warn:
    print('CHECK', w)
