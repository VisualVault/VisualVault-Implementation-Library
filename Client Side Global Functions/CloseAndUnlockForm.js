//the purpose of this function is to have a reusable function to close a form and unlock it as if they selected Close at the top of the screen.
//Has a parameter of showMessage to determine if a prompt should ask the user if they really want to close.

var messagedata = 'Are you sure you would like to close this form? Any unsaved changes will be lost.'

var okfunction= function () {
    HandleFormWindowClosing(true);
}

var cancelfunction = function () {
    return;
}

if (showMessage == 'No') {
    HandleFormWindowClosing(true);
}
else {
    VV.Form.Global.DisplayConfirmMessaging(messagedata,'Close',okfunction,cancelfunction);
}
