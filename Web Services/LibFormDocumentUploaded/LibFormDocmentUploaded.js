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
    /*Script Name:  LibFormDocumentUploaded
     Customer:      VisualVault
     Purpose:       The purpose of this process is to determine whether a document has been uploaded to the current form. 
     Parameters: The following represent variables passed into the function:
                Form ID – (string, Required) The form ID or revision ID of the form to assess. Revision ID is preferred if available, as this will save an API call. 
                Template Name – (string, Required if Form ID is not a Revision ID) The name of the template of which Form ID is an instance.
         
     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                Any item in the array at points 2 or above can be used to return multiple items of information.
                0 - Status: ‘Success’, ‘Error’, or ‘No Docs’
                1 - If success, ‘Related documents found.’ If no docs, ‘No documents are related to the form.’ If Error, a detailed error message describing what went wrong. 
                2 - If success, an array of document objects found
     Psuedo code:
        1. Validate that required parameters were passed in. Validate that any non-required parameters passed in are of a valid format.
            a.	If any errors are found, aggregate all issues and return them together. 
        2.	Determine if the Template Name was passed in. 
            a.	If the Template Name was not passed in, then validate that Form ID is the revision ID, and skip to the getFormRelatedDocs call.
            b.	If the Template name was passed in, continue to the next numeric step.
        3.	Call vvClient.forms.getForms(params, templateName) to get the revision ID from the passed in Form ID. 
        4.	Call vvClient.forms.getFormRelatedDocs(revisionId, docParams) to get all documents related to the form. Get index fields also.
        5.	Measure the results from the getFormRelatedDocs call.
            a.	If any errors occurred, return a descriptive error.
            b.	If no documents found, return ‘No Docs’ noting that no documents were found. 
            c.	If documents were found, generate an array of document objects from the results of the API call. 
        6.	Measure the responses from the above functions.  
            a.	If all responses returned successfully, return the following to the client side:
                returnArray[0] = ‘Success’
                returnArray[1] = ‘Related documents found’
                returnArray[2] = Return the array of documents
            b.	If all responses retuned successfully, but no documents were found: 
                returnArray[0] = ‘No Docs’
                returnArray[1] = ‘No documents are related to the form.’
            c.	If the responses returned with any errors:
                returnArray[0] = ‘Error’
                returnArray[1] = Return the error that occurred in the above logic.
     Date of Dev:   1/15/2020
     Last Rev Date: 06/25/2021
     Revision Notes:
     01/15/2020 - Alyssa Carpenter: Initial creation of the business process.
     06/25/2021 - Agustina Mannise: Update the .then prmises to async/await.
     */

    logger.info('Start of the process LibFormDocumentUploaded at ' + Date());

    //Configuration Variables
        
    //Script Variables
    var errors = [];                    //Used to hold errors as they are found, to return together.
    var formOrRevId = ffCollection.getFormFieldByName('Form ID'); //unpack the fields you passed in, this is object with name and value
    var templateName = ffCollection.getFormFieldByName('Template Name');
    var revisionIdIsGUID = false; //set flag
        
    //Initialization of the return object
    var returnObj = [];
    
    //~~~~~~~~Helper Functions~~~~~~~~
    
    //Check if formOrRevId is a GUID 
    function CheckGUID(stringToTest){ 
        var regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi;
        return regexGuid.test(stringToTest);
    }

    //~~~~~~~~~Start try catch~~~~~~~~~
    
    try {
        //Validate passed in fields   
        if (!formOrRevId || !formOrRevId.value.trim()) {
            errors.push("The Form ID parameter was not supplied.")
        }
        else {
            formOrRevId = formOrRevId.value; 
        }

        if(CheckGUID(formOrRevId)){
            revisionIdIsGUID = true;
        }
        
        if (!templateName || !templateName.value.trim()) {  
            errors.push("The Template Name parameter was not supplied.")
        }
        else {
            templateName = templateName.value; 
        }
        

        //Return all validation errors at once.
        if (errors.length > 0) {
            throw new Error(errors);
        }
        
        if(!revisionIdIsGUID){
            //use getForms to get the revisionId from templateName and formOrRevId (which is the Form ID here)
            var params = {};
            params.q = "[instanceName] eq '" + formOrRevId + "'";
            params.fields = 'revisionId';
            var formResp = await vvClient.forms.getForms(params, templateName);
        }
    
        //get DhID into one resp variable (revisionId)
        if(!revisionIdIsGUID){
            var resp = JSON.parse(formResp);
            if (resp.hasOwnProperty('meta') && resp.meta.status === 200) {
                if (resp.hasOwnProperty('data')) {
                    if (resp.data.length === 1) { //only one Form ID was found, so this gives the correct Revision ID
                        revisionId = resp.data[0].revisionId;
                    }
                    else if (resp.data.length === 0) {
                        throw new Error('Unable to determine if documents have been uploaded. Either this form has not yet been saved or does not exist.');
                    }
                    else {
                        throw new Error('Unable to determine if documents have been uploaded. More than one form was found with this Form ID.');
                    }
                }
                else {
                    throw new Error('Data object was not returned with getForms even though a status of 200 was returned.');
                }
            }
            else {
                throw new Error('Unable to determine if documents have been uploaded. Call to get forms returned with an error.');
            }
        }
        
        //Call getFormRelatedDocs to get all documents related to the form. Get index fields also
        var docParams = {};
        docParams.indexFields = 'include';
        docParams.limit = '2000';

        let formDocResp = await vvClient.forms.getFormRelatedDocs(revisionId, docParams);
        
        var resp = JSON.parse(formDocResp);
        if (resp.hasOwnProperty('meta') && resp.meta.status === 200) {
            if (resp.hasOwnProperty('data') && resp.data.length === 0) {
                returnObj[0] = 'No Docs';
                returnObj[1] = 'No documents are related to the form.';
            }
            else {
                returnObj[0] = 'Success';
                returnObj[1] = 'Related documents found';
                returnObj[2] = resp.data;  //  array of the full object(s)
            }
        }
        else {
            throw new Error('Unable to determine if documents have been uploaded. Call to get related docs returned with an error.');
        }
        
        return response.json(returnObj);
        
    }
    catch(err) {
        logger.info(JSON.stringify(err));

        returnObj[0] = 'Error';

        if (err && err.message) {
            returnObj[1] = err.message;
        }
        else {
            returnObj[1] = "An unhandled error has occurred. The message returned was: " + err;
        }

        return response.json(returnObj);
    }
};
