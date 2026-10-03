import { useState } from 'react';
import { STAMPS, THEMES } from '../domain/catalog';
import { purchase, restore, type BillingState } from '../platform/billing';
import { BILLING } from '../config';
import { StampGlyph } from '../App';

export function Paywall(p: { billing: BillingState; onClose: () => void; onBought: () => void; setBilling: (b: BillingState) => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const price = p.billing.status === 'ready' ? p.billing.price ?? BILLING.displayPrice : BILLING.displayPrice;
  const freeStamps = STAMPS.filter((s) => s.free).length;
  const preview = STAMPS.filter((s) => !s.free).filter((_, i) => i % 6 === 0).slice(0, 12);

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

  return (
    <div className="page paywall">
      <header className="page-head">
        <button className="link" onClick={p.onClose}>
          ‹ もどる
        </button>
        <h2>ひよりプラス</h2>
        <span />
      </header>
      <section className="pw-hero">
        <p className="pw-kicker">買い切り・月額なし・広告なし</p>
        <h2>
          あのころのスタンプ帳を、
          <br />
          もう一度。
        </h2>
        <div className="pw-stamps">
          {preview.map((s) => (
            <StampGlyph key={s.id} id={s.id} size="lg" />
          ))}
        </div>
      </section>
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
            <td>{THEMES.filter((t) => t.free).length}種</td>
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
          <button className="btn primary wide big" disabled={busy || p.billing.plus} onClick={buy}>
            {p.billing.plus ? '購入済みです' : busy ? '処理中…' : `${price} で買う(1回だけ)`}
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
