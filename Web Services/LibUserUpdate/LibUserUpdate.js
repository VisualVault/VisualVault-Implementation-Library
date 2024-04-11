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
        Script Name:    LibUserUpdate
        Customer:       VisualVault
        Purpose:        The purpose of this NodeJS process will allow a user to be updated with various potential options.  Those options will be turned on or off depending on what is passed to the NodeJS process.
                        NOTE: The username of a user cannot be changed with this script. It must be updated manually in the Control Panel.
                            Passwords cannot be changed with this script. Code is commented out in previous versions of this script on GitHub; to be used when the API is updated. 
                            User sites cannot be changed with this script.
        
        Preconditions:  A query must be configured in Default queries (NOT in form data queries) that reflects the below:
                        SELECT UsUserID, UsId, UsFirstName, UsMiddleInit, UsLastName, UsEmailAddress, UsSiteID, UsEnabled
                        FROM dbo.Users

        Parameters:     The following represent variables passed into the function:
                        Action - (string, Required) 'Update', 'Disable', or 'Enable' This parameter will control which actions this script takes.
                        User ID - (string, Required) This is the user name of the user.
                        First Name - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                        Middle Initial - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                        Last Name - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                        Email Address - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                        Group List - (string, not Required) String of group names separated by commas. The user will be assigned to these groups.
                        Remove Group List - (string, not Required) String of group names separated by commas. The user will be removed from these groups.
         
        Return Object:  The following represents the array of information returned to the calling function.  This is a standardized response.
                        Any item in the array at points 2 or above can be used to return multiple items of information.
                        outputCollection[0]: Status
                        outputCollection[1]: Short description message
                        outputCollection[2]: Data

        Psuedo code:
                        1. Validate parameter inputs to ensure the combination is valid. 
                        2. Assess which action the script should take.
                                a. If Disable, only disable the account.
                                b. If Enable, enable then update account.
                                c. If Update, only update the account.
                        3. Get the results of a custom query to find the user information. Store info for later use. 
                        - If no user found, throw an error.
                        4. Enable the user account if needed. 
                        5. Disable the user account if needed. Immediately return a reponse; no further actions taken.
                        6. Determine what information the user wants to change and load that info into a user update object.
                        7. Send the user update object through putUsers to update the user information.
                        8. Determine if user email address should be chnaged and load that info into an email update object.
                        9. Send the email update object through putUsersEndpoint to update the user email address information.
                        10. If Group List or Remove Group List were passed in as parameters, call getGroups to ensure they exist.
                        11. Add the groups in Group List.
                        12. Remove the groups in Remove Group List.

        Date of Dev:    12/4/2018
        Last Rev Date:  07/25/2022

        Revision Notes:
                        12/20/2018 - Alex Rhee: Initial creation of the business process.
                        01/03/2019 - Alex Rhee: Process created and working. Passwords cannot be changed at this time.
                        01/18/2019 - Alex Rhee: Made sure all API calls are being measured by Resp.meta.status === 200
                        12/10/2019 - Kendra Austin: Update to include user enable & disable; update header; bug fixes.
                        01/08/2020 - Kendra Austin: Update to run a custom query to find the user rather than getUsers. This precludes the need for the user GUID parameter.
                        08/12/2021 - Mauricio Tolosa: Transformed scrypt to async await
                        07/25/2022 - Franco Petosa Ayala: General Refactor
    */

  logger.info("Start of the process SCRIPT NAME HERE at " + Date());

  /* -------------------------------------------------------------------------- */
  /*                    Response and error handling variables                   */
  /* -------------------------------------------------------------------------- */

  // Response array
  const outputCollection = [];
  // Array for capturing error messages that may occur during the process
  const errorLog = [];

  /* -------------------------------------------------------------------------- */
  /*                           Configurable Variables                           */
  /* -------------------------------------------------------------------------- */

  const userQueryName = "UserUpdateQuery";

  /* -------------------------------------------------------------------------- */
  /*                          Script 'Global' Variables                         */
  /* -------------------------------------------------------------------------- */

  // Description used to better identify API methods errors
  let shortDescription = "";
  let userGUID = "";
  let siteID = "";
  let currentFirstName = "";
  let currentLastName = "";
  let currentMiddleInitial = "";
  let currentEmailAddress = "";
  const currentGroups = [];
  const groupListObj = [];
  const removeGroupListObj = [];

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
        throw new Error(`The ${fieldName} parameter was not supplied.`);
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
          throw new Error(`The ${fieldName} parameter was not supplied.`);
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

    const status = vvClientRes.meta.status;

    // If the status is not the expected one, throw an error
    if (status == 404) {
      throw new Error(`status`);
    } else if (
      status != 200 &&
      status != 201 &&
      status != ignoreStatusCode &&
      status != 400
    ) {
      throw new Error(`undefined`);
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
        throw new Error(`dataEmpty`);
      }
      // If it is a Web Service response, check that the first value is not an Error status
      /*if (dataIsArray) {
                const firstValue = vvClientRes.data[0];

                if (firstValue == "Error") {
                    throw new Error(`${shortDescription} returned an error. Please, check called Web Service. Status: ${status}.`);
                }
            }*/
    }
    return vvClientRes;
  }

  function verifySingleData(vvClientRes) {
    if (vvClientRes.data.length != 1) {
      throw new Error(`dataNotSingle`);
    } else {
      return vvClientRes;
    }
  }

  function getUserData(userID, userQueryName) {
    const userQueryParams = {
      filter: `[UsUserID] = '${userID}'`,
    };

    return vvClient.customQuery
      .getCustomQueryResultsByName(userQueryName, userQueryParams)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataPropertyExists(res, shortDescription))
      .then((res) => checkDataIsNotEmpty(res, shortDescription))
      .then((res) => verifySingleData(res))
      .catch((error) => {
        switch (error.message) {
          case "status":
            throw new Error(
              `The custom query to find users was not found. Please ensure that a query named ${userQueryName} has been configured in the default queries area.`
            );
          case "dataEmpty":
            throw new Error(`User not found with user ID: ${userID}.`);
          case "dataNotSingle":
            throw new Error(
              `More than one user was found for ID: ${userID}. This is an invalid state. Please notify a system administrator.`
            );
          default:
            throw new Error(
              `There was an error when searching for the user ${userID}.`
            );
        }
      });
  }

  function enableUser(userID, userGUID) {
    const paramsObj = {
      enabled: "true",
    };

    return vvClient.users
      .putUsersEndpoint({}, paramsObj, userGUID)
      .then((res) => parseRes(res))
      .then((res) => {
        checkMetaAndStatus(res, shortDescription);
        logger.info(`User enabled successfully. User ID ${userID}.`);
      })
      .catch(() => {
        throw new Error(
          "Attempt to enable the user account encountered an error."
        );
      });
  }

  function disableUser(userID, userGUID) {
    const paramsObj = {
      enabled: "false",
    };

    return vvClient.users
      .putUsersEndpoint({}, paramsObj, userGUID)
      .then((res) => parseRes(res))
      .then((res) => {
        checkMetaAndStatus(res, shortDescription);
        logger.info(`User enabled successfully. User ID ${userID}.`);
      })
      .catch(() => {
        throw new Error(
          "Attempt to disable the user account encountered an error."
        );
      });
  }

  function updateUserPersonalData(userUpdateObj, userID, userGUID, siteID) {
    return vvClient.users
      .putUsers({}, userUpdateObj, siteID, userGUID)
      .then((res) => parseRes(res))
      .then((res) => {
        checkMetaAndStatus(res);
        logger.info(`User updated successfully. User ID ${userID}.`);
      })
      .catch(() => {
        throw new Error(
          "Attempt to update the user account encountered an error."
        );
      });
  }

  function updateUserEmail(userEmailUpdateObj, userID, userGUID) {
    return vvClient.users
      .putUsersEndpoint({}, userEmailUpdateObj, userGUID)
      .then((res) => parseRes(res))
      .then((res) => {
        checkMetaAndStatus(res);
        logger.info(
          `User Email Address updated successfully. User ID ${userID}.`
        );
      })
      .catch(() => {
        throw new Error(
          "Attempt to update the user email address encountered an error."
        );
      });
  }

  function getCurrentGroups() {
    const queryObj = {};
    queryObj.q = "";
    queryObj.fields = "id,name,description";

    return vvClient.groups
      .getGroups(queryObj)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataPropertyExists(res, shortDescription))
      .then((res) => checkDataIsNotEmpty(res, shortDescription))
      .catch((error) => {
        if (error.message == "emptyData") {
          throw new Error("No groups were found to exist.");
        } else {
          throw new Error("There was an error when searching for groups.");
        }
      });
  }

  function addUserToGroups(groupListObj, userGUID) {
    return Promise.allSettled(
      groupListObj.map((groupObj) => {
        const groupID = groupObj.id;
        const groupName = groupObj.name;

        return vvClient.groups
          .addUserToGroup({}, groupID, userGUID)
          .then((res) => parseRes(res, shortDescription))
          .then((res) => {
            checkMetaAndStatus(res, shortDescription);
            logger.info(`User added to group ${groupName} successfully.`);
          })
          .catch(() => {
            errorLog.push(
              `Call to add user to group ${groupName} returned with an unsuccessful status code.`
            );
            logger.info(
              `Call to add user to group ${groupName} returned with an unsuccessful status code.`
            );
          });
      })
    );
  }

  function removeUserFromGroups(removeGroupListObj, userGUID) {
    return Promise.allSettled(
      removeGroupListObj.map((groupObj) => {
        const groupID = groupObj.id;
        const groupName = groupObj.name;

        return vvClient.groups
          .removeUserFromGroup({}, groupID, userGUID)
          .then((res) => parseRes(res, shortDescription))
          .then((res) => {
            checkMetaAndStatus(res, shortDescription);
            logger.info(`User removed from group ${groupName} successfully.`);
          })
          .catch(() => {
            errorLog.push(
              `Call to remove user from group ${groupName} returned with an unsuccessful status code.`
            );
            logger.info(
              `Call to remove user from group ${groupName} returned with an unsuccessful status code.`
            );
          });
      })
    );
  }

  // extraer de getNewUserData el usID y con eso buscar los grupos y devolver. pasarle mail y pasarle el id guid
  function getUserCurrentGroups(userID, internalUserID) {
    const userGroupParams = {};
    shortDescription = `getUserGroups for user ID ${userID}`;

    return vvClient.users
      .getUserGroups(userGroupParams, internalUserID)
      .then((res) => parseRes(res))
      .then((res) => checkMetaAndStatus(res, shortDescription))
      .then((res) => checkDataPropertyExists(res, shortDescription))
      .then((res) => checkDataIsNotEmpty(res, shortDescription))
      .catch(() => {
        throw new Error(
          "Attempt to update the user account encountered an error."
        );
      });
  }

  /* -------------------------------------------------------------------------- */
  /*                                  MAIN CODE                                 */
  /* -------------------------------------------------------------------------- */

  try {
    // GET THE VALUES OF THE FIELDS:
    //The fields 'action' and 'userID' are required fields. If they are missing, the ws will throw an error ending the process.
    //The function getFieldValueByName will verify required fields are not missing

    const action = getFieldValueByName("Action");
    const userID = getFieldValueByName("User ID");
    const NewFirstName = getFieldValueByName("First Name", false);
    const NewLastName = getFieldValueByName("Last Name", false);
    const NewMiddleInitial = getFieldValueByName("Middle Initial", false);
    const NewEmail = getFieldValueByName("Email Address", false);
    let groupList = getFieldValueByName("Group List", false);
    let removeGroupList = getFieldValueByName("Remove Group List", false);

    //VERIFY THE PASSED IN ACTION HAS VALID VALUE: 'Enable', 'Disable' or 'Update'
    if (action != "Enable" && action != "Update" && action != "Disable") {
      errorLog.push("The Action parameter must be Enable, Disable, or Update.");
    }

    //VERIFY THERE ARE NOT ERRORS PRESENT ON THE PASSED IN PARAMETERS (REQUIRED ONES)
    if (errorLog.length > 0) {
      throw new Error(errorLog);
    }

    //GET USER DATA: UsUserID, UsId, UsFirstName, UsMiddleInit, UsLastName, UsEmailAddress, UsSiteID, UsEnabled
    const getUserDataResp = await getUserData(userID, userQueryName);

    userGUID = getUserDataResp.data[0].usId;
    siteID = getUserDataResp.data[0].usSiteID;
    currentFirstName = getUserDataResp.data[0].usFirstName;
    currentLastName = getUserDataResp.data[0].usLastName;
    currentMiddleInitial = getUserDataResp.data[0].usMiddleInit;
    currentEmailAddress = getUserDataResp.data[0].usEmailAddress;

    //ENABLE USER: only if the action was set to 'Enable'
    if (action === "Enable") {
      await enableUser(userID, userGUID);
    }

    //DISABLE USER: only if the action was set to 'Disable'
    if (action === "Disable") {
      await disableUser(userID, userGUID);
    }

    //THE FOLLOWING PROCESSES ARE ONLY CARRIED OUT IF THE ACTION IS NOT EQUAL TO 'Disable'
    if (action !== "Disable") {
      //PROCESS 1°: UPDATE USER PERSONAL DATA IF IT WAS PASSED IN: firstname, lastname, middleinitial, emailaddress

      //BUILD OBJ TO UPDATE THE NEW PERSONAL DATA
      const userUpdateObj = {};
      userUpdateObj.firstname =
        NewFirstName && NewFirstName != currentFirstName
          ? NewFirstName
          : undefined;
      userUpdateObj.lastname =
        NewLastName && NewLastName != currentLastName ? NewLastName : undefined;
      userUpdateObj.middleinitial =
        NewMiddleInitial && NewMiddleInitial != currentMiddleInitial
          ? NewMiddleInitial
          : undefined;

      //UPDATE THE USER INFORMATION ONLY IF THE DATA EXIST
      if (
        userUpdateObj.firstname ||
        userUpdateObj.lastname ||
        userUpdateObj.middleinitial
      ) {
        await updateUserPersonalData(userUpdateObj, userID, userGUID, siteID);
      }

      //PROCESS 2°: UPDATE USER EMAIL ADDRESS IF IT WAS PASSED IN

      //BUILD OBJ TO UPDATE THE USER EMAIL ADDRESS
      const userEmailUpdateObj = {};
      userEmailUpdateObj.emailaddress =
        NewEmail && NewEmail != currentEmailAddress ? NewEmail : undefined;

      //UPDATE THE USER EMAIL ONLY IF THE NEW EMAIL EXIST:
      if (userEmailUpdateObj.emailaddress) {
        await updateUserEmail(userEmailUpdateObj, userID, userGUID);
      }

      //PROCESS 3°: ADD THE USER TO THE PASSED IN GROUPS / REMOVE THE USER FROM THE PASSED IN GROUPS

      //BUILD THE LIST OF GROUPS TO ADD THE USER
      if (groupList) {
        groupList = groupList.split(",");
        groupList = groupList.map((item) => item.trim());
      }

      //BUILD THE LIST OF GROUPS WHICH THE USER SHOULD BE REMOVED FROM
      if (removeGroupList) {
        removeGroupList = removeGroupList.split(",");
        removeGroupList = removeGroupList.map((item) => item.trim());
      }

      //GET THE GROUPS THAT ALREADY EXIST ON VV
      if (groupList || removeGroupList) {
        const currentGroupsResponse = await getCurrentGroups();
        currentGroups.push(...currentGroupsResponse.data);

        //VERIFY THE PASSED IN GROUPS TO ADD TO THE USER PROFILE ARE VALID AND MATCH WITH AN EXISTING GROUP ON VV
        if (groupList) {
          groupList.forEach((passedInGroup) => {
            let groupExist = false;
            currentGroups.forEach((existingGroup) => {
              if (passedInGroup == existingGroup.name) {
                groupListObj.push(existingGroup);
                groupExist = true;
              }
            });
            if (!groupExist) {
              errorLog.push(
                `The group ${passedInGroup} could not be added to the user profile because the group was not found.`
              );
            }
          });
        }

        //VERIFY THE PASSED IN GROUPS TO REMOVE FROM THE USER PROFILE ARE VALID AND MATCH WITH AN EXISTING GROUP ON VV
        if (removeGroupList) {
          removeGroupList.forEach((passedInGroup) => {
            let groupExist = false;
            currentGroups.forEach((existingGroup) => {
              if (passedInGroup == existingGroup.name) {
                removeGroupListObj.push(existingGroup);
                groupExist = true;
              }
            });
            if (!groupExist) {
              errorLog.push(
                `The group ${passedInGroup} could not be removed from the user profile because the group was not found.`
              );
            }
          });
        }
      }

      //ADD THE USER TO THE PASSED IN GROUPS ONCE VERIFY THEY EXIST IN VV
      if (groupListObj.length > 0) {
        await addUserToGroups(groupListObj, userGUID);
      }

      //REMOVE THE USER FROM THE PASSED IN GROUPS ONCE VERIFY THEY EXIST IN VV
      if (removeGroupListObj.length > 0) {
        await removeUserFromGroups(removeGroupListObj, userGUID);
      }

      //VERIFY IF THERE WAS AN ERROR ADDING OR REMOVING A GROUP FROM THE USER PROFILE
      if (errorLog.length > 0) {
        throw new Error(
          `The user groups may not have been fully updated. ${errorLog}`
        );
      }
    }

    // GET USER'S CURRENT GROUPS IN THE END, TO RETURN THE CURRENT STATE

    const getUserGroups = await getUserCurrentGroups(
      userID,
      getUserDataResp.data[0].usId
    );

    const finalUserGroups = getUserGroups.data.map((e) => e.name).join();
    //GETS THE USER DATA ONE LAST TIME, TO RETURN THE CURRENT DATA WITH ANY POSSIBLE CHANGES MADE
    const getNewUserData = await getUserData(userID, userQueryName);
    const finalUserData = getNewUserData.data[0];

    // BUILD THE SUCCESS RESPONSE ARRAY
    outputCollection[0] = "Success"; // Don´t change this
    outputCollection[1] =
      action == "Disable" ? "User account disabled." : "User updated.";
    outputCollection[2] = userGUID;
    outputCollection[3] = finalUserData;
    outputCollection[4] = finalUserGroups;
  } catch (error) {
    logger.info(`Error encountered ${error}`);

    // BUILD THE ERROR RESPONSE ARRAY

    outputCollection[0] = "Error"; // Don´t change this

    if (error) {
      outputCollection[1] = error.message;
    } else {
      outputCollection[1] = `An unhandled error has occurred. The message returned was: ${error} `;
    }
  } finally {
    // SEND THE RESPONSE

    response.json(200, outputCollection);
  }
};
