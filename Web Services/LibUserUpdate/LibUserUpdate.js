var logger = require('../log');
var Q = require('q');

module.exports.getCredentials = function () {
    var options = {};
    options.customerAlias = "CUSTOMERALIAS";
    options.databaseAlias = "DATABASEALIAS";
    options.userId = "USERID";
    options.password = "PASSWORD";
    options.clientId = 'DEVELOPERKEY';
    options.clientSecret = 'DEVELOPERSECRET';
    return options;
};

module.exports.main = function (ffCollection, vvClient, response) {
    /*Script Name:  LibUserUpdate
     Customer:      Visual Vault
     Purpose:       The purpose of this NodeJS process will allow a user to be updated with various potential options.  Those options will be turned on or off depending on what is passed to the NodeJS process.
                    NOTE: The username of a user cannot be changed with this script. It must be updated manually in the Control Panel.
                          Passwords cannot be changed with this script. Code is commented out in previous versions of this script on GitHub; to be used when the API is updated. 
                          User sites cannot be changed with this script.

                    IMPORTANT CONFIGURATION NOTE: A query must be configured in Default queries (NOT in form data queries) that reflects the below:
                        SELECT UsUserID, UsId, UsFirstName, UsMiddleInit, UsLastName, UsEmailAddress, UsSiteID, UsEnabled
                        FROM dbo.Users

     Parameters: The following represent variables passed into the function:
                    Action - (string, Required) 'Update', 'Disable', or 'Enable' This parameter will control which actions this script takes.
                    User ID - (string, Required) This is the user name of the user.
                    First Name - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                    Middle Initial - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                    Last Name - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                    Email Address - (string, not Required) When provided, this information will be updated in the user profile. Not updated when Action = 'Disable'
                    Group List - (string, not Required) String of group names separated by commas. The user will be assigned to these groups.
                    Remove Group List - (string, not Required) String of group names separated by commas. The user will be removed from these groups.
         
     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                Any item in the array at points 2 or above can be used to return multiple items of information.
                0 - Status: Success, Error
		        1 - Message
                2 - User GUID

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
     Date of Dev:   12/4/2018
     Last Rev Date: 01/08/2020

     Revision Notes:
     12/20/2018 - Alex Rhee: Initial creation of the business process.
     1/3/19 - Alex Rhee: Process created and working. Passwords cannot be changed at this time.
     1/18/19 - Alex Rhee: Made sure all API calls are being measured by Resp.meta.status === 200
     12/10/2019 - Kendra Austin: Update to include user enable & disable; update header; bug fixes.
     01/08/2020 - Kendra Austin: Update to run a custom query to find the user rather than getUsers. This precludes the need for the user GUID parameter.
     */

    logger.info('Start of the process LibUserUpdate at ' + Date());

    //---------------CONFIG OPTIONS---------------
    var userQueryName = 'User Lookup';         //The name of the custom query in Default queries (NOT in form data queries)

    //------------------END OPTIONS----------------

    //Parameter Variables
    var action = ffCollection.getFormFieldByName('Action');
    var userID = ffCollection.getFormFieldByName('User ID');
    var NewFirstName = ffCollection.getFormFieldByName('First Name');
    var NewLastName = ffCollection.getFormFieldByName('Last Name');
    var NewMiddleInitial = ffCollection.getFormFieldByName('Middle Initial');
    var NewEmail = ffCollection.getFormFieldByName('Email Address');
    var groupList = ffCollection.getFormFieldByName('Group List');
    var removeGroupList = ffCollection.getFormFieldByName('Remove Group List');

    //Script Variables
    var returnObj = [];                                                 //Variable used to return information back to the client
    var errorArray = [];                                                //Array to hold error messages
    var userGUID = '';                                                  //Variable to hold the user GUID when it is found.
    var siteID = '';                                                    //Variable to hold site GUID
    var currentFirstName = '';                                          //Variable to hold the current user profile info; to compare with new info and determine if update needed
    var currentLastName = '';                                           //Variable to hold the current user profile info; to compare with new info and determine if update needed
    var currentMiddleInitial = '';                                      //Variable to hold the current user profile info; to compare with new info and determine if update needed
    var currentEmailAddress = '';                                       //Variable to hold the current user profile info; to compare with new info and determine if update needed
    var groupOption = false;                                            //Variable for determining whether user wants to add groups
    var removeGroupOption = false;                                      //Variable for determining whether user wants to remove groups
    var currentGroups = [];                                             //Variable to hold current site groups

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {

        //Validate passed in fields
        if (!action || !action.value) {     //Action is always required
            errorArray.push("The Action parameter was not supplied.")
        }
        else if (action.value != 'Enable' && action.value != 'Update' && action.value != 'Disable') {
            errorArray.push("The Action parameter must be Enable, Disable, or Update.");
        }
        else {
            action = action.value;
        }

        if (!userID || !userID.value) {     //User ID (username) is always required.
            errorArray.push("The User ID parameter was not supplied.")
        }
        else {
            userID = userID.value;
        }

        //Return all validation errors at once.
        if (errorArray.length > 0) {
            throw new Error(errorArray);
        }
    })
        .then(function () {
            //First, run the custom query to get the userGUID and other user information. This will be needed later. See comment header for fields.

            //Query on the user ID
            var userQueryParams = { filter: "[UsUserID] = '" + userID + "'" }

            return vvClient.customQuery.getCustomQueryResultsByName(userQueryName, userQueryParams).then(function (userRes) {
                var userData = JSON.parse(userRes);
                if (userData.meta.status == 200) {
                    if (userData.data.length == 1) {
                        //Exactly one user found. Save all user info for later use. 
                        var userInfo = userData.data[0];
                        userGUID = userInfo.usId;
                        siteID = userInfo.usSiteID;
                        currentFirstName = userInfo.usFirstName;
                        currentLastName = userInfo.usLastName;
                        currentMiddleInitial = userInfo.usMiddleInit;
                        currentEmailAddress = userInfo.usEmailAddress;
                    }
                    else if (userData.data.length == 0) {
                        //No user found. Throw error.
                        throw new Error('User not found with user ID: ' + userID + '.')
                    }
                    else {
                        //Many users found. Invalid state. 
                        throw new Error('More than one user was found for ID: ' + userID + '. This is an invalid state. Please notify a system administrator.');
                    }
                }
                else if (userData.meta.status == 404) {
                    throw new Error('The custom query to find users was not found. Please ensure that a query named ' + userQueryName + ' has been configured in the default queries area.');
                }
                else {
                    throw new Error('There was an error when searching for the user ' + userID + '.');
                }
            })
        })
        .then(function () {
            //If enable is needed, do that first. This allows us to update the user if needed. 
            if (action == 'Enable') {
                var userEnableObj = {};
                userEnableObj.enabled = 'true';

                return vvClient.users.putUsersEndpoint({}, userEnableObj, userGUID).then(function (enableResp) {
                    //Measure the response & send a response to the client
                    if (enableResp.meta.status == 200) {
                        logger.info('User enabled successfully. User ID ' + userID + '.');
                    }
                    else {
                        throw new Error('Attempt to enable the user account encountered an error.')         //TODO: Add status message?
                    }
                });
            }
        })
        .then(function () {
            //Disable the user account if needed. Immediately return a reponse; no further actions taken.
            if (action == 'Disable') {
                var userDisableObj = {};
                userDisableObj.enabled = 'false';

                return vvClient.users.putUsersEndpoint({}, userDisableObj, userGUID).then(function (disableResp) {
                    //Measure the response & send a response to the client
                    if (disableResp.meta.status == 200) {
                        returnObj[0] = 'Success';
                        returnObj[1] = 'User account disabled.';
                        returnObj[2] = userGUID;
                        return response.json(returnObj);
                    }
                    else {
                        throw new Error('Attempt to disable the user account encountered an error.')        //TODO: Add status message?
                    }
                });
            }
        })
        .then(function () {
            //Determine what information the user wants to change and load that info into an update object
            var userUpdateObj = {};

            if (NewFirstName) {
                if (NewFirstName.value && NewFirstName.value != '' && NewFirstName.value != currentFirstName) {
                    userUpdateObj.firstname = NewFirstName.value;
                }
            }

            if (NewLastName) {
                if (NewLastName.value && NewLastName.value != '' && NewLastName.value != currentLastName) {
                    userUpdateObj.lastname = NewLastName.value;
                }
            }

            if (NewMiddleInitial) {
                if (NewMiddleInitial.value && NewMiddleInitial.value != '' && NewMiddleInitial.value != currentMiddleInitial) {
                    userUpdateObj.middleinitial = NewMiddleInitial.value;
                }
            }

            //Check if anything needs to be updated
            if (userUpdateObj.firstname || userUpdateObj.lastname || userUpdateObj.middleinitial) {
                //if update needed, send the user update object through putUsers to update the user information
                return vvClient.users.putUsers({}, userUpdateObj, siteID, userGUID).then(function (updateResp) {
                    if (updateResp.meta.status == 200) {
                        logger.info('User updated successfully. User ID ' + userID + '.');
                    }
                    else {
                        throw new Error('Attempt to update the user account encountered an error.')         //TODO: Add status message?
                    }
                });
            }
        })
        .then(function () {
            //Determine if the email address needs to be changed. If so, load that info into a new email object.
            var emailUpdateObj = {};    //New user data object for updating emails specifically

            if (NewEmail) {
                if (NewEmail.value && NewEmail.value != '' && NewEmail.value != currentEmailAddress) {
                    emailUpdateObj.emailaddress = NewEmail.value;
                }
            }

            //Check if the email address needs to be updated
            if (emailUpdateObj.emailaddress) {
                //if update needed, send the email update object through putUsersEndpoint to update the email information
                return vvClient.users.putUsersEndpoint({}, emailUpdateObj, userGUID).then(function (emailUpdateResp) {
                    if (emailUpdateResp.meta.status == 200) {
                        logger.info('User email address updated successfully. User ID ' + userID + '.');
                    }
                    else {
                        throw new Error('Attempt to update the user email address encountered an error.')         //TODO: Add status message?
                    }
                });
            }
        })
        .then(function () {
            //If Group List or Remove Group List were passed in as parameters, call getGroups to ensure they exist.
            if (groupList) {
                if (groupList.value && groupList.value != '' && groupList.value != ' ') {
                    groupList = groupList.value.split(",");
                    groupOption = true;
                }
            }

            if (removeGroupList) {
                if (removeGroupList.value && removeGroupList.value != '' && removeGroupList.value != ' ') {
                    removeGroupList = removeGroupList.value.split(",");
                    removeGroupOption = true;
                }
            }

            //Only get groups if something is going to be added or removed
            if (groupOption || removeGroupOption) {
                var groupParam = {};
                groupParam.q = "";
                groupParam.fields = 'id,name,description';

                //Function to get all current groups
                return vvClient.groups.getGroups(groupParam).then(function (groupResp) {
                    var groupData = JSON.parse(groupResp);
                    if (groupData.meta.status === 200) {
                        if (groupData.data.length > 0) {
                            //Push the group data into an array for processing
                            groupData.data.forEach(function (group) {
                                currentGroups.push(group);
                            });
                        }
                        else {
                            throw new Error('No groups were found to exist.');
                        }
                    }
                    else {
                        throw new Error('There was an error when searching for groups');            //TODO: Add status message?
                    }
                });
            }
        })
        .then(function () {
            //Add the groups in Group List.
            if (groupOption) {
                //For each item in groupList, trim it, then make sure it's mapped to a group in currentGroups. If it is, call addUserToGroup. 
                var addGroupProcess = Q.resolve();

                //Add the user to each of the groups in the groupIdArray
                groupList.forEach(function (addGroupItem) {
                    addGroupProcess = addGroupProcess.then(function () {
                        //Set groupData to blank and groupFound to false. 
                        var groupData = {};
                        var groupFound = false;

                        //Go through each current group and see if one of them is the group being added
                        currentGroups.forEach(function (currentGroup) {
                            if (currentGroup.name == addGroupItem.trim()) {
                                groupData = currentGroup;
                                groupFound = true;
                            }
                        });

                        //If the group wasn't found after looping through all current groups, log an error
                        if (!groupFound) {
                            errorArray.push('The group ' + addGroupItem.trim() + ' could not be added to the user profile because the group was not found.');
                        }
                        else {
                            //If the group was found, then add it to the user profile.
                            return vvClient.groups.addUserToGroup({}, groupData.id, userGUID).then(function (groupAddResp) {
                                var addGroupRespObj = JSON.parse(groupAddResp);
                                //201 is success; 400 means the user is already part of the group. Both are successful results.
                                if (addGroupRespObj.meta.status === 201 || addGroupRespObj.meta.status === 400) {
                                    logger.info('User added to group ' + groupData.name + ' successfully.');
                                }
                                else {
                                    logger.info('Call to add user to group ' + groupData.name + ' returned with an unsuccessful status code.');    //TODO: Add status message?
                                    errorArray.push('Call to add user to group ' + groupData.name + ' returned with an unsuccessful status code.');    //TODO: Add status message?
                                }
                            })
                        }
                    })
                });

                return addGroupProcess;
            }
        })
        .then(function () {
            //Remove the groups in Remove Group List.
            if (removeGroupOption) {
                //For each item in removeGroupList, trim it, then make sure it's mapped to a group in currentGroups. If it is, call removeUserFromGroup.
                var removeGroupProcess = Q.resolve();

                //Add the user to each of the groups in the groupIdArray
                removeGroupList.forEach(function (removeGroupItem) {
                    removeGroupProcess = removeGroupProcess.then(function () {
                        //Set groupData to blank and groupFound to false. 
                        var groupData = {};
                        var groupFound = false;

                        //Go through each current group and see if one of them is the group being added
                        currentGroups.forEach(function (currentGroup) {
                            if (currentGroup.name == removeGroupItem.trim()) {
                                groupData = currentGroup;
                                groupFound = true;
                            }
                        });

                        //If the group wasn't found after looping through all current groups, log an error
                        if (!groupFound) {
                            errorArray.push('The group ' + removeGroupItem.trim() + ' could not be removed from the user profile because the group was not found.');
                        }
                        else {
                            //If the group was found, then add it to the user profile.
                            return vvClient.groups.removeUserFromGroup({}, groupData.id, userGUID).then(function (groupRemoveResp) {
                                var removeGroupRespObj = JSON.parse(groupRemoveResp);
                                if (removeGroupRespObj.meta.status === 200) {
                                    logger.info('User removed from group ' + groupData.name + ' successfully.');
                                }
                                else {
                                    logger.info('Call to remove user from group ' + groupData.name + ' returned with an unsuccessful status code.');    //TODO: Add status message?
                                    errorArray.push('Call to remove user from group ' + groupData.name + ' returned with an unsuccessful status code.');    //TODO: Add status message?
                                }
                            })
                        }
                    })
                });

                return removeGroupProcess;
            }
        })
        .then(function () {
            if (errorArray.length > 0) {
                throw new Error('The user groups may not have been fully updated. ' + errorArray);
            }

            //If here, then everything was successful
            returnObj[0] = 'Success';
            returnObj[1] = 'User updated.';
            returnObj[2] = userGUID;
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
        });
}
