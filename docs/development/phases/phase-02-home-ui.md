# Phase 2 / Step 2-1：Headspace風ホーム画面

- 日付: 2026-11-06
- ステータス: planned（Codexによる実装・検証前）
- 開発環境: Windows 11 / VS Code / Expo Go（iPhone実機）
- リポジトリ: https://github.com/iwasaki-hub/LittleDiary
- 実装指示: ../prompts/phase-02-home-ui-codex.md

## 背景
一言日記とAI英語学習を組み合わせた LittleDiary。まず視覚的なホーム画面を構築する。Headspace（https://www.headspace.com/）の親しみやすさを参考にするが、ロゴ・画像・キャラクターは模倣せず独自に作る。

## スコープ
- `src/app/index.tsx`: ホームのUI
- `src/styles/home.ts`: 色・レイアウト・カードなどのスタイル
- 必要な小さい独立コンポーネントのみ `src/components/` に追加
- 色: 背景 #FFF8EE / メイン #FF935C / ピーチ #FFDEBF / ブルー #CDE8FA / イエロー #FFE8A6

## 対象外
- SQLite、Supabase、認証、AI翻訳API、保存・編集
- タブ構造の改変、関係ない初期画面の削除
- 未実装ボタンに動作しているような表現を与えること

## 受け入れ条件
- [ ] ホームの見出し「今日も、いい一日に。」
- [ ] 今日の日記カードとオリジナルの丸顔キャラクター
- [ ] 英語学習・日記履歴の2カード
- [ ] 英語フレーズ例のカード
- [ ] 狭い画面でもはみ出さずスクロール可能
- [ ] `npx tsc --noEmit` 成功
- [ ] `npx expo lint` 成功
- [ ] iPhone Expo Goで表示確認（ユーザーによる確認）

## 実施記録
- Codex実施状況: 未着手
- 変更ファイル: 未記入
- テスト結果: 未実施
- 実機確認: 未実施

## 判断・振り返り
完了後に、デザイン判断、問題点、修正内容、次回に再利用できるパターンを追記する。
