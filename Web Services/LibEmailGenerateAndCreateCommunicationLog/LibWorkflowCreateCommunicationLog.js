var logger = require("../log");

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
  /*Script Name:   LibWorkflowCreateCommunicationLog
     Customer:      VisualVault
     Purpose:       The purpose of this script is to create communication logs from the VisualVault V5 workflow engine, microservice task.
     Parameters:    The following are parameters that need to be passed into this libarary node script.
                    1. EmailTemplateName - (string, required) This is the name of the email template that will be used.
                    2. SendDateTime - (datetime, optional) This is the date and time when the communication should occur.
                    3. ToEmail - (string, required) Any parameter passed in that starts with Email will be added into the list of email addresses.
                    4. CCEmail - (string, optional) Any parameter passed in that starts with CCEmail will be added into the list of carbon copy email addresses.
                    5. Token -   (string, optional) Any parameter passed in that starts with Token will be added to the token array.  Name of the token must be the token in the email
                                  template.  The value will be made an object with the token name.
                    6. RelateTo - (string, optional) Any parameter passed in that starts with RelateTo will be Form ID of each form record where the communication log should be related.
                    7. Primary Record ID (string, required) This is the Form ID of the primary record for this communication log.
                    8. Other Record (string, optional) This is the Form ID of an other record that this communication represents.  

     Return Object:
                    1. MicroserviceResult - Return true if process ran successfully.  Return false if an error occurred.
                    2. MicroserviceMessage - Message about what happened.
     Psuedo code: 
                    1. Acquire the items from the workflow variable collection (ffCollection) that are static.
                    2. Read through form workflow variable collection (ffCollection) to extract dynamic variables to load objects needed for the library to create comm log.
                    3. Call LibEmailGenerateAndCreateCommunicationLog to create the communication log.
     Date of Dev:   07/22/2021
     Last Rev Date: 

     Revision Notes:
     07/22/2021 - Jason Hatch:  First Setup of the script
     */

  logger.info("Start of the process LibWorkflowCreateCommunicationLog at " + Date());

  //respond immediately before the "processing"
  response.json(200, { success: true, message: "Process started successfully." });

  try {
    //Script Configuration variables

    //Script variables.
    var executionId = response.req.headers["vv-execution-id"]; //Execution ID is needed from the http header in order to help VV identify which workflow item/microservice is complete.

    let errorMessageGuidance = "Please try to End Provider Relationship again, or contact a system administrator if this problem continues.";
    let missingFieldGuidance = "Please provide a value for the missing field and try again, or contact a system administrator if this problem continues.";

    var errorLog = [];
    let emailListArr = [];
    let ccemailListArr = [];
    let tokenArr = [];
    let relateToArr = [];

    //HELPER FUNCTIONS START

    // Check if field object has a value property and that value is truthy before returning value.
    function getFieldValueByName(fieldName, isOptional) {
      try {
        let fieldObj = ffCollection.getFormFieldByName(fieldName);
        let fieldValue = fieldObj && (fieldObj.hasOwnProperty("value") ? fieldObj.value : null);

        if (!isOptional && fieldValue === null) {
          throw new Error(`A value property for ${fieldName} was not found.`);
        }
        if (!isOptional && !fieldValue) {
          throw new Error(`A value for ${fieldName} was not provided.`);
        }
        return fieldValue;
      } catch (error) {
        errorLog.push(error);
      }
    }

    //HELPER FUNCTIONS END

    //Get collection of information in the passed in objects.  Using true after means it is optional
    let emailTemplateName = getFieldValueByName("EmailTemplateName");
    let sendDateTime = getFieldValueByName("SendDateTime", true);
    let primaryRecordID = getFieldValueByName("Primary Record ID", true);
    let otherRecordID = getFieldValueByName("Other Record", true);

    //Go through ffCollection to extract workflow variables that match each of the parameters to build the communication log.
    for (var a = 0; a < ffCollection._ffColl.length; a++) {
      //Match the emails passed in.
      if (ffCollection._ffColl[a].name.match(/ToEmail.*/)) {
        if (ffCollection._ffColl[a].value.trim().length > 0) {
          emailListArr.push(ffCollection._ffColl[a].value);
        }
      }

      //Match CCemails to load the cc list.
      if (ffCollection._ffColl[a].name.match(/CCEmail.*/)) {
        if (ffCollection._ffColl[a].value.trim().length > 0) {
          ccemailListArr.push(ffCollection._ffColl[a].value);
        }
      }

      //Load tokens
      if (ffCollection._ffColl[a].name.match(/Token.*/)) {
        let loadTokenObj = {};
        loadTokenObj.name = "[" + ffCollection._ffColl[a].name + "]";
        loadTokenObj.value = ffCollection._ffColl[a].value;
        tokenArr.push(loadTokenObj);
      }

      //Load RelateTo
      if (ffCollection._ffColl[a].name.match(/RelateTo.*/)) {
        if (ffCollection._ffColl[a].value.trim().length > 0) {
          relateToArr.push(ffCollection._ffColl[a].value);
        }
      }
    }

    //Email addresses are not required in the LibEmailGenerateAndCreateCommunicationLog because they may be hard coded.  Not requiring here.
    // if (emailListArr.length == 0) {
    //   errorLog.push('No email addresses present for sending the email.');
    // }

    // Specific fields are detailed in the errorLog sent in the response to the client.
    if (errorLog.length > 0) {
      throw new Error(`${missingFieldGuidance}`);
    }

    //Prepare object to call the LibEmailGenerateAndCreateCommunicationLog library
    let emailRequestArr = [
      { name: "Email Name", value: emailTemplateName },
      { name: "Tokens", value: tokenArr },
      { name: "Email Address", value: emailListArr.join(",") },
      { name: "Email AddressCC", value: ccemailListArr.join(",") },
      { name: "SendDateTime", value: sendDateTime },
      { name: "RELATETORECORD", value: relateToArr },
      {
        name: "OTHERFIELDSTOUPDATE",
        value: {
          "Primary Record ID": primaryRecordID,
          "Other Record": otherRecordID,
        },
      },
    ];

    let emailCommLogResp = await vvClient.scripts.runWebService("LibEmailGenerateAndCreateCommunicationLog", emailRequestArr);
    let emailCommLogData = emailCommLogResp.hasOwnProperty("data") ? emailCommLogResp.data : null;

    if (emailCommLogResp.meta.status !== 200) {
      throw new Error(`There was an error when calling LibEmailGenerateAndCreateCommunicationLog. ${errorMessageGuidance}`);
    }
    if (!emailCommLogData || !Array.isArray(emailCommLogData)) {
      throw new Error(`Data was not returned when calling LibEmailGenerateAndCreateCommunicationLog. ${errorMessageGuidance}`);
    }
    if (emailCommLogData[0] === "Error") {
      throw new Error(`The call to LibEmailGenerateAndCreateCommunicationLog returned with an error. ${emailCommLogData[1]}. ${errorMessageGuidance}`);
    }
    if (emailCommLogData[0] !== "Success") {
      throw new Error(`The call to LibEmailGenerateAndCreateCommunicationLog returned with an unhandled error. ${errorMessageGuidance}`);
    }

    //Create the following object that will be used when the api call is made to communicate the workflow item is complete.
    //First two items of the object are required to tell if the process completed successfully and the message that should be returned.
    //The other items in the object would have the name of any workflow variable that would be updated with data coming from the microservice/node script.
    var variableUpdates = {
      MicroserviceResult: true,
      MicroserviceMessage: "Communication Log created for Microservice workflow task.",
    };

    //Following api call tells VV that the workflow items is complete.
    var completeResp = await vvClient.scripts.completeWorkflowWebService(executionId, variableUpdates);

    //Following log if the complete was successful or not to the log server. This helps to track down what occurred when a microservice completed.
    if (completeResp.meta.status == 200) {
      logger.info("Completion signaled to WF engine successfully.");
    } else {
      logger.info("There was an error signaling WF completion.");
    }
  } catch (err) {
    logger.info("Error encountered" + err);
    let errorToReturn = err;

    if (errorLog.length > 0) {
      logger.info(JSON.stringify(`${err} ${errorLog}`));
      errorToReturn = errorToReturn + "; " + `${errorLog}`;
    }

    var variableUpdates = {
      MicroserviceResult: false,
      MicroserviceMessage: errorToReturn,
    };

    var completeResp = await vvClient.scripts.completeWorkflowWebService(executionId, variableUpdates);
    if (completeResp.meta.status == 200) {
      logger.info("Completion signaled to WF engine successfully.");
    } else {
      logger.info("There was an error signaling WF completion.");
    }
  }
};
