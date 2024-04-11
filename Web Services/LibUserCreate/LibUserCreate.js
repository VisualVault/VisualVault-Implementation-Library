const logger = require('../log');
const momentTz = require('moment-timezone');
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
        Script Name:    LibUserCreate
        Customer:       Visual Vault
        Purpose:        This process will allow a user to be created with various potential options.
                        Those options will be turned on or off depending on what is passed to the NodeJS process.
                        NOTE: If the user is found to exist already, whether enabled or disabled, this script will simply return that info. No other actions will be taken. 
        Pre-conditions: A query must be configured in Default queries (NOT in form data queries) that reflects the below:
                        SELECT UsUserID, UsId, UsFirstName, UsMiddleInit, UsLastName, UsEmailAddress, UsSiteID, UsEnabled
                        FROM dbo.Users
        Parameters: The following represent variables passed into the function from an array:
                        User Id - (String, Required)
                        Email Address - (String, Required)
                        Site Name - (String, Required)
                        Group List - (String, Required) String of groups separated by commas. May be an empty string if no groups are desired.
                        First Name - (String, Optional)
                        Middle Initial - (String, Optional)
                        Last Name - (String, Optional)
                        Password - (String, Optional) If blank or not passed in, random password will be generated
                        Folder Path - (String, Optional) If blank or not passed in, a folder will not be created.
                        Folder Permissions - (String, Optional unless folder path was provided and config variable forceSecurities set to true.) Pass in 'Viewer', 'Editor', or 'Owner'
                            IMPORTANT NOTE: This feature should not be used without discussion. Assigning user-based security to folders can cause performance issues. 
                            'Viewer' - The created user account will be assigned viewer permissions to the created folder
                            'Editor' - The created user account will be assigned editor permissions to the created folder
                            'Owner' - The created user account will be assigned owner permissions to the created folder
                        Send Email - (String, Required) Pass in 'Standard', 'Custom', or 'Both'.
                            'Standard' will send only the VV-generated username and password email.
                            'Custom' allows Email Subject and Email Body to be passed in.
                            'Both' will send both the VV-generated email and the custom email passed in.
                        Email Subject - (String, Required when Send Email is Custom or Both) Subject of the username and password email
                        Email Body - (String, Required when Send Email is Custom or Both) Body of username and password email.
                            When Send Email is 'Custom', [Username] and [Password] must be included in the email body.
                        Related Records - (Array of Strings, optional) The Form IDs of any records that the Communication Log should be related to.
                        Other Fields - (Object, optional) This is an object of other field names with field values to update on the Communications Log.
                        Example format:
                        {
                            name: 'Other Fields', value: {
                                "Individual ID": indivId,
                                "Record ID": formId
                            }
                        }
        Return Array:   The following represents the array of information returned to the calling function.  This is a standardized response.
                        Any item in the array at points 2 or above can be used to return multiple items of information.
                        0 - Status: Success, Minor Error, Error
                            //Minor Error represents any errors that occurred after the user account was created.
                            //If updating form record fields to reflect an "account created" status, update the fields when Success or Minor Error returned.
                        1 - Message
                            //On Error response, "User Exists" and "User Disabled" messages should be handled specifically.
                        2 - User GUID
        Psuedo code: 
                        1. Validate passed in parameters
                        2. Search for the user ID provided to see if the user already exists. Use a custom query to return disabled users too.
                            a. If user already exists, process will end and notify user of the duplicate. UsID and SiteID are returned.
                        3. Search the Site Name passed in to determine if it exists.
                                    a. If site already exists then it will save the SiteID pass that on.
                                    b. If site does not exist then it will create a site by running postSite
                        4. If groups were passed in, check if the groups exist using getGroups.
                            a. If any of the groups do not exist, process will end and notify user of the error.
                        5. Start of user creation logic. If a random password needs to be generated, do it now.
                        6. Create the user account by calling postUsers.
                            a. If this step is completed successfully, any handled errors occurring later in the code are pushed into the error array and returned as minor errors. 
                            Once the user has been created, want to be sure the user GUID and site ID are passed back so user creation is reflected on the form record.
                        7. If groups were passed in, add the user to groups using addUserToGroup.
                        8. If a custom email needs to be sent to the created user, send it using postEmails.
                        9. If a communications log needs to be created to reflect the welcome email, create it with postForms.
                            a. Relate the created communication log to each Form ID in the relateToRecords array.
                        10. If user has entered a folder path, determine if a folder exists in the destination location, to prevent duplication. Call getFolders.
                            a. If the folder was not found, create the folder suing postFolderByPath.
                            b. Add security permission for the user on that folder.
                        11. If all steps above completed successfully, check if any errors were logged in the error array.
                            a. If minor errors occurred, return ‘Minor Error’ with details.
                            b. If no errors, return ‘Success’
        Date of Dev:   12/4/2018
        Last Rev Date: 06/17/2020
        Revision Notes:
                        12/04/2018 - Alex Rhee: Initial creation of the business process.
                        12/18/2018 - Alex Rhee: Code reorganized and rewritten to follow promise chaining examples. Still missing folder provisioning.
                        12/20/2018 - Alex Rhee: Script is now fully functional and adding folder securities works. Need to now clean up code and test further.
                        1/2/19 - Alex Rhee: Script has been cleaned up, commented, bug tested.
                        1/18/19 - Alex Rhee: Made sure all API calls are being measured by Resp.meta.status === 200.
                        09/25/2019 - Removed uppercase I and lowercase L at customer request.
                        12/19/2019 - Kendra Austin: Script rewrite. Add hyphen (-) to user ID chars, add configuration to use or not use Comm Log, send only one custom email.
                        01/08/2020 - Kendra Austin: Switch out getUsers to a custom query. Allows disabled users to be returned so better error handling.
                        01/16/2020 - Kendra Austin: Add Other Fields to parameters for Comm Log creation. Make comments about folder security.
                        06/17/2020 - Kendra Austin: Do not use $ in passwords. $& is a .replace() method shortcut.
                        08/03/2022 - Franco Petosa Ayala - General Refactor.
                                                           Remove library q and moment as are no longer used.
                                                           Fix the handle response of vvClient.library.getFolders as it returns an obj instead of an array.
                        01/06/2023 - Franco Petosa Ayala - Fix password min-length validation
                                                           Fix getGroups helper function error messages handler
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
    const getUserDataQuery = 'UserCreateQueryForLib'
    const minPasswordLength = 5;
    const PasswordLength = 8;
    const passwordChars = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#%^&*()_+"; 
    //forceSecurities: KEEP THIS FALSE UNLESS GIVEN EXPLICIT PERMISSION.
    //Force the user to input security permissions when passing in folder paths. 
    //If set to true an error will be sent back if the user passes in a folder but no folder security or an invalid folder security.
    //If false and not passed in, folder is created without security. 
    const forceSecurities = false;
    const SysChangePass = 'true';                    //Require user to change password on first login. Set to 'true' for required; set to 'false' for not required.
    const createCommLog = true;                      //Dictates whether a communication log is created to reflect the custom welcome email sent to the user. Passwords are redacted.
    const timeZone = 'America/Phoenix';              //Set the local time zone here. Used when posting Communications Logs
    const commLogTemplateID = 'Communications Log';  //When createCommLog is true, this is the template name of the Communications Log. Used to post form.
    /* -------------------------------------------------------------------------- */
    /*                          Script 'Global' Variables                         */
    /* -------------------------------------------------------------------------- */
    let siteID = '';                   //Used to store the site ID that the user wil be assigned to.
    const groupObjListToAdd = [];      //Used to hold the IDs of all groups the user should be added to.
    let folderId = '';                 //Used to hold the folder ID, stored to apply security permissions.
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
        let resp = '';
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
            errorLog.push(error.message);
        }
        return resp;
    }
    function LogInfo(message, isSuccess, vvClientRes = null){
        /*
            Add message to the info logg and in case it is an minor error add it to the errorlog array
            Parameters:
                message: string value that represents the message sent to the logg
                isSuccess: boolean value that determinates if the message has to be added to the errorlog array
                vvClientRes: JSON response from a vvClient API method
        */
        logger.info(message);
        if(!isSuccess){
            errorLog.push(message);
        }
        return vvClientRes
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
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkData(), make sure to pass the same param as well.
        */
        if (!vvClientRes.meta) {
            throw new Error();
        }
        const status = vvClientRes.meta.status;
        if (status != 200 && status != 201 && status != ignoreStatusCode && status != 400) {
            throw new Error(status);
        }
        return vvClientRes;
    }
    function checkDataPropertyExists(vvClientRes, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object exists 
        Parameters:
            res: Parsed response object from the API call
            ignoreStatusCode: An integer status code for which no error should be thrown. If you're using checkMeta(), make sure to pass the same param as well.
        */
        const status = vvClientRes.meta.status;
        if (status != ignoreStatusCode) {
            // If the data property doesn't exist, throw an error
            if (!vvClientRes.data) {
                throw new Error('checkDataPropertyExists');
            }
        }
        return vvClientRes;
    }
    function checkDataIsNotEmpty(vvClientRes, ignoreStatusCode = 999) {
        /*
        Checks that the data property of a vvClient API response object is not empty
        Parameters:
            res: Parsed response object from the API call
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
                throw new Error('checkDataIsNotEmpty');
            }
            // If it is a Web Service response, check that the first value is not an Error status
            if (dataIsArray) {
                const firstValue = vvClientRes.data[0];
                if (firstValue == "Error") {
                    throw new Error('checkDataIsNotEmpty');
                }
            }
        }
        return vvClientRes;
    }
    function verifySingleData(vvClientRes){
         /*
            Verify data returned is not duplicated
            Parameters:
                vvClientRes: Parsed response object from the API call
        */
        if(vvClientRes.data.length > 1){
            throw new Error('verifySingleData');
        }
        return vvClientRes
    }
    function checkPasswordIsValid(password){
        /*
            This function verifies the passed in password is valid.
            Firstly checks if every digit that the password contains are valid
            Secondly the password length must be at least of 5 digits long
                Parameters:
                    Password: string value that represents the passed in passoword
        */
        //Verify the digits that the password contains are all valid
        for (let i = 0; i < password.length; i++) {
            if(!passwordChars.includes(password[i])){
                errorLog.push(`${password[i]} is an invalid character for passwords. `);
            }
        }
        //Verify the password is at least 5 digits long
        if(password.length < minPasswordLength){
            errorLog.push(`The password must be at least ${minPasswordLength} digits long. `);
        }
    }
    function checkUserIDisValid(userID){
        /*
            Verify the passed in userID contains only valid digits
                Parameters: 
                    userID: string value that represents the passed in user ID
        */
        //Valid digits for UserID
        const userNameChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.@+-";
        //Verify the digits that the userID contains are all valid
        for (let i = 0; i < userID.length; i++) {
            if(!userNameChars.includes(userID[i])){
                errorLog.push(`${userID[i]} is an invalid character for userID. `);
            }
        }
    }
    function checkEmailAddressIsValid(emailAddress){
        /*
            This function verifies if the passed in Email Address is valid
                Parameters:
                    emailAddress: string value that represents the passed in email address
        */
        const emailReg = new RegExp('\\b[A-Za-z0-9._%+-]+\@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}\\b');
        const isEmailValid = emailReg.test(emailAddress);
        if (!isEmailValid) {
            errorLog.push("The Email Address provided is not a valid email format.");
        }
    }
    function getUserData(userID){
        /*
            Call getCustomQueryResultsByName to get the user data from VV with the passed in user ID
                Parameters:
                    UserID: string value that represents the passed in User ID
        */
        const queryParams = { filter: `[UsUserID] = '${userID}'`};
        return vvClient.customQuery
            .getCustomQueryResultsByName(getUserDataQuery, queryParams)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .then((res) => verifySingleData(res))
            .then((res) => LogInfo(`Searched for existing users with ID ${userID}. None found. Continuing the process.`, true, res))
            .catch((error) =>{
                switch (error.message) {
                    case '404':
                        throw new Error(`The custom query to find users was not found. Please ensure that a query named ${getUserDataQuery} has been configured in the default queries area.`);
                    case 'verifySingleData':
                        throw new Error(`More than one user was found for ID: ${userID}. This is an invalid state. Please notify a system administrator.`);
                    default:
                        throw new Error(`There was an error when searching for the user ${userID}.`);
                }
            })
    }
    function getSiteData(siteName){
        /*
            Call getSites to get the site data from VV with the passed in site name
                Parameters:
                    siteName: string value that represents the passed in site name
        */
        const objectParam = {
            q: `name eq '${siteName}'`,
            fields: 'id, name'
        }
        return vvClient.sites
            .getSites(objectParam)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .catch(() => {throw new Error(`The call to search for the site name ${siteName} returned with an error.`);})
    }
    function createSite(siteName){
        /*
            Call postSites to create the site on VV with the passed in site name
                Parameters:
                    siteName: string value that represents the passed in site name
        */
        const newSiteData = {
            name: siteName,
            description: siteName,
        }
        return vvClient.sites
            .postSites(null, newSiteData)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .then((res) => checkDataIsNotEmpty(res))
            .then((res) => LogInfo('Site created successfully.',true, res))
            .catch(() => { throw new Error(`The call to create a site with name ${siteName} returned with an error.`); })
    }
    function getGroups(){
        /*
            Call getGroups to get all the existing groups on VV
                Parameters:
                    -No parameters required to run the function
        */
        const getGroupsParams = {
            q: '',
            fields: 'id,name,description'
        }
        return vvClient.groups
            .getGroups(getGroupsParams)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .then((res) => checkDataIsNotEmpty(res))
            .catch((error) => {
                const { message } = error;
                if(message === 'checkDataIsNotEmpty')throw new Error('No user permission groups were found to exist in the system. Please contact a system administrator.');
                else throw new Error('The call to get existing group names returned with an error.'); 
            });
    }
    function generatePassword(){
        /*
            Build up the password randomly
                Parameters:
                    -No parameters required to run the function
        */
        let generatedPassword = '';
        for (let i = 0; i < PasswordLength; i++) {
            generatedPassword += passwordChars.charAt(Math.floor(Math.random() * passwordChars.length));
        }
        return generatedPassword
    }
    function createUser(newUserObject,siteID){
        /*
            Call postUsers to create a new user with the passed in data
                Parameters:
                    newUserObject: obj value that contains data for the new user creation
                    siteID: string value that represents the id of the site
        */
        return vvClient.users.
            postUsers({}, newUserObject, siteID)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .then((res) => checkDataIsNotEmpty(res))
            .catch(() => {throw new Error('The call to create the user returned with an error.')})
    }
    function addNewUserToGroups(groupObjListToAdd, newUserGUID){
        /*
            Call addUserToGroup for each group passed in to add the user
                Parameters:
                    groupObjListToAdd: obj array that contains the data of each passed in group
                    newUserGUID: string value that represents the user GUID
                Note:For better performance handle the asynchronos operations all at once
                using the promise method Promise.allSettled. If an error occurs the process will not stop.
        */
        return Promise.allSettled(groupObjListToAdd.map(group => {
            return vvClient.groups
                .addUserToGroup({}, group.id, newUserGUID)
                .then((res) => parseRes(res))
                .then((res) => checkMetaAndStatus(res))
                .then((res) => checkDataPropertyExists(res))
                .catch(() => LogInfo(`Error adding user to group ${group.name}.`,false))
        }))
    }
    function sendEmailToUser(PostEmailData){
        /*
            Call postEmails to send an email
                Parameters:
                    PostEmailData: obj contains the required data to send the email
        */
        return vvClient.email
            .postEmails('', PostEmailData)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .then((res) => checkDataIsNotEmpty(res))
            .then((res) => LogInfo("Welcome email sent successfully.", true, res))
            .catch(() => LogInfo('User has been created, but the welcome email was not sent successfully.',false))
    }
    function createCommunicationLog(targetFields,commLogTemplateID){
        /*
            Call postForms to create an instance of Communication Log template
                Parameters:
                    targetFields: obj that contains data of the fields required to be completed
                    commLogTemplateID. string value that represents the id of the form template
        */
        return vvClient.forms
            .postForms(null, targetFields, commLogTemplateID)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .catch((error) => LogInfo(`Call to post Communications Log form returned with an error. The server returned a status of ${error.message}`, false))
    }
    function relateForms(communicationLogRevisionID,relateToRecords){
        /*
            Call relateFormByDocId to relate any record the Communication Log should be related to
                Parameters:
                    communicationLogRevisionID: string value that represents the form record id to be related to other form records
                    relateToRecords. array of string values that represents the form records that has to be related to the Communication Log record
        */
        return Promise.allSettled(relateToRecords.map(relatedForm =>{
            return vvClient.forms
                .relateFormByDocId(communicationLogRevisionID, relatedForm)
                .then((res) => parseRes(res))
                .then((res) => checkMetaAndStatus(res))
                .then((res) => checkDataPropertyExists(res,200))
                .then((res) => LogInfo(`Communications Log related to form ${relatedForm} successfully.`, true, res))
                .catch(() => LogInfo(`Call to relate the Communications Log to form ${relatedForm} returned with an error.`,false))
        }))
    }
    function getFolder(folderPath){
        /*
            Call getFolders to get the folder data with the passed in folder path
                Parameters:
                    folderPath: string value that represents the passed in folder path
        */
        const folderObjParams = {folderPath : folderPath}
        return vvClient.library
            .getFolders(folderObjParams)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res, 403))
            .then((res) => checkDataPropertyExists(res,403))
            .then((res) => { 
                if(res.meta.status == 403){
                    LogInfo(`The call to find a folder at ${folderPath} returned with a 403. Assuming no duplicates and continuing the process.`, true);
                }else{
                    LogInfo(`The call to find a folder at ${folderPath} returned with no duplicates. Continuing the process.`, true);
                }
                return res
            })
            .catch(() => LogInfo(`The call to find a folder at ${folderPath} returned with an error.`, false))
    }
    function createFolder(folderPath){
        /*
            Call postFolderByPath to create a folder with the passed in folder path
                Parameters:
                    folderPath: string value that represents the passed in folder path
        */
        return vvClient.library
            .postFolderByPath(null, {}, folderPath)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res)) 
            .then((res) => checkDataPropertyExists(res)) 
            .then((res) => checkDataIsNotEmpty(res))
            .then((res) => LogInfo('Folder created succesfully', true, res))
            .catch(() => LogInfo(`User was created but call to create folder at ${folderPath} returned with an error.`, false))
    }
    function addPermissionsToFolder(folderPermissions,folderId,newUserGUID){
         /*
            Call putFolderSecurityMember to give folder permissions to the requested user
                Parameters:
                    folderPermissions: string value that represents the folder permission (viewer, editor, owner)
                    folderId: string value that represents the folder id
                    newUserGUID: string value that represents the user GUID that will be assigned the folder permissions
        */
        const memberType = vvClient.constants.securityMemberType['User'];
        const role = vvClient.constants.securityRoles[folderPermissions];
        const cascadeChanges = true;
        return vvClient.library
            .putFolderSecurityMember(folderId, newUserGUID, memberType, role, cascadeChanges)
            .then((res) => parseRes(res))
            .then((res) => checkMetaAndStatus(res))
            .then((res) => checkDataPropertyExists(res))
            .then((res) => checkDataIsNotEmpty(res))
            .then((res) => LogInfo('Security permissions successfully added to folder', true, res))
            .catch(() => LogInfo('The folder was created, but an error was returned when attempting to add user security permissions to the folder.', false))
    }
    /* -------------------------------------------------------------------------- */
    /*                                  MAIN CODE                                 */
    /* -------------------------------------------------------------------------- */
    try {
        // GET THE VALUES OF THE FIELDS
        //PASSED IN DATA FOR USER CREATION
        const userID = getFieldValueByName('User Id');
        const emailAddress = getFieldValueByName('Email Address');
        const siteName = getFieldValueByName('Site Name');
        let groupList = getFieldValueByName('Group List',false);
        const firstName = getFieldValueByName('First Name',false);
        const middleInitial = getFieldValueByName('Middle Initial',false);
        const lastName = getFieldValueByName('Last Name',false);
        let password = getFieldValueByName('Password',false);
        //ADMIN DATA FOR USER CONFIG CREATION
        let relateToRecords = getFieldValueByName('Related Records',false);
        let otherFields = getFieldValueByName('Other Fields',false);
        const folderPath = getFieldValueByName('Folder Path',false);
        const folderPermissions = getFieldValueByName('Folder Permissions',false);
        //PASSED IN DATA FOR SENDING EMAIL
        const sendEmail = getFieldValueByName('Send Email');
        const emailBodyField = getFieldValueByName('Email Body',false);
        const emailSubjectField = getFieldValueByName('Email Subject',false);
        // VERIFY PASSED IN VALID USER ID
        if(userID){
            checkUserIDisValid(userID);
        }
        // VERIFY PASSED IN VALID PASSWORD
        if(password){
            checkPasswordIsValid(password);
        }
        //VERIFY PASSED IN VALID EMAIL ADDRESS
        if(emailAddress){
            checkEmailAddressIsValid(emailAddress);
        }
        //VERIFY SEND EMAIL HAS A VALID VALUE
        if (sendEmail != 'Standard' && sendEmail != 'Custom' && sendEmail != 'Both') {
            errorLog.push("The Send Email parameter must be 'Standard', 'Custom', or 'Both'.");
        }
        //VERIFY EMAIL SUBJECT AND BODY ARE VALID
        if(sendEmail == 'Custom' || sendEmail == 'Both'){
            if (!emailSubjectField) {
                errorLog.push("The Email Subject parameter was not supplied.");
            }
            if (!emailBodyField) {
                errorLog.push("The Email Body parameter was not supplied.");
            }else if (sendEmail == 'Custom') {
                if (!emailBodyField.includes('[Username]') || !emailBodyField.includes('[Password]')) {
                    errorLog.push('The Email Body must include [Username] and [Password].');
                }
            }
        }
        //VERIFY PASSED IN FOLDER PERMISSIONS ARE VALID
        if(folderPath && !folderPermissions && forceSecurities){
            errorLog.push('The Folder Permissions parameter was not supplied.');
        }else if(folderPath && folderPermissions){
            if (folderPermissions != 'Viewer' && folderPermissions != 'Editor' && folderPermissions != 'Owner') {
                errorLog.push('The Folder Permissions parameter must be Viewer, Editor, or Owner.');
            }
        }
        //VERIFY PASSED IN RELATE RECORDS IS VALID
        if(!relateToRecords){
            //Not required. Set to empty array to avoid undefined errors.
            relateToRecords = [];
        }else if(!Array.isArray(relateToRecords)){
            errorLog.push('The Related Records parameter must be an array when it is provided.');
        }
        //VERIFY PASSED IN OTHER FIELDS IS VALID
        if(!otherFields){
            otherFields = {};
        }
        //IF ERRORS OCCURRED RETURN ALL AT ONCE
        if(errorLog.length > 0){
            throw new Error(errorLog);
        }
        //START PROCESS
        //GET USER DATA WITH PASSED IN USER ID
        const getUserDataRes = await getUserData(userID);
        const userData = getUserDataRes.data
        //IF DATA IS RETURN, IT MEANS AN USER WITH THE PASSED IN ID ALREADY EXIST AND PROCESS MUST STOP THROWING AN ERROR
        if(userData.length == 1){
            const isUserEnabled = userData[0].usEnabled
            if(isUserEnabled == 1){
                throw new Error('User Exists');
            }else if(isUserEnabled == 0){
                throw new Error('User Disabled');
            }else{
                throw new Error(`A duplicate user was found, but the process was unable to determine if the user account is currently enabled or disabled. Please try again or contact a system administrator.`);
            }
        }
        //GET SITE DATA WITH THE PASSED IN SITE NAME.
        const getSiteDataResp = await getSiteData(siteName)
        const siteData = getSiteDataResp.data
        if(siteData.length == 0){
            //NO DATA FOUND, IT IS NECESSARY TO CREATE THE SITE
            const createSiteResp = await createSite(siteName)
            siteID = createSiteResp.data.id
        }else if(siteData.length == 1){
            //THE SITE ALREADY EXIST, NO NEED TO CREATE IT
            siteID = siteData[0].id;
        }else{
            //FOUND MORE THAN ONE SITE. INVALID STATE
            throw new Error(`The call to search for the site name ${siteName} returned with more than one result. This is an invalid state. Please contact a system administrator.`);
        }
        //ONLY IF GROUP LIST IS PASSED IN
        if(groupList){
            //BUILD UP THE ARRAY OF GROUPS
            groupList = groupList.split(',');
            groupList = groupList.map( group => group.trim());
            //GET THE EXISTING GROUPS ON VV
            const getGroupsRes = await getGroups();
            const existingGroupList = getGroupsRes.data;
            //VERIFY ALL PASSED IN GROUPS EXIST ON VV
            groupList.forEach( passedInGroupName => {
                const groupObj = existingGroupList.find( existingGroup => existingGroup.name == passedInGroupName)
                if(groupObj){
                    groupObjListToAdd.push(groupObj)
                }else{
                    errorLog.push(`The group ${passedInGroupName} does not exist. `)
                }
            });
            //IF ONLY ONE GROUP FROM THE PASSED IN LIST TURNS OUT TO BE INVALID, STOP PROCESS AND THROW AN ERROR
            if(errorLog.length > 0){
                throw new Error(`At least one group was not found to exist. ${errorLog}`);
            }else{
                logger.info('All groups were found to exist. Continuing the process.');
            }
        }
        //START THE USER CREATION PROCESS
        //IF PASSWORD IS NOT PASSED IN MUST BE GENERATED
        if(!password){
            password = generatePassword()
        }
        const newUserObject = {};
        newUserObject.userid = userID;
        newUserObject.firstName = firstName;
        newUserObject.middleInitial = middleInitial;
        newUserObject.lastName = lastName;
        newUserObject.emailaddress = emailAddress;
        newUserObject.password = password;
        newUserObject.mustChangePassword = SysChangePass;
        newUserObject.sendEmail = sendEmail != 'Custom' ? 'true' : 'false';
        //CREATE THE NEW USER WITH VALID PASSED IN DATA
        const createUserResp = await createUser(newUserObject,siteID);
        const newUserGUID = createUserResp.data.id
        //FROM NOW ON IF AN ERROR OCCURS WILL BE CONSIDERED MINOR
        //IF GROUP LIST IS PASSED IN 
        if(groupList){
            await addNewUserToGroups(groupObjListToAdd, newUserGUID)
        }
        //SEND EMAIL ONLY IF IT IS REQUIRED
        if (sendEmail == 'Custom' || sendEmail == 'Both'){
            const PostEmailData = {};
            PostEmailData.recipients = emailAddress;
            PostEmailData.subject = emailSubjectField;
            PostEmailData.body = emailBodyField.replace('[Username]', userID).replace('[Password]', password);
            await sendEmailToUser(PostEmailData);
        }
        //CREATE COMMUNICATION LOG IF REQUESTED
        if (createCommLog && sendEmail != 'Standard'){
            const sendDate = momentTz().tz(timeZone).format('L');
            const sendTime = momentTz().tz(timeZone).format('LT');
            const localTime = `${sendDate} ${sendTime}`;
            const targetFields = {};
            targetFields['Communication Type'] = 'Email';
            targetFields['Email Type'] = 'Immediate Send';
            targetFields['Email Recipients'] = emailAddress;
            targetFields['Subject'] = emailSubjectField
            targetFields['Email Body'] = emailBodyField.replace('[Username]', userID);
            targetFields['Scheduled Date'] = localTime;
            targetFields['Communication Date'] = localTime;
            targetFields['Approved'] = 'Yes';
            targetFields['Communication Sent'] = 'Yes';
            //LOAD ADDITIONAL FIELDS
            for (let property1 in otherFields) {
                targetFields[property1] = otherFields[property1];
            }
            const createCommunicationLogRes = await createCommunicationLog(targetFields,commLogTemplateID);
            const communicationLogRevisionID = createCommunicationLogRes.data.revisionId;
            //RELATE FORMS IF REQUESTED
            if(relateToRecords.length > 0){
                await relateForms(communicationLogRevisionID,relateToRecords);
            }
        }
        if(folderPath){
            logger.info(`Finding folder: ${folderPath}`);
            //VERIFY THE PASSED IN FOLDER EXIST TO AVOID DUPLICATED FOLDERS. IF NOT CREATE IT
            const getFoldersRes = await getFolder(folderPath);
            const folderData = getFoldersRes.data;
            //IF DATA IS RETURNED, THE FOLDER ALREADY EXIST. IF NOT IT NEEDS TO BE CREATED
            if(folderData){
                folderId = folderData.id
            }else{
                const createFolderRes = await createFolder(folderPath);
                folderId = createFolderRes.data.id;
            }
            //ADD THE FOLDER PERMISSIONS IF IT IS REQUESTED AND THE FOLDER ID IS PRESENT
            if(folderPermissions && folderId){
                await addPermissionsToFolder(folderPermissions,folderId,newUserGUID);
            }
        }
        //VERIFY IF MINOR ERRORS OCCURED
        const areMinorErros = errorLog.length > 0 ? true : false
        // BUILD THE SUCCESS RESPONSE ARRAY
        outputCollection[0] = areMinorErros ? 'Minor Error' : "Success"; // Don´t change this
        outputCollection[1] = areMinorErros ? errorLog.join('<br>') : "All actions completed successfully.";
        outputCollection[2] = newUserGUID;
    } catch (error) {
        logger.info("Error encountered" + error);
        // BUILD THE ERROR RESPONSE ARRAY
        outputCollection[0] = "Error"; // Don´t change this
        if (error.message) {
            outputCollection[1] = error.message;
        } else {
            outputCollection[1] = `An Unhandled error has occurred. The message returned was: ${error}`;
        }
    } finally {
        // SEND THE RESPONSE
        response.json(200, outputCollection);
    }
};