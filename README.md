# GA4で複数プロパティを自動作成

ユニバーサルアナリティクス（UA）にはビューがあったので、特定の人に特定のディレクトリだけ見せたいなどの時に、ビューを活用していたと思います。しかしGA4にはビューがないため、別プロパティを作成する人も多いでしょう。
※Stream IDを活用して、閲覧者にはGA4にはアクセスさせずにデータポータルを使ってStream IDでビューのようなやり方をすることも可能です。

## Google Analytics Admin API、Google Sheet、Google Apps Scriptで作成
全世界に運航しているとある航空会社のUAではビューで国別のフライトを分けていたのですが、GA4ではプロパティで分ける事になり、約20個のGA4プロパティを作成し、各プロパティに約30個のカスタムディメンションを作成しなければなりませんでした。
20×30＝600個ものカスタムディメンションを作成しなければなりません。1個20秒で作成したとしても3時間以上かかりますし、どこかで間違えを起こしても見落とす可能性大なのでかなり疲弊します。そこで今回はGoogle Apps Scriptで[Google Analytics Admin API](https://developers.google.com/analytics/devguides/config/admin/v1)を使用して一括作成します。

全てを一気にやることも可能ですが、今回はわかりやすくするためにプロパティの作成とカスタムディメンションの作成を分けて行います。手順は下記になります。

1. Google SheetにGA4プロパティに必要な情報の一覧を作成
2. Google Apps Scriptで上記を読み込み、複数のGA4プロパティを作成
3. Google SheetにGA4プロパティの一覧とカスタムディメンションの一覧を作成（次回）
4. Google Apps Scriptで上記を読み込み、各プロパティにカスタムディメンションを作成（次回）

# Google SheetにGA4プロパティに必要な情報の一覧を作成
Google Sheetに「properties」シートを作成し、そのシートのA列～E列に下記を記入していきます。

- A列：アカウントID（※accounts/アカウントIDという記述にしてください）
- B列：プロパティ名
- C列：カテゴリ（カテゴリ一覧を参照して当てはまるものを記入 今回は旅行なのでTRAVEL）
- D列：タイムゾーン
- E列：通貨
- F列：空欄（プロパティが作成されたプロパティIDがここに入ります）

# Google Apps Scriptでプロパティを自動生成
今回はGoogle Apps Script（GAS）を使いますが、スクリプトの流れは以下になります。

1. 上記のGoogle Sheetsから必要な情報を読み込む
2. GA4プロパティを1つずつ作成

## Google Sheetsから必要な情報を読み込む
さきほどGoogle Sheetの「properties」シートに作成した情報を読み込む関数getPropetiesConfig()を作成します。

## GA4プロパティを作成
### ServiceからGoogle Analytics Admin APIを追加
GA4のプロパティ作成などをするには「Google Analytics Admin API」が必要になります。GASの「Service」から追加することでGoogle Analytics Admin APIが使用可能になります。

Serviceから「Google Analytics Admin API」を検索して追加。（Identifierはそのまま「AnalyticsAdmin」にしておきます。

追加したら「Service」の下に「AnalyticsAdmin」が表示されます。無事Google Analytics Admin APIを追加できたら、createProperty()関数を記述します。AnalyticsAdmin.Properties.create関数でプロパティを作成します。
参考：[https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties/create](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties/create)

## 作成したプロパティのIDを取得
前述のvar property = AnalyticsAdmin.Properties.create(property) を実行後、propertyには新しく生成されたGA4プロパティが入るので、property.nameでプロパティIDを取得できますが、”properties/”が前に含まれているため取り除く必要があります。

### GA4プロパティの作成を繰り返して、プロパティIDをGoogle Sheetに追記
getPropetiesConfig()関数で取得したプロパティID個数分、createProperty関数を実行して、結果を再びGoogle Sheetに追記します。
mainを実行するとGoogle Sheetで記入したアカウントの下にGA4プロパティが作成され、そして、Google SheetのF列にプロパティIDが追記されている事を確認できます。
プロパティ名やカテゴリ、タイムゾーン、通貨もきちんと反映されていればOKです。
