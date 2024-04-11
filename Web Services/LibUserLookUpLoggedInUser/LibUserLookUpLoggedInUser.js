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
    Script Name:    LibUserLookUpLoggedInUser
    Customer:       VisualVault Library Function
    Purpose:        The purpose of this function is to look up the current logged in user and return information about the individual's record
    Preconditions:  None                    
    Parameters:     1. User Id - REQUIRED; this is the identifier for the logged in user
                    2. Find Form Data - REQUIRED; string of 'True' or 'False'; this determines whether or not additional form data is returned with the response
                    3. Form Template Name - Required if Find Form Data == 'true'; this is the name of the template that stores the user information
                    4. User Id Field - Required if Find Form Data == 'true'; This is the field identifying the user. Should typically be 'Email Address' or similar.
                    5. Form Fields - OPTIONAL; the string of the fields to return if returning form data (If Find Form Data is set to true, provide the form fields you'd like).
                                                  If Form Fields is not passed in, all fields will be returned. 
      
                           SAMPLE: Within your client side code, add fields using the following:
                                   let formData = VV.Form.getFormDataCollection();

                                    // Add data to your data section in your AJAX call
                                    var FormInfo = {};
                                    FormInfo.name = 'User Id';
                                    FormInfo.value = VV.Form.FormUserID;
                                    formData.push(FormInfo);

                                    var lookupParam = {};
                                    lookupParam.name = 'Find Form Data';
                                    lookupParam.value = 'true';
                                    formData.push(lookupParam);

                                    lookupParam = {};
                                    lookupParam.name = 'Form Template Name';
                                    lookupParam.value = 'Individual Record';
                                    formData.push(lookupParam);

                                    lookupParam = {};
                                    lookupParam.name = 'User Id Field';
                                    lookupParam.value = 'Email Address';
                                    formData.push(lookupParam);

                                    lookupParam = {};
                                    lookupParam.name = 'Form Fields';
                                    lookupParam.value = 'First Name,Middle Initial,Last Name,Suffix,Email Address,Individual ID,Contact Phone,Current Employer,Profile Info Confirmed';
                                    formData.push(lookupParam);
                                    
                                    // If needed, add more items such as REVISIONID
                                    
                                    let data = JSON.stringify(formData);
    Return Object:
                    1. Status: "Error" or "Success"
                   2. Message: What occured during the process/specific error if there is one
                   3. Object containing the user account details
                   4. Object containing the user site details
                   5. Object continaing values found in the form template (may or may not exist depending on if the find form data is set to true/false)
    Pseudo code: 
                    1. Call getUser using the User Id provided
                   2. Use the userId to get the site details
                   3. Determine if a call to getForms needs to be made
                         a. If so, perform the call and find the form fields that were passed in to this function call
 
    Date of Dev:    7/26/2019
    Last Rev Date:  10/27/2022
    
    Revision Notes:
                        7/26/2019 - Miroslav Sanader: Script Created
                        7/29/2019 - Miroslav Sanader: Added comment header as well as initial logic for the script
                        7/30/2019 - Miroslav Sanader: Add Individual record form check as well as logic to return the individual record
                        7/31/2019 - Miroslav Sanader: Fix up code after QA comments
                        8/20/2019 - Kendra Austin: Read all input parameters and use them. Add validation of passed in fields. 
                        10/27/2022 - Valkiria Salerno: General Refactor and VV implementation node js ws structure
                        12/12/2022 - Valkiria Salerno: Fix up code after QA comments
     */

  logger.info(`Start of the process LibUserLookUpLoggedInUser at ${Date()}`);

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

  /* -------------------------------------------------------------------------- */
  /*                          Script 'Global' Variables                         */
  /* -------------------------------------------------------------------------- */

  let userData = null;
  let siteData = null;
  let individualRecord = null;

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

  function checkMetaAndStatus(vvClientRes, ignoreStatusCode = 999) {
    /*
        Checks that the meta property of a vvClient API response object has the expected status code
        Parameters:
            vvClientRes: Parsed response object from a vvClient API method
            shortDescription: A string with a short description of the process
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */

    if (!vvClientRes.meta) {
      throw new Error(
        `No meta object found in response. Check method call parameters and credentials `
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
        `There is an error. Status: ${vvClientRes.meta.status}. Reason: ${errorReason}`
      );
    }
    return vvClientRes;
  }

  function checkDataPropertyExists(vvClientRes, ignoreStatusCode = 999) {
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
        throw new Error(`Status: ${status}. Data property was not present `);
      }
    }

    return vvClientRes;
  }

  function checkDataIsNotEmpty(vvClientRes, ignoreStatusCode = 999) {
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

      // If it is a Web Service response, check that the first value is not an Error status
      if (dataIsArray) {
        const firstValue = vvClientRes.data[0];

        if (firstValue == "Error") {
          throw new Error(
            `Returned an error. Please, check called Web Service. Status: ${status}.`
          );
        } else if (isEmptyArray || isEmptyObject) {
          // If the data is empty, throw an error
          throw new Error(
            "There was no data found associated with this email address"
          );
        }
      }
    }
    return vvClientRes;
  }

  function verifySingleRecord(vvClientRes) {
    /*
           Verify data returned is not duplicated
           Parameters:
               vvClientRes: Parsed response object from the API call
       */

    if (vvClientRes.data.length > 1) {
      throw new Error("There are more than one record");
    }
    return vvClientRes;
  }

  function findUser(userId) {
    const info = "while trying to find existent user";

    return vvClient.users
      .getUser({
        q: `[userid] eq '${userId}'`,
        expand: "true",
      })
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res))
      .then((res) => checkDataPropertyExists(res))
      .then((res) => checkDataIsNotEmpty(res))
      .catch((error) => {
        throw Error(error.message + info);
      });
  }
  function getSiteData(siteId) {
    const info = "While trying to find user's site data";

    return vvClient.sites
      .getSites({
        q: `[id] eq '${siteId}'`,
        expand: "true",
      })
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res))
      .then((res) => checkDataPropertyExists(res))
      .then((res) => checkDataIsNotEmpty(res))
      .catch((error) => {
        throw Error(error.message + info);
      });
  }

  function getUserRecordData(formTemplateID, userIdField, formFields, userID) {
    /*
            Call vvClient.forms.getForms to get the data from the individual record
                Parameters:
                    formTemplateID: String value that represents the form template id
                    userIdField: String value that represents the identifier to get the specific form record
                    formFields: String value that represents the data field
                    userID: Strig value that represents the userID
        */
    const info = "While trying to find user's record data";
    const getFormQuery = {};
    getFormQuery.q = `[${userIdField}] eq '${userID}'`;
    getFormQuery.expand = formFields ? false : true;
    getFormQuery.fields = formFields ? formFields : undefined;

    return vvClient.forms
      .getForms(getFormQuery, formTemplateID)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res))
      .then((res) => checkDataPropertyExists(res))
      .then((res) => checkDataIsNotEmpty(res))
      .then((res) => verifySingleRecord(res))
      .catch((error) => {
        throw Error(error.message + info);
      });
  }
  /* -------------------------------------------------------------------------- */
  /*                                  MAIN CODE                                 */
  /* -------------------------------------------------------------------------- */

  try {
    // GET THE VALUES OF THE REQUIRED FIELDS
    
    const userID = getFieldValueByName("User Id");
    let getAdditionalData =
    getFieldValueByName("Find Form Data").toLowerCase() == "true";
    
    //Checking if there were any errors while getting the required field values
    if (errorLog.length > 0) {
      throw new Error(errorLog);
    } else {
      //Check if there is a match in the database for the userID provided and get it's data
      userData = await findUser(userID);

      //Get user's site data
      const siteId = userData.data[0].siteId;
      const getSiteDataResponse = await getSiteData(siteId);
      siteData = getSiteDataResponse.data[0];
    }

    let formTemplateID = "";
    let userIdField = "";
    let formFields = "";

    if (getAdditionalData) {
      formTemplateID = getFieldValueByName("Form Template Name");
      userIdField = getFieldValueByName("User Id Field");
      formFields = getFieldValueByName("Form Fields", false);

      individualRecord = await getUserRecordData(
        formTemplateID,
        userIdField,
        formFields,
        userID
      );
    }


    // BUILD THE SUCCESS RESPONSE ARRAY
    outputCollection[0] = "Success";
    outputCollection[1] = getAdditionalData
      ? "The user data, site data, and form record were successfully returned."
      : "The user data and site info was retrieved. No additional data was included.";
    outputCollection[2] = userData;
    outputCollection[3] = siteData;
    outputCollection[4] = getAdditionalData ? individualRecord : undefined;
  } catch (error) {
    logger.info(`Error encountered ${error}`);

    // BUILD THE ERROR RESPONSE ARRAY
    outputCollection[0] = "Error"; // Don´t change this
    outputCollection[1] = error.message
        ? error.message
        : `Unhandled error occurred: ${error}`;
    
  } finally {
    // SEND THE RESPONSE
    response.json(200, outputCollection);
  }
};
