const logger = require("../log");

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
    /*
    Script Name:    WSLibFormGeneratePDFandFile 
    Customer:       VisualVault
    Purpose:        The purpose of this script is to provide a useful example for how to call LibFormGeneratePDFandFile
    Preconditions:
                    - List of libraries, form, queries, etc. that must exist in order this code to run
                    - You can also list other preconditions as users permissions, environments, etc
    Parameters:    The following represent variables passed into the function:
                    Form ID - (string, Required) form ID of the record to print to PDF.
                    Form Template ID - (string, Required) guid of the template that should be printed. Can be the actual GUID of the template or the template name (i.e. 'My Template')
                    Revision ID - (string, Required) revision ID of the record to print to PDF.
                    Folder Path - (string, Required) folder path in the document library where the PDF will be stored.
                    Index Fields - (array of objects, Optional) index fields that should be populated.
                    Document Name - (string, Required) file name of the PDF that will be created in the system (.pdf is automatically appended to this name).
                    Sample params:
                    let paramObject = [
                        { name: 'Form ID', value: 'FORMID-00000012' },
                        { name: 'Form Template ID', value: 'Form' }, (can also be GUID instead)
                        { name: 'Revision ID', value: 'f4b78690-230b-4949-9e0d-484bdc664f7c' },
                        { name: 'Document Name', value: 'Title Of My Document' },
                        { name: 'Folder Path', value: '/Custom/Folder/Path' },
                        { name: 'Index Fields', value: [
                            { name: 'Index Field 1', value: 'Some stuff' },
                            { name: 'Sample Index', value: 'More stuff' }
                        ]}
                    ];
    Return Object:  0 - Status: 'Success', 'Error', or 'Minor Errors'
                     1 - Message
                     2 - Error array of minor errors if they are present, otherwise an empty array object
                     3 - Object housing the id, fileid, and docid of the generated PDF
    Pseudo Code:
                    1. Validate information passed from Form Template.
                    2. Check if index was sent.
                    3. Get revision GUID with a query including FormID field 
                    4. Create webServiceParams array with each objects.
                    5. Call LibFormGeneratePDFandFile library passing the webServiceParams Array[].
                    6. Respond back to the calling function with success or failure.
 
    Date of Dev:    08/04/2022
 
    Revision Notes:
                    08/04/2022 - Julian Lopez:  First Setup of the script
                    01/24/2023 - Julian Lopez:  Update getFieldValueByName() helper function, logger.info message and organize script.
    */

    logger.info("Start of the process WSLibFormGeneratePDFandFile at " + Date());

    /* -------------------------------------------------------------------------- */
    /*                    Response and error handling variables                   */
    /* -------------------------------------------------------------------------- */

    // Response array
    let outputCollection = [];
    // Array for capturing error messages that may occur during the process
    let errorLog = [];

    /* -------------------------------------------------------------------------- */
    /*                           Configurable Variables                           */
    /* -------------------------------------------------------------------------- */

    const indexFields_obj = [];
    const webServiceName = "LibFormGeneratePDFandFile";

    /* -------------------------------------------------------------------------- */
    /*                          Script 'Global' Variables                         */
    /* -------------------------------------------------------------------------- */

    // Description used to better identify API methods errors
    let shortDescription = "";

    /* -------------------------------------------------------------------------- */
    /*                              Helper Functions                              */
    /* -------------------------------------------------------------------------- */

    function getFieldValueByName(fieldName, isOptional = false) {
        /*
        Check if a field was passed in the request and get its value
        Parameters:
            fieldName: The name of the field to be checked
            isOptional: If the field is required or not
        */
     
        try {
            const field = ffCollection.getFormFieldByName(fieldName);
            const requiredFieldDoesntExists = !isOptional && !field;
     
            if (requiredFieldDoesntExists) {
                throw new Error(`The field '${fieldName}' was not found.`);
            }
     
            if (field) {
                let fieldValue = 'value' in field ? field.value : null;
                fieldValue = typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue;
                const requiredFieldHasNoValue = !fieldValue && typeof fieldValue !== 'number' && !isOptional;
                const ddSelectItem = fieldValue == 'Select Item';
     
                if (requiredFieldHasNoValue || ddSelectItem) {
                    throw new Error(`The value property for the field '${fieldName}' was not found or is empty.`);
                }
     
                return fieldValue;
            }
        } catch (error) {
            errorLog.push(error.message);
        }
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

    function checkDataIsNotEmpty(vvClientRes, shortDescription, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object is not empty
        Parameters:
            res: Parsed response object from the API call
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;

        if (status != ignoreStatusCode) {
            const dataIsArray = Array.isArray(vvClientRes.data);
            const dataIsObject = typeof vvClientRes.data === "object";
            const isEmptyArray = dataIsArray && vvClientRes.data.length == 0;
            const isEmptyObject = dataIsObject && Object.keys(vvClientRes.data).length == 0;

            // If the data is empty, throw an error
            if (isEmptyArray || isEmptyObject) {
                throw new Error(`${shortDescription} returned no data. Please, check parameters and syntax. Status: ${status}.`);
            }
            // If it is a Web Service response, check that the first value is not an Error status
            if (dataIsArray) {
                const firstValue = vvClientRes.data[0];

                if (firstValue == "Error") {
                    throw new Error(`${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`);
                }
            }
        }
        return vvClientRes;
    }

    /* -------------------------------------------------------------------------- */
    /*                                  MAIN CODE                                 */
    /* -------------------------------------------------------------------------- */

    try {
        // GET THE VALUES OF THE FIELDS

        const formID = getFieldValueByName("Form ID");
        const formTemplateID = getFieldValueByName("Form Template ID");
        const fieldID = getFieldValueByName("Field ID");
        const documentName = getFieldValueByName("Document Name");
        const folderPath = getFieldValueByName("Folder Path");
        const indexFields_str = getFieldValueByName("Index Fields");

        // CHECKS IF THE REQUIRED PARAMETERS ARE PRESENT

        if (!formID || !formTemplateID || !documentName || !folderPath) {
            // Throw every error getting field values as one
            throw new Error(errorLog.join("; "));
        }

        // YOUR CODE GOES HERE
        // Check if index fields was sent, then create index fields object
        if(indexFields_str){
            let indexFields_arr = indexFields_str.split(",");
            indexFields_arr.forEach((element) => {
                let index = element.split(":");
                indexFields_obj.push({ name: index[0], value: index[1] });
            });
        }


        // Get revision GUID with a query including FormID field 
        shortDescription = `Get GUID with revisionID ${formID}`;

        const getRevisionParams = {
            // q: `[Form ID] eq '${formID}'`,
            q: "[" + fieldID + "] eq '" + formID + "'",
            expand: true,
        };

        const getParentFormRes = await vvClient.forms
            .getForms(getRevisionParams, formTemplateID)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription));

        const formGUID = getParentFormRes.data[0].revisionId;

        shortDescription = `Run Web Service: ${webServiceName}`;

        // The following array has to contain one object for each parameter sent to the next web service
        // Each object has to contain two properties:
        //     name: Name of the parameter
        //     value: value for the parameter

        const webServiceParams = [
            {
                name: "Form ID",
                value: formID,
            },
            {
                name: "Revision ID",
                value: formGUID,
            },
            {
                name: "Form Template ID",
                value: formTemplateID,
            },
            {
                name: "Folder Path",
                value: folderPath,
            },
            {
                name: "Index Fields",
                value: indexFields_obj,
            },
            {
                name: "Document Name",
                value: documentName,
            },
        ];


        // Call LibFormGeneratePDFandFile library
        await vvClient.scripts
            .runWebService(webServiceName, webServiceParams)
            .then((res) => checkMetaAndStatus(res, shortDescription))
            .then((res) => checkDataPropertyExists(res, shortDescription))
            .then((res) => checkDataIsNotEmpty(res, shortDescription));

        // BUILD THE SUCCESS RESPONSE ARRAY

        outputCollection[0] = "Success"; // Don´t change this
        outputCollection[1] = "Call successfully, the PDF file was generated";
        // outputCollection[2] = someVariableWithData;
    } catch (error) {
        logger.info("Error encountered" + error);

        // BUILD THE ERROR RESPONSE ARRAY

        outputCollection[0] = "Error"; // Don´t change this

        if (errorLog.length > 0) {
            outputCollection[1] = "Some errors ocurred";
            outputCollection[2] = `Error/s: ${errorLog.join("; ")}`;
        } else {
            outputCollection[1] = error.message ? error.message : `Unhandled error occurred: ${error}`;
        }
    } finally {
        // SEND THE RESPONSE
        response.json(200, outputCollection);
    }
};
