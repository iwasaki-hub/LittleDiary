# Foundation 2-2B：Docker限定公開方式の設計・検証記録

- 日付: 2026-11-09 JST
- 状態: 設計レビュー待ち。HTTP最小検証合格、Supabase限定公開は未解決
- 担当: Codex（別端末結果はユーザー報告）
- ブランチ: docs/foundation-02-02b-docker-network-design
- 基準main: b255d6b2fc0b6350a0bce196a4bc8d6650b54699（ff-only同期・開始時クリーン）
- 環境: Windows 11 Home、Docker Desktop 4.98.0、Engine 29.9.2、WSL2、Supabase CLI 3.0.0、Compose 5.6.1

## 目的・スコープ

過去の実測を保存し、全ポートをIPv4 loopbackに限定する設計を比較する。今回の変更は文書とHTTP再現用YAMLだけ。アプリ・SQL・依存・Docker環境・既存volumeは変更しない。リモート接続、再起動、migration/reset、Auth/CRUD、デプロイ、PRマージを行わない。

## 過去の実施記録：CLIによるSupabase（公開範囲不合格）

前工程で承認を受け実施した操作であり、今回再実行していない。

```powershell
docker network create --driver bridge `
  -o "com.docker.network.bridge.host_binding_ipv4=127.0.0.1" `
  littlediary-local-network

# 以下のCLI操作はGit除外の専用workdir内で実行
npx.cmd supabase@3.0.0 init --workdir .
# 生成configを調整し、正式migrationをコピー・ハッシュ一致確認後
npx.cmd supabase@3.0.0 start --workdir . `
  --network-id littlediary-local-network `
  --exclude realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor

# 公開範囲不合格のため実施した終了処理
npx.cmd supabase@3.0.0 stop --workdir . `
  --project-id littlediary-foundation-isolated
```

実configの保存場所は.expo/supabase-isolated/supabase/config.toml。project ID=littlediary-foundation-isolated、DB17、API55321・DB55322・Studio55323・Mailpit55324・shadow55320、seed無効。Realtime/Storage/Edge Runtime/Analytics/Pooler等を無効化し、リモートenv参照・linkは渡していない。生成configはこのPRへコピーせず、将来のテンプレートとは区別する。

- 起動直前の利用可能RAMは8.128 GiB。起動中の観測例は3.355 GiB、停止後4.043 GiB。起動コマンドは終了コード0。
- 7コンテナ: supabase_db / auth / rest / kong / inbucket / studio / pg_meta（各名前のsuffixはlittlediary-foundation-isolated）。全て専用ネットワークだけに所属。
- network inspectはbridge、host_binding_ipv4=127.0.0.1、EnableIPv6=false。
- 実公開はAPI55321・DB55322・Studio55323・Mailpit55324ともHostIp=0.0.0.0と::。Auth・REST・metaはホスト公開なし。
- 不合格を検出後、catalog調査前に専用スタックを停止。終了コード0、専用コンテナ残存0。
- supabase_db_littlediary-foundation-isolatedボリュームと専用ネットワークは保持。
- **migration適用状態は未確認**。start成功をテーブル・権限・RLS検証成功とは扱わない。
- 停止直後127.0.0.1:55322、PID0のエントリを観測。その後の読み取り調査ではTCPエントリ0、portproxy登録なし。ログに転送削除あり。由来は未確定でPID0を原因と断定しない。
- リモートSupabaseへの接続・変更なし。reset・A/B作成・CRUD未実施。

## 過去の実施記録：HTTP明示bind（合格）

実際に使用したのは**docker run**。Compose YAMLが自動生成されたわけではない。

```powershell
docker pull nginx:alpine
docker run --rm -d `
  --name littlediary-bind-probe `
  --network littlediary-local-network `
  -p 127.0.0.1:55329:80 `
  nginx:alpine
docker inspect littlediary-bind-probe
docker port littlediary-bind-probe
Get-NetTCPConnection -LocalPort 55329 -ErrorAction SilentlyContinue |
  Select-Object LocalAddress, LocalPort, State, OwningProcess
curl.exe --noproxy '*' --connect-timeout 2 --max-time 5 http://127.0.0.1:55329/
# LAN試験では実測時のWindows Wi-Fi IPv4を使用。個別IPはGitに保存しない
curl.exe --noproxy '*' --connect-timeout 2 --max-time 5 'http://<Windows-LAN-IPv4>:55329/'
curl.exe --noproxy '*' --connect-timeout 2 --max-time 5 -g 'http://[::1]:55329/'
docker stop littlediary-bind-probe
```

- 起動前RAM7.813 GiB。これはHTTP1個の実測で、Supabase用の8 GiB条件を満たしたという記録ではない。
- 公式nginx:alpineを取得。digest=sha256:713fc2ebfd92e8217db451477182ee91944b123d2b1ee9fd5a8c6e91ca6c3a11。
- HostConfig.PortBindings / NetworkSettings.Ports両方が127.0.0.1:55329のみ。mountなし、専用networkだけに接続。
- WindowsのTCPエントリは127.0.0.1:55329、所有プロセスはDocker backend。PowerShellのState表示が空だったため、状態名を断定しない。
- localhostはHTTP200・curl終了0（再確認も200）。Windows自身のLAN IPではHTTP000・終了28（timeout）。IPv6 localhostではHTTP000・終了7（接続失敗）。IPv6 wildcard公開なし。
- **ユーザー最終報告**: 起動中に同一LANの別端末からアクセスしても表示されず、接続不可を確認。初回の「表示された」という回答はユーザーが訂正し、起動中の確認だったと明示した。Codex自身による別端末操作ではない。
- 以上から当該HTTPコンテナの検証は合格。Supabase本体や全ネットワーク条件への一般保証ではない。
- stop成功、--rmでコンテナ残存0、55329のlistener相当エントリ0。停止後のlocalhostはcurl終了7。
- 既存コンテナ4個・既存volume2個・専用DB volumeは前後一致。専用networkのIDと設定も維持。
- **例外**: 標準bridgeのIDには前後差異を観測。network変更コマンドは実行していないが、原因は未確定。全ネットワーク不変だったとは記録しない。

## 原因調査・設計判断

確認済み: CLIのnetwork-id伝播、HostIpを省略する公開引数、Desktopの全アドレス転送ログ、default-port-binding設定、WSL2。未確定: ネットワーク既定bindを採用しなかった内部原因、停止後の一時的待受、標準bridge ID差異。

[方式比較・サービス要件・復旧設計](../../architecture/docker-local-supabase.md)でA～Dを比較。全公開ポートを明示する専用Composeを推奨方針とした。ただし公式self-hostingの現在のgatewayはEnvoyでMailpitも含まず、CLIの7サービスとは一致しない。完全な依存・設定・初期化・鍵管理を設計せずにSupabase YAMLを作らない。

今回作成した[HTTP compose.yml](../../../docker/littlediary-local/compose.yml)は手作業の再現用設計で**未起動**。[利用説明](../../../docker/littlediary-local/README.md)も追加。秘密値なし、実測digest固定、external network、host_ip明示。将来のSupabase全体構成の代用にしない。

## 今回の検証結果

- npx.cmd tsc --noEmit: 成功、終了コード0。
- CI=1のnpx.cmd expo lint: 成功、終了コード0。
- node --test tests/supabase.test.cjs: 3/3成功、終了コード0。
- npx.cmd expo-doctor: ネットワーク権限下の再実行で20/20成功、終了コード0。最初の通常sandbox内の試行はnpm registryの名前解決がENOTFOUNDで失敗した。検証失敗を隠すコード変更はしていない。
- docker compose -f docker/littlediary-local/compose.yml config --quiet: 成功。config --format jsonでもサービス1個・host_ip=127.0.0.1・公開55329だけ・external network・volumeなしを確認。起動はしていない。
- 新規Markdown3文書の相対リンク13件: ファイルの存在を全件確認。
- git diff --cached --check: 成功。対象は新規4ファイルだけ。src・supabase・app.json・package.json・package-lock.jsonにmainとの差分なし。
- 新規YAMLの実動作、Supabase明示bind、DB catalog/RLS/実JWT、iPhone操作は今回未実施。過去のHTTP実測を新規YAMLの実行結果に流用しない。

## 振り返り・再利用知見

要求値HostConfigと実公開NetworkSettings、Windows転送、別端末試験を分ける。localhost成功やinspect表示だけで外部非公開と判断しない。ユーザー報告の訂正は最終確認と観測者を明記する。DB volumeを管理方式変更の都合で直接再利用しない。公式self-hostingとCLIのサービス差を調べ、欠落したYAMLを完成扱いにしない。Compose configの成功と実動作を区別する。

## 次工程・承認条件

完全なSupabase構成・公式版・gateway選択・メール・秘密値生成・新規volumeとmigration運用を別レビューする。公開検証前にLittleDiaryのmigrationを自動適用しない。起動・初期化・停止と保持範囲の明示承認後、RAM/ポート確認→全HostIp→Windows待受→localhost→LAN/別端末→合否判定→許可範囲のDB確認→専用停止の順に進む。不合格ならDB調査前に専用停止。reset・Auth・CRUD・cleanup・リモート適用は今回も未承認。

## 参考・履歴

- [Foundation 2-2A](foundation-02-02a-db-design.md) / [2-2B-1](foundation-02-02b-01-migration-prep.md)
- 公式資料と固定ソースのURLは[設計書](../../architecture/docker-local-supabase.md)の公式根拠に集約。
- 過去の試験と今回の設計PRを混同しない。今回Docker環境・既存DBには変更を行っていない。
