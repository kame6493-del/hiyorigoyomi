import { describe, expect, test } from 'vitest';
import {
  copyTo, detachOccurrence, emptyData, endBefore, history, makeEvent, merge, moveTo, normalize, normalizeText,
  occurrencesInRange, repeatLabel, search, skipOccurrence, startsInRange,
} from './events';
import { planNotifications, localMs } from './notify';
import { fromDevice } from './importDevice';
import { STAMPS, THEMES, stampById } from './catalog';
import { monthGrid, weekday } from './date';

const NOW = new Date(2026, 9, 3, 12, 0).getTime();

describe('繰り返し', () => {
  test('毎週: 範囲内の回だけ', () => {
    const ev = makeEvent({ date: '2026-10-05', title: 'ゴミ', repeat: { freq: 'weekly', interval: 1 } }, NOW);
    expect(startsInRange(ev, '2026-10-01', '2026-10-31')).toEqual(['2026-10-05', '2026-10-12', '2026-10-19', '2026-10-26']);
  });
  test('毎月31日は31日の無い月をとばす', () => {
    const ev = makeEvent({ date: '2026-01-31', title: '月末', repeat: { freq: 'monthly', interval: 1 } }, NOW);
    expect(startsInRange(ev, '2026-01-01', '2026-12-31')).toEqual(['2026-01-31', '2026-03-31', '2026-05-31', '2026-07-31', '2026-08-31', '2026-10-31', '2026-12-31']);
  });
  test('2/29 の毎年はうるう年だけ', () => {
    const ev = makeEvent({ date: '2024-02-29', title: '誕生日', repeat: { freq: 'yearly', interval: 1 } }, NOW);
    expect(startsInRange(ev, '2024-01-01', '2032-12-31')).toEqual(['2024-02-29', '2028-02-29', '2032-02-29']);
  });
  test('2週ごと・終わりの日・消した回', () => {
    let ev = makeEvent({ date: '2026-10-01', title: '通院', repeat: { freq: 'weekly', interval: 2, until: '2026-11-30' } }, NOW);
    ev = skipOccurrence(ev, '2026-10-29', NOW);
    expect(startsInRange(ev, '2026-09-01', '2027-01-31')).toEqual(['2026-10-01', '2026-10-15', '2026-11-12', '2026-11-26']);
  });
  test('何年も前に始まった毎日の予定でも速く正しい', () => {
    const ev = makeEvent({ date: '2000-01-01', title: '日記', repeat: { freq: 'daily', interval: 1 } }, NOW);
    const t = performance.now();
    expect(startsInRange(ev, '2026-10-01', '2026-10-03')).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
    expect(performance.now() - t).toBeLessThan(50);
  });
  test('複数日の予定は各日に出る(月またぎ)', () => {
    const ev = makeEvent({ date: '2026-10-30', days: 4, title: '旅行' }, NOW);
    const occ = occurrencesInRange([ev], '2026-11-01', '2026-11-30');
    expect([...occ.keys()]).toEqual(['2026-11-01', '2026-11-02']);
  });
  test('並びは 終日 → 時刻順', () => {
    const a = makeEvent({ date: '2026-10-03', title: '夜', start: '19:00' }, NOW);
    const b = makeEvent({ date: '2026-10-03', title: '朝', start: '08:30' }, NOW + 1);
    const c = makeEvent({ date: '2026-10-03', title: '終日' }, NOW + 2);
    expect(occurrencesInRange([a, b, c], '2026-10-03', '2026-10-03').get('2026-10-03')!.map((o) => o.ev.title)).toEqual(['終日', '朝', '夜']);
  });
  test('表記', () => {
    expect(repeatLabel({ freq: 'weekly', interval: 1 }, '2026-10-05')).toBe('毎週月曜');
    expect(repeatLabel({ freq: 'monthly', interval: 1, until: '2027-03-31' }, '2026-10-25')).toBe('毎月25日(2027/03/31まで)');
  });
});

describe('コピー・移動・この回だけ', () => {
  const ev = makeEvent({ date: '2026-10-05', title: 'ヨガ', start: '10:00', end: '11:00', stamp: 'b-yoga', color: 3, memo: '持ち物: マット', repeat: { freq: 'weekly', interval: 1 } }, NOW);
  test('コピーは1回きり・中身は同じ・id は別', () => {
    const c = copyTo(ev, '2026-10-20', NOW);
    expect(c).toMatchObject({ date: '2026-10-20', title: 'ヨガ', start: '10:00', end: '11:00', stamp: 'b-yoga', color: 3, memo: '持ち物: マット', repeat: { freq: 'none' } });
    expect(c.id).not.toBe(ev.id);
  });
  test('移動', () => {
    expect(moveTo(makeEvent({ date: '2026-10-05', title: 'x' }, NOW), '2026-10-06').date).toBe('2026-10-06');
  });
  test('この回だけ書き換え: 元から外し、別の1回きりを足す', () => {
    const [rest, one] = detachOccurrence(ev, '2026-10-12', { start: '13:00' }, NOW);
    expect(startsInRange(rest, '2026-10-01', '2026-10-31')).toEqual(['2026-10-05', '2026-10-19', '2026-10-26']);
    expect(one).toMatchObject({ date: '2026-10-12', start: '13:00', repeat: { freq: 'none' } });
  });
  test('この回以降を消す / 最初の回なら全部', () => {
    const cut = endBefore(ev, '2026-10-19', NOW)!;
    expect(startsInRange(cut, '2026-10-01', '2026-12-31')).toEqual(['2026-10-05', '2026-10-12']);
    expect(endBefore(ev, '2026-10-05', NOW)).toBeNull();
  });
});

describe('履歴から入力・検索', () => {
  const evs = [
    makeEvent({ date: '2025-04-10', title: '歯医者', start: '10:00', stamp: 'e-dentist' }, NOW - 5000),
    makeEvent({ date: '2026-03-02', title: '歯医者', start: '10:00', stamp: 'e-dentist', memo: '左下の奥歯' }, NOW - 1000),
    makeEvent({ date: '2026-09-01', title: '早番', stamp: 't-hayaban', start: '07:00', end: '16:00' }, NOW - 2000),
    makeEvent({ date: '2026-10-07', title: '美容院', memo: 'カット' }, NOW - 3000),
  ];
  test('同じ題名はまとまり、新しく使った順', () => {
    const h = history(evs);
    expect(h.map((x) => x.title)).toEqual(['歯医者', '早番', '美容院']);
    expect(h[0]).toMatchObject({ count: 2, start: '10:00', stamp: 'e-dentist' });
  });
  test('過去の予定も探せる(新しい順)・メモの中も・カタカナ/ひらがなを区別しない', () => {
    const data = { ...emptyData(), events: evs, dayMemos: { '2026-05-05': '歯医者の領収書を保管' } };
    expect(search(data, '歯医者', '2026-10-03').map((h) => h.date)).toEqual(['2026-05-05', '2026-03-02', '2025-04-10']);
    expect(search(data, 'おくば', '2026-10-03')).toHaveLength(0);
    expect(search(data, '奥歯', '2026-10-03')[0].date).toBe('2026-03-02');
    expect(search(data, 'かっと', '2026-10-03')[0].ev?.title).toBe('美容院');
    expect(normalizeText('ＡＢＣ カット')).toBe('abc かっと');
  });
  test('繰り返しは直近の過去の回と次の回が出る', () => {
    const ev = makeEvent({ date: '2026-01-05', title: 'リハビリ', repeat: { freq: 'weekly', interval: 1 } }, NOW);
    const data = { ...emptyData(), events: [ev] };
    expect(search(data, 'リハビリ', '2026-10-03').map((h) => h.date)).toEqual(['2026-10-05', '2026-09-28']);
  });
  test('スタンプの名前でも探せる', () => {
    const data = { ...emptyData(), events: [makeEvent({ date: '2026-08-01', title: '', stamp: 'p-live' }, NOW)] };
    expect(search(data, 'ライブ', '2026-10-03', (id) => stampById(id)!.label)).toHaveLength(1);
  });
});

describe('通知の予約', () => {
  test('時刻つき・終日・繰り返し・過ぎた物は出さない', () => {
    const data = {
      ...emptyData(),
      events: [
        makeEvent({ date: '2026-10-03', title: '過ぎた', start: '09:00', notify: 0 }, NOW),
        makeEvent({ date: '2026-10-04', title: '病院', start: '10:00', notify: 30, stamp: 'e-hospital' }, NOW),
        makeEvent({ date: '2026-10-05', title: '燃えるゴミ', notify: 240, repeat: { freq: 'weekly', interval: 1 } }, NOW),
        makeEvent({ date: '2026-10-06', title: '通知なし', start: '10:00' }, NOW),
      ],
    };
    const p = planNotifications(data, NOW, false, 14);
    expect(p[0]).toMatchObject({ at: localMs('2026-10-04', '09:30'), title: '🏥 病院', body: '10/4 10:00' });
    expect(p[1]).toMatchObject({ at: localMs('2026-10-04', '20:00'), title: '燃えるゴミ' });
    expect(p.filter((x) => x.title === '燃えるゴミ')).toHaveLength(2);
    expect(p.find((x) => x.title === '過ぎた')).toBeUndefined();
    expect(new Set(p.map((x) => x.id)).size).toBe(p.length);
  });
  test('今日の予定のまとめはプラスだけ・予定のある日だけ', () => {
    const data = { ...emptyData(), events: [makeEvent({ date: '2026-10-04', title: 'A', start: '10:00' }, NOW), makeEvent({ date: '2026-10-04', title: 'B' }, NOW)] };
    data.settings.digest = { on: true, time: '07:30' };
    expect(planNotifications(data, NOW, false)).toHaveLength(0);
    const p = planNotifications(data, NOW, true);
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ at: localMs('2026-10-04', '07:30'), title: '今日の予定 2件', body: 'B / 10:00 A' });
  });
  test('最大60件(iOS の上限64件より少なく)', () => {
    const data = { ...emptyData(), events: [makeEvent({ date: '2026-10-04', title: '毎日', start: '09:00', notify: 0, repeat: { freq: 'daily', interval: 1 } }, NOW), makeEvent({ date: '2026-10-04', title: '毎日2', start: '18:00', notify: 0, repeat: { freq: 'daily', interval: 1 } }, NOW)] };
    expect(planNotifications(data, NOW, false, 60)).toHaveLength(60);
  });
});

describe('バックアップの読み込み', () => {
  test('書き出し→読み込みで元に戻る', () => {
    const data = { ...emptyData(), events: [makeEvent({ date: '2026-10-04', title: '病院', start: '10:00', end: '11:00', notify: 30, repeat: { freq: 'monthly', interval: 1, until: '2027-01-31' }, exdates: ['2026-11-04'] }, NOW)], dayMemos: { '2026-10-04': '保険証' } };
    data.settings.colorNames[0] = 'しごと';
    const back = normalize(JSON.parse(JSON.stringify(data)));
    expect(back).toEqual(data);
  });
  test('壊れたファイル・他のアプリの JSON でも落ちない', () => {
    expect(normalize(null).events).toEqual([]);
    expect(normalize({ events: [{ title: 1 }, { date: 'x', title: 'a' }, { date: '2026-01-01', title: 'ok', start: '25:00', color: 99 }] }).events).toMatchObject([{ title: 'ok', allDay: true, start: undefined, color: 8 }]);
  });
  test('追加で読み込む: 同じ予定は新しい方、メモはつなぐ', () => {
    const e = makeEvent({ date: '2026-10-04', title: '古い' }, NOW);
    const a = { ...emptyData(), events: [e], dayMemos: { '2026-10-04': 'A' } };
    const b = { ...emptyData(), events: [{ ...e, title: '新しい', updatedAt: NOW + 10 }, makeEvent({ date: '2026-10-05', title: '別' }, NOW)], dayMemos: { '2026-10-04': 'B' } };
    const m = merge(a, b);
    expect(m.events.map((x) => x.title).sort()).toEqual(['別', '新しい']);
    expect(m.dayMemos['2026-10-04']).toBe('A\nB');
  });
});

describe('端末のカレンダーから読み込み', () => {
  test('時刻つき・終日(UTC 0時で来る Android)・二重読み込みしない', () => {
    const list = [
      { id: '1', title: '会議', startDate: new Date(2026, 9, 6, 14, 0).getTime(), endDate: new Date(2026, 9, 6, 15, 30).getTime(), isAllDay: false, location: '本社' },
      { id: '2', title: '連休', startDate: Date.UTC(2026, 9, 10), endDate: Date.UTC(2026, 9, 13), isAllDay: true },
    ];
    const first = fromDevice(list, [], NOW);
    expect(first[0]).toMatchObject({ date: '2026-10-06', start: '14:00', end: '15:30', allDay: false, memo: '本社', source: 'device' });
    expect(first[1]).toMatchObject({ date: '2026-10-10', days: 3, allDay: true });
    expect(fromDevice(list, first, NOW)).toHaveLength(0);
  });
});

describe('スタンプ・着せ替え・月の表', () => {
  test('スタンプの id は重ならず、無料は20種以上・全部で100種以上', () => {
    expect(new Set(STAMPS.map((s) => s.id)).size).toBe(STAMPS.length);
    expect(STAMPS.filter((s) => s.free).length).toBeGreaterThanOrEqual(20);
    expect(STAMPS.length).toBeGreaterThanOrEqual(100);
  });
  test('着せ替えは無料2つ+プラス6つ・同じ色の名前を持つ', () => {
    expect(THEMES.filter((t) => t.free).map((t) => t.id)).toEqual(['kinari', 'yoru']);
    const keys = Object.keys(THEMES[0].vars).sort();
    for (const t of THEMES) expect(Object.keys(t.vars).sort()).toEqual(keys);
  });
  test('月の表は6週42日・始まりの曜日', () => {
    const g = monthGrid(2026, 10, 0);
    expect(g).toHaveLength(42);
    expect(g[0]).toBe('2026-09-27');
    expect(weekday(g[0])).toBe(0);
    expect(monthGrid(2026, 10, 1)[0]).toBe('2026-09-28');
  });
});
