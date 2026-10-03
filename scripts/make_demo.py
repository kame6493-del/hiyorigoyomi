"""E2E と画面写真で読み込ませる見本のバックアップ(作り話の個人の予定。実在の人・店は出さない)。
python scripts/make_demo.py → scripts/demo_backup.json"""
import json, os, datetime

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'demo_backup.json')
T0 = int(datetime.datetime(2026, 9, 1).timestamp() * 1000)
events = []
n = 0


def ev(date, title='', stamp=None, color=5, start=None, end=None, days=1, repeat=None, memo='', notify=None):
    global n
    n += 1
    e = {'id': f'demo-{n}', 'date': date, 'days': days, 'allDay': start is None, 'title': title, 'memo': memo,
         'color': color, 'repeat': repeat or {'freq': 'none'}, 'exdates': [], 'notify': notify,
         'createdAt': T0 + n * 1000, 'updatedAt': T0 + n * 1000}
    if stamp:
        e['stamp'] = stamp
    if start:
        e['start'] = start
    if end:
        e['end'] = end
    events.append(e)


# シフト(文字スタンプだけ)
shift = {'早': 't-hayaban', '遅': 't-osoban', '休': 't-yasumi', '夜': 't-yakin'}
pattern = '早早遅休遅早休早遅遅休休早早遅休夜休早遅早休遅早休遅早遅休休'
for i, ch in enumerate(pattern):
    d = datetime.date(2026, 10, 1) + datetime.timedelta(days=i)
    ev(d.isoformat(), stamp=shift[ch])
for i, ch in enumerate('遅休早早遅休休早遅休早早遅休夜休早遅早休遅早休遅早遅休休早遅'):
    d = datetime.date(2026, 9, 1) + datetime.timedelta(days=i)
    ev(d.isoformat(), stamp=shift[ch])

ev('2026-10-25', '給料日', 't-kyuryo', 3, repeat={'freq': 'monthly', 'interval': 1})
ev('2026-10-05', '燃えるゴミ', None, 1, repeat={'freq': 'weekly', 'interval': 1}, notify=240)
ev('2026-10-08', '燃えるゴミ', None, 1, repeat={'freq': 'weekly', 'interval': 1}, notify=240)
ev('2026-10-07', '歯医者', 'e-dentist', 4, '10:30', '11:00', memo='左上の詰め物の続き。診察券を忘れずに', notify=60)
ev('2026-09-09', '歯医者', 'e-dentist', 4, '10:30', '11:00', memo='クリーニング')
ev('2026-08-05', '歯医者', 'e-dentist', 4, '18:00', '18:30', memo='初診')
ev('2026-10-12', '母の誕生日', 'e-birthday', 7, repeat={'freq': 'yearly', 'interval': 1})
ev('2026-10-16', '美容院', 'e-hair', 6, '13:00', '14:30', memo='カットとカラー')
ev('2026-10-17', '温泉旅行', 'e-travel', 0, days=2, memo='宿は駅から送迎あり。16時チェックイン')
ev('2026-10-21', '同窓会', 'e-drink', 1, '19:00', '21:30', memo='会費 5,000円')
ev('2026-10-03', '買い物', 'e-shopping', 2, '15:00')
ev('2026-10-03', '通院', 'e-hospital', 4, '09:30', memo='血液検査の結果を聞く')
ev('2026-10-28', 'ライブ', 'e-star', 6, '18:30', memo='整理番号 A-120')
ev('2026-10-30', '資格の勉強', 'e-study', 5, '20:00', '21:00', repeat={'freq': 'weekly', 'interval': 1})
ev('2026-11-03', 'ピクニック', 'e-meal', 3)

data = {'version': 1, 'events': events,
        'dayMemos': {'2026-10-03': '牛乳・卵・食パン\n郵便局に寄る', '2026-10-17': '着替え2日分・充電器'},
        'settings': {'weekStart': 0, 'showRokuyo': True, 'theme': 'kinari', 'colorNames': ['あか', 'だいだい', 'きいろ', 'みどり', 'あおみどり', 'あお', 'むらさき', 'ももいろ', 'はいいろ'],
                     'defaultNotify': None, 'digest': {'on': False, 'time': '07:30'}, 'autoBackup': False, 'onboarded': True}}
json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(events), 'events ->', OUT)
