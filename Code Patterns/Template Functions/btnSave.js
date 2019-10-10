var validationResults = VV.Form.Template.FormValidation();

if (validationResults == true) {
    VV.Form.DoPostbackSave();
}
else {
    var messageData = 'All of the fields have not been filled in completely or there is an issue with the range of the data entered.  Highlight your mouse over the red icon to see how you can resolve the error stopping you from saving this form.';
    VV.Form.Global.DisplayMessaging(messageData, 'Missing Information');
}
