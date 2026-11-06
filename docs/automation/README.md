# 自動化方針

Foundation 0ではCI/CDやデプロイ自動化を導入しない。まずローカルで以下の品質確認を行い、結果と未確認項目を工程記録へ残す。

```powershell
npx.cmd tsc --noEmit
$env:CI='1'; npx.cmd expo lint
npx.cmd expo-doctor
npx.cmd expo export --platform web
git diff --check
```

今後のCI設計ではこれらを順序と失敗条件を明確にして実行し、CLI・依存の再現性を確保する。認証は最小権限とsecret storeを用い、fork PRに秘密を渡さない。PreviewとProductionは別の承認ゲートを設ける。GitHubの必須チェック設定や課金・アカウント変更は別途承認された工程で扱う。
生成物dist/.expo、トークン、秘密鍵をコミットしない。過去の公開プレビューは自動更新されない。本工程で既存HostingやEASプロジェクトを作成・変更・デプロイしない。

[既存のHosting手順](../development/phases/phase-02-05-expo-deploy.md)
