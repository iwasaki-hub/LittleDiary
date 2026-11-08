# Supabaseスキーマ設計：Foundation 2-2A

**設計案・未適用**。対象はLittleDiary `kllghkmudpcwbnjsodtx` のみ。調査日2026-11-09。承認前にSQLを実行しない。

## 読み取り調査で確認した事実
- ACTIVE_HEALTHY、Postgres 17.11.0.018、東京。publicの通常／partitionedテーブルは0、既存RLSポリシー0、対象テーブル権限0。
- anon/authenticatedはpublic USAGE=true、CREATE=false。
- publicのテーブル既定ACL（所有者postgres/supabase_admin）はanon/authenticatedを含む広い権限を付与。新テーブルにも権限が引き継がれる可能性があるため、本案では新規テーブルに限りREVOKE後に必要権限を付け直す。既定ACLは変更しない。
- Supabaseマイグレーション履歴0件。リポジトリにsupabaseディレクトリ／CLI migration設定なし。これは管理方式が未導入という判断の根拠だが、外部リポジトリや過去の手動操作の不在までは保証しない。
- Auth公開settings GETは200。email有効、phone無効、disable_signup=false、mailer_autoconfirm=false、phone_autoconfirm=false、SAML/passkeys無効。認証ユーザー／メール／秘密値は取得していない。
- 公開設定でenabled providerはemailのみ。匿名サインイン専用設定をManagement API/Dashboardで確認できていないため、匿名サインイン無効と断定しない。
- Data APIルートOpenAPI GETは公開キーでは401「Secret API key required」。秘密キーの取得・利用へ切り替えていない。DB内のpgrst.db_schemas設定も取得できず、**Data APIの有効化状態・公開スキーマ一覧・public公開は未確定**。401をData API無効やRLS拒否と断定しない。承認後の適用前にDashboardのData API settingsを読み取り確認する。

## テーブル案
| カラム | 型・制約 | 判断 |
| --- | --- | --- |
| id | UUID PRIMARY KEY、DEFAULT gen_random_uuid() | DBでUUID生成。シーケンス不要 |
| user_id | UUID NOT NULL、auth.users(id) FK | JWTの実ユーザーID。defaultなしで明示入力を要求しRLSで照合 |
| content | TEXT NOT NULL | テスト用の機密でない文字列。空文字は許可、長さ制限は未決定 |
| created_at | TIMESTAMPTZ NOT NULL、DEFAULT now() | DBの作成時刻。APIロールによる指定・変更は列権限で禁止 |

user_idにB-tree indexを作成。所有者フィルター・FK親削除時の参照検索に使用。idのPK indexと重複しない。
FKはON DELETE CASCADEを提案。Authユーザー削除時にそのテスト行を除去する。Auth削除を自動実行する設計ではなく、削除・クリーンアップ時の連鎖をレビュー対象に含める。RESTRICT案は孤立防止に有効だがテストユーザー削除を阻害するため今回は推奨しない。認証情報削除と既発行JWTの失効は同義ではない。

## SQL案・既存への影響
[未実行SQLファイル](sql/foundation-test-entries.proposal.sql)をレビュー用に保存。supabase/migrationsには置かない。
新テーブル・index・4policy・新テーブルへのREVOKE/GRANTを同一トランザクションにまとめ、権限だけが先に公開される期間を作らない。IF NOT EXISTSを使わず同名テーブルがあれば停止する。public全体や既存テーブルの権限・既定ACLを変更しない。既存のスキーマUSAGE権限は維持し、スキーマへのGRANT/REVOKEは行わない。権限変更は新規テーブルだけに限定する。
新規FKはauth.usersの主キーを参照するが、AuthスキーマのDDLやユーザー行変更は行わない。将来の親行削除時のみ連鎖削除となる。表所有者・superuser・BYPASSRLSの管理権限はクライアントの認可境界ではなく、テストには使わない。

## 承認後の実装計画（今回未実施）
1. 公開設定、同名オブジェクト不在、実行所有者の既定ACL／role継承を再調査。実行先refを確認。
2. CLI版と--helpを確認し、公式 `supabase migration new <name>` でマイグレーションを生成。レビュー済み案を転記して別PR化する。実プロジェクトの適用先指定と履歴を確認する。
3. ローカル隔離環境で適用・A/B認証テスト・advisorsを実行し、明示承認後に対象プロジェクトへ適用。今回のproposalを直接自動適用しない。
4. 実行後カタログと匿名／A／Bリクエストを照合。テスト行・ユーザーの削除も別の承認済みクリーンアップとして扱う。

未確定: Data API設定、匿名ログイン状態、テストユーザー作成方法、content制限、保持期間、CASCADEの最終承認、マイグレーションCLIのバージョン／運用方式。

[RLS・テスト設計](supabase-rls.md) / [工程記録](../development/phases/foundation-02-02a-db-design.md)
