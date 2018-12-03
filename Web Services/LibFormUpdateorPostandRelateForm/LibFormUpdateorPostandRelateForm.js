var vvEntities = require("../VVRestApi");
var logger = require('../log');


module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "CUSTOMERALIAS";
    options.databaseAlias = "DATABASEALIAS";
    options.userId = "VISUALVAULTUSERACCOUNT";
    options.password = "USERACCOUNTPASSWORD";
    options.clientId = 'APIKEY_GUID FROM USER ACCOUNT';
    options.clientSecret = 'API_SECRET FROM USER ACCOUNT';
    return options;
};


module.exports.main = function (ffCollection, vvClient, response) {

    /*Script Name:   LibFormUpdateorPostandRelateForm
      Customer:      For Global Use
      Purpose:       The purpose of this library is to create or update forms and relate them to another form.  The process can create or update a single form  
                     or depending on input QUERY parameters, a batch of forms may be updated.  The ACTION passed in determines if the process will create or
                     update forms.  Once the form is created or updated, it will be relate to the passed in form represented by the REVISIONID. 
      Parameters:    The following represent variables passed into the function:
                        REVISIONID - String: The revision id (GUID) of the existing form or form to relate the new/updated form to.
                        ACTION - String: A value of either 'Post' or 'Update' depending on whether you want to post a new form or update an 
                                 existing form.
                        TARGETTEMPLATENAME - String: The template name of the target form to be updated or created.
                        TARGETFORMID - String: If ACTION = 'Update,' the revision ID (GUID) of the target form. Not required if ACTION = 'Post'
                        QUERY - Object: If ACTION = 'Update,' and TARGETFORMID is not provided, use the query to find multiple forms to update 
                                and relate each to parent form. If ACTION = 'Update,' either TARGETFORMID or QUERY is required, but not both.
                        UPDATEFIELDS - An object of target field names to update with specified values. Accepts one object only.
      Process PseudoCode:   1. Validate the passed in parameters and extract values. Aggregate error messages into one string so that user can be 
                               informed of all issues at once.
                                a. REVISIONID, ACTION, TARGETTEMPLATENAME, and UPDATEFIELDS are required.
                                b. If ACTION = 'Update,' then either TARGETFORMID or QUERY is required. Look for TARGETFORMID first.
                            2. If the number of errors is greater than zero at this point, then throw an error with the aggregated issues.
                            3. If ACTION = 'Post,' call postForms to post one form instance.
                            4. If ACTION = 'Update' and TARGETFORMID was found, then call postFormRevision to revise one form instance.
                            5. If a form was Posted or Updated in a previous step, relate the Posted or Updated form to the current (parent) form
                               represented by the REVISIONID parameter.
                                a. On success here, add information to the returnObj
                                    i. returnObj[2] will be an object with at least four properties: dataType, href, instanceName, and revisionId
                                    ii. If the form was Posted, returnObj[2] will also have properties: createBy, createById, createDate, modifyBy,
                                        modifyById, and modifyDate
                            6. If ACTION = 'Update,' TARGETFORMID was not found, and QUERY was found, call getForms to return the form data set.
                                a. Store the number of forms returned in the numForms variable to measure in the next step.
                                b. Store the form data set in the childFormData array variable for use in the next step. 
                            7. a. If numForms > 0, iterate through each item in the childFormData array and perform two actions:
                                1. Update the form using the object supplied in the value property of the UPDATEFIELDS parameter.
                                    i. The UPDATEFIELDS will be the same for every form updated. Will not update different forms with different field values.
                                2. Relate the form to the current (parent) form represented by the REVISIONID parameter.
                               b. On success completion of foreach(), add information to the returnObj
                                    i. returnObj[2] will be an array of objects with four properties: dataType, href, instanceName, and revisionId
                            8. return response.json(returnObj) followed by the standard Catch block

      Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.  
                     Any item in the array at points 2 or above can be used to return multiple items of information.
                     0 - Status: 'Success' or 'Error'
                     1 - Message
                     2 - On Success, returns the form data object(s) of the posted form or updated form(s)
      Date of Dev:   11/19/2018
      Last Rev Date:
 
      Revision Notes:
      11/19/2018: Kendra Austin - Initial creation of the business process. 
        
      */

    logger.info('Start of the process LibFormUpdateorPostandRelateForm at ' + Date());

    var Q = require('q');

    //Initialization of the return object
    var returnObj = [];    //Variable used to return information back to the client.

    //Initialization of script variables: Passed in parameters
    var currentFormId = '';             //Used to store the revision ID of the current form.
    var actionRequested = '';           //Used to store the action, either 'Post' or 'Update'
    var targetTemplateName = '';        //Used to store the template name of the target form to post or update.
    var targetFormId = '';              //Used to store the revision ID of the form to update.
    var childFormQuery = {};            //Used to store a query to find multiple child forms to update and relate each to the parent form. 
    var targetFields = {};              //Used to store the object that represents fields to update with new values. 

    //Initialization of other script variables
    var inputErrors = 0;                //Used to count the number of input errors
    var inputErrorsMessage = 'The following errors were encountered with the supplied parameters: <br>';            //Used to store a message to return to the user about what input generated errors.
    var relatedFormId = '';             //Used to store the GUID of the newly posted form, so that it can be related to the current form. 
    var updateByRevisionId = false;     //Used to indicate whether a target form ID was provided, so only that form should be updated and related
    var updateByQuery = false;          //Used to indicate whether a query object was provided, so multiple forms should be found, updated, and related to the parent form. 
    var numForms = -1;                  //Used to store the number of forms returned from the query.  
    var childFormData = [];             //Used to store the form data returned from the query.
    var relatedFormsArray = [];         //Used to store an array of related child forms, when multiple child forms were updated and related. 

    var result = Q.resolve();

    return result.then(function () {
        //Extract the values of the passed in fields. Aggregate error messages into one message so that user can be informed of all issues at once.
        currentFormId = ffCollection.getFormFieldByName('REVISIONID');
        actionRequested = ffCollection.getFormFieldByName('ACTION');
        targetTemplateName = ffCollection.getFormFieldByName('TARGETTEMPLATENAME');
        targetFields = ffCollection.getFormFieldByName('UPDATEFIELDS');


        //Validate passed in fields
        //ACTION is a required parameter
        if (!actionRequested || !actionRequested.value) {
            inputErrors++;
            inputErrorsMessage += "The ACTION parameter was not supplied. ACTION should have a value of either 'Post' or 'Update.' <br>";
        }
        else if (actionRequested.value.toLowerCase() != 'post' && actionRequested.value.toLowerCase() != 'update') {
            inputErrors++;
            inputErrorsMessage += "The ACTION parameter must have a value of either 'Post' or 'Update.' Invalid value provided. <br>";
        }
        else {
            actionRequested = actionRequested.value.toLowerCase();
        }

        //REVISIONID is a required parameter
        if (!currentFormId || !currentFormId.value) {
            inputErrors++;
            inputErrorsMessage += 'The REVISIONID parameter was not supplied. This should be the GUID of the parent form. <br>';
        }
        else {
            currentFormId = currentFormId.value;
        }

        //TARGETTEMPLATENAME is a required parameter
        if (!targetTemplateName || !targetTemplateName.value) {
            inputErrors++;
            inputErrorsMessage += 'The TARGETTEMPLATENAME parameter was not supplied. This should be the template name of the form you want to post or update. <br>';
        }
        else {
            targetTemplateName = targetTemplateName.value;
        }

        //UPDATEFIELDS is a required parameter and cannot be an empty object
        if (!targetFields || !targetFields.value) {
            inputErrors++;
            inputErrorsMessage += 'The UPDATEFIELDS parameter was not supplied. The value should be an object of target field names to update with specified values. <br>';
        }
        else if (Object.getOwnPropertyNames(targetFields.value).length === 0) {
            inputErrors++;
            inputErrorsMessage += 'The UPDATEFIELDS parameter was supplied with an empty object. This object should include target field names to update with specified values. <br>';
        }
        else {
            targetFields = targetFields.value;
        }

        //When ACTION = Update, one of TARGETFORMID or QUERY is required. Query cannot be an empty object
        if (actionRequested == 'update') {
            //Extract the target form ID
            targetFormId = ffCollection.getFormFieldByName('TARGETFORMID');

            //Validate the target form ID
            if (!targetFormId || !targetFormId.value) {
                //If no target form ID found, extract the Query
                childFormQuery = ffCollection.getFormFieldByName('QUERY');

                //If no query found, throw error
                if (!childFormQuery || !childFormQuery.value) {
                    inputErrors++;
                    inputErrorsMessage += "Neither the TARGETFORMID parameter nor the QUERY parameter was supplied. When ACTION is 'Update,' then either the GUID of the target form or a query to find multiple forms must be provided. <br>";
                }
                else if (Object.getOwnPropertyNames(childFormQuery.value).length === 0) {
                    inputErrors++;
                    inputErrorsMessage += "The QUERY parameter was supplied with an empty object. This object should include valid query syntax, with at least a 'q' property and a 'fields' property. <br>";
                }
                else {
                    childFormQuery = childFormQuery.value;
                    updateByQuery = true;
                }
            }
            else {
                updateByRevisionId = true;
                targetFormId = targetFormId.value;
            }
        }

    })
        .then(function () {
            //If the number of errors is greater than zero at this point, then throw an error with the aggregated issues.
            if (inputErrors > 0) {
                throw new Error(inputErrorsMessage);
            }
        })
        .then(function () {
            //If the action requested was to Post a form, then use postForms
            if (actionRequested == 'post') {
                return vvClient.forms.postForms(null, targetFields, targetTemplateName).then(function (postResp) {

                    if (postResp.meta.status === 201 || postResp.meta.status === 200) {
                        //logger.info("New form created successfully");
                        relatedFormId = postResp.data.revisionId;
                        relatedFormsArray = postResp.data;
                    }
                    else {
                        throw new Error("Call to post new form returned with an error. The server returned a status of " + postResp.meta.status);
                    }
                })
            }
        })
        .then(function () {
            //If the action requested was to Update a single form using a TARGETFORMID, then use postFormRevision
            if (actionRequested == 'update' && updateByRevisionId == true) {
                return vvClient.forms.postFormRevision(null, targetFields, targetTemplateName, targetFormId).then(function (updateResp) {
                    if (updateResp.meta.status === 201 || updateResp.meta.status === 200) {
                        //logger.info("Existing form updated successfully");
                        relatedFormId = updateResp.data.revisionId;
                        relatedFormsArray = updateResp.data;
                    }
                    else {
                        throw new Error("Call to post a form revision returned with an error. The server returned with a status of " + updateResp.meta.status);
                    }
                })
            }
        })
        .then(function () {
            //If a form was Posted, or if only one form was Updated, relate the target form with the current (parent) form
            if (actionRequested == 'post' || (actionRequested == 'update' && updateByRevisionId == true)) {
                return vvClient.forms.relateForm(currentFormId, relatedFormId).then(function (relateResp) {
                    var relatedResp = JSON.parse(relateResp);
                    if (relatedResp.meta.status === 200) {
                        returnObj[0] = 'Success';
                        returnObj[1] = "The request to " + actionRequested + " and relate a form was handled successfully.";
                        returnObj[2] = relatedFormsArray;

                    } else {
                        //logger.info("Call to relate forms returned with an error.");
                        throw new Error("Call to relate forms returned with an error.");
                    }
                })
            }
        })
        .then(function () {
            //If a query is being used to find and relate multiple forms, first run getForms to return a number of forms and the form data set. 
            if (actionRequested == 'update' && updateByQuery == true) {
                //First thing to do is get forms based on the query and measure the results
                return vvClient.forms.getForms(childFormQuery, targetTemplateName).then(function (formResponse) {
                    //measure results
                    var formResp = JSON.parse(formResponse);
                    if (formResp.meta.status === 200) {
                        numForms = formResp.data.length;
                        childFormData = formResp.data;

                        //If zero forms returned, or if numForms is still -1, throw an error; 1 or more forms was expected to be returned. 
                        if (numForms == 0) {
                            throw new Error("The call to get forms returned with zero results.");
                        }
                        else if (numForms < 0) {
                            throw new Error("The call to get forms returned with a successful result but invalid data.");
                        }
                    }
                    else {
                        //Error handling
                        throw new Error("The call to get forms returned with an error. The status returned was: " + formResp.meta.status);
                    }
                })
            }
        })
        .then(function () {
            //If the number of forms returned from getForms is > 0, iterate through each item in the data set (array childFormData) to update it and relate it to the parent form
            if (numForms > 0) {
                var processResult = Q.resolve();

                childFormData.forEach(function (childItem) {
                    processResult = processResult.then(function () {

                        return vvClient.forms.postFormRevision(null, targetFields, targetTemplateName, childItem.revisionId)
                            .then(function (newChildForm) {
                                var newChildFormId = '';
                                var newChildFormData = {};              //Used to store the data output of the postformRevision call, to push it to relatedFormsArray, which is returned in returnObj[2]
                                if (newChildForm.meta.status === 201 || newChildForm.meta.status === 200) {
                                    newChildFormId = newChildForm.data.revisionId;
                                    newChildFormData = newChildForm.data;

                                    // Now relate the updated child form to the currently open parent form. 
                                    return vvClient.forms.relateForm(newChildFormId, currentFormId)
                                        .then(function (relatePromise) {
                                            var relateNewChildForm = JSON.parse(relatePromise);
                                            if (relateNewChildForm.meta.status === 201 || relateNewChildForm.meta.status === 200) {
                                                //logger.info("The child form was successfully related to the parent form. ");
                                                relatedFormsArray.push(newChildFormData);
                                            }
                                            else if (relateNewChildForm.meta.status === 404) {
                                                //logger.info("The process used to relate the forms returned with a 404. The relation already exists.");
                                                relatedFormsArray.push(newChildFormData);
                                            }
                                            else {
                                                throw new Error("The process used to relate a found form to the current form returned with an error.");
                                            }
                                        }); //end of relateForm
                                }
                                else {
                                    throw new Error("The process used to update a found form returned with an error. The status was: " + relateNewChildForm.meta.status + ". The status message was: " + newChildForm.meta.statusMsg); 
                                }
                            }); // end of postFormRevision
                    })
                });
                returnObj[0] = 'Success';
                returnObj[1] = "Multiple forms were found, updated, and related. The number of forms handled was " + numForms;
                returnObj[2] = relatedFormsArray;
                return processResult;
            }
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
