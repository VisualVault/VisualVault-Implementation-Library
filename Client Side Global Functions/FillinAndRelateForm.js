/*
    Script Name:   FillinAndRelateForm
    Customer:      VisualVault
    Purpose:       The purpose of this function is to formulate a query string that will fillin and relate another form to the current form.    
                    This function would be used over the built in fillin and relate mechanisms because it does not prompt with pop-up blocker.
                    The target field needs to have listener enabled to allow this to populate it.
    Parameters:    The following represent variables passed into the function:  
                    templateId: Id of form template to fill in and relate to the current form instance
                    fieldMappings: array of objects containing: sourceFieldName, sourceFieldValue, targetFieldName

                    Mapped field array example for build fieldMappings
                     var mappedField = {};
                     mappedField.sourceFieldName = 'providerId';
                     mappedField.sourceFieldValue = VV.Form.GetFieldValue('Provider ID');
                     mappedField.targetFieldName = 'Provider ID';

                     fieldMappings.push(mappedField);
                   
    Return Value:  The following represents the value being returned from this function:
                            
    Date of Dev:   
    Last Rev Date: 06/01/2017
    Revision Notes:
    06/01/2017 - Tod Olsen: Initial creation of the business process. 
*/
 
//Opens using new window that is popup blocker safe as long as this function is called from a DOM event handler

var popupUrl = VV.BaseURL + "form_details?formid=" + templateId + "&RelateForm=" + VV.Form.DataID + "&IsRelate=true&hidemenu=true";

fieldMappings.forEach(function (fieldMapping) {
    if (fieldMapping) {
        popupUrl += "&" + fieldMapping.targetFieldName + "=" + fieldMapping.sourceFieldValue;
    }
}, this);

VV.Form.LastChildWindow = ShowPopUp(popupUrl, "", 900, 900, "yes", "yes", "no", "no", "no");

