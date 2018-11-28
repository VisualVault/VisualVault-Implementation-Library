var vvEntities = require("../VVRestApi");
var logger = require('../log');


module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "CUSTOMERALIAS";
    options.databaseAlias = "DATABASEALIAS";
    options.userId = "USERID";
    options.password = "PASSWORD";
    options.clientId = "DEVELOPERKEY";
    options.clientSecret = "DEVELOPERSECRET";
    return options;
};

module.exports.main = function (ffCollection, vvClient, response) {

    /*Script Name:   ParentFormUpdateandRelateChildForm
      Customer:      Kendra Austin Demo
      Purpose:       The purpose of this script is to find the Child Form using the Child Form ID, update the fields on that form, and relate it to the current parent form. 
      Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.  Any item in the array at points 2 or above can be used to return multiple items of information.
                     0 - Status: Success or Error
                     1 - Message
      Date of Dev:   11/21/2018
      Last Rev Date:
 
      Revision Notes:
      11/21/2018: Kendra Austin - Initial creation of the business process. 
        
      */

    logger.info('Start of the process ParentFormPostNewChildForm at ' + Date());

    var Q = require('q');

    //Initialization of the return object
    var returnObj = [];    //Variable used to return information back to the client.

    //Initialization of script variables
    var revisionId = '';                    //Used to store the revision ID of the current form
    var childFormId = '';                   //Used to store the form ID of the child form, as it was entered on the parent form. 
    var targetTemplateName = 'Child Form';      //Used to store the template name of the target form. 
    var childFormRevisionId = '';           //Used to store the revision ID of the child form, as returned by the getForms call.

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {
        //Extract the values of the passed in fields
        revisionId = ffCollection.getFormFieldByName('REVISIONID').value;
        childFormId = ffCollection.getFormFieldByName('Child Form ID').value;

        //Validate passed in fields
        if (!revisionId || revisionId == '') {
            throw new Error("The fieldName parameter was not supplied.");
        }
    })
        .then(function () {
            //Run a query to get the child form with the Form ID entered in the Parent Form

            var childFormInfo = {};
            childFormInfo.q = "[Child Form ID] eq '" + childFormId + "'";
            childFormInfo.fields = 'name,date,id';

            return vvClient.forms.getForms(childFormInfo, targetTemplateName).then(function (formResponse) {
                //measure results
                var formResp = JSON.parse(formResponse);
                if (formResp.meta.status === 200) {
                    if (formResp.data.length == 1) {
                        //Success, assign revision ID to variable
                        childFormRevisionId = formResp.data[0].revisionId;
                    }
                    else {
                        throw new Error("The call to get forms returned with an unexpected number of records. The number of records returned was: " + formResp.data.length);
                    }
                }
                else {
                    //Error handling
                    throw new Error("The call to get forms returned with an error. The status returned was: " + formResp.meta.status);
                }
            })
        })
        .then(function () {
            //Collect field info for passing into the global function
            var formData = [];

            var revisionInfo = {};
            revisionInfo.name = 'REVISIONID';
            revisionInfo.value = revisionId;
            formData.push(revisionInfo);

            var actionRequested = {};
            actionRequested.name = 'ACTION';
            actionRequested.value = 'Update';
            formData.push(actionRequested);

            var targetTemplate = {};
            targetTemplate.name = 'TARGETTEMPLATENAME';
            targetTemplate.value = targetTemplateName;
            formData.push(targetTemplate);

            var targetFormId = {};
            targetFormId.name = 'TARGETFORMID';
            targetFormId.value = childFormRevisionId;
            formData.push(targetFormId);

            var updateFields = {};
            updateFields.name = 'UPDATEFIELDS';
            updateFields.value = {};
            updateFields.value['Name'] = ffCollection.getFormFieldByName('Name').value;
            updateFields.value['Date'] = ffCollection.getFormFieldByName('Date').value;
            formData.push(updateFields);

            return vvClient.scripts.runWebService('LibFormUpdateorPostandRelateForm', formData).then(function (postResp) {
                if (postResp.meta.status === 200) {
                    //check postResp.data for success here
                    if (postResp.data[0] == 'Success') {
                        returnObj[0] = 'Success';
                        //postResp.data[2] is an object that includes additional form information which can be used for other actions if needed.
                    }
                    else if (postResp.data[0] == 'Error') {
                        throw new Error(postResp.data[1]);
                    }
                    else {
                        throw new Error("Call to update the child form returned with a successful status, but invalid data.");
                    }
                }
                else {
                    throw new Error("Call to update the child form returned with an error. Status returned was: " + postResp.meta.status);
                }
            })

        })
        .then(function () {
            return response.json(returnObj);
        })
        .catch(function (err) {
            logger.info(JSON.stringify(err));

            returnObj[0] = 'Error';

            if (err && err.message) {
                returnObj[1] = err.message;
            } else {
                returnObj[1] = "An unhandled error has occurred. The message returned was: " + err;
            }

            return response.json(returnObj);
        })
};
