# Codex 指示：LittleDiary Phase 2 / Step 2-1（ホーム画面UI）

あなたは React Native / Expo / TypeScript の開発担当です。
対象: https://github.com/iwasaki-hub/LittleDiary

## 開始前に
1. リポジトリの `AGENTS.md` を読み、必ずそのルールに従う。
2. `package.json`、`src/app/index.tsx`、`src/app/_layout.tsx`、`src/components/app-tabs.tsx`、`src/constants/theme.ts` を読んで現状を把握する。
3. Expo SDK 58の公式ドキュメントで、触れるAPIの互換性を確認する。既存構成を尊重する。
4. 作業前のgit statusを確認する。未コミットのユーザー変更を勝手に破棄しない。
5. 可能なら `feature/phase2-home-ui` ブランチで作業し、別の作業ブランチやユーザー変更を上書きしない。

## 目的
Headspaceのやさしく親しみやすい雰囲気を参考にした、LittleDiary独自のホーム画面を構築する。ロゴ、アート、キャラクターのコピーはしない。

## UI仕様
- クリーム色の背景 `#FFF8EE`、テキスト `#302B27`、補助テキスト `#817367`
- オレンジ `#FF935C`、ピーチ `#FFDEBF`、ブルー `#CDE8FA`、イエロー `#FFE8A6`
- 画面上部に `LITTLE DIARY`、見出し「今日も、いい一日に。」、説明「小さな出来事を残してみよう。」
- メインの日記カード：ラベル `TODAY'S DIARY`、見出し「今日はどんな日だった？」、説明「一言だけでも大丈夫。」、独自の丸顔キャラクター、「日記を書く」ボタン風の表示
- 横並びカード：「英語を学ぶ」「日記の記録」。狭い画面で崩れないようにする
- 英語カード：ラベル `TODAY'S ENGLISH`、例文 `It was a lovely day!`、訳「今日は素敵な一日だった！」
- 大きい余白、丸みのあるカード、読みやすい日本語と英語。SafeAreaとスクロールに対応

## 実装制約
- まず `src/app/index.tsx` と新規 `src/styles/home.ts` を中心に実装。コンポーネント分割が合理的なら `src/components/` を追加してもよい。
- 画面構造とスタイルは分ける。
- 現在のExpo Routerと `_layout.tsx`、既存タブの構成を維持し、関係ないファイルに手を入れない。
- この段階では日記の保存、SQLite、Supabase、翻訳API、画面遷移は実装しない。
- 操作できないUIは視覚的なモックとして扱う。押しても動かない機能を完成と報告しない。
- 新規依存は原則不要。どうしても必要な場合は先に理由と SDK 58 互換性を説明し、`npx expo install` を使う。
- 秘密情報をコードやドキュメントに記載しない。

## テストと報告
1. `npx tsc --noEmit` と `npx expo lint` を実行し、成功・失敗を正確に報告。実行できない場合も理由を記載。
2. `git diff` を確認し、意図しない変更がないか点検。
3. `docs/development/phases/phase-02-home-ui.md` に実装内容、変更ファイル、テスト結果、判断、再利用可能な知見を追記。ユーザーによるiPhone実機確認は実施済みと書かず未確認にする。
4. 変更点・実行コマンド・未完了項目を日本語で簡潔に報告。
5. コミット・Push・PR作成は環境や権限に応じて行い、できなければコマンドと手順を提示する。

## 完了条件
ホーム画面が仕様に沿って表示できるコードになっており、型検査・Lint・ドキュメント更新の結果が明確であること。iPhoneでの最終実機検証はユーザーが行う。
