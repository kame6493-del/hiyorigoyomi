"""ストア用の画面写真とフィーチャー画像を作る。
python scripts/store_shots.py [製品ビルドのURL] [開発サーバーのURL]
- 生の画面: store/raw/(430x932 の3倍 = 1290x2796)
- iPhone 用 1290x2796: store/ios/shot_N.png / Play 用 1080x1920: store/play/shot_N.png / フィーチャー 1024x500: store/play/feature.png"""
import os
import sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PROD = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:47391/'
DEV = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:47392/'
RAW = os.path.join(ROOT, 'store', 'raw')
IOS = os.path.join(ROOT, 'store', 'ios')
PLAY = os.path.join(ROOT, 'store', 'play')
for d in (RAW, IOS, PLAY):
    os.makedirs(d, exist_ok=True)
DEMO = os.path.join(HERE, 'demo_backup.json')
FB = r'C:\Windows\Fonts\YuGothB.ttc'
FM = r'C:\Windows\Fonts\YuGothM.ttc'


def cell(page, d):
    return page.locator(f'.cell[data-date="{d}"]')


def prepare(page, url, plus=False):
    page.clock.install(time='2026-10-03T10:00:00+09:00')
    page.clock.resume()
    page.goto(url)
    page.wait_for_selector('.month')
    page.click('text=はじめる')
    page.click('button[aria-label="設定"]')
    page.set_input_files('[data-testid="backup-file"]', DEMO)
    page.click('text=今の予定を消して置き換える')
    if plus:
        page.click('.row-item:has-text("開発用") button')
        page.wait_for_selector('.month')
        page.click('button[aria-label="設定"]')
        page.click('.theme[aria-label="さくら"]')
    page.click('text=‹ もどる')
    page.wait_for_selector('.month')
    page.wait_for_timeout(2600)  # トーストが消えるまで


def snap(page, name):
    page.wait_for_timeout(400)
    page.screenshot(path=os.path.join(RAW, name + '.png'))


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 430, 'height': 932}, device_scale_factor=3, locale='ja-JP', timezone_id='Asia/Tokyo')
    page = ctx.new_page()
    prepare(page, PROD)
    cell(page, '2026-10-07').click()
    snap(page, '1_month')
    # 履歴から入力
    cell(page, '2026-10-14').click()
    page.click('text=＋ 予定を追加')
    page.click('.hist-chip >> text=美容院')
    snap(page, '2_history')
    page.click('.sheet-head >> text=やめる')
    # スタンプを押していく
    page.click('text=スタンプを押す')
    page.click('.stamp-cell[aria-label="休み"]')
    page.wait_for_timeout(300)
    page.click('text=ほかのスタンプ')
    page.click('.tabs >> text=予定')
    snap(page, '3_stamps')
    page.click('.stamp-cell[aria-label="誕生日"]')
    page.click('.paste-bar >> text=おわる')
    # 検索
    page.click('button[aria-label="さがす"]')
    page.fill('.search-box input', '歯医者')
    page.wait_for_selector('.hit')
    page.locator('.search-box input').blur()
    snap(page, '4_search')
    page.click('text=‹ もどる')
    b2 = ctx.new_page()
    prepare(b2, DEV, plus=True)
    cell(b2, '2026-10-17').click()
    snap(b2, '5_sakura')
    b.close()

CAPS = [
    ('1_month', 'スタンプで、ひと目でわかる月の表', '祝日・六曜・旧暦も。アカウント登録なし'),
    ('2_history', 'いつもの予定は、履歴からワンタップ', '時刻・色・スタンプまでそのまま入る'),
    ('3_stamps', 'スタンプを選んで、日付をぺたぺた', 'シフトもゴミの日も、押すだけ'),
    ('4_search', '前の通院はいつだった?', '過去の予定もメモも、すぐ探せる'),
    ('5_sakura', '着せ替えとスタンプ全種は買い切り', 'ひよりプラス ¥500・月額なし・広告なし'),
]
BG = (226, 132, 48)
BG2 = (251, 244, 232)


def compose(raw, title, sub, W, H, cap_h, out):
    im = Image.new('RGB', (W, H), BG2)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, cap_h], fill=BG)
    size = int(W * 0.062)
    f1 = ImageFont.truetype(FB, size)
    while d.textlength(title, font=f1) > W * 0.86:
        size -= 2
        f1 = ImageFont.truetype(FB, size)
    f2 = ImageFont.truetype(FM, int(W * 0.036))
    d.text((W / 2, cap_h * 0.42), title, font=f1, fill='white', anchor='mm')
    d.text((W / 2, cap_h * 0.74), sub, font=f2, fill=(255, 238, 214), anchor='mm')
    shot = Image.open(raw).convert('RGB')
    avail_h = H - cap_h - int(H * 0.035)
    sh = int(avail_h)
    sw = int(shot.width * sh / shot.height)
    if sw > W * 0.86:
        sw = int(W * 0.86)
        sh = int(shot.height * sw / shot.width)
    shot = shot.resize((sw, sh), Image.LANCZOS)
    r = int(W * 0.045)
    mask = Image.new('L', (sw, sh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, sw - 1, sh - 1], r, fill=255)
    x = (W - sw) // 2
    y = cap_h - int(H * 0.012) + (H - cap_h - sh) // 2
    sd = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sd).rounded_rectangle([x, y + 12, x + sw, y + sh + 12], r, fill=(80, 40, 0, 70))
    sd = sd.filter(ImageFilter.GaussianBlur(16))
    im.paste(sd, (0, 0), sd)
    im.paste(shot, (x, y), mask)
    im.save(out)


for i, (name, t, s) in enumerate(CAPS, 1):
    raw = os.path.join(RAW, name + '.png')
    compose(raw, t, s, 1290, 2796, 470, os.path.join(IOS, f'shot_{i}.png'))
    compose(raw, t, s, 1080, 1920, 330, os.path.join(PLAY, f'shot_{i}.png'))

# フィーチャー画像 1024x500
fe = Image.new('RGB', (1024, 500), BG)
d = ImageDraw.Draw(fe)
icon = Image.open(os.path.join(ROOT, 'store', 'icon-1024.png')).resize((300, 300), Image.LANCZOS)
m = Image.new('L', (300, 300), 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, 299, 299], 66, fill=255)
sh = Image.new('RGBA', (1024, 500), (0, 0, 0, 0))
ImageDraw.Draw(sh).rounded_rectangle([80, 112, 380, 412], 66, fill=(90, 40, 0, 90))
sh = sh.filter(ImageFilter.GaussianBlur(14))
fe.paste(sh, (0, 0), sh)
fe.paste(icon, (76, 100), m)
d.text((430, 190), 'ひよりごよみ', font=ImageFont.truetype(FB, 78), fill='white', anchor='lm')
def fit(text, size, maxw):
    f = ImageFont.truetype(FM, size)
    while d.textlength(text, font=f) > maxw:
        size -= 1
        f = ImageFont.truetype(FM, size)
    return f


d.text((432, 290), 'スタンプで貼る、登録いらずのカレンダー', font=fit('スタンプで貼る、登録いらずのカレンダー', 31, 560), fill=(255, 240, 220), anchor='lm')
d.text((432, 345), '祝日・六曜・旧暦 / コピー / 過去の検索', font=ImageFont.truetype(FM, 27), fill=(255, 228, 196), anchor='lm')
fe.save(os.path.join(PLAY, 'feature.png'))
print('ok')
