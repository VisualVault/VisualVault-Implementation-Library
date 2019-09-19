var logger = require('../log');
var Q = require('q');
var momentTz = require('moment-timezone');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "";
    options.databaseAlias = "";
    options.userId = "";
    options.password = "";
    options.clientId = "";
    options.clientSecret = "";
    return options;
};

module.exports.main = function (vvClient, response, token) {
    /*Script Name:   CommunicationLogSendImmediate
     Customer:      VisualVault
     Purpose:       Purpose of this script is acquire list of communication logs that need to be sent immediately as an email and send them to the recipients.
     Parameters:    The following represent variables passed into the function: None
     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.  Any item in the array at points 2 or above can be used to return multiple items of information.
                    - Message will be sent back to VV as part of the ending of this scheduled process.
    Process Pseudocode:   The following documents the pseudo code for this process.
                    Step1:  Run a query to acquire list of communications logs that are marked to be sent.
                    Step2:  Load into an array.
                    Step3:  Send an email and update the form with sending information if the send was successful.
                    Step4:  Measure results and communicate completion.
           
     Date of Dev:   05/14/2019
     Last Rev Date: 08/03/2019

     Revision Notes:
     05/14/2019 - Jason Hatch:  Initial creation of the business process. 
     05/15/2019 - Jason Hatch:  Update as per code review feedback.
     05/18/2019 - Kendra Austin: Bug fix to prevent error being thrown when query was successful.
     08/02/2019 - Jason Hatch:  Updating to have a mechanism to throttle the emails frequency that they are sent to avoid disconnecting connections.
     08/03/2019 - Jason Hatch:  Added timezone mechanisms to set communication time in Eastern time.
     08/06/2019: Rufus Peoples - For use in Lincoln Comm Log
     08/19/2019 - Kendra Austin: updated time zone to Central for Lincoln. 
     */


    logger.info('Start of the process CommunicationLogSendImmediate at ' + Date());

    response.json('200', 'Process started, please check back in this log for more information as the process completes.');

    //CONFIGURABLE VALUES IN THE FOLLOWING AREA.
    var commLogTemplateID = 'Communications Log';
    var commLogQuery = 'Communication Send Immediately';
    var timeZone = 'America/Chicago';
    var frequencyEmailSendinms = 5000;   //This is the number of milleseconds delay between sending each email.

    //END OF CONFIGURABLE VALUES

    //Other globally used variables.
    var errorLog = [];   //Array for capturing error messages that may occur.

    //Parameter for the query.  Does not need a filter at this time.  
    var queryparams = {};
    queryparams = { filter: "" };

    const getDocuments = (logID) => {
        var getRelatedDocsParams = {};
        return vvClient.forms.getFormRelatedDocs(logID, getRelatedDocsParams);
    }
    const getCommLog = (ComLogID) => {
        //Query communication log
        let formClientInfoData = {};
        formClientInfoData.q = "[Comm Log ID] eq '" + ComLogID + "'";

        return vvClient.forms.getForms(formClientInfoData, commLogTemplateID)
    }
    let cntr = 0;
    const sendEmail = (dataRow, documents) => {
        //Load the email object.
        var emailObj = {};
        emailObj.recipients = dataRow['email Recipients'];
        emailObj.ccrecipients = dataRow['cc'];
        emailObj.subject = dataRow['subject'];
        emailObj.body = dataRow['email Body'];
        emailObj.hasAttachments = (documents.data.length > 0);
        emailObj.documents = documents.data.map(o => o.id);

        //Send email 
        return vvClient.email.postEmails(null, emailObj)
    }
    const updateRecod = (recID) => {
        //Setup time in Eastern time.
        var sendDate = momentTz().tz(timeZone).format('L');
        var sendTime = momentTz().tz(timeZone).format('LT');
        var localScheduledTime = sendDate + " " + sendTime;

        var updateObj = {};
        updateObj['Communication Date'] = localScheduledTime;
        updateObj['Communication Sent'] = 'Yes'

        return vvClient.forms.postFormRevision(null, updateObj, commLogTemplateID, recID);
    }
    //Run query to get the communication log items.
    vvClient.customQuery.getCustomQueryResultsByName(commLogQuery, queryparams)
        .then(
        function (promise) {
            var responseItem = JSON.parse(promise);
            if (responseItem.meta.status == 200 && responseItem.data.length > 0) {
                var processCommLog = Q.resolve();

                //Load the items into the commarray for processing.
                responseItem.data.forEach(
                    function (item) {
                        processCommLog = processCommLog.then(
                            async function () {
                                const locItem = item;
                                try {
                                    const log = JSON.parse(await getCommLog(locItem['comm Log ID']));
                                    const docs = JSON.parse(await getDocuments(log.data[0].revisionId));
                                    const emailResp = await sendEmail(locItem, docs)
                                    if (emailResp.meta['status'] === 201) {
                                        const updateResp = await updateRecod(locItem.dhid);
                                        if (updateResp.meta.status !== 201) {
                                            throw new Error('Error updating record ' + locItem['comm Log ID'] + ' after email was sent.');
                                        }
                                        else {
                                            //This is a throttle to slow down the sending mechanism.  Previously server keeps disconnecting.
                                            setTimeout(() => { }, frequencyEmailSendinms);
                                        }
                                    }
                                    else
                                        throw new Error('Error Sending Emails for ' + locItem['comm Log ID'] + '.');
                                }
                                catch (err) {
                                    errorLog.push(err);
                                }
                            }
                        );
                    }
                )
                return processCommLog;
            }
            else if (responseItem.meta.status != 200) {
                throw new Error('Error encountered when running the query.');
            }
            else {
                throw new Error('No communication log records found.');
            }
        }
        )
        .then(
        function () {
            if (errorLog.length > 0) {
                //Errors captured
                logger.info(JSON.stringify(errorLog));
                throw new Error('Error encountered during processing.  Please contact support to troubleshoot the errors that are occurring.');
            }
            else {
                // response.json('200', 'Emails processed successfully');
                return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Emails processed successfully');
            }
            //Communication Log updated successfully
        }
        )
        .catch(
        function (err) {
            // response.json('200', 'Error encountered during processing.  Error was ' + err );
            return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Error encountered during processing.  Error was ' + err);
        }
        );
}
