let logger = require('../log');
let moment = require('moment')

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
    /**
     * Script Name:     RegAppCompleteRefund
     * Customer:        City Of Lincoln
     * Purpose:         The purpose of this script is to allow for refund request to be completed
     * Parameters:
     *                  None
     * Pseudo Code:    
     *                  1. Call the LibFormCreateCommunicationLogs() function
     *                  2. Measure response
     *                  3. Return the JSON response
     * Return Array:
     *                  1. Status - 'Error', 'Success'
     *                  2. Message about error/process
     * Date of Dev:     8/2/2019
     * Last Dev Date:   8/2/2019
     * Dev Notes:
     * 8/2/2019 - Miroslav Sanader: Script created
     */

    logger.info('Start of script RegAppRequestRefund on: ' + Date());
    let outputCollection = [];
    let formId = ffCollection.getFormFieldByName('Reg App ID').value;
    let indivId = ffCollection.getFormFieldByName('Individual ID').value;
    let fullName = ffCollection.getFormFieldByName('First Name').value + " " + (ffCollection.getFormFieldByName('Middle Initial').value == "" ? "" : ffCollection.getFormFieldByName('Middle Initial').value + " ")
        + ffCollection.getFormFieldByName('Last Name').value + (ffCollection.getFormFieldByName('Suffix').value == 'Select Item' ? "" : " " + ffCollection.getFormFieldByName('Suffix').value);
    let sub = "Your refund request for registration application " + formId + " has been processed.";
    let body = "Hello " + fullName + ",<br><br>Your refund request has been successfully processed.<br>Please sign into the system to view your application or any notes.";
    let email = ffCollection.getFormFieldByName('Applicant Email').value;
    let time = moment().toISOString();

    // Communication log params
    let communicationLogObj = [
        { name: 'COMMUNICATIONTYPE', value: 'Email' },
        { name: 'EMAILTYPE', value: 'Immediate Send' },
        { name: 'RECIPIENTS', value: email },
        { name: 'RECIPIENTSCC', value: '' },
        { name: 'SUBJECT', value: sub },
        { name: 'BODY', value: body },
        { name: 'RELATETORECORD', value: [formId, indivId, ffCollection.getFormFieldByName('REVISIONID').value] },
        { name: 'APPROVEDTOSEND', value: 'Yes' },
        { name: 'SCHEDULEDSENDDATETIME', value: new Date().toISOString() },
        {
            name: 'OTHERFIELDSTOUPDATE', value: {
                "Individual ID": indivId,
                "Record ID": formId
            }
        }
    ];

    return vvClient.scripts.runWebService('LibFormCreateCommunicationLog', communicationLogObj).then(function (resp) {
        if (resp.meta.status == 200) {
            if (resp.data[0] == 'Success') {
                logger.info('Succesfully submitted the email to: ' + email);
                outputCollection[0] = 'Success';
                outputCollection[1] = 'Refund has been successfully processed and the user has been notified.'
            }
            else if (resp.data[0] == 'Error') {
                outputCollection[0] = 'Error';
                outputCollection[1] = resp.data[1];
            }
            else
                throw Error('The communication log script ran, but there was an error.');

            return response.json(200, outputCollection);
        }
        else
            throw Error('The call to post a communication log for ' + email + ' returned with an error.');
    }).catch(function (exception) {
        logger.info(exception);
        outputCollection[0] = 'Error';
        outputCollection[1] = exception.message;
        response.json(200, outputCollection);
    });
}
