"""Google Play 用の画面写真とフィーチャー画像を作る(2026-10-10 の水彩の見た目)。
python scripts/store_shots.py [製品ビルドのURL] [開発サーバーのURL]
- 生の画面: store/raw_play/(430x932 の3倍)
- Play 用 1080x1920: store/play/shot_N.png / フィーチャー 1024x500: store/play/feature.png
- 値段・「無料」は写さない。iPhone だけの機能(iCloud など)は写さない
- iOS の写真(store/ios/ 1290x2796)は、iOS は出し直さないので前の版の画面(store/raw/)と前の見出しのまま、地だけ作り直す
- 撮り直さず組むだけ: python scripts/store_shots.py --no-capture
前の版の Play 素材は store/archive_v1_2026-10-10/play/ に退避してある
2026-10-10 持ち主「Claude 特有の背景をなくして」: 生成りの無地をやめ、桜色の水彩のにじみ(毎回同じ乱数)に
アプリの桜スタンプを散らした地にする。見出しは HG正楷書体-PRO(HGRPRE)。元の画像は store/_cream_backup_2026-10-10/"""
import os
import sys
import numpy as np
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROD = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:47391/'
DEV = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:47392/'
RAW = os.path.join(ROOT, 'store', 'raw_play')
PLAY = os.path.join(ROOT, 'store', 'play')
ART = os.path.join(ROOT, 'public', 'art')
for d in (RAW, PLAY):
    os.makedirs(d, exist_ok=True)
DEMO = os.path.join(HERE, 'demo_backup.json')
FB = os.path.join(ROOT, 'work', 'redesign', 'fonts', 'ZenMaruGothic-Bold.ttf')
FM = os.path.join(ROOT, 'work', 'redesign', 'fonts', 'ZenMaruGothic-Medium.ttf')
PAPER = (247, 240, 229)
INK = (74, 59, 49)
SUB = (140, 123, 108)
ACCENT = (192, 103, 90)


def cell(page, d):
    return page.locator(f'.cell[data-date="{d}"]')


def prepare(page, url, plus=False):
    page.clock.install(time='2026-10-03T10:00:00+09:00')
    page.clock.resume()
    page.goto(url)
    page.wait_for_selector('.month')
    page.click('.welcome >> text=スキップ')
    page.click('button[aria-label="その他"]')
    page.set_input_files('[data-testid="backup-file"]', DEMO)
    page.click('text=今の予定を消して置き換える')
    if plus:
        page.click('.row-item:has-text("開発用") button')
        page.wait_for_selector('.month')
        page.click('button[aria-label="設定"]')
        page.click('.theme[aria-label="さくら"]')
    page.click('button[aria-label="もどる"]')
    page.wait_for_selector('.month')
    page.wait_for_timeout(2600)  # トーストが消えるまで


def snap(page, name):
    page.wait_for_timeout(500)
    if page.locator('.toast.show').count():
        page.wait_for_selector('.toast.show', state='detached')
    page.screenshot(path=os.path.join(RAW, name + '.png'))


if '--no-capture' not in sys.argv:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 430, 'height': 932}, device_scale_factor=3, locale='ja-JP', timezone_id='Asia/Tokyo')
        page = ctx.new_page()
        # はじめての画面
        page.clock.install(time='2026-10-03T10:00:00+09:00')
        page.clock.resume()
        page.goto(PROD)
        page.wait_for_selector('.welcome')
        page.wait_for_timeout(800)
        snap(page, '5_welcome')
        page2 = ctx.new_page()
        prepare(page2, PROD)
        page = page2
        cell(page, '2026-10-07').click()
        snap(page, '1_month')
        # スタンプを選ぶ
        page.click('.stamp-pill')
        page.wait_for_selector('.stamp-sheet')
        snap(page, '2_stamps')
        page.click('button[aria-label="閉じる"]')
        # 履歴から入力
        cell(page, '2026-10-14').click()
        page.click('button[aria-label="予定追加"]')
        page.click('.card-head >> text=もっと見る')
        page.click('.hist-chip >> text=美容院')
        page.locator('.screen-body').evaluate('e => e.scrollTop = e.scrollHeight')
        snap(page, '3_history')
        page.click('button[aria-label="やめる"]')
        # 検索
        page.click('button[aria-label="さがす"]')
        page.fill('.search-box input', '歯医者')
        page.wait_for_selector('.hit')
        page.locator('.search-box input').blur()
        snap(page, '4_search')
        page.click('button[aria-label="もどる"]')
        b2 = ctx.new_page()
        prepare(b2, DEV, plus=True)
        cell(b2, '2026-10-17').click()
        snap(b2, '6_sakura')
        b.close()

CAPS = [
    ('1_month', '予定は、スタンプでぺたっと', '六曜・旧暦・祝日も、月の表にそのまま'),
    ('2_stamps', 'スタンプを選んで、日付をタップ', 'シフトもゴミの日も、続けて貼れる'),
    ('3_history', 'いつもの予定は、履歴からひと押し', '時刻・色・スタンプまでそのまま入る'),
    ('4_search', '前の通院は、いつだった?', '過去の予定もメモも、すぐ探せる'),
    ('5_welcome', '登録なし・広告なしで、すぐ使える', '予定はこの端末の中だけに保存'),
    ('6_sakura', '着せ替えで、季節の色に', 'さくら色のカレンダーとスタンプ'),
]


def art(name, w, soft=0):
    im = Image.open(os.path.join(ART, name + '.webp')).convert('RGBA')
    im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    if soft:  # 縁をぼかして紙になじませる
        m = Image.new('L', im.size, 0)
        ImageDraw.Draw(m).rectangle([soft, soft, im.width - 1 - soft, im.height - 1 - soft], fill=255)
        m = m.filter(ImageFilter.GaussianBlur(soft * 0.6))
        im.putalpha(Image.fromarray((np.asarray(im.getchannel('A'), np.float32) * np.asarray(m, np.float32) / 255).astype(np.uint8)))
    return im


HGPRE = 'C:/Windows/Fonts/HGRPRE.TTC'
PLUM = (92, 30, 56)
PLUM2 = (128, 58, 84)
SAKURA_TOP = (248, 214, 222)
SAKURA_BOT = (236, 170, 188)
WASH = [(232, 140, 168), (214, 168, 214), (246, 186, 196), (222, 120, 150)]


def _noise(W, H, cell, rng):
    g = rng.random((H // cell + 3, W // cell + 3)).astype(np.float32)
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((W + cell * 3, H + cell * 3), Image.BICUBIC)
    return np.asarray(im.crop((cell, cell, W + cell, H + cell)).filter(ImageFilter.GaussianBlur(cell * 0.35)), np.float32) / 255


def paper(W, H, seed=7):
    """桜色の水彩のにじみ(にじみの縁を少し濃くして水彩らしく)"""
    rng = np.random.default_rng(seed)
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    base = np.array(SAKURA_TOP, np.float32) * (1 - y) + np.array(SAKURA_BOT, np.float32) * y
    img = np.broadcast_to(base, (H, W, 3)).copy()
    for k, col in enumerate(WASH):
        n = _noise(W, H, int(W * (0.16 + 0.05 * k)), rng)
        t = 0.55 + 0.04 * k
        a = np.clip((n - t) * 5.0, 0, 1) * 0.55
        edge = np.clip(1 - np.abs(n - t) * 40, 0, 1) * 0.22  # にじみの縁
        a = np.clip(a + edge, 0, 0.75)[..., None]
        img = img * (1 - a) + np.array(col, np.float32) * a
    grain = _noise(W, H, 6, rng)[..., None]
    img = img * (0.97 + 0.06 * grain)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def petal(w, rot=0):
    im = Image.open(os.path.join(ART, 'st_sakura.webp')).convert('RGBA')
    a = np.asarray(im.getchannel('A'), np.float32)
    rgb = np.asarray(im.convert('RGB'), np.float32)
    pale = (rgb.min(axis=2) > 215)  # 生成りの縁を落とす
    a = np.where((a < 170) | pale, 0, a)
    im.putalpha(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)))
    im = im.resize((w, w), Image.LANCZOS)
    return im.rotate(rot, resample=Image.BICUBIC, expand=True)


def scatter(im, spots):
    for (fx, fy, fw, rot) in spots:
        pe = petal(int(im.width * fw), rot)
        im.alpha_composite(pe, (int(im.width * fx - pe.width / 2), int(im.height * fy - pe.height / 2)))


def fit_font(d, text, path, size, maxw):
    f = ImageFont.truetype(path, size)
    while d.textlength(text, font=f) > maxw:
        size -= 2
        f = ImageFont.truetype(path, size)
    return f


def compose(raw, title, sub, W, H, out, seed=7):
    im = paper(W, H, seed).convert('RGBA')
    d = ImageDraw.Draw(im)
    cap_h = int(H * 0.19)
    # 桜スタンプを散らす(雀の絵は生成りの四角が残るので使わない)
    scatter(im, [(0.07, 0.05, 0.10, -15), (0.15, 0.13, 0.05, 20), (0.92, 0.06, 0.08, 25), (0.85, 0.12, 0.045, -30),
                 (0.95, 0.93, 0.11, 10), (0.05, 0.96, 0.07, 35)])
    f1 = fit_font(d, title, HGPRE, int(W * 0.068), W * 0.74)
    f2 = fit_font(d, sub, FM, int(W * 0.036), W * 0.78)
    d.text((W / 2, cap_h * 0.50), title, font=f1, fill=PLUM, anchor='mm', stroke_width=max(1, W // 900), stroke_fill=PLUM)
    d.text((W / 2, cap_h * 0.80), sub, font=f2, fill=PLUM2, anchor='mm')
    shot = Image.open(raw).convert('RGB')
    avail_h = H - cap_h - int(H * 0.03)
    sh = avail_h
    sw = int(shot.width * sh / shot.height)
    if sw > W * 0.80:
        sw = int(W * 0.80)
        sh = int(shot.height * sw / shot.width)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    x = (W - sw) // 2
    y = cap_h + (H - cap_h - sh) // 2
    r = int(W * 0.05)
    # 白い縁と影
    sd = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sd).rounded_rectangle([x - 14, y - 14 + 14, x + sw + 14, y + sh + 14 + 14], r + 14, fill=(120, 40, 70, 80))
    sd = sd.filter(ImageFilter.GaussianBlur(18))
    im.alpha_composite(sd)
    ImageDraw.Draw(im).rounded_rectangle([x - 14, y - 14, x + sw + 14, y + sh + 14], r + 14, fill=(255, 255, 255))
    mask = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw - 1, sh - 1], r, fill=255)
    im.paste(shot, (x, y), mask)
    im.convert('RGB').save(out)


for i, (name, t, s) in enumerate(CAPS, 1):
    compose(os.path.join(RAW, name + '.png'), t, s, 1080, 1920, os.path.join(PLAY, f'shot_{i}.png'), seed=10 + i)

# iOS(前の版の画面と見出しのまま、地だけ作り直す)
IOS_CAPS = [
    ('1_month', '大安・仏滅と旧暦が、月の表に', '六曜と旧暦は天文計算、祝日は祝日法から'),
    ('2_history', 'いつもの予定は、履歴からワンタップ', '時刻・色・スタンプまでそのまま入る'),
    ('3_stamps', 'スタンプを選んで、日付をぺたぺた', 'シフトもゴミの日も、押すだけ'),
    ('4_search', '前の通院はいつだった?', '過去の予定もメモも、すぐ探せる'),
    ('5_sakura', '着せ替えで、季節の色に', 'さくら色のカレンダーとスタンプ'),
]
IOS = os.path.join(ROOT, 'store', 'ios')
for i, (name, t, s) in enumerate(IOS_CAPS, 1):
    compose(os.path.join(ROOT, 'store', 'raw', name + '.png'), t, s, 1290, 2796, os.path.join(IOS, f'shot_{i}.png'), seed=30 + i)

# フィーチャー画像 1024x500
fe = paper(1024, 500, 3).convert('RGBA')
d = ImageDraw.Draw(fe)
icon = Image.open(os.path.join(ROOT, 'store', 'icon-1024.png')).convert('RGB').resize((300, 300), Image.LANCZOS)
m = Image.new('L', (1200, 1200), 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, 1199, 1199], 270, fill=255)
m = m.resize((300, 300), Image.LANCZOS)
sh = Image.new('RGBA', (1024, 500), (0, 0, 0, 0))
ImageDraw.Draw(sh).rounded_rectangle([76, 112, 376, 412], 66, fill=(120, 40, 70, 90))
sh = sh.filter(ImageFilter.GaussianBlur(14))
fe.alpha_composite(sh)
fe.paste(icon, (70, 100), m)
logo = art('logo', 470)
fe.alpha_composite(logo, (420, 70))
d.text((440, 262), '日々の暮らしに', font=ImageFont.truetype(HGPRE, 34), fill=PLUM2)
d.text((470, 308), '小さな彩りを', font=ImageFont.truetype(HGPRE, 34), fill=PLUM2)
d.text((430, 410), 'スタンプで貼る、登録いらずのカレンダー', font=ImageFont.truetype(FB, 27), fill=PLUM, anchor='lm')
scatter(fe, [(0.03, 0.08, 0.09, -20), (0.93, 0.15, 0.10, 15), (0.84, 0.58, 0.13, 40), (0.96, 0.75, 0.06, -10),
             (0.74, 0.62, 0.05, 12)])
fe.convert('RGB').save(os.path.join(PLAY, 'feature.png'))
print('ok')
