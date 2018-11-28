//Find, Update, and Relate Named Child Forms

var FindUpdateRelateChildForms = function () {
    VV.Form.ShowLoadingPanel();

    //This gets all of the form fields.
    var formData = VV.Form.getFormDataCollection();

    //The following add any additional items to the form field collection.
    var FormInfo = {};
    FormInfo.name = 'REVISIONID';
    FormInfo.value = VV.Form.DataID;
    formData.push(FormInfo);

    //Following will prepare the collection and send with call to server side script.
    var data = JSON.stringify(formData);
    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + 'api/v1/' + VV.CustomerAlias + '/' + VV.CustomerDatabaseAlias + '/scripts?name=ParentFormFindUpdateRelateManyChildForms',
        contentType: "application/json; charset=utf-8",
        data: data,
        success: '',
        error: ''
    });

    return requestObject;
};

$.when(
    FindUpdateRelateChildForms()
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
        if (typeof (resp.data[0]) != 'undefined') {
            if (resp.data[0] == 'Success') {
                messageData = "Child forms were found, updated, and related successfully. ";

                if (typeof (resp.data[1]) != 'undefined') {
                    messageData += resp.data[1];
                }

                VV.Form.DoPostbackSave();
                VV.Form.Global.DisplayMessaging(messageData);
            }
            else if (resp.data[0] == 'Error' && typeof (resp.data[1]) != 'undefined') {
                messageData = resp.data[1];
            }
            else {
                messageData = "The call to find, update, and relate child forms returned with a successful status, but unexpected results. The status code returned was: " + resp.data[0];
            }
        }
        else if (typeof (resp.data[1]) != 'undefined') {
            messageData = "The call to find, update, and relate child forms returned with a successful status, but unexpected results. The status message returned was: " + resp.data[1];
        }
        else {
            messageData = 'The call to find, update, and relate child forms returned with a successful status, but with invalid data. There is no status code or status message to display.';
        }
    }
    else {
        messageData = resp.data.error + '<br>';
    }

    VV.Form.HideLoadingPanel();
    VV.Form.Global.DisplayMessaging(messageData);

});
