# Phase 2 / Step 2-1：ホーム画面UI

- 日付: 2026-11-06
- ステータス: UI実装済み / 検証に既存エラーあり / iPhone実機未確認
- ブランチ: `feature/phase2-home-ui`
- 開発環境: Windows / Expo SDK 58 (`expo ~58.0.23`) / React Native 0.88.1
- 実装指示: [phase-02-home-ui-codex.md](../prompts/phase-02-home-ui-codex.md)

## 実装内容
- クリーム背景、指定色、見出し・説明、今日の日記カード、英語学習・日記の記録カード、英語フレーズ例を実装。
- 丸顔キャラクターは React Native の View だけで描画した独自デザイン。画像・外部アセット・追加の実行時依存なし。
- SafeAreaView と ScrollView、最大幅、可変カード高さ、flexWrap により狭い画面と文字拡大を考慮。横並びカードは幅が足りない場合に折り返す。
- 「日記を書く」はボタン風の表示のみ。日記・学習・記録は「準備中」を表示し、押下処理やボタンのアクセシビリティロールを付けない。英語例は「フレーズ例」と明記。
- 保存、SQLite、Supabase、翻訳API、画面遷移は対象外。既存 Expo Router・タブ・Explore は変更なし。

## 変更ファイル
- `src/app/index.tsx`: ホーム画面の構造。
- `src/styles/home.ts`: ホーム専用の色・レイアウト・キャラクターのスタイル。
- `eslint.config.js`: Expo の flat config を追加。
- `package.json` / `package-lock.json`: Lint検証に必要な開発依存 `eslint`、SDK 58互換の `eslint-config-expo` を追加。
- `docs/development/`: main に存在しなかった開発ドキュメント4ファイルを `origin/docs/development-playbook` から取り込み、本記録を更新。

## 検証結果
| コマンド・項目 | 結果 |
| --- | --- |
| `npx.cmd tsc --noEmit` | 失敗（終了コード2）。既存 `src/components/app-tabs.web.tsx:38` の TS2322。Expo Router の TabTriggerSlotProps の ref と React Native Pressable の ref の型が不一致。今回の追加コードの診断はなし。 |
| 変更前ホームで `node node_modules/typescript/bin/tsc --noEmit` | 同じ TS2322 を再現。検証後ホーム実装を復元済み。 |
| `CI=1 npx.cmd expo lint` | 失敗（終了コード1）。既存 `src/hooks/use-color-scheme.web.ts:11` の `react-hooks/set-state-in-effect` が1件。変更したホーム・スタイルの指摘なし。 |
| `git diff --check` | 成功。改行コードのLF→CRLF予告のみ。 |
| iPhone Expo Go 表示・スクロール・SafeArea・タブ重なり | **未確認（ユーザーが実施）**。 |
| Android / Web の表示・文字拡大 / VoiceOver | 未確認。コード上の配慮のみで、表示テスト済みとはしない。 |

PowerShell の `npx.ps1` はグローバル npm パスへのアクセス警告が出たため、最終検証は同じ npx の Windows 用エントリ `npx.cmd` を使用。
最初の Lint は設定・依存がなく、自動セットアップが EACCES で失敗。ネットワーク許可後に `npx.cmd expo install eslint eslint-config-expo --dev` で導入し再実行した。インストール時 npm audit は moderate 12件を報告。今回、依存の一括更新は行わない。

## 受け入れ条件
- [x] 指定のホーム見出し、日記カード、独自の丸顔、学習・記録カード、英語例をコードに実装
- [x] SafeArea・スクロール・狭い幅での折り返しをコードに実装
- [ ] TypeScript全体成功（既存のWebタブ型エラーで失敗）
- [ ] Lint全体成功（既存のWeb hydration hookで失敗）
- [ ] iPhone Expo Goで表示確認（ユーザーによる確認待ち）

## 判断・再利用可能な知見
- 指示の対象外ファイルを変更しないため、既存タブの型エラーと既存hookのLintエラーは修正せず記録。全体チェック成功とは扱わない。
- 見た目だけの操作は View / Text と状態表示で表現し、操作可能なコントロールとして読み上げない。装飾の顔は読み上げ対象外。
- 本文やカードの高さ・行数を固定せず、内容と文字サイズに応じて伸びる設計を再利用する。
- 既存Webタブは画面上部に重なるため、ホーム上端にWeb専用余白を設定。ネイティブは既存 BottomTabInset を下部余白に利用。実機で余白・重なりの最終確認が必要。
- ユーザーの仕上げ指示に従い、指定メッセージでコミットし、featureブランチをPushしてmain向けPRを作成する。mainへの直接Push・マージは行わない。

## 参照した公式ドキュメント
- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Expo docs index](https://docs.expo.dev/llms.txt)
- [SDK 58 safe-area-context](https://docs.expo.dev/versions/v58.0.0/sdk/safe-area-context/)
- [React Native ScrollView](https://reactnative.dev/docs/scrollview)
- [React Native Flexbox](https://reactnative.dev/docs/flexbox)
- [React Native Style](https://reactnative.dev/docs/style)
- [React Native Text](https://reactnative.dev/docs/text)
- [React Native View](https://reactnative.dev/docs/view)

## 追加の差分検証・レビュー手順
- `npx.cmd eslint src/app/index.tsx src/styles/home.ts eslint.config.js`: 成功（終了コード0、指摘なし）。
- `git diff --exit-code HEAD -- src/hooks/use-color-scheme.web.ts src/components/app-tabs.web.tsx src/app/_layout.tsx src/components/app-tabs.tsx`: 成功。既存エラーのファイル・ルート構成に変更なし。
- 差分レビュー済み。追加の実行時依存やネイティブディレクトリの変更なし。
- レビュー後の操作例（未実行）:
  ```powershell
  git add src/app/index.tsx src/styles/home.ts eslint.config.js package.json package-lock.json docs/development
  git commit -m "feat: implement LittleDiary home screen UI"
  git push -u origin feature/phase2-home-ui
  gh pr create --base main --head feature/phase2-home-ui
  ```


## 仕上げ時の再検証（2026-11-06）
- git status / git diff と新規ファイルを確認。変更はStep 2-1のUI、Lint環境、開発ドキュメント。既存タブ・hook・ルート設定に差分なし。
- package-lock.jsonは開発依存追加とnpmによるメタデータ再生成を含む。既存パッケージのversion変更・削除は0件。
- 全体TypeScript: `npx.cmd tsc --noEmit` は終了コード2。全体Lint: PowerShellで `$env:CI='1'; npx.cmd expo lint` は終了コード1。変更ファイル限定Lintは終了コード0で成功。

### 既存エラーの再現条件とメッセージ
基準は仕上げ開始時HEAD (`20127dd`)。ホームのバイト列を退避し、`git show HEAD:src/app/index.tsx` の変更前ホームへ一時的に戻して、同じインストール済み依存・今回追加したESLint設定で両コマンドを再実行。finallyで実装を復元。既存タブ・hookはHEADと同一であることをgit diffでも確認した。
変更前にはLint環境がなかったため、「変更前のLintコマンド自体が同じ診断を出していた」という意味ではなく、今回のLint環境で変更前コードにも同じ問題が再現するという意味。

TypeScript（変更前・変更後とも終了コード2）:
```text
src/components/app-tabs.web.tsx(38,6): error TS2322:
Type '{ children: Element; style: ...; ... }' is not assignable to type '{ ref?: Ref<ReactNativeElement> | undefined; }'.
Types of property 'ref' are incompatible.
```
Expo RouterのTabTriggerSlotPropsから展開するrefと、React NativeのPressableのref型が不一致。

Lint（変更前・変更後とも終了コード1）:
```text
src/hooks/use-color-scheme.web.ts:11:5
error  Error: Calling setState synchronously within an effect can trigger cascading renders
react-hooks/set-state-in-effect
> 11 |     setHasHydrated(true);
1 problem (1 error, 0 warnings)
```
両問題は今回のPRでは修正しない。iPhone実機確認済みというユーザー報告はまだないため、実機確認は未確認を維持する。
- 最終ステージ差分検査で取り込み元テンプレートの末尾空白2件を検出し、空白のみ除去。最終的な `git diff --cached --check` も検証対象に含める。
