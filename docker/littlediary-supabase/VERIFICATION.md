# 次回の起動検証と停止・復旧計画（全て未実行）

今回は設計とconfig検証だけ。[構成・ブロッカー](README.md)の秘密値生成、runtime準備、imageライセンス・Windows対応のレビューを完了し、対象SHA/digestをユーザーが承認するまで起動しない。

1. Supabase起動直前RAM8 GiB以上、Docker Linux/desktop-linux、55320～55329の待受と予約範囲を再確認。既存資源のID・状態を保存する。
2. 専用project/network/5volume名が既存と衝突しないことを確認。CLI volume/littlediary-local-networkを参照しない。LD_以外のリモート変数、env-file探索、remote linkを拒否する。
3. ローカル秘密値生成・ACL・runtime asset復元・12imageの取得を、別途承認した範囲だけで行う。ダミーや.env.exampleでは起動しない。configの実値解決はログに出さず検査する。
4. Docker起動によりSupabase内部DBのDDL、各サービスの内部migrationが実行される。これも初期化承認に含める。LittleDiary migrationは載せない。新規専用volumeからのみ起動する。
5. 直ちに全コンテナのHostConfig.PortBindings/NetworkSettings.Portsを照合。公開先は127.0.0.1の55321、55322、55324だけ。0.0.0.0/::/LAN/別port/未知networkがあればDB調査より先に専用スタックを停止。
6. WindowsのTCP待受、API HTTP・認証付きStudio画面・Mailpit、loopback接続を確認。DBport確認はTCP到達性だけに留め、SQLは別承認まで実行しない。
7. WindowsのLANアドレスと同一LANの別端末で接続拒否を確認。IPv6 wildcard・::1公開も許可しない。別端末結果はユーザー報告と実行中の時刻を記録。未受領なら非公開を完了扱いにしない。
8. 公開範囲合格後に、別途承認されたcatalog SELECTだけ実施する。LittleDiary migration、reset、rollback、A/B作成、CRUD、cleanupは個別の対象と承認が必要。
9. 合否にかかわらず専用projectとファイルを指定してstopする。例: `docker compose --project-name littlediary-supabase-design --env-file <承認済み専用env-file> -f docker/littlediary-supabase/compose.design.yml stop`。必要な変数解決はwrapperで保護し、他projectを対象にしない。
10. 専用コンテナの停止、port解放、既存資源不変を確認。5volumeと専用networkは保持。remove/downを自動実行せず、必要なら別承認する。down -v、prune、stop --all、既存プロセスの強制停止は禁止。

初期化失敗時: 専用スタックを停止し、機密値を伏せたログ・状態・失敗フェーズを保存。DBは部分初期化の可能性があるので繰り返し起動して直ったと扱わない。空の使い捨てvolumeへの再試行や論理復旧も別承認とし、旧CLI volumeで代替しない。鍵・DB image版を変更して既存volumeを開かない。

この試験結果でCLIのnetwork既定bind問題が修正されたとは結論しない。Compose案の実測証拠として別記録にする。
