const logger = require("../log");

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
  /*
    Script Name:    LibFormDocumentUploaded 
    Customer:       VisualVault
    Purpose:        The purpose of this process is to determine whether a document has been uploaded to the current form.
    Preconditions:  None.
    Parameters:     The following represent variables passed into the function:
                    Form ID – (string, Required) The form ID or revision ID of the form to assess. Revision ID is preferred if available, as this will save an API call. 
                    Template Name – (string, Required if Form ID is not a Revision ID) The name of the template of which Form ID is an instance.
    Return Object:
                    outputCollection[0]: Status
                    outputCollection[1]: Short description message
                    outputCollection[2]: Data
    Pseudo code: 
                    1. Validate that required parameters were passed in. Validate that any non-required parameters passed in are of a valid format.
                        a. If any errors are found, aggregate all issues and return them together. 
                    2. Determine if the Template Name was passed in. 
                        a. If the Template Name was not passed in, then validate that Form ID is the revision ID, and skip to the getFormRelatedDocs call.
                        b. If the Template name was passed in, continue to the next numeric step.
                    3. Call vvClient.forms.getForms(params, templateName) to get the revision ID from the passed in Form ID. 
                    4. Call vvClient.forms.getFormRelatedDocs(revisionId, docParams) to get all documents related to the form. Get index fields also.
                    5. Measure the results from the getFormRelatedDocs call.
                        a. If any errors occurred, return a descriptive error.
                        b. If no documents found, return ‘No Docs’ noting that no documents were found. 
                        c. If documents were found, generate an array of document objects from the results of the API call. 
                    6. Measure the responses from the above functions.  
                        a. If all responses returned successfully, return the following to the client side:
                          returnArray[0] = ‘Success’
                          returnArray[1] = ‘Related documents found’
                          returnArray[2] = Return the array of documents
                        b. If all responses retuned successfully, but no documents were found: 
                          returnArray[0] = ‘No Docs’
                          returnArray[1] = ‘No documents are related to the form.’
                        c. If the responses returned with any errors:
                          returnArray[0] = ‘Error’
                          returnArray[1] = Return the error that occurred in the above logic.
 
    Date of Dev:   1/15/2020
    Last Rev Date: 08/18/2021
 
    Revision Notes:
                    01/15/2020 - Alyssa Carpenter: Initial creation of the business process.
                    06/25/2021 - Agustina Mannise: Update the .then promises to async/await.
                    08/18/2021 - Agustina Mannise: Update the name of some variables.
    */

  logger.info("Start of the process LibFormDocmentUploaded at " + Date());

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

  const someTemplateName = "TemplateName";
  const someQueryName = "QueryName";
  const someLibraryName = "LibraryName";

  /* -------------------------------------------------------------------------- */
  /*                          Script 'Global' Variables                         */
  /* -------------------------------------------------------------------------- */

  // Description used to better identify API methods errors
  let shortDescription = "";

  /* -------------------------------------------------------------------------- */
  /*                              Helper Functions                              */
  /* -------------------------------------------------------------------------- */

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
          fieldValue = fieldValue.trim();
        }

        if (fieldValue) {
          // Sets the field value to the response
          resp = fieldValue;
        } else if (isRequired) {
          // If the field is required and has no value, throw an error
          throw new Error(
            `The value property for the field '${fieldName}' was not found or is empty.`
          );
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

  function checkMetaAndStatus(
    vvClientRes,
    shortDescription,
    ignoreStatusCode = 999
  ) {
    /*
        Checks that the meta property of a vvClient API response object has the expected status code
        Parameters:
            vvClientRes: Parsed response object from a vvClient API method
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */

    if (!vvClientRes.meta) {
      throw new Error(
        `${shortDescription} error. No meta object found in response. Check method call parameters and credentials.`
      );
    }

    const status = vvClientRes.meta.status;

    // If the status is not the expected one, throw an error
    if (status != 200 && status != 201 && status != ignoreStatusCode) {
      const errorReason =
        vvClientRes.meta.errors && vvClientRes.meta.errors[0]
          ? vvClientRes.meta.errors[0].reason
          : "unspecified";
      throw new Error(
        `${shortDescription} error. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`
      );
    }
    return vvClientRes;
  }

  function checkDataPropertyExists(
    vvClientRes,
    shortDescription,
    ignoreStatusCode = 999
  ) {
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
        throw new Error(
          `${shortDescription} data property was not present. Please, check parameters and syntax. Status: ${status}.`
        );
      }
    }

    return vvClientRes;
  }

  function checkDataIsNotEmpty(
    vvClientRes,
    shortDescription,
    ignoreStatusCode = 999
  ) {
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
      const isEmptyObject =
        dataIsObject && Object.keys(vvClientRes.data).length == 0;

      // If the data is empty, throw an error
      if (isEmptyArray || isEmptyObject) {
        throw new Error(
          `${shortDescription} returned no data. Please, check parameters and syntax. Status: ${status}.`
        );
      }
      // If it is a Web Service response, check that the first value is not an Error status
      if (dataIsArray) {
        const firstValue = vvClientRes.data[0];

        if (firstValue == "Error") {
          throw new Error(
            `${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`
          );
        }
      }
    }
    return vvClientRes;
  }

  function checkGUID(stringToTest) {
    /*
        Check if formOrRevId is a GUID 
        Parameters:
            stringToTest: A string with the ID value to evaluate
        */
    const regexGuid =
      /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi;
    return regexGuid.test(stringToTest);
  }

  function getGUID(formID, templateName) {
    shortDescription = `Getting GUID from Form ID: ${formID}`;

    const params = {
      q: `[instanceName] eq '${formID}'`,
      fields: "revisionId",
    };

    return vvClient.forms
      .getForms(params, templateName)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataPropertyExists(res, shortDescription))
      .then((res) => checkDataIsNotEmpty(res, shortDescription))
      .then((res) => {
        if (res.data.length === 1) {
          return res.data[0].revisionId;
        } else {
          throw new Error(
            "Unable to determine if documents have been uploaded. More than one form was found with this Form ID."
          );
        }
      });
  }

  /* -------------------------------------------------------------------------- */
  /*                                  MAIN CODE                                 */
  /* -------------------------------------------------------------------------- */

  try {
    // GET THE VALUES OF THE FIELDS

    let formOrRevId = getFieldValueByName("Form ID");
    const templateName = getFieldValueByName("Template Name");

    // CHECKS IF THE REQUIRED PARAMETERS ARE PRESENT

    if (!formOrRevId || !templateName) {
      // Throw every error getting field values as one
      throw new Error(errorLog.join("; "));
    }

    // IF FORM ID IS NOT THE GUID, GET THE GUID

    if (checkGUID(formOrRevId) == false) {
      formOrRevId = await getGUID(formOrRevId, templateName);
    }

    // GET ALL RELATED DOCUMENTS

    const docParams = {
      indexFields: "include",
      limit: "2000",
    };

    const formDocResp = await vvClient.forms
      .getFormRelatedDocs(formOrRevId, docParams)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataPropertyExists(res, shortDescription));

    // BUILD THE SUCCESS RESPONSE ARRAY

    outputCollection[0] = "Success"; // Don´t change this
    if (formDocResp.data.length === 0) {
      outputCollection[1] = "No documents are related to the form.";
    } else {
      outputCollection[1] = "Related documents found";
      outputCollection[2] = formDocResp.data; //  array of the full object(s)
    }
  } catch (error) {
    logger.info("Error encountered" + error);

    // BUILD THE ERROR RESPONSE ARRAY

    outputCollection[0] = "Error"; // Don´t change this
    outputCollection[1] = "Some errors ocurred";

    if (errorLog.length > 0) {
      outputCollection[2] = `Error/s: ${errorLog.join("; ")}`;
    } else {
      outputCollection[2] = error.message
        ? `Error: ${error.message}`
        : `Unhandled error occurred: ${error}`;
    }
  } finally {
    // SEND THE RESPONSE

    response.json(200, outputCollection);
  }
};
