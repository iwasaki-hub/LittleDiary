# リセット前アプリの保管庫

Foundation 0でreset-projectのYモードにより退避した旧src・scripts・サンプル画像。内容は変更せずGit管理する。現行アプリや独立実行できるサンプルではない。TypeScript・ESLintから明示的に除外し、ルーティングはsrc/appのみを使用する。
旧コードの@/参照や画像パスは当時のディレクトリ構成を前提とする。参照用に保存し、現在のsrcへインポートしない。

完全な旧アプリはタグ `backup/pre-foundation-reset` から別の作業ディレクトリへ復元できる。
```powershell
git worktree add ../LittleDiary-pre-foundation backup/pre-foundation-reset
```
元のreset-project.js自体もscripts/reset-project.jsとして保管。現行package.jsonのreset-projectコマンドは、参照先を退避して実行できなくなったため削除した。保管されたスクリプトを現在のルートから不用意に再実行しない。

[工程記録](../docs/development/phases/foundation-00-reset.md)
