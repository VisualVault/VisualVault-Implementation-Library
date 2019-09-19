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
    /*Script Name:   CommunicationLogSendDigest
     Customer:      VisualVault
     Purpose:       Purpose of this script is acquire list of communication logs that need to be sent as a digest and send them to recipients together.
     Parameters:    The following represent variables passed into the function: None.
     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.  Any item in the array at points 2 or above can be used to return multiple items of information.
                    - Message will be sent back to VV as part of the ending of this scheduled process.
    Process Pseudocode:   The following documents the pseudo code for this process.
                    Step1:  Run a query to acquire list of communications logs that are marked to be sent.
                    Step2:  Create an array of recipients.  Load into an array.
                    Step3:  Send an email and update the form with sending information if the send was successful.
                    Step4:  Measure results and communicate completion.
           
     Date of Dev:   05/20/2019
     Last Rev Date: 09/08/2019

     Revision Notes:
     05/20/2019 - Jason Hatch:  Initial creation of the business process. 
     08/02/2019 - Jason Hatch:  Added throttling mechanisms to slow down the emails.
     08/03/2019 - Jason Hatch:  Added timezone mechanisms to set communication time in Eastern time.
     08/06/2019 - Rufus Peoples: For use in Lincoln Comm Log
     09/06/2019 - Jonathan Mitchell: Update error email list to be a configurable group of users rather than hard-coded email addresses.
     09/08/2019 - Kendra Austin: QA of 9/6 work and troubleshooting bugs. Resolved issue with duplicate emails to same email address, 
                                 blank emails, and posting too many form revisions of the comm logs.
     */


    logger.info('Start of the process CommunicationLogSendDigest at ' + Date());

    response.json('200', 'Process started, please check back in this log for more information as the process completes.');

    //CONFIGURABLE VALUES IN THE FOLLOWING AREA.
    var commLogTemplateID = 'Communications Log';               //This is the communication log form template name.
    var commLogQuery = 'Communication Send Digest';             //This is the name of the query that will be used to get digest emails.
    var subjectForDigest = 'Daily Digest Email';                //This is the subject of the digest email.
    var groupsToNotifyOfError = ['VaultAccess'];                //These are the groups to notify if an error occurs during this process.
    
    var frequencyEmailSendinms = 5000;                          //This is the number of milleseconds delay between sending each email.
    var timeZone = 'America/Chicago';                           //This is the timezone of the customer. 
    //END OF CONFIGURABLE VALUES

    //Other globally used variables.
    var errorLog = [];   //Array for capturing error messages that may occur.
    var commArray = [];  //Array of communication items.
    var recipientArray = [];   //Array of objects for all the recipients.
    var guidArray = [];  //Variable for list of GUIDS associated with the communication logs so they can be marked as sent.

    //Only a holder function for the delay.
    var delayFunction = function() {
        var a = '';
    }

    //Function to load the recipientArray
    var LoadRecipientArray = function (communicationArray) {
        //Create the recipient array.
        communicationArray.forEach(function (item) {
            //We will load an object into an array for each recipient.  The object will identify the recipient.
            //It will also have an array of messages.  Each array will have an object of Subject and Body.

            //Take the item being passed in and extract it into an array of recipients.
            var recipientList = item['email Recipients'].split(",");
            if (recipientArray.length == 0) {
                //Load for the first time.  Go throug complete list of recipients.
                recipientList.forEach(function (recipItem) {
                    var recipObj = {};
                    recipObj.recipient = recipItem.toLowerCase().trim();
                    recipObj.messageArrays = [];
                    recipientArray.push(recipObj);
                });
            }
            else {
                //Go through each recipient to see if they are in the recipientArray already.  If not, add to the array.
                recipientList.forEach(function (recipItem) {
                    var foundRecip = 'No';
                    recipientArray.forEach(function (recipArrayItem) {
                        if (recipItem.toLowerCase().trim() == recipArrayItem.recipient.toLowerCase().trim()) {
                            foundRecip = 'Yes';
                        }
                    });

                    if (foundRecip == 'No') {
                        var recipObj = {};
                        recipObj.recipient = recipItem.toLowerCase().trim();
                        recipObj.messageArrays = [];
                        recipientArray.push(recipObj);
                    }
                });
            }
        });
        return true;
    }

    //The following function will be used to load the digest message information into the RecipientArray
    var LoadMessageData = function (communicationArray) {
        communicationArray.forEach(function (commItem) {
            //We will load an object into an array for each recipient.  The object will identify the recipient.
            //It will also have an array of messages.  Each array will have an object of Subject and Body.

            //Take the item being passed in and extract it into an array of recipients.
            var recipientList = commItem['email Recipients'].split(",");

            //Go through each recipient to see if they are in the recipientArray already.  If not, add to the array.
            recipientList.forEach(function (recipItem) {
                //Go through the array of recipients and their messages to add to the messageArray.
                recipientArray.forEach(function (recipArrayItem) {
                    //locate recipient.
                    if (recipItem.toLowerCase().trim() == recipArrayItem.recipient.toLowerCase().trim()) {
                        //recipient is found.  Look for the message and load it.
                        if (recipArrayItem.messageArrays.length == 0) {
                            var messageObj = {};
                            messageObj.subject = commItem['subject'];
                            messageObj.body = commItem['email Body'];
                            messageObj.messageGUIDS = commItem['dhid'];
                            recipArrayItem.messageArrays.push(messageObj);
                        }
                        else {
                            //Go through each recipient to see if the message exits or not.  If not, add to the array.
                            var messageFound = 'No';
                            recipArrayItem.messageArrays.forEach(function (messageItem) {
                                if (messageItem.subject.toLowerCase().trim() == commItem.subject.toLowerCase().trim()) {
                                    messageFound = 'Yes';
                                    //Message is found so add to the body and messageGUIDS of the message
                                    messageItem.body = messageItem.body + "<br>" + commItem['email Body'];
                                    messageItem.messageGUIDS = messageItem.messageGUIDS + ', ' + commItem['dhid'];
                                }
                            });

                            //Not found so push the information to the recipArrayItem
                            if (messageFound == 'No') {
                                var messageObj = {};
                                messageObj.subject = commItem['subject'];
                                messageObj.body = commItem['email Body'];
                                messageObj.messageGUIDS = commItem['dhid'];
                                recipArrayItem.messageArrays.push(messageObj);
                            }
                        }
                    }
                });


            });
        });
        return true;
    }

    //The following function will get user email addresses from the groups identified to send any errors to. 
    const getUserEmailsByGroups = (vvClient, groupArray) => {
        return vvClient.scripts.runWebService('LibGroupGetGroupUserEmails', 
            [
                {
                    name: 'groups',
                    value: groupArray
                }
            ]
        )
        .then(function (userInfoResponse) {
            if (userInfoResponse.meta.status === 200) {
                if (userInfoResponse.data[0] == 'Success') 
                {
                    return userInfoResponse.data[2].map(entry => entry['emailAddress']).join();
                }
                else {
                    //Log errors so they aren't lost
                    errorLog.forEach(function (log) {
                        logger.info(log);
                    });
    
                    //Then throw error
                    throw new Error('The call to get notification emails returned with an error.');
                }
            }
            else {
                //Log errors so they aren't lost
                errorLog.forEach(function (log) {
                    logger.info(log);
                });
    
                //Then throw error
                throw new Error(userInfoResponse.meta.statusMsg);
            }
        });
    }

    //Parameter for the query.  Does not need a filter at this time.    Query looks like the following:
    // SELECT * 
    // FROM [Communications Log]
    // WHERE [Communication Type] = 'Email' AND 
    //             [Email Type] = 'Digest' AND 
    //             [Communication Sent] <> 'Yes' AND
    //             [Scheduled Date] < GetDate() AND
    //             [Approved] = 'Yes'
    // ORDER BY [Email Recipients], [Subject]

    var queryparams = {};
    queryparams = { filter: "" };

    //Run query to get the communication log items.
    vvClient.customQuery.getCustomQueryResultsByName(commLogQuery, queryparams).then(function (promise) {
        var responseItem = JSON.parse(promise);
        if (responseItem.data.length > 0) {
            //Load the items into the commarray for processing.
            responseItem.data.forEach(function (item) {
                commArray.push(item);
            });

            return LoadRecipientArray(commArray);
        }
        else {
            throw new Error('No communication log records found.');
        }
    })
    .then(function (loadRecipResp) {
        //Calling LoadMessageData to load the messages for each recipient.
        if (loadRecipResp == true) {
            return LoadMessageData(commArray);
        }
        else {
            throw new Error('Loading recipients returned a false.');
        }
    })
    .then(function (loadMessageResp) {
        if (loadMessageResp == true) {
            //Returned successful, continue.
        }
        else {
            throw new Error('Issue occurred while loading the message bodies.')
        }
    })
    .then(function () {
        var processCommLog = Q.resolve();
        //Send each item
        recipientArray.forEach(function (item) {
            processCommLog = processCommLog.then(function () {

                //Load the email object.
                var emailObj = {};
                emailObj.recipients = item['recipient'];
                //emailObj.ccrecipients = item['cc'];
                emailObj.subject = subjectForDigest;
                emailObj.body = '';

                //Load each fo the messages into the body.  Subject is used as section header.
                item.messageArrays.forEach(function (messageItem) {
                    emailObj.body += "<b>SUBJECT SECTION: " + messageItem.subject + '</b><br><br>';
                    emailObj.body += messageItem.body + '<br><br><br>'

                    //Load the GUIDS into an array so each form can be updated that it has been sent to the recipient.
                    var splitGUID = messageItem.messageGUIDS.split(', ');
                    splitGUID.forEach(function (guidItem) {
                        //Assume not going to find this guid in the array
                        var guidFound = false;

                        //Go through the existing list of GUIDs handled to see if it's there already
                        guidArray.forEach(function(existingGuid) {
                            if (guidItem == existingGuid) {
                                guidFound = true;
                            }
                        });

                        //If it wasn't there already, add it. 
                        if (!guidFound) {
                            guidArray.push(guidItem);
                        }
                    });

                })

                //Send email 
                return vvClient.email.postEmails(null, emailObj)
                .then(function (resp) {
                    if (resp.meta['status'] === 201) {
                        //Success, 
                        //This is a throttle to slow down the sending mechanism.  Previously server keeps disconnecting.
                        setTimeout(function () {delayFunction();}, frequencyEmailSendinms);
                    }
                    else {
                        errorLog.push("Email could not be sent to " + emailObj.recipients + " with subject of " + emailObj.subject);
                    }
                });
            });
        });
        return processCommLog;
    })
    .then(function() {
        //nNow update the form that it was sent. Need to process each form/guid that is present. 
        var processCommUpdate = Q.resolve();

        guidArray.forEach(function (guidItem) {
            processCommUpdate = processCommUpdate.then(function () {
                //Setup time in Eastern time.
                var sendDate = momentTz().tz(timeZone).format('L');
                var sendTime = momentTz().tz(timeZone).format('LT');
                var localScheduledTime = sendDate + " " + sendTime;

                var updateObj = {};
                updateObj['Communication Date'] = localScheduledTime;   //Set time to right now, in the customer's time zone.
                updateObj['Communication Sent'] = 'Yes'

                return vvClient.forms.postFormRevision(null, updateObj, commLogTemplateID, guidItem).then(function (updateResp) {
                    if (updateResp.meta.status === 201) {
                        //Update successful
                        logger.info('Communication Log ' + guidItem + ' updated successfully; marked as sent.');
                    }
                    else {
                        errorLog.push('Error encountered when updating Comm Log form id ' + guidItem);
                    }
                })
            });
        });
        return processCommUpdate;
    })
    .then(async function () {
        // For testing, force an error into array to trigger getUsersToNotifyOnError lookup
        //errorLog.push('Example error for testing');

        if (errorLog.length > 0) {
            var emailObj = {};
            emailObj.recipients = await getUserEmailsByGroups(vvClient, groupsToNotifyOfError);
            emailObj.subject = 'Error Occurred with Digest Email';
            emailObj.body = 'An error occurred when when attempting to send digest emails.  Errors were as follows: <br><br>';
            errorLog.forEach(function(error) {
                emailObj.body += error + '<br>';
            });
            return vvClient.email.postEmails(null, emailObj).then(function (resp) {
                if (resp.meta['status'] === 201) {
                    //Email sent
                }
                else {
                    logger.info('The error email for CommunicationLogSendDigest was not sent on ' + new Date());
                }
            });
        }
    })
    .then(function () {
        if (errorLog.length > 0) {
            //Errors captured
            // response.json('200', 'Error encountered during processing.  Please contact support to troubleshoot the errors that are occurring.' );
            return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Error encountered during processing.  Please contact support to troubleshoot the errors that are occurring.');
        }
        else {
            // response.json('200', 'Emails processed successfully');
            return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Emails processed successfully');
        }

    }).catch(function (err) {
        // response.json('200', 'Error encountered during processing.  Error was ' + err );
        return vvClient.scheduledProcess.postCompletion(token, 'complete', true, 'Error encountered during processing.  Error was ' + err);
    });
}
