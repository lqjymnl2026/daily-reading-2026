# -*- coding: utf-8 -*-
"""Convert public-domain 和合本 (CUV) JSON into per-book files for the site."""
import json, os, re

SRC = '/tmp/zh_cuv.json'
OUT = 'site/data/bible'
INDEX = 'site/data/bible_index.json'

# Chinese book name (traditional) -> CUV abbrev in the dataset
BOOK_MAP = {
    '創世記':'gn','出埃及記':'ex','利未記':'lv','民數記':'nm','申命記':'dt',
    '約書亞記':'js','士師記':'jud','路得記':'rt','撒母耳記上':'1sm','撒母耳記下':'2sm',
    '列王紀上':'1kgs','列王紀下':'2kgs','歷代志上':'1ch','歷代志下':'2ch',
    '以斯拉記':'ezr','尼希米記':'ne','以斯帖記':'et','約伯記':'job','詩篇':'ps',
    '箴言':'prv','傳道書':'ec','雅歌':'so','以賽亞書':'is','耶利米書':'jr',
    '耶利米哀歌':'lm','以西結書':'ez','但以理書':'dn','何西阿書':'ho','約珥書':'jl',
    '阿摩司書':'am','俄巴底亞書':'ob','約拿書':'jn','彌迦書':'mi','那鴻書':'na',
    '哈巴谷書':'hk','西番雅書':'zp','哈該書':'hg','撒迦利亞書':'zc','瑪拉基書':'ml',
    '馬太福音':'mt','馬可福音':'mk','路加福音':'lk','約翰福音':'jo','使徒行傳':'act',
    '羅馬書':'rm','哥林多前書':'1co','哥林多後書':'2co','加拉太書':'gl','以弗所書':'eph',
    '腓立比書':'ph','歌羅西書':'cl','帖撒羅尼迦前書':'1ts','帖撒羅尼迦後書':'2ts',
    '提摩太前書':'1tm','提摩太後書':'2tm','提多書':'tt','腓利門書':'phm','希伯來書':'hb',
    '雅各書':'jm','彼得前書':'1pe','彼得後書':'2pe','約翰壹書':'1jo','約翰貳書':'2jo',
    '約翰參書':'3jo','猶大書':'jd','啟示錄':'re',
}
# Apocrypha (次經) — no public-domain CUV text bundled; mark unavailable
APOCRYPHA = {
    '多比傳':None,'猶滴傳':None,'便西拉智訓':None,'所羅門智訓':None,
    '以斯拉續編上卷':None,'以斯拉續編下卷':None,'巴錄書':None,'耶利米書信':None,
    '瑪拿西禱言':None,'三童歌':None,'蘇撒拿傳':None,'彼勒與大龍':None,
    '以斯帖補編':None,'馬加比一書':None,'馬加比二書':None,
}

def main():
    data = json.load(open(SRC, encoding='utf-8-sig'))
    os.makedirs(OUT, exist_ok=True)
    index = {}
    for b in data:
        chs = []
        for chapter in b['chapters']:
            chs.append([re.sub(r'\s+', '', v) for v in chapter])
        fn = b['abbrev'] + '.json'
        json.dump(chs, open(os.path.join(OUT, fn), 'w', encoding='utf-8'), ensure_ascii=False)
        index[b['abbrev']] = {'name_en': b['name'], 'chapters': len(chs), 'file': fn}
    # add chinese names + apocrypha markers
    chname_by_abbr = {}
    for cn, ab in BOOK_MAP.items():
        chname_by_abbr[ab] = cn
    full = {}
    for ab, meta in index.items():
        meta['name_zh'] = chname_by_abbr.get(ab, meta['name_en'])
        full[ab] = meta
    for cn in APOCRYPHA:
        full[cn] = {'name_en': 'Apocrypha (not bundled)', 'name_zh': cn, 'chapters': 0, 'file': None, 'apocrypha': True}
    # also include a by-chinese-name index for convenience
    by_zh = {cn: ab for cn, ab in BOOK_MAP.items()}
    json.dump({'by_abbr': full, 'by_zh': by_zh, 'apocrypha': list(APOCRYPHA.keys())},
              open(INDEX, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('converted', len(data), 'books + apocrypha markers ->', OUT)

if __name__ == '__main__':
    main()
