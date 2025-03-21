/*
    Script Name:   FillinAndRelateForm
    Customer:      VisualVault
    Purpose:       Formulate a query string to fill in and relate another form to the current form.
    Parameters:
      templateId:       ID of the target form template
      fieldMappings:    Array of objects with: sourceFieldName, sourceFieldValue, targetFieldName
      launchType:       'self' to open in the same window, 'blank' to open in a new window.

    Date of Dev: 06/01/2017
    Last Rev Date: 03/18/2025
    Revision Notes:
    06/01/2017 - Tod Olsen: Initial creation.
    01/03/2019 - Kendra Austin: Added launchType to allow redirect in the current window.
    08/21/2019 - Jason Hatch:  Added URL encoding to handle special characters.
    11/19/2020 - Rocky: Added encodeURIComponent.
    06/20/2022 - Franco Petosa Ayala: Updated to ES6.
    03/17/2025 - Moises Savelli:  Integrated encodeURIComponent for both field names and values,
                                  replaced ShowPopUp with window.open, kept ES6 syntax,
                                  and updated base URL logic for public users.
*/

// Determine the correct base URL depending on the user
let baseUrl = VV.BaseURL;
const userInfo = sessionStorage.getItem("UserInfo");
const parsedUserInfo = userInfo ? JSON.parse(userInfo) : undefined;
const isPublic = parsedUserInfo?.name?.trim().toLowerCase() === "public";

if (isPublic) {
  baseUrl = baseUrl.replace("visualvault.com/app", "visualvault.com/Public");
}

// Build the URL to fill in and relate the new form
let popupUrl = `${baseUrl}form_details?formid=${templateId}&RelateForm=${VV.Form.DataID}&IsRelate=true&hidemenu=true`;

// Encode both field names and values
fieldMappings.forEach((fieldMapping) => {
  if (fieldMapping) {
    popupUrl += `&${encodeURIComponent(
      fieldMapping.targetFieldName
    )}=${encodeURIComponent(fieldMapping.sourceFieldValue)}`;
  }
});

// Determine which window to open
let launchMode = "_blank";
if (typeof launchType !== "undefined" && launchType.toLowerCase() === "self") {
  launchMode = "_self";
}

// Open the form
if (launchMode === "_self") {
  VV.Form.ShowLoadingPanel();
  window.location = popupUrl;
} else {
  VV.Form.LastChildWindow = window.open(popupUrl);
}
