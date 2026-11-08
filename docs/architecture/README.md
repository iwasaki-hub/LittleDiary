# アーキテクチャ基盤

Foundation 0ではExpo SDK 58、React Native、TypeScript strict、Expo Routerを維持し、アプリコードは次の2ファイルだけとする。

- `src/app/_layout.tsx`: Stackを返すルートレイアウト。
- `src/app/index.tsx`: 初期化スクリプトが生成したプレースホルダー画面。

画面以外のコードは今後src/app外に置く。基盤完成までDB、認証、AI翻訳、日記保存、独自UIは実装しない。依存パッケージの整理も今回の対象外。

旧アプリはexampleへ退避しGit管理する。TypeScript excludeとESLint global ignoresで現行検証から分離する。Routerのルートはsrc/appのままなのでexample/src/appは画面登録されない。アーカイブのエイリアス参照は当時のsrcを前提としており、現在のビルド対象として使わない。

app.json、アイコン・スプラッシュ等の参照画像は保持する。ownerはmasa-practice、EAS project IDは901f2477-82b9-40df-bb93-092019f93990。web.output=serverを維持し、ios/androidを手動生成しない。

[Foundation 0の検証と復元方法](../development/phases/foundation-00-reset.md)

## Foundation 2-1：Supabase接続基盤
- `src/lib/supabase/client.ts` のgetSupabaseClient()で必要時に初期化する。プレースホルダー／ルートからは呼ばない。
- config.tsはEXPO_PUBLICのURLとpublishable keyを検証し、未設定時は値を出さずにエラーとする。
- nativeはexpo-sqlite/localStorage、WebはブラウザlocalStorageを使う。SSRで共有クライアントを作成しない。SQLiteはセッション保管のみで日記保存ではない。
- 新規Supabase LittleDiary（東京、Free、ユーザー承認済み）へ接続。Expo Hostingのproject IDとは別の識別子として扱う。
- 詳細・制限・検証は[Foundation 2-1記録](../development/phases/foundation-02-01-supabase.md)。認証UI・DBスキーマ・同期機能は未実装。

## Foundation 2-3A：クラウドAuthログイン準備

Foundation 0/2-1時点の記述に対し、ユーザーの明示依頼でindexにメール・パスワードのログイン画面を追加した。Stack・routeパス・既存Supabase singletonとstorageは維持。画面はcomponents/login-screen、スタイルはstyles/login、状態はhooks/use-auth、Auth操作はlib/supabase/authに分離する。

signInWithPassword、getSession、onAuthStateChange、scope=localのsignOutだけを使用。SSRではclientを初期化しない。セッション表示はDB認可の証明ではなく、今回テーブル・RLS・Auth設定・ユーザーは変更しない。実ログイン/iPhoneはテストアカウントの利用方法確認後に実施する。[工程記録・実機手順](../development/phases/foundation-02-03a-cloud-auth.md)。
