var logger = require('../log');
var Q = require('q');

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
    /*Script Name:  UserMgmtSave
     Customer:      VV Implementation Library - Code Example
     Purpose:       The purpose of this script is to save the User Management form record. Update the user account if needed.
     Parameters:    The following represent variables passed into the function:
                    - Standard form data with REVISIONID
                    - Template fields expected are: Email, Record ID

     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                    Any item in the array at points 2 or above can be used to return multiple items of information.
                    0 - Status: Success, Minor Error, Error
		            1 - Message
                    2 - User GUID

     Pseudocode:   1. Make sure no other User Management forms exist with this email address.
                    - If they do, return an error. No duplicates allowed.
                    2. Call LibUserUpdate to update the user.

     Date of Dev:   01/08/2020
     Last Rev Date:

     Revision Notes:
     01/08/2020 - Kendra Austin: Initial creation of the business process.

     */

    logger.info('Start of the process UserMgmtSave at ' + Date());

    //Configuration Variables
    var userManagementTemplateID = 'User Management';

    //Script Variables
    var errors = [];                    //Used to hold errors as they are found, to return together.
    var revisionId = ffCollection.getFormFieldByName('REVISIONID');
    var emailAddress = ffCollection.getFormFieldByName('Email').value;
    var recordID = ffCollection.getFormFieldByName('Record ID').value;
    var userID = ffCollection.getFormFieldByName('Email').value;
    var firstName = ffCollection.getFormFieldByName('First Name').value;
    var middleInitial = ffCollection.getFormFieldByName('MI').value;
    var lastName = ffCollection.getFormFieldByName('Last Name').value;
    var groupAddList = 'Group One, Group Two';      //This may be calculated from form fields or be passed in another way. 
    var groupRemoveList = 'Test Group, Group Three';   //This may be calculated from form fields or be passed in another way.

    //Initialization of the return object
    var returnObj = [];

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {

        //Validate passed in fields
        if (!revisionId || !revisionId.value) {
            errors.push("The REVISIONID parameter was not supplied.");
        }
        else {
            revisionId = revisionId.value;
        }

        //Validate other passed in fields

        //Return all validation errors at once.
        if (errors.length > 0) {
            throw new Error(errors);
        }
    })
        .then(function () {
            //Make sure no other User Management forms exist with this email address.
            var formQueryObj = {};
            formQueryObj.q = "[Email] eq '" + emailAddress + "'";
            formQueryObj.fields = 'revisionId, instanceName, Email';

            return vvClient.forms.getForms(formQueryObj, userManagementTemplateID).then(function (queryResp) {
                var queryData = JSON.parse(queryResp);
                if (queryData.meta.status === 200) {
                    if (queryData.hasOwnProperty('data')) {
                        if (queryData.data.length > 0) {
                            //If exactly one form was found and it is the current form, then continue the process.
                            if (queryData.data.length == 1 && queryData.data[0].instanceName == recordID) {
                                logger.info('No duplicate record found. Found the current record. Calling LibUserUpdate.');
                            }
                            else {
                                throw new Error('A User Management record already exists for a user with this email address.');
                            }
                        }
                        else {
                            //Zero forms found, so no duplicates exist. 
                            logger.info('No duplicate user management record found. Moving on to call LibUserCreate.');
                        }
                    }
                    else {
                        throw new Error('The call to get forms returned successfully, but the data could not be accessed.');
                    }
                }
                else {
                    throw new Error('The call to get forms returned with an error. Please try again or contact a system administrator.');
                }
            });
        })
        .then(function () {
            var updateUserObject = [];

            var userInfo = {};
            userInfo.name = 'Action';
            userInfo.value = 'Update';
            updateUserObject.push(userInfo);

            userInfo = {};
            userInfo.name = 'User ID';
            userInfo.value = userID;
            updateUserObject.push(userInfo);

            userInfo = {};
            userInfo.name = 'First Name';
            userInfo.value = firstName;
            updateUserObject.push(userInfo);

            userInfo = {};
            userInfo.name = 'Middle Initial';
            userInfo.value = middleInitial;
            updateUserObject.push(userInfo);

            userInfo = {};
            userInfo.name = 'Last Name';
            userInfo.value = lastName;
            updateUserObject.push(userInfo);

            userInfo = {};
            userInfo.name = 'Email Address';
            userInfo.value = emailAddress;
            updateUserObject.push(userInfo);

            userInfo = {};
            userInfo.name = 'Group List';
            userInfo.value = groupAddList;
            updateUserObject.push(userInfo);

            userInfo = {};
            userInfo.name = 'Remove Group List';
            userInfo.value = groupRemoveList;
            updateUserObject.push(userInfo);

            return vvClient.scripts.runWebService('LibUserUpdate', updateUserObject).then(function (userResp) {
                //Check for a successful result
                if (userResp.meta.status === 200) {
                    //check userResp.data for success here
                    if (userResp.data[0] == 'Success') {
                        logger.info('User updated successfully.');
                        //LibUserUpdate returns the user GUID. If received successfully, pass back client side
                        if (userResp.data[2]) {
                            returnObj[2] = userResp.data[2];
                        }
                        returnObj[0] = 'Success';
                        returnObj[1] = 'User Updated.';
                        return response.json(returnObj);
                    }
                    else if (userResp.data[0] == 'Error') {
                        throw new Error('The call to update the user returned with an error. ' + userResp.data[1]);
                    }
                    else {
                        throw new Error("The call to update the user returned with an unhandled error. Please try again or contact a system administrator.");
                    }
                }
                else {
                    throw new Error("The call to the UserUpdate library returned with an error status. Status returned was: " + userResp.meta.status);
                }
            });
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
