"""Google Play 用の画面写真とフィーチャー画像を作る(2026-10-10 の水彩の見た目)。
python scripts/store_shots.py [製品ビルドのURL] [開発サーバーのURL]
- 生の画面: store/raw_play/(430x932 の3倍)
- Play 用 1080x1920: store/play/shot_N.png / フィーチャー 1024x500: store/play/feature.png
- 値段・「無料」は写さない。iPhone だけの機能(iCloud など)は写さない
- iOS の写真(store/ios/)は作らない(iOS は出し直さないため、前の物のまま)
前の版の Play 素材は store/archive_v1_2026-10-10/play/ に退避してある"""
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


def paper(W, H):
    return Image.new('RGB', (W, H), PAPER)


def fit_font(d, text, path, size, maxw):
    f = ImageFont.truetype(path, size)
    while d.textlength(text, font=f) > maxw:
        size -= 2
        f = ImageFont.truetype(path, size)
    return f


def compose(raw, title, sub, W, H, out):
    im = paper(W, H).convert('RGBA')
    d = ImageDraw.Draw(im)
    cap_h = int(H * 0.19)
    im.alpha_composite(art('sprig_tl', int(W * 0.11)), (0, 0))
    sp = art('sparrow', int(W * 0.10))
    im.alpha_composite(sp, (W - sp.width - int(W * 0.02), int(cap_h * 0.04)))
    f1 = fit_font(d, title, FB, int(W * 0.062), W * 0.72)
    f2 = fit_font(d, sub, FM, int(W * 0.036), W * 0.76)
    d.text((W / 2, cap_h * 0.50), title, font=f1, fill=INK, anchor='mm')
    d.text((W / 2, cap_h * 0.80), sub, font=f2, fill=SUB, anchor='mm')
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
    # 外枠(やわらかい生成りの縁)と影
    sd = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sd).rounded_rectangle([x - 14, y - 14 + 14, x + sw + 14, y + sh + 14 + 14], r + 14, fill=(110, 80, 50, 70))
    sd = sd.filter(ImageFilter.GaussianBlur(18))
    im.alpha_composite(sd)
    ImageDraw.Draw(im).rounded_rectangle([x - 14, y - 14, x + sw + 14, y + sh + 14], r + 14, fill=(255, 251, 245))
    mask = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw - 1, sh - 1], r, fill=255)
    im.paste(shot, (x, y), mask)
    fl = art('flowers_bottom', int(W * 0.15))
    im.alpha_composite(fl, (int(W * 0.005), H - fl.height - int(H * 0.005)))
    im.convert('RGB').save(out)


for i, (name, t, s) in enumerate(CAPS, 1):
    compose(os.path.join(RAW, name + '.png'), t, s, 1080, 1920, os.path.join(PLAY, f'shot_{i}.png'))

# フィーチャー画像 1024x500
fe = paper(1024, 500).convert('RGBA')
d = ImageDraw.Draw(fe)
icon = Image.open(os.path.join(ROOT, 'store', 'icon-1024.png')).convert('RGB').resize((300, 300), Image.LANCZOS)
m = Image.new('L', (1200, 1200), 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, 1199, 1199], 270, fill=255)
m = m.resize((300, 300), Image.LANCZOS)
sh = Image.new('RGBA', (1024, 500), (0, 0, 0, 0))
ImageDraw.Draw(sh).rounded_rectangle([76, 112, 376, 412], 66, fill=(110, 70, 30, 80))
sh = sh.filter(ImageFilter.GaussianBlur(14))
fe.alpha_composite(sh)
fe.paste(icon, (70, 100), m)
logo = art('logo', 470)
fe.alpha_composite(logo, (420, 70))
tag = art('tagline', 150, soft=8)
fe.alpha_composite(tag, (440, 240))
d.text((430, 400), 'スタンプで貼る、登録いらずのカレンダー', font=ImageFont.truetype(FB, 27), fill=INK, anchor='lm')
cat = art('cat_sleep', 250, soft=18)
fe.alpha_composite(cat, (740, 226))
spr = art('sprig_tl', 92)
fe.alpha_composite(spr, (0, 0))
fl = art('flowers_bottom', 90)
fe.alpha_composite(fl, (934, 500 - fl.height))
fe.convert('RGB').save(os.path.join(PLAY, 'feature.png'))
print('ok')
