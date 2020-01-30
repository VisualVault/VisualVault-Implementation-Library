var logger = require('../log');
var Q = require('q');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "CUSTOMERALIAS";
    options.databaseAlias = "DATABASEALIAS";
    options.userId = "USERID";
    options.password = "PASSWORD";
    options.clientId = "DEVELOPERKEY";
    options.clientSecret = "DEVELPOERSECRET";
    return options;
};

module.exports.main = function (ffCollection, vvClient, response) {
    /*Script Name:   EmailNotifWebServiceExample
     Customer:      Implementation Library Code Example
     Purpose:       The purpose of this script is to provide a useful example for how to call LibEmailGenerateAndCreateCommunicationLog
     Parameters:    The following represent variables passed into the function:  
                    Standard form data with REVISIONID

     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                    Any item in the array at points 2 or above can be used to return multiple items of information.
                    0 - Status: Success, Error
		            1 - Message

     Pseudocode:   1. Collect data from form
                   2. Call LibEmailGenerateAndCreateCommunicationLog
                   3. Measure and return response

     Date of Dev:   01/29/2020
     Last Rev Date: 

     Revision Notes:
     01/29/2020 - Kendra Austin: Initial creation of the business process.

     */

    logger.info('Start of the process EmailNotifWebServiceExample at ' + Date());

    //Configuration Variables
    var tokenFirstName = '[First Name]';        //Tokens must have the brackets
    var tokenLastName = '[Last Name]';
    var tokenDate = '[Date]';
    var emailNotificationName = "Kendra's Test Email";

    //Script Variables
    var errors = [];                    //Used to hold errors as they are found, to return together.
    var revisionId = ffCollection.getFormFieldByName('REVISIONID');
    var formID = ffCollection.getFormFieldByName('Form ID').value;
    var firstName = ffCollection.getFormFieldByName('First Name').value;
    var lastName = ffCollection.getFormFieldByName('Last Name').value;
    var dateValue = ffCollection.getFormFieldByName('Date').value;
    var emailAddress = ffCollection.getFormFieldByName('Email Address').value;
    var emailCC = ffCollection.getFormFieldByName('Email AddressCC').value;

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
            var emailObject = [];

            var parameterItem = {};
            parameterItem.name = 'Email Name';      //Required. Can contain apostrophes
            parameterItem.value = emailNotificationName;
            emailObject.push(parameterItem);

            var tokens = [
                { name: tokenFirstName, value: firstName },
                { name: tokenLastName, value: lastName },
                { name: tokenDate, value: dateValue }
            ];

            parameterItem = {};
            parameterItem.name = 'Tokens';          //Required. Value should be an array of objects with name and value properties.
            parameterItem.value = tokens;
            emailObject.push(parameterItem);

            parameterItem = {};
            parameterItem.name = 'Email Address';   //Required unless the email notification template has a standard list of email addresses to send to. 
            parameterItem.value = emailAddress;
            emailObject.push(parameterItem);

            parameterItem = {};
            parameterItem.name = 'Email AddressCC';     //Not required
            parameterItem.value = emailCC;
            emailObject.push(parameterItem);

            var updateFields = {
                'Primary Record ID': formID,
            };

            parameterItem = {};
            parameterItem.name = 'OTHERFIELDSTOUPDATE'; //Not required if no read-only fields should be updated on the Communications Log
            parameterItem.value = updateFields;
            emailObject.push(parameterItem);

            parameterItem = {};
            parameterItem.name = 'RELATETORECORD';      //Not required if no other records should be related to the Communications Log
            parameterItem.value = [formID, 'NOTIF-000002'];
            emailObject.push(parameterItem);

            return vvClient.scripts.runWebService('LibEmailGenerateAndCreateCommunicationLog', emailObject).then(function (emailResp) {
                //Check for a successful result
                if (emailResp.meta.status === 200) {
                    //check userResp.data for success here
                    if (emailResp.data[0] == 'Success') {
                        logger.info('Email notification generated successfully.');
                        //Return response to client side. 
                        returnObj[0] = 'Success';
                        returnObj[1] = 'Email created';
                        return response.json(returnObj);
                    }
                    else if (emailResp.data[0] == 'Error') {
                        throw new Error('The call to generate an email notification returned with an error. ' + emailResp.data[1]);
                    }
                    else {
                        throw new Error("The call to generate an email notification returned with an unhandled error. Please try again or contact a system administrator.");
                    }
                }
                else {
                    throw new Error("The call to the email generation library returned with an error status. Status returned was: " + emailResp.meta.status);
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
