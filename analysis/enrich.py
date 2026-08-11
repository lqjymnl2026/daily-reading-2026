# -*- coding: utf-8 -*-
"""Clean + enrich raw lectionary parse into a website-ready JSON."""
import json, re
from datetime import date

RAW = 'analysis/lectionary.json'
OUT = 'site/data/lectionary.json'

BOOK_FULL = '創世記|出埃及記|利未記|民數記|申命記|約書亞記|士師記|路得記|撒母耳記上|撒母耳記下|列王紀上|列王紀下|歷代志上|歷代志下|以斯拉記|尼希米記|以斯帖記|約伯記|詩篇|箴言|傳道書|雅歌|以賽亞書|耶利米書|耶利米哀歌|以西結書|但以理書|何西阿書|約珥書|阿摩司書|俄巴底亞書|約拿書|彌迦書|那鴻書|哈巴谷書|西番雅書|哈該書|撒迦利亞書|瑪拉基書|馬加比一書|馬加比二書|多比傳|猶滴傳|便西拉智訓|所羅門智訓|以斯拉續編上卷|以斯拉續編下卷|巴錄書|耶利米書信|瑪拿西禱言|三童歌|蘇撒拿傳|彼勒與大龍|以斯帖補編|馬太福音|馬可福音|路加福音|約翰福音|使徒行傳|羅馬書|哥林多前書|哥林多後書|加拉太書|以弗所書|腓立比書|歌羅西書|帖撒羅尼迦前書|帖撒羅尼迦後書|提摩太前書|提摩太後書|提多書|腓利門書|希伯來書|雅各書|彼得前書|彼得後書|約翰壹書|約翰貳書|約翰參書|猶大書|啟示錄'
BOOK_SHORT = '創出利民申書士得撒王代拉尼斯伯詩箴傳歌賽耶哀結但何珥摩俄拿彌鴻哈番該亞瑪太可路約徒羅林加弗腓西帖提多門來雅彼約猶啟便所禱童蘇'
REF_RE = re.compile(r'^(或\s*)?(?:' + BOOK_FULL + r'|[' + BOOK_SHORT + r'])[0-9：:．.\-－、末上中下全章\[\]（）()；，\s]*[0-9章末下]?')
HEADER_WORDS = {'聖餐崇拜', '早禱', '晚禱'}
PAGE_HDR_RE = re.compile(r'^\d{4}年\d{1,2}/\d{1,2}月$|^\d{4}年\d{1,2}月$')
LABEL_RE = re.compile(r'（記念日|（小節日|（節日|（主要慶節|（殉道|（主教|（聖師|（傳道者|（使徒|（牧者|（修士|（修女|（貞女|（聖婦|（聖人|第一晚禱|晚禱|夏季齋期|冬季齋期|四季齋期|特禱日')

def book_of(ref):
    s = re.sub(r'^或\s*', '', ref.strip())
    for cand in ['創世記','出埃及記','利未記','民數記','申命記','約書亞記','士師記','路得記',
                 '撒母耳記上','撒母耳記下','列王紀上','列王紀下','歷代志上','歷代志下','以斯拉記',
                 '尼希米記','以斯帖記','約伯記','詩篇','箴言','傳道書','雅歌','以賽亞書','耶利米書',
                 '耶利米哀歌','以西結書','但以理書','何西阿書','約珥書','阿摩司書','俄巴底亞書',
                 '約拿書','彌迦書','那鴻書','哈巴谷書','西番雅書','哈該書','撒迦利亞書','瑪拉基書',
                 '馬加比一書','馬加比二書','多比傳','猶滴傳','便西拉智訓','所羅門智訓',
                 '以斯拉續編上卷','以斯拉續編下卷','巴錄書','耶利米書信','瑪拿西禱言','三童歌',
                 '蘇撒拿傳','彼勒與大龍','以斯帖補編','馬太福音','馬可福音','路加福音','約翰福音',
                 '使徒行傳','羅馬書','哥林多前書','哥林多後書','加拉太書','以弗所書','腓立比書',
                 '歌羅西書','帖撒羅尼迦前書','帖撒羅尼迦後書','提摩太前書','提摩太後書','提多書',
                 '腓利門書','希伯來書','雅各書','彼得前書','彼得後書','約翰壹書','約翰貳書',
                 '約翰參書','猶大書','啟示錄','撒上','撒下','王上','王下','代上','代下','林前','林後',
                 '帖前','帖後','提前','提後','約一','約二','約三','約壹','約貳','約參','馬一','馬二',
                 '拉上','拉下','斯補','耶信','彼前','彼後','多比','便','所','巴','禱','童','蘇','勒',
                 '創','出','利','民','申','書','士','得','拉','尼','斯','伯','詩','箴','傳','歌','賽',
                 '耶','哀','結','但','何','珥','摩','俄','拿','彌','鴻','哈','番','該','亞','瑪','太',
                 '可','路','約','徒','羅','加','弗','腓','西','多','門','來','雅','彼','猶','啟']:
        if s.startswith(cand):
            return cand
    return None

GOSPELS = {'太','可','路','約','馬太福音','馬可福音','路加福音','約翰福音'}
PSALM = {'詩','詩篇'}

def classify(ref):
    s = re.sub(r'^或\s*', '', ref.strip())
    b = book_of(s)
    if b is None:
        return None
    if b in GOSPELS:
        return 'gospel'
    if b in PSALM:
        return 'psalm'
    if b in ('徒', '使徒行傳', '羅','林前','林後','加','弗','腓','西','帖前','帖後','提前','提後','多','門','來','雅','彼前','彼後','約一','約二','約三','約壹','約貳','約參','猶', '羅馬書','哥林多前書','哥林多後書','加拉太書','以弗所書','腓立比書','歌羅西書','帖撒羅尼迦前書','帖撒羅尼迦後書','提摩太前書','提摩太後書','提多書','腓利門書','希伯來書','雅各書','彼得前書','彼得後書','約翰壹書','約翰貳書','約翰參書','猶大書'):
        return 'epistle'
    return 'ot'

def parse_lunar(lunar):
    term = None
    if lunar and '‧' in lunar:
        parts = lunar.split('‧')
        term = parts[1] if len(parts) > 1 else None
        lunar = parts[0]
    return lunar, term

def detect_season(d, feast):
    if feast:
        for s in ['將臨期','聖誕期','顯現期','大齋期','復活期','聖靈降臨期','常年期']:
            if s in feast:
                return s
    dt = date(d['year'], d['month'], d['day'])
    if date(2025,11,30) <= dt <= date(2025,12,24) or date(2026,11,29) <= dt <= date(2026,12,24):
        return '將臨期'
    if date(2025,12,25) <= dt <= date(2026,1,5) or date(2026,12,25) <= dt <= date(2026,12,31):
        return '聖誕期'
    if date(2026,1,6) <= dt <= date(2026,2,17):
        return '顯現期'
    if date(2026,2,18) <= dt <= date(2026,4,4):
        return '大齋期'
    if date(2026,4,5) <= dt <= date(2026,5,24):
        return '復活期'
    if date(2026,5,25) <= dt <= date(2026,11,28):
        return '聖靈降臨期'
    return '常年期'

def _is_incomplete(s):
    if s.endswith(('（', '(', '－', '；', '、', '，', '。', '或')):
        return True
    return s.count('（') > s.count('）') or s.count('(') > s.count(')')

def _is_continuation(s):
    s = s.strip()
    return bool(re.match(r'^[－\-]?\d', s)) or s.startswith(('）', ')', '－', '-'))

def merge_continuations(items):
    merged = []
    for it in items:
        if merged and _is_incomplete(merged[-1]) and _is_continuation(it):
            merged[-1] = merged[-1] + it
        else:
            merged.append(it)
    return merged

def is_label(x):
    return bool(LABEL_RE.search(x)) or x.startswith(('可敬的', '童貞女馬利亞')) or x in ('聖餐崇拜', '早禱', '晚禱')

def clean_list(items):
    out = []
    for x in merge_continuations(items):
        x = x.strip()
        if not x or is_label(x) or re.fullmatch(r'\d+', x):
            continue
        out.append(x)
    return out

def build_options(comm):
    """Build communion options list (互補式/半連讀式 or single)."""
    if len(comm) >= 4 and all(isinstance(c, dict) for c in comm):
        by_opt = {}
        for c in comm:
            by_opt.setdefault(c['option'], []).append(c)
        opts = []
        for label, key in (('互補式', 'comp'), ('半連讀式', 'semi')):
            if key in by_opt:
                opts.append((label, by_opt[key]))
        if opts:
            return opts
    return [('今日經課', comm if all(isinstance(c, dict) for c in comm) else [{'text': c, 'option': 'main'} for c in comm])]

def struct_option(items):
    struct = {}
    sections = []
    for item in items:
        t = item['text'].strip()
        cls = classify(t)
        if cls is None:
            if t not in HEADER_WORDS and not re.fullmatch(r'\d+', t) and not t.startswith('聖餐唸') and not t.startswith('早禱唸'):
                sections.append(t)
            continue
        struct.setdefault(cls, []).append(t)
    flat = {}
    for k, v in struct.items():
        flat[k] = v[0] if len(v) == 1 else v
    return flat, sections

def process():
    raw = json.load(open(RAW, encoding='utf-8'))
    out = []
    for d in raw:
        dt = date(d['year'], d['month'], d['day'])
        lunar, term = parse_lunar(d['lunar'])
        notes = []
        canticles = []
        for n in d['notes']:
            n = n.strip()
            if not n or re.fullmatch(r'\d+', n) or PAGE_HDR_RE.match(n):
                continue
            if n.startswith('聖餐唸') or n.startswith('早禱唸'):
                canticles.append(n)
                continue
            if n in ('白','綠','金/白','金','黑','紫','紅','灰','(或玫瑰紅)','（或玫瑰紅）'):
                continue
            notes.append(n)
        feast = d['feast']
        if not feast and notes:
            first = notes[0]
            if not re.match(r'^(澳|港|港、澳|澳門)', first):
                feast = first
                notes = notes[1:]
        merged = []
        skip = set()
        for i, n in enumerate(notes):
            if i in skip:
                continue
            if i + 1 < len(notes) and re.match(r'^(周|週|主日|日)$', notes[i+1]) and not re.search(r'[（(]', n):
                merged.append(n + notes[i+1])
                skip.add(i+1)
            else:
                merged.append(n)
        notes = merged

        comm_raw = clean_list(d['communion'])
        morning = clean_list(d['morning'])
        evening = clean_list(d['evening'])

        # 互補式/半連讀式 interleave
        if '互補式：' in notes:
            comm_raw = [c for c in comm_raw if c != '半連讀式：']
            if len(comm_raw) % 2 == 0 and len(comm_raw) >= 4:
                comm = [{'text': comm_raw[i], 'option': 'comp'} for i in range(0, len(comm_raw), 2)] + \
                       [{'text': comm_raw[i], 'option': 'semi'} for i in range(1, len(comm_raw), 2)]
            else:
                comm = [{'text': c, 'option': 'main'} for c in comm_raw]
        else:
            comm = [{'text': c, 'option': 'main'} for c in comm_raw]

        options = []
        all_sections = []
        for label, items in build_options(comm):
            struct, secs = struct_option(items)
            options.append({'label': label, **struct})
            all_sections.extend(secs)

        color = d['color']
        colors_extra = []
        for n in notes[:]:
            m = re.search(r'[紫紅白綠金黑灰](?:（[^）]+）)?(?:/[紫紅白綠金黑灰])?', n)
            if m:
                val = m.group(0)
                if color is None:
                    color = val
                else:
                    colors_extra.append(val)

        entry = {
            'date': dt.isoformat(),
            'year': d['year'], 'month': d['month'], 'day': d['day'],
            'weekday': d['weekday'],
            'feast': feast,
            'season': detect_season(d, feast),
            'color': color,
            'colors_extra': colors_extra,
            'lunar': lunar,
            'solar_term': term,
            'canticles': canticles,
            'notes': notes,
            'communion': {'options': options, 'sections': all_sections},
            'morning': morning,
            'evening': evening,
        }
        out.append(entry)
    out.sort(key=lambda e: e['date'])
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('wrote', OUT, len(out), 'days')

if __name__ == '__main__':
    process()
