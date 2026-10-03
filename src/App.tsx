import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { addDays, parse, today, type YMD } from './domain/date';
import { copyTo, makeEvent, normalize } from './domain/events';
import { stampById, themeById } from './domain/catalog';
import type { AppData, CalEvent } from './domain/types';
import { loadData, saveData } from './platform/storage';
import { loadBilling, type BillingState } from './platform/billing';
import { autoBackup, native, rescheduleNotifications } from './platform/native';
import { MonthView } from './ui/MonthView';
import { DayPanel } from './ui/DayPanel';
import { Editor, type EditTarget } from './ui/Editor';
import { SearchPage } from './ui/SearchPage';
import { SettingsPage } from './ui/SettingsPage';
import { Paywall } from './ui/Paywall';
import { StampPicker } from './ui/StampPicker';
import { Welcome } from './ui/Welcome';
import { Toast } from './ui/Toast';

export type Page = 'month' | 'search' | 'settings' | 'paywall';
/** 月の表で日付を押したときの動き: 普通 / スタンプを押していく / 予定を貼っていく */
export type PasteMode = null | { kind: 'stamp'; stampId: string; count: number } | { kind: 'copy'; ev: CalEvent; count: number };

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [billing, setBilling] = useState<BillingState>({ status: 'unavailable', reason: '確認中…', plus: false });
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [page, setPage] = useState<Page>('month');
  const [cursor, setCursor] = useState(() => {
    const t = parse(today());
    return { y: t.y, m: t.m };
  });
  const [selected, setSelected] = useState<YMD>(today());
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [paste, setPaste] = useState<PasteMode>(null);
  const [pickStampFor, setPickStampFor] = useState<null | 'paste'>(null);
  const [toast, setToast] = useState('');
  const [backTo, setBackTo] = useState<Page>('month');
  const plus = billing.plus;

  useEffect(() => {
    void loadData().then(setData);
    void loadBilling().then((b) => {
      setBilling(b);
      setBillingLoaded(true);
    });
  }, []);

  // 着せ替え
  const theme = themeById(data && (plus || themeById(data.settings.theme).free) ? data.settings.theme : 'kinari');
  useEffect(() => {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
    root.dataset.dark = theme.dark ? '1' : '0';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.vars['--bg']);
  }, [theme]);

  // 保存 → 通知の予約し直し(まとめて)
  const timer = useRef<number | undefined>(undefined);
  const update = useCallback(
    (fn: (d: AppData) => AppData) => {
      setData((cur) => {
        if (!cur) return cur;
        const next = fn(cur);
        void saveData(next);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => void rescheduleNotifications(next, plus), 800);
        return next;
      });
    },
    [plus],
  );

  // 起動時: 自動バックアップ(プラス・1日1回)と通知の予約し直し
  const booted = useRef(false);
  useEffect(() => {
    if (!data || booted.current || !billingLoaded) return;
    booted.current = true;
    void rescheduleNotifications(data, plus);
    if (plus && data.settings.autoBackup && data.settings.lastAutoBackup !== today()) {
      void autoBackup(data).then((name) => {
        if (name) update((d) => ({ ...d, settings: { ...d.settings, lastAutoBackup: today() } }));
      });
    }
  }, [data, billingLoaded, plus, update]);

  // Android の戻るボタン
  useEffect(() => {
    if (!native) return;
    const h = CapApp.addListener('backButton', () => {
      if (edit) setEdit(null);
      else if (pickStampFor) setPickStampFor(null);
      else if (paste) setPaste(null);
      else if (page !== 'month') setPage('month');
      else void CapApp.minimizeApp();
    });
    return () => void h.then((x) => x.remove());
  }, [edit, paste, page, pickStampFor]);

  const showToast = (s: string) => {
    setToast(s);
    window.setTimeout(() => setToast(''), 2200);
  };

  const openPaywall = (from: Page = page) => {
    setBackTo(from);
    setPage('paywall');
  };

  const goMonth = (d: YMD) => {
    const p = parse(d);
    setCursor({ y: p.y, m: p.m });
    setSelected(d);
    setPage('month');
  };

  const onDayTap = (d: YMD) => {
    if (!data) return;
    if (paste?.kind === 'stamp') {
      const st = stampById(paste.stampId);
      update((x) => ({ ...x, events: [...x.events, makeEvent({ date: d, title: '', stamp: paste.stampId, color: 5 })] }));
      setPaste({ ...paste, count: paste.count + 1 });
      showToast(`${d.slice(5).replace('-', '/')} に「${st?.label}」`);
      return;
    }
    if (paste?.kind === 'copy') {
      update((x) => ({ ...x, events: [...x.events, copyTo(paste.ev, d)] }));
      setPaste({ ...paste, count: paste.count + 1 });
      showToast(`${d.slice(5).replace('-', '/')} にコピーしました`);
      return;
    }
    setSelected(d);
  };

  const shiftMonth = (n: number) => {
    setCursor((c) => {
      const t = c.y * 12 + (c.m - 1) + n;
      return { y: Math.floor(t / 12), m: (t % 12) + 1 };
    });
  };

  const counts = useMemo(() => (data ? data.events.length : 0), [data]);

  if (!data) return <div className="boot" />;

  return (
    <div className={`app page-${page}`}>
      {page === 'month' && (
        <>
          <MonthView
            data={data}
            y={cursor.y}
            m={cursor.m}
            selected={selected}
            paste={paste}
            onDay={onDayTap}
            onShift={shiftMonth}
            onToday={() => goMonth(today())}
            onSearch={() => setPage('search')}
            onSettings={() => setPage('settings')}
          />
          {paste ? (
            <div className="paste-bar" role="status">
              <div className="paste-text">
                {paste.kind === 'stamp' ? (
                  <>
                    <StampGlyph id={paste.stampId} /> を押す日をタップ
                  </>
                ) : (
                  <>「{paste.ev.title || stampById(paste.ev.stamp)?.label}」を貼る日をタップ</>
                )}
                <span className="paste-count">{paste.count}件</span>
              </div>
              {paste.kind === 'stamp' && (
                <button className="btn small" onClick={() => setPickStampFor('paste')}>
                  ほかのスタンプ
                </button>
              )}
              <button className="btn small primary" onClick={() => setPaste(null)}>
                おわる
              </button>
            </div>
          ) : (
            <DayPanel
              data={data}
              day={selected}
              onEdit={(ev, occ) => setEdit({ ev, occ })}
              onAdd={() => setEdit({ date: selected })}
              onStampMode={() => setPickStampFor('paste')}
              onMemo={(text) =>
                update((d) => {
                  const dayMemos = { ...d.dayMemos };
                  if (text.trim()) dayMemos[selected] = text;
                  else delete dayMemos[selected];
                  return { ...d, dayMemos };
                })
              }
              onCopy={(ev) => {
                setPaste({ kind: 'copy', ev, count: 0 });
                showToast('コピーする日をタップしてください');
              }}
              onPrev={() => onDaySelectShift(-1)}
              onNext={() => onDaySelectShift(1)}
            />
          )}
        </>
      )}
      {page === 'search' && <SearchPage data={data} onClose={() => setPage('month')} onPick={(d) => goMonth(d)} />}
      {page === 'settings' && (
        <SettingsPage
          data={data}
          billing={billing}
          update={update}
          onClose={() => setPage('month')}
          onPaywall={() => openPaywall('settings')}
          onReplace={(d) => {
            const n = normalize(d);
            setData(n);
            void saveData(n);
            void rescheduleNotifications(n, plus);
          }}
          toast={showToast}
          count={counts}
        />
      )}
      {page === 'paywall' && (
        <Paywall
          billing={billing}
          setBilling={setBilling}
          onClose={() => setPage(backTo === 'paywall' ? 'month' : backTo)}
          onBought={() => {
            setBilling((b) => ({ ...b, plus: true }) as BillingState);
            showToast('ひよりプラスが使えるようになりました');
            setPage(backTo === 'paywall' ? 'month' : backTo);
          }}
        />
      )}
      {edit && (
        <Editor
          target={edit}
          data={data}
          plus={plus}
          onClose={() => setEdit(null)}
          update={update}
          onPaywall={() => {
            setEdit(null);
            openPaywall('month');
          }}
          onCopy={(ev) => {
            setEdit(null);
            setPaste({ kind: 'copy', ev, count: 0 });
            showToast('コピーする日をタップしてください');
          }}
          toast={showToast}
        />
      )}
      {pickStampFor && (
        <StampPicker
          plus={plus}
          selected={paste?.kind === 'stamp' ? paste.stampId : undefined}
          onClose={() => setPickStampFor(null)}
          onPick={(id) => {
            setPickStampFor(null);
            setPaste({ kind: 'stamp', stampId: id, count: paste?.kind === 'stamp' ? paste.count : 0 });
          }}
          onPaywall={() => {
            setPickStampFor(null);
            setPaste(null);
            openPaywall('month');
          }}
          hint="選んだあと、カレンダーの日付を押すとスタンプが貼られます"
        />
      )}
      {!data.settings.onboarded && page === 'month' && (
        <Welcome
          onDone={() => update((d) => ({ ...d, settings: { ...d.settings, onboarded: true } }))}
          onImport={() => {
            update((d) => ({ ...d, settings: { ...d.settings, onboarded: true } }));
            setPage('settings');
          }}
        />
      )}
      <Toast text={toast} />
    </div>
  );

  function onDaySelectShift(n: number) {
    const d = addDays(selected, n);
    const p = parse(d);
    if (p.m !== cursor.m || p.y !== cursor.y) setCursor({ y: p.y, m: p.m });
    setSelected(d);
  }
}

export function StampGlyph({ id, size }: { id?: string; size?: 'sm' | 'md' | 'lg' }) {
  const st = stampById(id);
  if (!st) return null;
  if (st.kind === 'text')
    return (
      <span className={`tstamp ${size ?? 'sm'}`} style={{ background: st.bg }} aria-label={st.label}>
        {st.glyph}
      </span>
    );
  return (
    <span className={`estamp ${size ?? 'sm'}`} aria-label={st.label}>
      {st.glyph}
    </span>
  );
}
