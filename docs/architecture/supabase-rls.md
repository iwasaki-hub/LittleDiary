# Supabase GRANT・RLS・Authテスト設計

**未適用／未テスト**。[対象と現状](supabase-schema.md)、[SQL案](sql/foundation-test-entries.proposal.sql)。認証UIやユーザー作成は本工程で行わない。

## GRANTとRLSの分離
GRANTは操作権限、RLSはその操作で対象にできる行を決める。いずれか一方で十分とは考えない。既存のスキーマUSAGE権限は変更せず、REVOKE/GRANTは新規テーブルだけに適用する。

| ロール | schema | テーブル／列権限 | RLS |
| --- | --- | --- | --- |
| PUBLIC | 既存schema権限は維持 | 新テーブルは全権限REVOKE | policyなし |
| anon（JWTなし） | 既存USAGE維持 | 全権限REVOKE | policyなし、読み書き拒否 |
| authenticated | 既存USAGE維持、CREATEなし | SELECT/DELETE、INSERT(user_id,content)、UPDATE(content,user_id) | 各CRUDでauth.uid()=user_idかつuid非NULL |

TRUNCATE、REFERENCES、TRIGGER、MAINTAIN、GRANT OPTIONは付けない。id/created_atはSELECTのみでAPIから指定・変更できない。UUIDにシーケンスGRANTは不要。
UPDATE(user_id)を許可するのはRLSのWITH CHECKで所有者変更を拒否する設計を直接テストするため。同じuser_idへの再指定は許される。さらに列権限でuser_idを完全不変とする代替案もあるが、その場合は所有者変更テストがRLS到達前に拒否される。

## RLS
ENABLE + FORCEを提案。4つの操作別policyはTO authenticatedに限定。SELECT/DELETEはUSING、INSERTはWITH CHECK、UPDATEは既存行のUSINGと更新後行のWITH CHECKを両方明示。
AのJWTならuid=A、user_id=Aの行だけに適用。BのJWTでA行は不可視でUPDATE/DELETE対象0件。Aが自身の行をuser_id=Bに変えるとWITH CHECK不一致で拒否。JWT欠落ではanon権限で拒否し、仮にuidがNULLでもpredicateはfalse。
SELECT policyはUPDATE/DELETEの可視性にも必要。複数のpermissive policyはORで広がるため、将来のpolicy追加時も4policyだけの前提を再評価する。USING(true)、TO public、SECURITY DEFINER、RLS無効化は使用しない。FORCEでもsuperuser/BYPASSRLSは免除されるため管理者での成功をユーザー権限テストとしない。

## AuthユーザーA/Bの選定
| 方法 | 利点 | 注意点 |
| --- | --- | --- |
| 専用テストユーザー2名（推奨） | 再ログイン・再現が容易、現状email利用可 | 承認後に専用メール・強固なパスワードで作成、メール確認が必要。資格情報をGit・ログへ保存しない |
| 匿名サインイン2回 | メール不要、実JWTを取得できる | anonymous Authユーザーもauthenticatedロール。anonアクセスの代用ではない。設定変更承認・濫用対策・保持／削除方針が必要 |

今回のpolicyは匿名Authユーザーでも自身の行にはアクセスできる。恒久ユーザーだけに制限するならis_anonymous claimを使う別設計の承認が必要。今回勝手に追加しない。ユーザーが編集できるuser_metadataを認可に使わない。
実JWTを偽造したりSQL Editorの管理セッションでrequest.jwt.claimsだけを置き換える検証を受け入れ試験の代用にしない。

## 承認後の実認証テスト計画（未実行）
別々のクライアントA/BをpersistSession=false、autoRefreshToken=falseで作り、本物のAuthログインで別々のaccess tokenを取得。公開キーだけのクライアントNはAuthorizationなし。tokens、メール、パスワードはログ出力しない。テストは機密情報を含まない識別マーカーと生成idだけを追跡する。

| 試験 | 期待結果・検証方法 |
| --- | --- |
| A: INSERT(user_id=A,content) + select | 1行を返す。UUID・日時default非NULL。idを保持 |
| A: idでSELECT | A行を1件読める |
| B: 同idでSELECT | errorなしでも0行。null/空配列を確認 |
| B: 同idをUPDATE(content) + select | 対象0行、Aで再読してcontent不変 |
| B: 同idをDELETE + select | 対象0行、Aで再読して行存続 |
| A: 同idのuser_idをBへUPDATE | RLS拒否、Aで再読してuser_id不変 |
| A: user_id=BでINSERT | WITH CHECKにより拒否、新行なし |
| A: 自分のcontentをUPDATE + select | 正常成功、更新後内容を再読 |
| B: 自分の行INSERT/SELECT/UPDATE/DELETE | 自分の操作が可能なことも確認。全拒否設定の誤検出を防ぐ |
| N: SELECT/INSERT/UPDATE/DELETE | 権限拒否。成功コードでも非可視行0件になるケースを区別し、A行不変を確認 |
| 不正／期限切れJWT | Auth/API層で拒否。RLSの結果と混同しない |
| id/created_atの指定・UPDATE | 列権限で拒否 |
| A: 自分のDELETE + select | 1件削除、再読0件 |

RLSで見えない行の操作はエラーでなく0件成功になり得る。HTTP 200だけで成功判定せず、.select()の返却件数と所有者による再読をassertする。WITH CHECK違反やGRANT拒否は通常42501系だがHTTPマッピングは実行時に記録し、想定値に固執してエラーを隠さない。Nに一時GRANTしてRLSだけを見る試験は不要。実ユーザー・テスト行の準備／cleanupは承認後のみ。

## リスク・運用
既定GRANT、ロール継承、追加policy、views／functions、service-roleによる迂回を確認する。今回新規view・functionは設計しない。対象テーブルの権限以外は触らない。認証ユーザー削除は既発行JWTの即時失効を保証しない。FK削除効果とtoken寿命は別々に考える。

## 公式根拠
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Data APIと権限](https://supabase.com/docs/guides/api/securing-your-api)
- [匿名Auth](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Postgres 17 GRANT](https://www.postgresql.org/docs/17/sql-grant.html)
