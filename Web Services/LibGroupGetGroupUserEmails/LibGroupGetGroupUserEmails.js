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
    Script Name:   LibGroupGetGroupUserEmails
    Customer:      VisualVault
    Purpose:       Get a list User IDs, First Name, Last Name and Email addresses for all users who are the member of a group or multiple groups.
    Parameters:    The following represent variables passed into the function:
                        Array of VisualVault security Groups.  Example as follows:
                        
                        const groupsParamObj = [
                            {
                                name: 'groups',
                                value: ['Information and Eligibility Staff', 'Information and Eligibility Managers']
                            }
                        ];
                        
                        
    Process PseudoCode:
                    1. Extract a list of groups and get the group.  
                    2. For each group found, get user information and load user information into the UserData object.
                    3. Return UserData object to the calling function.
    Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                        Any item in the array at points 2 or above can be used to return multiple items of information.
                        0 - Status: 'Success' or 'Error'
                        1 - Message
                        2 - User data object with list of users.
    Date of Dev:   11/16/2017
    Last Rev Date: 06/28/2022
    Revision Notes:
    11/16/2017 - Austin Noel: Initial creation of the business process. 
    06/04/2018 - Jason Hatch: Add mechanism to return with group name.
    01/02/2019 - Kendra Austin: Only return enabled users.
    06/28/2022 - Emanuel Jofré: General refactoring
    08/05/2022 - Franco Petosa Ayala: General refactoring
    */
  logger.info("Start of the process LibGroupGetGroupUserEmails at " + Date());
  /* -------------------------------------------------------------------------- */
  /*                    Response and error handling variables                   */
  /* -------------------------------------------------------------------------- */
  // Response array
  const outputCollection = [];
  // Array for capturing error messages that may occur during the process
  const errorLog = [];
  /* -------------------------------------------------------------------------- */
  /*                              Script Variables                              */
  /* -------------------------------------------------------------------------- */
  const usersData = [];
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
          fieldValue.trim();
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
        throw new Error(
          `${shortDescription} data property was not present. Please, check parameters and syntax. Status: ${status}.`
        );
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

  function getGroupID(group) {

    const getGroupsParams = {
      q: `name In ('${group}')`,
    };
    
    return vvClient.groups
      .getGroups(getGroupsParams)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res))
      .then((res) => checkDataPropertyExists(res))
      .then((res) => checkDataIsNotEmpty(res))
      .catch(() => {throw new Error('One or more of the passed in group names were unable to found.')})

  }

  function getUsersFromGroup(groupID) {

    const groupUsersParams = {fields: "Id,Name,UserId,FirstName,LastName,EmailAddress,Enabled"};

    return vvClient.groups
      .getGroupsUsers(groupUsersParams, groupID)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res))
      .then((res) => checkDataPropertyExists(res))
      .then((res) => checkDataIsNotEmpty(res))
      .catch(() => { throw new Error('The call to retrieve group members returned with an error.')})

  }
  /* -------------------------------------------------------------------------- */
  /*                                  MAIN CODE                                 */
  /* -------------------------------------------------------------------------- */
  try {

    // 1. GET THE VALUES OF THE FIELDS
    const groupList = getFieldValueByName("groups");

    // 2. CHECKS IF THE REQUIRED PARAMETERS ARE PRESENT
    if (!groupList || groupList.length == 0) {

      throw new Error("The 'groups' parameter was not supplied or had an invalid value");
    }

    for (const group of groupList) {

      // 3. GET GROUP ID
      const getGroupsRes = await getGroupID(group);
      const groupID = getGroupsRes.data[0].id;

      // 4. GET ACTIVE USERS FROM THE GROUP
      const getUsersFromGroupRes = await getUsersFromGroup(groupID);
      const users = getUsersFromGroupRes.data;
      const activeUsers = users.filter((user) => user.enabled == 1);

      // 5. IF USER IS NOT ALREADY IN THE RETURN DATA OBJECT, ADD IT
      for (const user of activeUsers) {

        const userExists = usersData.find(userAlreadyFound => userAlreadyFound.id === user.id);

        if (!userExists) {
          user.groupname = group; // add the group name to each new user
          usersData.push(user);
        }

      }
    }

    // 6. BUILD THE SUCCESS RESPONSE ARRAY
    outputCollection[0] = "Success"; // Don´t chance this
    outputCollection[1] = "The process completed successfully";
    outputCollection[2] = usersData;

  } catch (error) {
    
    logger.info("Error encountered" + error);

    // BUILD THE ERROR RESPONSE ARRAY
    outputCollection[0] = "Error"; // Don´t chance this
    outputCollection[1] = error.message;
    outputCollection[2] = usersData;
    
  } finally {

    // SEND THE RESPONSE
    response.json(200, outputCollection);

  }
};