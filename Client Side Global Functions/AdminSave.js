//Admin Save
var okfunction = function () {
    VV.Form.DoPostbackSave();
}

var cancelfunction = function () {

}

if (VV.Form.GetFieldValue('Admin Override').toLowerCase() == 'true') {
    var messagedata = 'The Admin Override checkbox is still checked. This means read-only fields can be edited, and hidden information can be seen. Are you sure you want to save?';
    VV.Form.Global.DisplayConfirmMessaging(messagedata, 'Confirm', okfunction, cancelfunction);
}
else {
    okfunction();
}
