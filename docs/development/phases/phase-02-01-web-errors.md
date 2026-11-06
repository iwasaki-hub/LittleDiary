# Phase 2 / Step 2-1.1：既存Web TypeScript・Lintエラー修正

- 日付: 2026-11-06
- ステータス: 静的検証成功 / Webブラウザ操作・iPhone実機未確認
- 担当: Codex
- ブランチ: `fix/web-types-and-lint`
- 基準: 最新origin/main `702fa4f`（PR #2 mergedを確認してから開始）
- 実行環境: Windows / Expo ~58.0.23 / expo-router ~58.0.30 / React 19.3.0 / React Native 0.88.1 / TypeScript ~6.0.3

## 目的・背景
ホームUIを維持し、Step 2-1で既存問題として記録したWebタブの型不整合とテーマhookのLint違反を解決する。

## スコープ
- `src/components/app-tabs.web.tsx`: TabButtonのref型のみを実際の転送先に合わせる。
- `src/hooks/use-color-scheme.web.ts`: サーバー／hydrationの判定方式を修正。
- 本記録をテンプレートの目的・スコープ・検証・振り返り構成に基づいて追加。
- ホーム、デザイン、ネイティブタブ、ルート構造、依存、TS設定、Lint設定は変更しない。

## 実装計画・開始確認
1. AGENTS.md、package.json、開発記録README、テンプレートを確認。開始時の作業ツリーはクリーン。
2. GitHubでPR #2のmergedを確認。fetchした最新mainから新規ブランチを作成。同名ローカル／リモートブランチはなし。
3. 修正前の両エラーを再現し、SDK 58公式APIとインストール済み型・実装を調査。
4. 最小修正、修正後の検証、差分レビュー、記録、指定メッセージでコミット・Pushしmain向けPRを作成。mainへ直接Push・マージしない。

## 問題の概要・再現手順
基準mainに依存を導入済みの状態で次を実行した。
```powershell
npx.cmd tsc --noEmit
$env:CI='1'; npx.cmd expo lint
```
TypeScriptは終了コード2、Lintは終了コード1。以下は今回採取した修正前の診断全文。

### TypeScript
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

### ESLint
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

## 原因分析・修正内容・判断
### タブのref型
確認した事実:
- `node_modules/expo-router/build/ui/TabTrigger.d.ts` のTabTriggerSlotPropsはPressable由来propsに `React.RefAttributes<View>` を交差している。
- RN 0.88.1の生成型 `types_generated/Libraries/Components/View/View.d.ts` ではViewはコンポーネント関数。refが指すインスタンスとコンポーネント型が異なる。
- Pressableの生成型はホストのPressableInstanceへのrefを受け取る。このためRouter由来のRef<View>をそのまま転送するとTS2322になる。
- RouterのTabTrigger実装はasChild時にSlotを使い、props・triggerProps・hrefを子へ渡す。

変更前: TabButtonはTabTriggerSlotPropsをそのまま受け取り、残余propsをPressableへ展開。
変更後:
```typescript
import type { ComponentProps } from 'react';
type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> &
  Pick<ComponentProps<typeof Pressable>, 'ref'>;
```
TabButtonの引数型をこの型に変更した。他のprops・onPress・href・isFocused・refの転送処理とJSX構造は同じ。実際の転送先からrefを導出して、不正なrefを受け付けない。

代替案: refの削除は転送機能を失うため不採用。any、型アサーション、ts-ignore、strict緩和、検査除外、依存更新は不使用。forwardRefへの置き換えだけでは元のref型不整合は解決せず、React 19ではpropsでrefを受け取れるため不要。

### hydration判定
確認した事実:
- 元のhookはfalseで開始し、effect内setHasHydrated(true)後にRNのテーマ値を返す。SSRと初期hydrationの出力をlightで合わせる目的。
- React公式はeffect内の同期setStateが追加レンダーを招くと説明している。
- useSyncExternalStoreのgetServerSnapshotはSSRとクライアントhydrationに使われ、その後はgetSnapshotを使う。

変更前: useState(false)とuseEffect内の同期setState。
変更後: useSyncExternalStoreに安定したモジュールスコープのsubscribe、client=true、server=falseを渡す。hydration自体を判定するため外部イベント購読はなく、subscribeはno-op cleanupを返す。テーマの購読は引き続きRNのuseColorSchemeが担当する。
SSR・初期hydrationはlight、その後は端末テーマ（nullも含む）を返す。SSRを伴わないクライアントのみのマウントでは最初から端末テーマを返すため、旧実装の一時的なlight描画とは異なる。これはhydration不整合のない経路で不要な切り替えを避ける設計判断。実ブラウザでの表示・切り替えは未検証。

代替案: hydration判定の削除はSSR不一致を招くため不採用。setTimeoutでsetStateを遅らせる案は状態と余分なレンダーを残すため不採用。Lint無効化はしない。

## 検証結果・受け入れ条件
| 項目 | 修正前 | 修正後 |
| --- | --- | --- |
| `npx.cmd tsc --noEmit` | 失敗、終了コード2、TS2322 | 成功、終了コード0 |
| `$env:CI='1'; npx.cmd expo lint` | 失敗、終了コード1、1 error | 成功、終了コード0、指摘なし |
| `npx.cmd expo-doctor` | 初回実行はnpm取得時EACCES、診断未実行 | ネットワーク許可後成功、終了コード0、20/20 checks passed |
| `git diff --check` | — | 成功（CRLF変換予告のみ） |
| `npx.cmd expo export --platform web --output-dir .expo/web-errors-check` | 未実施 | 成功、終了コード0、Web・サーバーバンドル生成 |
| `CI=1 npx.cmd expo start --web --port 8085` | 未実施 | 開発サーバー起動、localhost:8085待受を確認 |
| Webブラウザ表示・Home/Exploreクリック・テーマ変更 | 未実施 | 未実施。CUAが「The browser access host is unavailable」を返した |
| iPhone実機 | 今回未実施 | ユーザー確認待ち。前工程の実機成功を今回の確認に流用しない |

Expo Doctorはnpxキャッシュにexpo-doctor@1.21.6を取得して実行。プロジェクト依存の追加・更新はなし。実行できた診断は20/20成功で問題報告なし。修正前Doctorは取得失敗のため、修正前後の診断件数比較は実施していない。
Web export時のNO_COLOR/FORCE_COLOR警告は出力色の警告で、ビルドは成功した。

追加のSSRスモーク検証: NodeでTypeScript.transpileModuleにより実際のhookを一時的にCommonJS化し、RN useColorSchemeのみdark/light/nullを返すスタブへ差し替え、React DOM serverのrenderToStringで実行。3条件とも `<span>light</span>` となることをassertし成功。React自身のuseSyncExternalStoreを使用した。ブラウザhydration後の実行・テーマ変更テストの代用とはしない。検証用依存・テストファイルの追加なし。

- [x] 全体TypeScript成功
- [x] 全体ESLint成功
- [x] Expo Doctor問題なし
- [x] ホームUIとネイティブ・ルート構造はコード差分なし
- [ ] Web実ブラウザでのタブ操作・テーマ変更（環境制約）
- [ ] iPhoneでホーム、スクロール、Home/Explore切り替え、ライト／ダーク表示、クラッシュなしを確認（ユーザー）

## 振り返り・他プロジェクトに再利用できる知見
- SDK更新時はpackage.jsonのmajorに対応する公式資料と、実際にインストール済みの.d.ts・実装の両方を確認する。ドキュメントの例だけでは型の世代差まで判断できない。
- refの型はコンポーネント本体とインスタンスを区別し、転送先のComponentPropsから導出する。型の隠蔽やref破棄で検証を通さない。
- HooksのLint違反はeffectの役割を確認する。SSR/hydrationの値はgetServerSnapshot、OSテーマ変更は既存のテーマ購読と責務を分ける。
- 開始時に同一依存・設定で失敗ログと終了コードを採取し、必要最小限の変更後に同じコマンドで比較する。ホームや依存が変わっていないことも差分で証明する。
- 静的検証・バンドル成功・SSR単体検証・実ブラウザ・実機を別々に記録し、実行していない段階を成功扱いにしない。

## 次の工程
PRレビューとWebブラウザ／iPhone確認。ブラウザ接続可能な環境でHome→Explore→Home、OSテーマ変更、初期hydrationの警告有無を確認する。新機能やデザイン変更は別工程。

## 参考にした公式資料
- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Expoドキュメント索引](https://docs.expo.dev/llms.txt)
- [SDK 58 Router UI](https://docs.expo.dev/versions/v58.0.0/sdk/router/ui/)
- [React useSyncExternalStore / server rendering](https://react.dev/reference/react/useSyncExternalStore#adding-support-for-server-rendering)
- [React set-state-in-effect](https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect)
- [React Native Pressable](https://reactnative.dev/docs/pressable)

## 最終差分レビュー補足
- 開発サーバーへのHTTPリクエストは200で成功し、返却HTMLに「今日も、いい一日に。」が含まれることを確認。ブラウザ描画や操作の検証とは区別する。
- `git diff --exit-code origin/main -- src/app src/styles/home.ts src/components/app-tabs.tsx package.json package-lock.json` 成功。ホーム・ネイティブタブ・依存は変更なし。
- 作業差分はWebタブ、Web hook、本記録の3ファイルのみ。
