# 上流の出典と変更表示

`upstream/`はSupabase公式リポジトリの固定コミットから取得した設定・初期化SQL・runtime参考ソースです。

- Repository: https://github.com/supabase/supabase
- Tag: self-hosted/v0.8.4
- Tag object: 3f8e6c2e2bdca35bd6eacc8b7782aa73acb58ebc
- Commit: 189adda99d1b56da55fc5a6ee3f849354aaea92a
- ライセンス: [Apache License 2.0の原文](UPSTREAM-LICENSE)。原ファイルの帰属コメントも維持。
- 元パス・Git blob SHA・取得時SHA256は[manifest](upstream-manifest.json)を参照。
- TypeScript参考ソースは`.ts.source`へ改名。2ファイルは末尾空白・余分な最終空行だけ正規化し、manifestに元SHA256と保存後SHA256・変更内容を記録。処理内容は変更していない。Expoの型検査対象へ混入させない。runtimeへ復元する作業は未実施。

`compose.design.yml`は上流docker/docker-compose.ymlから派生したLittleDiary設計案。コメント除去、専用project、container名削除、volume分離、明示bind、LD_変数、digest固定、Mailpit追加、restart無効、pull_policy=never等を変更しています。Supabase公式配布そのものではありません。

イメージ本体は取得・配布していません。12種のdigestは公開レジストリのmanifest HEADで照会した値です。各イメージ内のライセンス・第三者NOTICE・SBOMを網羅した監査は未実施。将来の取得・配布前に各image digestに対応するライセンスを確認すること。Docker Desktopの利用資格・契約条件をこのファイルで判断しません。
