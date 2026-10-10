# ひよりごよみ(アカウント不要・端末保存のカレンダー)公開までの状態と手順

作成 2026-10-03〜04。旧Yahoo!カレンダー(2026-09-30〜10-02 に LINEカレンダーへ置き換え)の受け皿。
元の調査: Downloads\アプリ市場調査_2026-10-03\00_結論_10案.md の5位 / C_払う声\C_報告.md の1番。

## 1. 不満の声を数えた結果(作るものの順番の根拠)

数え方: `work/count_voices.py`(C_x_posts.json と C_appstore_named_reviews.json / C_appstore_scan.json を読むだけ。結果は work/voices_count.json)。
X は旧Yahoo!カレンダー/LINEカレンダーに触れた投稿 63件(10-01〜03 中心、公式のお知らせ・まとめ記事は除く)、レビューは LINEカレンダーの★1〜2 の15件(直近50件の平均 1.18、47件が★1〜2)。1件が複数に当たることがある。

### 旧Yahoo!カレンダー利用者が失った機能

| 順 | 失った機能 | X | レビュー | 計 | このアプリで |
|---|---|---|---|---|---|
| 1 | 予定の編集・削除ができない | 11 | 6 | 17 | 自由に編集・削除。くり返しは「この日だけ / この日から後 / すべて」 |
| 2 | 予定スタンプ・アイコン・絵文字 | 9 | 5 | 14 | スタンプ136種(無料20)。選んで日付を押すだけで貼れる |
| 2 | 見やすさ(日付の枠・色・月表示) | 11 | 3 | 14 | 日付ごとに枠で区切った月の表・9色・六曜と祝日をマスに |
| 2 | 「戻して」「返して」 | 6 | 8 | 14 | - |
| 5 | LINE連携・アカウントが必要 | 6 | 3 | 9 | アカウントなし・端末内保存 |
| 6 | 予定のコピー・移動・履歴入力 | 5 | 3 | 8 | コピー(何日でも貼れる)・履歴からワンタップ入力 |
| 7 | 予定が消えた | 5 | 2 | 7 | 端末内保存+前回分の控え・手動/自動バックアップ |
| 8 | 天気予報 | 3 | 2 | 5 | 未対応(残り参照) |
| 9 | 過去の予定の検索・参照 | 2 | 2 | 4 | 過去・未来・メモを検索(新しい順) |
| 10 | 着せ替え・背景 | 1 | 2 | 3 | 着せ替え8種(無料2) |
| 11 | 六曜 | 1 | 1 | 2 | 六曜・旧暦を表示(電波なしで計算) |
| - | 住所から地図 2 / 占い 1 / ウィジェット 1 | | | | 未対応(残り参照) |
| - | 「お金払う・有料でいい」 | 3 | 0 | 3 | 3件とも「編集」「履歴入力・アイコン」「見やすさ」を挙げている |

### 移った先(TimeTree・シンプルカレンダー・ジョルテ・Lifebear・Caho)で困っていること

レビュー★1〜2 の59件 + X(他カレンダー言及)73件。

| 順 | 困っていること | レビュー | X | 計 | このアプリで |
|---|---|---|---|---|---|
| 1 | 起動時の全画面広告・広告がボタンに重なる | 12 | 61 | 73 | 広告なし(無料でも) |
| 2 | 予定・データが消えた | 19 | 3 | 22 | 端末内保存・バックアップ |
| 3 | 有料限定・課金圧 | 5 | 6 | 11 | 基本は全部無料。課金は1回だけ ¥500 |
| 4 | OS 更新後の表示崩れ | 8 | 0 | 8 | - |
| 5 | 同期・アカウント連携の失敗 | 7 | 0 | 7 | 同期なし・アカウントなし |
| 6 | 一括削除・くり返しの編集 | 3 | 0 | 3 | くり返しの「この日から後を消す」 |

## 2. 作ったもの

- 月表示(5〜6週を自動)・祝日(振替休日・国民の休日つき)・六曜・旧暦・今日の印・左右スワイプ
- 下の欄に選んだ日の予定・旧暦・日ごとのメモ。前後の日へ移動
- 予定: 題名・スタンプ・9色・終日/時刻・何日間・くり返し(毎日/毎週/毎月/毎年、n回に1回、終わりの日)・お知らせ・メモ
- くり返しの1回だけ変える/消す/この日から後を消す、コピー(貼り付けモード)、スタンプ貼り付けモード、履歴から入力
- 検索(ひらがな/カタカナ・全角/半角を区別しない。過去も未来もメモも)
- 通知(端末のローカル通知。30日分・最大60件を予約し直す)
- バックアップ書き出し(スマホは共有シート)/読み込み(足す・置き換え)、端末のカレンダーから読み込み(読むだけ)
- 設定: 週の始まり、六曜の表示、着せ替え、色の名前、お知らせの既定
- はじめての案内、課金画面、プライバシーポリシー

### 課金(ひよりプラス)
- 買い切り ¥500(Ucカレンダー広告なし版 ¥500・評価4,475件に合わせた。ハチカレンダー2 Pro は ¥300)
- 無料: 基本機能すべて・広告なし・スタンプ20種・着せ替え2種
- プラス: スタンプ全136種・着せ替え8種・色に名前・今日の予定のまとめ通知(ウィジェットの代わり)・自動バックアップ(1日1回・7日分を端末の「ファイル」へ)
- 払う理由: 「お金払うから戻して」の3件が挙げた「アイコン(スタンプ)・見た目」と、消えて困った「バックアップ」に払わせる。編集・コピー・検索など困りごとの芯は無料
- 設定: src/config.ts。商品ID `hiyori_plus_lifetime`(非消耗型)/ entitlement `plus` / RevenueCat キーは空 → 「購入の準備中です」と出て課金は走らない。開発用の疑似購入は `npm run dev` のときだけ(設定の一番下)

### 使った外部のもの(アプリの中身にはデータを入れていない。祝日も六曜も計算)
- 祝日の規則: 国民の祝日に関する法律(法律の条文は著作権の対象外 著作権法13条)。内閣府 https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
- 照合用(テストだけ。アプリには入らない)
  - 内閣府「国民の祝日」CSV 1955〜2027 https://www8.cao.go.jp/chosei/shukujitsu/syukujitsu.csv → src/domain/fixtures/holidays_cao.json
  - 国立天文台 暦要項 2021〜2027 の朔弦望・二十四節気 https://eco.mtk.nao.ac.jp/koyomi/yoko/ → src/domain/fixtures/naoj.json。利用規定 https://eco.mtk.nao.ac.jp/koyomi/site/ 「各ページの内容は、ご自由に利用ください。ご利用にあたり、届出の必要はございません。」
  - 国立天文台 春分・秋分の予測表 https://www.nao.ac.jp/faq/a0301.html
- 計算式: J. Meeus『Astronomical Algorithms』の朔の式と VSOP87 の主要項(式は著作物でない)
- ライブラリ(すべて MIT): Capacitor 8 / @capacitor/preferences・local-notifications・filesystem・share・app / @ebarooni/capacitor-calendar 8.7.1(MIT, Copyright (c) 2024 Ehsan Barooni)/ @revenuecat/purchases-capacitor / React 19
- 天気は使っていない(気象庁のデータは端末から取りに行く必要があり、今回は見送り)

## 3. 確かめたこと(2026-10-04 時点)

1. vitest 118件 全部通過(`npm test`)
   - 祝日: 内閣府 CSV と 1980〜2027 の48年を1日ずつ照合(公式の祝日・休日 789日すべて一致、公式に無い日を祝日にしていない)。2026〜2030 の5年 1,826日を公式(2026〜2027 の35日)と国立天文台の予測から書き起こした表(2028〜2030)に照合して全部一致。春分・秋分の式を国立天文台の予測表 2020〜2050 の31年と照合して一致
   - 六曜: 国立天文台の朔 87回・中気 84回の時刻と、計算した時刻の差がすべて1分未満(最大0.62分。表は分単位)。表だけから組み立てた旧暦と 2021-12-04〜2027-11-27 の 2,185日を1日ずつ照合して旧暦の月・日・閏と六曜が全部一致(うち 2026-01-01〜2027-11-27 の696日)。旧正月4回が先勝、2023年閏2月・2025年閏6月も一致。2028〜2030 は1日ずつ六曜の並び順を確認
   - 簡易な太陽の式だと最大13分ずれ、2025年冬至(0時03分)で日付を誤る所だったので、精密な式に替えた(テストで差を確認)
   - 繰り返し(31日・2/29・間隔・終わり・消した回)、コピー・この回だけ、履歴、検索、通知の予約、バックアップの往復・壊れたファイル、端末カレンダーの写し方、スタンプ・着せ替えの数
2. `npm run build` 通過
3. Playwright(Python)E2E: `python scripts/e2e.py`(dist を vite preview で開く)41項目 ALL PASS、`python scripts/e2e.py --plus <開発サーバー>` 7項目 ALL PASS。予定の追加→くり返し→この日だけ消す→コピー→スタンプ→課金画面(準備中・復元)→メモ→検索→設定→書き出しファイルの中身→読み込み→再読み込みで残る→履歴、コンソールのエラー0
4. 画面写真を目で確認(scripts/e2e_out/)。直したもの: トーストが消えない(E2E の時計の止め方)、色名の丸が横長、課金表の「無料」が縦書きに折れる、マスの「スポーツの日」が切れる(マスでは「スポーツ」に縮め、下の欄は正式名)、ストア画像の見出し・フィーチャーの文がはみ出す
5. ストア素材: store/icon-1024.png、store/ios/shot_1〜5.png(1290x2796)、store/play/icon-512.png・feature.png(1024x500)・shot_1〜5.png(1080x1920)、掲載文 store/listing_ios.md・store/play/listing.md、データ セーフティ store/play/data_safety.md、レーティング store/play/content_rating.md、テスター募集 store/tester_post.txt。文字数: Play 題名19字・短い説明43字 / App Store 名前16字・サブタイトル17字・キーワード67字
6. プライバシーポリシー store/privacy.md(アプリ内の文面と同じ)

## 4. Android(署名済み AAB)

- appId: `jp.hiyorigoyomi.app` / versionCode 1 / versionName 1.0.0 / targetSdk 36(minSdk 24)/ 縦固定
- AAB: `releases\hiyorigoyomi-1.0.0-vc1-release.aab`(jarsigner で verified、CN=Hiyorigoyomi)
- 動作確認用 APK: `releases\hiyorigoyomi-1.0.0-vc1-release.apk`(apksigner v2 で Verifies)
- 権限: INTERNET / READ_CALENDAR / POST_NOTIFICATIONS / RECEIVE_BOOT_COMPLETED / WAKE_LOCK / BILLING ほか。SCHEDULE_EXACT_ALARM はマニフェストで外した(Play の申告不要)
- 組み立て: `npm run build` → `npx cap sync android` → `powershell -ExecutionPolicy Bypass -File scripts/build-android.ps1`(ファイルは BOM 付き UTF-8 のまま保つ。BOM が無いと PowerShell 5.1 が日本語を読み違えて keytool の所で止まった)
- 署名鍵: `%LOCALAPPDATA%\HiyorigoyomiBuild\signing\hiyorigoyomi-upload.jks`(別名 hiyorigoyomi-upload)、パスワードは同じフォルダの upload-password.dpapi(DPAPI)。作り直さない・上書きしない。PC を替える前にフォルダごと控える
- 次に出すときは android/app/build.gradle の versionCode を上げる

## 5. iOS

- Xcode プロジェクト: ios/App(Bundle ID jp.hiyorigoyomi.app、表示名 ひよりごよみ、1.0.0、iPhone は縦のみ)
- Info.plist: カレンダーの読み取りの説明(NSCalendarsUsageDescription / NSCalendarsFullAccessUsageDescription)、自動バックアップを「ファイル」に見せる設定(UIFileSharingEnabled / LSSupportsOpeningDocumentsInPlace)、暗号化なし宣言
- 組み立て: `.github/workflows/ios-testflight.yml`(ニガテ帳の物を写した。push はしていない)。シークレット4つ ASC_KEY_ID / ASC_ISSUER_ID / APPLE_TEAM_ID / ASC_KEY_P8_BASE64 は ニガテ帳と同じ物を使える。最初は compile_only で流す

## 6. 持ち主がやること・残り

1. Play Console でアプリを作成(jp.hiyorigoyomi.app)→ クローズドテストに AAB をアップロード → store/play の文と画像・データ セーフティ・レーティングを入れる → store/tester_post.txt で募集(12人×14日)
2. プライバシーポリシーを公開(kame6493-del.github.io に置く)して URL を両ストアに入れる
3. RevenueCat に新しいプロジェクト(または app)を作り、商品 hiyori_plus_lifetime(¥500)・entitlement plus・offering default を作って、公開キーを src/config.ts の revenuecatKeys に入れる → ビルドし直し(versionCode 2)
4. App Store Connect でアプリを作成 → GitHub に置いて ios-testflight.yml を流す → TestFlight
5. 実機で確かめていないもの: 端末のカレンダー読み込み(iOS/Android)、通知の実際の表示、共有シートでの書き出し、自動バックアップのファイル、Android の戻るボタン。APK を実機に入れて1度ずつ押す
6. 見送ったもの: 天気(気象庁の利用規約と取り方を確かめてから)、住所から地図アプリ、占い、ホーム画面のウィジェット(ネイティブで別に作る必要あり。今は「今日の予定のまとめ通知」で代わり)
7. 2028年の祝日: 内閣府が 2027年2月に公表したら src/domain/holidays.ts の OFFICIAL_UNTIL を上げ、fixtures の CSV を取り直してテスト
8. 旧暦の2033年問題(閏月の置き方)は範囲外。表示の対象年を広げるときに確認

## 7. フォルダ

- src/domain: 暦(date / holidays / lunar)・予定(events / notify / importDevice)・スタンプと着せ替え(catalog)とテスト
- src/platform: 保存(Preferences)・課金(RevenueCat)・通知/バックアップ/端末カレンダー
- src/ui: 画面
- scripts: e2e.py / store_shots.py / make_icons.py / make_demo.py / build-android.ps1
- work: 声の集計と照合データの取得(count_voices.py / make_fixtures.py と取得した元データ)

## Google Play(2026-10-04)
- アプリ作成: app id 4972544160823766398、「ひよりごよみ スタンプで貼るカレンダー」、jp.hiyorigoyomi.app、日本語・アプリ・無料
- プライバシーポリシー: https://kame6493-del.github.io/apps/hiyorigoyomi/privacy.html
- クローズドテスト Alpha(トラック 4700761072959437283): 日本・テスター AndroidClosedJP と nigatecho-testers・フィードバック kame6493@gmail.com
- 2026-10-04 審査に送信(14件)。申告: 広告なし/ログイン不要/18歳以上/レーティング3歳以上/データセーフティ=購入履歴のみ/広告ID なし/行政 いいえ/金融なし/健康なし。ストア設定 仕事効率化
- 1.0.1 (vc2): RevenueCat Android キー入り。AAB: C:\Users\yuichi1\Downloads\ひよりごよみ_2026-10-03\app\releases\hiyorigoyomi-1.0.1-vc2-release.aab (6.71 MB, 7,032,089 バイト)

## 1.1.0 (vc3) 見た目の作り直し(2026-10-10)

持ち主の指示で、ChatGPT に作らせた UI 参考画像(Downloads\hiyori_ref_2・3 と hiyori_all_4〜8、アイコンは hiyori_ref_1 を正方形にした物)に見た目を寄せた。機能と課金(ひよりプラス・hiyori_plus_lifetime・¥500・中身)は変えていない。iOS は出し直さない(ASC は触っていない。iOS の写真 store/ios/ も前のまま)。

- 絵: 見本から切り出してそのまま使った(水彩の花・すずめ・猫・女の子と窓辺・スタンプ 36種・設定の丸い絵記号・着せ替えの絵 8枚)。work/redesign/cut_assets.py → public/art/*.webp。新しく描いたのは線の絵記号(src/ui/icons.tsx)だけ
- 字: Zen Maru Gothic(OFL)を JIS 第1水準+画面の字に絞って public/fonts/ に(work/redesign/make_fonts.py。元の ttf は こつびん の scripts/fonts から写した物で git には入れていない)
- 画面: はじめての画面+使いかたガイド3枚 / 月の表(ロゴの見出し・スタンプ入力・マスにスタンプを大きく・下のメニュー5つ)/ 空の月(まだ予定がありません・はじめのスタンプ4つ)/ スタンプを選ぶ(全面・よく使う・最近使ったスタンプ)/ 予定の編集(全面・行を押すと開く・くり返しは見本の6択)/ くり返しの保存・削除の確認(丸い選択肢)/ 検索(すべて・予定・メモの絞り込み、よく入れる予定)/ 設定(絵記号つきの行・着せ替えを絵で・9色・バックアップの絵)/ ひよりプラス(冠・月桂樹・値段のカード)
- 色: 見本の9色 さくら・もも・みかん・たんぽぽ・若葉・そら・あじさい・藤・生成り。保存している番号はそのまま(赤→もも、橙→みかん、黄→たんぽぽ、緑→若葉、青緑→あじさい、青→そら、紫→藤、桃→さくら、灰→生成り)。名前を変えていなければ古い既定名(あか…はいいろ)を新しい名前に読み替える(src/domain/events.ts normalize・テストあり)
- 見本と違えた所: 見本にあって今無い機能は出していない(まとめ・やること・ドラッグで塗る・前週を使う・気分・写真・クラウド保存・iCloud/Outlook の選択・書き忘れリマインド・キャンペーン通知・スタンプのカテゴリ名)。下のメニューは「まとめ・やること」の代わりに「さがす・スタンプ」
- アイコン: scripts/make_icons.py(元絵 work/redesign/icon_src_1024.png)。Android 適応アイコンは前景=絵(縁を紙色へぼかす)・背景=紙色 #F8F0E2。安全域の確認 work/redesign/icon_check.png
- 前の版の素材は store/archive_v1_2026-10-10/ に退避
- AAB: releases\hiyorigoyomi-1.1.0-vc3-release.aab(9,746,021 バイト・既存の鍵・SHA256 8D:F1:59:…:0D:69 で vc2 と同じ)。10MB を超えたのでスプラッシュを128色にし、ストア画像だけで使う絵は work/redesign/art_store/ へ外した
- 確かめたこと: vitest 119件、build、E2E(python scripts/e2e.py が 375・430 幅の2回、--plus も2回)ALL PASS・コンソールのエラー0、録画ツアー(src/dev/reviewTour.ts)も新しい画面に合わせて購入画面まで進むのを確認。比較画像 docs\compare_redesign_*.png と docs\compare_redesign_all.png(python scripts/compare_redesign.py。git には入れていない)
- Play 素材: store/play/shot_1〜6.png(1080x1920)・feature.png・icon-512.png(python scripts/store_shots.py)。値段・「無料」・iPhone だけの機能は写していない
