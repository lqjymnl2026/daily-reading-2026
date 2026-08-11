# -*- coding: utf-8 -*-
"""把网站所有用户可见内容由繁体转简体（OpenCC hk2s）。
保留 analysis/（数据管线脚本与繁体 PDF 源绑定，不转换）。
"""
import json, os, opencc

cc = opencc.OpenCC('hk2s')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TEXT_EXT = {'.html', '.js', '.css', '.md', '.command', '.txt'}
JSON_FILES = [
    'data/lectionary.json',
    'data/refbooks.json',
    'data/bible_index.json',
    'data/bible',  # directory of per-book json
]

def convert_text(path):
    with open(path, encoding='utf-8') as f:
        src = f.read()
    out = cc.convert(src)
    if out != src:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(out)
        return True
    return False

def walk_strings(obj):
    if isinstance(obj, dict):
        return {k: walk_strings(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [walk_strings(v) for v in obj]
    if isinstance(obj, str):
        return cc.convert(obj)
    return obj

def convert_json(path):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    data = walk_strings(data)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    return True

changed = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    # skip .git and analysis
    dirnames[:] = [d for d in dirnames if d not in ('.git', 'analysis', 'screenshots', '__pycache__')]
    for fn in filenames:
        fp = os.path.join(dirpath, fn)
        ext = os.path.splitext(fn)[1].lower()
        if ext in TEXT_EXT and os.path.basename(fp) not in ('.nojekyll',):
            if convert_text(fp):
                changed.append(os.path.relpath(fp, ROOT))

for jf in JSON_FILES:
    p = os.path.join(ROOT, jf)
    if os.path.isdir(p):
        for fn in sorted(os.listdir(p)):
            if fn.endswith('.json'):
                convert_json(os.path.join(p, fn))
                changed.append(os.path.join(jf, fn))
    elif os.path.isfile(p):
        convert_json(p)
        changed.append(jf)

print('converted', len(changed), 'files')
for c in changed:
    print(' ', c)
