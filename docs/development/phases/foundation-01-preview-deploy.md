# Foundation 1：最小ExpoアプリのWebプレビュー公開

- 実行日: 2026-11-09（JST）
- 状態: Preview公開成功 / 静的検証・HTTP・HTML・ブラウザの文言表示確認成功 / 見た目詳細と実スマートフォンWebは確認待ち
- 担当: Codex
- ブランチ: `chore/foundation-01-preview-deploy`
- デプロイ元コミット: `7deeefb2209bcc2df2e0687850eff32dd5d80eab`
- 環境: Windows、Expo ~58.0.23、EAS CLI 27.5.0、Node v26.13.0

## 目的・背景
Foundation 0で作った最小Expo Routerアプリを既存Expo HostingへPreview公開し、ローカル検証・ユーザー報告のiPhone結果・公開環境を段階別に確認する。機能開発やUI再導入はしない。

## 開始確認・引き継ぎ構成
AGENTS、開発README、Codexフロー、デザイン原則、アーキテクチャ、Foundation 0、工程テンプレートを確認。開始時mainはクリーンで、PR #6のmergedをGitHubで確認。
`git switch main`、`git pull --ff-only origin main` は成功し、最新mainは上記SHA。専用ブランチを作成した。

- src/app/index.tsx: `Edit src/app/index.tsx to edit this screen.` の最小プレースホルダー。
- src/app/_layout.tsx: Expo Router Stack。
- exampleはTS exclude・Lint ignoresにより分離。現行srcに旧UI参照なし。
- exportのroute manifestは/index、生成sitemap、not-foundのみ。exampleやExploreの登録なし。
- app.json・依存・アプリコード・既存docsは変更せず、新規工程記録だけ追加。

## Expo関連付け・無料枠
- ログイン／owner: masa-practice（whoamiとapp.jsonを照合）
- プロジェクト: @masa-practice/LittleDiary
- URL: https://expo.dev/accounts/masa-practice/projects/LittleDiary
- project ID: `901f2477-82b9-40df-bb93-092019f93990`（project:infoとapp.jsonを照合）
- web.output: serverを維持。
- `account:usage masa-practice --non-interactive` はplan=Free、addonsなし、見積0。出力はBuild/Update中心でHosting個別残量は含まれず、その残量は未確認。デプロイ自体は枠・権限エラーなく成功。
- 新規プロジェクト・サブドメインの作成、Production公開、課金操作、過去デプロイ削除はしていない。

## 実施計画・実行コマンドと結果
| コマンド | 結果 |
| --- | --- |
| `npx.cmd tsc --noEmit` | 成功、終了コード0 |
| PowerShell `$env:CI='1'; npx.cmd expo lint` | 成功、終了コード0 |
| `npx.cmd expo-doctor` | 20/20成功、終了コード0 |
| `npx.cmd expo export --platform web` | 成功、終了コード0。現在のコミットから最新dist/client・dist/serverを生成 |
| `git diff --check` | 成功 |
| `npx.cmd eas-cli@latest --version` | 27.5.0 |
| `npx.cmd eas-cli@latest whoami` | masa-practice |
| `npx.cmd eas-cli@latest project:info` | 既存project IDと一致 |
| `npx.cmd eas-cli@latest account:usage masa-practice --non-interactive` | Freeプラン確認 |
| `git check-ignore dist` | distを除外対象と確認 |
| `npx.cmd eas-cli@latest deploy --environment preview --non-interactive --json` | 成功、終了コード0 |

## デプロイ結果
- **新Preview URL: https://little-diary--rrk8p7a6hp.expo.app**
- デプロイID: `rrk8p7a6hp`
- Dashboard: https://expo.dev/projects/901f2477-82b9-40df-bb93-092019f93990/hosting/deployments
- CLIが返した実際の値を記録。既存little-diaryを再利用し、予約オプション・--prod・aliasの割当は使用していない。
- 以前のPreviewは削除していない。

## 検証結果
### HTTP・HTML
Invoke-WebRequestで新URLを取得し、HTTP 200を確認。
- プレースホルダー文言あり。
- 「今日も、いい一日に。」「今日はどんな日だった？」「It was a lovely day!」はすべて不在。
- UTF-8 metaあり、置換文字U+FFFDなし。現行の英語文言は正常。日本語の本文は最小画面に存在しないため、日本語描画の検証は対象文言がなく未実施。

### ブラウザ
Edge指定ではBrowser is not availableとなったため、利用可能なブラウザ一覧を確認し、ChatGPTアプリ内ブラウザで新URLを開いた。
- 通常幅のアクセシビリティツリーでindex見出しとプレースホルダー文言を確認。
- viewportを390×844へ変更し、同じツリーとプレースホルダーisVisible=trueを確認。終了時にviewportをreset。
- 通常幅・390px確認後とも取得したconsole warn/errorログは空配列。観測した範囲で重大エラー・hydration警告なし。将来の全操作や全ブラウザを保証するものではない。
- スクリーンショットはUnable to capture screenshotで取得失敗。画素による外観確認やはみ出しの詳細検証は未実施。
- 実スマートフォンブラウザ表示はユーザー確認待ち。PCの幅変更を実端末テストと扱わない。

### iPhone実機（Foundation 0からのユーザー報告）
Expo Go起動成功、プレースホルダー表示成功、クラッシュ・赤いエラー画面なしの3項目をユーザー確認済みとして引き継ぐ。Codex自身が操作した結果ではない。実施日時・端末機種・OSは未報告。この報告は新しいPreview URLのSafari表示確認とは別。

## 問題・判断・解決
- ビルドのNO_COLOR/FORCE_COLOR警告は色出力の警告で、exportは成功。設定や依存を変更しない。
- 検索rgで旧参照が0件の際の終了コード1は「一致なし」で、構成不具合ではない。
- HTTP取得・文字列確認、AXの文言とvisible、スクリーンショットによる外観、実端末は別々に記録する。できなかった検証を成功扱いにしない。
- Foundation 0記録に過去時点の未確認表記があるが、今回のユーザー報告を本工程に明記し、既存記録は削除・書き換えない。

## 再デプロイ手順・再利用知見
1. 未コミット変更・対象コミット・前提PRを確認し、最新mainから専用ブランチを作る。
2. whoami、project:info、app.json、account:usageで既存owner／ID／Freeを照合。相違・権限・枠の問題は停止し、init・予約・有料化で回避しない。
3. TypeScript・Lint・Doctor・差分チェック後、expo export --platform webで新distを作る。生成物は除外し、古いdistを再利用しない。
4. 上記preview deployコマンドを実行。--prodや新サブドメイン指定は付けず、CLI発行URL／IDを記録する。
5. HTTP・HTML、ブラウザの描画／ログ、スマートフォンを個別確認する。認証情報やwhoamiの個人情報を文書に保存しない。
6. 必要な設定と記録だけPRへ提出し、レビューと明示承認までマージしない。

## 受け入れ条件・Foundation 2への引き継ぎ
- [x] 最新mainの最小アプリ、server構成、既存プロジェクト・Free維持
- [x] 静的検証・export・Preview公開・HTTP／HTML確認
- [x] アプリ内ブラウザの文言表示と390px幅でのvisible、観測consoleログ確認
- [ ] PC／実スマートフォンの見た目詳細（ユーザー確認待ち）
- [ ] 本PRレビュー・ユーザー承認後のマージとmain同期

Foundation 2は残る外観・実端末Web確認と本PRレビューを引き継ぎ、次の基盤整備の具体的範囲・検証条件を合意して開始する。本工程ではDB・新UI・GitHub Actions・Expo Workflowsを追加していない。

## 参考資料
- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/eas/hosting/deployments-and-aliases/
