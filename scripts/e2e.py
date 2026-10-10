"""dist をブラウザで開いて、主な流れを押して回る確認(2026-10-10 の見た目の作り直しに合わせた版)。
python scripts/e2e.py            … 製品ビルド(dist を vite preview で配る)。375 幅と 430 幅の2回
python scripts/e2e.py --plus URL … 開発サーバー(開発用の疑似購入でプラスの機能を確かめる)
画面写真は scripts/e2e_out/<幅>/free|plus/ に置く。"""
import json
import os
import sys
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PLUS = '--plus' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
URL = args[0] if args else 'http://localhost:47391/'
DEMO = os.path.join(HERE, 'demo_backup.json')
SIZES = [(375, 812), (430, 932)]
errors, fails = [], []
OUT = ''


def check(cond, msg):
    print(('OK  ' if cond else 'NG  ') + msg)
    if not cond:
        fails.append(msg)


def shot(page, name, full=False):
    page.wait_for_timeout(350)
    if page.locator('.toast.show').count():
        page.wait_for_selector('.toast.show', state='detached', timeout=5000)
        page.wait_for_timeout(250)
    page.screenshot(path=os.path.join(OUT, name + '.png'), full_page=full)


def cell(page, d):
    return page.locator(f'.cell[data-date="{d}"]')


def back(page):
    page.click('button[aria-label="もどる"]')


def import_demo(page, replace=True):
    page.click('button[aria-label="その他"]')
    page.wait_for_selector('.settings-page')
    page.set_input_files('[data-testid="backup-file"]', DEMO)
    page.wait_for_selector('.ask')
    page.click('text=今の予定を消して置き換える' if replace else 'text=今の予定に足す')
    back(page)
    page.wait_for_selector('.month')


def no_hscroll(page, where):
    w = page.evaluate('[document.documentElement.scrollWidth, window.innerWidth]')
    check(w[0] <= w[1], f'{where}: 横にはみ出さない({w[0]}/{w[1]})')


def broken_images(page):
    return page.evaluate("[...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)")


def free_flow(page, W):
    # 1. はじめての案内(1枚目 → 使いかたガイド 3枚)
    check(page.locator('.welcome').count() == 1, 'はじめての案内が出る')
    check(page.locator('.wl-feats li').count() == 3, '案内に3つの約束(登録不要・端末だけ・広告なし)')
    page.wait_for_timeout(500)
    check(not broken_images(page), '案内の絵が全部読める')
    shot(page, '01_welcome')
    no_hscroll(page, '案内')
    page.click('.welcome >> text=はじめる')
    check('1' in page.locator('.g-step').inner_text() and 'スタンプを選ぶ' in page.locator('.guide-body h3').inner_text(), 'ガイド 1/3 スタンプを選ぶ')
    shot(page, '02_guide_1')
    page.click('text=つぎへ')
    check('日付をタップ' in page.locator('.guide-body h3').inner_text(), 'ガイド 2/3 日付をタップ')
    shot(page, '03_guide_2')
    page.click('text=つぎへ')
    check('メモを残す' in page.locator('.guide-body h3').inner_text(), 'ガイド 3/3 メモを残す')
    shot(page, '04_guide_3')
    page.click('text=カレンダーをひらく')
    page.wait_for_selector('.welcome', state='detached')

    # 2. 空の月(まだ予定がありません・はじめのスタンプ)
    check(page.locator('.empty-over').count() == 1 and 'まだ予定がありません' in page.locator('.empty-over').inner_text(), '空の月に「まだ予定がありません」')
    check(page.locator('.start-stamp').count() == 4, 'はじめのスタンプのおすすめ4つ')
    check(page.locator('.mt-month').inner_text() == '10月', '今月(10月)が出る')
    check('today' in cell(page, '2026-10-03').get_attribute('class'), '今日(10/3)に印')
    check(cell(page, '2026-10-12').locator('.hol').get_attribute('title') == 'スポーツの日' and cell(page, '2026-10-12').locator('.hol').inner_text() == 'スポーツ', '10/12 スポーツの日(マスでは「スポーツ」)')
    check(cell(page, '2026-10-03').locator('.rk').inner_text() == '赤口', '10/3 は赤口(国立天文台の朔から: 旧8/23)')
    check(cell(page, '2026-10-10').locator('.rk').inner_text() == '先勝', '10/10 は先勝(旧8/30)')
    shot(page, '05_month_empty')
    no_hscroll(page, '空の月')
    page.click('button[aria-label="前の月"]')
    check(cell(page, '2026-09-22').locator('.hol').inner_text() == '国民の休日', '9/22 国民の休日(敬老の日と秋分の日に挟まれた日)')
    check(cell(page, '2026-09-21').locator('.hol').inner_text() == '敬老の日', '9/21 敬老の日')
    page.click('button[aria-label="次の月"]')
    cell(page, '2026-10-03').click()
    check('旧暦 8月23日' in page.locator('.dp-sub').inner_text(), '日付を押すと下の欄に旧暦')

    # 3. おすすめのスタンプから貼る
    page.click('button[aria-label="前の日"]')
    page.click('button[aria-label="次の日"]')
    # (日付を押したので下の欄は「この日」になっている)空の状態の確認は済んだので、おすすめは別に押さない

    # 4. 予定を足す(時刻・色・スタンプ・お知らせ)
    cell(page, '2026-10-09').click()
    page.click('button[aria-label="予定追加"]')
    page.wait_for_selector('.editor')
    page.fill('.title-input', 'ヨガ教室')
    page.click('.stamp-btn')
    page.wait_for_selector('.stamp-sheet')
    shot(page, '06_stamp_picker')
    page.click('.stamp-sheet .tabs >> text=予定')
    page.click('.stamp-cell[aria-label="くすり"]')
    page.click('.ed-row:has-text("色")')
    page.click('button.color[aria-label="若葉"]')
    check('若葉' in page.locator('.ed-row:has-text("色") .color-name').inner_text(), '色の行に「若葉」')
    page.click('.ed-row:has-text("日時")')
    page.click('text=時刻を決める')
    page.fill('input[aria-label="始まり"]', '19:00')
    page.fill('input[aria-label="終わり"]', '20:00')
    page.locator('input[aria-label="お知らせする"]').check()
    page.select_option('#ed-notify', '30')
    page.fill('#ed-memo', 'マットを持っていく')
    check(page.locator('.counter').inner_text() == '9/5000', 'メモの字数')
    shot(page, '07_editor_new')
    page.click('.screen-foot >> text=保存する')
    page.wait_for_selector('.editor', state='detached')
    check(cell(page, '2026-10-09').locator('.hero-t').inner_text() == 'ヨガ教室', '10/9 にスタンプと題名が出る')
    check('19:00〜20:00' in page.locator('.dp-list').inner_text(), '下の欄に時刻')

    # 5. くり返しにする(毎週)
    page.click('.dp-item-main')
    page.click('.ed-row:has-text("くり返し")')
    page.click('.radio-item:has-text("毎週くり返す")')
    check('毎週金曜' in page.locator('.editor').inner_text(), 'くり返しの説明「毎週金曜」')
    shot(page, '08_editor_repeat')
    page.click('.screen-foot >> text=保存する')
    page.wait_for_selector('.editor', state='detached')
    for d in ['2026-10-16', '2026-10-23', '2026-10-30']:
        check(cell(page, d).locator('.hero-t', has_text='ヨガ教室').count() == 1, f'{d} にもくり返しが出る')

    # 6. この日だけ変える → この日だけ消す
    cell(page, '2026-10-23').click()
    page.click('.dp-item-main')
    page.fill('.title-input', 'ヨガ(休講の振替)')
    page.click('.screen-foot >> text=保存する')
    page.wait_for_selector('.ask')
    check(page.locator('.radio-card').count() == 2, 'くり返しの保存: この日だけ / すべて')
    shot(page, '09_repeat_save_ask')
    page.click('text=この内容で保存する')
    page.wait_for_selector('.editor', state='detached')
    check(cell(page, '2026-10-23').locator('.hero-t').inner_text() == 'ヨガ(休講の振替)', '10/23 だけ題名が変わる')
    check(cell(page, '2026-10-30').locator('.hero-t').inner_text() == 'ヨガ教室', '10/30 は元のまま')
    cell(page, '2026-10-16').click()
    page.click('.dp-item-main')
    page.click('button[aria-label="消す"]')
    check(page.locator('.radio-card').count() == 3, 'くり返しの削除: この日だけ / この日から後 / すべて')
    shot(page, '10_repeat_delete_ask')
    page.click('.ask >> button.btn.primary')
    page.wait_for_selector('.editor', state='detached')
    check(cell(page, '2026-10-16').locator('.hero-t', has_text='ヨガ').count() == 0, '10/16 だけ消えた')
    check(cell(page, '2026-10-30').locator('.hero-t', has_text='ヨガ教室').count() == 1, '10/30 は残る')

    # 7. コピー
    cell(page, '2026-10-09').click()
    page.click('.dp-copy')
    page.wait_for_selector('.paste-bar')
    cell(page, '2026-10-14').click()
    cell(page, '2026-10-15').click()
    check('2件' in page.locator('.paste-count').inner_text(), 'コピーを2日に貼った')
    shot(page, '11_copy_mode')
    page.click('.paste-bar >> text=おわる')
    check(cell(page, '2026-10-14').locator('.hero-t', has_text='ヨガ教室').count() == 1, '10/14 にコピーされた')
    check(cell(page, '2026-10-15').locator('.hero-t', has_text='ヨガ教室').count() == 1, '10/15 にコピーされた')

    # 8. スタンプをぺたぺた押す(上の「スタンプ入力」から)
    page.click('.stamp-pill')
    page.wait_for_selector('.stamp-sheet')
    page.click('.stamp-cell[aria-label="休み"]')
    for d in ['2026-10-04', '2026-10-11', '2026-10-18']:
        cell(page, d).click()
    check('3件' in page.locator('.paste-count').inner_text(), 'スタンプを3日に押した')
    page.click('.paste-bar >> text=おわる')
    check(cell(page, '2026-10-11').locator('.tstamp').count() == 1, '10/11 に休みスタンプ')
    # 下のメニューの「スタンプ」→ 最近使ったスタンプ・プラスのスタンプは課金画面へ
    page.click('button[aria-label="スタンプ"]')
    check(page.locator('.recent-cell').count() >= 2, '最近使ったスタンプが並ぶ')
    page.click('.tabs >> text=あそび')
    shot(page, '12_stamp_locked')
    page.click('.stamp-cell[aria-label="ライブ(ひよりプラス)"]')
    page.wait_for_selector('.paywall')
    check(page.locator('.pw-cta .btn').first.inner_text() == '購入の準備中です', 'キーが空なので「購入の準備中です」(落ちない)')
    check(page.locator('.pw-cta .btn').first.is_disabled(), '購入ボタンは押せない')
    check('¥500' in page.locator('.pp-price').inner_text().replace('\n', ''), 'プラスの値段 ¥500')
    shot(page, '13_paywall')
    shot(page, '13_paywall_full', full=True)
    page.click('.paywall >> text=以前に買った方はこちら(購入の復元)')
    page.wait_for_selector('.err')
    check('見つかりませんでした' in page.locator('.err').inner_text(), '復元は「見つかりませんでした」')
    back(page)

    # 9. この日のメモ
    cell(page, '2026-10-03').click()
    page.fill('.dp-memo', '牛乳を買う')
    page.click('.dp-main')
    check(cell(page, '2026-10-03').locator('.memo-dot').count() == 1, 'メモの印が出る')
    shot(page, '14_month_day')

    # 10. 検索(過去の予定も・絞り込み)
    page.click('button[aria-label="さがす"]')
    page.fill('.search-box input', 'よが')
    page.wait_for_selector('.hit')
    check(page.locator('.hit').count() >= 2, 'ひらがなで「ヨガ」が見つかる')
    page.fill('.search-box input', '牛乳')
    check(page.locator('.hit-title', has_text='メモ: 牛乳を買う').count() == 1, 'メモも見つかる')
    page.click('.filters >> text=予定')
    check(page.locator('.hit').count() == 0, '「予定」で絞るとメモは出ない')
    page.click('.filters >> text=すべて')
    page.locator('.search-box input').blur()
    shot(page, '15_search')
    page.click('.hit')
    page.wait_for_selector('.month')
    check('10月3日' in page.locator('.dp-main').inner_text(), '検索結果からその日へ')

    # 11. 設定: 着せ替え(プラス)・週の始まり・六曜を消す
    page.click('button[aria-label="設定"]')
    page.wait_for_timeout(500)
    check(not broken_images(page), '設定の絵が全部読める')
    shot(page, '16_settings')
    shot(page, '16_settings_full', full=True)
    no_hscroll(page, '設定')
    check(page.locator('.cn-input').first.input_value() == 'さくら', '色の名前は見本の9色(さくら から)')
    page.click('.theme[aria-label="さくら(ひよりプラス)"]')
    page.wait_for_selector('.paywall')
    back(page)
    page.wait_for_selector('.settings-page')
    page.click('.theme[aria-label="よる"]')
    page.click('.seg >> text=月曜')
    page.locator('.row-item', has_text='六曜').locator('input').uncheck()
    back(page)
    check(page.locator('.wk').first.inner_text() == '月', '月曜始まり')
    check(page.locator('.cell .rk').count() == 0, '六曜を消せる')
    shot(page, '17_dark_monday')
    page.click('button[aria-label="設定"]')
    page.click('.theme[aria-label="きなり"]')
    page.click('.seg >> text=日曜')
    page.locator('.row-item', has_text='六曜').locator('input').check()

    # 12. バックアップの書き出し → 中身を確かめる
    with page.expect_download() as dl:
        page.click('text=バックアップを書き出す')
    saved = json.load(open(dl.value.path(), encoding='utf-8'))
    check(dl.value.suggested_filename == 'hiyorigoyomi-backup-2026-10-03.json', f'ファイル名 {dl.value.suggested_filename}')
    titles = sorted(e['title'] for e in saved['events'])
    check(len(saved['events']) == 7 and saved['dayMemos'].get('2026-10-03') == '牛乳を買う', f'書き出した予定 {len(saved["events"])}件({titles})・メモ')
    back(page)

    # 13. 読み込み(置き換え) → 見本のデータ(古い色の名前は新しい名前に読み替わる)
    import_demo(page, replace=True)
    check(cell(page, '2026-10-07').locator('.chip-t, .hero-t', has_text='歯医者').count() == 1, '読み込んだ予定が出る')
    check(cell(page, '2026-10-09').locator('.hero-t', has_text='ヨガ教室').count() == 0, '置き換えたので前の予定は無い')
    cell(page, '2026-10-07').click()
    shot(page, '18_month_demo')
    no_hscroll(page, '月の表(見本のデータ)')
    page.click('.dp-item-main:has-text("歯医者")')
    page.click('.ed-row:has-text("色")')
    check(page.locator('.colors .color').count() == 9 and page.locator('.colors .color-lbl').first.inner_text() == 'さくら', '1.0 の色の名前(あか…)が見本の9色の名前に読み替わる')
    shot(page, '19_editor_edit')
    page.click('button[aria-label="やめる"]')

    # 14. 再読み込みしても残る(端末内保存)
    page.reload()
    page.wait_for_selector('.month')
    check(page.locator('.welcome').count() == 0, '2回目は案内が出ない')
    check(cell(page, '2026-10-07').locator('.chip-t, .hero-t', has_text='歯医者').count() == 1, '再読み込み後も残る')

    # 15. 履歴から入力(最近使った入力)
    cell(page, '2026-10-14').click()
    page.click('button[aria-label="予定追加"]')
    if page.locator('.hist-chip', has_text='歯医者').count() == 0:
        page.click('.card-head >> text=もっと見る')
    page.click('.hist-chip >> text=歯医者')
    check(page.locator('.title-input').input_value() == '歯医者', '履歴の「歯医者」で題名が入る')
    check('18:00' in page.locator('.ed-row:has-text("日時")').inner_text(), '履歴で時刻も入る(最後に入れた歯医者の時刻)')
    shot(page, '20_history')
    page.click('button[aria-label="やめる"]')

    # 16. 端末のカレンダー(ブラウザでは案内だけ)
    page.click('button[aria-label="その他"]')
    page.click('text=端末のカレンダーから予定を読み込む')
    page.wait_for_selector('.toast.show')
    check('スマホのアプリでだけ' in page.locator('.toast').inner_text(), 'ブラウザでは端末カレンダーの案内')
    check('iPhone' not in page.locator('.settings-page').inner_text(), 'iPhone 以外では「iPhone」と出さない')
    back(page)


def plus_flow(page, W):
    page.click('.welcome >> text=スキップ')
    import_demo(page)
    page.click('button[aria-label="設定"]')
    page.click('.row-item:has-text("開発用") button')  # 開発用: プラスを付ける → 再読み込み
    page.wait_for_selector('.month')
    page.click('button[aria-label="設定"]')
    check('利用中' in page.locator('.plus-card').inner_text(), 'プラス利用中と出る')
    page.click('.theme[aria-label="さくら"]')
    check(page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()") == '#fbf0f0', '着せ替え「さくら」')
    page.locator('.cn-input').nth(1).fill('しごと')  # 2番目 = もも(番号0)
    page.locator('.row-item', has_text='今日の予定のまとめ').locator('input').check()
    check(page.locator('input[type="time"]').count() == 1, 'まとめの時刻が出る')
    page.locator('.row-item', has_text='自動バックアップ').locator('input').check()
    shot(page, '01_settings_plus', full=True)
    back(page)
    page.click('.stamp-pill')
    page.click('.tabs >> text=あそび')
    check(page.locator('.stamp-cell.locked').count() == 0, 'プラスでは鍵が無い')
    page.click('.stamp-cell[aria-label="ライブ"]')
    cell(page, '2026-10-24').click()
    page.click('.paste-bar >> text=おわる')
    check(cell(page, '2026-10-24').locator('.estamp, .istamp').count() >= 1, 'プラスのスタンプを押せた')
    cell(page, '2026-10-07').click()
    page.click('.dp-item-main:has-text("歯医者")')
    page.click('.ed-row:has-text("色")')
    page.click('button.color[aria-label="しごと"]')
    check('しごと' in page.locator('.ed-row:has-text("色") .color-name').inner_text(), '色の名前が編集画面に出る')
    page.click('button[aria-label="やめる"]')
    shot(page, '02_month_sakura')


with sync_playwright() as p:
    b = p.chromium.launch()
    for (W, H) in SIZES:
        print(f'--- {W}x{H} ---')
        OUT = os.path.join(HERE, 'e2e_out', str(W), 'plus' if PLUS else 'free')
        os.makedirs(OUT, exist_ok=True)
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, locale='ja-JP', timezone_id='Asia/Tokyo', accept_downloads=True)
        page = ctx.new_page()
        # 今日を 2026-10-03 にする(set_fixed_time はタイマーまで止めるので install → resume)
        page.clock.install(time='2026-10-03T10:00:00+09:00')
        page.clock.resume()
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL)
        page.wait_for_selector('.month')
        (plus_flow if PLUS else free_flow)(page, W)
        ctx.close()
    print('console errors:', errors)
    check(not [e for e in errors if 'favicon' not in e], 'コンソールにエラーが無い')
    b.close()

print('\n結果:', 'ALL PASS' if not fails else f'{len(fails)} 件 NG')
sys.exit(1 if fails else 0)
