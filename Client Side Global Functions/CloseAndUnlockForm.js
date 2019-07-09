//the purpose of this function is to have a reusable function to close a form and unlock it as if they selected Close at the top of the screen.
//HandleFormWindowClosing(true);

var messagedata = 'Are you sure you would like to close this form? Any unsaved changes will be lost.'

var okfunction= function () {
    HandleFormWindowClosing(true);
}

var cancelfunction = function () {
    return;
}

VV.Form.Global.DisplayConfirmMessaging(messagedata,'Close',okfunction,cancelfunction)
