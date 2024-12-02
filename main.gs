/*
* GA4で複数プロパティを自動作成
*/
/*
* Google Sheetsから必要な情報を読み込む
*/
const FILEKEY ="abcdefghijklmno"; // GoogleSheetのキー（URLの一部分） 例：https://docs.google.com/spreadsheets/d/abcdefghijklmno/edit#gid=0

function getPropetiesConfig(){
  var sheetName = 'properties';
  var retConfig = [];
  var spreadsheet = SpreadsheetApp.openById(FILEKEY);
  //  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  var tmpLastRow = sheet.getLastRow();
//  var retConfig= sheet.getRange(2,1,tmpLastRow-1,5).getValues();
//  return retConfig;
  for(var i = 2;i <= sheet.getLastRow();i++){
   var val = sheet.getRange(i, 1).getValue();
    if (!val) {
      break;
    }else{
      var tmp ={};
      tmp['row'] = i;
      tmp['parent'] = sheet.getRange(i,1).getValue();
      tmp['displayName'] = sheet.getRange(i,2).getValue();
      tmp['industryCategory'] = sheet.getRange(i,3).getValue();
      tmp['timeZone'] = sheet.getRange(i,4).getValue();
      tmp['currencyCode'] = sheet.getRange(i,5).getValue();
      retConfig.push(tmp);
    }
  } 
    return retConfig;
}

/*
* ServiceからGoogle Analytics Admin APIを追加
*/
function createProperty(parent, displayName, industryCategory, timeZone, currencyCode){
  try{
    var property = {
      "parent": parent,
      "displayName": displayName,
      "industryCategory": industryCategory,
      "timeZone": timeZone,
      "currencyCode":currencyCode,
    }
    var property = AnalyticsAdmin.Properties.create(property);
    return property;
  }catch(e){
    Logger.log(e.message);
    throw ("createPropery:" + displayName + "\te.message");
  }
}

/*
* GA4プロパティの作成を繰り返して、プロパティIDをGoogle Sheetに追記
*/
function main(){
  var properties= getPropetiesConfig();
  var retProps = [];
  for(var i=0;i<properties.length;i++){
    var property = properties[i];
    property = createProperty(property);
    retProps.push(property);
    var propertyId = property.name.replace("properties/",""); // プロパティIDからproperties/を削除
    Logger.log(p.row +"\t" + p.displayName +"\t" + propertyId);
    setPropertyIdToSheet(p.row, propertyId);
  }
 // Logger.log(retProps);
}
/*
* 結果をpropertiesシートのF列に追記する
*/
function setPropertyIdToSheet(row, propertyId){
  var sheetName = 'properties';
  var retConfig = [];
  var spreadsheet = SpreadsheetApp.openById(FILEKEY);
  var sheet = spreadsheet.getSheetByName(sheetName);
  sheet.getRange(row, 6).setValue(propertyId);
  return true;
}
