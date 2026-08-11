# -*- coding: utf-8 -*-
import pdfplumber
from collections import defaultdict

def dedupe_chars(chars, dx=12.9, dy=1.0, tol=2.5):
    """Remove doubled text layer: keep one copy of chars that appear twice
    at offset ~(dx, dy)."""
    bytext = defaultdict(list)
    for c in chars:
        if c['text'].strip():
            bytext[c['text']].append(c)
    for k in bytext:
        bytext[k].sort(key=lambda c: c['x0'])
    skip = set()
    for k, lst in bytext.items():
        used = [False] * len(lst)
        for i, c in enumerate(lst):
            if used[i]:
                continue
            for j in range(i + 1, len(lst)):
                if used[j]:
                    continue
                ddx = c['x0'] - lst[j]['x0']
                ddy = c['top'] - lst[j]['top']
                if abs(abs(ddx) - dx) < tol and abs(abs(ddy) - dy) < tol:
                    # keep the one with larger x0 (or smaller) - keep first
                    used[j] = True
                    break
        for i, u in enumerate(used):
            if u:
                skip.add(id(lst[i]))
    return [c for c in chars if c['text'].strip() == '' or id(c) not in skip]

def build_words(chars):
    """Rebuild words from deduped chars."""
    chars = sorted(chars, key=lambda c: (c['top'], c['x0']))
    lines = defaultdict(list)
    for c in chars:
        key = round(c['top'] / 2.0) * 2
        lines[key].append(c)
    words = []
    for key in sorted(lines):
        cs = sorted(lines[key], key=lambda c: c['x0'])
        cur = []
        prev_x1 = None
        for c in cs:
            if cur and c['x0'] - prev_x1 > 3:
                words.append(cur)
                cur = []
            cur.append(c)
            prev_x1 = c['x1']
        if cur:
            words.append(cur)
    result = []
    for w in words:
        text = ''.join(c['text'] for c in w)
        x0 = min(c['x0'] for c in w)
        x1 = max(c['x1'] for c in w)
        top = min(c['top'] for c in w)
        result.append({'text': text, 'x0': x0, 'x1': x1, 'top': top})
    return result

if __name__ == '__main__':
    p = pdfplumber.open('analysis/lectionary_rot90.pdf')
    page = p.pages[22]
    dedup = dedupe_chars(page.chars)
    print('chars:', len(page.chars), '->', len(dedup))
    words = build_words(dedup)
    print('words:', len(words))
    for w in words:
        print(round(w['x0'],1), round(w['x1'],1), round(w['top'],1), w['text'])
