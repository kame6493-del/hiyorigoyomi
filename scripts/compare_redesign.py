"""見本(ChatGPT 製の UI 参考 8枚のうち 2〜8)の画面と、作り直した実際の画面を並べた比較画像を作る。
先に python scripts/e2e.py と --plus を回して scripts/e2e_out/430/ を作っておく。設定の各部分はここで撮る。
python scripts/compare_redesign.py [製品ビルドのURL]
出力: docs/compare_redesign_<名前>.png と docs/compare_redesign_all.png"""
import os
import sys
from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
REF = os.path.join(ROOT, 'work', 'redesign')
E2E = os.path.join(HERE, 'e2e_out', '430')
DOCS = os.path.join(ROOT, 'docs')
EXTRA = os.path.join(E2E, 'compare')
os.makedirs(DOCS, exist_ok=True)
os.makedirs(EXTRA, exist_ok=True)
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:47391/'
FB = r'C:\Windows\Fonts\YuGothB.ttc'

# 設定の部分ごとの画面(見本 7・8 と並べる)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 430, 'height': 932}, device_scale_factor=2, locale='ja-JP', timezone_id='Asia/Tokyo')
    pg = ctx.new_page()
    pg.clock.install(time='2026-10-03T10:00:00+09:00')
    pg.clock.resume()
    pg.goto(URL)
    pg.wait_for_selector('.month')
    pg.click('.welcome >> text=スキップ')
    pg.click('button[aria-label="その他"]')
    pg.set_input_files('[data-testid="backup-file"]', os.path.join(HERE, 'demo_backup.json'))
    pg.click('text=今の予定を消して置き換える')
    pg.wait_for_timeout(2600)

    def at(sel, name):
        pg.evaluate("s => { const e = document.querySelector(s); const a = document.querySelector('.app'); a.scrollTop = a.scrollTop + e.getBoundingClientRect().top - 64; }", sel)
        pg.wait_for_timeout(400)
        pg.screenshot(path=os.path.join(EXTRA, name + '.png'))

    pg.screenshot(path=os.path.join(EXTRA, 'settings_top.png'))
    at('.themes', 'settings_theme')
    at('.backup-hero', 'settings_backup')
    at('.import-art', 'settings_import')
    pg.evaluate("[...document.querySelectorAll('.sec')].find(e => e.textContent.includes('お知らせ')).setAttribute('id', 'sec-notify')")
    at('#sec-notify', 'settings_notify')
    b.close()

# (名前, 見本の番号, 見本の画面の枠, 実際の画面, 説明)
PH2 = [(18, 178, 440, 1075), (448, 178, 783, 1075), (788, 178, 1110, 1075)]
PH3 = [(14, 178, 386, 1080), (393, 178, 733, 1080), (738, 178, 1110, 1080)]
PH4 = [(18, 248, 382, 1072), (393, 248, 732, 1072), (742, 248, 1104, 1072)]
PH5 = [(15, 288, 384, 1102), (393, 288, 730, 1102), (742, 288, 1106, 1102)]
PH6 = [(14, 178, 418, 1102), (428, 178, 768, 1102), (775, 178, 1110, 1102)]
PH7 = [(10, 182, 398, 1153), (402, 182, 760, 1153), (765, 182, 1112, 1153)]
PH8 = [(14, 178, 390, 1150), (394, 178, 756, 1150), (760, 178, 1110, 1150)]
F = lambda n: os.path.join(E2E, 'free', n + '.png')
P = lambda n: os.path.join(E2E, 'plus', n + '.png')
X = lambda n: os.path.join(EXTRA, n + '.png')
PAIRS = [
    ('month', 2, PH2[0], F('18_month_demo'), '月のカレンダー'),
    ('stamp_picker', 2, PH2[1], F('06_stamp_picker'), 'スタンプを選ぶ'),
    ('editor', 2, PH2[2], F('19_editor_edit'), '予定の編集'),
    ('welcome', 3, PH3[0], F('01_welcome'), 'はじめての画面'),
    ('guide', 3, PH3[1], F('02_guide_1'), '使いかたガイド'),
    ('empty', 3, PH3[2], F('05_month_empty'), '空の状態'),
    ('stamp_entry', 4, PH4[0], F('12_stamp_locked'), 'スタンプから入力'),
    ('copy', 4, PH4[1], F('11_copy_mode'), 'まとめて入力(コピー)'),
    ('history', 4, PH4[2], F('20_history'), '履歴から入力'),
    ('repeat', 5, PH5[0], F('08_editor_repeat'), 'くり返し設定'),
    ('repeat_one', 5, PH5[1], F('09_repeat_save_ask'), 'この日だけ変更'),
    ('repeat_delete', 5, PH5[2], F('10_repeat_delete_ask'), 'くり返しの削除'),
    ('search', 6, PH6[0], F('15_search'), '検索'),
    ('day_memo', 6, PH6[1], F('14_month_day'), 'この日のメモ'),
    ('notify', 6, PH6[2], X('settings_notify'), 'お知らせ'),
    ('settings', 7, PH7[0], X('settings_top'), '設定(表示)'),
    ('device_import', 7, PH7[1], X('settings_import'), '端末のカレンダー'),
    ('backup', 7, PH7[2], X('settings_backup'), 'バックアップ'),
    ('theme', 8, PH8[0], X('settings_theme'), '着せ替えと9色'),
    ('stamp_collection', 8, PH8[1], P('02_month_sakura'), 'スタンプ(さくらの着せ替え)'),
    ('paywall', 8, PH8[2], F('13_paywall'), 'ひよりプラス'),
]
H = 1100
font = ImageFont.truetype(FB, 30)
small = ImageFont.truetype(FB, 22)
tiles = []
for name, ri, box, real, label in PAIRS:
    ref = Image.open(os.path.join(REF, f'ref{ri}.png')).convert('RGB').crop(box)
    ref = ref.resize((int(ref.width * H / ref.height), H), Image.LANCZOS)
    me = Image.open(real).convert('RGB')
    me = me.resize((int(me.width * H / me.height), H), Image.LANCZOS)
    W = ref.width + me.width + 60
    im = Image.new('RGB', (W, H + 90), (245, 238, 226))
    d = ImageDraw.Draw(im)
    d.text((20, 18), f'{label}', font=font, fill=(74, 59, 49))
    d.text((20, 58), f'左: 見本 hiyori_all_{ri}  /  右: 作り直した画面(430幅)', font=small, fill=(140, 123, 108))
    im.paste(ref, (20, 90))
    im.paste(me, (40 + ref.width, 90))
    out = os.path.join(DOCS, f'compare_redesign_{name}.png')
    im.save(out)
    tiles.append(im)
    print(out)

# 一覧(3列)
cols = 3
tw = 900
thumbs = [t.resize((tw, int(t.height * tw / t.width)), Image.LANCZOS) for t in tiles]
th = max(t.height for t in thumbs)
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (tw + 20) + 20, rows * (th + 20) + 20), (225, 214, 198))
for i, t in enumerate(thumbs):
    sheet.paste(t, (20 + (i % cols) * (tw + 20), 20 + (i // cols) * (th + 20)))
sheet.save(os.path.join(DOCS, 'compare_redesign_all.png'))
print('all', sheet.size)
