import { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { COLORS, COLOR_ORDER, merge, normalize } from '../domain/events';
import { THEMES, artUrl } from '../domain/catalog';
import { NOTIFY_TIMED } from '../domain/notify';
import type { AppData } from '../domain/types';
import type { BillingState } from '../platform/billing';
import { isDevMock, setMockPlus } from '../platform/billing';
import { exportBackup, importFromDevice, rescheduleNotifications } from '../platform/native';
import { PRIVACY_TEXT } from './privacy';
import { Art, BackIcon, BellIcon, CalendarIcon, CheckIcon, ChevronR } from './icons';

/** 端末のカレンダーの言い方(Android の画面に iPhone の名前を出さない) */
function deviceCalendarNote(): string {
  const pf = Capacitor.getPlatform();
  if (pf === 'ios') return 'iPhone のカレンダー・Google カレンダーなど(前後1〜2年分・読むだけ)';
  return '端末のカレンダー・Google カレンダーなど(前後1〜2年分・読むだけ)';
}

export function SettingsPage(p: {
  data: AppData;
  billing: BillingState;
  update: (fn: (d: AppData) => AppData) => void;
  onClose: () => void;
  onPaywall: () => void;
  onReplace: (d: AppData) => void;
  toast: (s: string) => void;
  count: number;
}) {
  const s = p.data.settings;
  const plus = p.billing.plus;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const set = (patch: Partial<AppData['settings']>) => p.update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const needPlus = (fn: () => void) => () => (plus ? fn() : p.onPaywall());

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const json = JSON.parse(await f.text());
      const d = normalize(json);
      if (!Array.isArray(json?.events)) throw new Error('形式が違います');
      setPending(d);
    } catch {
      p.toast('このファイルは読み込めませんでした');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="page settings-page">
      <header className="page-head">
        <button className="icon-btn" onClick={p.onClose} aria-label="もどる">
          <BackIcon />
        </button>
        <h2>設定</h2>
        <span />
      </header>

      <button className={`plus-card ${plus ? 'owned' : ''}`} onClick={plus ? undefined : p.onPaywall}>
        <Art name="crown" className="pc-crown" />
        <span className="pc-text">
          <span className="pc-title">{plus ? 'ひよりプラス 利用中' : 'ひよりプラス'}</span>
          <span className="pc-sub">{plus ? 'ありがとうございます。すべてのスタンプと着せ替えが使えます' : 'スタンプ全種・着せ替え・色に名前・まとめ通知・自動バックアップ'}</span>
          {!plus && <span className="pc-price">買い切り {p.billing.status === 'ready' && p.billing.price ? p.billing.price : '¥500'}</span>}
        </span>
        {!plus && <ChevronR />}
        <Art name="pay_right" className="pc-deco" />
      </button>

      <h3 className="sec">カレンダーの表示</h3>
      <div className="group">
        <div className="row-item icon-row">
          <Art name="ic_holiday" className="row-ic" />
          <span>
            祝日・振替休日
            <small>日本の祝日を表示(端末内で計算しています)</small>
          </span>
          <span className="always">いつも表示</span>
        </div>
        <label className="row-item icon-row">
          <Art name="ic_rokuyo" className="row-ic" />
          <span>
            六曜
            <small>大安・仏滅などを月の表に出す</small>
          </span>
          <input type="checkbox" className="switch" checked={s.showRokuyo} onChange={(e) => set({ showRokuyo: e.target.checked })} />
        </label>
        <div className="row-item icon-row">
          <Art name="ic_moon" className="row-ic" />
          <span>
            旧暦
            <small>選んだ日の欄に旧暦の月日を表示</small>
          </span>
          <span className="always">いつも表示</span>
        </div>
        <div className="row-item icon-row">
          <span className="row-ic svg">
            <CalendarIcon />
          </span>
          <span>週の始まり</span>
          <div className="seg">
            <button className={s.weekStart === 0 ? 'on' : ''} onClick={() => set({ weekStart: 0 })}>
              日曜
            </button>
            <button className={s.weekStart === 1 ? 'on' : ''} onClick={() => set({ weekStart: 1 })}>
              月曜
            </button>
          </div>
        </div>
      </div>
      <div className="info-card">
        <Art name="sprig_leaf" className="info-sprig" />
        <p>
          祝日・振替休日・六曜・旧暦は、インターネットを使わず端末内で計算しています。
          <b>電波が無くても表示できます。</b>
        </p>
      </div>

      <h3 className="sec">
        着せ替え <span className="sec-note">{THEMES.length}種類</span>
      </h3>
      <div className="themes">
        {THEMES.map((t) => {
          const can = t.free || plus;
          const on = s.theme === t.id;
          return (
            <button key={t.id} className={`theme ${on ? 'on' : ''}`} onClick={() => (can ? set({ theme: t.id }) : p.onPaywall())} aria-label={`${t.name}${can ? '' : '(ひよりプラス)'}`}>
              <span className="theme-art" style={{ backgroundImage: `url(${artUrl(t.art)})` }}>
                <span className="theme-chip" style={{ background: t.vars['--bg'], borderColor: t.vars['--line'] }}>
                  <i style={{ background: t.vars['--accent'] }} />
                </span>
                {on && (
                  <span className="theme-check">
                    <CheckIcon size={13} />
                  </span>
                )}
              </span>
              <span className="theme-name">{t.name}</span>
              {!can && <span className="lock">プラス</span>}
            </button>
          );
        })}
      </div>

      <h3 className="sec">色の名前 {!plus && <span className="lock inline">プラス</span>}</h3>
      <div className="color-grid">
        {COLOR_ORDER.map((i) => (
          <label key={COLORS[i].key} className="cn-item">
            <span className="cn-ball" style={{ background: COLORS[i].hex }} />
            <input
              className="cn-input"
              value={s.colorNames[i]}
              disabled={!plus}
              maxLength={12}
              aria-label={`${COLORS[i].name}の名前`}
              onChange={(e) => {
                const names = [...s.colorNames];
                names[i] = e.target.value;
                set({ colorNames: names });
              }}
              onClick={!plus ? p.onPaywall : undefined}
            />
          </label>
        ))}
      </div>
      {!plus && (
        <button className="link pad" onClick={p.onPaywall}>
          色に「仕事」「家族」などの名前を付ける
        </button>
      )}

      <h3 className="sec">お知らせ</h3>
      <div className="group">
        <div className="row-item icon-row">
          <span className="row-ic svg">
            <BellIcon />
          </span>
          <span>新しい予定のお知らせ</span>
          <select value={s.defaultNotify === null ? '' : String(s.defaultNotify)} onChange={(e) => set({ defaultNotify: e.target.value === '' ? null : Number(e.target.value) })}>
            {NOTIFY_TIMED.map((o) => (
              <option key={String(o.v)} value={o.v === null ? '' : String(o.v)}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="row-item icon-row">
          <Art name="ic_bell" className="row-ic plain" />
          <span>
            今日の予定のまとめ {!plus && <span className="lock inline">プラス</span>}
            <small>予定のある日の朝に、その日の予定を一覧でお知らせ</small>
          </span>
          <input
            type="checkbox"
            className="switch"
            checked={plus && s.digest.on}
            onChange={needPlus(() => {
              const on = !s.digest.on;
              set({ digest: { ...s.digest, on } });
              if (on) void rescheduleNotifications({ ...p.data, settings: { ...s, digest: { ...s.digest, on } } }, true, true);
            })}
          />
        </div>
        {plus && s.digest.on && (
          <div className="row-item">
            <span>まとめの時刻</span>
            <input type="time" value={s.digest.time} onChange={(e) => e.target.value && set({ digest: { ...s.digest, time: e.target.value } })} />
          </div>
        )}
      </div>

      <h3 className="sec">バックアップ・引っ越し</h3>
      <div className="backup-hero">
        <Art name="book_scene" className="bh-art" />
        <p>
          大切な記録を
          <br />
          ずっと残せるように
          <br />
          バックアップしておきましょう。
        </p>
      </div>
      <div className="group">
        <button className="row-item icon-row" onClick={() => void exportBackup(p.data).then((n) => p.toast(`${n} を書き出しました`))}>
          <Art name="ic_export" className="row-ic" />
          <span>
            バックアップを書き出す
            <small>予定 {p.count}件・メモ・設定をファイルに書き出します</small>
          </span>
          <ChevronR size={18} />
        </button>
        <button className="row-item icon-row" onClick={() => fileRef.current?.click()}>
          <Art name="ic_import" className="row-ic" />
          <span>
            バックアップから読み込む
            <small>書き出したファイルから戻します</small>
          </span>
          <ChevronR size={18} />
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden data-testid="backup-file" onChange={(e) => void onFile(e.target.files?.[0])} />
        <div className="row-item icon-row">
          <Art name="ic_device" className="row-ic" />
          <span>
            自動バックアップ {!plus && <span className="lock inline">プラス</span>}
            <small>1日1回、端末の「ファイル」に7日分を残します{s.lastAutoBackup ? `(最後: ${s.lastAutoBackup})` : ''}</small>
          </span>
          <input type="checkbox" className="switch" checked={plus && s.autoBackup} onChange={needPlus(() => set({ autoBackup: !s.autoBackup }))} />
        </div>
      </div>

      <h3 className="sec">端末のカレンダー</h3>
      <div className="group">
        <Art name="import_scene" className="import-art" />
        <button
          className="row-item icon-row"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await importFromDevice(p.data.events);
            setBusy(false);
            if (!r.ok) return p.toast(r.reason);
            p.update((d) => ({ ...d, events: [...d.events, ...r.events] }));
            p.toast(r.events.length ? `${r.events.length}件の予定を読み込みました` : '新しく読み込む予定はありませんでした');
          }}
        >
          <span className="row-ic svg">
            <CalendarIcon />
          </span>
          <span>
            {busy ? '読み込み中…' : '端末のカレンダーから予定を読み込む'}
            <small>{deviceCalendarNote()}</small>
          </span>
          <ChevronR size={18} />
        </button>
      </div>

      <h3 className="sec">このアプリについて</h3>
      <div className="group">
        <button className="row-item" onClick={() => setShowPrivacy(!showPrivacy)}>
          <span>プライバシーポリシー</span>
          <ChevronR size={18} />
        </button>
        {showPrivacy && <div className="privacy">{PRIVACY_TEXT}</div>}
        <div className="row-item about">
          <small>
            アカウント登録はありません。予定はこの端末の中だけに保存し、外へ送りません。祝日は「国民の祝日に関する法律」に基づいて端末内で計算しています(2028年以降の春分・秋分の日は国立天文台の予測による見込みです)。六曜は旧暦を天文計算して求めています。
          </small>
        </div>
        {isDevMock && (
          <div className="row-item">
            <span>開発用: プラスを切り替える</span>
            <button
              className="btn small"
              onClick={() => {
                setMockPlus(!plus);
                location.reload();
              }}
            >
              {plus ? '外す' : '付ける'}
            </button>
          </div>
        )}
      </div>
      <div className="foot-deco">
        <Art name="flowers_bottom" className="fd-l" />
        <Art name="sparrow" className="fd-r" />
      </div>

      {pending && (
        <div className="ask-back" onClick={() => setPending(null)}>
          <div className="ask" onClick={(e) => e.stopPropagation()}>
            <p className="ask-title">バックアップの読み込み</p>
            <p>
              バックアップに予定が {pending.events.length}件、メモが {Object.keys(pending.dayMemos).length}件あります。どう読み込みますか?
            </p>
            <button
              className="btn wide primary"
              onClick={() => {
                p.onReplace(merge(p.data, pending));
                setPending(null);
                p.toast('今の予定に足しました');
              }}
            >
              今の予定に足す
            </button>
            <button
              className="btn wide danger"
              onClick={() => {
                p.onReplace({ ...pending, settings: { ...pending.settings, onboarded: true } });
                setPending(null);
                p.toast('バックアップの中身に置き換えました');
              }}
            >
              今の予定を消して置き換える
            </button>
            <button className="btn wide ghost-fill" onClick={() => setPending(null)}>
              やめる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
