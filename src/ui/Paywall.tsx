import { useState } from 'react';
import { STAMPS, THEMES } from '../domain/catalog';
import { purchase, restore, type BillingState } from '../platform/billing';
import { BILLING } from '../config';
import { Art, BackIcon, ChevronR } from './icons';

export function Paywall(p: { billing: BillingState; onClose: () => void; onBought: () => void; setBilling: (b: BillingState) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const price = p.billing.status === 'ready' ? p.billing.price ?? BILLING.displayPrice : BILLING.displayPrice;
  const freeStamps = STAMPS.filter((s) => s.free).length;
  const freeThemes = THEMES.filter((t) => t.free).length;
  const m = /^([^\d]*)([\d,.]+)(.*)$/.exec(price);

  const buy = async () => {
    setBusy(true);
    setMsg('');
    try {
      if (await purchase(p.billing)) p.onBought();
    } catch (e) {
      setMsg(`購入できませんでした(${(e as Error).message ?? e})`);
    } finally {
      setBusy(false);
    }
  };
  const doRestore = async () => {
    setBusy(true);
    setMsg('');
    try {
      if (await restore()) p.onBought();
      else setMsg('このストアのアカウントでの購入は見つかりませんでした');
    } catch (e) {
      setMsg(`復元できませんでした(${(e as Error).message ?? e})`);
    } finally {
      setBusy(false);
    }
  };

  const feats: [string, string, string][] = [
    ['ic_gift', `すべてのスタンプ ${STAMPS.length}種`, `いま使える${freeStamps}種に、季節・暮らし・あそびなどを足して`],
    ['ic_palette', `${THEMES.length}種類の着せ替え`, `いまの${freeThemes}種に、さくら・わかば・そら など`],
    ['ic_colors', '9色に名前を付ける', 'さくら・もも・みかん… を「仕事」「家族」に'],
    ['ic_bell', '今日の予定のまとめ通知', '予定のある日の朝に、その日の予定をお知らせ'],
    ['ic_export', '自動バックアップ', '1日1回、端末の「ファイル」に7日分を保存'],
    ['ic_ad', '広告なし', 'プラスでも、いまのままでも、広告は出ません'],
  ];

  return (
    <div className="page paywall">
      <header className="page-head ghost">
        <button className="icon-btn" onClick={p.onClose} aria-label="もどる">
          <BackIcon />
        </button>
        <span />
        <span />
      </header>
      <section className="pw-hero">
        <Art name="pay_left" className="pw-l" />
        <Art name="pay_right" className="pw-r" />
        <Art name="crown" className="pw-crown" />
        <h2>ひよりプラス</h2>
        <p className="pw-kicker">もっと、日々をかわいく豊かに</p>
        <p className="pw-sub">一度のご購入で、すべての機能が使えます</p>
        <Art name="pay_hills" className="pw-hills" />
      </section>
      <section className="pw-price card">
        <Art name="laurel_l" className="pw-laurel l" />
        <Art name="laurel_r" className="pw-laurel r" />
        <span className="pp-name">ひよりプラス</span>
        <span className="pp-price">
          {m ? (
            <>
              <small>{m[1]}</small>
              {m[2]}
              <small>{m[3]}</small>
            </>
          ) : (
            price
          )}
        </span>
        <span className="pp-badge">買い切り・月額なし</span>
      </section>
      <ul className="pw-feats">
        {feats.map(([ic, t, s]) => (
          <li key={t} className="card">
            <Art name={ic} className="pf-ic" />
            <span>
              <b>{t}</b>
              <small>{s}</small>
            </span>
          </li>
        ))}
      </ul>
      <table className="pw-table">
        <thead>
          <tr>
            <th></th>
            <th>無料</th>
            <th>プラス</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>予定の追加・編集・削除</td>
            <td>○</td>
            <td>○</td>
          </tr>
          <tr>
            <td>祝日・六曜・旧暦</td>
            <td>○</td>
            <td>○</td>
          </tr>
          <tr>
            <td>コピー・くり返し・検索・メモ・お知らせ</td>
            <td>○</td>
            <td>○</td>
          </tr>
          <tr>
            <td>手動バックアップ・端末カレンダー読み込み</td>
            <td>○</td>
            <td>○</td>
          </tr>
          <tr>
            <td>予定スタンプ</td>
            <td>{freeStamps}種</td>
            <td>{STAMPS.length}種</td>
          </tr>
          <tr>
            <td>着せ替え</td>
            <td>{freeThemes}種</td>
            <td>{THEMES.length}種</td>
          </tr>
          <tr>
            <td>色に名前を付ける</td>
            <td>—</td>
            <td>○</td>
          </tr>
          <tr>
            <td>今日の予定のまとめ通知</td>
            <td>—</td>
            <td>○</td>
          </tr>
          <tr>
            <td>自動バックアップ(毎日・7日分)</td>
            <td>—</td>
            <td>○</td>
          </tr>
          <tr>
            <td>広告</td>
            <td>なし</td>
            <td>なし</td>
          </tr>
        </tbody>
      </table>
      <div className="pw-cta">
        {p.billing.status === 'ready' ? (
          <button className="btn primary wide big arrow" disabled={busy || p.billing.plus} onClick={buy}>
            {p.billing.plus ? '購入済みです' : busy ? '処理中…' : `${price}で ひよりプラスを購入`}
            {!p.billing.plus && !busy && <ChevronR />}
          </button>
        ) : (
          <button className="btn wide big" disabled>
            {p.billing.reason}
          </button>
        )}
        <button className="link" disabled={busy} onClick={doRestore}>
          以前に買った方はこちら(購入の復元)
        </button>
        {msg && <p className="err">{msg}</p>}
      </div>
      <p className="muted small pad">一度買えば、同じストアのアカウントなら機種変更後も「購入の復元」で使えます。予定はこの端末の中だけに保存し、外へ送りません。</p>
    </div>
  );
}
