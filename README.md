
> [!NOTE]
> This article contains information as of July 2022. Please take a look at the official website for the latest updates.


Google Analytics Universal Analytics (UA) had views, which allowed users to control visibility for specific directories. However, GA4 does not have views, prompting many users to create separate properties.

*Note: It is also possible to use Stream IDs to create a "view-like" setup by sharing data through Data Studio without granting access to GA4.*

# Using Google Analytics Admin API, Google Sheets, and Google Apps Script
A global airline previously organized flights by country using views in UA. With GA4, they chose to use separate properties, requiring the creation of 20 GA4 properties, each with about 30 custom dimensions.

This meant creating 600 custom dimensions (20×30). At 20 seconds per dimension, it would take over three hours, with a high risk of errors. This guide explains how to automate this process using [Google Analytics Admin API](https://developers.google.com/analytics/devguides/config/admin/v1) and Google Apps Script (GAS).

## Steps
The process is divided into two main parts for simplicity:
1. Create a Google Sheet listing the necessary details for GA4 properties.
2. Use Google Apps Script to read the sheet and create multiple GA4 properties.
3. Generate a list of GA4 properties and custom dimensions in Google Sheets (covered later).
4. Use Google Apps Script to read this list and create custom dimensions for each property (covered later).

## Creating a List of Required Information for GA4 Properties in Google Sheets
Create a sheet named "properties" in Google Sheets and populate columns A through E with the following information:

- **Column A:** Account ID (use the format accounts/<account_id>)
- **Column B:** Property Name
- **Column C:** Industry Category (choose from predefined categories, e.g., TRAVEL)
- **Column D:** Time Zone
- **Column E:** Currency
- **Column F:** Leave blank (Property IDs will be added here after creation)

![Example Sheet](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/b5638c3a-70b6-5e3b-8ee0-faffbbae33fc.png)

## Automating Property Creation with Google Apps Script
We will use Google Apps Script to automate property creation. The script will:
1. Read the required information from the Google Sheet.
2. Create each GA4 property.

### Reading Information from Google Sheets
First, create a function `getPropertiesConfig()` to read the data from the "properties" sheet. While `sheet.getRange(...).getValues()` can fetch the data at once, reading it row by row allows flexibility for future updates.

```javascript
const FILEKEY = "abcdefghijklmno"; // Google Sheets key from the URL

function getPropertiesConfig() {
  const sheetName = 'properties';
  const spreadsheet = SpreadsheetApp.openById(FILEKEY);
  const sheet = spreadsheet.getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();

  const config = [];
  for (let i = 2; i <= lastRow; i++) {
    const accountId = sheet.getRange(i, 1).getValue();
    if (!accountId) break;

    config.push({
      row: i,
      parent: accountId,
      displayName: sheet.getRange(i, 2).getValue(),
      industryCategory: sheet.getRange(i, 3).getValue(),
      timeZone: sheet.getRange(i, 4).getValue(),
      currencyCode: sheet.getRange(i, 5).getValue(),
    });
  }
  return config;
}
```

### Adding Google Analytics Admin API to Your Project
To create GA4 properties, add the [Google Analytics Admin API](https://developers.google.com/analytics/devguides/config/admin/v1) to your Apps Script project.

1. Open the Apps Script editor and click on "Services."
2. Search for "Google Analytics Admin API" and add it. Use the default identifier "AnalyticsAdmin."

![Adding Analytics Admin API](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/038914bf-94ad-991e-9a97-b16770d11720.png)


## Creating GA4 Properties
### Adding Google Analytics Admin API from the Service Menu
To create GA4 properties, you need to use the [Google Analytics Admin API](https://developers.google.com/analytics/devguides/config/admin/v1). This API can be enabled in GAS by adding it from the "Service" menu.

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/038914bf-94ad-991e-9a97-b16770d11720.png)

Search for "Google Analytics Admin API" in the Service menu and add it. Keep the identifier as "AnalyticsAdmin."

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/1796c3f3-48d6-399b-45a7-6da77174c070.png)

Once added, "AnalyticsAdmin" will appear under "Service."

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/05f7ed81-06e2-0021-57ac-754e035e48dd.png)

After successfully adding the Google Analytics Admin API, write the `createProperty()` function. This function uses `AnalyticsAdmin.Properties.create` to create a property.

```javascript
function createProperty(parent, displayName, industryCategory, timeZone, currencyCode) {
  try {
    var property = {
      "parent": parent,
      "displayName": displayName,
      "industryCategory": industryCategory,
      "timeZone": timeZone,
      "currencyCode": currencyCode,
    };
    var property = AnalyticsAdmin.Properties.create(property);
    return property;
  } catch (e) {
    Logger.log(e.message);
    throw ("createProperty: " + displayName + "\t" + e.message);
  }
}
```

Reference: [https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties/create](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties/create)

## Retrieving the Created Property ID
After executing `var property = AnalyticsAdmin.Properties.create(property)`, the created GA4 property is stored in `property`. You can retrieve the property ID using `property.name`, but it includes the prefix `properties/`, which needs to be removed.

### Iteratively Creating GA4 Properties and Writing Property IDs to Google Sheets
Use the `getPropertiesConfig()` function to retrieve the list of properties, then execute the `createProperty()` function for each. Write the resulting property IDs back to Google Sheets.

```javascript
function main() {
  var properties = getPropertiesConfig();
  var retProps = [];
  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    property = createProperty(property.parent, property.displayName, property.industryCategory, property.timeZone, property.currencyCode);
    retProps.push(property);
    var propertyId = property.name.replace("properties/", ""); // Remove "properties/" from the property ID
    Logger.log(property.row + "\t" + property.displayName + "\t" + propertyId);
    setPropertyIdToSheet(property.row, propertyId);
  }
}

function setPropertyIdToSheet(row, propertyId) {
  var sheetName = 'properties';
  var spreadsheet = SpreadsheetApp.openById(FILEKEY);
  var sheet = spreadsheet.getSheetByName(sheetName);
  sheet.getRange(row, 6).setValue(propertyId);
  return true;
}
```

When you run the `main` function, GA4 properties will be created under the specified accounts as entered in Google Sheets.

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/3627b4e7-d185-2ab6-31af-54f6ff2f25db.png)

You can also verify that the property IDs have been added to column F in Google Sheets.

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/6f6e356a-7289-9a4d-5f63-150ef7eaa6e1.png)

Ensure that the property names, categories, time zones, and currencies are correctly reflected.

![image.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/3939399/5c7d30f9-97e5-c2e1-d4fe-b298ef4541ee.png)

P.S. I had to create 40 properties for another project...
