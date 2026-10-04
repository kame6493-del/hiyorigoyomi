/**
 * 課金の設定(RevenueCat)。キーはまだ無いので空。空のあいだは購入ボタンが「購入の準備中です」になり、課金は走らない。
 *
 * App Store Connect / Google Play Console に作る商品
 *   商品ID: hiyori_plus_lifetime(非消耗型・買い切り)価格 ¥500(Ucカレンダー広告なし版 ¥500 に合わせた)
 * RevenueCat
 *   entitlement: plus / offering: default / package: $rc_lifetime
 */
export const BILLING = {
  productId: 'hiyori_plus_lifetime',
  entitlement: 'plus',
  displayPrice: '¥500',
  revenuecatKeys: { ios: 'appl_fvyzmblWsVppvvZXFrNDzhKMAmt', android: 'goog_MFBVCINrnINDwbNkxFKpLpKJvgD' },
};

export const APP = {
  name: 'ひよりごよみ',
  storageKey: 'hiyorigoyomi.data.v1',
  mockPlusKey: 'hiyorigoyomi.mockPlus',
};
