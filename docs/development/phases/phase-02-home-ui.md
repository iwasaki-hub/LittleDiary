# Phase 2 / Step 2-1：ホーム画面UI

- 実施日: 2026-11-06
- 状態: UI実装済み / iPhone実機テスト成功（ユーザー報告）/ 静的検証に既存エラーあり
- ブランチ: `feature/phase2-home-ui`
- PR: https://github.com/iwasaki-hub/LittleDiary/pull/2
- 環境: Windows / Expo SDK 58 (`expo ~58.0.23`) / React Native 0.88.1
- 実装指示: [phase-02-home-ui-codex.md](../prompts/phase-02-home-ui-codex.md)

## 実装結果と変更ファイル
| ファイル | 役割 |
| --- | --- |
| `src/app/index.tsx` | ホームの見出し・説明、日記カード、丸顔、学習／記録カード、英語フレーズ例 |
| `src/styles/home.ts` | 指定色、カード、余白、折り返し、キャラクターの描画 |
| `eslint.config.js` | Expo flat configによるLint環境 |
| `package.json` / `package-lock.json` | eslintとSDK 58互換eslint-config-expoの開発依存 |
| `docs/development/README.md` | 開発記録の運用方針（PR #1由来） |
| `docs/development/prompts/phase-02-home-ui-codex.md` | Step 2-1実装指示（PR #1由来） |
| `docs/development/templates/phase-template.md` | 再利用テンプレート（PR #1由来、末尾空白のみ除去） |
| 本ファイル | 設計判断・実装・検証・再利用手順 |

クリーム背景 #FFF8EE、文字 #302B27、補助文字 #817367、オレンジ #FF935C、ピーチ #FFDEBF、ブルー #CDE8FA、イエロー #FFE8A6 を使用。日記カードの面はピーチ、ボタン風表示と顔はオレンジ。
「日記を書く」・学習・記録は「準備中」の表示モック。保存、翻訳API、SQLite、Supabase、認証、画面遷移は対象外。既存Expo Router・タブ・Explore・ネイティブ設定は変更しない。

## 設計判断とUI・スタイル分離の効果
- 画面は構造と文章、スタイルは色・余白・図形を担当。文言追加と見た目調整を別々にレビューでき、将来のカード再利用・色調整も一箇所にまとめられる。
- SafeAreaViewとScrollViewを使用。カード高さや本文行数を固定せず、狭い画面ではflexWrapで折り返す。最大幅680、Web上端には既存タブの重なりを避ける余白、下端には既存BottomTabInsetを利用。
- キャラクターはViewの図形のみで独自に描画。外部画像・追加の実行時依存を不要にした。
- モックはView/Textとして表現し、動作しないボタンのアクセシビリティロールを付けない。装飾の顔は読み上げ対象外。
- package-lockの差分は開発依存追加とnpmメタデータ再生成を含む。既存パッケージversion変更・削除は0件と前回確認済み。一括依存更新はしない。

## iPhone実機テスト：成功
実施日: **2026-11-06**。以下はユーザーによる確認済み報告であり、Codex自身が端末を操作した結果ではない。

1. クリーム色の背景・オレンジ色の日記カードが表示される。
2. 丸顔キャラクターと日本語が正常に表示される。
3. 英語学習・日記履歴・英語例文が表示される。
4. スクロールしてもレイアウトが崩れない。
5. クラッシュや赤いエラー画面が表示されない。

端末機種・iOS/Expo Goバージョン・文字拡大・VoiceOver・Android/Web表示は報告なし／未確認。上記5項目を超える確認は成功扱いにしない。

### Expo Goでの再確認手順
以下は再利用用手順。今回ユーザーが実際に使った起動・接続方法の詳細は未報告。

1. 対象ブランチと差分を確認し、ロックファイルに従って依存を用意する。
2. `npx.cmd expo start`（一般的なシェルでは `npx expo start`）を実行する。
3. PCとiPhoneを接続可能なネットワークに置き、表示されたQRコードからSDKに対応するExpo Goで開く。
4. 上記5項目を上から確認し、画面下端までスクロールする。
5. 日付・機種・OS/Expo Goバージョン・結果を記録する。未実装操作に保存・遷移を期待しない。

## 静的検証（2026-11-06再実行）
| コマンド | 結果 |
| --- | --- |
| `npx.cmd eslint src/app/index.tsx src/styles/home.ts eslint.config.js` | 成功、終了コード0、指摘なし |
| `npx.cmd tsc --noEmit` | 失敗、終了コード2、既存WebタブのTS2322 |
| PowerShell: `$env:CI='1'; npx.cmd expo lint` | 失敗、終了コード1、既存Web hookのLintエラー1件 |

PowerShellのnpx.ps1のグローバルnpmパスアクセス警告を避けるためnpx.cmdを使用。最初のLintは依存・設定不足とEACCESで失敗し、許可後に `npx.cmd expo install eslint eslint-config-expo --dev` で導入した。インストール時npm auditはmoderate 12件を報告したが、今回一括修正しない。

### 既存エラーと新規エラーの区別・再現条件
実装前基準は `20127dd`。前回の仕上げ時にホームのバイト列を退避し、基準の `src/app/index.tsx` に一時的に戻して同一依存・今回のESLint設定で両コマンドを実行し、同じエラーを再現後finallyで復元した。タブ・hook・ルート設定が基準と同一であることもgit diffで確認済み。
変更前にはLint環境がなかったため、今回のLint環境で変更前コードにも再現する問題を意味する。今回の追記作業ではアプリコードは変更せず、現在のコードで同じ診断を再確認した。

再現コマンド（別の一時作業領域に基準コードと同じ依存・Lint設定を用意して行う。ユーザー変更を上書きしない）:
```powershell
npx.cmd tsc --noEmit
$env:CI='1'; npx.cmd expo lint
npx.cmd eslint src/app/index.tsx src/styles/home.ts eslint.config.js
```
比較時は依存・設定・コマンドを揃え、変更前後の診断のファイル・位置・ルールを比較する。変更ファイル限定Lint成功をプロジェクト全体成功と混同しない。

### TypeScriptエラー全文
影響: `app-tabs.web.tsx:38` のWeb用TabButtonでRouterのTabTriggerSlotPropsのrefとReact Native Pressableのref型が不一致。プロジェクト全体の型検査を失敗させる。iPhoneの報告済み5項目は成功だが、Webの実行時挙動は未検証。

```text
src/components/app-tabs.web.tsx(38,6): error TS2322: Type '{ children: Element; style: ({ pressed }: PressableStateCallbackType) => false | { opacity: number; }; pointerEvents?: "auto" | "box-none" | "box-only" | "none" | undefined; ... 130 more ...; href?: string | undefined; }' is not assignable to type '{ ref?: Ref<ReactNativeElement> | undefined; }'.
  Types of property 'ref' are incompatible.
    Type 'Ref<(props: Omit<ViewProps, "ref"> & { ref?: Ref<ReactNativeElement> | undefined; }) => ReactNode> | undefined' is not assignable to type 'Ref<ReactNativeElement> | undefined'.
      Type '(instance: ((props: Omit<ViewProps, "ref"> & { ref?: Ref<ReactNativeElement> | undefined; }) => ReactNode) | null) => void | (() => VoidOrUndefinedOnly)' is not assignable to type 'Ref<ReactNativeElement> | undefined'.
        Type '(instance: ((props: Omit<ViewProps, "ref"> & { ref?: Ref<ReactNativeElement> | undefined; }) => ReactNode) | null) => void | (() => VoidOrUndefinedOnly)' is not assignable to type '(instance: ReactNativeElement | null) => void | (() => VoidOrUndefinedOnly)'.
          Types of parameters 'instance' and 'instance' are incompatible.
            Type 'ReactNativeElement | null' is not assignable to type '((props: Omit<ViewProps, "ref"> & { ref?: Ref<ReactNativeElement> | undefined; }) => ReactNode) | null'.
              Type 'ReactNativeElement' is not assignable to type '(props: Omit<ViewProps, "ref"> & { ref?: Ref<ReactNativeElement> | undefined; }) => ReactNode'.
                Type 'ReactNativeElement' provides no match for the signature '(props: Omit<ViewProps, "ref"> & { ref?: Ref<ReactNativeElement> | undefined; }): ReactNode'.
```

### Lintエラー全文
影響: `use-color-scheme.web.ts:11` のhydration effect内の同期setState。全体Lintを失敗させる。ルールが指摘する余分なレンダーの影響は実測していない。

```text

C:\Users\hanam\Documents\GitHub\LittleDiary\src\hooks\use-color-scheme.web.ts
  11:5  error  Error: Calling setState synchronously within an effect can trigger cascading renders

Effects are intended to synchronize state between React and external systems such as manually updating the DOM, state management libraries, or other platform APIs. In general, the body of an effect should do one or both of the following:
* Update external systems with the latest state from React.
* Subscribe for updates from some external system, calling setState in a callback function when external state changes.

Calling setState synchronously within an effect body causes cascading renders that can hurt performance, and is not recommended. (https://react.dev/learn/you-might-not-need-an-effect).

C:\Users\hanam\Documents\GitHub\LittleDiary\src\hooks\use-color-scheme.web.ts:11:5
   9 |
  10 |   useEffect(() => {
> 11 |     setHasHydrated(true);
     |     ^^^^^^^^^^^^^^ Avoid calling setState() directly within an effect
  12 |   }, []);
  13 |
  14 |   const colorScheme = useRNColorScheme();  react-hooks/set-state-in-effect

✖ 1 problem (1 error, 0 warnings)

```
両方とも今回のPRでは修正せず、未解決事項として残す。

## PR #1との依存関係・差分レビュー
- 確認時点でPR #1 (`docs/development-playbook`, `7e843492410f56c47377d7872ea34aec79f7771a`) はopen、mainにはドキュメント未反映。
- 必要な4ファイルをコピーしただけではadd/add競合が発生するため、PR #1の履歴をfeatureブランチへ取り込み、競合した工程記録は更新済み結果、テンプレートは空白除去済み内容を保持。他の2ファイルはPR #1と同一。
- これによりPR #1の先行マージ後も同じ履歴から比較可能。PR #1の変更・クローズやmainへのマージは行わない。PR #1が後で更新された場合は依存差分を再確認する。
- 既存PR #2を再利用し、指定タイトル・本文を更新。今回の追加変更は本記録とドキュメント履歴の統合のみ。アプリ・既存エラーは修正しない。

## 再利用手順・今後の改善・次工程の条件
1. AGENTSと実装指示を読む。ブランチ・未コミット変更・依存PRを確認する。
2. 利用SDKの公式資料を確認し、表示モックと実装済み機能を区別してUIとスタイルを分離する。
3. 変更ファイルLintと全体検証を行い、失敗時は同条件の基準コードでも再現するか調べる。
4. 実機テストの報告者・日付・項目を記録。未報告のテストや成功を推測しない。
5. 差分レビュー後に対象ファイルだけステージし、指定メッセージでコミット・featureへPushしてPRに結果と既存問題を書く。

次工程ではPRレビューとPR #1の統合順序の合意が必要。全体TypeScript/Lint成功の受け入れ条件は未達のため、別途既存Web問題の修正、または既知問題として継続する判断を明示する。文字拡大・VoiceOver・Android/Webの表示検証、端末バージョンの記録を改善候補とする。保存・翻訳・遷移は別工程で仕様と検証範囲を定義してから進める。

## 参照資料（実装時に確認）
- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/llms.txt
- https://docs.expo.dev/versions/v58.0.0/sdk/safe-area-context/
- https://reactnative.dev/docs/scrollview
- https://reactnative.dev/docs/flexbox
- https://reactnative.dev/docs/style
- https://reactnative.dev/docs/text
- https://reactnative.dev/docs/view

### GitHub最終状態の再確認
作業開始時にはopenだったPR #1が、作業中にmerged / closedへ更新されたことをGitHubで確認。Codexはmainへのマージ操作を行っていない。PR #2のbaseは `8b5551d2c5daf518edd3c263a4a2e764ce885562` に更新され、競合なし（mergeable=true）。PR #1の統合待ちは解消済み。次工程の条件はPR #2のレビューと既存Webエラーの扱いの合意。
現在のmainとの差分は、ホーム・スタイル・Lint設定・package.json・lockfile・工程記録・テンプレート末尾空白の7ファイル。READMEと実装指示はmainと同一。Push成功を確認済み。
