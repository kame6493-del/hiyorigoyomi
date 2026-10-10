"""Zen Maru Gothic(OFL)を、JIS 第1水準の漢字・かな・英数字・src に出てくる字だけに絞って public/fonts/ に WOFF2 で置く。
python work/redesign/make_fonts.py。入っていない字は端末の字で出る(CSS の後ろの候補)"""
import glob
import os
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
chars = set()
for b1 in range(0xB0, 0xD0):  # 第1水準(EUC-JP 0xB0A1〜0xCFD3)
    for b2 in range(0xA1, 0xFF):
        try:
            chars.add(bytes([b1, b2]).decode('euc_jp'))
        except UnicodeDecodeError:
            pass
for cp in list(range(0x20, 0x7F)) + list(range(0x3000, 0x3100)) + list(range(0xFF01, 0xFF9F)) + list(range(0x2010, 0x2070)) + list(range(0x2190, 0x2200)) + list(range(0x25A0, 0x2700)):
    chars.add(chr(cp))
for f in glob.glob(os.path.join(ROOT, 'src', '**', '*.ts*'), recursive=True):
    if 'fixtures' in f:
        continue
    chars.update(open(f, encoding='utf-8').read())
text = ''.join(sorted(c for c in chars if ord(c) >= 0x20))
for w in ('Medium', 'Bold'):
    src = os.path.join(HERE, 'fonts', f'ZenMaruGothic-{w}.ttf')
    out = os.path.join(ROOT, 'public', 'fonts', f'zenmaru-{w.lower()}.woff2')
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    ft = subset.load_font(src, opts)
    s = subset.Subsetter(opts)
    s.populate(text=text)
    s.subset(ft)
    subset.save_font(ft, out, opts)
    print(out, os.path.getsize(out) // 1024, 'KB', len(text), 'chars')
