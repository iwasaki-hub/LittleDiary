# Foundation 2-3A：クラウドSupabase Auth接続準備

- 日付: 2026-11-09 JST
- 状態: ログイン画面実装・静的検証。実ログイン／iPhoneは未確認
- ブランチ: feature/foundation-02-03a-cloud-login
- 基準main: 919a400266d2e84e8330cc462bc3c5e83f9c9129
- 対象: LittleDiaryクラウド開発・テスト用プロジェクト kllghkmudpcwbnjsodtx

## 目的・開始条件

メール・パスワードによるログインとセッション表示を用意し、実機確認に進める状態にする。AGENTS、Codexフロー、デザイン原則、既存client/config/storage、Expo SDK58・React Native0.88・Supabase公式Auth資料を確認した。PR #16 Merged、クリーンなmainをff-only同期し専用ブランチを作成。

今回の明示依頼に従ってFoundation0のプレースホルダーをログイン画面へ置き換える。既存Stack・routeパスは維持する。日記・DB・翻訳機能は追加しない。Authユーザー作成/削除、Auth設定、テーブル/RLS/migration、Docker、デプロイ、実ログインは行わない。

## 変更ファイルと役割

- src/app/index.tsx: 既存index routeからログイン画面を表示、Stackタイトルを指定。
- src/components/login-screen.tsx: 日本語の入力欄、確認中・処理中・ログイン済み・エラー表示、再確認・ログアウト。SafeArea、スクロール、iOSキーボード回避、読み上げラベルを用意。
- src/styles/login.ts: 色・余白・入力欄・ボタンをUIから分離。デザイン原則の背景・文字・アクセントを使用。
- src/hooks/use-auth.ts: セッション状態、操作中状態、再確認、二重送信抑止、unmount時の購読解除を管理。
- src/lib/supabase/auth.ts: 入力検証、signInWithPassword、local scopeのsignOut、セッション復元/イベント購読、安全なエラー文言を集約。
- tests/auth.test.cjs: ネットワークを使わない認証処理・エラー・競合・解除のテスト。
- docs/architecture/README.mdと本記録: 今回の境界と実機手順。

依存追加なし。既存getSupabaseClient()のlazy singletonを使用し、createClientを追加しない。ネイティブは既存expo-sqlite/localStorage、Webは既存window.localStorage、既存AppStateのrefresh制御を維持。永続化方式は暗号化ストレージへ変更していない。パスワード入力は送信時にクリアし、ログ・独自storageへ保存しない。SDKが扱うセッションtokenは既存方式で保存される。

## 設計判断とエラー処理

- メール前後空白だけtrim。パスワードの空白・大文字小文字は変更しない。新規アカウント用の最小文字数ルールをログインへ持ち込まない。
- 空欄・メール形式はAPIアクセス前に拒否。invalid_credentials、未メール確認、rate limit、ネットワーク例外、未知エラーを日本語で案内する。サーバーのmessage、キー、token、入力値をそのまま表示しない。
- 初回mount後にだけclientを初期化し、SSR描画ではstorageへ触れない。getSessionでローカル復元とSDKの期限処理を確認し、onAuthStateChangeで変更を反映。callback内でawait/Supabase操作をせず、遅い復元結果が新しい認証イベントを上書きしないようrevisionを使う。
- getSessionの表示はDBアクセス権限の検証ではない。将来のデータ認可は別途RLS等で設計し、今回DBへアクセスしない。
- ログアウトはscope=localでこのセッションに限定し、他端末のログアウトを要求しない。失敗時は成功扱いにせずエラーを表示。
- キーボード送信とボタン連打はhookのrefで同時操作を抑止する。処理中は編集・ボタンを無効化。入力エラー後にもパスワード再入力が必要。

## 環境変数・読み取り接続確認

既存.env.localは上書きせず、EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEYを使用。ソースにURL・keyを直書きせず、config.tsのHTTPS/publishable形式検証を維持した。

ローカルで値を表示せずURLが承認プロジェクトのAPI URLに一致することと、sb_publishable_形式を確認。/auth/v1/settingsへの**GETだけ**を実施し、設定された公開キーではHTTP200、不正な対照文字列ではHTTP401を確認した。これにより対象ホストでキーが受理されることを確認したが、ユーザーのログイン・セッション・データ権限の成功は証明しない。レスポンス内容やキーは記録していない。設定更新、ユーザー一覧取得、ユーザー作成、パスワード認証は未実施。

調査時dotenvパッケージがrootから解決できなかったため依存追加せずNode標準util.parseEnvを使って再確認。SDK58/RN0.88ではTextInputのrefを古いinstance型として扱えず、React ComponentRef<typeof TextInput>で解決した。any・ts-ignore・検証除外は追加しない。

## 検証結果

- npx.cmd tsc --noEmit: 成功、終了コード0。
- CI=1のnpx.cmd expo lint: 成功、終了コード0。
- node --test tests/supabase.test.cjs tests/auth.test.cjs: 10/10成功。既存3件＋新規7件。全てmock/offlineで実ログインなし。
- 新規テスト: API前の入力拒否、メールtrim/パスワード保持、失敗・機密文言非露出、local logout、認証イベントと古い復元の競合、unsubscribe/遅延応答、設定/保存領域/復元エラー。
- npx.cmd expo-doctor: 20/20成功。
- npx.cmd expo export --platform web: 成功、終了コード0。SSR/server構成を維持しdistへ出力。生成物はGit除外。NO_COLOR/FORCE_COLORの環境警告は出たがビルドエラーなし。実ブラウザ操作の証拠とはしない。
- staged diffの実publishable key混入検査・JWT/秘密鍵パターン検査: 一致なし。Markdown相対リンク3件: 全件解決。git diff --cached --check: 成功。
- iPhone、VoiceOver、キーボード/文字拡大、ブラウザの描画/操作、実資格情報での成功・失敗・再起動復元・ログアウトは**未検証**。

## iPhoneで試す手順（ユーザー担当）

1. テストアカウントの準備方式と、このプロジェクトのアカウントを利用してよいことを確認する。アカウントがなければ別工程で作成を承認する。Codexは今回作成しない。メール・パスワードをチャットやGitへ貼らない。
2. .env.localの既存公開設定をローカルで確認。環境変数変更時はMetroを終了してからnpx.cmd expo start --clearで再起動し、同じLANのExpo GoからQRを開く。Expo本番デプロイは不要。
3. セッション確認後、入力画面・日本語・パスワードのマスク・キーボード表示時のスクロールを確認。空欄と不正メールのエラー、連打抑止を確認する。
4. 利用が確認済みのテストアカウントだけでログインし、ログイン中表示からログイン済みへ変わることを確認。画面にtokenや秘密値が出ないことを確認する。
5. アプリ再起動・背景/復帰後の復元を確認。ログアウトして入力画面へ戻り、再起動後もログアウト状態であることを確認する。
6. 許可された範囲で誤パスワード・通信断・未メール確認を確認。rate limitを誘発する連打はしない。結果はユーザー報告として追記する。

## 次工程・再利用知見

PRレビュー後も、実ログインに使う既存テストアカウントの指定/利用確認が必要。作成・削除・メール設定変更は別承認。RLS/テーブル/migration、Auth UI拡張、AI翻訳、Docker起動、Hosting反映は今回の範囲外。

接続キーの受理・認証成功・DB認可を別の証拠として扱う。Auth event callbackを同期的に保ち、復元の古い結果とunmount後更新をテストする。表示するエラーは許可した文言だけにし、実サーバーmessageをUI/ログへ渡さない。client生成・storage・画面を分離するとSDK更新時の影響を抑えられる。

## 公式根拠

- [Expo SDK58](https://docs.expo.dev/versions/v58.0.0/) / [Stack](https://docs.expo.dev/versions/v58.0.0/sdk/router/stack/)
- [React Native TextInput](https://reactnative.dev/docs/textinput)
- [Supabase password Auth](https://supabase.com/docs/guides/auth/passwords) / [React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [signInWithPassword](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) / [onAuthStateChange](https://supabase.com/docs/reference/javascript/auth-onauthstatechange) / [signOut](https://supabase.com/docs/reference/javascript/auth-signout)
