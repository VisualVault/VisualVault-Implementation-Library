/*
1. Choose code blocks from ValidationExamples.js to insert
2. In the Script Editor of a VisualVault Template, click "New Template Script"
3. In the first text box after VV.Form.Template., type in "FormValidation"
4. In the next text box, to the right of "FormValidation," type in "ControlName"
5. In the large text box under FormValidatoin and ControlName, paste this entire script.
6. Save!
7. Under Event Handlers, find the form field that you want to validate. The name of this field should appear somewhere in this script. (e.g. 'Customer Name')
8. Select the blur event.
9. Place your cursor in the large text box under 'function'
10. In the "Template" tab at the top right of the Script Editor, select VV.Form.Template.FormValidation. Click "Add Function"
11. Put a semi-colon at the end of the function.
12. Replace ControlName with 'FieldName' (ex: 'Customer Name') Include the apostrophes.
13. Save!

*/

//pass in ControlName to validate a single item or nothing to validate everything.
var ErrorReporting = true;

var RunAll = false;
if (ControlName == null) {
    RunAll = true;
}

//Choose code blocks from ValidationExamples.js to insert here

return ErrorReporting;
