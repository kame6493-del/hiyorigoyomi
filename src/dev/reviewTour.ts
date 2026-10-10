/**
 * App Review 用の画面録画で流す自動操作。VITE_REVIEW_TOUR=1 で作ったビルドだけで動く(製品版には入らない)。
 * 持ち主が iPhone を持っていないので、CI のシミュレーターでこれを流しながら録画する(.github/workflows/ios-review-video.yml)。
 * 起動(はじめての案内)→ 月の表 → 予定を足す → コピー → スタンプを貼る → 検索 → ひよりプラスの購入画面。押した所に丸を出す。
 * お知らせの許可を求めるのは「今日の予定のまとめ」(プラス)だけなので、この流れでは OS の確認は出ない。
 */
import { addDays, today } from '../domain/date';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function tapMark(el: Element) {
  const r = el.getBoundingClientRect();
  const dot = document.createElement('div');
  Object.assign(dot.style, {
    position: 'fixed', left: `${r.left + r.width / 2 - 22}px`, top: `${r.top + r.height / 2 - 22}px`,
    width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(210,64,42,0.35)',
    border: '2px solid rgba(210,64,42,0.8)', zIndex: '99999', pointerEvents: 'none', transition: 'opacity .6s, transform .6s',
  });
  document.body.appendChild(dot);
  requestAnimationFrame(() => { dot.style.transform = 'scale(1.4)'; dot.style.opacity = '0'; });
  setTimeout(() => dot.remove(), 700);
}

async function find(sel: string, pred: (b: HTMLElement) => boolean = () => true, wait = 6000): Promise<HTMLElement | null> {
  const end = Date.now() + wait;
  while (Date.now() < end) {
    const el = [...document.querySelectorAll<HTMLElement>(sel)].find((b) => b.getClientRects().length > 0 && !(b as HTMLButtonElement).disabled && pred(b));
    if (el) return el;
    await sleep(200);
  }
  return null;
}

async function tapEl(el: HTMLElement, pause = 1500) {
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  await sleep(500);
  tapMark(el);
  await sleep(250);
  el.click();
  await sleep(pause);
}

async function tap(sel: string, pred: (b: HTMLElement) => boolean = () => true, pause = 1500) {
  const el = await find(sel, pred);
  if (!el) return false;
  await tapEl(el, pause);
  return true;
}

const text = (s: string) => (b: HTMLElement) => b.innerText.replace(/\s+/g, '').includes(s.replace(/\s+/g, ''));
const label = (s: string) => (b: HTMLElement) => b.getAttribute('aria-label') === s;

/** React の入力欄に1文字ずつ打つ(value を直接入れると React が気づかないので、元の setter + input イベント) */
async function typeInto(el: HTMLInputElement | HTMLTextAreaElement, s: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
  tapMark(el);
  el.focus();
  for (let k = 1; k <= s.length; k++) {
    setter.call(el, s.slice(0, k));
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(160);
  }
  await sleep(500);
}

function setValue(el: HTMLInputElement | HTMLSelectElement, v: string) {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, v);
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
}

const cellSel = (d: string) => `.cell[data-date="${d}"]`;

export async function runReviewTour() {
  await sleep(3500); // はじめての案内を見せる
  await tap('button', text('はじめる'), 2500);
  // 使いかたガイド 3枚
  await tap('button', text('つぎへ'), 1800);
  await tap('button', text('つぎへ'), 1800);
  await tap('button', text('カレンダーをひらく'), 2200);

  const t = today();
  // 今日 → 来月 → 今月(祝日・六曜を見せる)
  await tap(cellSel(t), undefined, 1800);
  await tap('button', label('次の月'), 1800);
  await tap('button', label('前の月'), 1800);

  // 予定を足す(2日後・時刻・色・お知らせ)
  const d1 = addDays(t, 2);
  await tap(cellSel(d1), undefined, 1200);
  if (await tap('button', label('予定追加'), 1500)) {
    const title = (await find('.title-input')) as HTMLInputElement | null;
    if (title) await typeInto(title, '歯医者');
    if (await tap('.ed-row', text('色'), 800)) await tap('button', label('若葉'), 800);
    await tap('.ed-row', text('日時'), 800);
    if (await tap('button', text('時刻を決める'), 1000)) {
      const st = document.querySelector<HTMLInputElement>('input[aria-label="始まり"]');
      const en = document.querySelector<HTMLInputElement>('input[aria-label="終わり"]');
      if (st) { tapMark(st); setValue(st, '18:00'); await sleep(700); }
      if (en) { tapMark(en); setValue(en, '19:00'); await sleep(700); }
    }
    await tap('input', label('お知らせする'), 800);
    const nt = document.querySelector<HTMLSelectElement>('#ed-notify');
    if (nt && [...nt.options].some((o) => o.value === '60')) { nt.scrollIntoView({ block: 'center', behavior: 'smooth' }); await sleep(500); tapMark(nt); setValue(nt, '60'); await sleep(1200); }
    await tap('.screen-foot button', text('保存する'), 2200);
  }

  // ほかの日にコピー
  if (await tap('.dp-copy', undefined, 1500)) {
    await tap(cellSel(addDays(t, 9)), undefined, 900);
    await tap(cellSel(addDays(t, 16)), undefined, 1500);
    await tap('.paste-bar button', text('おわる'), 1800);
  }

  // スタンプをぺたぺた貼る
  if (await tap('button', label('スタンプ'), 1500)) {
    await tap('.stamp-cell', label('休み'), 1200);
    for (const k of [1, 4, 8]) await tap(cellSel(addDays(t, k)), undefined, 700);
    await sleep(800);
    await tap('.paste-bar button', text('おわる'), 1800);
  }

  // 検索(ひらがなでも見つかる)
  if (await tap('button', label('さがす'), 1500)) {
    const box = (await find('.search-box input')) as HTMLInputElement | null;
    if (box) await typeInto(box, '歯医者');
    await sleep(1500);
    if (!(await tap('.hit', undefined, 2000))) await tap('button', label('もどる'), 1500);
  }

  // 有料のスタンプ(あそび)→ ひよりプラスの購入画面
  if (await tap('button', label('スタンプ'), 1500)) {
    await tap('.tabs button, .tabs [role="tab"]', text('あそび'), 1500);
    if (!(await tap('.stamp-cell.locked', undefined, 3000))) await tap('.plus-note', undefined, 3000);
  } else {
    await tap('button', label('設定'), 1500);
    await tap('.plus-card', undefined, 3000);
  }
  await sleep(2000);
  const page = document.querySelector('.paywall');
  if (page) {
    for (let k = 1; k <= 30; k++) { window.scrollTo(0, (document.body.scrollHeight * k) / 30); page.scrollTop = (page.scrollHeight * k) / 30; await sleep(80); }
  }
  await sleep(2500);
  // 購入ボタン(シミュレーターでストアの商品が取れたときだけ押せる)
  await tap('.pw-cta button.primary', text('購入'), 10000);
  await sleep(6000);
}
