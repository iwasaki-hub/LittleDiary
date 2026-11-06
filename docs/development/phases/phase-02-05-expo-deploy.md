# Phase 2.5：Expo Hosting 初回Webプレビュー

- 実行日: 2026-11-06（JST）
- 状態: プレビューデプロイ成功 / HTTP・HTML確認成功 / 実ブラウザ操作は未検証
- 担当: Codex（サブドメイン予約はユーザー承認後）
- ブランチ: `chore/phase2-5-expo-deploy`
- ビルド元コミット: `92ed76807b60fce932a06657855383368990b30e` + 本工程のapp.json設定
- 環境: Windows、Expo ~58.0.23、EAS CLI 27.5.0、Node v26.13.0

## 目的・スコープ
現在のLittleDiaryホームをmasa-practiceのFreeプランで開発確認用に公開する。本番公開、新機能、UI改修、SQLite・AI翻訳・Supabase追加は行わない。

変更ファイル:
- `app.json`: expo.ownerとextra.eas.projectIdを追加。
- 本ファイル: 実行結果、未検証項目、再デプロイ手順を記録。

## 開始確認・実装計画
AGENTS、package.json、app.json、開発記録README、テンプレートを確認。PR #3・#4のmergedをGitHubで確認。開始時mainはクリーン。`git pull --ff-only origin main` で最新状態を確認し、新規作業ブランチを作成した。
SDK 58とHosting公式資料を読み、既存のexpo.web.output=serverを維持する方針で、検証→アカウント照合→プロジェクト登録→予約承認→export→preview deploy→公開検証の順に実施。

## ExpoプロジェクトとHosting設定
- アカウント／owner: `masa-practice`
- プロジェクト: `@masa-practice/LittleDiary`
- プロジェクトURL: https://expo.dev/accounts/masa-practice/projects/LittleDiary
- project ID: `901f2477-82b9-40df-bb93-092019f93990`
- Previewサブドメイン: `little-diary`（ユーザーが恒久予約を明示承認）
- デプロイID: `9qo907h8ug`
- **実際のPreview URL: https://little-diary--9qo907h8ug.expo.app**
- デプロイ一覧: https://expo.dev/projects/901f2477-82b9-40df-bb93-092019f93990/hosting/deployments
- web.output: `server`、CLI環境: `preview`、出力先: `dist/client`・`dist/server`
- `--prod` 不使用、Production aliasの割当なし。有料プラン変更・課金操作なし。

## 実際に実行したコマンドと結果
PowerShell。以下のeasコマンドはすべて `npx.cmd eas-cli@latest` 経由。

| コマンド | 結果 |
| --- | --- |
| `npx.cmd tsc --noEmit` | 公開前成功、終了コード0 |
| `$env:CI='1'; npx.cmd expo lint` | 公開前成功、終了コード0 |
| `npx.cmd expo-doctor` | 公開前20/20成功、終了コード0 |
| `git diff --check` | 成功、LF→CRLF予告のみ |
| `npx.cmd eas-cli@latest --version` | eas-cli/27.5.0 |
| `npx.cmd eas-cli@latest whoami` | masa-practiceでログイン済み。ユーザーのログイン作業は不要だった |
| `npx.cmd eas-cli@latest init --account masa-practice` | 作成確認にyesで登録、app.jsonへ関連付け |
| `npx.cmd eas-cli@latest project:info` | 所有者・プロジェクト名・IDの一致を確認 |
| `npx.cmd eas-cli@latest deploy --help` | previewサブドメイン・環境指定・非対話オプションを確認 |
| `npx.cmd eas-cli@latest account:usage --help` | 公式利用状況コマンドを確認 |
| `npx.cmd eas-cli@latest account:usage masa-practice --non-interactive` | 公開前plan=Free、addonsなし、見積0、読み取り確認のみ |
| `npx.cmd expo config --type public --json` | 初期設定のowner・project ID未登録、web.output=serverを確認（必要フィールドのみ表示） |
| `npx.cmd expo export --platform web` | 初期・最終app.json設定後の2回とも成功、終了コード0 |
| `git check-ignore dist` | distが除外対象であることを確認 |
| `npx.cmd eas-cli@latest deploy --dev-domain little-diary --environment preview --non-interactive --json` | 成功、終了コード0、上記URLとIDをCLIが発行 |

CLIの公開結果:
```json
{
  "dashboardUrl": "https://expo.dev/projects/901f2477-82b9-40df-bb93-092019f93990/hosting/deployments",
  "identifier": "9qo907h8ug",
  "url": "https://little-diary--9qo907h8ug.expo.app"
}
```

## 公開後検証
| 対象 | 結果・限界 |
| --- | --- |
| PreviewホームへのInvoke-WebRequest | HTTP 200 |
| `/explore`へのInvoke-WebRequest | HTTP 200。クリック遷移確認とは別 |
| HTMLの日本語 | 「今日も、いい一日に。」「今日はどんな日だった？」「英語を学ぶ」「日記の記録」「今日は素敵な一日だった！」を正しく取得 |
| HTMLの英語 | `It was a lovely day!` を正しく取得 |
| 実ブラウザ描画・キャラクター・カード | 未検証。CUAは `The browser access host is unavailable` を返した |
| 狭い画面・PC／スマートフォン表示 | 未検証 |
| Home/Exploreのタブクリック | 未検証 |
| ライト／ダーク表示・hydration警告 | 未検証。HTTP成功でブラウザコンソールの警告有無は判断できない |
| iPhone実機ブラウザ | ユーザー確認待ち |

ユーザー確認手順: Preview URLをPCとスマートフォンで開き、日本語・英語・オレンジの顔・各カード、狭い幅での折り返し／スクロール、Home→Explore→Home、ライト／ダーク表示を確認。PCでは開発者コンソールのhydration関連警告・エラーも確認する。

## 判断・問題・解決
- 既存EAS関連付けがなかったため、masa-practiceログインを確認後に新規登録。既存のownerやproject IDの上書きなし。
- initは評価済みRouterのextra.router.asyncRoutesもapp.jsonへ保存した。不要な派生設定を除去し、owner・project IDだけ残して再export。アプリコード・依存・既存web.outputは変更なし。
- サブドメインは変更・プロジェクト削除後も再利用できない公式仕様のため、予約前にユーザーへ確認し承認を取得。他の名前を勝手に予約していない。
- Freeプランを公式account:usageで確認した。この出力のbuild/update使用量はHosting使用量とは異なるため、Hosting残量の証拠にはしない。制限に達した場合は停止して利用状況を確認し、有料化で回避しない。
- exportはNO_COLOR/FORCE_COLORの出力色警告を伴うが、ビルド自体は成功。
- ブラウザ操作環境が利用不可のため、HTTP・HTML取得と描画・操作を分離して記録。

## 将来の再デプロイ手順
1. クリーンな対象ブランチ・コミット、owner、project ID、`whoami`、`account:usage`を確認。未ログインならユーザー本人が `npx.cmd eas-cli@latest login` を実行する。認証情報をチャット・ログへ貼らない。
2. TypeScript・Lint・Doctor・差分チェックを実行。
3. `npx.cmd expo export --platform web` で最新distを作る。古いdistを再利用しない。
4. `npx.cmd eas-cli@latest deploy --environment preview --non-interactive --json` で新規プレビューを発行。既存サブドメインを利用し、`--prod`は付けない。
5. 発行されたURL・IDを保存し、HTTP・HTML・実ブラウザ・スマートフォンを個別に確認。生成物をGitへ追加しない。
6. 必要設定と記録だけPRへ提出し、レビュー承認前にマージしない。

## 他プロジェクトへ再利用できる知見
- 初回登録は既存owner／IDを確認し、公式CLIのwhoami→init --account→project:infoで所有者と関連付けを照合する。
- PreviewはデプロイID付きURLで個別確認する。Productionは本番aliasを割り当てる別操作であり、preview環境変数指定と本番公開フラグを混同しない。
- Free利用はプランと上限を確認し、上限到達時は停止する。プラン変更や課金を自動で行わず、build/updateの枠をHosting枠と混同しない。
- Web exportの成功だけで操作成功とは扱わない。出力構造、HTTP応答、HTML文字列、描画・操作、hydrationを段階別に検証する。
- CI/CDへ移行する場合はCLIバージョンを固定し、検証→export→preview deployを順序化。認証はCIのsecret storeと最小権限を使い、fork PRに秘密を渡さない。productionは別の承認ゲートに分ける。今回は自動化設定は追加していない。
- project IDは公開設定として記録できるが、パスワード・アクセストークンは設定ファイルや記録へ入れない。whoamiの個人情報出力も保存しない。dist・.expo・認証ファイルはコミットしない。

## 受け入れ条件と次工程
- [x] SDK 58構成維持、静的検証成功、server export成功
- [x] masa-practiceのFreeプラン、LittleDiaryプロジェクト、owner／ID照合
- [x] 予約承認後のPreviewデプロイ成功、URL・ID取得、HTTP・HTML確認
- [ ] PC／スマートフォンのブラウザ描画・操作・hydration検証（ユーザー確認待ち）
- [ ] 設定・開発記録PRのレビューと明示承認後のマージ

## 参考資料（2026-11-06確認）
- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/llms.txt
- https://docs.expo.dev/deploy/web/
- https://docs.expo.dev/eas/hosting/get-started/
- https://docs.expo.dev/eas/hosting/deployments-and-aliases/
- https://docs.expo.dev/billing/plans/

## 設定確定後・公開後の最終確認
- TypeScript・Lintを再実行し、ともに終了コード0。
- Expo Doctorを再実行し20/20成功、終了コード0。
- 公開後account:usageもplan=Free、addonsなし、見積0。Hostingの個別残量はこの出力にないため未確認。
- `git diff --exit-code origin/main -- src package.json package-lock.json` は成功。アプリ・依存は無変更。
- `git diff --check` 成功、dist/client・dist/serverはgit check-ignoreで除外を確認。
- 差分はapp.jsonと本記録の2ファイルのみ。生成物・秘密情報はステージしない。
