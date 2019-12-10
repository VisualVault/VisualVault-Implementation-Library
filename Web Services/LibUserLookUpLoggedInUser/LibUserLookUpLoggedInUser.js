var logger = require('../log');
var Q = require('q');

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

module.exports.main = function (ffCollection, vvClient, response) {
    /**
     * Script Name:     LibUserLookUpLoggedInUser
     * Customer:        VisualVault Library Function
     * Purpose:         The purpose of this function is to look up the current logged in user and return information about the individual's record
     * Parameters:
     *                  1. User Id - REQUIRED; this is the identifier for the logged in user
     *                  2. Find Form Data - REQUIRED; string of 'True' or 'False'; this determines whether or not additional form data is returned with the response
     *                  3. Form Template Name - Required if Find Form Data == 'true'; this is the name of the template that stores the user information
     *                  4. User Id Field - Required if Find Form Data == 'true'; This is the field identifying the user. Should typically be 'Email Address' or similar.
     *                  5. Form Fields - OPTIONAL; the string of the fields to return if returning form data (If Find Form Data is set to true, provide the form fields you'd like).
     *                                             If Form Fields is not passed in, all fields will be returned. 
     * 
     *                      SAMPLE: Within your client side code, add fields using the following:
     *                              let formData = VV.Form.getFormDataCollection();

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
                                    
     *                          
     * Return Array:
     *                  1. Status: "Error" or "Success"
     *                  2. Message: What occured during the process/specific error if there is one
     *                  3. Object containing the user account details
     *                  4. Object containing the user site details
     *                  5. Object continaing values found in the form template (may or may not exist depending on if the find form data is set to true/false)
     * 
     * Pseudo Code:
     *                  1. Call getUser using the User Id provided
     *                  2. Use the userId to get the site details
     *                  3. Determine if a call to getForms needs to be made
     *                      a. If so, perform the call and find the form fields that were passed in to this function call
     * 
     * Date of Dev:     7/26/2019
     * Last Rev Date:   08/20/2019
     * Revision Notes:
     * 7/26/2019 - Miroslav Sanader: Script Created
     * 7/29/2019 - Miroslav Sanader: Added comment header as well as intial logic for the script
     * 7/30/2019 - Miroslav Sanader: Add Individual record form check as well as logic to return the individual record
     * 7/31/2019 - Miroslav Sanader: Fix up code after QA comments
     * 8/20/2019 - Kendra Austin: Read all input parameters and use them. Add validation of passed in fields. 
     */

    logger.info('Start of process LibUserLookUpLoggedInUser at: ' + Date());

    let outputCollection = [];
    var errors = [];
    let userData = null;
    let siteData = null;
    let individualRecord = null;

    let userID = ffCollection.getFormFieldByName('User Id');
    let getAdditionalData = ffCollection.getFormFieldByName('Find Form Data');
    let formTemplateID = ffCollection.getFormFieldByName('Form Template Name');
    let userIdField = ffCollection.getFormFieldByName('User Id Field');
    let formFields = ffCollection.getFormFieldByName('Form Fields');

    //Start the promise chain
    var result = Q.resolve();

    return result.then(function () {

        //Validate passed in fields
        if (!userID || !userID.value) {
            errors.push("The userID parameter was not supplied.");
        }
        else {
            userID = userID.value;
        }

        if (!getAdditionalData || !getAdditionalData.value) {
            errors.push("The getAdditionalData parameter was not supplied.");
        }
        else {
            getAdditionalData = getAdditionalData.value.toLowerCase() == 'true' ? true : false;
        }

        if (getAdditionalData) {
            if (!formTemplateID || !formTemplateID.value) {
                errors.push("The formTemplateID parameter was not supplied.");
            }
            else {
                formTemplateID = formTemplateID.value;
            }

            if (!userIdField || !userIdField.value) {
                errors.push("The userIdField parameter was not supplied.");
            }
            else {
                userIdField = userIdField.value;
            }

            if (!formFields || !formFields.value) {
                formFields = false;
            }
            else {
                formFields = formFields.value;
            }
        }

        //Return all validation errors at once.
        if (errors.length > 0) {
            throw new Error(errors);
        }
    })
        .then(function () {
            return vvClient.users.getUser({
                q: "[userid] eq '" + userID + "'",
                expand: 'true'
            })
        }).then(function (getResp) {
            let resp = JSON.parse(getResp);
            if (resp.meta.status == 200) {
                // If the response was successful, test to see if there is a user associated with the ID
                if (resp.data.length > 0) {
                    logger.info('Found user for: ' + userID)
                    userData = resp.data[0];
                    return vvClient.sites.getSites(
                        {
                            q: "[id] eq '" + userData['siteId'] + "'",
                            expand: 'true'
                        }
                    );
                }
                else
                    throw Error('Unable to find User Id when acquiring users.');
            }
            else
                throw Error('There was an error when attempting to acquire the user information.');
        }).then(function (siteResp) {
            let site = JSON.parse(siteResp)
            if (site.meta.status == 200) {
                if (site.data.length > 0) {
                    logger.info('Site data for site: ' + site.data[0]['id']);
                    siteData = site.data[0];

                    // Determine if the associated individual record has to be returned
                    // or not
                    if (!getAdditionalData) {
                        outputCollection[0] = 'Success';
                        outputCollection[1] = 'The user data and site info was retrieved. No additional data was included.';
                        outputCollection[2] = userData;
                        outputCollection[3] = siteData;
                        return response.json(200, outputCollection);
                    }
                    else {
                        var formQuery = {};
                        formQuery.q = "[" + userIdField + "] eq '" + userID + "'";
                        if (formFields) {
                            formQuery.fields = formFields;
                        }
                        else {
                            formQuery.expand = true;
                        }
                        return vvClient.forms.getForms(formQuery, formTemplateID).then(function (formResp) {
                            let form = JSON.parse(formResp);

                            if (form.meta.status === 200) {
                                if (form.data.length == 1) {
                                    logger.info('Form record found for: ' + userID);
                                    // There should only be one individual record associated with this userIdField
                                    individualRecord = form.data[0];
                                    outputCollection[0] = 'Success';
                                    outputCollection[1] = 'The user data, site data, and form record were successfully returned.';
                                    outputCollection[2] = userData;
                                    outputCollection[3] = siteData;
                                    outputCollection[4] = individualRecord;
                                    return response.json(200, outputCollection);
                                }
                                else {
                                    if (form.data.length == 0)
                                        throw Error('There was no individual record found associated with this email address.');
                                    else
                                        throw Error('There were multiple individual records found associated with this email address.');
                                }
                            }
                            else {
                                throw Error('There was an error when pulling the individual record associated with this user.');
                            }
                        });
                    }
                }
                else {
                    throw Error('Find site function call worked, but there was no sites found for the user.');
                }
            }
            else {
                throw Error('Error when attempting to find the site for this user.');
            }
        }).catch(function (exception) {
            //Error catching, will send the user the error message
            logger.info(exception);
            outputCollection[0] = 'Error';
            outputCollection[1] = (exception.message);
            return response.json(200, outputCollection);
        })
}
