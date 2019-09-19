// JavaScript source code

var logger = require('../log');
var Q = require('q');

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

module.exports.main = function (ffCollection, vvClient, response) {

    /*Script Name:   CommunicationLogSave
      Customer:      VisualVault 
      Purpose:       The purpose of this script is to find the parent form and relate it to the current child form.  
      Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.  Any item in the array at points 2 or above can be used to return multiple items of information.
                     0 - Status: Success or Error
                     1 - Message
      Date of Dev:   11/21/2018
      Last Rev Date:
 
      Revision Notes:
      11/21/2018: Kendra Austin - Initial creation of the business process. 
      08/17/2019: Kendra Austin -  For use in Lincoln Comm Log
      */

    logger.info('Start of the process CommunicationLogSave at ' + Date());

    //Itizialize Config Variables
    var childFormTemplateId = 'Communications Log';   //Child Form Template ID
    var parentFormTemplateId = 'Individual Record';   //Parent Form Template ID


    //Initialization of the return object
    var returnObj = [];    //Variable used to return information back to the client.

    //Initialization of script variables
    var childFormId = ffCollection.getFormFieldByName('Comm Log ID').value;
    var parentFormId = ffCollection.getFormFieldByName('Individual ID').value;
    var childRevisionID = ffCollection.getFormFieldByName('REVISIONID').value;
    var otherRecordID = ffCollection.getFormFieldByName('Record ID').value;
    var parentRevisionID = '';        //hold revision ID of parent form under getforms

    //Load information for query. 
    var formClientInfoData = {};
    formClientInfoData.q = "[Individual ID] eq '" + parentFormId + "'";
    //formClientInfoData.fields = 'instanceName'; 
    formClientInfoData.expand = true;

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {
        //Get the Parent Form.
        return vvClient.forms.getForms(formClientInfoData, parentFormTemplateId).then(function (parentResp) {
            var resp = JSON.parse(parentResp);

            if (resp.meta.status === 200) {
                if (resp.data.length === 1) {
                    parentRevisionID = resp.data[0].revisionId;
                }
                else if (resp.data.length === 0) {
                    throw new Error('No Parent form was found.');
                }
                else {
                    throw new Error('Too many forms were returned.');
                }
            }
            else {
                throw new Error('Call to get Parent Form returned with an error.');
            }
        });
    })
        .then(function () {
            //Relate the Forms.
            return vvClient.forms.relateForm(childRevisionID, parentRevisionID).then(function (updateResp) {
                var relate = JSON.parse(updateResp);
                if (relate.meta.status === 200) {

                }
                else if (relate.meta.status === 404) {
                    if (relate.meta.reason == "Form Relation Error") {
                        //just continue
                        logger.info("Comm Log relation to Individual Record not successful.");
                    }
                    else if (relate.meta.reason == "NotFound") {
                        throw new Error('No form found.');
                    }
                }
                else {
                    throw new Error('Call to get Parent Form returned with an error.');
                }
            });
        })
        .then(function () {
            //Relate the Other Record
            return vvClient.forms.relateFormByDocId(childRevisionID, otherRecordID).then(function (secondUpdateResp) {
                var otherRecordRelate = JSON.parse(secondUpdateResp);
                if (otherRecordRelate.meta.status === 200) {
                    logger.info('Comm Log relation to Other Record ID successful.');
                }
                else if (otherRecordRelate.meta.status === 404) {
                    logger.info("Comm Log relation to Other Record ID not found or already exists. Reason was: " + otherRecordRelate.meta.reason);
                }
                else {
                    throw new Error('Call to get Parent Form returned with an error.');
                }
            });
        })
        .then(function () {
            returnObj[0] = 'Success';
            returnObj[1] = 'Success'
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
