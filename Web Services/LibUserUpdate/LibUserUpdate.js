var logger = require('../log');

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
    /*Script Name:   LibUserUpdate
     Customer:      Visual Vault
     Purpose:       The purpose of this NodeJS process will allow a user to be updated with various potential options.  Those options will be turned on or off depending on what is passed to the NodeJS process.  
     Parameters: The following represent variables passed into the function:
                    User Id - String
                    Site Name - String
                    First Name - String
                    Last Name - String
                    Email Address - String
                    GroupList - String of groups seperated by commas
                    RemoveGroupList - String of groups seperated by commas
                    UserDisabled - Boolean

     Psuedo code: 
        1. Call getUser and see if the user ID exists and send back the user GUID if it exists
        2. Determine what information the user wants to change and load that info into a new user object.
        3. Send the new user object through putUsersEndpoint to update the user information
        4. Determine whether or not the users has passed groups in the group list or remove group list and if they have, call getGroups.
        5. Using the information sent back from getGroups() determine whether the groups passed by the user exist and then either add or remove those groups depending on what list they were in.

     Date of Dev:   12/4/2018
     Last Rev Date: 1/18/19
     Revision Notes:
     12/20/2018 - Alex Rhee: Initial creation of the business process.
     1/3/19 - Alex Rhee: Process created and working. Passwords cannot be changed at this time.
     1/18/19 - Alex Rhee: Made sure all API calls are being measured by Resp.meta.status === 200
     */

    logger.info('Start of the process UpdateUser at ' + Date());
    var Q = require('q');


    //---------------CONFIG OPTIONS---------------

    //The following section contains password configuration variables.
    var PasswordLength = 8;

    //Minimum length for password
    var minPasswordLength = 5;

    //Possible characters for password
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";


    //------------------END OPTIONS----------------


    //The following is a function to randomly generate passwords.
    var RandomPassword = function () {
        var text = "";

        for (var i = 0; i < PasswordLength; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };

    //Create variables for the values the user inputs when creating their User
    var NewUsrID = ffCollection.getFormFieldByName('User ID');
    // var NewSiteName = ffCollection.getFormFieldByName('Site Name');
    var NewFirstName = ffCollection.getFormFieldByName('First Name');
    var NewLastName = ffCollection.getFormFieldByName('Last Name');
    var NewMiddleInitial = ffCollection.getFormFieldByName('Middle Initial');
    var NewEmail = ffCollection.getFormFieldByName('Email Address');
    // var NewPwd = ffCollection.getFormFieldByName('Password');
    var groupList = ffCollection.getFormFieldByName('Group List');
    var removeGroupList = ffCollection.getFormFieldByName('Remove Group List');

    //Hard coded variables for user inputs
    var NewUserExpire = {};
    NewUserExpire.value = 'false';
    var NewPassExpire = {};
    NewPassExpire.value = 'false';

    // //Admin options for User Creation
    var userDisabled = ffCollection.getFormFieldByName('User Disabled')
    var userEnabled = ffCollection.getFormFieldByName('User Enabled')
    // var changePassword = ffCollection.getFormFieldByName('Change Password');
    // var resetPassword = ffCollection.getFormFieldByName('Reset Password');
    // var sendEmail = ffCollection.getFormFieldByName('Send Email');
    // var emailMessage = ffCollection.getFormFieldByName('Email Message');

    //Array to hold all the group names that the user has input.
    var groupArrayUntrimmed = groupList.value.split(",");
    var removeGroupArrayUntrimmed = removeGroupList.value.split(",");

    //Trim any extra spaces into a new group array
    var groupArrayTrimmer = function (groupArg) {
        arrayHolder = [];
        for (i = 0; i < groupArg.length; i++) {
            arrayHolder.push(groupArg[i].trim());
        }
        return arrayHolder;
    }
    //Variable to hold the new trimmed array
    var groupArray = groupArrayTrimmer(groupArrayUntrimmed);
    var removeGroupArray = groupArrayTrimmer(removeGroupArrayUntrimmed);

    //Function to extract all groups in the groups that exist
    var groupComparison = function (arr1, arr2) {
        var finalarray = [];
        arr1.forEach((e1) => arr2.forEach((e2) => {
            if (e1 === e2) {
                finalarray.push(e1)
            }
        }
        ));
        return finalarray;
    };

    //Function to validate that all the groups in the group list exist
    var groupValidator = function arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length)
            return false;
        for (var i = arr1.length; i--;) {
            if (arr1[i] !== arr2[i])
                return false;
        }
        return true;
    }

    var outputCollection = [];                                          //Variable used to return information back to the client.
    var emailHolder = NewEmail.value;                                   //Variable that holds user email
    var groupOption = false;                                            //Variable for determining whether user wants to add groups
    var removeGroupOption = false;                                      //Variable for determining whether user wants to remove groups
    var SiteInfo = '';                                                  //Variable to hold site GUID
    var groupIdArray = [];                                              //Array for group GUIDs
    var removeGroupIdArray = [];                                        //Array for remove group GUIDs
    var groupData = '';                                                 //Variable to hold parse group response data
    var userGUID = '';                                                  //Variable to hold userGUID
    var NusrData = {};                                                  //New user data object
    var NusrObj = {};                                                   //New user data object for updating emails specifically
    var NusrDisableObj = {};                                            //New user data object for disabling user specifically
    var usrParam = {};                                                  //Empty user param object
    var errorArray = [];                                                //Array to hold error messages
    var groupRespHolder;                                                //Variable to save the group response for removing groups
    var groupValidation = false;                                        //Variable that holds the group validation results.

    //Promise for searching user
    var searchUser = function () {
        //Set up query for the getUser() API call
        var currentUserdata = {};
        currentUserdata.q = "[name] eq '" + NewUsrID.value + "'";
        currentUserdata.fields = "id,name,userid,siteid,firstname,lastname,emailaddress";

        return vvClient.users.getUser(currentUserdata);
    }


    //Combined promise that holds both searchSite() and searchUser() promises
    var prelimSearch = Promise.all([searchUser()]);

    prelimSearch
        .then(
            function (promises) {

                //Variable that holds the search user results
                var promiseUser = promises[0];
                //Variable that holds the parsed user data
                var userData = JSON.parse(promiseUser);

                if (userData.meta.status == 200) {
                    //Test to see if the user exists or needs to be created
                    if (typeof (userData.data[0]) == 'undefined') {
                        logger.info('User not found for ID: ' + NewUsrID.value + '.');
                        throw new Error('Error: User not found for ID: ' + NewUsrID.value + '.')
                    }
                    else {
                        logger.info('User found for ID: ' + NewUsrID.value + '.');
                    }
                }
                else {
                    throw new Error('There was an error when searching for the user')
                }

                //Update site data
                SiteInfo = userData.data[0].siteid;
                //Update the user GUID
                userGUID = userData.data[0].id;

                //Make sure information should be updated or not. 

                // // Section commented out because username/userID cannot be changed throught he API at this time
                // if (NewUsrID.value != '') {
                //     NusrData.userid = NewUsrID.value;
                // }

                if (NewFirstName.value != '') {
                    NusrData.firstname = NewFirstName.value;
                }

                if (NewLastName.value != '') {
                    NusrData.lastname = NewLastName.value;
                }

                if (NewMiddleInitial.value != '') {
                    NusrData.middleinitial = NewMiddleInitial.value;
                }

                if (NewEmail.value != '') {
                    // NusrData.emailaddress = NewEmail.value;
                    NusrObj.emailaddress = NewEmail.value;
                    emailHolder = NewEmail.value;
                }
                else {
                    emailHolder = userData.data[0].emailaddress;
                }

                if (userDisabled.value != '') {
                    if (userDisabled.value == 'true') {
                        // NusrData.enabled = 'false';
                        NusrDisableObj.enabled = 'false';
                    }
                    else {
                        // NusrData.enabled = 'true';
                        NusrDisableObj.enabled = 'true';
                    }
                }

                // // Section commented until the API is able to update user passwords directly
                // if (changePassword.value == 'true') {
                //     if (NewPwd.value == ' ' || !NewPwd.value) {
                //         NusrData.password = RandomPassword();
                //     }
                //     else {
                //         if (NewPwd.value.length >= minPasswordLength) {
                //             NusrData.password = NewPwd.value;
                //         }
                //         else {
                //             throw new Error("New password must be more than " + minPasswordLength + " characters.")
                //         }
                //     }
                // }

                // if (resetPassword.value == 'true') {
                //     NusrData.mustChangePassword = 'true';
                // }

                return vvClient.users.putUsers(usrParam, NusrData, SiteInfo, userGUID);
            }
        )
        .then(
            //When an email value is input, this will make an API call to change the user email
            function (updateUserResp) {
                // //Measure the response of the putUsers call
                // if (updateUserResp.meta.status != 200) {
                //     throw new Error('There was an error when trying to update the user.')
                // }
                if (NewEmail.value != '') {
                    return vvClient.users.putUsersEndpoint(usrParam, NusrObj, userGUID);
                }
                else {
                    return;
                }

            }
        )
        .then(
            //When a user status is selected (disabled), an API call will be made to change the user status
            function (updateUserEmail) {
                // //Measure the response of the putUsersEndpoint call
                // if (updateUserEmail.meta.status != 200) {
                //     throw new Error('There was an error when trying to update the user.')
                // }
                if (userDisabled.value != '') {
                    return vvClient.users.putUsersEndpoint(usrParam, NusrDisableObj, userGUID);
                }
                else {
                    return;
                }

            }
        )
        .then(
            function (updateUserResp2) {
                // //Measure the response of the putUsersEndpoint call
                // if (updateUserResp2.meta.status != 200) {
                //     throw new Error('There was an error when trying to update the user.')
                // }
                //Determine whether or not any groups were passedin the groupList or removeGroupList for calling getGroups()
                if ((groupList.value == ' ' || !groupList.value) && (removeGroupList.value == ' ' || !removeGroupList.value)) {
                    return false;
                }
                else {
                    groupOption = true;
                    removeGroupOption = true;
                    //If groups are passed through by the user to be added groupOption becomes true
                    if (groupList.value == ' ' || !groupList.value) {
                        groupOption = false;
                    }
                    //If groups are passed through by the user to be removed removeGroupOption becomes true
                    if (removeGroupList.value == ' ' || !removeGroupList.value) {
                        removeGroupOption = false;
                    }

                    var groupParam = {};
                    groupParam.q = "";
                    groupParam.fields = 'id,name,description';

                    //Function to get groups from within the given site
                    return vvClient.groups.getGroups(groupParam);
                }
            }
        )
        .then(
            function (groupResp) {

                //Save the group resp for removing groups in the next then statement
                groupRespHolder = groupResp;

                //If groups were passed into the groupList determine if they exist on the site and then add the user to them
                if (groupResp != false && groupOption == true) {

                    //Variable to hold the parsed group data
                    groupData = JSON.parse(groupResp);

                    //Measure the getGroups call
                    if (groupData.meta.status == '200') {

                        //Create an array of group names from the results
                        var groupNameExtract = function () {
                            var groupNameExtractHolder = []
                            for (i = 0; i < groupData.data.length; i++) {
                                groupNameExtractHolder.push(groupData.data[i].name)
                            }
                            return groupNameExtractHolder;
                        }
                        //Variable to hold the extracted group names array
                        var groupDataArray = groupNameExtract();
                        //Variable that calls the group comparison function and holds the results
                        var groupComparisonResults = groupComparison(groupArray, groupDataArray);
                        //Variable that calls the group validator function and holds the results. Will be true if all groups passed in the group list exist.
                        groupValidation = groupValidator(groupArray, groupComparisonResults);

                        //Function to extract the ID's of passed groups into an array
                        for (i = 0; i < groupData.data.length; i++) {
                            if (groupArray.length == 1) {
                                if (groupArray[0] == groupData.data[i].name) {
                                    groupIdArray.push(groupData.data[i].id)
                                }
                            }
                            else {
                                for (j = 0; j < groupArray.length; j++) {
                                    if (groupArray[j] == groupData.data[i].name) {
                                        groupIdArray.push(groupData.data[i].id)
                                    }
                                }
                            }
                        }

                        if (groupValidation == true) {
                            GroupID = groupData.data[0].id;

                            //Params for add user to group
                            var groupParams = {};

                            var addGroupProcess = Q.resolve();

                            //Add the user to each of the groups in the groupIdArray
                            groupIdArray.forEach(function (groupItem) {
                                addGroupProcess = addGroupProcess.then(function () {
                                    return vvClient.groups.addUserToGroup(groupParams, groupItem, userGUID);
                                })
                            })

                            return addGroupProcess;
                        }
                        else if (groupValidation == false) {
                            logger.info('There was an error when adding the user to a group. User may have already been part of the group.');
                            errorArray.push('There was an error when adding the user to a group. User may have already been part of the group.');
                        }
                    }
                    else {
                        logger.info('There was an error when searching for groups.');
                        errorArray.push('There was an error when searching for groups.');
                    }
                }
                else {
                    return;
                }
                //If no groups were passed through
                if (groupResp == false) {
                    return;
                }

                //Check if there are any errors
                if (errorArray.length > 0) {
                    throw new Error(errorArray);
                }

            })
        .then(
            function () {

                //If groups were passed into the removeGroupOption, determine if they exist and remove the user from those groups
                if (groupRespHolder != false && removeGroupOption == true) {

                    //Variable to hold the parsed group data
                    groupData = JSON.parse(groupRespHolder);

                    //Measure the getGroups call
                    if (groupData.meta.status == '200') {

                        //Create an array of group names from the results
                        var groupNameExtract = function () {
                            var groupNameExtractHolder = []
                            for (i = 0; i < groupData.data.length; i++) {
                                groupNameExtractHolder.push(groupData.data[i].name)
                            }
                            return groupNameExtractHolder;
                        }
                        //Variable to hold the extracted group names array
                        var groupDataArray = groupNameExtract();
                        //Variable that calls the group comparison function and holds the results
                        var groupComparisonResults = groupComparison(removeGroupArray, groupDataArray);
                        //Variable that calls the group validator function and holds the results. Will be true if all groups passed in the group list exist.
                        groupValidation = groupValidator(removeGroupArray, groupComparisonResults);

                        //Function to extract the ID's of passed groups into an array
                        for (i = 0; i < groupData.data.length; i++) {
                            if (removeGroupArray.length == 1) {
                                if (removeGroupArray[0] == groupData.data[i].name) {
                                    removeGroupIdArray.push(groupData.data[i].id)
                                }
                            }
                            else {
                                for (j = 0; j < removeGroupArray.length; j++) {
                                    if (removeGroupArray[j] == groupData.data[i].name) {
                                        removeGroupIdArray.push(groupData.data[i].id)
                                    }
                                }
                            }
                        }

                        if (groupValidation == true) {
                            GroupID = groupData.data[0].id;

                            //Params for add user to group
                            var groupParams = {};

                            var removeGroupProcess = Q.resolve();

                            removeGroupIdArray.forEach(function (groupItem) {
                                removeGroupProcess = removeGroupProcess.then(function () {
                                    return vvClient.groups.removeUserFromGroup(groupParams, groupItem, userGUID);
                                })
                            })

                            return removeGroupProcess;
                        }
                        else if (groupValidation == false) {
                            logger.info('There was an error removing the user from a group.');
                            errorArray.push('There was an error removing the user from a group.');
                        }
                    }
                    else {
                        logger.info("Didn't find a unique group for the provider site");
                        errorArray.push('No unique group found.');
                    }
                }
                else {
                    return;
                }
                //If no groups were passed through
                if (groupRespHolder == false) {
                    return;
                }

                //Check if there are any errors
                if (errorArray.length > 0) {
                    throw new Error(errorArray);
                }

            })
        // //Email logic commented out until user passwords can be updated directly through the API
        // .then(
        //     function () {
        //         //send and email with the username
        //         if (changePassword.value == 'true') {

        //                 var ToField = emailHolder;
        //                 //Set the subject and body of the email below
        //                 var SubjectField = 'Your account has been updated.';
        //                 var BodyField = "User account " + NewUsrID.value + " has been updated.";
        //                 //Load the object used in the function call. 
        //                 var emailData = {};
        //                 emailData.recipients = ToField;
        //                 emailData.subject = SubjectField;
        //                 emailData.body = BodyField;
        //                 var emailParams = '';

        //                 return vvClient.email.postEmails(emailParams, emailData);
        //         }
        //     }
        // )
        //         .then(
        //     function () {
        //         //send an email with the password token
        //         if (changePassword.value == 'true') {

        //                 var ToField = emailHolder;
        //                 //Set the subject and body of the email below
        //                 var SubjectField = 'Your account has been updated.';
        //                 var BodyField = "New password: [" + NusrData.password + "]";
        //                 //Load the object used in the function call. 
        //                 var emailData = {};
        //                 emailData.recipients = ToField;
        //                 emailData.subject = SubjectField;
        //                 emailData.body = BodyField;
        //                 var emailParams = '';

        //                 return vvClient.email.postEmails(emailParams, emailData);
        //         }
        //     }
        // )
        .then(
            function () {
                outputCollection[0] = 'Success';
                outputCollection[1] = 'User updated.';
                outputCollection[2] = userGUID;
                response.json(200, outputCollection);
            }
        )
        .catch(function (exception) {
            logger.info(exception);
            outputCollection[0] = 'Error';
            outputCollection.push('The following error was encountered when creating a user ' + exception);
            response.json(200, outputCollection);
            return false;
        })

}
