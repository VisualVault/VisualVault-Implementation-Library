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
    /*Script Name:   
     Customer:      
     Purpose:       The purpose of this script is to
     Parameters:    The following represent variables passed into the function:  
                    LIST PARAMETERS

     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                    Any item in the array at points 2 or above can be used to return multiple items of information.
                    0 - Status: Success, Error
		            1 - Message

     Pseudocode:   1. FIRST DO THIS
                   2. THEN DO THIS

     Date of Dev:   DATE
     Last Rev Date: 

     Revision Notes:
     DATE - NAME: Initial creation of the business process. 

     */

    logger.info('Start of the process NAME at ' + Date());

    //Configuration Variables

    //Script Variables
    var errors = [];                    //Used to hold errors as they are found, to return together.
    var revisionId = ffCollection.getFormFieldByName('REVISIONID');

    //Initialization of the return object
    var returnObj = [];

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {

        //Validate passed in fields
        if (!revisionId || !revisionId.value) {
            errors.push("The REVISIONID parameter was not supplied.")
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
            //Do a thing. return vvClient.forms.getForms, etc. 
            //Add more links in the chain as needed. 
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
