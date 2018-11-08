# -*- coding: utf-8 -*-

# find missing glyphs needed to render given txt's

import json
 
def find_missing(pths):
    missing = {}
    for p in pths:
        txt = open(p,'r').read()
        js = json.loads(open("./dist/min-trad-compiled.json",'r').read())
        for c in txt:
            if c not in js and 0x4e00 <= ord(c) <= 0x9fef:
                if c not in missing:
                    missing[c] = 0
                missing[c]+=1

    sb = sorted([(k,missing[k]) for k in missing if missing[k] > 10],key=lambda k: -k[1])
    print(sb)
    print(len(sb),len(missing),float(sum(s[1] for s in sb))/sum(missing[k] for k in missing))
    return missing

find_missing([
    u"../txt/彷徨朝花夕拾故事新编.txt",
    u"../txt/唐诗宋词三百首.txt",
    u"../txt/史记.txt",
    u"../txt/古文观止.txt",
    u"../txt/红楼梦.txt",
    u"../txt/雅舍小品.txt",
    u"../txt/子不语.txt",
    u"../txt/闲情偶寄.txt",
    u"../txt/六十种曲/還魂記.txt",
])