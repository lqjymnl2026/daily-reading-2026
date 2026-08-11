# -*- coding: utf-8 -*-
"""Final lectionary reference parser (Python reference implementation, ported to JS)."""
import json, re

RB = json.load(open('site/data/refbooks.json', encoding='utf-8'))
SHORT = dict(RB['short'])
FULL = dict(RB['full'])
AMBIG = RB['ambig']
ZH = RB['zh_name']
ALIAS = {'約壹':'1jo', '約貳':'2jo', '約參':'3jo'}

def split_book(ref):
    for name in sorted(FULL, key=len, reverse=True):
        if ref.startswith(name):
            return name, FULL[name], ref[len(name):]
    for name in sorted(ALIAS, key=len, reverse=True):
        if ref.startswith(name):
            return name, ALIAS[name], ref[len(name):]
    for name in sorted(AMBIG, key=len, reverse=True):
        if ref.startswith(name):
            return name, AMBIG[name][0][0], ref[len(name):]
    for name in sorted(SHORT, key=len, reverse=True):
        if len(name) > 1 and ref.startswith(name):
            return name, SHORT[name], ref[len(name):]
    for name in sorted(SHORT, key=len, reverse=True):
        if len(name) == 1 and ref.startswith(name):
            return name, SHORT[name], ref[len(name):]
    return None, None, None

def resolve_ambig(book, abbr, chapter):
    if book in AMBIG:
        for cand, chapters in AMBIG[book]:
            if cand == abbr:
                continue
            if chapters is not None and chapter is not None and chapter > chapters:
                continue
            return cand
    return abbr

def parse_verse_group(g, chapter):
    g = g.strip()
    if not g:
        return None
    opt = False
    if g.startswith('[') and g.endswith(']'):
        opt = True
        g = g[1:-1]
    m = re.match(r'^（(\d+)）$', g)
    if m:
        v = int(m.group(1))
        return [{'chapter': v, 'start': 1, 'start_half': None, 'end': None, 'end_half': None,
                 'end_chapter': v, 'optional': True}]
    m = re.match(r'^(\d+)(上|下)?－(\d+)(上|下)?：(\d+)(上|下)?$', g)
    if m:
        return [{'chapter': chapter, 'start': int(m.group(1)), 'start_half': m.group(2),
                 'end': int(m.group(5)), 'end_half': m.group(6),
                 'end_chapter': int(m.group(3)), 'optional': opt}]
    m = re.match(r'^(\d+)(上|下)?－(\d+)(上|下)?：末$', g)
    if m:
        return [{'chapter': chapter, 'start': int(m.group(1)), 'start_half': m.group(2),
                 'end': None, 'end_half': None, 'end_chapter': int(m.group(3)), 'optional': opt}]
    m = re.match(r'^(\d+)(上|下)?－(\d+)(上|下)?$', g)
    if m:
        return [{'chapter': chapter, 'start': int(m.group(1)), 'start_half': m.group(2),
                 'end': int(m.group(3)), 'end_half': m.group(4),
                 'end_chapter': chapter, 'optional': opt}]
    m = re.match(r'^(\d+)(上|下)?－末$', g)
    if m:
        return [{'chapter': chapter, 'start': int(m.group(1)), 'start_half': m.group(2),
                 'end': None, 'end_half': None, 'end_chapter': chapter, 'optional': opt}]
    m = re.match(r'^(\d+)(上|下)?$', g)
    if m:
        v = int(m.group(1))
        return [{'chapter': chapter, 'start': v, 'start_half': m.group(2),
                 'end': v, 'end_half': m.group(2), 'end_chapter': chapter, 'optional': opt}]
    return None

def parse_verses(seg, chapter):
    tokens = re.split(r'(\[[^\]]+\])', seg)
    out = []
    for t in tokens:
        if not t:
            continue
        if t.startswith('['):
            inner = t[1:-1]
            # bracket group may itself carry chapter prefix: [21：1－7]
            if re.match(r'^\d+：', inner):
                m = re.match(r'^(\d+)：', inner)
                ch2 = int(m.group(1))
                sub = parse_verses(inner[m.end():], ch2)
                if sub is None:
                    return None
                for s in sub:
                    s['optional'] = True
                out.extend(sub)
            else:
                rng = parse_verse_group(t, chapter)
                if rng is None:
                    return None
                out.extend(rng)
        else:
            for g in re.split(r'[、，]', t):
                if not g.strip():
                    continue
                # strip a trailing incomplete dash (truncated by PDF wrapping)
                if g.endswith('－') or g.endswith('-'):
                    g = g[:-1]
                    if not g:
                        continue
                # group may carry its own chapter prefix e.g. 4：5－末
                if re.match(r'^\d+：', g):
                    m = re.match(r'^(\d+)：', g)
                    ch2 = int(m.group(1))
                    sub = parse_verses(g[m.end():], ch2)
                    if sub is None:
                        return None
                    out.extend(sub)
                    continue
                rng = parse_verse_group(g, chapter)
                if rng is None:
                    return None
                out.extend(rng)
    return out

def parse_chapter(book, abbr, rest):
    rest = rest.strip().replace('†', '').replace('‡', '')
    rest = rest.replace(':', '：').replace('.', '：')
    if rest.startswith('：'):
        rest = rest[1:]
    if rest == '':
        # whole book reference (e.g. 猶, 禱, 門) — treat as whole book (all chapters)
        abbr = resolve_ambig(book, abbr, None)
        return [{'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': 1, 'start': 1,
                 'end': None, 'end_chapter': None, 'start_half': None, 'end_half': None,
                 'optional': False, 'whole_book': True}]
    m = re.match(r'^(\d+)章$', rest)
    if m:
        ch = int(m.group(1))
        abbr = resolve_ambig(book, abbr, ch)
        return [{'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': ch, 'start': 1,
                 'end': None, 'end_chapter': ch, 'start_half': None, 'end_half': None, 'optional': False}]
    m = re.match(r'^(\d+)－(\d+)章$', rest)
    if m:
        c1, c2 = int(m.group(1)), int(m.group(2))
        abbr = resolve_ambig(book, abbr, c2)
        return [{'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': c1, 'start': 1,
                 'end': None, 'end_chapter': c2, 'start_half': None, 'end_half': None, 'optional': False}]
    # pure bracketed reference e.g. [143：1－11] or [28]
    m = re.match(r'^\[([^\]]+)\]$', rest)
    if m:
        inner = m.group(1)
        if re.match(r'^\d+：', inner):
            mch = re.match(r'^(\d+)：', inner)
            ch = int(mch.group(1))
            rngs = parse_verses(inner[mch.end():], ch)
            if rngs is None:
                return None
            return [{'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': r['chapter'],
                     'start': r['start'], 'end': r['end'], 'end_chapter': r['end_chapter'],
                     'start_half': r['start_half'], 'end_half': r['end_half'], 'optional': True} for r in rngs]
        if re.fullmatch(r'\d+', inner):
            v = int(inner)
            return [{'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': v, 'start': 1,
                     'end': None, 'end_chapter': v, 'start_half': None, 'end_half': None, 'optional': True}]
        if re.search(r'[、，；]', inner) and re.fullmatch(r'[\d、，；]+', inner):
            out = []
            for sub in re.split(r'[、，；]', inner):
                if not sub:
                    continue
                if not re.fullmatch(r'\d+', sub):
                    return None
                v = int(sub)
                out.append({'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': v, 'start': 1,
                            'end': None, 'end_chapter': v, 'start_half': None, 'end_half': None, 'optional': True})
            return out
        return None
    # whole psalm number or bracketed psalm number
    if re.match(r'^[\[\]（()\d、，；]+$', rest) or re.fullmatch(r'（\d+）', rest):
        out = []
        # tokenize: numbers and [bracketed numbers], preserving adjacency like 60[63]
        tokens = re.findall(r'\[[^\]]+\]|（\d+）|\d+', rest)
        for g in tokens:
            g = g.strip()
            if not g:
                continue
            opt = False
            if g.startswith('[') and g.endswith(']'):
                opt = True
                g = g[1:-1]
                if re.search(r'：', g):
                    m = re.match(r'^(\d+)：', g)
                    if not m:
                        return None
                    ch = int(m.group(1))
                    rngs = parse_verses(g[m.end():], ch)
                    if rngs is None:
                        return None
                    for r in rngs:
                        r['optional'] = True
                        out.append({'book': abbr, 'book_disp': ZH.get(abbr, book), **r})
                    continue
                for sub in re.split(r'[、，；]', g):
                    if not sub:
                        continue
                    m = re.match(r'^(\d+)$', sub)
                    if not m:
                        return None
                    v = int(m.group(1))
                    out.append({'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': v, 'start': 1,
                                'end': None, 'end_chapter': v, 'start_half': None, 'end_half': None, 'optional': True})
                continue
            if re.fullmatch(r'（\d+）', g):
                opt = True
                g = g[1:-1]
            m = re.match(r'^(\d+)$', g)
            if not m:
                return None
            v = int(m.group(1))
            out.append({'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': v, 'start': 1,
                        'end': None, 'end_chapter': v, 'start_half': None, 'end_half': None, 'optional': opt})
        return out
    # single-chapter books
    if re.match(r'^\d', rest) and abbr in ('2jo', '3jo', 'jd', 'phm', '3song', 'prma', 'sus', 'bel'):
        rngs = parse_verses(rest, 1)
        if rngs is None:
            return None
        return [{'book': abbr, 'book_disp': ZH.get(abbr, book), **r} for r in rngs]
    # psalm refs mixing whole psalms and chapter:verses, e.g. 詩113、147：12－末 or 詩142；[143：1－11]
    if abbr == 'ps' and re.search(r'[、，；]', rest) and not re.match(r'^[\[\]（()\d、，；]+$', rest) and not re.match(r'^\d+：', rest):
        out = []
        for g in re.split(r'[、，；]', rest):
            g = g.strip()
            if not g:
                continue
            opt = False
            if g.startswith('[') and g.endswith(']'):
                opt = True
                g = g[1:-1]
            if re.fullmatch(r'\d+', g):
                v = int(g)
                out.append({'book': abbr, 'book_disp': ZH.get(abbr, book), 'chapter': v, 'start': 1,
                            'end': None, 'end_chapter': v, 'start_half': None, 'end_half': None, 'optional': opt})
            else:
                m = re.match(r'^(\d+)：', g)
                if not m:
                    return None
                ch = int(m.group(1))
                rngs = parse_verses(g[m.end():], ch)
                if rngs is None:
                    return None
                for r in rngs:
                    r['optional'] = r['optional'] or opt
                    out.append({'book': abbr, 'book_disp': ZH.get(abbr, book), **r})
        return out
    m = re.match(r'^(\d+)：', rest)
    if not m:
        return None
    chapter = int(m.group(1))
    seg = rest[m.end():]
    abbr = resolve_ambig(book, abbr, chapter)
    rngs = parse_verses(seg, chapter)
    if rngs is None:
        return None
    return [{'book': abbr, 'book_disp': ZH.get(abbr, book), **r} for r in rngs]

def parse_segment(seg, prev):
    alts = []
    m = re.search(r'[（(]或[^）)]*[）)]$', seg)
    if m:
        main = seg[:m.start()].strip()
        alt = seg[m.start()+1:m.end()-1].strip()
        alts = re.split(r'或', main)
        alts.append(alt[1:].strip() if alt.startswith('或') else alt)
    else:
        alts = re.split(r'或', seg)
    results = []
    for a in alts:
        a = a.strip()
        if not a:
            continue
        book, abbr, rest = split_book(a)
        if book is None:
            if prev is not None:
                book, abbr = prev
                rest = a
            else:
                return None, prev
        else:
            prev = (book, abbr)
        rngs = parse_chapter(book, abbr, rest)
        if rngs is None:
            return None, prev
        results.append(rngs)
    if not results:
        return None, prev
    flat = []
    for i, rngs in enumerate(results):
        for r in rngs:
            r['alt'] = i > 0
            flat.append(r)
    return flat, prev

def split_semicolon(s):
    """Split on ； but not inside [ ] brackets."""
    out, cur, depth = [], '', 0
    for ch in s:
        if ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
        if ch == '；' and depth == 0:
            out.append(cur)
            cur = ''
        else:
            cur += ch
    if cur.strip():
        out.append(cur)
    return out

def parse_ref(ref):
    ref = ref.strip()
    if ref.startswith('或'):
        ref = ref[1:].strip()
    # whole-ref 雅 disambiguation by max chapter
    is_ya = ref.startswith('雅') and not ref.startswith(('雅歌', '雅各書'))
    chapters = [int(x) for x in re.findall(r'(\d+)', ref)]
    ya_resolve = 'so' if (is_ya and chapters and max(chapters) > 5) else None
    passages = []
    prev = None
    for u in split_semicolon(ref):
        u = u.strip()
        if not u:
            continue
        for p in u.split('及'):
            p = p.strip()
            if not p:
                continue
            rngs, prev = parse_segment(p, prev)
            if rngs is None:
                return None
            passages.extend(rngs)
    if ya_resolve and passages:
        for r in passages:
            if r['book'] in ('jm', 'so'):
                r['book'] = ya_resolve
                r['book_disp'] = ZH.get(ya_resolve)
    if not passages:
        return None
    return passages

def main():
    days = json.load(open('site/data/lectionary.json', encoding='utf-8'))
    all_refs = []
    for d in days:
        for opt in d['communion'].get('options', []):
            for k in ('ot', 'psalm', 'epistle', 'gospel'):
                v = opt.get(k)
                if v is None:
                    continue
                for r in (v if isinstance(v, list) else [v]):
                    all_refs.append((d['date'], '聖餐·' + k + '·' + opt.get('label', ''), r))
        for k in ('morning', 'evening'):
            for r in d[k]:
                all_refs.append((d['date'], '早晚禱', r))
    fail = []
    ok = 0
    uniq = {}
    for dt, k, r in all_refs:
        if not re.match(r'^[（(或]?[創出利民申書士得撒王代拉尼斯伯詩箴傳歌賽耶哀結但何珥摩俄拿彌鴻哈番該亞瑪太可路約徒羅林加弗腓西帖提多門來雅彼約猶啟便所禱童蘇]', r):
            continue
        parsed = parse_ref(r)
        if parsed is None:
            fail.append((dt, k, r))
            uniq.setdefault(r, 0)
            uniq[r] += 1
        else:
            ok += 1
    print('parsed ok:', ok, 'fail:', len(fail), 'unique fail:', len(uniq))
    for r, n in sorted(uniq.items(), key=lambda x: -x[1])[:60]:
        print(f'  {n:3d}  {r}')

if __name__ == '__main__':
    main()
