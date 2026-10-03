"""テストの照合用データを作る(アプリには入れない。テストだけが読む)。
- 内閣府「国民の祝日」CSV(1955〜2027) https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv
- 国立天文台 暦要項 2021〜2027 の 朔弦望(朔の時刻)と 二十四節気(中気の時刻)
出力: src/domain/fixtures/holidays_cao.json, src/domain/fixtures/naoj.json
"""
import json, re, os, sys
sys.stdout.reconfigure(encoding='utf-8')
W = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(W, '..', 'src', 'domain', 'fixtures')
os.makedirs(OUT, exist_ok=True)

rows = open(os.path.join(W, 'syukujitsu.csv'), 'rb').read().decode('cp932').splitlines()[1:]
hol = {}
for r in rows:
    if not r.strip():
        continue
    d, name = r.split(',')[:2]
    y, m, dd = map(int, d.split('/'))
    hol['%04d-%02d-%02d' % (y, m, dd)] = name.strip()
json.dump({'source': 'https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv', 'fetched': '2026-10-03', 'holidays': hol},
          open(os.path.join(OUT, 'holidays_cao.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print('holidays', len(hol), min(hol), max(hol))


def text(f):
    t = open(f, 'rb').read().decode('cp932', 'replace')
    t = re.sub(r'<[^>]+>', ' ', t)
    return re.sub(r'\s+', ' ', t.replace('&nbsp;', ' '))


CHUKI = {'雨水': 330, '春分': 0, '穀雨': 30, '小満': 60, '夏至': 90, '大暑': 120, '処暑': 150,
         '秋分': 180, '霜降': 210, '小雪': 240, '冬至': 270, '大寒': 300}
news, chuki = [], []
for y in range(2021, 2028):
    t3 = text(os.path.join(W, 'naoj', '%d_3.html' % y))
    for m, d, hh, mm in re.findall(r'朔 (\d+)月(\d+)日 (\d+)時(\d+)分', t3):
        news.append('%d-%02d-%02dT%02d:%02d' % (y, int(m), int(d), int(hh), int(mm)))
    t2 = text(os.path.join(W, 'naoj', '%d_2.html' % y))
    for name, deg, m, d, hh, mm in re.findall(r'(\S\S) (\d+)度 (\d+)月(\d+)日 (\d+)時(\d+)分', t2):
        if name in CHUKI and int(deg) == CHUKI[name]:
            chuki.append({'name': name, 'deg': int(deg), 'jst': '%d-%02d-%02dT%02d:%02d' % (y, int(m), int(d), int(hh), int(mm))})
print('new moons', len(news), news[:2], news[-1])
print('chuki', len(chuki), chuki[0], chuki[-1])
json.dump({'source': 'https://eco.mtk.nao.ac.jp/koyomi/yoko/ (国立天文台 暦要項 朔弦望・二十四節気 2021〜2027、時刻は中央標準時)',
           'fetched': '2026-10-03', 'newMoonsJst': news, 'chukiJst': chuki},
          open(os.path.join(OUT, 'naoj.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
