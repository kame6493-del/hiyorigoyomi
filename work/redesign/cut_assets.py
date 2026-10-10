"""見本画像(ChatGPT 製の UI 参考 ref2〜ref8)から絵を切り出して public/art/ に置く。
python work/redesign/cut_assets.py
- key : 周りの紙色(切り出し枠の縁の中央値)とつながっている所だけ透明にする。中の白い所は残す
- keep: 四角のまま。feather で縁をぼかして背景になじませる
- circle: 丸く切り抜く
出力は 3倍に拡大した WebP(透明あり)。contact.png に一覧を出す"""
import os
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(ROOT, 'public', 'art')
os.makedirs(OUT, exist_ok=True)
REF = {i: Image.open(os.path.join(HERE, f'ref{i}.png')).convert('RGB') for i in range(2, 9)}


def box(cx, cy, h):
    return (cx - h, cy - h, cx + h, cy + h)


def keyed(im, t0=9, t1=30):
    a = np.asarray(im).astype(np.int16)
    H, W, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.abs(a - bg).max(axis=2).astype(np.float32)
    cand = (dist < t1).astype(np.uint8)
    n, lab = cv2.connectedComponents(cand, connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(edge)) & (cand > 0)
    alpha = np.ones((H, W), np.float32)
    alpha[bgmask] = np.clip((dist[bgmask] - t0) / (t1 - t0), 0, 1)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.6)
    # 透明になった所の色は消さずに残す(縮小・拡大でにじまないように)
    rgba = np.dstack([a.astype(np.uint8), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(rgba)


def paper(im, t1=None, t0=6):
    """紙のむらに合わせて背景色をその場で推定し、背景から離れた所を残す(縁とつながった背景だけ抜く)"""
    t1 = 24 if t1 is None or t1 < 1 else t1
    a = np.asarray(im).astype(np.uint8)
    f = a.astype(np.int16)
    border = np.concatenate([f[0], f[-1], f[:, 0], f[:, -1]])
    bg0 = np.median(border, axis=0)
    obj = (np.abs(f - bg0).max(axis=2) > 18).astype(np.uint8) * 255
    obj = cv2.dilate(obj, np.ones((5, 5), np.uint8))
    bgimg = cv2.inpaint(a, obj, 7, cv2.INPAINT_TELEA)
    bgimg = cv2.GaussianBlur(bgimg, (0, 0), 3)
    dist = np.abs(f - bgimg.astype(np.int16)).max(axis=2).astype(np.float32)
    cand = (dist < t1).astype(np.uint8)
    n, lab = cv2.connectedComponents(cand, connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(edge)) & (cand > 0)
    alpha = np.ones(a.shape[:2], np.float32)
    alpha[bgmask] = np.clip((dist[bgmask] - t0) / (t1 - t0), 0, 1)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.6)
    return Image.fromarray(np.dstack([a, (alpha * 255).astype(np.uint8)]))


def paper_old(im, t0=0.05, t1=0.13):
    """紙色(明るく彩度の低い所)で、縁とつながっている所を透明にする。紙にむらがある所用"""
    a = np.asarray(im).astype(np.float32) / 255
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    score = np.maximum(sat - 0.02, 0) + np.maximum(0.88 - mx, 0) * 1.6  # 0 に近いほど紙
    cand = (score < t1).astype(np.uint8)
    n, lab = cv2.connectedComponents(cand, connectivity=4)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bgmask = np.isin(lab, list(edge)) & (cand > 0)
    alpha = np.ones(a.shape[:2], np.float32)
    alpha[bgmask] = np.clip((score[bgmask] - t0) / (t1 - t0), 0, 1)
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0.6)
    rgba = np.dstack([(a * 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(rgba)


def feathered(im, f):
    w, h = im.size
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).rectangle([f, f, w - 1 - f, h - 1 - f], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(f / 2))
    out = im.convert('RGBA')
    out.putalpha(m)
    return out


def rounded(im, r):
    w, h = im.size
    k = 4
    m = Image.new('L', (w * k, h * k), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w * k - 1, h * k - 1], r * k, fill=255)
    out = im.convert('RGBA')
    out.putalpha(m.resize((w, h), Image.LANCZOS))
    return out


def circled(im):
    w, h = im.size
    k = 4
    m = Image.new('L', (w * k, h * k), 0)
    ImageDraw.Draw(m).ellipse([2 * k, 2 * k, w * k - 1 - 2 * k, h * k - 1 - 2 * k], fill=255)
    out = im.convert('RGBA')
    out.putalpha(m.resize((w, h), Image.LANCZOS))
    return out


def inpaint(im, rect):
    a = np.asarray(im).copy()
    m = np.zeros(a.shape[:2], np.uint8)
    x0, y0, x1, y1 = rect
    m[y0:y1, x0:x1] = 255
    return Image.fromarray(cv2.inpaint(a, m, 4, cv2.INPAINT_TELEA))


# 名前: (見本, 枠, 方法, 拡大)
S8 = {}
xs8 = [452, 514, 575, 636, 698]
ys8 = [477, 563, 653, 740, 828, 917, 1003, 1090]
names8 = [
    ['sun', 'moon', 'fork', 'basket', 'heart'],
    ['laptop', 'briefcase', 'book', 'pencil', None],
    ['house', None, 'coffee', None, None],
    ['dumbbell', 'stethoscope', 'medicine', 'sparkle', 'bath'],
    ['cake', 'popper', 'gift', 'clover', None],
    ['camera', 'book2', 'music', 'game', None],
    [None, 'paw', 'cat', None, None],
    ['sakura', 'sunflower', 'maple', 'snow', 'xmas'],
]
SPEC = {}
for r, row in enumerate(names8):
    for c, nm in enumerate(row):
        if nm:
            SPEC['st_' + nm] = (8, box(xs8[c], ys8[r], 23), 'key', 3)
SPEC.update({
    'st_osoban': (3, box(532, 534, 24), 'key', 3),
    'st_plane': (3, box(661, 744, 24), 'key', 3),
    'st_moneybag': (3, (861, 796, 912, 846), 'key', 3),
    'st_beers': (2, (684, 537, 738, 582), 'key', 3),
    'st_pumpkin': (2, (374, 842, 409, 875), 'key', 3),
    'st_smile': (2, (46, 626, 81, 661), 'key', 3),
    # 飾りと情景
    'logo': (2, (110, 28, 516, 154), 'paper', 2),
    'tagline': (2, (540, 50, 676, 140), 'paper', 2),
    'sprig_tl': (2, (2, 38, 113, 172), 'paper', 2),
    'flower_orange': (2, (496, 102, 533, 141), 'key', 3),
    'sparrow': (6, (1035, 1129, 1093, 1175), 'paper', 3),
    'sparrow2': (2, (655, 119, 711, 160), 'paper', 3),
    'sprig_a': (2, (479, 1108, 560, 1229), 'paper', 3),
    'sprig_b': (3, (411, 307, 466, 386), 'paper', 3),
    'sprig_c': (3, (411, 810, 481, 907), 'paper', 3),
    'sprig_d': (3, (666, 807, 709, 914), 'paper', 3),
    'sprig_e': (3, (680, 349, 716, 403), 'paper', 3),
    'sprig_leaf': (7, (49, 796, 90, 875), 'key', 3),
    'flowers_bottom': (7, (38, 1048, 112, 1122), 'paper', 3),
    'empty_scene': (3, (861, 476, 1002, 577), 'paper', 3),
    'girl_scene': (3, (31, 462, 370, 727), 'feather', 3),
    'cat_sleep': (3, (25, 1233, 298, 1366), 'paper', 3),
    'tap15': (3, (510, 1220, 623, 1358), 'key', 3),
    'note': (3, (621, 1228, 737, 1364), 'key', 3),
    'ic_leaf': (3, box(84, 766, 33), 'circle', 3),
    'ic_lock': (3, box(84, 849, 33), 'circle', 3),
    'ic_noad': (3, box(84, 930, 33), 'circle', 3),
    'ic_holiday': (7, box(72, 383, 28), 'circle', 3),
    'ic_rokuyo': (7, box(72, 583, 28), 'circle', 3),
    'ic_moon': (7, box(72, 686, 28), 'circle', 3),
    'ic_export': (7, box(839, 532, 31), 'circle', 3),
    'ic_import': (7, box(839, 648, 31), 'circle', 3),
    'ic_device': (7, box(839, 807, 31), 'circle', 3),
    'book_scene': (7, (797, 305, 924, 425), 'paper', 3),
    'import_scene': (7, (434, 296, 735, 384), 'round', 3),
    'crown': (8, (918, 246, 954, 274), 'key', 3),
    'pay_left': (8, (779, 240, 832, 350), 'paper', 3),
    'pay_right': (8, (1046, 240, 1092, 340), 'paper', 3),
    'pay_hills': (8, (778, 366, 1092, 430), 'feather', 3),
    'laurel_l': (8, (803, 443, 857, 547), 'paper', 3),
    'laurel_r': (8, (1006, 443, 1064, 547), 'paper', 3),
    'ic_gift': (8, (803, 578, 845, 620), 'key', 3),
    'ic_palette': (8, (803, 647, 847, 694), 'key', 3),
    'ic_colors': (8, (799, 720, 849, 770), 'key', 3),
    'ic_bell': (8, (803, 793, 845, 847), 'key', 3),
    'ic_ad': (8, (799, 959, 849, 1009), 'key', 3),
    'window_cat': (2, (930, 0, 1122, 180), 'feather', 3),
})
# 着せ替えの見本絵(テーマ 3列×3段)
TX = [(50, 140), (158, 247), (266, 354)]
TY = [(362, 448), (491, 579), (618, 702)]
THEME_ART = {
    'th_yasashii': (0, 0), 'th_shiki': (0, 1), 'th_mori': (0, 2),
    'th_aozora': (1, 0), 'th_yoru': (1, 1), 'th_cafe': (1, 2),
    'th_kotori': (2, 0), 'th_neko': (2, 1), 'th_wa': (2, 2),
}
for nm, (r, c) in THEME_ART.items():
    SPEC[nm] = (8, (TX[c][0] + 2, TY[r][0] + 2, TX[c][1] - 2, TY[r][1] - 2), 'theme', 3)

STORE_ONLY = {'flower_orange', 'sparrow2', 'sprig_a', 'st_sun', 'th_shiki', 'window_cat'}
made = []
for nm, (ri, rect, mode, k, *opt) in SPEC.items():
    im = REF[ri].crop(rect)
    if nm == 'th_yasashii':
        # 選択中のチェック印を消す
        im = inpaint(im, (im.width - 30, im.height - 30, im.width, im.height))
    if mode == 'key':
        out = keyed(im)
    elif mode == 'paper':
        out = paper(im, t1=opt[0]) if opt else paper(im)
    elif mode == 'feather':
        out = feathered(im, max(4, min(im.size) // 10))
    elif mode == 'circle':
        out = circled(im)
    elif mode == 'round':
        out = rounded(im, 10)
    else:  # theme
        out = rounded(im, 6)
    if nm == 'logo':
        al = np.asarray(out.getchannel('A')).copy()
        al[78:, 388:] = 0  # 右下の橙の花
        al[100:, :60] = 0  # 左下の紙のしみ
        out.putalpha(Image.fromarray(al))
    if nm == 'tagline':
        al = np.asarray(out.getchannel('A')).copy()
        al[68:, 116:] = 0
        out.putalpha(Image.fromarray(al))
    out = out.resize((out.width * k, out.height * k), Image.LANCZOS)
    # 拡大のぼけを少しだけ締める
    rgb = out.convert('RGB').filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
    rgb.putalpha(out.getchannel('A'))
    out = rgb
    # アプリで使わない絵(ストア画像だけで使う物)は public に入れない(AAB を軽くする)
    p = os.path.join(OUT if nm not in STORE_ONLY else os.path.join(HERE, 'art_store'), nm + '.webp')
    out.save(p, 'WEBP', quality=80, method=6)
    made.append((nm, out))

# 一覧(確認用)
cols = 8
cw, ch = 220, 240
rows = (len(made) + cols - 1) // cols
sheet = Image.new('RGB', (cols * cw, rows * ch), (120, 120, 120))
d = ImageDraw.Draw(sheet)
for i, (nm, im) in enumerate(made):
    x, y = (i % cols) * cw, (i // cols) * ch
    # 市松模様の上に置いて透明の具合を見る
    for yy in range(0, 200, 20):
        for xx in range(0, 200, 20):
            d.rectangle([x + 10 + xx, y + 10 + yy, x + 29 + xx, y + 29 + yy], fill=(250, 245, 236) if (xx + yy) // 20 % 2 else (225, 215, 200))
    t = im.copy()
    t.thumbnail((200, 200))
    sheet.paste(t, (x + 10 + (200 - t.width) // 2, y + 10 + (200 - t.height) // 2), t)
    d.text((x + 10, y + 215), nm, fill='white')
sheet.save(os.path.join(HERE, 'contact.png'))
print(len(made), 'assets ->', OUT)
