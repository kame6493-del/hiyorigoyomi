"""旧Yahoo!カレンダー利用者の「失った機能」と「移った先で困っていること」を数える。
入力: アプリ市場調査_2026-10-03/C_払う声 の生データ(読むだけ)
出力: work/voices_count.json と標準出力の表
"""
import json, re, sys, datetime
sys.stdout.reconfigure(encoding='utf-8')
BASE = r'C:\Users\yuichi1\Downloads\アプリ市場調査_2026-10-03\C_払う声'
OUT = r'C:\Users\yuichi1\Downloads\ひよりごよみ_2026-10-03\app\work\voices_count.json'

posts = json.load(open(BASE + r'\C_x_posts.json', encoding='utf-8'))['posts']
named = json.load(open(BASE + r'\C_appstore_named_reviews.json', encoding='utf-8'))
scan = json.load(open(BASE + r'\C_appstore_scan.json', encoding='utf-8'))

yahoo = re.compile(r'Yahoo!?\s?カレンダー|ヤフカレ|ヤフーカレンダー|やほーカレンダー|LINEカレンダー|LINE calendar|ぺたっと|ペタッと', re.I)

# 失った機能(旧Yahoo!カレンダーにあって LINEカレンダーで消えた/できなくなった)
LOST = {
    '予定の編集・削除ができない': r'編集|削除|修正|いじれ|変更できない|変更も消去',
    '予定スタンプ・アイコン・絵文字': r'スタンプ|絵文字|アイコン表示',
    '見やすさ(枠・色・月表示)': r'見にく|見づら|見辛|みにく|色が|色も|カラー|枠',
    '予定が消えた': r'消えた|白紙|消えて',
    'LINE連携・アカウントが必要': r'連携|ログイン|LINEアカ|LINEと繋|LINE垢',
    '予定のコピー・移動・履歴入力': r'コピー|履歴|移動|同じ予定',
    '天気予報': r'天気',
    '着せ替え・背景': r'着せ替え|背景|テーマ',
    '過去の予定の検索・参照': r'検索|昔の予定|過去の予定',
    '六曜': r'六曜|大安|仏滅',
    '占い': r'占い',
    '住所から地図': r'住所|map|地図',
    'ウィジェット': r'ウィジェット',
    '「戻して」「返して」': r'戻して|返して|返せ|もどして',
    '「お金払う・有料でいい」': r'お金払|有料でいい|払っていい|払うから|課金してでも',
}
# 移った先・ほかのカレンダーで困っていること
DEST = {
    '起動時の全画面広告・広告が操作の邪魔': r'広告',
    '予定・データが消えた': r'消え|白紙|更地|なくなった|復元',
    '同期・アカウント連携の失敗': r'同期|連携|ID|ログイン',
    '有料限定・課金圧': r'有料|課金|プレミアム|サブスク',
    '一括削除・繰り返しの編集ができない': r'一括|繰り返し|複数選択',
    'OS更新後の表示崩れ(文字が見えない)': r'iOS27|文字が黒|文字が見え|表示不具合|崩れ',
    '良い移行先が見つからない': r'見つからない|いいやつなかった|いいアプリない|良いのないか|おすすめのカレンダー|みんなの使ってる|いいの見つ',
}


def ts(p):
    return datetime.datetime.fromtimestamp(p['time']).strftime('%Y-%m-%d')


x_yahoo = [p for p in posts if yahoo.search(p['text'])]
# お知らせ・記事の投稿(公式/まとめ)は除く
noise = re.compile(r'復旧のお知らせ|新しい記事を公開|対処法 \|')
x_yahoo = [p for p in x_yahoo if not noise.search(p['text'])]

line_rev = []
for v in named.values():
    if v['name'].startswith('LINEカレンダー'):
        line_rev = [s for s in v['low_samples']]
        line_meta = {k: v[k] for k in ('cnt', 'avg50', 'low50', 'range50', 'kw_low50')}

# 移った先のレビュー: 他のカレンダーの★1〜2(名指し+スキャン)
dest_rev = []
for v in named.values():
    if 'カレンダー' in v['name'] and not v['name'].startswith('LINE'):
        for s in v['low_samples']:
            dest_rev.append({'app': v['name'][:14], **s})
apps = scan['apps']
for k, rv in scan['reviews'].items():
    nm = (apps.get(k) or {}).get('name', '')
    if not re.search(r'カレンダー|TimeTree|Lifebear', nm) or nm.startswith('LINE'):
        continue
    if re.search(r'シフト|TickTick|Todoist|Structured|Google', nm):
        continue
    items = rv.get('low_samples') if isinstance(rv, dict) else rv
    if not items:
        continue
    for s in items:
        r = s.get('r') or s.get('rating')
        if r and int(r) <= 2:
            dest_rev.append({'app': nm[:14], 'r': r, 't': s.get('t', ''), 'c': s.get('c', ''), 'd': s.get('d', '')})
# 重複除去
seen = set(); dd = []
for s in dest_rev:
    key = (s['app'][:6], s.get('t'), s.get('d'))
    if key in seen:
        continue
    seen.add(key); dd.append(s)
dest_rev = dd

x_dest = [p for p in posts if re.search(r'TimeTree|timetree|Timetree|カレンダーアプリ|スケジュールアプリ|シンプルカレンダー|ジョルテ', p['text'])
          and not yahoo.search(p['text'])]


def count(cats, texts):
    res = {}
    for name, pat in cats.items():
        rx = re.compile(pat, re.I)
        hit = [t for t in texts if rx.search(t['text'])]
        res[name] = {'n': len(hit), 'ex': [t.get('url', t.get('src', '')) for t in hit[:3]]}
    return res


xt = [{'text': p['text'], 'url': p['url'].split('?')[0]} for p in x_yahoo]
rt = [{'text': s['t'] + ' ' + s['c'], 'src': 'LINEカレンダー★%s %s' % (s['r'], s['d'])} for s in line_rev]
lost_x = count(LOST, xt)
lost_r = count(LOST, rt)
dt = [{'text': s['t'] + ' ' + s['c'], 'src': '%s★%s %s' % (s['app'], s['r'], s['d'])} for s in dest_rev]
dx = [{'text': p['text'], 'url': p['url'].split('?')[0]} for p in x_dest]
dest_r = count(DEST, dt)
dest_x = count(DEST, dx)

print('X(旧Yahoo!/LINEカレンダー言及)', len(xt), '件 / LINEカレンダー低評価レビュー', len(rt), '件', line_meta)
print('| 失った機能 | X | レビュー | 計 |')
rows = sorted(LOST, key=lambda k: -(lost_x[k]['n'] + lost_r[k]['n']))
for k in rows:
    print('| %s | %d | %d | %d |' % (k, lost_x[k]['n'], lost_r[k]['n'], lost_x[k]['n'] + lost_r[k]['n']))
print()
print('移った先: 他カレンダー低評価レビュー', len(dt), '件 / X(他カレンダー言及)', len(dx), '件')
print('| 困っていること | レビュー | X | 計 |')
for k in sorted(DEST, key=lambda k: -(dest_r[k]['n'] + dest_x[k]['n'])):
    print('| %s | %d | %d | %d |' % (k, dest_r[k]['n'], dest_x[k]['n'], dest_r[k]['n'] + dest_x[k]['n']))
from collections import Counter
print(Counter(s['app'] for s in dest_rev))
json.dump({'n_x_yahoo': len(xt), 'n_line_low_reviews': len(rt), 'line_meta': line_meta,
           'lost_x': lost_x, 'lost_reviews': lost_r, 'n_dest_reviews': len(dt), 'n_dest_x': len(dx),
           'dest_reviews': dest_r, 'dest_x': dest_x}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
