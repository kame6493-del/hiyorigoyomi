"""アイコンとスプラッシュを作る(2026-10-10 作り直し: 桜の枝・すずめ・スタンプの卓上カレンダーの水彩絵)。
python scripts/make_icons.py
元絵: work/redesign/icon_src_1024.png(角の丸い札の絵。外側は白い余白と影)
- 札の内側を正方形に切り、角の外(白)は周りの色で埋めて、全面不透明の 1024 にする
出力:
- store/icon-1024.png(iOS・ストア用 1024 不透明)/ store/play/icon-512.png
- ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
- android/app/src/main/res/mipmap-*/ic_launcher(_round/_foreground/_background).png
  適応アイコン: 前景 = この絵(縁を背景色へぼかす)、背景 = 絵の紙色の単色。安全域 66dp の円に主役が入る大きさ
- スプラッシュ(Android drawable*/splash.png・iOS Splash.imageset・assets/)
- PWA 用 icons/*.webp
- work/redesign/icon_check.png(丸・角丸・しずくの型で切った見え方と、安全域の円)"""
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'work', 'redesign', 'icon_src_1024.png')
PAPER = (248, 240, 226)  # 絵の紙の色(背景の単色)
PAPER_DARK = (28, 31, 43)


def full_icon():
    im = Image.open(SRC).convert('RGB')
    # 札は (15,15)-(995,953)・角の丸み約 125。下の影を避けて 938 四方を切る
    x0, y0, s = 44, 26, 922
    a = np.asarray(im).copy()
    mask = np.full(a.shape[:2], 255, np.uint8)
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([26, 26, 984, 944], 140, fill=255)
    m = np.asarray(m.filter(ImageFilter.MinFilter(5)))
    mask[m > 0] = 0
    filled = cv2.inpaint(a, mask, 12, cv2.INPAINT_TELEA)
    # 角は紙色に寄せて落ち着かせる
    blend = cv2.GaussianBlur(mask.astype(np.float32) / 255, (0, 0), 6)[..., None]
    paper = np.array(PAPER, np.float32)
    out = filled.astype(np.float32) * (1 - blend * 0.6) + paper * blend * 0.6
    out = Image.fromarray(out.clip(0, 255).astype(np.uint8)).crop((x0, y0, x0 + s, y0 + s))
    return out.resize((1024, 1024), Image.LANCZOS)


def save(img, *parts):
    p = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    img.save(p)
    return p


icon = full_icon()
save(icon, 'store', 'icon-1024.png')
save(icon, 'assets', 'icon-only.png')
save(icon.resize((512, 512), Image.LANCZOS), 'store', 'play', 'icon-512.png')
save(icon, 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png')

# ---- Android 適応アイコン ----
# mipmap-anydpi-v26 の xml は前景・背景とも 16.7% 内側に置く(= 画像は 72dp の見える範囲に当たる)。
# 安全域 66dp の円 = 画像の幅の 66/72 = 91.7% の円。絵の主役(カレンダーとすずめ)がこの円に入るよう、絵を縮めて縁をぼかす
FG_SCALE = 0.80
L = 1024
fg = Image.new('RGBA', (L, L), (0, 0, 0, 0))
sz = int(L * FG_SCALE)
art = icon.resize((sz, sz), Image.LANCZOS).convert('RGBA')
fm = Image.new('L', (sz, sz), 0)
f = int(sz * 0.07)
ImageDraw.Draw(fm).rounded_rectangle([f, f, sz - 1 - f, sz - 1 - f], int(sz * 0.18), fill=255)
fm = fm.filter(ImageFilter.GaussianBlur(f * 0.7))
art.putalpha(fm)
fg.alpha_composite(art, ((L - sz) // 2, (L - sz) // 2))
bg = Image.new('RGB', (L, L), PAPER)
save(fg, 'assets', 'icon-foreground.png')
save(bg, 'assets', 'icon-background.png')

DENS = {'ldpi': 36, 'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
res = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
for d, px in DENS.items():
    k = 4
    big = icon.resize((px * k, px * k), Image.LANCZOS)
    sq = Image.new('L', (px * k, px * k), 0)
    ImageDraw.Draw(sq).rounded_rectangle([0, 0, px * k - 1, px * k - 1], int(px * k * 0.2), fill=255)
    legacy = big.convert('RGBA')
    legacy.putalpha(sq)
    legacy.resize((px, px), Image.LANCZOS).save(os.path.join(res, f'mipmap-{d}', 'ic_launcher.png'), optimize=True)
    ci = Image.new('L', (px * k, px * k), 0)
    ImageDraw.Draw(ci).ellipse([0, 0, px * k - 1, px * k - 1], fill=255)
    rnd = big.convert('RGBA')
    rnd.putalpha(ci)
    rnd.resize((px, px), Image.LANCZOS).save(os.path.join(res, f'mipmap-{d}', 'ic_launcher_round.png'))
    fg.resize((px, px), Image.LANCZOS).save(os.path.join(res, f'mipmap-{d}', 'ic_launcher_foreground.png'))
    bg.resize((px, px), Image.LANCZOS).save(os.path.join(res, f'mipmap-{d}', 'ic_launcher_background.png'))
# 色の値(xml の背景色)も紙色に
with open(os.path.join(res, 'values', 'ic_launcher_background.xml'), 'w', encoding='utf-8') as fh:
    fh.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#%02X%02X%02X</color>\n</resources>\n' % PAPER)

# ---- 見え方の確認(108dp の層に置いて、型で切る) ----
def launcher(mask_kind, n=432):
    layer = Image.new('RGB', (n * 108 // 72, n * 108 // 72), PAPER)
    N = layer.width
    inner = n
    off = (N - inner) // 2
    layer.paste(bg.resize((inner, inner)), (off, off))
    fgi = fg.resize((inner, inner), Image.LANCZOS)
    layer.paste(fgi, (off, off), fgi)
    vis = layer.crop((off, off, off + inner, off + inner))
    m = Image.new('L', (inner * 4, inner * 4), 0)
    d = ImageDraw.Draw(m)
    W = inner * 4
    if mask_kind == 'circle':
        d.ellipse([0, 0, W - 1, W - 1], fill=255)
    elif mask_kind == 'squircle':
        d.rounded_rectangle([0, 0, W - 1, W - 1], int(W * 0.32), fill=255)
    elif mask_kind == 'rounded':
        d.rounded_rectangle([0, 0, W - 1, W - 1], int(W * 0.12), fill=255)
    else:  # しずく
        d.rounded_rectangle([0, 0, W - 1, W - 1], int(W * 0.5), fill=255)
        d.rectangle([W // 2, W // 2, W - 1, W - 1], fill=255)
    m = m.resize((inner, inner), Image.LANCZOS)
    out = Image.new('RGB', (inner, inner), (70, 90, 110))
    out.paste(vis, (0, 0), m)
    g = ImageDraw.Draw(out)
    r = inner * 66 / 72 / 2
    c = inner / 2
    g.ellipse([c - r, c - r, c + r, c + r], outline=(255, 0, 0), width=2)
    return out


tiles = [launcher(k) for k in ('circle', 'squircle', 'rounded', 'teardrop')]
ios = icon.resize((432, 432), Image.LANCZOS)
im4 = Image.new('L', (432 * 4, 432 * 4), 0)
ImageDraw.Draw(im4).rounded_rectangle([0, 0, 432 * 4 - 1, 432 * 4 - 1], int(432 * 4 * 0.2237), fill=255)
iosv = Image.new('RGB', (432, 432), (70, 90, 110))
iosv.paste(ios, (0, 0), im4.resize((432, 432), Image.LANCZOS))
tiles.append(iosv)
sheet = Image.new('RGB', (len(tiles) * 452 + 20, 472), (70, 90, 110))
for i, t in enumerate(tiles):
    sheet.paste(t, (20 + i * 452, 20))
sheet.save(os.path.join(ROOT, 'work', 'redesign', 'icon_check.png'))

# ---- スプラッシュ(紙色の上にアイコン) ----
def splash(w, h, dark=False):
    sp = Image.new('RGB', (w, h), PAPER_DARK if dark else PAPER)
    s = int(min(w, h) * 0.30)
    m = Image.new('L', (s * 4, s * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, s * 4 - 1, s * 4 - 1], int(s * 4 * 0.22), fill=255)
    sp.paste(icon.resize((s, s), Image.LANCZOS), ((w - s) // 2, (h - s) // 2), m.resize((s, s), Image.LANCZOS))
    return sp


save(splash(2732, 2732), 'assets', 'splash.png')
save(splash(2732, 2732, True), 'assets', 'splash-dark.png')
for dirpath, _, files in os.walk(res):
    if os.path.basename(dirpath).startswith('drawable') and 'splash.png' in files:
        p = os.path.join(dirpath, 'splash.png')
        w, h = Image.open(p).size
        # 256色に減らして軽くする(AAB を 10MB 未満に収めるため。紙色と水彩なので目で見て差は小さい)
        splash(w, h, '-night' in os.path.basename(dirpath)).quantize(128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(p, optimize=True)
sp_dir = os.path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset')
for fn in os.listdir(sp_dir):
    if fn.endswith('.png'):
        p = os.path.join(sp_dir, fn)
        w, h = Image.open(p).size
        splash(w, h, 'dark' in fn).save(p)
# PWA(ブラウザで開いたとき)
for px in (48, 72, 96, 128, 192, 256, 512):
    icon.resize((px, px), Image.LANCZOS).save(os.path.join(ROOT, 'icons', f'icon-{px}.webp'), 'WEBP', quality=90)
print('ok')
