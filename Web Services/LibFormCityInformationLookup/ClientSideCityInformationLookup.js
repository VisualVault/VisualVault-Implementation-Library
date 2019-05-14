//Call CityInformationLookup form template example.

var CityInformationLookup = function () {
    VV.Form.ShowLoadingPanel();
    //This gets all of the form fields.
    var formData = VV.Form.getFormDataCollection();

    //Following will prepare the collection and send with call to server side script.
    var data = JSON.stringify(formData);
    var requestObject = $.ajax({
        type: "POST",
        url: VV.BaseAppUrl + 'api/v1/' + VV.CustomerAlias + '/' + VV.CustomerDatabaseAlias + '/scripts?name=CityInformationLookup',
        contentType: "application/json; charset=utf-8",
        data: data,
        success: '',
        error: ''
    });

    return requestObject;
};



$.when(
    CityInformationLookup()
).always(function (resp) {
    VV.Form.HideLoadingPanel();
    var messageData = '';
    if (typeof (resp.status) != 'undefined') {
        messageData = "A status code of " + resp.status + " returned from the server.  There is a communication problem with the  web servers.  If this continues, please contact the administrator and communicate to them this message and where it occured.";

    }
    else if (typeof (resp.statusCode) != 'undefined') {
        messageData = "A status code of " + resp.statusCode + " with a message of '" + resp.errorMessages[0].message + "' returned from the server.  This may mean that the servers to run the business logic are not available.";

    }
    else if (resp.meta.status == '200') {
        if (resp.data[0] != 'undefined' && resp.data[0] == 'Success') {
            VV.Form.SetFieldValue('City', resp.data[2].City)
            VV.Form.SetFieldValue('State', resp.data[2].State);
            VV.Form.SetFieldValue('County', resp.data[2].County)
            
        }
        else if (resp.data[0] != 'undefined' && resp.data[0] == 'Error') {

        }
        else {
            messageData = 'The status of the response returned as undefined.';


        }
    }
    else {
        messageData = resp.data.error + '<br>';


    }
});
