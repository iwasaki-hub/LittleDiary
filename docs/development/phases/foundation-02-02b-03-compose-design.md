# Foundation 2-2B-3：Supabase Compose詳細設計

- 日付: 2026-11-09 JST
- 状態: 設計レビュー待ち。**起動可能な構成としては未完成・未検証**
- 担当: Codex
- ブランチ: chore/foundation-02-02b-compose-design
- 基準main: 2bb97c7686c03bf51bd4efb9066dca0f42c42b14
- 対象: 設計ファイル、上流参考設定・初期化SQL、静的検査、PR提出だけ

## 目的・開始条件

Windows 11 + Docker Desktopで、LittleDiary専用SupabaseをIPv4 loopbackだけに公開する構成を具体化する。AGENTS、Codexフロー、[Foundation 2-2A](foundation-02-02a-db-design.md)、[2-2B-1](foundation-02-02b-01-migration-prep.md)、[Docker検証記録](foundation-02-02b-02-docker-network.md)、[方式設計](../../architecture/docker-local-supabase.md)を確認した。mainをff-only同期、開始時のクリーンな作業ツリーを確認し専用ブランチを作成した。

今回はコンテナ・network・volumeの作成/起動/停止/変更、image pull/build、DB接続、migration/reset、Auth/CRUD、リモートSupabase接続、デプロイを実施していない。既存のHTTP検証用YAML・正式migration・アプリ・依存・過去docsは変更しない。

## 上流選定と調査

公式ガイドが例示するself-hosted/v0.8.4（CHANGELOG日付2026-11-05）を設計基準に採用。タグ名だけで固定せず、annotated tag object `3f8e6c2e2bdca35bd6eacc8b7782aa73acb58ebc`から実コミット`189adda99d1b56da55fc5a6ee3f849354aaea92a`を取得した。GitHub releases/tags APIは404だったが、git tag・コミット・CHANGELOGの存在は確認済み。GitHub Releaseとして公開済みとは記録しない。

最新製品CHANGELOG（Flutter v3、CLI v3等）と固定版Docker CHANGELOGを確認。0.8.4のStorageセキュリティ修正、Envoy/DNS・Functions CORS変更、Functionsの2 GiB limit、Kong overrideの廃止予定を考慮した。無条件のlatest採用やCLI依存更新は行わない。

Gatewayは固定版既定Envoy v1.39.6を選定。Kong3.9.3へ切り替える公式overrideも存在するが、廃止予定と全体整合性から不採用。従来CLIのKong2.8.1とは異なる。Envoyの4設定ファイル、DB8ファイル（空の参考data.sqlを含む）、Functions参考ソース4ファイル、Pooler設定1ファイルを取得し、17件のsource hashとblob SHAを保存した。SQL/Gateway原文は維持し、TypeScript3ファイルは.ts.sourceへ改名してExpo対象から分離。うち2件の末尾空白正規化は後述の通り記録した。

## 成果物・サービス・image

[構成説明](../../../docker/littlediary-supabase/README.md)、[compose.design.yml](../../../docker/littlediary-supabase/compose.design.yml)、[環境変数プレースホルダー](../../../docker/littlediary-supabase/.env.example)、[image lock](../../../docker/littlediary-supabase/images.lock.json)、[上流manifest](../../../docker/littlediary-supabase/upstream-manifest.json)、[検証計画](../../../docker/littlediary-supabase/VERIFICATION.md)、[静的検査](../../../docker/littlediary-supabase/validate-static.cjs)を追加。

上流11サービスを保持し、Mailpit1個を追加する12サービス案。Studio、Envoy、Auth、PostgREST、Realtime、Storage、imgproxy、postgres-meta、Functions、Postgres、Supavisor、Mailpitの全依存を定義。Analytics/Vectorは上流の追加overrideなので含めない。MailpitのSMTP1025をAuthへ内部接続し、メール確認有効・phone/匿名ログイン無効とする設計。ユーザー作成はしていない。

imageタグはREADMEに一覧化。12digestを公開レジストリのmanifest HEADで確認し、tag@sha256形式で固定した。tokenは照会中のメモリだけで使用し保存・出力していない。image本体のpull/buildは未実施。digest取得は署名・脆弱性・Windows動作・health検証の成功を意味しない。

上流Apache-2.0原文をUPSTREAM-LICENSEとして保持し、[NOTICE](../../../docker/littlediary-supabase/NOTICE.md)に出典・変更表示を追加した。個別image内の第三者ライセンス/SBOMは未監査で、取得・配布前の確認事項。

## ポートと分離

| ホスト公開 | 宛先 | 用途 |
| --- | --- | --- |
| 127.0.0.1:55321/tcp | api-gw:8000 | API＋認証付きStudio |
| 127.0.0.1:55322/tcp | db:5432 | 将来の承認済みローカル検証 |
| 127.0.0.1:55324/tcp | mailpit:8025 | ローカルメール確認画面 |

Auth・REST・meta等はホスト公開なし。Studio55323、shadow55320、55325～55329は未使用。Poolerは内部のみ。調査時の55320～55329 TCP待受なし、IPv4/IPv6の除外ポート範囲にも該当なし。将来の起動前に再確認する。

単一Composeファイルで全portsを置換済み。複数ファイルmergeは使用しない。全HostIpを127.0.0.1へ明示し、IPv6を無効化する。ただし過去のHTTP実測をこの12サービス案の公開検証に流用しない。

project=littlediary-supabase-design、network=littlediary-supabase-design_default、volume5個（db-data/db-config/deno-cache/storage-data/snippets）はproject prefix付きで新規作成予定、externalなし。現在は未作成。既存4コンテナ、2volume、CLI DB volume、littlediary-local-networkは参照しない。既存DBvolumeへアクセスしていない。

## 初期化・秘密情報・migration

PG17.6.1.136のimage内bootstrapと上流SQLでSupabaseの内部DB・schema・拡張・ロール・パスワード・JWT期限を初期化する設計。各service自身の内部migrationも初回起動時に走り得る。SQLは保存しただけで一切実行していない。image内の実際の拡張版・順序・ロールは未検証。

CLIのPG17.11.0.011とはimage/extension/初期化が異なるため、同じPG17でも物理volumeを直接再利用しない。既存LittleDiary正式migrationは変更せず、自動ロードしない。将来の適用には専用履歴・checksum・transaction・実行ロール・復旧手順を別設計し、CLIの履歴互換を推測しない。

実環境の.env.localやremote linkは使わず、LD_で名前空間を分離する。49変数の.env.exampleは全てプレースホルダー。実値はGit除外の.local/secrets.envへ本人ACLで保管する設計。HS256ローカルJWT・CSPRNG・長さ・URL安全文字・空にするoptionalキー等の生成仕様はREADMEに記録。**秘密値ジェネレーターと実行wrapperは未実装**。上流スクリプトは秘密値をstdout表示し、一部Docker fallbackもあるため、そのまま実行していない。

Composeの環境変数はDocker管理者に見えるため暗号化保管とは扱わない。解決済みconfigをログやファイルへ保存しない。静的検査のダミーは実署名やログインに使えない固定文字列で、子プロセスのメモリだけに渡しコンテナを起動しない。

## 未確定・起動ブロッカー

- Windows用の安全な秘密値生成・ACL・env許可リストwrapperを実装・レビューする必要がある。
- runtime .ts.sourceを専用.local/functionsへ復元する準備処理は未実装。bind元が未作成なので、このままでは起動できない。create_host_path=falseで誤った空ディレクトリ生成を防ぐ。
- 12serviceのWindows/WSL2上の資源、health、DB初期化、鍵整合性、bind mount/改行/書込み権限は未検証。
- 全imageのライセンス/SBOM、architecture、脆弱性・署名を最終確認する必要がある。
- 旧CLIのnetwork bind不合格・標準bridge ID差異・一時待受の内部原因は未確定のまま。

これらを隠して起動可能な完成構成とは提示しない。設計レビュー後に準備実装と実起動の承認を分ける。

## 静的検証結果

- node docker/littlediary-supabase/validate-static.cjs: 成功。docker compose configによる解決・12サービス・12digest・3公開先・5分離volume・14bind参照・17上流hashを確認。未materializeの.local/functionsだけは明示的な例外として記録。
- TypeScript: npx.cmd tsc --noEmit、終了コード0。
- ESLint: CI=1のnpx.cmd expo lint、終了コード0。
- 単体: node --test tests/supabase.test.cjs、3/3成功。
- Expo Doctor: npx.cmd expo-doctor、20/20成功。
- 秘密値パターン検査: 実JWT/secretキーの一致なし。.local/secrets.envはgit check-ignoreで除外確認。
- Markdown相対リンク26件: 全てファイル存在を確認。Envoy YAML3ファイルは構文解析成功。上流TypeScript参考ソース2件の末尾空白でstaged diff検査が失敗したため、空白だけ正規化し元hash・保存hash・変更表示をmanifest/NOTICEに記録した。処理内容は変更していない。最終git diff --cached --checkも成功。
- Docker起動、生成秘密値、DB/RLS/JWT/メール動作、Windows/LAN非公開は今回未検証。

## 停止・復旧・次工程の承認

[検証計画](../../../docker/littlediary-supabase/VERIFICATION.md)に、RAM/ポート/既存資源→設定解決→承認済み専用起動→全HostIp→Windows/localhost/LAN/別端末→許可範囲のDB検証→専用停止を定義。不合格やメモリ逼迫時はDB調査前に専用停止を優先する。

次回はasset準備・ローカル秘密値生成・image取得・新規network/volume/container・Supabase内部初期化・停止をそれぞれ対象SHA/digest付きで承認する必要がある。公開検証後のcatalog SELECTも明示承認を確認する。LittleDiary migration、reset、Auth A/B、CRUD、cleanup、リモート適用は引き続き別承認。

停止時は専用projectを指定してstop、5volumeとnetwork保持。失敗DBの上書き・自動reset・CLI volumeによる代替をしない。削除や論理復旧が必要なら状態・バックアップと対象をレビューして別承認する。今回PRは作成後レビュー待ちで停止し、マージしない。

## 再利用できる知見・参考

annotated tagのobject SHAと実コミットを区別する。公式Composeと初期化SQL・Gateway templateを一緒に固定し、imageのtagだけでなくmanifest digestを保存する。ファイルの構文・hash・依存検査と実際の起動/秘密値/DB/LAN検証を別の証拠として扱う。runtime参考ソースをアプリの型検査へ混ぜず、復元の未実施も明示する。

- [公式CHANGELOG](https://supabase.com/changelog) / [固定Docker CHANGELOG](https://github.com/supabase/supabase/blob/189adda99d1b56da55fc5a6ee3f849354aaea92a/docker/CHANGELOG.md)
- [公式self-hosting](https://supabase.com/docs/guides/self-hosting/docker)
- [Mailpitの公式image・healthcheck](https://github.com/axllent/mailpit/blob/v1.31.3/Dockerfile)
- その他の固定ソース・Docker仕様は[README](../../../docker/littlediary-supabase/README.md)に記載。
