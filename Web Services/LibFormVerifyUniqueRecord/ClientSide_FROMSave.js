//SaveForm
var VerifyAndSave = function () {
    //This gets all of the form fields.
    VV.Form.ShowLoadingPanel();
    var formData = VV.Form.getFormDataCollection();

    //The following add any additional items to the form field collection.
    var formRevId = {};
    formRevId.name = 'Revision ID';
    formRevId.value = VV.Form.DataID;
    formData.push(formRevId);


    //Following will prepare the collection and send with call to server side script.  "FORMSave" is the name of the web service being called from VV.
    var data = JSON.stringify(formData);
    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + 'api/v1/' + VV.CustomerAlias + '/' + VV.CustomerDatabaseAlias + '/scripts?name=FORMSave',
        contentType: "application/json; charset=utf-8",
        data: data,
        success: '',
        error: ''
    });

    return requestObject;
};

var okfunction = function () {
    //Used for actions to take after a confirmation message if it is present.  Put last save in here if using a confirmation.
}

var cancelfunction = function () {
    //Used for actions to take if a confirmation is canceled.
}

$.when(
    VerifyAndSave()
).always(function (resp) {
    VV.Form.HideLoadingPanel();
    var messageData = '';
    if (typeof (resp.status) != 'undefined') {
        messageData = "A status code of " + resp.status + " returned from the server.  There is a communication problem with the  web servers.  If this continues, please contact the administrator and communicate to them this message and where it occured.";
        VV.Form.Global.DisplayMessaging(messageData);
    }
    else if (typeof (resp.statusCode) != 'undefined') {
        messageData = "A status code of " + resp.statusCode + " with a message of '" + resp.errorMessages[0].message + "' returned from the server.  This may mean that the servers to run the business logic are not available.";
        VV.Form.Global.DisplayMessaging(messageData);
    }
    else if (resp.meta.status == '200') {
        if (resp.data[0] != 'undefined') {
            if (resp.data[0] == 'Unique') {
                messageData = 'Form is saved when the yellow banner appears above.';
                VV.Form.SetFieldValue('Form Saved', 'true');
                VV.Form.DoPostbackSave();
            }
            else if (resp.data[0] == 'Not Unique') {
                //CPR is not unique. Display message to user
                messageData = 'A duplicate FORM NAME was found.  You cannot save this form at this time.  \n\n';

                VV.Form.Global.DisplayMessaging(messageData);
            }
            else if (resp.data[0] == 'Error') {
                messageData = 'An error was encountered while checking if this record is unique.  The error returned was ' + resp.data[1] + '.  The form will not save at this time.  Please try again or communicate this error to support.';
                VV.Form.Global.DisplayMessaging(messageData);
            }
            else {
                messageData = 'An unhandled response occurred from the unique record checking mechanism.  The form will not save at this time.  Please try again or communicate this issue to support.';
                VV.Form.Global.DisplayMessaging(messageData);
            }
        }
        else {
            messageData = 'The status of the response returned as undefined.';
            VV.Form.Global.DisplayMessaging(messageData);
        }
    }
    else {
        messageData = resp.data.error + '<br>';
        VV.Form.Global.DisplayMessaging(messageData);
    }

});
