# LittleDiary 専用Supabase Compose詳細設計

**DESIGN ONLY / 未起動・未検証。現段階では起動しない。** [compose.design.yml](compose.design.yml)はレビュー用の構成案であり、完成した実行環境ではない。秘密値生成・Windowsでのruntime asset準備・初期化の実行検証が残る。通常名compose.ymlにしていない。今回はconfig検証だけを行った。

[工程記録](../../docs/development/phases/foundation-02-02b-03-compose-design.md) / [前工程の方式比較](../../docs/architecture/docker-local-supabase.md) / [検証計画](VERIFICATION.md)

## 固定した上流とGateway

Supabase公式ガイドが案内するself-hosted/v0.8.4（2026-11-05）を設計基準に採用。無条件のlatestではない。タグobjectは3f8e6c2e2bdca35bd6eacc8b7782aa73acb58ebc、実コミットは**189adda99d1b56da55fc5a6ee3f849354aaea92a**。初期化・設定は実コミットから取得し、[manifest](upstream-manifest.json)に元パスとblob SHA・SHA256を記録した。

Gatewayはこの版の既定Envoy v1.39.6を選定。公式CHANGELOGではKong overrideを将来廃止予定とし、Envoy側にセキュリティ・DNS再解決修正がある。固定版には公式docker-compose.kong.ymlも存在し、Kong 3.9.3、declarative config、Lua/plugin、HTTP8000/HTTPS8443へ切替可能だが今回は使用しない。従来CLIのKong2.8.1と同等ではない。

Envoyはenvoy.yamlが動的CDS/LDSを読み、cds.yamlのservice DNS、lds.template.yamlの認証・routeをentrypointが置換する。4ファイルを全て保存し、Auth・REST・Realtime・Storage・Functions・Studio/meta等の宛先を抜粋して欠落させない。alias kong/envoyとrealtime-dev.supabase-realtimeを専用ネットワーク内だけに残す。コンテナ内の0.0.0.0 bindは内部待受であり、Windowsの公開HostIpとは区別する。

上流11サービスを維持し、SMTP確認用Mailpit1サービスを追加した12サービス案。Analytics/Vectorは上流の追加overrideなので含めない。Edge Runtime/Storage/Realtimeを含むのは依存・routeを不完全に削ることを避けるためであり、LittleDiaryの新機能を追加した意味ではない。必要資源がCLI7サービスより増えるため、実起動可否は未判断。

## サービスと依存・公開

| service / image tag | 主な依存 | ホスト公開 |
| --- | --- | --- |
| studio / supabase/studio:2026.11.02-sha-a05e7ec | meta・DB（設定参照） | なし。認証付きGateway経由 |
| api-gw / envoyproxy/envoy:v1.39.6 | studio healthy、全route先 | 127.0.0.1:55321 → 8000 |
| auth / supabase/gotrue:v2.197.0 | db healthy、mailpit healthy | なし。内部9999 |
| rest / postgrest/postgrest:v14.18 | db healthy | なし。内部3000、adminはコンテナlocalhost |
| realtime / supabase/realtime:v2.148.3 | db healthy | なし。内部4000 |
| storage / supabase/storage-api:v1.89.12 | db・rest・imgproxy | なし。内部5000 |
| imgproxy / darthsim/imgproxy:v4.0.21 | storage-data volume | なし。内部5001 |
| meta / supabase/postgres-meta:v0.100.0 | db healthy | なし。内部8080 |
| functions / supabase/edge-runtime:v1.77.9 | api-gw healthy、DB設定 | なし。内部9000 |
| db / supabase/postgres:17.6.1.136 | 上流初期化SQL | 127.0.0.1:55322 → 5432 |
| supavisor / supabase/supavisor:2.9.13 | db healthy、pooler.exs | なし。内部5432/6543 |
| mailpit / axllent/mailpit:v1.31.3 | なし | 127.0.0.1:55324 → 8025。SMTP1025は内部のみ |

[images.lock.json](images.lock.json)に12種全ての実際のmanifest digestを保存。manifest HEAD照会だけで、イメージpull/buildはしていない。index digestは固定できても実行OS/archの適合・脆弱性・正常起動を証明しない。Windows Linux containers / linux-amd64を次工程で検証する。

公開は上記3ポートだけでhost_ipを明示。55320 shadow DB、55323 Studio直公開、55325～55329は**未使用**。CLIのshadow自動生成をこの構成に流用しない。TLS8443やPooler公開もなし。新しいshadow/HTTPS等が必要なら追加設計・明示bind・別承認。調査時55320～55329のTCP待受なし、IPv4/IPv6のOS予約範囲にも該当なし。ただし将来起動時に再測定する。

単一ファイルなので上流のportsがマージで残る問題を避ける。将来overrideを追加する場合は単なる追記でなく!override等の対応仕様で置換し、解決後の全portsを検査する。

## 専用資源の分離

- Compose project: littlediary-supabase-design。project名を任意上書きして既存環境と混ぜない。
- 専用network: littlediary-supabase-design_default（新規・非external、bridge、IPv6無効）。littlediary-local-networkを使わない。
- 新規volume5個: project prefix付きdb-data、db-config、deno-cache、storage-data、snippets。existing名やexternal volumeは定義しない。
- 保持中CLI DB volume、既存コンテナ4個・volume2個へ接続・変更しない。volume driver_optsでホスト既存パスへ転送もしない。
- 上流のDBdata/storage/snippetsホストbindを専用named volumeへ変更。設定とSQLはread-only bind、create_host_path=falseで存在しなければ失敗させる。Docker socketやhost networkなし。
- restartはno、pull_policyはnever。起動承認後のimage取得も別操作として承認する。これらは悪意ある起動を防ぐアクセス制御ではない。

## DB初期化とmigration

Postgresイメージ内のSupabase bootstrapが拡張・基本ロールを用意し、空のPGDATAに限り保存した上流SQLと各サービス自身の内部migrationが追加初期化する。イメージ内bootstrapの全DDL・拡張バージョンの実測は未実施であり、catalogで確認が必要。

| 上流SQL | mount先・役割 |
| --- | --- |
| _supabase.sql | migrations/97-_supabase.sql。内部DB作成 |
| realtime.sql | migrations/99-realtime.sql。_realtime schema |
| logs.sql / pooler.sql | migrations/99-logs.sql / 99-pooler.sql。内部schema |
| webhooks.sql | init-scripts/98-webhooks.sql。supabase_functions・pg_net・trigger等 |
| roles.sql | init-scripts/99-roles.sql。authenticator等のパスワードをコンテナenvから設定 |
| jwt.sql | init-scripts/99-jwt.sql。app.settings.jwt_exp設定 |

上流SQLは改変せず、source hashを確認する。Supabase内部の初期化とLittleDiaryのアプリmigrationを分ける。既存のfoundation_test_entries migrationはmount・コピー・起動時適用を**しない**。CLIの17.11.0.011と今回の17.6.1.136にはminor/extension差があり、同じPG17でもCLI物理volumeは互換保証がないので直接mountしない。

初期化済みDBへのLittleDiary SQL適用は別工程。専用の履歴テーブル・checksum・transaction・実行ロール・失敗復旧を設計し、Supabase CLIの履歴と同一と仮定しない。CLI3のremote URL指定をローカル接続へ転用しない。dump/restore、reset、CASCADE試験も今回未承認。

## 秘密値の生成・保管設計（今回未生成）

[.env.example](.env.example)は49個のLD_変数の**プレースホルダーだけ**。そのまま起動しない。実値はこのディレクトリの.local/secrets.envへ保存しGit除外、Windows ACLを本人だけに制限する設計。Composeは環境変数に展開するため、Docker管理権限者は閲覧可能であり、Docker secretsによる暗号化保管だとは扱わない。

次工程でレビューするローカル専用ジェネレーターの仕様:

1. Node crypto等のOS CSPRNGで、DB/dashboardパスワードは32byte hex、JWT secretは32byte以上、SECRET_KEY_BASEは48byte base64、VAULT_ENC_KEYは32文字、PG_META_CRYPTO_KEYは32文字、Realtime DB keyは上流に合わせ16文字、S3 key/secretは32/64文字を生成する。URLに埋め込むDBパスワードはhexに限定しescaping事故を避ける。
2. HS256のanon/service_role JWTを同じローカルJWT secretから生成する。role・iss・iat・expを明示し、有効期間を運用承認する。リモートのpublishable/secret keyをコピーしない。
3. この案はlegacy HS256方式を設計基準とする。opaqueキー・asymmetricキー・JWT_JWKSは空とし、必要なら公式add-new-auth-keysの方式を別レビューする。empty JWKSを設定してHS256 fallbackを壊さない。
4. 上流generate-keysはOpenSSL＋shellを使い秘密値をstdoutへ表示し、add-new-auth-keysにはDocker fallbackがある。今回は両方未実行。安全なWindowsジェネレーターは**未実装**であり起動ブロッカー。transcript、コマンド引数、Git、PRへ秘密値を出さず、上書き拒否・原子的書込み・ACL確認・生成後整合性検査を必須にする。
5. 通常値はPOSTGRES_HOST=db、PORT=5432、DB=postgres、PUBLIC/API URL=http://127.0.0.1:55321、mailer URL path=/auth/v1/verify、phone/anonymous無効、メール確認有効、OPENAI空。Studio名・tenant/bucket名はローカル用だけにする。JWT/API keyとDB/サービス間の整合性を検査する。
6. LD_以外の既存SUPABASE/PG/DATABASE_URL/EXPO_PUBLICや.env.local・remote linkは読み込まない。実行wrapperは許可したLD_変数と専用env-fileだけを使い、DBhost/URLがローカル設計値と一致しなければ拒否する。wrapperは未実装、直接docker compose upを案内しない。

全ての秘密変数はYAMLの必須補間にし、既定パスワードを削除した。LD_DESIGN_APPROVALも必須だが、単なる誤操作防止でありユーザー承認の代わりにはならない。値を知るだけで起動を許可する仕組みとは扱わない。

## 未完了のruntime準備とWindows固有事項

runtime用TypeScriptはupstream/functionsの.ts.sourceとして保管。2ファイルはdiffチェックのため末尾空白だけ正規化し、上流と保存後のhashをmanifestに併記した。Expo型検査/Lintの対象へ入れない。承認後に専用.local/functionsへ.ts名で復元する準備処理を作る。現在未作成なので、bind先が存在せず**このまま起動不可**。StudioとFunctionsの両方が同じreadonly sourceを使う案。これらは公式runtimeの参考ソースであり、アプリのAI/日記機能ではない。

shell/SQL/templateは.gitattributesでLF固定。Windows bind mountのファイル種別・CRLF・権限、Envoyがreadonly configディレクトリ内に生成するlds.yamlの書込み、Supabase imageのinit順序、Mailpit readyzの実healthcheckを次工程で検証する。read-onlyディレクトリ全体ではなく上流同様ファイル単位mountとしたが、動作確認済みとはしない。失敗しても既存DBを流用しない。

## 静的検証の実行（Docker資源を変更しない）

リポジトリルートで`node docker/littlediary-supabase/validate-static.cjs`。現在のプロジェクトに存在するjs-yamlを検証用に使い、依存追加はしていない。LD_検証用ダミーを子プロセスのメモリだけで渡してdocker compose configを呼び、解決済み全設定をログやファイルへ出さない。既存のリモート変数は子環境から除外する。実値ファイルを作成・使用しない。

この検査は依存先・healthcheck定義・12digest・3bind・5volume・source hash・名前分離を検査する。ダミーでコンテナを起動しない。鍵署名、初期化SQLの実行、各サービスのhealth、LAN非公開を証明しない。

## 出典

- [公式self-hosting](https://supabase.com/docs/guides/self-hosting/docker) / [固定版CHANGELOG](https://github.com/supabase/supabase/blob/189adda99d1b56da55fc5a6ee3f849354aaea92a/docker/CHANGELOG.md)
- [上流Compose](https://github.com/supabase/supabase/blob/189adda99d1b56da55fc5a6ee3f849354aaea92a/docker/docker-compose.yml) / [Kong override](https://github.com/supabase/supabase/blob/189adda99d1b56da55fc5a6ee3f849354aaea92a/docker/docker-compose.kong.yml)
- [Mailpit Docker](https://mailpit.axllent.org/docs/install/docker/) / [Compose ports](https://docs.docker.com/reference/compose-file/services/#ports)
- [帰属・変更表示](NOTICE.md) / [image digest lock](images.lock.json)
