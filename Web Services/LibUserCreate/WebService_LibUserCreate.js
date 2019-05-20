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
    /*Script Name:   UserCreate
     Customer:      VisualVault
     Purpose:       The purposee of this Node script is to verify if the user record is unique and then create the record.  This is an example of how to call LibUserCreate
     Parameters:
     Return Array:
     Psuedo code: 
                1. Call getUsers and search for users with matching email addresses.
                2. If matcing users were found, send back Error message telling the user duplicate accounts were found.
                3. If no matching users were found, gather all the parameters needed for the LibUserCreate call and then call the script.
                4. Measure the response and send back the appropriate message to the user.
     Date of Dev:   03/07/2019
     Last Rev Date: 03/07/2019
     Revision Notes:
     03/07/2019 - Alex Rhee: Script created
     */

    logger.info('Start of the process UserAccountCreate at ' + Date());

    //Config Variables
    var outputCollection = [];                                                  //Response array
    var searchResponse = [];                                                    //Hold the verify response to send back later in the script
    var duplicate = false;                                                      //Boolean for whether or not a duplicate account exists
    var existingUserID = '';                                                    //Array to hold the existing user ID
    var baseURL = 'https://dev.visualvault.com/app/CUSTOMERALIAS/DATABASEALIAS/UserPortal'     //Base URL that will change in prod           

    //Create variables for the values the user inputs when creating their User
    var firstName = ffCollection.getFormFieldByName('First Name').value;
    var middleInit = ffCollection.getFormFieldByName('MI').value;
    var lastName = ffCollection.getFormFieldByName('Last Name').value;
    var EmailAddress = ffCollection.getFormFieldByName('Email').value;
    var UserType = ffCollection.getFormFieldByName('User Type').value;
    var DispensaryManagement = ffCollection.getFormFieldByName('Dispensary Management').value;
    var DispensaryHR = ffCollection.getFormFieldByName('Dispensary HR').value;
    var vvLocation = ffCollection.getFormFieldByName('VV Location').value;

    //Config Email Variables
    var SubjectField1 = {};
    SubjectField1.name = 'SubjectField1';
    SubjectField1.value = 'New Account Details - CUSTOMER SUBJECT SPECIFIC';

    var BodyField1 = {};
    BodyField1.name = 'BodyField1';
    BodyField1.value =
        'Your new CUSTOMER account has been created.' +
        '<br/><br/>' +
        'You may access your account at: ' + baseURL +
        '<br/><br/>' +
        'Account created for username: ' + EmailAddress;

    var SubjectField2 = {};
    SubjectField2.name = 'SubjectField2';
    SubjectField2.value = 'New Account Details - CUSTOMER SUBJECT SPECIFIC';

    var BodyField2 = {};
    BodyField2.name = 'BodyField2';
    BodyField2.value =
        'Your new CUSTOMER account has been created.' +
        '<br/><br/>' +
        'You may access your account at: ' + baseURL +
        '<br/><br/>' +
        'Your new password is: ';

    //Promise for searching user
    var searchUser = function () {
        //Set up query for the getUser() API call
        var currentUserdata = {};
        currentUserdata.q = "[name] eq '" + EmailAddress + "'";
        currentUserdata.fields = "id,name,userid,siteid,firstname,lastname,emailaddress";

        return vvClient.users.getUser(currentUserdata);
    }

    // //Combined promise that holds both searchSite() promises
    var searchCall = Promise.all([searchUser()]);

    searchCall
        .then(
            function (promises) {

                //Variable that holds the search site results
                var promise = JSON.parse(promises[0]);

                searchResponse = promise.data;

                if (promise.meta.status == 200) {
                    if (searchResponse.length == 0) {

                        var createUserData = [];

                        //Group data/logic.  Load a comma separated list of groups.  The items below are items selected by the user on the form.
                        var groupListObj = {};
                        groupListObj.name = 'Group List';
                        if (UserType == 'Patient and Caregiver') {
                            groupListObj.value = 'Patient and Caregiver';
                        }
                        else if (UserType == 'Dispensary Personnel') {
                            if (DispensaryManagement == 'true' && DispensaryHR == 'true') {
                                groupListObj.value = 'Dispensary Management, Dispensary Human Resources';
                            }
                            else if (DispensaryHR == 'true') {
                                groupListObj.value = 'Dispensary Human Resources';
                            }
                            else if (DispensaryManagement == 'true') {
                                groupListObj.value = 'Dispensary Management';
                            }
                            else {
                                groupListObj.value = 'Dispensary Employee';
                            }
                        }
                        else if (UserType == 'Healthcare Provider') {
                            groupListObj.value = 'Medical Health Care Professional';
                        }
                        else if (UserType == 'Mental Healthcare Provider') {
                            groupListObj.value = 'Mental Health Provider';
                        }
                        else if (UserType == 'Medical and Mental Healthcare Provider') {
                            groupListObj.value = 'Medical and Mental Health Care Providers';
                        }
                        else {
                            groupListObj.value = UserType;
                        }
                        createUserData.push(groupListObj);

                        //Form data
                        var SiteName = {};
                        SiteName.name = 'Site Name';
                        SiteName.value = vvLocation;
                        createUserData.push(SiteName);

                        var fNameObj = {};
                        fNameObj.name = 'First Name';
                        fNameObj.value = firstName;
                        createUserData.push(fNameObj);

                        var lNameObj = {};
                        lNameObj.name = 'Last Name';
                        lNameObj.value = lastName;
                        createUserData.push(lNameObj);

                        var middleInitObj = {};
                        middleInitObj.name = 'Middle Initial';
                        middleInitObj.value = middleInit;
                        createUserData.push(middleInitObj);

                        var emailAddObj = {};
                        emailAddObj.name = 'Email Address';
                        emailAddObj.value = EmailAddress;
                        createUserData.push(emailAddObj);

                        var userIDObj = {};
                        userIDObj.name = 'User ID';
                        userIDObj.value = EmailAddress;
                        createUserData.push(userIDObj);

                        var NewPassword = {};
                        NewPassword.name = 'Password';  
                        NewPassword.value = '';             //Hard coded password.  If blank, then autogenerate.
                        createUserData.push(NewPassword);

                        var PasswordChange = {};
                        PasswordChange.name = 'Change Password';
                        PasswordChange.value = 'true';      //Force to change their password on the first login.
                        createUserData.push(PasswordChange);

                        var EmailSend = {};
                        EmailSend.name = 'Send Email';
                        EmailSend.value = 'false';          //Send VV default new user email.  False = no, true = yes.
                        createUserData.push(EmailSend);

                        var folderInfo = {};
                        folderInfo.name = 'Folder Path';
                        folderInfo.value = '';              //Path to create a folder for the user to upload documents and manage documents of their own in the document library.
                        createUserData.push(folderInfo);

                        var securityPermission = {};
                        securityPermission.name = 'Folder Permissions';
                        securityPermission.value = '';                      //Permissions they will have to the folder.
                        createUserData.push(securityPermission);

                        //Email content can be edited/configured at the top of the script in Config Email Variables
                        createUserData.push(SubjectField1);
                        createUserData.push(BodyField1);
                        createUserData.push(SubjectField2)
                        createUserData.push(BodyField2);

                        return vvClient.scripts.runWebService('LibUserCreate', createUserData);
                    }
                    else {
                        existingUserID = searchResponse[0].id;
                        duplicate = true;
                        throw new Error("User Account already exists.");
                    }
                }
                else {
                    throw new Error('There was an error when retrieving users.');
                }
            }
        )
        .then(
            function (createResp) {
                if (createResp.meta.status == 200 && createResp.data[0] == 'Success') {
                    outputCollection[0] = 'Success';
                    outputCollection[1] = 'User is ' + searchResponse + ' and created successfully.';
                    outputCollection[2] = createResp.data[2];
                    outputCollection[3] = createResp.data[3];
                    response.json(200, outputCollection);
                }
                else {
                    throw new Error(createResp.data[1])
                }
            }
        )
        .catch(function (exception) {
            //Error catching, will send the user the error message
            logger.info(exception);
            if (duplicate == true) {
                outputCollection[0] = 'Error, Exists';
                outputCollection.push('The following error was encountered when creating a user ' + exception);
                outputCollection.push(existingUserID);
                response.json(200, outputCollection);
                return false;
            }
            outputCollection[0] = 'Error';
            outputCollection.push(exception);
            response.json(200, outputCollection);
            return false;
        })

}
