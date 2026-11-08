# LittleDiary ローカルSupabaseの限定公開設計

- 調査日: 2026-11-09 JST
- 状態: 設計レビュー用。Supabaseでの明示bind構成は未実装・未検証。
- [工程記録・実測コマンド](../development/phases/foundation-02-02b-02-docker-network.md)
- [既存スキーマ設計](supabase-schema.md) / [RLS設計](supabase-rls.md)

## 設計判断

推奨方針はB: **公式self-hosting構成を特定版に固定し、専用Compose環境の全公開ポートにhost_ip: 127.0.0.1を指定する**。Docker全体設定に依存せず、構成をレビューできる。ただし以下のサービス差・秘密情報生成・DB初期化方式を解決するまでSupabase用YAMLを実行可能なものとして提供しない。今回のPRは起動承認ではない。

2026-11-09のnpm公開版とGitHub最新releaseはともにCLI 3.0.0。自動更新・依存更新はしない。Docker Engine 29.9.2、Desktop 4.98.0、Compose 5.6.1の調査結果を前提にする。

## 確認済み事実と未確定原因

CLI 3.0.0は--network-idを優先し、全起動サービスとPostgres/shadow DBに伝播する。Docker createの公開指定はhostPort:containerPortで、全公開ポートに対するホストIP指定オプションはhelpで確認できない。設定の数値port欄へ127.0.0.1:portを入れる方法や、インストール済みCLIの書換えは採用しない。

実測では専用ネットワークのhost_binding_ipv4=127.0.0.1、EnableIPv6=falseにもかかわらず55321～55324が0.0.0.0と::になった。全7コンテナは専用ネットワークだけに所属。Docker backendログも0.0.0.0への転送を記録した。localhost既定公開モードはdefault-port-binding、ネットワークモードはipv4only、バックエンドはWSL2だった。

これは「CLIが別ネットワークを選んだ」「IPv6ネットワークを有効にした」という説明には一致しない。DesktopのAPI処理・Engineの割当・転送処理のどこでネットワーク既定bindが使われなかったかは**未確定**。Desktopの設定が原因だとは断定しない。元のcreate API全体と起動出力は保存していない。

## 方式比較

| 方式 | 公式性・CLI整合性 | 公開ポート・IPv6 | データ・既存環境・復元 | 判断 |
| --- | --- | --- | --- | --- |
| A: CLI 3.0.0のまま明示HostIp | network-idは公式。全ポートのHostIp指定は公開APIで未確認。CLI patchやdockerラッパーによる引数改変は公式の運用保証なし | ネットワーク既定値だけの方式は実測不合格。shadowもCLI生成なので例外検査が必要 | CLI専用volumeを維持できる利点はあるが、内部依存の修正は更新で壊れる。復元は専用スタック停止・未変更CLIへ戻す。DBは変更しない | 現状採用しない。上流対応を確認できるまで再試行しない |
| B: 専用Compose＋明示host_ip | Docker ComposeとSupabase公式self-hostingが根拠。CLI管理とは別スタック | 全portsに127.0.0.1を指定。::/::1を含め追加公開しない。追加のpooler等も全件検査 | 新しいproject名・volume・ネットワークだけを使用。既存CLI DBの物理volumeは接続しない。停止・専用コンテナ削除で復元、volume保持 | 推奨する設計方針。ただし完全な構成の別レビューが必要 |
| C: CLIとComposeの併用 | ファイルの履歴管理や承認後のSQL検証ツールとしての併用は可能。CLI生成コンテナをComposeで再管理する公式手順は確認できない | 後付けoverrideがCLI startへ渡る仕組みはない。起動後のbind変更では公開時間が生じる | 同一コンテナ・volumeを二重管理すると停止/reset/migration履歴が競合。別スタック分離ならBと同じ | 同じスタックの二重管理は禁止。migrationファイルの管理と承認済み適用を分ける |
| D: Desktopのlocalhost既定公開 | portBindingBehaviorは4.52以降で対応。default-local-port-binding/local-only-port-bindingが公式設定 | 新規コンテナ全体に作用。IPv6 loopbackを含める挙動も検査が必要 | 他アプリの新規・再作成コンテナに影響。既存コンテナへの即時反映を仮定しない。元設定へ戻し影響先を再検証 | 全体設定変更が必要なので低優先。今回は変更しない |

## サービスごとの構成要件

公式ガイドが参照するself-hosted/v0.8.4（タグobject SHA 3f8e6c2e2bdca35bd6eacc8b7782aa73acb58ebc）のdocker/docker-compose.ymlを読み取り確認した。**この版はKongではなくEnvoyのapi-gwを使用し、Mailpitを含まない**。Postgresは17.6.1.136で、CLI実測の17.11.0.011とも異なる。CLIの7サービスを抜粋しただけのYAMLでは同等の環境にならない。このタグをそのまま採用したという意味ではない。

| 対象 | 将来のB構成で必要な設計・公開方針 |
| --- | --- |
| Auth | 公式DB初期化・JWT鍵・API URL・メール設定をそろえる。内部通信のみ、単独ホスト公開なし |
| PostgREST | DB role/JWT/schemaを公式構成に合わせる。内部通信のみ |
| Kong / API gateway | Kongを維持する公式版の選定、またはEnvoyへ変更する設計承認が必要。55321だけをloopback公開。TLS追加時も明示bind |
| Studio | gateway経由か55323直接かを公式版に合わせて決定。直接なら127.0.0.1のみ。既定認証を流用しない |
| Mailpit | 現公式構成にないため、承認後に公式Mailpit設定とAuth SMTP連携を別途レビュー。画面55324だけ公開、SMTPは内部のみ |
| Postgres | 必要な場合だけ55322をloopback公開。superuser秘密値はローカル専用。未適用確認のCLI volumeは一切mountしない |
| postgres-meta | 公式DB接続と役割設定。内部通信のみ、Docker socketの安易な追加なし |
| shadow DB | self-hostingにはCLI shadowの自動同等物を仮定しない。CLI diff/resetは実行しない。必要なら別承認の一時DBを55320で明示bind |
| その他 | Realtime/Storage/Functions/Analytics/Poolerの依存を上流構成で確認。抜粋して壊さない。不要ポートは公開しない。将来55325～55329も予約を含め再確認 |

上流ファイル一式・関連SQL/テンプレート・image digest・ライセンス・秘密値生成手順・Windows対応をそろえ、専用名への置換と設定解決結果をレビューしてから構成を確定する。複数Composeファイルのportsはマージで古い公開が残り得るため、単純な追記をしない。対応版の!override等で置換する場合も、docker compose configで全公開を確認する。

## YAMLとconfig.tomlの管理

[再現用HTTP compose.yml](../../docker/littlediary-local/compose.yml)だけを今回作成。docker runの実測を基にした**未実行の設計**でありSupabaseを模倣しない。secret/env/mount/volumeなし、externalネットワーク、専用名、image digest固定。起動を伴わないconfig検証だけを行う。

Supabase全体のYAMLを作成しない理由は上記のサービス差、鍵・初期化・DB版の未確定。安全と確認できない構成を埋め草で完成扱いにしない。次工程で完全な構成を別PRにする。

実際にCLIが生成し使用したconfig.tomlはGit除外の.expo/supabase-isolated/supabase/config.tomlにある。今回取り込まない。将来テンプレート化する場合は実ファイルと別名にし、URL・鍵・remote link・env参照を検査する。.env.local、.temp、DBデータ、JWT、認証ログをGit管理しない。

## データ互換性と復旧

保持中のsupabase_db_littlediary-foundation-isolatedはCLI環境専用。migration適用状態未確認。ComposeのPostgresへ直接attach、同時mount、版変更、chownをしない。DB major一致だけでは拡張・初期化・権限の互換性を保証できない。

Bは新規volumeから始める。既存データの移行が必要なら、別承認のバックアップ・論理dump/restore・互換性検証計画を作る。旧volume削除を復旧手順にしない。CLIとComposeで同じDBへの自動migrationを二重実行しない。

不合格時は専用サービスだけ停止。Composeなら承認したprojectとファイルを毎回指定しstop、必要な場合のみ対象サービスのrm。volumeとexternalネットワークは保持する。down -v、全体prune、stop --allは禁止。停止後に待受とlocalhost接続を再検査し、残存時もPIDだけで原因を決めず、強制解放しない。

## 次回の承認と安全検証

1. 最終YAML・上流版・全image・専用名・ポート・新規volume・秘密値生成／保管と保持方針をレビューする。作成・起動・停止・削除の対象をユーザーが明示承認する。
2. Supabase起動時にDB初期化が起きる点も承認範囲へ明記。公開検証前にはLittleDiaryの正式migrationを自動ロードさせない。migrationは別工程の明示承認まで配置・適用しない。
3. RAMはSupabase起動直前8 GiB以上、余裕とDocker負荷を確認。ポート・予約範囲・既存コンテナ／volume／ネットワークを記録。リモート環境変数・linkを渡さない。
4. docker compose configで全portsをレビューしてから専用スタックだけ起動。HostConfig.PortBindingsとNetworkSettings.Portsの全公開を検査し、127.0.0.1以外・未知ポート・未知ネットワークなら即停止する。
5. DB catalogより先にWindows待受・localhost HTTP・Windows LANアドレス・同一LAN別端末の接続拒否を確認する。IPv6 wildcard公開も拒否。別端末結果はユーザー報告と区別し、未受領なら外部非公開を完了扱いにしない。
6. 公開検証合格後、**別途承認された範囲だけ**catalog確認・migration・reset・Auth・CRUDへ進む。A/B作成・データ削除は各対象を別承認。
7. 合否にかかわらず専用スタックを停止し、port解放・既存資源不変・volume保持を確認する。今回のPR承認だけでこれらを実行しない。

## 公式根拠（2026-11-09確認）

- [Supabase local development](https://supabase.com/docs/guides/local-development): 専用networkとbind既定値の公式案内。ただし本環境では不合格。
- [CLI 3.0.0 start](https://github.com/supabase/cli/blob/v3.0.0/apps/cli/src/commands/start/start.handler.ts) / [Docker引数](https://github.com/supabase/cli/blob/v3.0.0/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts)
- [公式self-hosting](https://supabase.com/docs/guides/self-hosting/docker) / [調査した上流YAML](https://github.com/supabase/supabase/blob/self-hosted/v0.8.4/docker/docker-compose.yml)
- [Compose ports仕様](https://docs.docker.com/reference/compose-file/services/#ports) / [portsの置換](https://docs.docker.com/reference/compose-file/merge/#replace-value)
- [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/) / [bridge設定](https://docs.docker.com/engine/network/drivers/bridge/)
- [Desktop portBindingBehavior](https://docs.docker.com/desktop/enterprise/hardened-desktop/settings-management/settings-reference/#port-binding-behavior)
