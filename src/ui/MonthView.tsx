import { useMemo, useRef } from 'react';
import { monthGrid, today, weekday, WEEK_JA, type YMD } from '../domain/date';
import { holidayName } from '../domain/holidays';
import { rokuyoCached } from '../domain/lunar';
import { COLORS, occurrencesInRange } from '../domain/events';
import { stampById } from '../domain/catalog';
import type { AppData } from '../domain/types';
import { StampGlyph, type PasteMode } from '../App';
import { Art, ChevronL, ChevronR, GearIcon, StampIcon } from './icons';

export function MonthView(p: {
  data: AppData;
  y: number;
  m: number;
  selected: YMD;
  paste: PasteMode;
  empty: boolean;
  onDay: (d: YMD) => void;
  onShift: (n: number) => void;
  onToday: () => void;
  onSettings: () => void;
  onStampMode: () => void;
}) {
  const ws = p.data.settings.weekStart;
  const grid = useMemo(() => monthGrid(p.y, p.m, ws), [p.y, p.m, ws]);
  const occ = useMemo(() => occurrencesInRange(p.data.events, grid[0], grid[41]), [p.data.events, grid]);
  const t = today();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const weeks = [0, 1, 2, 3, 4, 5].filter((w) => w < 5 || grid[w * 7].slice(5, 7) === String(p.m).padStart(2, '0'));

  return (
    <div
      className="month"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        const s = touch.current;
        touch.current = null;
        if (!s) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) p.onShift(dx < 0 ? 1 : -1);
      }}
    >
      <header className="app-head">
        <Art name="sprig_tl" className="head-sprig" />
        <Art name="logo" className="head-logo" alt="ひよりごよみ スタンプカレンダー" />
        <button className="icon-btn head-gear" aria-label="設定" onClick={p.onSettings}>
          <GearIcon size={25} />
        </button>
      </header>
      <div className="month-nav">
        <button className="round-btn" aria-label="前の月" onClick={() => p.onShift(-1)}>
          <ChevronL />
        </button>
        <h1 className="month-title" onClick={p.onToday} title="今日へ">
          <span className="mt-year">{p.y}年</span>
          <span className="mt-month">{p.m}月</span>
        </h1>
        <button className="round-btn" aria-label="次の月" onClick={() => p.onShift(1)}>
          <ChevronR />
        </button>
        <button className="stamp-pill" onClick={p.onStampMode}>
          <StampIcon size={18} />
          スタンプ入力
        </button>
      </div>
      <div className="week-row">
        {Array.from({ length: 7 }, (_, i) => (i + ws) % 7).map((wd) => (
          <div key={wd} className={`wk ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}`}>
            {WEEK_JA[wd]}
          </div>
        ))}
      </div>
      <div className="grid-wrap">
        <div className={`grid weeks-${weeks.length} ${p.paste ? 'pasting' : ''}`}>
          {weeks.flatMap((w) =>
            grid.slice(w * 7, w * 7 + 7).map((d) => {
              const wd = weekday(d);
              const hol = holidayName(d);
              const other = Number(d.slice(5, 7)) !== p.m;
              const list = occ.get(d) ?? [];
              // 主役: スタンプのある最初の予定(スタンプだけの物を先に)
              const hero = list.find((o) => o.ev.stamp && !o.ev.title && stampById(o.ev.stamp)) ?? list.find((o) => o.ev.stamp && stampById(o.ev.stamp));
              const rest = list.filter((o) => o !== hero);
              const restStamps = rest.filter((o) => !o.ev.title && o.ev.stamp);
              const lines = rest.filter((o) => o.ev.title || !o.ev.stamp);
              const maxLines = hero ? 1 : 3;
              const shownLines = lines.slice(0, maxLines);
              const more = lines.length - shownLines.length + (hero ? Math.max(0, restStamps.length - 1) : Math.max(0, restStamps.length - 3));
              const heroLabel = hero ? hero.ev.title || stampById(hero.ev.stamp)?.label : '';
              const cls = ['cell', other && 'other', d === t && 'today', d === p.selected && !p.paste && 'sel', hol && 'holiday', (wd === 0 || hol) && 'sun', wd === 6 && !hol && 'sat']
                .filter(Boolean)
                .join(' ');
              return (
                <button key={d} className={cls} onClick={() => p.onDay(d)} data-date={d}>
                  <div className="cell-top">
                    <span className="dnum">{Number(d.slice(8))}</span>
                    {p.data.settings.showRokuyo && <span className="rk">{rokuyoCached(d)}</span>}
                  </div>
                  {hol && (
                    <div className="hol" title={hol}>
                      {shortHoliday(hol)}
                    </div>
                  )}
                  {p.data.dayMemos[d] && <span className="memo-dot" aria-label="メモあり" />}
                  {hero && (
                    <div className="hero">
                      <span className="stamps">
                        <StampGlyph id={hero.ev.stamp} size="cell" />
                        {restStamps.slice(0, 1).map((o, i) => (
                          <StampGlyph key={o.ev.id + i} id={o.ev.stamp} size="sm" />
                        ))}
                      </span>
                      <span className="hero-t" style={hero.ev.title ? { ['--c' as string]: COLORS[hero.ev.color]?.hex } : undefined}>
                        {heroLabel}
                      </span>
                    </div>
                  )}
                  {!hero && restStamps.length > 0 && (
                    <div className="stamps">
                      {restStamps.slice(0, 3).map((o, i) => (
                        <StampGlyph key={o.ev.id + i} id={o.ev.stamp} size="md" />
                      ))}
                    </div>
                  )}
                  {shownLines.map((o, i) => {
                    const st = stampById(o.ev.stamp);
                    return (
                      <div key={o.ev.id + i} className="chip" style={{ ['--c' as string]: COLORS[o.ev.color]?.hex }}>
                        {st && <StampGlyph id={st.id} />}
                        <span className="chip-t">{o.ev.title}</span>
                      </div>
                    );
                  })}
                  {more > 0 && <div className="more">+{more}</div>}
                </button>
              );
            }),
          )}
        </div>
        {p.empty && !p.paste && (
          <div className="empty-over" aria-live="polite">
            <Art name="empty_scene" className="empty-art" />
            <b>まだ予定がありません</b>
            <p>
              スタンプを使って、
              <br />
              あなたの1ヶ月を彩りましょう
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** 月の表のマスは狭いので、長い祝日名は縮める(下の欄では正式名) */
const SHORT: Record<string, string> = {
  スポーツの日: 'スポーツ',
  勤労感謝の日: '勤労感謝',
  建国記念の日: '建国記念',
  天皇誕生日: '天皇誕生日',
  天皇の即位の日: '即位の日',
  即位礼正殿の儀の行われる日: '即位礼',
  即位礼正殿の儀: '即位礼',
};
export function shortHoliday(name: string): string {
  return SHORT[name] ?? name;
}
