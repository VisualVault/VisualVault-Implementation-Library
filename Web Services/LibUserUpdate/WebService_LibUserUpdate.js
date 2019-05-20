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
    /*Script Name:   UserSave
     Customer:      VisualVault
     Purpose:       The purposee of this Node script is to verify if the user record is unique and then save the record.
     Parameters:
     Return Array:
     Psuedo code: 
                1. Call VerifyUniqueRecord to determine whether the user record is unique per the passed in information.
                2. If 'Not Matched' send a response to the user that an existing record was found.
                3. If 'Unique Matched' or 'Unique' call getUsers using the email as the username to find the user account.         
                4. Use the user type to determine which groups the user should be added to.
                5. Also, determine which groups the user should be removed from.
                6. Set up the rest of the parameters to be passed to the LibUserUpdate script and then call it.
                7. Measure the success of the update call and send the client the appropriate response.
     Date of Dev:   03/05/2019
     Last Rev Date: 03/05/2019
     Revision Notes:
     03/05/2019 - Alex Rhee: Script created
     */

    logger.info('Start of the process UserSave at ' + Date());

    //Config variables
    var outputCollection = [];                                                      //Response array
    var UserTemplateID = 'User Management';                                         //Template ID for User Mangement Form
    var verifyResponse = '';                                                        //Empty variable that will hold the verify call response

    //Create variables for the values the user inputs when creating their User
    var firstName = ffCollection.getFormFieldByName('First name').value;
    var lastName = ffCollection.getFormFieldByName('Last Name').value;
    var middleInitial = ffCollection.getFormFieldByName('MI').value;
    var RecordID = ffCollection.getFormFieldByName('Record ID').value;
    var UserEmail = ffCollection.getFormFieldByName('Email').value;
    var UserType = ffCollection.getFormFieldByName('User Type').value;
    var DispensaryManagement = ffCollection.getFormFieldByName('Dispensary Management').value;
    var DispensaryHR = ffCollection.getFormFieldByName('Dispensary HR').value;


    //Promise for VerifyUniqueRecord API call
    var verifyUnique = function () {

        //Load array with objects to pass to the web service.
        var uniqueRecordObj = [];

        var templateIDObj = {};
        templateIDObj.name = 'templateId';
        templateIDObj.value = UserTemplateID;
        uniqueRecordObj.push(templateIDObj);

        var queryObj = {};
        queryObj.name = 'query';
        //Set up a query for verifying matching records on the form
        queryObj.value = "[Email] eq '" + UserEmail + "'";
        uniqueRecordObj.push(queryObj);

        var formIDObj = {};
        formIDObj.name = 'formId'
        formIDObj.value = RecordID;
        uniqueRecordObj.push(formIDObj);

        return vvClient.scripts.runWebService('LibVerifyUniqueRecord', uniqueRecordObj);
    }

    // Promise to hold the Verify web service call
    var verifyCall = Promise.all([verifyUnique()]);

    verifyCall
        .then(
            function (promises) {
                //Variable that holds the Verify API call results
                var promise = promises[0];
                //Save the verify response
                verifyResponse = promise.data.status;

                if (promise.meta.status == 200) {
                    //If Unique, then call getUsers using the Email
                    if (verifyResponse == 'Unique' || verifyResponse == 'Unique Matched') {
                        //User search obj
                        var currentUserdata = {};
                        currentUserdata.q = "[name] eq '" + UserEmail + "'";
                        currentUserdata.fields = "id,name,userid,siteid,firstname,lastname,emailaddress";

                        return vvClient.users.getUser(currentUserdata);
                    }
                    //If 'Not Unique' tell the user that the account already exists.
                    else if (verifyResponse == 'Not Unique') {
                        throw new Error("User Account already exists.");
                    }
                    else {
                        //If the response does not match any of our criteria, throw an error message with the statusMessage
                        throw new Error(promise.data.statusMessage);
                    }
                }
                else {
                    throw new Error('There was an error when calling VerifyUniqueRecord');
                }
            }
        )
        .then(
            function (userResp) {

                //Parse the response data
                var userRespData = JSON.parse(userResp)
                //Check to make sure the response was successfull

                if (userRespData.meta.status == 200) {
                    if (userRespData.data.length == 1) {

                        //Array to hold all the update objects
                        var updateObj = [];

                        //Group data/logic.  Add to a comma separated list of groups.  Assumes groups do not have commas in group name.
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
                        else if (UserType == 'Provider Designee') {
                            groupListObj.value = 'Providers';
                        }
                        else {
                            groupListObj.value = UserType;
                        }
                        updateObj.push(groupListObj);

                        //Remove Group data/logic
                        var removeGroupListObj = {};
                        removeGroupListObj.name = 'Remove Group List';
                        if (UserType == 'Dispensary Personnel') {
                            if (DispensaryManagement != 'true' && DispensaryHR != 'true') {
                                removeGroupListObj.value = 'Dispensary Management, Dispensary Human Resources';
                            }
                            else if (DispensaryManagement == 'true' && DispensaryHR != 'true') {
                                removeGroupListObj.value = 'Dispensary Human Resources';
                            }
                            else if (DispensaryManagement != 'true' && DispensaryHR == 'true') {
                                removeGroupListObj.value = 'Dispensary Management';
                            }
                        }
                        else {
                            removeGroupListObj.value = 'Dispensary Employee, Dispensary Management, Dispensary Human Resources';
                        }
                        updateObj.push(removeGroupListObj);


                        var fNameObj = {};
                        fNameObj.name = 'First Name';
                        fNameObj.value = firstName;
                        updateObj.push(fNameObj);

                        var lNameObj = {};
                        lNameObj.name = 'Last Name'
                        lNameObj.value = lastName;
                        updateObj.push(lNameObj);

                        var mNameObj = {};
                        mNameObj.name = 'Middle Initial'
                        mNameObj.value = middleInitial;
                        updateObj.push(mNameObj);

                        var emailAddObj = {};
                        emailAddObj.name = 'Email Address';
                        emailAddObj.value = UserEmail;
                        updateObj.push(emailAddObj);

                        var userIDObj = {};
                        userIDObj.name = 'User ID';
                        userIDObj.value = UserEmail;
                        updateObj.push(userIDObj);

                        var userDisabledObj = {};
                        userDisabledObj.name = 'User Disabled';
                        userDisabledObj.value = '';
                        updateObj.push(userDisabledObj);

                        return vvClient.scripts.runWebService('LibUserUpdate', updateObj);
                    }
                    else if (userRespData.length > 1) {
                        throw new Error('More than one User Record found.');
                    }
                    else {
                        throw new Error('User Record not found.');
                    }
                }
                else {
                    throw new Error(userRespData.data[1])

                }
            }
        )
        .then(
            function (updateResp) {
                if (updateResp.meta.status == 200) {
                    outputCollection[0] = 'Success';
                    outputCollection[1] = 'User is ' + verifyResponse + ' and updated successfully.';
                    response.json(200, outputCollection);
                }
                else {
                    throw new Error(updateResp.data[1])
                }
            }
        )
        .catch(function (exception) {
            //Error catching, will send the user the error message
            logger.info(exception);
            outputCollection[0] = 'Error';
            outputCollection.push(exception.message + ". ");
            response.json(200, outputCollection);
            return false;
        })

}
