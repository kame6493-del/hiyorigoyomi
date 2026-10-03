# ひよりごよみの Android 公開用ビルド(署名済み AAB と動作確認用 APK)。powershell -ExecutionPolicy Bypass -File scripts/build-android.ps1
# 先に npm run build と npx cap sync android を済ませておく。
# - JDK と SDK は DIAMOND NINE 用に入っている物を読むだけで使う
# - 署名鍵はひよりごよみ専用。%LOCALAPPDATA%\HiyorigoyomiBuild\signing に置き、パスワードは DPAPI(このWindowsユーザーだけが復号できる)で保存
# - 鍵を上書き・作り直ししない。無くしたら Play Console で「アップロード鍵のリセット」を申請することになる
# - プロジェクトのパスに日本語があると Gradle が止まるので、空いている一時ドライブ(subst)で英字のパスに見せ、終わったら外す
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$tools = Join-Path $env:LOCALAPPDATA 'Packages\OpenAI.Codex_2p2nqsd0c76g0\LocalCache\Local\DiamondNineBuild'
if (!(Test-Path "$tools\java")) { $tools = Join-Path $env:LOCALAPPDATA 'DiamondNineBuild' }
$env:JAVA_HOME = (Get-ChildItem "$tools\java" -Directory | Select-Object -First 1).FullName
$env:ANDROID_HOME = "$tools\android-sdk"
if (!(Test-Path "$env:JAVA_HOME\bin\java.exe")) { throw 'JDK が見つかりません' }

$secretDir = Join-Path $env:LOCALAPPDATA 'HiyorigoyomiBuild\signing'
New-Item -ItemType Directory -Force $secretDir | Out-Null
$store = Join-Path $secretDir 'hiyorigoyomi-upload.jks'
$passFile = Join-Path $secretDir 'upload-password.dpapi'
if (!(Test-Path $store)) {
  if (Test-Path $passFile) { throw 'パスワードだけ残っていて鍵がありません。鍵を復元してください(作り直さない)' }
  $bytes = New-Object byte[] 36
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $password = [Convert]::ToBase64String($bytes)
  $password | ConvertTo-SecureString -AsPlainText -Force | ConvertFrom-SecureString | Set-Content $passFile
  $env:HG_UPLOAD_PASSWORD = $password
  # keytool は経過をエラー出力に書く。ここだけ止まらない設定にして、終了コードと鍵ファイルで判定する
  $ErrorActionPreference = 'Continue'
  & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $store -storetype JKS -alias hiyorigoyomi-upload -keyalg RSA -keysize 3072 -validity 10000 -storepass:env HG_UPLOAD_PASSWORD -keypass:env HG_UPLOAD_PASSWORD -dname 'CN=Hiyorigoyomi, O=Hiyorigoyomi, C=JP' -noprompt 2>&1 | Out-Null
  $code = $LASTEXITCODE
  $ErrorActionPreference = 'Stop'
  if ($code -ne 0 -or !(Test-Path $store)) { Remove-Item $passFile -ErrorAction SilentlyContinue; throw '署名鍵を作れませんでした' }
  Write-Output "署名鍵を作りました: $store (PC を替える前に、このフォルダごと安全な場所へ控えてください)"
} else {
  $secure = Get-Content $passFile | ConvertTo-SecureString
  $env:HG_UPLOAD_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
}
$env:HG_UPLOAD_STORE = $store

# 空いているドライブ文字を探す(ほかの作業が使っている文字は避ける)
$drive = $null
foreach ($c in 'W','V','U','T','S','R','Q','P','O','N') { if (!(Test-Path "${c}:\")) { $drive = "${c}:"; break } }
if (!$drive) { throw '空いているドライブ文字がありません' }
subst $drive (Split-Path $repo -Parent)
try {
  $proj = "$drive\$(Split-Path $repo -Leaf)\android"
  "sdk.dir=$($env:ANDROID_HOME -replace '\\','/')" | Out-File -Encoding ascii "$proj\local.properties"
  $p = Start-Process -FilePath "$proj\gradlew.bat" -ArgumentList ':app:assembleRelease', ':app:bundleRelease', '--no-daemon', '-q' -WorkingDirectory $proj -NoNewWindow -Wait -PassThru -RedirectStandardError "$env:TEMP\hg_release_err.txt"
  if ($p.ExitCode -ne 0) { Get-Content "$env:TEMP\hg_release_err.txt" -Tail 40; throw "Gradle が失敗しました (exit $($p.ExitCode))" }
  $out = Join-Path $repo 'releases'
  New-Item -ItemType Directory -Force $out | Out-Null
  Copy-Item "$proj\app\build\outputs\bundle\release\app-release.aab" "$out\hiyorigoyomi-1.0.0-vc1-release.aab" -Force
  Copy-Item "$proj\app\build\outputs\apk\release\app-release.apk" "$out\hiyorigoyomi-1.0.0-vc1-release.apk" -Force
  Write-Output "出力: $out"
} finally {
  subst $drive /D
  Remove-Item Env:HG_UPLOAD_PASSWORD, Env:HG_UPLOAD_STORE -ErrorAction SilentlyContinue
}
