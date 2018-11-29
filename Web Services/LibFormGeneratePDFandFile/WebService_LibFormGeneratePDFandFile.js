
//The following is a snippet of code that would come from a NodeJS script to call the LibFormGeneratePDFandFile library script

//Populate index field data
var indexFields = [];

var indexField = {};
indexField.name = "VisualVault Case ID";
indexField.value = referralData['case ID']; //Case Face Sheet
indexFields.push(indexField);

indexField = {};
indexField.name = "Case Name"; //Required
indexField.value = referralData['case Name']; //Referral
indexFields.push(indexField);

indexField = {};
indexField.name = "Document Section"; //Required
indexField.value = "Medical/Mental Health/Substance";
indexFields.push(indexField);

indexField = {};
indexField.name = "Document Type"; //Required
indexField.value = "Assessment";
indexFields.push(indexField);

indexField = {};
indexField.name = "Quality Checked"; //Required
indexField.value = "Yes";
indexFields.push(indexField);

indexField = {};
indexField.name = "County or Record Room";
indexField.value = "";
indexFields.push(indexField);


//Variable that will be passed to the web service.
var generatePDFdata = [];

var formIdObj = {};
formIdObj.name = 'formId';
formIdObj.value = referralData['referralDhDocID'];
generatePDFdata.push(formIdObj);

var formTemplateIdObj = {};
formTemplateIdObj.name = 'formTemplateId';
formTemplateIdObj.value = ReferralTemplateID;
generatePDFdata.push(formTemplateIdObj);

var formIdObj = {};
formIdObj.name = 'revisionId';
formIdObj.value = referralData['referralDhID'];
generatePDFdata.push(formIdObj);

var formIdObj = {};
formIdObj.name = 'folderPath';
formIdObj.value = clientRecordsFolderPath + "/" + referralData['case ID'];
generatePDFdata.push(formIdObj);

var indexFieldObj = {};
indexFieldObj.name = 'indexFields';
indexFieldObj.value = indexFields;
generatePDFdata.push(indexFieldObj);

return vvClient.scripts.runWebService('LibFormGeneratePDFandFile', generatePDFdata).then(function (generatePDFResp) {
    var generateSuccessful = false;

    if (generatePDFResp.meta.status === 200) {
        if (generatePDFResp[0] === "Success") {
            logger.info("GeneratePDFandFile returned with successful status message.");

            if (generatePDFResp[2]) {
                //Success with error should add the error message to the list of errors
                errors.push(referralData['referralDhDocID'] + ": " + generatePDFResp[1]);
            }

            generateSuccessful = true;
        } else {
            //Response should be "Error" if it is not a success. Push the statusMessage into the list of errors and increment the error count
            logger.info("GeneratePDFandFile returned with an error status message.");

            errors.push(referralData['referralDhDocID'] + ": " + generatePDFResp[1]);
            errorCount++;
        }
    } else {
        logger.info("Call to run GeneratePDFandFile service returned with an error.");

        errors.push("Call to run GeneratePDFandFile service returned with an error.");
        errorCount++;
    }

    return generateSuccessful;
})
