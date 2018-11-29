/*
    Script Name:   CanUserCompleteWFTask
    Customer:      VisualVault
    Purpose:       This function determines if a user can complete the task.  
    Parameters:    The following represent variables passed into the function:  
                   taskId:   This is the GUID of the task.
    Return Value:  The following represents the value being returned from this function:
                        days:  Returns a number that represents the days between 2 dates.        
    Date of Dev:   
    Last Rev Date: 06/01/2017
    Revision Notes:
    06/01/2017 - Austin Noel: Initial creation of the business process. 
*/


//Get the logged in user UsID and form DhDocID
var usId = VV.Form.FormUsID;
var formDocId = VV.Form.DhDocID;

return $.ajax({
    url: VV.BaseAppUrl + "/api/v1/" + VV.CustomerAlias + "/" + VV.CustomerDatabaseAlias + "/Users/" + usId + "/workflowtask?taskId=" + taskId + "&formId=" + formDocId,
    cache: false,
    type: "GET",
    dataType: "json"
}).then(function (resp) {
    var returnObj = {
        result: false,
        error: false
    };

    if (resp.meta.status === 200) {
        returnObj.result = resp.data;
    } else {
        returnObj.error = true;
    }

    return returnObj;
});
