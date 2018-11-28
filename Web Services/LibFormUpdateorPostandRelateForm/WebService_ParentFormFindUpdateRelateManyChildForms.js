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

    /*Script Name:   ParentFormFindUpdateRelateManyChildForms
      Customer:      Kendra Austin Demo
      Purpose:       The purpose of this script is to find one or more Child Forms with the same name as the Parent Form, update the date on those forms, and relate each one to the current parent form. 
      Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.  Any item in the array at points 2 or above can be used to return multiple items of information.
                     0 - Status: Success or Error
                     1 - Message
      Date of Dev:   11/23/2018
      Last Rev Date:
 
      Revision Notes:
      11/23/2018: Kendra Austin - Initial creation of the business process. 
        
      */

    logger.info('Start of the process ParentFormFindUpdateRelateManyChildForms at ' + Date());

    var Q = require('q');

    //Initialization of the return object
    var returnObj = [];    //Variable used to return information back to the client.

    //Initialization of script variables
    var revisionId = '';                        //Used to store the revision ID of the current form
    var parentNameField = '';                   //Used to store the name from the parent form. 
    var targetTemplateName = 'Child Form';      //Used to store the template name of the target form. 

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {
        //Extract the values of the passed in fields
        revisionId = ffCollection.getFormFieldByName('REVISIONID').value;
        parentNameField = ffCollection.getFormFieldByName('Name').value;

        //Validate passed in fields
        if (!revisionId || revisionId == '') {
            throw new Error("The REVISIONID parameter was not supplied.");
        }
        else if (!parentNameField || parentNameField == '') {
            throw new Error("The NAME parameter was not supplied.");
        }
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

            var targetFormQuery = {};
            targetFormQuery.name = 'QUERY';
            targetFormQuery.value = {};
            targetFormQuery.value.q = "[Name] eq '" + parentNameField + "'";
            targetFormQuery.value.fields = 'name,date,id';
            formData.push(targetFormQuery);

            var updateFields = {};
            updateFields.name = 'UPDATEFIELDS';
            updateFields.value = {};
            updateFields.value['Name'] = ffCollection.getFormFieldByName('Name').value;
            updateFields.value['Date'] = ffCollection.getFormFieldByName('Date').value;
            formData.push(updateFields);

            return vvClient.scripts.runWebService('LibFormUpdateorPostandRelateForm', formData).then(function (postResp) {
                //Check for a successful result
                if (postResp.meta.status === 200) {
                    //check postResp.data for success here
                    if (postResp.data[0] == 'Success') {
                        returnObj[0] = 'Success';
                        returnObj[1] = 'The number of forms handled was ' + postResp.data[2].length + '.';
                        //postResp.data[2] is an array of objects that include additional form information which can be used for other actions if needed.
                    }
                    else if (postResp.data[0] == 'Error') {
                        throw new Error(postResp.data[1]);
                    }
                    else {
                        throw new Error("The call to the global update-and-relate function returned with an unhandled status of " + postResp.data[0]);
                    }
                }
                else {
                    throw new Error("Call to update the child forms returned with an error. Status returned was: " + postResp.meta.status);
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
