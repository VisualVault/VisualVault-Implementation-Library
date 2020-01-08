var logger = require('../log');
var Q = require('q');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "CUSTOMERALIAS";
    options.databaseAlias = "DATABASEALIAS";
    options.userId = "USERID";
    options.password = "PASSWORD";
    options.clientId = 'DEVELOPERKEY';
    options.clientSecret = 'DEVELOPERSECRET';
    return options;
};

module.exports.main = function (ffCollection, vvClient, response) {
    /*Script Name:  UserMgmtCreateSimple
     Customer:      VV Code Example
     Purpose:       The purpose of this script is to create a user account for for the User Management form record. 
     Parameters:    The following represent variables passed into the function:
                    - Standard form data with REVISIONID
                    - Template fields expected are: Email, Record ID

     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                    Any item in the array at points 2 or above can be used to return multiple items of information.
                    0 - Status: Success, Minor Error, Error
		            1 - Message
                    2 - User GUID
                    3 - Site GUID

     Pseudocode:   1. Make sure no other User Management forms exist with this email address.
                    - If they do, return an error. No duplicates allowed.
                    2. Call LibUserCreate to create the user.
                    - Pass in minimal info, VV should send its standard email

     Date of Dev:   01/07/2020
     Last Rev Date:

     Revision Notes:
     01/07/2020 - Kendra Austin: Initial creation of the business process.

     */

    logger.info('Start of the process UserMgmtCreateSimple at ' + Date());

    //Configuration Variables
    var userManagementTemplateID = 'User Management';

    //Script Variables
    var errors = [];                    //Used to hold errors as they are found, to return together.
    var revisionId = ffCollection.getFormFieldByName('REVISIONID');
    var emailAddress = ffCollection.getFormFieldByName('Email').value;
    var recordID = ffCollection.getFormFieldByName('Record ID').value;

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
                                logger.info('No duplicate record found. Found the current record. Calling LibUserCreate.');
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
            //Call LibUserCreate to create the user.
            var createUserArr = [];

            var userInfoObj = {};
            userInfoObj.name = 'User Id';
            userInfoObj.value = emailAddress;
            createUserArr.push(userInfoObj);

            userInfoObj = {};
            userInfoObj.name = 'Email Address';
            userInfoObj.value = emailAddress;
            createUserArr.push(userInfoObj);

            userInfoObj = {};
            userInfoObj.name = 'Site Name';
            userInfoObj.value = 'Home';
            createUserArr.push(userInfoObj);

            userInfoObj = {};
            userInfoObj.name = 'Group List';
            userInfoObj.value = '';
            createUserArr.push(userInfoObj);

            userInfoObj = {};
            userInfoObj.name = 'Send Email';
            userInfoObj.value = 'Standard';
            createUserArr.push(userInfoObj);

            return vvClient.scripts.runWebService('LibUserCreate', createUserArr).then(function (createUserResp) {
                //Measure that the API call completed successfully
                if (createUserResp.meta.status == 200) {
                    //Measure that we received something in the return array
                    if (createUserResp.data.length > 0) {
                        //Measure what was received in the return array
                        if (createUserResp.data[0] == 'Success' || createUserResp.data[0] == 'Minor Error' || createUserResp.data[1] == 'User Exists' || createUserResp.data[1] == 'User Disabled') {
                            //Build returnObj from createUserResp.data. Send back all info.
                            createUserResp.data.forEach(function (arrayIndex) {
                                returnObj.push(arrayIndex);
                            });

                            //Return the successful or mostly successful response
                            return response.json(returnObj);
                        }
                        else if (createUserResp.data[0] == 'Error') {
                            throw new Error('The call to create the user returned with an error. ' + createUserResp.data[1]);
                        }
                        else {
                            throw new Error('The call to create the user returned with an unhandled error.');
                        }
                    }
                    else {
                        throw new Error('The call to create the user returned without data. Please try again or contact a system administrator.');
                    }
                }
                else {
                    throw new Error('The call to the create user library returned with an unsuccessful result.');
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
