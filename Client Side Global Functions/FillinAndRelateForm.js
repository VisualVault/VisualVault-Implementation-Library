/*
    Script Name:   FillinAndRelateForm
    Customer:      VisualVault
    Purpose:       The purpose of this function is to formulate a query string that will fillin and relate another form to the current form.    
                    This function would be used over the built in fillin and relate mechanisms because it does not prompt with pop-up blocker.
                    The target field needs to have listener enabled to allow this to populate it.
    Parameters:    The following represent variables passed into the function:  
                    templateId: Id of form template to fill in and relate to the current form instance
                    fieldMappings: array of objects containing: sourceFieldName, sourceFieldValue, targetFieldName
                    launchType: 'self' launches the target form in the same window - 'blank' launches the target form in a new window.
                    Mapped field array example for build fieldMappings
                     var mappedField = {};
                     mappedField.sourceFieldName = 'providerId';
                     mappedField.sourceFieldValue = VV.Form.GetFieldValue('providerId');
                     mappedField.targetFieldName = 'Provider ID';
                     fieldMappings.push(mappedField);
                   
    Return Value:  The following represents the value being returned from this function:
                            
    Date of Dev: 06/01/2017   
    Last Rev Date: 06/20/2022
    Revision Notes:
    06/01/2017 - Tod Olsen: Initial creation of the business process. 
    01/03/2019 - Kendra Austin: Add launchType for option to redirect in the current window instead of opening new. 
    08/21/2019 - Jason Hatch:  Added mechanism to encode the URL so that it will change characters like a + sign in the email into an encoded value.
    06/20/2022 - Franco Petosa Ayala: Update to ES6.
                                      Changed the conditional structure (setting the launch mode) to improve code readability.
*/

//Opens using new window that is popup blocker safe as long as this function is called from a DOM event handler
let popupUrl = `${VV.BaseURL}form_details?formid=${templateId}&RelateForm=${VV.Form.DataID}&IsRelate=true&hidemenu=true`;

fieldMappings.forEach( fieldMapping => {
    if (fieldMapping) {
        //Concatenates the params to the url
        popupUrl += `&${fieldMapping.targetFieldName}=${fieldMapping.sourceFieldValue}`;
    }
}, this);

//Determine action by the window that is launched.
let launchMode = '';
if ( typeof launchType != 'undefined' && launchType.toLowerCase() == "self") {
    launchMode = "_self";
} else{
    launchMode = "_blank";
}

popupUrl = popupUrl.replace('+', '%2B');

if (launchMode == '_self') {
    VV.Form.ShowLoadingPanel();
    window.location = popupUrl;
} else {
    VV.Form.LastChildWindow = ShowPopUp(popupUrl, "", 900, 900, "yes", "yes", "no", "no", "no");
}
