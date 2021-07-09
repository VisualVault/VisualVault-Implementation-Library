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

module.exports.main = async function (ffCollection, vvClient, response) {
    /*Script Name:      FormDocumentUploaded
    Customer:      VisualVault
    Purpose:       The purpose of this script is to provide a useful example for how to call LibFormDocumentUploaded
    Parameters:    The following represent variables passed into the function:  
                Standard form data. The collection received should have the following information.
                [Template Name]: String with the name of the template. 
                [Form ID]: String with the form ID or the GUID. 

    Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                Any item in the array at points 2 or above can be used to return multiple items of information.
                0 - Status: Success, Error
                1 - Message

    Pseudocode:   1. Collect data from form collection.
                2. Create the array that will be used to call LibFormDocumentUploaded.
                3. Call LibFormDocumentUploaded.
                3. Measure and return response.

    Date of Dev:   06/25/2021
    Last Rev Date: 06/25/2021
    Revision Notes:
    06/25/2021 - Agustina Mannise: Initial creation of the business process.

    */

    logger.info('Start of the process FormDocumentUploaded at ' + Date());

    //Script Variables, global variables.
    var templateName = ffCollection.getFormFieldByName('Template Name').value;
    var formId = ffCollection.getFormFieldByName('Form ID').value;

    //Initialization of the return object.
    var returnObj = [];

    //Start the try catch

    try {
        //This array will hold the information to call LibFormDocumentUploaded.
        var formDocRequestArray = [
            { name: 'Template Name', value: templateName },
            { name: 'Form ID', value: formId }
        ];
        //This is calling the library web service. 
        let resp = await vvClient.scripts.runWebService('LibFormDocumentUploaded', formDocRequestArray);


        //After callig the 'LibFormDocumentUploaded' we need to measure the response.

        //Checking for status 200
        if (resp.meta.status == 200) {
            //Checking that resp has data attached to it.
            if (resp.hasOwnProperty('data')) {
                if (resp.data[0] == 'Success' || resp.data[0] == 'No Docs') {
                    logger.info('Succesfully finished the process.');
                    returnObj[0] = 'Success';
                    returnObj[1] = resp.data[1];
                    return response.json(returnObj);
                } else if (resp.data[0] == 'Error') {
                    throw new Error("The call to verify Form Documents returned with an error. " + resp.data[1]);
                } else {
                    throw new Error("The call verify Form Documents returned with an unhandled error.");
                }
            } else {
                throw new Error("The data could not be returned from the global script LibFormDocumentUploaded");
            }
        } else {
            throw new Error("The call to LibFormDocumentUploaded returned with an error.");
        }
    }
    //Error catching
    catch (err) {
        //logging the error
        logger.info(JSON.stringify(err));
        returnObj[0] = 'Error';
        if (err && err.message) {
            returnObj[1] = err.message;
        } else {
            returnObj[1] = "An unhandled error has occurred. The message returned was: " + err;
        }
        return response.json(returnObj);
    }
};
