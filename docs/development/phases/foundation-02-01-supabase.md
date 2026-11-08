# Foundation 2-1：Supabase接続基盤

- 日付: 2026-11-09（JST）
- 状態: 接続基盤・API疎通成功 / DB読み書き・実機永続化未検証 / PRレビュー待ち
- ブランチ: feature/foundation-02-01-supabase
- 基準main: daf8764448e76a78b2b1bb0fffee57065f1d1aba

## 目的・背景・スコープ
Supabaseクライアント設定と読み取り専用接続確認まで。最小プレースホルダー、Stack、Expo owner/project ID、server出力を維持する。認証画面、ログイン、日記テーブル、AI翻訳、同期、SQLite日記保存、CI/CD、デプロイは実装しない。
AGENTS、開発README、Codexフロー、デザイン原則、アーキテクチャ、Foundation 0/1を確認。PR #8のmerged、クリーンな状態を確認してmainをff-only同期し、専用ブランチを作成。

## プロジェクト選定・承認
既存expoaistarter-devはユーザーから別アプリ用と回答があったため使用・変更せず。組織とリージョンの希望を確認後、公式get_costの月額$0見積を提示し、ユーザーの明示承認を得て作成。
- 組織: iwasaki-hub's Org（Free）
- 新規名: LittleDiary
- リージョン: ap-northeast-1（東京）
- Supabase project ref: kllghkmudpcwbnjsodtx
- Dashboard: https://supabase.com/dashboard/project/kllghkmudpcwbnjsodtx
- API URL・publishable keyの実値は.env.localのみ。Git／Markdownへ記載しない。
- 作成結果はACTIVE_HEALTHY。プラン変更・課金操作なし。見積は作成時のもので将来の使用量保証ではない。

## 依存と互換性
`npx.cmd expo install @supabase/supabase-js expo-sqlite -- --save-exact` を実行。
- @supabase/supabase-js: 2.119.0（exact）
- expo-sqlite: ~58.0.15（実インストール58.0.15、SDK 58推奨範囲）
- Expo: ~58.0.23、React Native 0.88.1、TypeScript ~6.0.3。
lockfileを更新。Expo installがapp.jsonへexpo-sqliteプラグインを追加。他のExpo連携値・UIは変更しない。URL polyfillはSupabase quickstartでは案内されるが、現行Expo公式ガイドではURLが既に組み込まれているため不要と明記されており追加しない。
SQLiteはlocalStorage互換のセッション永続化用であり、日記データベースの導入ではない。暗号化ストレージではないので端末セッション保護の要件は認証導入時に再評価する。
インストール時npm auditはmoderate 12件を報告。無関係な一括更新は行わない。

## 変更ファイル・構成
- src/lib/supabase/config.ts: 静的process.env.EXPO_PUBLIC_*参照、未設定・URL形式・HTTPS・publishable形式を検証。エラーはキー等の値を含めない。
- src/lib/supabase/client.ts: 遅延singleton。初期化後のみnativeのAppStateに応じtoken refreshを開始／停止。リスナーはアプリ寿命で1回登録。
- session-storage.native.ts: expo-sqlite/localStorage/installを利用。
- session-storage.ts: ブラウザlocalStorage。SSRでの初期化を拒否し、ユーザー間の共有セッションを防ぐ。
- .env.example: 空の変数テンプレート。
- .gitignore: .env*を除外、.env.exampleだけ許可。
- tests/supabase.test.cjs: 設定拒否・singleton／native lifecycle・SSR拒否の単体検証。
- package.json／lockfile、app.json: 必要依存と自動追加プラグイン。
- docs/architecture/README.md、本記録: 責務・制限・引き継ぎ。

永続化はpersistSession=true、autoRefreshToken=true、detectSessionInUrl=false。WebのURLからのOAuth検出やSSR用cookieクライアントは今回の対象外。getSupabaseClientはSSRで呼ばず、ブラウザ／nativeの処理内で呼ぶ。初期化時に環境変数を検証するため、モジュールを用意しただけでは画面が落ちない。画面から呼び出して自動疎通を始める処理は追加していない。

## 環境変数・セキュリティ
.env.exampleを.env.localへコピーし、承認済みプロジェクトのEXPO_PUBLIC_SUPABASE_URL、EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEYを設定する。今回のローカル設定は既に用意済み。実値をログやPRへ貼らない。
EXPO_PUBLICはビルドへ埋め込まれ利用者から見える。publishable keyは秘密ではないが、RLSやGRANTによるデータ保護が必須。secret key、service_role、DBパスワードは取得・保存・使用しない。legacy anonも今回は受け付けずsb_publishable_を使う。
RLS有効でもテーブルアクセス権限は別問題。行所有者の制限、UPDATEのUSING/WITH CHECK、ユーザーが編集できるmetadataに認可を依存しない方針を今後の設計へ引き継ぐ。今回はテーブル・ビュー・権限・ポリシーの作成や変更なし。

## 接続検証
プロジェクト承認・作成後のみ実行。Nodeで公開設定を.env.localから読み込み、Supabase SDKのcreateClientをpersistSession/autoRefreshToken=falseで初期化し、公開apikeyを付けたGET /auth/v1/settingsを15秒timeout付きで実施。
結果: HTTP 200。本文・キーは出力しない。ネットワーク／TLS／URL／公開APIキーの疎通を確認したが、DBテーブル読み取り・書き込み・RLS評価・認証セッション成功を意味しない。テスト用テーブルは不要だった。既存プロジェクトのデータへはアクセスしない。

## 検証結果・問題と対処
- 初回TypeScript: AppState.currentStateがnull/undefinedを含むためTS2345。受け口をstring|null|undefinedに修正し、不明状態ではrefresh停止とした。
- 修正後 `npx.cmd tsc --noEmit`: 成功、終了コード0。
- `node --test tests/supabase.test.cjs`: 3/3成功。欠落／privileged key／不正URL拒否、遅延singletonとstorage・AppState転送、SSR拒否を検証。nativeとネットワークはmockであり実端末テストではない。
- `CI=1 npx.cmd expo lint`: 初回成功。最終結果は下記追記。
- `npx.cmd expo-doctor`: 20/20成功。
- `npx.cmd expo export --platform web`: 環境変数未設定・プレースホルダーのままで成功。クライアントが画面から未参照のため、native／ブラウザでの実クライアント起動テストとは区別。
- 接続GET: HTTP 200。
- git check-ignore .env.local: 除外確認済み。
- iPhone実機、Webでのセッション永続化・復帰・refresh: 未確認。認証を実装していないためログイン後の検証は後続工程。
- UI／ルート、旧記録、Expo owner/project IDは保持。Production・Previewへのデプロイなし。

## Expo Hosting Previewの後続検証計画
EAS preview環境に同じ2変数を登録し、export実行時にもその値を明示取得してから再ビルドする。deploy --environmentだけで既存distの埋め込み値が変わるとは考えない。後続の明示依頼でPreview公開・HTTP・ブラウザ・実機の接続を確認し、本番とは分離する。今回はHostingの変数登録・再公開を行わない。

## 他プロジェクトへの再利用・Foundation 2-2
1. 既存プロジェクトの用途をユーザーへ確認し、別アプリへ無断接続しない。新規組織・リージョン・費用は作成前承認。
2. SDK対応のExpo installとlockfileで依存を固定し、最新QuickstartとExpoガイドの違い（URL、storage、SSR）を照合する。
3. 設定・クライアント・storageをUIから分離し、SSRでブラウザセッションを共有しない。環境変数欠落を早期かつ秘密を出さず報告。
4. 接続HTTP、SDK単体mock、実機storage、DB/RLSの成功を分けて記録する。
5. Foundation 2-2は本PRレビューと明示承認後のマージ、環境設定、実機クライアント／永続化確認、次工程のテーブル・RLS・権限設計と必要な承認を前提とする。認証画面・日記・翻訳を無断で始めない。

## 参照した公式資料（2026-11-09）
- https://supabase.com/changelog.md （Flutter/CLIのbreaking changeは本工程のJSクライアント変更対象外。TLS旧暗号削除の告知も確認）
- https://supabase.com/changelog/cbc-tls-ciphers-deprecated
- https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- https://supabase.com/docs/reference/javascript/initializing
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://docs.expo.dev/guides/using-supabase/
- https://docs.expo.dev/versions/v58.0.0/sdk/sqlite/
- https://docs.expo.dev/guides/environment-variables/

## 最終差分確認
最終Lintは終了コード0。git diff --check成功。src/appはorigin/mainと差分なし。実値.env.localはgit statusに現れず、空の.env.exampleだけをコミット対象とする。最終exportはローカル設定ありでも実行し、画面・ルートを変更しないことを確認する。
最終ローカル設定ありWeb exportも成功（終了コード0）。生成物と実設定はコミットしない。Web／nativeの実クライアント接続・セッション保存の実機検証は引き続き未実施。
