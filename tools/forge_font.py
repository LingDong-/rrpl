# -*- coding: utf-8 -*-

# generate a TTF font using fontforge

from glob import glob
import os
import sys

import fontforge

font = fontforge.font()
font.familyname = "RRPL"

for f in glob(sys.argv[1]):
    hx = int(os.path.splitext(os.path.basename(f))[0],16)
    print hx,
    glyph = font.createChar(hx)
    glyph.importOutlines(f)
    glyph.width = 1000

def fillblock(i0,i1):
    for i in range(i0,i1):
        glyph = font.createChar(i)
        glyph.importOutlines("../data/blank.svg")
        glyph.width = 0

fillblock(0xff01,0xff20)
fillblock(0x21,0x7f)
fillblock(0x2010,0x2027)

font.generate(sys.argv[2])