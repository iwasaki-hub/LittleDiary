# アーキテクチャ基盤

Foundation 0ではExpo SDK 58、React Native、TypeScript strict、Expo Routerを維持し、アプリコードは次の2ファイルだけとする。

- `src/app/_layout.tsx`: Stackを返すルートレイアウト。
- `src/app/index.tsx`: 初期化スクリプトが生成したプレースホルダー画面。

画面以外のコードは今後src/app外に置く。基盤完成までDB、認証、AI翻訳、日記保存、独自UIは実装しない。依存パッケージの整理も今回の対象外。

旧アプリはexampleへ退避しGit管理する。TypeScript excludeとESLint global ignoresで現行検証から分離する。Routerのルートはsrc/appのままなのでexample/src/appは画面登録されない。アーカイブのエイリアス参照は当時のsrcを前提としており、現在のビルド対象として使わない。

app.json、アイコン・スプラッシュ等の参照画像は保持する。ownerはmasa-practice、EAS project IDは901f2477-82b9-40df-bb93-092019f93990。web.output=serverを維持し、ios/androidを手動生成しない。

[Foundation 0の検証と復元方法](../development/phases/foundation-00-reset.md)
