# -*- coding: utf-8 -*-
"""Parse the HK Anglican 2026 lectionary PDF (rotated version) into structured JSON."""
import pdfplumber
import json
import re
from collections import defaultdict

PDF = 'analysis/lectionary_rot90.pdf'
OUT = 'analysis/lectionary.json'

def col_of(cx):
    if cx < 200:
        return 'meta'
    if cx < 320:
        return 'communion'
    if cx < 430:
        return 'morning'
    return 'evening'

DATE_RE = re.compile(r'^(\d{1,2})（(主日|[日一二三四五六])）')
MONTH_RE = re.compile(r'^(\d{4})年(\d{1,2})月$')
COLOR_LEAD = re.compile(r'^(紫|紅|白|綠|金|黑|灰)(?:（[^）]+）)?(?:/[紫紅白綠金黑灰])?')
LUNAR_RE = re.compile(r'^[一二三四五六七八九十廿卅閏初正]+月[一二三四五六七八九十廿卅初日]*[‧·][^ ]*$|^[一二三四五六七八九十廿卅閏初正]+月[一二三四五六七八九十廿卅初日]+$')
CANTICLE_RE = re.compile(r'聖餐唸|早禱唸|唸|頌')

BOOK_SHORT = '創出利民申書士得撒王代拉尼斯伯詩箴傳歌賽耶哀結但何珥摩俄拿彌鴻哈番該亞瑪太可路約徒羅林加弗腓西帖提多門來雅彼約猶啟便所禱童蘇'
BOOK_FULL = '創世記|出埃及記|利未記|民數記|申命記|約書亞記|士師記|路得記|撒母耳記上|撒母耳記下|列王紀上|列王紀下|歷代志上|歷代志下|以斯拉記|尼希米記|以斯帖記|約伯記|詩篇|箴言|傳道書|雅歌|以賽亞書|耶利米書|耶利米哀歌|以西結書|但以理書|何西阿書|約珥書|阿摩司書|俄巴底亞書|約拿書|彌迦書|那鴻書|哈巴谷書|西番雅書|哈該書|撒迦利亞書|瑪拉基書|馬加比一書|馬加比二書|多比傳|猶滴傳|便西拉智訓|所羅門智訓|以斯拉續編上卷|以斯拉續編下卷|巴錄書|耶利米書信|瑪拿西禱言|三童歌|蘇撒拿傳|彼勒與大龍|以斯帖補編|馬太福音|馬可福音|路加福音|約翰福音|使徒行傳|羅馬書|哥林多前書|哥林多後書|加拉太書|以弗所書|腓立比書|歌羅西書|帖撒羅尼迦前書|帖撒羅尼迦後書|提摩太前書|提摩太後書|提多書|腓利門書|希伯來書|雅各書|彼得前書|彼得後書|約翰壹書|約翰貳書|約翰參書|猶大書|啟示錄'
REF_RE = re.compile(r'^(或\s*)?(?:' + BOOK_FULL + r'|[' + BOOK_SHORT + r'])[0-9：:．.\-－、末上中下全章\[\]（）()\s]*[0-9章末下]?$')

def is_ref(s):
    s = s.strip()
    if not s or s in ('翌日祝文',):
        return False
    return bool(REF_RE.match(s)) and len(s) <= 60

def _count_twins(chars, dx=12.9, dy=1.0, tol=2.5):
    bytext = defaultdict(list)
    for c in chars:
        if c['text'].strip():
            bytext[c['text']].append(c)
    n = 0
    for k, lst in bytext.items():
        lst.sort(key=lambda c: c['x0'])
        for i, c in enumerate(lst):
            for j in range(i + 1, len(lst)):
                if abs(abs(c['x0'] - lst[j]['x0']) - dx) < tol and abs(abs(c['top'] - lst[j]['top']) - dy) < tol:
                    n += 1
    return n

def dedupe_chars(chars, dx=12.9, dy=1.0, tol=2.5):
    # only de-duplicate when the page clearly has a doubled text layer
    if _count_twins(chars, dx, dy, tol) < 50:
        return chars
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
                if abs(abs(c['x0'] - lst[j]['x0']) - dx) < tol and abs(abs(c['top'] - lst[j]['top']) - dy) < tol:
                    used[j] = True
                    break
        for i, u in enumerate(used):
            if u:
                skip.add(id(lst[i]))
    return [c for c in chars if not c['text'].strip() or id(c) not in skip]

def build_words(chars, gap=8):
    # ignore space glyphs entirely
    chars = [c for c in chars if c['text'].strip()]
    chars = sorted(chars, key=lambda c: (c['top'], c['x0']))
    lines = defaultdict(list)
    for c in chars:
        key = round(c['top'] / 4.0) * 4
        lines[key].append(c)
    words = []
    for key in sorted(lines):
        cs = sorted(lines[key], key=lambda c: c['x0'])
        cur = []
        prev_x1 = None
        for c in cs:
            if cur and c['x0'] - prev_x1 > gap:
                words.append(cur)
                cur = []
            cur.append(c)
            prev_x1 = c['x1']
        if cur:
            words.append(cur)
    result = []
    for w in words:
        text = ''.join(c['text'] for c in w)
        if not text.strip():
            continue
        result.append({
            'text': text,
            'x0': min(c['x0'] for c in w),
            'x1': max(c['x1'] for c in w),
            'top': min(c['top'] for c in w),
        })
    return result

def parse_page_words(page):
    chars = dedupe_chars(page.chars)
    return build_words(chars)

def run():
    p = pdfplumber.open(PDF)
    days = []
    current = None
    year = None
    month = None
    for pidx in range(11, len(p.pages)):
        page = p.pages[pidx]
        page_no = pidx + 1
        for w in parse_page_words(page):
            c = col_of((w['x0'] + w['x1']) / 2.0)
            cells = {c: [w['text']]}
            # single word rows only here (words already built)
            meta = ' '.join(cells.get('meta', [])).strip()
            comm = ' '.join(cells.get('communion', [])).strip()
            morn = ' '.join(cells.get('morning', [])).strip()
            ev = ' '.join(cells.get('evening', [])).strip()

            if re.fullmatch(r'\d{3}', meta) and not comm and not morn and not ev:
                continue
            m = MONTH_RE.match(meta)
            if m and not comm and not morn and not ev:
                year, month = int(m.group(1)), int(m.group(2))
                continue
            if not meta and not comm and not morn and not ev:
                continue

            dm = DATE_RE.match(meta)
            if dm:
                if current:
                    days.append(current)
                feast = meta[dm.end():].strip()
                current = {
                    'page': page_no, 'year': year, 'month': month,
                    'day': int(dm.group(1)), 'weekday': dm.group(2),
                    'feast': feast, 'lunar': None, 'color': None,
                    'notes': [], 'raw': [],
                    'communion': [], 'morning': [], 'evening': [],
                }
                continue
            if current is None:
                continue

            if current['color'] is None and meta:
                cm = COLOR_LEAD.match(meta)
                if cm and cm.group(0):
                    current['color'] = cm.group(0)
                    meta = meta[cm.end():].strip()
            if current['lunar'] is None and meta and not comm and not morn and not ev and LUNAR_RE.match(meta):
                current['lunar'] = meta
                continue
            if meta and CANTICLE_RE.search(meta) and not comm and not morn and not ev:
                current['notes'].append(meta)
                continue
            if meta and is_ref(meta) and not comm and not morn and not ev:
                current['communion'].append(meta)
                continue
            if meta and not comm and not morn and not ev:
                current['notes'].append(meta)
                continue
            if comm:
                current['communion'].append(comm)
            if morn:
                current['morning'].append(morn)
            if ev:
                current['evening'].append(ev)
    if current:
        days.append(current)
    return days

if __name__ == '__main__':
    days = run()
    print('parsed days:', len(days))
    json.dump(days, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('saved', OUT)
