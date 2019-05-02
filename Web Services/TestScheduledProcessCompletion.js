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


module.exports.main = function (vvClient, response, token) {
    /*Script Name:   NodeJSTestCommunicationScheduledProcess
     Customer:      Auersoft
     Purpose:       Test to make sure communications between VV and NodeJS are working for new installations.    Need to replace the credentials aboe with valid information.  Setup as outside process, then as scheduled process.  Run as scheduled process.
     Date of Dev:   12/24/2014
     Last Rev Date: 

     Revision Notes:
     12/24/2014 - Jason:  First Setup of the script
     */

    var scheduledProcessGUID = token;

    response.json(200, 'COMMUNICATION ARRIVED SUCCESSFULLY.  THIS IS A CUSTOM MESSAGE COMING BACK FROM THE NODEJS SERVER.');

    logger.info('COMMUNICATION ARRIVED SUCCESSFULLY TO THE NODEJS SERVER.');

    vvClient.scheduledProcess.postCompletion(scheduledProcessGUID, 'complete', true, "Scheduled Process End has completed.");


}
