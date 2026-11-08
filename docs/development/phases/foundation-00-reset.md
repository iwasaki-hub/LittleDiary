# Foundation 0：安全なプロジェクト初期化

- 日付: 2026-11-06（JST）
- ステータス: 最小構成へのリセット・静的検証完了 / iPhone起動未確認 / PRレビュー待ち
- 担当: Codex
- ブランチ: `chore/foundation-reset`
- 基準main／バックアップSHA: `7462fd71ffa99f65c01626c2059473bfeed08bc7`
- 環境: Windows、Expo ~58.0.23、Expo Router ~58.0.30、React Native 0.88.1、TypeScript strict

## 目的・背景
アプリ機能をいったん最小のExpo Router構成へ戻し、Git履歴・設計思想・開発資料・Codex指示・Expo連携を保持して基盤を整える。基盤完成まではアプリ機能を追加しない。

## スコープ・保護対象
対象はsrc、退避先example、サンプル画像・resetスクリプト、検査設定と新規基盤資料。
AGENTS.md、既存docs/development、app.json、package-lock.json、アプリアイコン・スプラッシュ等の設定参照画像は変更なし。
Expo ownerはmasa-practice、project IDは901f2477-82b9-40df-bb93-092019f93990を維持。web.output=server、既存プラグイン・スプラッシュ・実験設定もそのまま。
DB、AI翻訳、新UI、依存更新、CI/CD、Expoデプロイ・新規プロジェクト作成は対象外。

## 開始確認・実施計画
1. AGENTSとdocs/developmentの方針・工程資料を確認。開始時の作業ツリーはクリーン。
2. PR #5がmergedであることをGitHubで確認し、mainをff-only同期。専用ブランチを作成。
3. reset-project.jsを全文確認。対象src/scripts/example/assets/imagesの絶対パスがワークスペース配下であること、既存exampleがないことを確認。
4. 同名タグ未作成を確認し、リセット前にbackup/pre-foundation-resetタグを作成。GitHubへもPush。
5. npm run reset-projectのYモードで退避し、生成ファイル確認、アーカイブ分離、資料整備、検証、差分レビュー後にPR化。

## バックアップと復元方法
- Gitタグ: `backup/pre-foundation-reset`（ローカルとoriginに保存、上書きなし）
- タグのSHA: `7462fd71ffa99f65c01626c2059473bfeed08bc7`
- 退避先: `example/src`、`example/scripts`、`example/assets/images`
- 退避した35ファイルはgit hash-objectとタグ内のblob IDを照合し、すべて元ファイルと一致。旧アプリ全体はタグに保存されている。

完全な旧環境の復元例（手順のみ。復元用worktreeの作成自体は未実施）:
```powershell
git fetch origin tag backup/pre-foundation-reset
git worktree add ../LittleDiary-pre-foundation backup/pre-foundation-reset
```
新しい作業ディレクトリで依存を用意して起動する。現在のユーザー変更をreset --hard等で上書きしない。exampleだけをそのまま起動するものではなく、旧エイリアスや画像は当時のルート構成を前提としている。

## 実施記録・変更理由
- `npm.cmd run reset-project` を実行（Windowsでのnpm run reset-project）。対話入力は **Y**。削除モードは使用せず、終了コード0。
- src/app/index.tsxとsrc/app/_layout.tsxが生成されたことを確認。画面はスクリプト生成の説明文とView、レイアウトはStackのみ。旧Home/Exploreやテーマhookへの参照なし。
- `.gitignore`: exampleの除外を解除し、退避コード・画像もGit管理。dist/.expo・秘密ファイルの除外は維持。
- `tsconfig.json`: example、node_modules、distをexcludeに追加。strictと既存エイリアスは維持。
- `eslint.config.js`: example/**をglobal ignoresへ追加し、dist除外をdist/**へ明確化。現行srcのLintルールは維持。
- `package.json`: 参照先スクリプトがexampleに移動して実行不能となるreset-projectエントリだけ削除。依存・他のコマンドは不変。退避されたスクリプトは保存。
- TypeScript/Lintから除外するのは履歴保管庫のみ。エラーを隠すための現行ソース除外や削除ではない。Routerはsrc/appを使用し、exampleのルートは登録されない。

新規資料と役割:
- [デザイン原則](../../design/design-principles.md): 目的・色・カード・独自キャラクター・アクセシビリティ・UIとスタイルの分離。
- [アーキテクチャ](../../architecture/README.md): 最小構成・ルートの責務・退避分離・Expo連携。
- [自動化方針](../../automation/README.md): 現在の手動検証と将来の承認ゲート。CI/CD実装なし。
- [Codexフロー](../../prompts/codex-workflow.md): 開始条件・変更範囲・検証・記録・承認。
- [退避先説明](../../../example/README.md): 参照方法・復元・再実行への注意。
既存の指示書・工程記録は移動・書き換えせず、過去資料としてリンク。資料の二重管理を避ける。

### 移動したファイル（元パス → example/元パス）
恒久削除した旧アプリのファイルはなし。以下を移動し、src/appの2ファイルのみ新たな最小版を生成。

- `README.md` → `example/README.md`
- `assets/images/expo-badge-white.png` → `example/assets/images/expo-badge-white.png`
- `assets/images/expo-badge.png` → `example/assets/images/expo-badge.png`
- `assets/images/expo-logo.png` → `example/assets/images/expo-logo.png`
- `assets/images/logo-glow.png` → `example/assets/images/logo-glow.png`
- `assets/images/react-logo.png` → `example/assets/images/react-logo.png`
- `assets/images/react-logo@2x.png` → `example/assets/images/react-logo@2x.png`
- `assets/images/react-logo@3x.png` → `example/assets/images/react-logo@3x.png`
- `assets/images/tabIcons/explore.png` → `example/assets/images/tabIcons/explore.png`
- `assets/images/tabIcons/explore@2x.png` → `example/assets/images/tabIcons/explore@2x.png`
- `assets/images/tabIcons/explore@3x.png` → `example/assets/images/tabIcons/explore@3x.png`
- `assets/images/tabIcons/home.png` → `example/assets/images/tabIcons/home.png`
- `assets/images/tabIcons/home@2x.png` → `example/assets/images/tabIcons/home@2x.png`
- `assets/images/tabIcons/home@3x.png` → `example/assets/images/tabIcons/home@3x.png`
- `assets/images/tutorial-web.png` → `example/assets/images/tutorial-web.png`
- `scripts/reset-project.js` → `example/scripts/reset-project.js`
- `src/app/_layout.tsx` → `example/src/app/_layout.tsx`
- `src/app/explore.tsx` → `example/src/app/explore.tsx`
- `src/app/index.tsx` → `example/src/app/index.tsx`
- `src/components/animated-icon.module.css` → `example/src/components/animated-icon.module.css`
- `src/components/animated-icon.tsx` → `example/src/components/animated-icon.tsx`
- `src/components/animated-icon.web.tsx` → `example/src/components/animated-icon.web.tsx`
- `src/components/app-tabs.tsx` → `example/src/components/app-tabs.tsx`
- `src/components/app-tabs.web.tsx` → `example/src/components/app-tabs.web.tsx`
- `src/components/external-link.tsx` → `example/src/components/external-link.tsx`
- `src/components/hint-row.tsx` → `example/src/components/hint-row.tsx`
- `src/components/themed-text.tsx` → `example/src/components/themed-text.tsx`
- `src/components/themed-view.tsx` → `example/src/components/themed-view.tsx`
- `src/components/ui/collapsible.tsx` → `example/src/components/ui/collapsible.tsx`
- `src/components/web-badge.tsx` → `example/src/components/web-badge.tsx`
- `src/constants/theme.ts` → `example/src/constants/theme.ts`
- `src/global.css` → `example/src/global.css`
- `src/hooks/use-color-scheme.ts` → `example/src/hooks/use-color-scheme.ts`
- `src/hooks/use-color-scheme.web.ts` → `example/src/hooks/use-color-scheme.web.ts`
- `src/hooks/use-theme.ts` → `example/src/hooks/use-theme.ts`
- `src/styles/home.ts` → `example/src/styles/home.ts`

## 検証結果
| コマンド・確認 | 結果 |
| --- | --- |
| `npx.cmd tsc --noEmit` | 成功、終了コード0 |
| PowerShell `$env:CI='1'; npx.cmd expo lint` | 成功、終了コード0 |
| `npx.cmd expo-doctor` | 成功、終了コード0、20/20 checks passed |
| `npx.cmd expo export --platform web` | 成功、終了コード0、distへserver/clientバンドル生成 |
| `git diff --check` | 成功。LF→CRLF予告のみ |
| アーカイブ35ファイルのblob照合 | 全件一致 |
| AGENTS/app.json/既存docs/development/lockfileの基準タグとの比較 | 差分なし（本記録の追加を除く） |
| 現行srcの旧アプリ参照検索 | explore、example、animated-icon、app-tabs、@/参照なし |
| exportのroutes.json | /indexとRouter生成のsitemap/not-foundのみ。Exploreとexampleの登録なし |
| iPhone Expo Go起動 | **未確認。ユーザー担当** |
| 実ブラウザ表示・操作 | 未実施。ビルド成功と区別 |

NO_COLOR/FORCE_COLORの出力色警告はあったが、Webビルド自体は成功。依存やExpo連携設定を修正する必要はなかった。生成物dist/.expoはコミットしない。

## 判断・振り返り
- 操作前にスクリプトの対象とY/N分岐を読み、復元タグと移動先を確認してから実行すると削除モード誤選択を避けられる。
- ローカルexampleのみの保管では復元が端末依存になるため、Git管理とリモートタグの両方を使う。
- 退避コードは当時の依存・パスを持つ履歴資料であり、現行検査やルートへ混ぜない。元の内容は変更せず、基盤側の検査対象を明確にする。
- デザイン・指示方法・開発履歴はソースと別資料にして保持し、機能のリセットと知識の破棄を分ける。
- 既存Hostingプレビューは今回のローカルリセットで更新されない。デプロイ未実施。

## 受け入れ条件・Foundation 1の開始条件
- [x] Yモードで退避、最小Expo Router構成、復元タグ・アーカイブ内容確認
- [x] 既存資料・AGENTS・Expo owner/project ID・Git履歴を保護
- [x] TypeScript・Lint・Doctor・Webビルド成功
- [ ] iPhone Expo Goで起動し、プレースホルダーが表示され、クラッシュ・赤いエラー画面がないことをユーザー確認
- [ ] PRレビューと明示的なマージ承認、head SHA・チェック再照合後のSquash merge

Foundation 1は上記実機確認・レビュー／マージ後、最新mainとクリーンな状態を確認し、基盤整備の具体的範囲・検証・対象外を合意して開始する。アプリ機能の再導入は基盤完成まで行わない。

## 参考資料
- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/llms.txt
- https://docs.expo.dev/router/basics/navigation-layouts/
- https://reactnative.dev/docs/view
