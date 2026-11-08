# ローカルDocker限定公開の設計ファイル

このディレクトリの[compose.yml](compose.yml)はHTTPコンテナ1個の再現用設計。Composeによる起動は未実施であり、Supabaseサービスは定義しない。
実測したのは[工程記録](../../docs/development/phases/foundation-02-02b-02-docker-network.md)のdocker runだけ。YAMLが自動生成されたものではない。

- 公式nginxイメージを実測時のdigestで固定。55329からコンテナ80へ、IPv4 loopbackだけを明示公開する。
- 既存の専用ネットワークをexternal参照する。ネットワークは作成・削除しない。
- mount、volume、env_file、認証情報、Docker socket、Supabase CLIの管理ラベルを使用しない。
- コンテナ名は過去のrun試験と区別する。実行前に名前・ポートの空きを確認する。
- config構文確認の成功は、実行時のHostIp・Windows転送・LANからの拒否を保証しない。

以下は将来の**別途承認後のみ**実行する手順。今回はconfig検証以外は実行しない。リポジトリルートから実行する。

```powershell
docker compose -f docker/littlediary-local/compose.yml config --quiet
# 承認後のみ: 一時コンテナ1個の作成・起動
docker compose -f docker/littlediary-local/compose.yml up -d bind-probe
docker inspect littlediary-bind-probe-compose
docker port littlediary-bind-probe-compose
# Windows・LAN・別端末の検証後、または公開範囲不合格時
docker compose -f docker/littlediary-local/compose.yml stop bind-probe
docker compose -f docker/littlediary-local/compose.yml rm -f bind-probe
```

上記はrun --rmと異なり停止だけではコンテナが削除されないので、rmまでを承認範囲に含める。全体prune、ボリューム削除、Supabaseスタック操作は行わない。

Supabase全体のCompose YAMLはまだ作成していない。理由・必要な構成要素・採用条件は[設計書](../../docs/architecture/docker-local-supabase.md)を参照する。
