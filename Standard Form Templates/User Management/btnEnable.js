var validationResults = VV.Form.Template.FormValidation();

if (validationResults == true) {

    var okfunction = function () {
        VV.Form.Template.EnableUser();
    }

    var cancelfunction = function () {
        return;
    }

    //Display confirmation message
    var messageData = 'You have indicated that this user account should be enabled. If you continue, this user will now be able to log in. Click OK to continue or Cancel to keep the user account disabled.';
    var res = VV.Form.Global.DisplayConfirmMessaging(messageData, 'Confirm Action', okfunction, cancelfunction);
}
else {
    var messageData = 'All of the fields have not been filled in completely or there is an issue with the range of the data entered.  Highlight your mouse over the red icon to see how you can resolve the error stopping you from saving this form.';
    VV.Form.Global.DisplayMessaging(messageData, 'Missing Information');
}
