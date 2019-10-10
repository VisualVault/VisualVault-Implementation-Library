//This code should be added to the blur event of a field you want to format
//Phone, Zip, SSN, FEIN

/*
1. Replace FieldName with the name of the phone number, zip code, social security number, or FEIN field. Leave the apostrophes.
2. Replace VV.Form.Global.FormatREPLACE with one of the functions below:
    VV.Form.Global.FormatFEIN
    VV.Form.Global.FormatPhone
    VV.Form.Global.FormatSSN
    VV.Form.Global.FormatZipCode
3. In the Script Editor of a VisualVault template, find the Form Field Control you wish to format and validate.
4. Click the Blur event of the field. Place your cursor in the large text box under the word "function."
5. Paste this code into the text box.
6. Save!
*/

var enteredValue = VV.Form.GetFieldValue('FieldName');
var formattedVal = VV.Form.Global.FormatREPLACE(enteredValue);

if (formattedVal != enteredValue) {
    VV.Form.SetFieldValue('FieldName', formattedVal);
}
else {
    VV.Form.Template.FormValidation('FieldName');
}
