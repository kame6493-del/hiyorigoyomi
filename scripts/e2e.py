"""dist をブラウザで開いて、主な流れを押して回る確認。
python scripts/e2e.py            … 製品ビルド(dist を vite preview で配る)。課金キーが空なので「購入の準備中です」
python scripts/e2e.py --plus URL … 開発サーバー(開発用の疑似購入でプラスの機能を確かめる)
画面写真は scripts/e2e_out/ に置く。"""
import json
import os
import sys
import time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PLUS = '--plus' in sys.argv
args = [a for a in sys.argv[1:] if not a.startswith('--')]
URL = args[0] if args else 'http://localhost:47391/'
OUT = os.path.join(HERE, 'e2e_out', 'plus' if PLUS else 'free')
os.makedirs(OUT, exist_ok=True)
DEMO = os.path.join(HERE, 'demo_backup.json')
errors, fails = [], []


def check(cond, msg):
    print(('OK  ' if cond else 'NG  ') + msg)
    if not cond:
        fails.append(msg)


def shot(page, name):
    page.screenshot(path=os.path.join(OUT, name + '.png'))


def cell(page, d):
    return page.locator(f'.cell[data-date="{d}"]')


def wait_toast_gone(page):
    page.wait_for_timeout(2400)


def import_demo(page, replace=True):
    page.click('button[aria-label="設定"]')
    page.wait_for_selector('.settings-page')
    page.set_input_files('[data-testid="backup-file"]', DEMO)
    page.wait_for_selector('.ask')
    page.click('text=今の予定を消して置き換える' if replace else 'text=今の予定に足す')
    page.click('text=‹ もどる')
    page.wait_for_selector('.month')


with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='ja-JP', timezone_id='Asia/Tokyo', accept_downloads=True)
    page = ctx.new_page()
    # 今日を 2026-10-03 にする(set_fixed_time はタイマーまで止めるので install → resume)
    page.clock.install(time='2026-10-03T10:00:00+09:00')
    page.clock.resume()
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(URL)
    page.wait_for_selector('.month')

    if not PLUS:
        # 1. はじめて開いた所
        check(page.locator('.welcome').count() == 1, 'はじめての案内が出る')
        shot(page, '01_welcome')
        page.click('text=はじめる')
        page.wait_for_selector('.welcome', state='detached')
        check(page.locator('.mt-month').inner_text() == '10月', '今月(10月)が出る')
        check(cell(page, '2026-10-03').get_attribute('class').find('today') >= 0, '今日(10/3)に印')
        check(cell(page, '2026-10-12').locator('.hol').get_attribute('title') == 'スポーツの日' and cell(page, '2026-10-12').locator('.hol').inner_text() == 'スポーツ', '10/12 スポーツの日(マスでは「スポーツ」)')
        check(cell(page, '2026-10-03').locator('.rk').inner_text() == '赤口', '10/3 は赤口(国立天文台の朔から: 旧8/23)')
        check(cell(page, '2026-10-10').locator('.rk').inner_text() == '先勝', '10/10 は先勝(旧8/30)')
        check('旧暦 8月23日' in page.locator('.dp-sub').inner_text(), '下の欄に旧暦')
        shot(page, '02_month_empty')
        page.click('button[aria-label="前の月"]')
        check(cell(page, '2026-09-22').locator('.hol').inner_text() == '国民の休日', '9/22 国民の休日(敬老の日と秋分の日に挟まれた日)')
        check(cell(page, '2026-09-21').locator('.hol').inner_text() == '敬老の日', '9/21 敬老の日')
        page.click('button[aria-label="次の月"]')

        # 2. 予定を足す(時刻・色・スタンプ・お知らせ)
        cell(page, '2026-10-09').click()
        page.click('text=＋ 予定を追加')
        page.wait_for_selector('.editor')
        page.fill('.title-input', 'ヨガ教室')
        page.click('.stamp-btn')
        page.click('.stamp-sheet .tabs >> text=予定')
        page.click('.stamp-cell[aria-label="くすり"]')
        page.click('button[aria-label="みどり"]')
        page.click('text=時刻を決める')
        page.fill('input[aria-label="始まり"]', '19:00')
        page.fill('input[aria-label="終わり"]', '20:00')
        page.select_option('#ed-notify', '30')
        page.fill('#ed-memo', 'マットを持っていく')
        shot(page, '03_editor')
        page.click('.sheet-head >> text=保存')
        page.wait_for_selector('.editor', state='detached')
        check(cell(page, '2026-10-09').locator('.chip-t').inner_text() == 'ヨガ教室', '10/9 に予定が出る')
        check('19:00〜20:00' in page.locator('.dp-list').inner_text(), '下の欄に時刻')

        # 3. くり返しにする(毎週)
        page.click('.dp-item-main')
        page.select_option('#ed-repeat', 'weekly')
        check('毎週金曜' in page.locator('.editor').inner_text(), 'くり返しの説明「毎週金曜」')
        page.click('.sheet-head >> text=保存')
        page.wait_for_selector('.editor', state='detached')
        for d in ['2026-10-16', '2026-10-23', '2026-10-30']:
            check(cell(page, d).locator('.chip-t', has_text='ヨガ教室').count() == 1, f'{d} にもくり返しが出る')

        # 4. この日だけ消す
        cell(page, '2026-10-16').click()
        page.click('.dp-item-main')
        page.click('.editor >> text=消す')
        shot(page, '04_repeat_delete_ask')
        page.click('text=この日だけ消す')
        page.wait_for_selector('.editor', state='detached')
        check(cell(page, '2026-10-16').locator('.chip-t', has_text='ヨガ教室').count() == 0, '10/16 だけ消えた')
        check(cell(page, '2026-10-23').locator('.chip-t', has_text='ヨガ教室').count() == 1, '10/23 は残る')

        # 5. コピー(旧Yahoo!カレンダーで消えた機能)
        cell(page, '2026-10-09').click()
        page.click('.dp-copy')
        page.wait_for_selector('.paste-bar')
        cell(page, '2026-10-14').click()
        cell(page, '2026-10-15').click()
        check('2件' in page.locator('.paste-count').inner_text(), 'コピーを2日に貼った')
        shot(page, '05_copy_mode')
        page.click('.paste-bar >> text=おわる')
        check(cell(page, '2026-10-14').locator('.chip-t', has_text='ヨガ教室').count() == 1, '10/14 にコピーされた')
        check(cell(page, '2026-10-15').locator('.chip-t', has_text='ヨガ教室').count() == 1, '10/15 にコピーされた')

        # 6. スタンプをぺたぺた押す
        page.click('text=スタンプを押す')
        page.wait_for_selector('.stamp-sheet')
        page.click('.stamp-cell[aria-label="休み"]')
        for d in ['2026-10-04', '2026-10-11', '2026-10-18']:
            cell(page, d).click()
        check('3件' in page.locator('.paste-count').inner_text(), 'スタンプを3日に押した')
        page.click('.paste-bar >> text=おわる')
        check(cell(page, '2026-10-11').locator('.stamps .tstamp').count() == 1, '10/11 に休みスタンプ')
        # プラスのスタンプは課金画面へ
        page.click('text=スタンプを押す')
        page.click('.tabs >> text=あそび')
        shot(page, '06_stamp_locked')
        page.click('.stamp-cell[aria-label="ライブ(ひよりプラス)"]')
        page.wait_for_selector('.paywall')
        check(page.locator('.pw-cta .btn').first.inner_text() == '購入の準備中です', 'キーが空なので「購入の準備中です」(落ちない)')
        check(page.locator('.pw-cta .btn').first.is_disabled(), '購入ボタンは押せない')
        shot(page, '07_paywall')
        page.click('.paywall >> text=以前に買った方はこちら(購入の復元)')
        page.wait_for_selector('.err')
        check('見つかりませんでした' in page.locator('.err').inner_text(), '復元は「見つかりませんでした」')
        page.click('text=‹ もどる')

        # 7. この日のメモ
        cell(page, '2026-10-03').click()
        page.fill('.dp-memo', '牛乳を買う')
        page.click('.dp-main')
        check(cell(page, '2026-10-03').locator('.memo-dot').count() == 1, 'メモの印が出る')

        # 8. 検索(過去の予定も)
        page.click('button[aria-label="さがす"]')
        page.fill('.search-box input', 'よが')
        page.wait_for_selector('.hit')
        check(page.locator('.hit').count() >= 2, 'ひらがなで「ヨガ」が見つかる')
        page.fill('.search-box input', '牛乳')
        check(page.locator('.hit-title', has_text='メモ: 牛乳を買う').count() == 1, 'メモも見つかる')
        page.click('.hit')
        page.wait_for_selector('.month')
        check('10月3日' in page.locator('.dp-main').inner_text(), '検索結果からその日へ')

        # 9. 設定: 着せ替え(プラス)・週の始まり・六曜を消す
        page.click('button[aria-label="設定"]')
        shot(page, '08_settings')
        page.click('.theme[aria-label="さくら(ひよりプラス)"]')
        page.wait_for_selector('.paywall')
        page.click('text=‹ もどる')
        page.wait_for_selector('.settings-page')
        page.click('.theme[aria-label="よる"]')
        page.click('.seg >> text=月曜')
        page.locator('.row-item', has_text='六曜').locator('input').uncheck()
        page.click('text=‹ もどる')
        check(page.locator('.wk').first.inner_text() == '月', '月曜始まり')
        check(page.locator('.cell .rk').count() == 0, '六曜を消せる')
        shot(page, '09_dark_monday')
        page.click('button[aria-label="設定"]')
        page.click('.theme[aria-label="きなり"]')
        page.click('.seg >> text=日曜')
        page.locator('.row-item', has_text='六曜').locator('input').check()

        # 10. バックアップの書き出し → 中身を確かめる
        with page.expect_download() as dl:
            page.click('text=バックアップを書き出す')
        path = dl.value.path()
        saved = json.load(open(path, encoding='utf-8'))
        check(dl.value.suggested_filename == 'hiyorigoyomi-backup-2026-10-03.json', f'ファイル名 {dl.value.suggested_filename}')
        check(len(saved['events']) == 6 and saved['dayMemos'].get('2026-10-03') == '牛乳を買う', f'書き出した予定 {len(saved["events"])}件・メモ')
        page.click('text=‹ もどる')

        # 11. 読み込み(置き換え) → 見本のデータ
        import_demo(page, replace=True)
        check(cell(page, '2026-10-07').locator('.chip-t', has_text='歯医者').count() == 1, '読み込んだ予定が出る')
        check(cell(page, '2026-10-09').locator('.chip-t', has_text='ヨガ教室').count() == 0, '置き換えたので前の予定は無い')
        cell(page, '2026-10-03').click()
        shot(page, '10_month_demo')

        # 12. 再読み込みしても残る(端末内保存)
        page.reload()
        page.wait_for_selector('.month')
        check(page.locator('.welcome').count() == 0, '2回目は案内が出ない')
        check(cell(page, '2026-10-07').locator('.chip-t', has_text='歯医者').count() == 1, '再読み込み後も残る')

        # 13. 履歴から入力
        cell(page, '2026-11-04').click() if cell(page, '2026-11-04').count() else None
        page.click('text=＋ 予定を追加')
        page.click('.hist-chip >> text=歯医者')
        check(page.locator('.title-input').input_value() == '歯医者', '履歴の「歯医者」で題名が入る')
        check(page.locator('input[aria-label="始まり"]').input_value() == '18:00', '履歴で時刻も入る(最後に入れた歯医者の時刻)')
        shot(page, '11_history')
        page.click('.sheet-head >> text=やめる')

        # 14. 端末のカレンダー(ブラウザでは案内だけ)
        page.click('button[aria-label="設定"]')
        page.click('text=端末のカレンダーから予定を読み込む')
        page.wait_for_selector('.toast.show')
        check('スマホのアプリでだけ' in page.locator('.toast').inner_text(), 'ブラウザでは端末カレンダーの案内')
        page.click('text=‹ もどる')
    else:
        # プラス(開発サーバーの疑似購入)
        page.click('text=はじめる')
        import_demo(page)
        page.click('button[aria-label="設定"]')
        page.click('.row-item:has-text("開発用") button')  # 開発用: プラスを付ける → 再読み込み
        page.wait_for_selector('.month')
        page.click('button[aria-label="設定"]')
        check('利用中' in page.locator('.plus-card').inner_text(), 'プラス利用中と出る')
        page.click('.theme[aria-label="さくら"]')
        check(page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()") == '#fff6f8', '着せ替え「さくら」')
        page.locator('.cn-input').first.fill('しごと')
        page.locator('.row-item', has_text='今日の予定のまとめ').locator('input').check()
        check(page.locator('input[type="time"]').count() == 1, 'まとめの時刻が出る')
        page.locator('.row-item', has_text='自動バックアップ').locator('input').check()
        shot(page, '01_settings_plus')
        page.click('text=‹ もどる')
        page.click('text=スタンプを押す')
        page.click('.tabs >> text=あそび')
        check(page.locator('.stamp-cell.locked').count() == 0, 'プラスでは鍵が無い')
        page.click('.stamp-cell[aria-label="ライブ"]')
        cell(page, '2026-10-24').click()
        page.click('.paste-bar >> text=おわる')
        check(cell(page, '2026-10-24').locator('.estamp').count() >= 1, 'プラスのスタンプを押せた')
        cell(page, '2026-10-07').click()
        page.click('.dp-item-main >> nth=-1')
        page.click('button[aria-label="しごと"]')
        check('しごと' in page.locator('.color-name').inner_text(), '色の名前が編集画面に出る')
        page.click('.sheet-head >> text=やめる')
        shot(page, '02_month_sakura')
        page.click('button[aria-label="設定"]')
        page.click('.plus-card') if False else None
        page.click('text=‹ もどる')

    print('console errors:', errors)
    check(not [e for e in errors if 'favicon' not in e], 'コンソールにエラーが無い')
    b.close()

print('\n結果:', 'ALL PASS' if not fails else f'{len(fails)} 件 NG')
sys.exit(1 if fails else 0)
