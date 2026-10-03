import { Capacitor } from '@capacitor/core';
import { Purchases, type PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { APP, BILLING } from '../config';

/**
 * 買い切り「ひよりプラス」(非消耗型1つ)。キーが空のあいだは「購入の準備中です」と出し、課金は一切走らない。
 */
export type BillingState =
  | { status: 'unavailable'; reason: string; plus: boolean }
  | { status: 'ready'; plus: boolean; price: string | null; pkg?: PurchasesPackage };

const platform = Capacitor.getPlatform();
const key = platform === 'ios' ? BILLING.revenuecatKeys.ios : platform === 'android' ? BILLING.revenuecatKeys.android : '';
/** ブラウザで開発しているときだけ、画面確認用の疑似購入を使う(製品ビルドでは消える) */
const mock = !Capacitor.isNativePlatform() && import.meta.env.DEV;

let configured = false;
async function ensure() {
  if (configured) return;
  await Purchases.configure({ apiKey: key });
  configured = true;
}

export async function loadBilling(): Promise<BillingState> {
  if (mock) return { status: 'ready', plus: localStorage.getItem(APP.mockPlusKey) === '1', price: BILLING.displayPrice };
  if (!key) return { status: 'unavailable', reason: '購入の準備中です', plus: false };
  try {
    await ensure();
    const [{ customerInfo }, offerings] = await Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings()]);
    const pkg = offerings.current?.availablePackages[0];
    return { status: 'ready', plus: BILLING.entitlement in customerInfo.entitlements.active, price: pkg?.product.priceString ?? null, pkg };
  } catch (e) {
    console.error('[hiyori] billing', e);
    return { status: 'unavailable', reason: 'ストアに接続できませんでした', plus: false };
  }
}

/** true=有効になった / false=キャンセル。失敗は例外 */
export async function purchase(state: BillingState): Promise<boolean> {
  if (mock) {
    localStorage.setItem(APP.mockPlusKey, '1');
    return true;
  }
  if (state.status !== 'ready' || !state.pkg) throw new Error('この商品は購入できません');
  await ensure();
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: state.pkg });
    return BILLING.entitlement in customerInfo.entitlements.active;
  } catch (e) {
    if ((e as { userCancelled?: boolean })?.userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  if (mock) return localStorage.getItem(APP.mockPlusKey) === '1';
  if (!key) return false;
  await ensure();
  const { customerInfo } = await Purchases.restorePurchases();
  return BILLING.entitlement in customerInfo.entitlements.active;
}

export const isDevMock = mock;
export function setMockPlus(on: boolean) {
  if (!mock) return;
  if (on) localStorage.setItem(APP.mockPlusKey, '1');
  else localStorage.removeItem(APP.mockPlusKey);
}
