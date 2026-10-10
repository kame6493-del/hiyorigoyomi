import { useState } from 'react';
import { STAMPS, STAMP_CATS, stampById, type Stamp } from '../domain/catalog';
import { StampGlyph } from '../App';
import { BackIcon } from './icons';

const OFTEN = 'よく使う';

export function StampPicker(p: {
  plus: boolean;
  selected?: string;
  /** 最近使ったスタンプ(新しい順) */
  recent?: string[];
  /** よく使うスタンプ(多い順) */
  often?: string[];
  onClose: () => void;
  onPick: (id: string) => void;
  onClear?: () => void;
  onPaywall: () => void;
  hint?: string;
}) {
  const [cat, setCat] = useState(OFTEN);
  // よく使う: 使った物の多い順。足りない分は無料のスタンプで埋める
  const often = [...(p.often ?? []).map((id) => stampById(id)).filter((s): s is Stamp => !!s)];
  for (const s of STAMPS) {
    if (often.length >= 15) break;
    if (s.free && !often.includes(s)) often.push(s);
  }
  const list = cat === OFTEN ? often.slice(0, 15) : STAMPS.filter((s) => s.cat === cat);
  const locked = STAMPS.filter((s) => !s.free).length;
  const recent = (p.recent ?? []).slice(0, 5);
  const tile = (s: Stamp, small = false) => {
    const can = s.free || p.plus;
    return (
      <button
        key={s.id}
        className={`${small ? 'recent-cell' : 'stamp-cell'} ${p.selected === s.id ? 'on' : ''} ${can ? '' : 'locked'}`}
        onClick={() => (can ? p.onPick(s.id) : p.onPaywall())}
        aria-label={(small ? '最近使った ' : '') + s.label + (can ? '' : '(ひよりプラス)')}
      >
        <span className="st-face">
          <StampGlyph id={s.id} size={small ? 'lg' : 'xl'} />
        </span>
        {!small && <span className="stamp-label">{s.label}</span>}
        {!can && <span className="lock">プラス</span>}
      </button>
    );
  };
  return (
    <div className="screen stamp-sheet" role="dialog" aria-label="スタンプを選ぶ">
      <header className="screen-head">
        <button className="icon-btn" onClick={p.onClose} aria-label="閉じる">
          <BackIcon />
        </button>
        <h2>スタンプを選ぶ</h2>
        {p.onClear ? (
          <button className="link" onClick={p.onClear}>
            なし
          </button>
        ) : (
          <span />
        )}
      </header>
      {p.hint && <p className="hint center">{p.hint}</p>}
      <div className="tabs" role="tablist">
        {[OFTEN, ...STAMP_CATS].map((c) => (
          <button key={c} role="tab" aria-selected={c === cat} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>
      <div className="stamp-scroll">
        <div className="stamp-grid">{list.map((s) => tile(s))}</div>
        {recent.length > 0 && (
          <>
            <h3 className="sec">最近使ったスタンプ</h3>
            <div className="recent-row">{recent.map((id) => stampById(id)).filter((s): s is Stamp => !!s).map((s) => tile(s, true))}</div>
          </>
        )}
        {!p.plus && (
          <button className="plus-note" onClick={p.onPaywall}>
            ひよりプラスで、ほかに {locked} 種のスタンプが使えます
          </button>
        )}
      </div>
    </div>
  );
}
