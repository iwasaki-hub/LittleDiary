# Supabase migrations

CLI 3.0.0の公式migration newで生成したmigrationを管理する。現在は準備のみで、適用済みではない。

- 対象候補: kllghkmudpcwbnjsodtx（LittleDiary・東京）
- リモートへの適用・link・Auth変更は未実施。
- ON DELETE CASCADEは提案状態。ファイルに含まれるが実適用前の明示承認が必要。
- config.tomlはまだ作成していない。隔離スタックのポート・資源を合意してから別のローカルworkdirでinitする。
- .tempや認証情報は管理しない。migrationの変更・追加はコードレビューする。

[事前調査・隔離検証・実適用ゲート](../docs/development/phases/foundation-02-02b-01-migration-prep.md)
