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
    /*Script Name:   LibUserCreate
     Customer:      VisualVault
     Purpose:       The purpose of this NodeJS process will allow a user to be created with various potential options.  Those options will be turned on or off depending on what is passed to the NodeJS process.  
     Parameters: The following represent variables passed into the function from an array:
                User Id - String
                Site Name - String
                First Name - String
                Middle Initial - String
                Last Name - String
                Email Address - String
                Password - String (if blank, random password will be generated)
                Group List - String of groups seperated by commas
                Change Password - Boolean
                Send Email - Boolean
                Folder Path - String
                Folder Permissions - String
                SubjectField1 - String, subject of the username email
                SubjectField2 - String, subject of password info email
                BodyField1 - String, body of username email
                BodyField2 - String, body of password info email
     Psuedo code: 
        1. Validate if the character's passed in the User ID are valid and if valid run prelim search.
        2. Prelim search will then search for the user and site passed by user.
            a. If user already exists, process will end and notify user of the duplicate.
            b. If site already exists then it will save the SiteID pass that on.
            c. If site does not exists then it will create a site by running postSite
        3. If site already existed, then the groups passed in by the user will be searched within the site by getGroups
            a. If the site did not exist then the Site ID will be passed to the next function
        4. Validation will check if the groups passed in by the user exist on the site.
            a. If they dont then process will end and send the user an error message.
            b. If they do exist or if the user did not pass any groups in, user creation will start.
        5. During user validation passwords will be validated based on allowed characters and minimum length.
            a. Function will check the options on whether to force user to change password on first login
            b. It will also check whether to send an email on user creation and whether to send a custom email.
        6. After user creation runs, the user will be added to the correct groups.
        7. Custom emails will then be sent if that option was chosen.
        8. If user has entered a folder path, then the system will search for the folder and create a new folder if it does not already exist.
        9. The system will then take the security permissions that the user has entered and will add that security permission for the user on that folder.
     
     Date of Dev:   12/4/2018
     Last Rev Date: 12/05/2019

     Revision Notes:
     12/04/2018 - Alex Rhee: Initial creation of the business process.
     12/18/2018 - Alex Rhee: Code reorganized and rewritten to follow promise chaining examples. Still missing folder provisioning.
     12/20/2018 - Alex Rhee: Script is now fully functional and adding folder securities works. Need to now clean up code and test further.
     01/02/2019 - Alex Rhee: Script has been cleaned up, commented, bug tested.
     01/18/2019 - Alex Rhee: Made sure all API calls are being measured by Resp.meta.status === 200.
     12/05/2019 - Kendra Austin: Add hyphen (-) to list of allowed characters in user ID.
     */

    logger.info('Start of the process UserCreate at ' + Date());

    var Q = require('q');


    //---------------CONFIG OPTIONS---------------

    //The following section contains password configuration variables.
    var PasswordLength = 8;

    //Minimum length for password
    var minPasswordLength = 5;

    //Possible characters for password
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

    //Possible characters for User ID
    var possibleChar = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.@+-";

    //Force the user to input security permissions when passing in folder paths, if set to true an error will be sent back if the user passes in a folder but no folder security or an invalid folder security
    var forceSecurities = true;

    //Send custom email toggle, if set to true, the script will send a custom email to the user when they create their account regardless of the email options they choose
    var SysCustomEmail = true;

    //Must change password, system mandated. When set to true the user will be forced to change their password on first login. Change to false to let user decide whether to change password on first login.
    var SysChangePass = true;

    //------------------END OPTIONS----------------

    //Script Variables
    var outputCollection = [];          //Variable used to return information back to the client.  
    var groupData = {};                 //Variable to hold group search data
    var groupIdArray = [];              //Array to hold the ID's of the groups passed in the group list
    var SiteInfo = '';                  //Site ID holder
    var newUserObj = {};                //New user object
    var folderExists;                   //Variable to determine if folder exists
    var folderId = '';                  //Variable to hold folder ID
    var returnObj = {};                 //Initialization of the return object
    var memberType = "User";            //Member type variable
    var secLvl = '';                    //Variable to hold security level
    var userSecurityID = '';            //Variable to hold userID for folder security
    var groupValidation;                //Variable that holds the group validation results.
    var errorArray = [];                //Array to hold error messages
    var noGroupsPassed = false;         //Boolean that determines whether groups were passed in by user or not
    var userPassword = '';              //Generate password variable
    var newSiteCreated = false;         //Boolean that determines whether postSite() was called

    //Form Field variables
    //Create variables for the values the user inputs when creating their User
    var NewUsrID = ffCollection.getFormFieldByName('User Id');
    var NewSiteName = ffCollection.getFormFieldByName('Site Name');
    var NewFirstName = ffCollection.getFormFieldByName('First Name');
    var NewMiddleInitial = ffCollection.getFormFieldByName('Middle Initial');
    var NewLastName = ffCollection.getFormFieldByName('Last Name');
    var NewEmail = ffCollection.getFormFieldByName('Email Address');
    var NewPwd = ffCollection.getFormFieldByName('Password');
    var groupList = ffCollection.getFormFieldByName('Group List');

    //Admin options for User Creation
    var changePassword = ffCollection.getFormFieldByName('Change Password');
    var sendEmail = ffCollection.getFormFieldByName('Send Email');
    var folderPath = ffCollection.getFormFieldByName('Folder Path');
    var securityLevel = ffCollection.getFormFieldByName('Folder Permissions');

    //Email information coming from client side or intermediary node script
    var SubjectField1 = ffCollection.getFormFieldByName('SubjectField1');
    var BodyField1 = ffCollection.getFormFieldByName('BodyField1');
    var SubjectField2 = ffCollection.getFormFieldByName('SubjectField2');
    var BodyField2 = ffCollection.getFormFieldByName('BodyField2');

    //Functions
    //The following is a function to randomly generate passwords.
    var RandomPassword = function () {
        var text = "";

        for (var i = 0; i < PasswordLength; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    };

    //Array to hold all the group names that the user has input.
    var groupArrayUntrimmed = groupList.value.split(",");
    //Trim any extra spaces into a new group array
    var groupArrayTrimmer = function () {
        arrayHolder = [];
        for (i = 0; i < groupArrayUntrimmed.length; i++) {
            arrayHolder.push(groupArrayUntrimmed[i].trim());
        }
        return arrayHolder;
    }
    //Variable to hold the new trimmed array
    var groupArray = groupArrayTrimmer();

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

    //Determine whether or not the user passed in groups or not
    if ((groupArray[0] == '' || groupArray[0] == ' ') || groupArray.length < 1) {
        noGroupsPassed = true;
    }

    //Promise for searching user
    var searchUser = function () {
        //Set up query for the getUser() API call
        var currentUserdata = {};
        currentUserdata.q = "[name] eq '" + NewUsrID.value + "'";
        currentUserdata.fields = "id,name,userid,siteid,firstname,lastname,emailaddress";

        return vvClient.users.getUser(currentUserdata);
    }

    //Promise for searching site
    var searchSite = function () {
        //Set up query for the getSite() API call
        var currentUserSitedata = {};
        currentUserSitedata.q = "name eq '" + NewSiteName.value + "'";
        currentUserSitedata.fields = "id,name";

        return vvClient.sites.getSites(currentUserSitedata);
    }


    //Combined promise that holds both searchSite() and searchUser() promises
    var prelimSearch = Promise.all([searchSite(), searchUser()]);

    //User ID character validation function
    userCharacterValidation = function () {
        //Set up variable for User ID character validation
        var newID = NewUsrID.value
        //Run character validation on the User ID input
        for (i = 0; i < newID.length; i++) {

            //If statement that handles when an invalid character is input
            if (possibleChar.indexOf(newID[i]) < 0) {
                errorArray.push("Error: '" + newID[i] + "' is an invalid character for User ID. Please only use . _ @, letters, or numbers");
            }
        }
    }

    //User password validation function
    passwordValidation = function () {
        var newPassword = NewPwd.value
        //Check if pwd is too short
        if (newPassword.length > 1 && newPassword.length < minPasswordLength) {
            errorArray.push("Password must be at least " + minPasswordLength + " characters.")
        }
        //Check if the password characters are valid
        if (newPassword.length >= minPasswordLength) {
            for (i = 0; i < newPassword.length; i++) {

                //If statement that handles when an invalid character is input
                if (possible.indexOf(newPassword[i]) < 0) {
                    errorArray.push("Error: '" + newPassword[i] + "' is an invalid character for passwords.");
                }
            }
        }
    }

    folderSecurityValidation = function () {
        if (forceSecurities == true && (folderPath.value != '' && folderPath.value != ' ')) {
            secLvl = securityLevel.value.toLowerCase();

            //The passed in security level must match one of these three options or an error message will be passed
            switch (secLvl) {
                case "viewer":
                    secLvl = "Viewer";
                    break;
                case "editor":
                    secLvl = "Editor";
                    break;
                case "owner":
                    secLvl = "Owner";
                    break;
                default:
                    errorArray.push("Invalid security level '" + securityLevel.value + "' was supplied.");
            }
        }
    }

    prelimSearch
        .then(
            function (promises) {
                //Run Validations
                userCharacterValidation();
                passwordValidation();
                folderSecurityValidation();

                //Variable that holds the search site results
                var promiseSite = promises[0];
                //Variable that holds the search user results
                var promiseUser = promises[1];
                //Variable that holds the parsed site data
                var siteData = JSON.parse(promiseSite);
                //Variable that holds the parsed user data
                var userData = JSON.parse(promiseUser);
                // Set up empty string variable to hold the SiteGUID
                var testSiteID = "";

                //Test for any errors in validation
                if (errorArray.length > 0) {
                    throw new Error(errorArray);
                }

                //Test to see if the user exists or needs to be created
                if (typeof (userData.data[0]) == 'undefined') {
                }
                else {
                    logger.info('Duplicate user found for ID: ' + NewUsrID.value + '.');
                    throw new Error('Error: A duplicate user found for ID: ' + NewUsrID.value + '.')
                }

                // Test to see if the site exists or needs to be created
                if (siteData.meta.status == '200') {

                    if (siteData.data.length == 0) {
                        logger.info('Site Not found for ' + NewSiteName.value);

                        //Params object for post site
                        var siteParams = {};
                        siteParams.q = '';
                        siteParams.fields = 'id,name,description,sitetype';

                        //Object to hold new site data
                        var newSiteData = {};
                        newSiteData.name = NewSiteName.value;
                        newSiteData.description = NewSiteName.value;

                        newSiteCreated = true;

                        //If no groups passed in then create the new site. If groups found send error message
                        return vvClient.sites.postSites(siteParams, newSiteData)
                    }
                    else {
                        if (siteData.data[0].name == NewSiteName.value) {
                            logger.info('Site found for ' + NewSiteName.value);
                            testSiteID = siteData.data[0].id;

                            return testSiteID;
                        }
                        else {
                            throw new Error('There was an error when retrieving site data.')
                        }
                    }
                }
                else {
                    throw new Error('Attemp to retrieve site data encountered an error.')
                }

            }
        )
        .then(
            function (createSiteResp) {
                var createSiteData = createSiteResp;
                //Determine wheter the site was found or needed to be created and save the ID
                if (newSiteCreated == false) {
                    //Store the site ID
                    SiteInfo = createSiteData;
                }
                else {
                    if (createSiteData.meta.status == 200) {
                        if (createSiteData.data != undefined) {
                            //Store the site ID
                            SiteInfo = createSiteData.data.id;
                        }
                        else {
                            throw new Error('There was an error with retrieving new site data.');
                        }
                    }
                    else {
                        throw new Error('There was an error when creating a new site location.');
                    }
                }

                //Set up group params
                var groupParam = {};
                groupParam.q = "";
                groupParam.fields = 'id,name,description';

                getGroupsCalled = true;
                //Function to get groups from within the given site
                return vvClient.groups.getGroups(groupParam);
            }
        )
        .then(
            function (groupResp) {

                //Variable to hold the parsed group data
                groupData = JSON.parse(groupResp);

                //Test the getGroups response
                if (groupData.meta.status == 200) {

                    if (noGroupsPassed == false) {
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

                        if (groupData.data != undefined) {
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
                        }
                        else {
                            throw new Error('There was an error with the retrieved group data.')
                        }
                    }

                    //Move on to user creation if Groups were correctly passed in by user
                    if ((groupIdArray.length == groupArray.length) || noGroupsPassed == true) {

                        //Password length variable
                        var passLength = NewPwd.value;

                        //Determine whether a random password needs to be used or the user input password
                        if (passLength.length <= 1) {
                            userPassword = RandomPassword();
                        }
                        else if (passLength.length >= minPasswordLength) {
                            userPassword = NewPwd.value;
                        }
                        else {
                            logger.info("Password must be at least " + minPasswordLength + " characters.");
                            throw new Error('User could not be created. Password too short');
                        }

                        //Values for the new user object
                        newUserObj.userid = NewUsrID.value;
                        newUserObj.firstname = NewFirstName.value;
                        newUserObj.middleinitial = NewMiddleInitial.value;
                        newUserObj.lastname = NewLastName.value;
                        newUserObj.emailaddress = NewEmail.value;
                        newUserObj.password = userPassword;

                        //Logic to decide whether user must change password on first login. Based of user input.
                        if (SysChangePass == true) {
                            newUserObj.mustChangePassword = 'true';
                        }
                        else {
                            if (changePassword.value == "false") {
                                newUserObj.mustChangePassword = 'false';
                            }
                            else {
                                newUserObj.mustChangePassword = 'true';
                            }
                        }

                        //Logic to decide whether system will send an email to user when account created.
                        if (SysCustomEmail == true) {
                            newUserObj.sendEmail = 'false';
                        }
                        else {
                            if (sendEmail.value == 'false') {
                                newUserObj.sendEmail = 'false';
                            }
                            else {
                                newUserObj.sendEmail = 'true';
                            }
                        }

                        //Empty param object for postUsers()
                        var userparm = {};

                        return vvClient.users.postUsers(userparm, newUserObj, SiteInfo)
                    }
                    else if (groupValidation == false) {
                        logger.info("One ore more of the groups provided was not found.");
                        throw new Error('One ore more of the groups provided was not found.');
                    }
                    else {
                        logger.info("Didn't find a unique group for the provider site");
                        throw new Error('No unique group found for provided site.');
                    }
                }
                else {
                    throw new Error('There was an error when trying to search for groups.')
                }
            })
        .then(function (createUserResp) {

            //Variable to hold the post user response object
            var createUserData = createUserResp;

            if (createUserData.meta.status == '200' && noGroupsPassed == false) {
                logger.info("User " + NewUsrID.value + " was created.");

                if (createUserData.data != undefined) {
                    //Add the user ID for folder security
                    userSecurityID = createUserData.data.id;
                }
                else {
                    throw new Error('There was an error when creating a new user.')
                }

                //Params for add user to group
                var groupParams = {};

                var addGroupProcess = Q.resolve();

                groupIdArray.forEach(function (groupItem) {
                    addGroupProcess = addGroupProcess.then(function () {
                        return vvClient.groups.addUserToGroup(groupParams, groupItem, createUserData.data.id)
                            .then(
                                function (addResp) {
                                    var addData = JSON.parse(addResp);
                                    if (addData.meta.status != 201) {
                                        errorArray.push('Error adding user to group.');
                                    }
                                }
                            )
                    })
                })
                return addGroupProcess;
            }
            else if (noGroupsPassed == true) {
                return false;
            }
            else {
                logger.info("User creation for user " + NewUsrID.value + " had a problem.");
                throw new Error('User could not be created.')
            }
        })
        .then(function () {

            if (errorArray.length == 0) {
                //Sends custom email if set to true
                if (SysCustomEmail == true) {

                    var ToField = NewEmail.value;
                    var emailData = {};
                    emailData.recipients = ToField;
                    emailData.subject = SubjectField1.value;
                    emailData.body = BodyField1.value;
                    var emailParams = '';

                    return vvClient.email.postEmails(emailParams, emailData);
                }
                else {
                    return false;
                }
            }
            else {
                throw new Error('There was an error adding user to groups.')
            }
        })
        .then(function (resEmail) {

            //Sends custom email if set to true
            if (SysCustomEmail == true) {
                if (resEmail.meta.status == '201' && resEmail.data.success == true) {

                    var ToField = NewEmail.value;
                    var emailData = {};
                    emailData.recipients = ToField;
                    emailData.subject = SubjectField2.value;
                    emailData.body = BodyField2.value + ': ' + userPassword;
                    var emailParams = '';

                    return vvClient.email.postEmails(emailParams, emailData);
                }
                else {
                    logger.info('Email not sent')
                }
            }
            else {
                return false;
            }
        })
        .then(
            function (respEmail) {
                var emailResultData = respEmail;
                //Determine whether the email was sent or if there was an error with sending the email
                if (respEmail != false && (emailResultData.meta.status == '201' && emailResultData.data.success == true)) {
                    logger.info("Email sent")
                }
                else {
                    throw new Error("Email not sent");
                }

                //If a folder path was input then we move on to call getFolders()
                if (!folderPath.value || folderPath.value == ' ') {
                    return false;
                }
                else {
                    //Determine if a folder exists in the destination location, to prevent duplication
                    newFolderPath = folderPath.value;

                    logger.info("Finding folder: " + newFolderPath);

                    var FolderParams = {};
                    FolderParams.folderPath = newFolderPath;
                    return vvClient.library.getFolders(FolderParams)
                }
            }
        )
        .then(
            function (folderPromises) {
                //If getFolders was not called the code continues
                if (folderPromises == false) {
                    return false;
                }
                //If getFolders was called we determine whether the call was successful and set variables and determine whether we need to create folders
                else {

                    var promiseFolder = JSON.parse(folderPromises);
                    if (promiseFolder.meta.status === 200) {
                        if (promiseFolder.data) {
                            folderExists = true;
                            folderId = promiseFolder.data.id;
                        }
                        else {
                            throw new Error("User created but call to get folder returned with a successful status code, but no data.")
                        }
                    }
                    else if (promiseFolder.meta.status === 403) {
                        //console.log("User created but call to get folder returned with a 403. Assuming the folder does not exist.");
                    }
                    else {
                        throw new Error("User created but call to get folder returned with an unsuccessful status code.")
                    }
                }
            }
        )
        .then(
            function (folderResponse) {
                //Script skips if there is no need for folder logic
                if (folderResponse == false) {
                    //console.log("No folder input 3.")
                    return false;
                }
                else {
                    //When the folder that was input does not exist we create the folder
                    if (!folderExists) {
                        folderdata = {};
                        return vvClient.library.postFolderByPath(null, folderdata, newFolderPath)
                            .then(
                                function (createFolderResp) {
                                    if (createFolderResp.meta.status === 200) {
                                        folderId = createFolderResp.data.id;
                                    }
                                    else {
                                        returnObj.status = "Error creating folder";
                                        throw new Error("User was created but call to create folder returned with an error.")
                                    }
                                }
                            )
                    }
                    else {
                        return;
                    }
                }
            }
        )
        .then(
            function (folderRes) {
                //Script skips over once again if not folder was input
                if (folderRes == false) {
                    return false;
                }
                else {
                    //Determine whether a security permission was passed
                    if (!securityLevel.value || securityLevel.value == ' ') {
                        outputCollection[0] = 'Success';
                        outputCollection[1] = 'User created and added to group.';
                        outputCollection[2] = userSecurityID;
                        outputCollection[3] = SiteInfo;
                        outputCollection[4] = folderId;
                        response.json(200, outputCollection);
                    }
                    //If a security was passed we assign the user with that secuirty
                    else {

                        if (forceSecurities == false) {
                            secLvl = securityLevel.value.toLowerCase();

                            //The passed in security level must match one of these three options or an error message will be passed
                            switch (secLvl) {
                                case "viewer":
                                    secLvl = "Viewer";
                                    break;
                                case "editor":
                                    secLvl = "Editor";
                                    break;
                                case "owner":
                                    secLvl = "Owner";
                                    break;
                                default:
                                    //This should never be hit since the values are validated in the beginning of the function, but here just in case
                                    throw new Error("An invalid security level '" + securityLevel.value + "' was supplied.");
                            }
                        }

                        var memType = memberType;
                        memType = vvClient.constants.securityMemberType[memType];
                        var role = vvClient.constants.securityRoles[secLvl]
                        var cascadeChanges = true;

                        return vvClient.library.putFolderSecurityMember(folderId, userSecurityID, memType, role, cascadeChanges)
                    }
                }
            }
        )
        .then(
            function (folderSecurityRes) {
                //Successful user creation response if user was created without any folders passed
                if (folderSecurityRes == false) {
                    outputCollection[0] = 'Success';
                    outputCollection[1] = 'User created and added to group.';
                    outputCollection[2] = userSecurityID;
                    outputCollection[3] = SiteInfo;
                    outputCollection[4] = "No folder input";
                    response.json(200, outputCollection);
                }
                else {
                    if (folderSecurityRes.meta == undefined) {
                        throw new Error("User was created successfully but there was an error with adding folder securities: " + folderSecurityRes.message)
                    }
                    else {
                        //Successful user creation response is folders were passed.
                        if (folderSecurityRes.meta.status === 200) {
                            addedAssignments = true;
                            outputCollection[0] = 'Success';
                            outputCollection[1] = 'User created added to group and folder.';
                            outputCollection[2] = userSecurityID;
                            outputCollection[3] = SiteInfo;
                            outputCollection[4] = folderId;
                            response.json(200, outputCollection);
                            return true;
                        } else {
                            //console.log("Call to add folder security member returned with an unsuccessful status code.");
                            hasAssignmentError = true;
                        }
                    }
                }
            }
        )
        .catch(function (exception) {
            //Error catching, will send the user the error message
            logger.info(exception);
            outputCollection[0] = 'Error';
            outputCollection.push('The following error was encountered when creating a user ' + exception);
            response.json(200, outputCollection);
            return false;
        })
}
