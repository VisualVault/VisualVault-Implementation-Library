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

module.exports.main = function (vvClient, response, token) {
   /*Script Name:   NAME
     Customer:      
     Purpose:       Scheduled process to  

     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                    - Message will be sent back to VV as part of the ending of this scheduled process.
           
     Pseudocode:   1. FIRST DO THIS
                   2. THEN DO THIS

     Date of Dev:   DATE
     Last Rev Date:

     Revision Notes:
     DATE - NAME: Initial creation of the business process.

     */


    logger.info('Start of the process NAME at ' + Date());

    response.json('200', 'Process started, please check back in this log for more information as the process completes.');

    //CONFIGURABLE VARIABLES


    //END OF CONFIGURABLE VALUES

    //Other globally used variables.
    var errorLog = [];   //Array for capturing error messages that may occur.

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {
        //Do something
    }).then(function () {
        //Do something
    }).then(function () {
        if (errorLog.length > 0) {
            //Errors captured
            // response.json('200', 'Error encountered during processing.  Please contact support to troubleshoot the errors that are occurring.' );
            return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Error encountered during processing.  Please contact support to troubleshoot the errors that are occurring.');
        }
        else {
            // response.json('200', 'Emails processed successfully');
            return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Process completed successfully');
        }

    }).catch(function (err) {
        // response.json('200', 'Error encountered during processing.  Error was ' + err );
        return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Error encountered during processing.  Error was ' + err);
    });

}
