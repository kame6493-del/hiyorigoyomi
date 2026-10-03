import json, re, datetime, sys
sys.stdout.reconfigure(encoding='utf-8')
BASE = r'C:\Users\yuichi1\Downloads\アプリ市場調査_2026-10-03\C_払う声'
d = json.load(open(BASE + r'\C_x_posts.json', encoding='utf-8'))
cal = re.compile(r'LINEカレンダー|Yahoo!?カレンダー|ヤフカレ|ヤフーカレンダー|Yahooカレンダー|TimeTree|Timetree|timetree|カレンダーアプリ|スケジュールアプリ', re.I)
ps = [p for p in d['posts'] if cal.search(p['text'])]
out = []
for p in sorted(ps, key=lambda p: p['time']):
    out.append({'id': p['id'], 'date': datetime.datetime.fromtimestamp(p['time']).strftime('%Y-%m-%d'),
                'url': p['url'].split('?')[0], 'text': p['text']})
json.dump(out, open(r'C:\Users\yuichi1\Downloads\ひよりごよみ_2026-10-03\app\work\cal_posts.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out))
for o in out:
    print('-', o['date'], o['id'], o['text'].replace('\n', ' ')[:260])
r = json.load(open(BASE + r'\C_appstore_named_reviews.json', encoding='utf-8'))
for k, v in r.items():
    if 'カレンダー' in v['name']:
        print('##', v['name'], v['cnt'], v['avg50'], v['low50'])
        for s in v.get('low_samples', []):
            print('  *', s['r'], s['d'], (s['t'] + ' / ' + s['c']).replace('\n', ' ')[:260])
