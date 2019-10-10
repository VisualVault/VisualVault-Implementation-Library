/*
    Script Name:   AdminSave
    Customer:      VisualVault
    Purpose:       This function checks if the Admin Override is still checked and reminds users to uncheck and save.  
    Parameters:    The following represent variables passed into the function:  
                   No Parameters

    Return Value:  The following represents the value being returned from this function:
                        No Information returned       


    Date of Dev:   10/07/2019
    Last Rev Date: 

    Revision Notes:
    10/07/2019 - Kendra Austin: Initial creation of the business process. 

*/
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
