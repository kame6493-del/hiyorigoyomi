"""アイコンとスプラッシュを描く。python scripts/make_icons.py
出力: assets/(@capacitor/assets の入力)と store/icon-1024.png・store/play/icon-512.png"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, 'assets')
S = os.path.join(ROOT, 'store')
os.makedirs(A, exist_ok=True)
os.makedirs(os.path.join(S, 'play'), exist_ok=True)
FONT_B = r'C:\Windows\Fonts\YuGothB.ttc'

ORANGE = (226, 132, 48)
ORANGE_D = (196, 104, 30)
PAPER = (253, 249, 240)
RED = (214, 62, 66)
INK = (64, 52, 40)
LINE = (232, 220, 200)


def draw_mark(size, bg=True):
    """size 四方のアイコン(4倍で描いて縮める)"""
    k = 4
    W = size * k
    im = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if bg:
        # 上が明るい橙の背景
        for y in range(W):
            t = y / W
            c = tuple(int(ORANGE[i] * (1 - t) + ORANGE_D[i] * t) for i in range(3))
            d.line([(0, y), (W, y)], fill=c)
    u = W / 1024
    # 暦の紙(少し傾けるため別の画像に描いて回す)
    card = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    x0, y0, x1, y1 = 212 * u, 250 * u, 812 * u, 840 * u
    shadow = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([x0 + 10 * u, y0 + 22 * u, x1 + 10 * u, y1 + 22 * u], 70 * u, fill=(90, 40, 0, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18 * u))
    cd.rounded_rectangle([x0, y0, x1, y1], 70 * u, fill=PAPER)
    # 上の帯
    cd.rounded_rectangle([x0, y0, x1, y0 + 150 * u], 70 * u, fill=(240, 226, 204))
    cd.rectangle([x0, y0 + 80 * u, x1, y0 + 150 * u], fill=(240, 226, 204))
    # 綴じ輪
    for cx in (372, 652):
        cd.rounded_rectangle([(cx - 22) * u, 196 * u, (cx + 22) * u, 330 * u], 22 * u, fill=INK)
    # 日付のます目(3段×4列の点)
    for r in range(3):
        for c in range(4):
            px = x0 + (95 + c * 137) * u
            py = y0 + (230 + r * 115) * u
            cd.rounded_rectangle([px - 34 * u, py - 22 * u, px + 34 * u, py + 22 * u], 12 * u, fill=LINE)
    card = card.rotate(-4, resample=Image.BICUBIC, center=(W / 2, W / 2))
    shadow = shadow.rotate(-4, resample=Image.BICUBIC, center=(W / 2, W / 2))
    im.alpha_composite(shadow)
    im.alpha_composite(card)
    # はんこ(右下に重ねる。少し傾けて、かすれを少し)
    st = Image.new('RGBA', (W, W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    cx, cy, R = 640 * u, 640 * u, 205 * u
    sd.ellipse([cx - R, cy - R, cx + R, cy + R], fill=RED)
    sd.ellipse([cx - R + 22 * u, cy - R + 22 * u, cx + R - 22 * u, cy + R - 22 * u], outline=PAPER, width=int(12 * u))
    f = ImageFont.truetype(FONT_B, int(230 * u))
    sd.text((cx, cy + 6 * u), '日', font=f, fill=PAPER, anchor='mm')
    st = st.rotate(12, resample=Image.BICUBIC, center=(cx, cy))
    im.alpha_composite(st)
    return im.resize((size, size), Image.LANCZOS)


icon = draw_mark(1024)
icon.convert('RGB').save(os.path.join(A, 'icon-only.png'))
icon.convert('RGB').save(os.path.join(S, 'icon-1024.png'))
icon.convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(S, 'play', 'icon-512.png'))
# Android の適応アイコン: 前景は透明背景に縮めて(安全域 66%)、背景は橙一色
fg = draw_mark(1024, bg=False)
canvas = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
small = fg.resize((700, 700), Image.LANCZOS)
canvas.alpha_composite(small, (162, 150))
canvas.save(os.path.join(A, 'icon-foreground.png'))
Image.new('RGB', (1024, 1024), ORANGE).save(os.path.join(A, 'icon-background.png'))
# スプラッシュ(紙色の上にアイコン)
for name, bgc in (('splash.png', (251, 248, 241)), ('splash-dark.png', (22, 24, 29))):
    sp = Image.new('RGB', (2732, 2732), bgc)
    m = draw_mark(560)
    mask = Image.new('L', (560, 560), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, 559, 559], 124, fill=255)
    sp.paste(m.convert('RGB'), (1086, 1086), mask)
    sp.save(os.path.join(A, name))
print('ok')
