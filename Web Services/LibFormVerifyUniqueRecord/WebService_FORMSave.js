var vvEntities = require("../VVRestApi");
var logger = require('../log');

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
    /*Script Name:   FORMSave
     Customer:      CUSTOMER
     Purpose:       The purpose of this script is to check that the CPR for Early Intervention data is unique in the system and then allow saving on the client side.
     Parameters:    The following represent variables passed into the function:  
                    Provider id - the string name of the dhdocid.
                    Service Year Month - this is the year and month of the form.
                    currentDocId - The current form ID of the intake child form (aka Authorization ID).
                    revisionId - the current revision of the intake child form.
     Query List:    
                    
     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.  Any item in the array at points 2 or above can be used to return multiple items of information.
                    0 - Status: Unique, Not Unique, Error
		            1 - Message
     Date of Dev:   02/23/2018
     Last Rev Date: 04/09/2019

    Revision Notes:
     02/23/2018 - Jason Hatch: Initial creation of the business process. 
     03/12/2018 - Jan Zweifel: template ID standardization
     04/09/2019 - Kendra Austin: Escape any apostrophes in the Provider Name.
     */

    logger.info('Start of the process FORMSave at ' + Date());
    //Initialization of the return object
    var outputCollection = [];
    var authResp = [];

    try {
        //The following section contains configuration variables.

        var formTemplateID = 'FORMNAME';

        //Get the information from the form collection payload.
        var currentDocId = ffCollection.getFormFieldByName('FORM ID').value;
        var providerName = ffCollection.getFormFieldByName('Provider Name').value;
        var serviceYearMonth = ffCollection.getFormFieldByName('Service Year Month').value;
        var revisionID = ffCollection.getFormFieldByName('Revision ID').value;

        //Load array with objects to pass to the web service.
        var uniqueRecordObj = [];

        //Form Template ID  (Name in this circumstance) (required by LibFormVerifyUniqueRecord)
        var templateIDObj = {};
        templateIDObj.name = 'templateId';
        templateIDObj.value = formTemplateID;
        uniqueRecordObj.push(templateIDObj);

        //Escape any apostrophes in string expressions used in the query
        var providerNameSearch = providerName.replace(/'/g, "\\'");

        //The query of what we need to look for to determine if it is unique (required by LibFormVerifyUniqueRecord).
        var queryObj = {};
        queryObj.name = 'query';
        queryObj.value = "[Provider ID] eq '" + providerNameSearch + "' AND [Service Year Month] eq '" + serviceYearMonth + "'";
        uniqueRecordObj.push(queryObj);

        //The Form ID of the Intake Child form (required by LibFormVerifyUniqueRecord).
        var formIDObj = {};
        formIDObj.name = 'formId';
        formIDObj.value = currentDocId;
        uniqueRecordObj.push(formIDObj);

        vvClient.scripts.runWebService('LibFormVerifyUniqueRecord', uniqueRecordObj).then(function (resp) {
            var queryResult = resp;
            //logger.info('Response from web service call for LibFormVerifyUniqueRecord is ' + resp);
            if (queryResult.meta.status == '200' && queryResult.data.status != 'undefined') {

                if (queryResult.data.status == 'Unique' || queryResult.data.status == 'Unique Matched') {
                    outputCollection[0] = 'Unique'
                    outputCollection[1] = 'The form is unique.'
                }
                else if (queryResult.data.status == 'Not Unique') {
                    outputCollection[0] = 'Not Unique';
                    outputCollection[1] = 'The information on this record indicates that this form is not unique.';
                }
                else if (queryResult.data.status == 'Error') {
                    outputCollection[0] = 'Error';
                    outputCollection[1] = 'An error was returned from LibFormVerifyUniqueRecord.';
                }
                else {
                    outputCollection[0] = 'Error';
                    outputCollection[1] = 'Unhandled Response returned from LibFormVerifyUniqueRecord.';
                }
            }
            else {
                outputCollection[0] = 'Error';
                outputCollection[1] = 'Attempt to run service return as unfulfilled.';
            }
            return response.json(200, outputCollection);

        });

    }

    catch (ex) {
        logger.info(ex);

        if (outputCollection[1] == '' || outputCollection[1] == null) {
            outputCollection[0] = 'Error';
            outputCollection[1] = 'The following error was encountered when acquiring FORM NAME: ' + ex;
        }

        response.json(200, outputCollection);
        return false;
    }
};
