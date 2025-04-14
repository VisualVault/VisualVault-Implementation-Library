var logger = require("../log");

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

module.exports.main = async function (ffCollection, vvClient, response) {
    /*Script Name:  LibFormVerifyUniqueRecord
     Customer:      VisualVault library function.
     Purpose:       This process verifies that a form record is unique based on the passed in query criteria.  Library function.
     Parameters:    The following represent variables passed into the function:
                    templateId - A string representing the name of the template.
                    query - A string representing the matching conditions. Apostrophes in text fields must be escaped. 
                    formId - A string representing either the form ID or revision ID of the current form. 

     Return Array:  This function returns an object with the following properties:
                    status: 'Unique', 'Unique Matched', 'Not Unique', 'Error'
                    statusMessage: A short descriptive message

     Date of Dev:   11/17/2017
     Last Rev Date: 07/06/2021

     Revision Notes:
     11/17/2017 - Austin Noel: Initial creation of the business process.
     12/05/2017 - Jason Hatch: Needed a revision id returning when on record is found that is not matched.
     05/10/2019 - Kendra Austin: Update so that passed in 'formId' parameter can be either form ID or revision ID.
     07/06/2021 - Emanuel Jofré: Promises transpiled to async/await.
     07/27/2022 - Julian López: Code refactoring .
    */

    // Logs the execution start time of the script
    logger.info("Start of the process LibFormVerifyUniqueRecord at " + Date());

    /**************************************
     Response and error handling variables
    ***************************************/

    // To run into Local server, uncomment line bellow
    // let webServiceRes = {};

    // Initialization of the return object
    const returnObj = {};
    // Initialization of a temporal array to store errors
    let errorLog = [];

    /*****************
     Script Variables
    ******************/

    // Describes the process being checked using the parsing and checking helper functions
    let shortDescription = "";

    /********************
     * Helper Functions *
     ********************/

    async function searchForms(query, templateId, formID) {
        logger.info("Querying form records");
        shortDescription = `Querying form records ${formID}`;
        // Searchs forms using the provided query
        const formParams = { q: query };
        const resp = await vvClient.forms
            .getForms(formParams, templateId)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription));

        return resp;
    }

    function getFieldValueByName(fieldName, isRequired = true) {
        /*
        Check if a field was passed in the request and get its value
        Parameters:
            fieldName: The name of the field to be checked
            isRequired: If the field is required or not
        */

        let resp = null;

        try {
            // Tries to get the field from the passed in arguments
            const field = ffCollection.getFormFieldByName(fieldName);

            if (!field && isRequired) {
                throw new Error(`The field '${fieldName}' was not found.`);
            } else if (field) {
                // If the field was found, get its value
                let fieldValue = field.value ? field.value : null;

                if (typeof fieldValue === "string") {
                    // Remove any leading or trailing spaces
                    fieldValue.trim();
                }

                if (fieldValue) {
                    // Sets the field value to the response
                    resp = fieldValue;
                } else if (isRequired) {
                    // If the field is required and has no value, throw an error
                    throw new Error(`The value property for the field '${fieldName}' was not found or is empty.`);
                }
            }
        } catch (error) {
            // If an error was thrown, add it to the error log
            errorLog.push(error);
        }
        return resp;
    }

    function parseRes(vvClientRes) {
        /*
        Generic JSON parsing function
        Parameters:
            vvClientRes: JSON response from a vvClient API method
        */
        try {
            // Parses the response in case it's a JSON string
            const jsObject = JSON.parse(vvClientRes);
            // Handle non-exception-throwing cases:
            if (jsObject && typeof jsObject === "object") {
                vvClientRes = jsObject;
            }
        } catch (e) {
            // If an error occurs, it's because the resp is already a JS object and doesn't need to be parsed
        }
        return vvClientRes;
    }

    function checkMetaAndStatus(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the meta property of a vvClient API response object has the expected status code
        Parameters:
            vvClientRes: Parsed response object from a vvClient API method
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */

        if (!vvClientRes.meta) {
            throw new Error(`${shortDescription} error. No meta object found in response. Check method call parameters and credentials.`);
        }

        const status = vvClientRes.meta.status;

        // If the status is not the expected one, throw an error
        if (status != 200 && status != 201 && status != ignoreStatusCode) {
            const errorReason = vvClientRes.meta.errors && vvClientRes.meta.errors[0] ? vvClientRes.meta.errors[0].reason : "unspecified";
            throw new Error(`${shortDescription} error. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`);
        }
        return vvClientRes;
    }

    function checkDataPropertyExists(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object exists 
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            // If the data property doesn't exist, throw an error
            if (!vvClientRes.data) {
                throw new Error(`${shortDescription} data property was not present. Please, check parameters and syntax. Status: ${status}.`);
            }
        }

        return vvClientRes;
    }

    /****************
     * Main Process *
     ****************/

    try {
        logger.info("Extracting and validating passed in fields");

        // Validates and gets the passed in parameters
        const templateId = getFieldValueByName("templateId");
        const query = getFieldValueByName("query");
        const formId = getFieldValueByName("formId");

        if (templateId && query && formId) {
            // Gets the forms
            const respSearchForms = await searchForms(query, templateId, formId);

            if (respSearchForms.data) {
                switch (respSearchForms.data.length) {
                    case 0: {
                        returnObj.status = "Unique";
                        returnObj.statusMessage = "The record is unique";
                        break;
                    }
                    case 1: {
                        const record = respSearchForms.data[0];
                        const recordNameEqualsFormId = record.instanceName === formId ? true : false;
                        const recordRevisionIdEqualsFormId = record.revisionId === formId ? true : false;

                        if (recordNameEqualsFormId || recordRevisionIdEqualsFormId) {
                            returnObj.status = "Unique Matched";
                            returnObj.statusMessage = "The record is unique";
                            returnObj.revisionId = record.revisionId;
                        } else {
                            returnObj.status = "Not Unique";
                            returnObj.statusMessage = "The record is NOT unique";
                            returnObj.revisionId = record.revisionId;
                        }
                        break;
                    }
                    default: {
                        returnObj.status = "Not Unique";
                        returnObj.statusMessage = "The record is NOT unique";
                        break;
                    }
                }
            } else {
                throw new Error("The query returned no data");
            }
        } else {
            // Builds a string with every error occurred obtaining field values
            throw new Error(errorLog.join("; "));
        }

        // To run into Local server, uncomment line bellow
        // This code should be added at the end of the main try section. (LOCAL SERVER)
        // webServiceRes = {
        //     meta: {
        //         method: "POST",
        //         status: 200,
        //         statusMsg: "OK",
        //     },
        //     data: returnObj,
        // };
    } catch (error) {
        returnObj.status = "Error";
        returnObj.statusMessage = error.message ? error.message : error;

        // To run into Local server, uncomment line bellow
        // This code should be added in the catch section. (LOCAL SERVER)
        // webServiceRes = {
        //     meta: {
        //         errors: error.message,
        //         method: "POST",
        //         status: 400,
        //         statusMsg: "ERROR",
        //     },
        //     data: errorLog,
        // };
    } finally {
        // To run into Local server, uncomment line bellow
        // This code should be added in the finally section. (LOCAL SERVER)
        // return webServiceRes;

        // To run into VV server, uncomment line bellow
        response.json(200, returnObj);
    }
};
