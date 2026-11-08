# Foundation 2-2A：Supabaseスキーマ・RLS設計

- 日付: 2026-11-09（JST）
- 状態: 設計レビュー待ち。SQL未実行、DB・Auth・テストユーザー未変更
- ブランチ: docs/foundation-02-02a-db-security-design
- 基準main: 074b69d8a9538d411bd8bf70e997e74a9f1b73ab
- 対象: LittleDiary / kllghkmudpcwbnjsodtx のみ

## 目的・背景・開始条件
Foundation 2-1の接続基盤を前提に、テストテーブルのアクセス制御を設計する。AGENTS、Codexフロー、アーキテクチャ、前工程記録とSupabaseスキルを確認。PR #11 merged、クリーンな作業ツリーを確認しmainをff-only同期して専用ブランチを作成。
現行UI・依存・設定・既存docsを維持。実テーブル、policy、GRANT、Auth設定、ユーザー、データを作成／変更しない。

## 成果物
- [スキーマ設計](../../architecture/supabase-schema.md): 現状・カラム・FK／index・マイグレーション方針
- [RLS設計](../../architecture/supabase-rls.md): 権限と行条件、Auth比較、A/B/Nテスト表
- [未実行SQL案](../../architecture/sql/foundation-test-entries.proposal.sql): レビュー用でありマイグレーションではない

## 調査結果と方法（読み取り専用）
- MCP get_projectでACTIVE_HEALTHY、Postgres17.11.0.018を確認。
- list_tables(public): 0。pg_class/pg_namespaceのSELECTでも通常・partitionedテーブル0。
- pg_policies: 0。information_schema.role_table_grantsのpublic APIロール権限: 0。
- has_schema_privilege: anon/authenticatedはUSAGE=true、CREATE=false。
- pg_default_acl: publicでpostgres/supabase_adminが作るテーブルの既定権限にはanon/authenticatedへの広い付与あり。
- list_migrations: 0。ローカルsupabaseフォルダなし。既存履歴管理は未導入と判断。ただし別の場所での管理は不明。
- Auth公開settings GET: 200、email有効、phone無効、signup可、メール自動確認false。匿名ログイン専用設定の確認はできず未確定。
- Data APIルートメタデータGET: 公開キーでは401 Secret API key required。秘密キーを取得・使用せず停止。DBのpgrst.db_schemasの設定検索も0件で、公開スキーマ一覧／Data API有効化状態は確定できない。Dashboardの読み取り確認を適用前の必須条件に残した。

実行したSQLはpg_class、pg_namespace、pg_policies、information_schema.role_table_grants、pg_roles、pg_db_role_setting、pg_default_aclを対象にしたSELECTのみ。ユーザーデータ・auth.users行やサーバーファイルは読んでいない。複数SELECTをまとめた最初のツールは最後の結果だけを返したため、jsonb_build_objectの単一SELECTで空集合・権限を再確認した。
HTTP調査は.env.localの公開キーをプロセス内で使用し、真偽値とエラー種別だけを抽出。キー・パスワードは記録しない。他プロジェクトは問い合わせていない。

## 設計判断・安全性レビュー
- UUIDと日時はDB default、user_idはNOT NULL FK・明示入力。CASCADEを提案し削除時の影響を明記。B-tree indexを追加。
- 新規テーブルにだけREVOKEして既定GRANTをリセットし、authenticatedへ操作・列ごとの最小権限を付与。anon/PUBLICにはtableアクセスなし。
- 4policyすべて所有者条件と非NULL uidを使用。UPDATEにUSING/WITH CHECK両方。id/created_atは列権限で変更不可。
- 同一トランザクション内で作成・RLS有効化・FORCE・権限・policy設定。IF NOT EXISTSなしで既存同名表への誤適用を防ぐ。
- SQL構文はPostgreSQL17公式のCREATE TABLE／INDEX／POLICY、GRANT／REVOKEの形を机上レビュー。SQLパーサ／隔離Postgresでの実行による構文・動作確認は未実施。実DBへDDLを投げて構文チェックすることはしない。
- 新規名以外へのALTER TABLE・DROP・DML、全schema対象GRANT、既定権限変更、SECURITY DEFINERは案に含めない。auth.usersへのFKと親削除時のCASCADE、schema USAGEの再付与は影響として明示。

## Auth試験方針と未確定事項
専用テストユーザーA/Bを推奨。匿名Authは同じauthenticatedロールで自分の行へアクセスでき、JWTなしanonとは異なる。作成・設定変更・cleanupは承認後のみ。実JWTを使用し、返却件数と所有者再読で「他人行の操作0件」を検証する。DB管理者による成功を受け入れテストに流用しない。
Data API公開設定、匿名ログイン状態、テストユーザーの具体的準備、content制限／保持期間、CASCADE、CLI版・migration運用方式はレビュー／適用前確認事項。正式migrationは承認後に公式CLI migration newで生成し、proposalは直接自動適用しない。

## 検証
TypeScript・ESLint・既存単体テスト・Expo Doctorは本工程でも実行。結果は最終追記欄を参照。
SQL/RLSの実行・実JWTによる認可テストは未実施。接続基盤の単体テスト成功をRLS検証成功と扱わない。Markdown相対リンク・差分チェックを別途実施。

## 再利用知見・次工程
読み取りカタログ調査と実データアクセスを分離し、GRANTとRLS、API公開とスキーマ権限、anonと匿名Auth、0件と拒否エラーを区別する。不明な公開設定を既定値だと仮定せず記録する。設計案と実migrationを別ファイル・別承認工程にする。
次工程は本設計のレビューと明示承認、未確定項目の確認、隔離環境での実行・実認証試験計画の合意後に開始する。今回DB変更・テストデータ投入・Auth設定変更・テストユーザー作成・デプロイは行っていない。

## 参考資料
- https://supabase.com/changelog.md （直近Flutter/CLI変更を確認。今回CLI実行なし）
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://www.postgresql.org/docs/17/sql-grant.html

## 最終検証結果
- TypeScript: 終了コード0。
- ESLint: 終了コード0。
- 既存単体テスト: 3/3成功、終了コード0。
- Expo Doctor: 20/20成功、終了コード0。
- 新規3文書のMarkdown相対リンク: 全件解決。
- git diff --check: 成功。
- 変更対象は新規docs配下4ファイルだけ。SQL案は未実行、正式migration未生成。アプリコード・依存・設定・既存資料に差分なし。
