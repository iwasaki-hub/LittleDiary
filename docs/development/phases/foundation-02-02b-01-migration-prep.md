# Foundation 2-2B-1：Supabase migration適用準備

- 日付: 2026-11-09（JST）
- 状態: 正式migrationファイル生成・未適用 / 隔離検証計画作成 / 公開設定の確認待ち
- ブランチ: chore/foundation-02-02b-01-migration-prep
- 基準main: 727f0b13b7d8c44c6e39c043cc2605403062d9f6
- 対象候補: kllghkmudpcwbnjsodtx（LittleDiary・東京）だけ

## 目的・開始条件
承認済み設計を正式なmigrationとして準備し、安全な適用前条件を明文化する。AGENTS・Codexフロー・Foundation 2-1/2-2A・Supabaseスキルを確認。PR #13 merged、クリーンなmainを確認してff-only同期、専用ブランチを作成。
リモートDDL/DML、migration適用、Auth変更、A/Bユーザー作成、データ投入／削除、デプロイ、UI変更は実施しない。

## 読み取り専用の現状調査
MCPは対象refだけにSELECTとlist_migrationsを実施。SQLの変更文は実行していない。

| 調査項目 | 結果 |
| --- | --- |
| publicテーブル／policy | 0件／0件 |
| migration履歴 | 0件 |
| 調査実行ロール | current_user=postgres、session_user=postgres。後続CLI適用時の実行ロールの保証ではない |
| publicスキーマ権限 | anon/authenticated USAGE=true、CREATE=false |
| public既存テーブル権限 | 0件。テーブル未作成のため |
| public既定ACL | postgres/supabase_admin所有でanon/authenticated等への広い自動付与あり |
| 公開Auth設定GET | HTTP 200、signup有効・email有効・phone無効・mailer_autoconfirm=false |
| 匿名Auth | 公開settingsのexternal匿名設定はfalse。管理画面の詳細や将来の変更は適用前に再確認 |
| Data API有効化／public公開 | **未確認**。公開キーのルートメタデータGETは401 Secret API key required。秘密キー取得へ切り替えない。API無効・RLS拒否と断定しない |

Data APIのpublic公開、有効状態、アクセス権は対象プロジェクトのDashboardでユーザーが読み取り確認する。設定変更が必要と判明したら、その変更と影響を報告して作業を停止し、別承認を得る。今回は変更の必要性を確定できていないため、ファイル準備だけを進めた。
テストA/Bは専用メール確認済みユーザー推奨。メールを受信できる管理者と確認手順が必要で、autoconfirmや匿名サインインをテストの都合で変更しない。

## CLI調査と正式migration
- 実バージョン: Supabase CLI 3.0.0（npx.cmd supabase@latest --version）。Node v26.13.0。
- --help、migration new --help、init --help、db reset --help、db push --help、start --helpを確認。
- 実行: `npx.cmd supabase@3.0.0 migration new foundation_test_entries`
- [生成した正式SQL](../../../supabase/migrations/20261108171752_foundation_test_entries.sql)
- ファイル名はCLIが実際に生成した値を維持。文書の日付はJST、CLIの時刻付きファイル名とは区別する。
- [承認済みproposal](../../architecture/sql/foundation-test-entries.proposal.sql)と比較し、先頭2行の未適用コメント以外のSQL本文は完全一致。
- 対象: public.foundation_test_entries、user_id index、4つのpolicy、当該テーブルの権限だけ。既存schema USAGEやglobal defaultsは変更しない。列権限・RLS ENABLE/FORCE・UPDATE USING/WITH CHECKを維持。
- ON DELETE CASCADEはSQLに含まれるが最終採否は未承認、実適用前ゲートに残す。
- supabase/.gitignoreで.temp/.branches/.env*を除外。READMEで未適用を明示。config.toml・remote linkは未作成。プロジェクト依存の追加はせず、今後の手順はnpxの3.0.0指定で固定。

### CLI v3の注意
公式変更履歴を確認。DB操作は既定ローカル、remote指定が明示化され、Hosted変更は追加同意が必要。db pushはvault secretsも扱うため、後続は適用内容を確かめ--skip-vaultを検討する。既定値と確認プロンプトだけを安全保証にしない。本工程ではlink/db push/db reset/config push/startを実行していない。

## ローカル隔離環境の検証計画（未実行）
### 環境と承認前確認
Docker CLI29.9.2は存在するがLinux engineのpipeがなくdocker versionは終了コード1。エンジン起動・image pull・container起動は行わなかった。
後続でユーザーと次を確認してから構築する:
- Docker Desktop Linux containers、専用Compose相当のスタックはSupabase CLI管理（手書きComposeとの二重管理なし）。
- 作業場所はGit除外の.expo/supabase-isolatedを候補とし、remote linkなし、実Supabase資格情報を渡さない。
- 候補ポート: API55321、DB55322、Studio55323、ローカルメール55324、shadow DB55320。analytics/pooler等の不要サービスは無効化を検討し、init生成configの全ポートを実際に確認。すべてloopbackへ制限し、競合・外部露出を確認。
- 資源目安はCPU4・RAM8GiB・空きディスク20GiB以上。これは計画値で、現在の割当／消費量は未確認。image・volume・ネットワーク名と停止後の扱いを合意。
- CLI3のinitが生成するconfigの設定キーを確認し、上記ポート・project_id=littlediary-foundation-isolated・seed無効を設定してレビューする。configはremoteへpushしない。

### 承認後の操作手順案
以下は手順であり今回未実行。起動時にmigrationが適用される可能性もあるため、local startの承認はローカル適用を含めて取得する。
1. 隔離workdirを作り、`npx.cmd supabase@3.0.0 init --workdir .expo/supabase-isolated`。生成configをレビュー・資源／ポートを確認してから、正式migrationをそのworkdirのsupabase/migrationsへコピーしハッシュ照合。
2. `npx.cmd supabase@3.0.0 start --workdir .expo/supabase-isolated`。ローカルstatusのURLが127.0.0.1等であることを確認。ステータスに含まれるキーは記録しない。リモート用.env.localをテストへ読み込まない。
3. ローカル専用DBでcatalogを読み、4列の型/default/FK、index、RLS/FORCE、4policy、table/column privilegesを照合。anonの全table権限なし、authenticatedのINSERT(user_id,content)、UPDATE(content,user_id)、SELECT/DELETEのみであることを確認。
4. migration適用の再現は `npx.cmd supabase@3.0.0 db reset --no-seed --workdir .expo/supabase-isolated`。これは全ローカルDBを作り直すため専用隔離環境だけに使用。--remoteやリモートURLは絶対に付けない。
5. ロールバック検証はまず隔離DBの単一接続で、SQL本文のBEGIN/COMMIT内を実行して最後をROLLBACKにした使い捨て検証を行い、catalogで表不在を確認する（正式ファイルは書き換えない）。通常適用後の復旧はmigrationのdown自動生成を仮定せず、データ不要と合意した隔離スタックの破棄・再作成、または別レビュー済み補償migrationで行う。両者を区別する。
6. ローカルメール環境で専用ユーザーA/Bを作成・確認し、本物のAuth JWTを取得。persistSession=falseの別クライアントA/Bと未認証Nを用意。匿名Authは有効化しない。ローカルユーザー作成も今回未実施。
7. [承認済みテスト表](../../architecture/supabase-rls.md)に従って所有行CRUD、他人行SELECT0件・UPDATE/DELETE0件、user_id改ざん拒否、偽所有者INSERT拒否、id/created_at列拒否、未認証拒否をassert。操作後はAで再読し不変を確認。service-roleやSQL管理者を試験クライアントに使わない。
8. run_id相当の識別子と生成idをメモリで追跡し、自身のテスト行だけ削除、他人行や表全体を削除しない。A/Bユーザーcleanupとvolume破棄は事前承認した対象のみ。結果を記録しスタックを停止する。JWT・メール・パスワード・キーは出力しない。

## 実適用前の安全確認と明示承認条件
- 適用先はkllghkmudpcwbnjsodtxだけ。プロジェクト名・東京・ref・実行ロールを再照合。
- Data API有効化とpublic公開が確認できること。変更が必要なら変更対象と影響を先に承認。
- 同名表・policy・indexがないこと、既定ACL・ロール継承が想定通りであることを再調査。
- このmigrationの最終コミットSHA・ファイルハッシュ・対象オブジェクトと新表だけのGRANTをレビュー。
- CASCADEの採否、A/B作成方式、メール確認、権限／保持期間、試験行は試験完了後に削除する案、ユーザーcleanup対象を明示承認。
- SQL失敗は同一トランザクションのrollbackと履歴／catalogを確認。部分成功を推測して再実行せず調査。成功後の取消はデータ保持とFK依存を確認して別承認の補償migration。remote reset/dropを復旧方法にしない。
- ローカル隔離試験の実測結果をレビュー後、リモートDDL適用、リモートA/B作成、CRUD／cleanupの各範囲をユーザーが明示承認する。本準備PRの承認・マージだけでは適用しない。

## 検証結果
- TypeScript: 成功、終了コード0。
- ESLint: 結果は最終欄へ追記。
- 既存単体テスト: 3/3成功、終了コード0。
- Expo Doctor:20/20成功、終了コード0。
- SQL差分:先頭コメント以外はproposalと完全一致。SQLの構文・権限机上レビューを実施、実行・パーサ検証は未実施。
- Docker engine停止のためローカル適用・rollback・実JWT・cleanupはすべて未実施。
- Data API公開設定の未確認を維持。Auth設定変更は行わない。

## 再利用知見・次工程
CLIのmajor変更と実helpを先に確認する。migration newはファイル作成であり適用ではない。読み取りの調査ロールと将来の適用ロールを区別する。隔離環境のstart/resetもデータ変更なので、資源・ポート・対象を合意してから進める。Data API・GRANT・RLS・JWTを別々に証明し、不明な設定を既定値で補完しない。

## 参考資料
- https://supabase.com/changelog.md
- https://supabase.com/changelog/supabase-cli-v3
- https://supabase.com/docs/guides/local-development/cli/getting-started
- [承認済み設計](../../architecture/supabase-schema.md)

## 最終確認
- ESLintも終了コード0。
- Markdown相対リンクは全件解決、git diff --check成功。
- SQL本文は承認済みproposalと完全一致、新表以外のGRANT／RLS無効化／SECURITY DEFINERなし。
- migration SHA256（LFの作業ファイル）: 7bb8814eb3bdfca787b23ceff24b62c11ccc2c31769a10a986cf89e72a049cae。適用時はcheckoutの改行差も確認し、コメント以外のSQL比較と合わせて使う。
- supabase/.temp/cli-latestはgit check-ignoreで除外を確認。
- src・app.json・package.json・lockfile・既存architecture資料はorigin/mainと差分なし。
- npmのCLI取得中にjose取得の一時的ECONNRESETで遅延したが最終取得成功。プロジェクト依存更新なし。
- リモート適用・Auth変更・ユーザー／データ作成削除なし。PR作成後はレビュー待ちで停止。
