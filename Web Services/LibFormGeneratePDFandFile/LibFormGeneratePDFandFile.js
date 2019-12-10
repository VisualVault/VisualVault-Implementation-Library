var vvEntities = require("../VVRestApi");
var logger = require('../log');

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
    /*Script Name:  LibFormGeneratePDFandFile
     Customer:      VisualVault
     Purpose:       This process will create a pdf of a form, upload the pdf to a folder (creating the folder structure if it does not exist) and update index fields
     Parameters:    The following represent variables passed into the function:
                    formId - (string, Required) Form ID of the current form record. Used to load the ID and Description of the document.
                    formTemplateId - (string, Required) GUID of the form template relating to the form record that will be converted to PDF.
                    revisionId - (string, Required) GUID of the current form record.
                    folderPath - (string, Required) folder path in the document library where the PDF will be stored.
                    indexFields - (array of objects, Required) index fields that should be populated.

                    Example format:
                    var generatePDFdata = [];

                    var formIdObj = {};
                    formIdObj.name = 'formId';
                    formIdObj.value = FormID;
                    generatePDFdata.push(formIdObj);

                    var formTemplateIdObj = {};
                    formTemplateIdObj.name = 'formTemplateId';
                    formTemplateIdObj.value = IDCardTemplateGUID;
                    generatePDFdata.push(formTemplateIdObj);

                    var formIdObj = {};
                    formIdObj.name = 'revisionId';
                    formIdObj.value = RevisionID;
                    generatePDFdata.push(formIdObj);

                    var formIdObj = {};
                    formIdObj.name = 'folderPath';
                    formIdObj.value = CardType + '/' + getAlphabeticalFolder(LastName) + '/' + LastName + ', ' + FirstName + ' - ' + DOB;
                    generatePDFdata.push(formIdObj);

                    //Populate index field data
                    var indexFields = [];

                    indexField = {};
                    indexField.name = "First Name";
                    indexField.value = FirstName;
                    indexFields.push(indexField);

                    indexField = {};
                    indexField.name = "Last Name";
                    indexField.value = LastName;
                    indexFields.push(indexField);

                    var indexFieldObj = {};
                    indexFieldObj.name = 'indexFields';
                    indexFieldObj.value = indexFields;
                    generatePDFdata.push(indexFieldObj);

                    return vvClient.scripts.runWebService('LibFormGeneratePDFandFile', generatePDFdata)

     Process PseudoCode:
                    1. Validate information passed into the function.
                    2. Get the folder path where the PDF should be stored.
                    3. Create the folder if it does not exist.
                    4. Get the index fields for the folder to make sure it matches items passed into this function.
                    5. Call getFormInstancePDF with the form template GUID and Revision ID of the form to create a PDF.
                    6. Create a document place holder with index fields in the target forlder path.
                    7. Upload the PDF of the form using postFile
                    8. Relate the document to the form it originated from.
                    9. Respond back to the calling function with success or failure.
     Return Array:  The following represents the array of information returned to the calling function.  This is a standardized response.
                     Any item in the array at points 2 or above can be used to return multiple items of information.
                     0 - Status: 'Success' or 'Error'
                     1 - Message
                     2 - If an error occurred.
     Date of Dev:   11/12/2017
     Last Rev Date: 12/10/2019
     
     Revision Notes:
     11/12/2017 - Austin Noel: Initial creation of the business process.
     02/07/2018 - Austin Noel: Added hasError property on the return object to more easily distinguish when the PDF may have been generated successfully, but an error still occurred during the process
     12/10/2019 - Kendra Austin: Update header info. 
     */

    logger.info('Start of the process LibFormGeneratePDFandFile at ' + Date());
    var Q = require('q');

    //Initialization of the return object
    var returnObj = {};

    //Initialization of the script variables
    var formId = null;
    var formTemplateId = null;
    var revisionId = null;
    var folderPath = null;
    var indexFields = null;

    var errorMessage = "";
    var folderId = null;
    var newDocId = null;
    var newDhId = null;
    var fileBuffer = null;

    //Function definitions
    var createNewFolder = function (newFolderPath) {
        var createFolderParams = {};
        createFolderParams.description = ""; //Explicity define an empty description here until demo is updated with a bug fix (Changeset 15770)
        return vvClient.library.postFolderByPath(null, createFolderParams, folderPath.value).then(function (createFolderResp) {
            //var createFolderData = JSON.parse(createFolderResp);
            if (createFolderResp.meta.errors) {
                //Error returned
                throw new Error("The call to create new folder returned with an error: " + createFolderResp.meta.errors[0].message);
            } else if (createFolderResp.meta.status == 200) {
                //Folder Create successful - Record the folderId
                logger.info("Folder created successfully.");

                folderId = createFolderResp.data.id;
                return folderId;
            } else {
                throw new Error("The call to create new folder returned with an unsuccessful status code.");
            }
        });
    }

    var result = Q.resolve();

    return result.then(function () {
        logger.info("Extracting and validating passed in fields");

        //Extract and validate the passed in parameters
        formId = ffCollection.getFormFieldByName('formId');
        formTemplateId = ffCollection.getFormFieldByName('formTemplateId');
        revisionId = ffCollection.getFormFieldByName('revisionId');
        folderPath = ffCollection.getFormFieldByName('folderPath');
        //folderName = ffCollection.getFormFieldByName('folderName');
        indexFields = ffCollection.getFormFieldByName('indexFields');

        if (!formId || !formId.value) {
            throw new Error("The 'formId' parameter was not supplied or had an invalid value");
        } else if (!formTemplateId || !formTemplateId.value) {
            throw new Error("The 'formTemplateId' parameter was not supplied or had an invalid value");
        } else if (!revisionId || !revisionId.value) {
            throw new Error("The 'revisionId' parameter was not supplied or had an invalid value");
        } else if (!folderPath || !folderPath.value) {
            throw new Error("The 'folderPath' parameter was not supplied or had an invalid value");
            // } else if (!folderName || !folderName.value) {
            //     throw new Error("The 'folderName' parameter was not supplied or had an invalid value");
        } else if (!indexFields || !indexFields.value) {
            throw new Error("The 'indexFields' parameter was not supplied or had an invalid value");
        }

        logger.info("Retrieving folder: " + folderPath.value);

        //Make request to retrieve the folder
        var folderParams = {};
        folderParams.folderpath = folderPath.value;
        return vvClient.library.getFolders(folderParams).then(function (folderResp) {
            //Check if the folder was returned. If it did, proceed. Otherwise, create the folder (handle the success checking in this function as well).
            var folderData = JSON.parse(folderResp)
            if (folderData.meta.status == 200) {
                if (folderData.data) {
                    //Folder exists - Record the folderId                     
                    logger.info("Folder already exists.");

                    folderId = folderData.data.id;
                    return folderId;
                } else {
                    //If the API endpoint returns a '200' status with no results, try to create the new folder
                    logger.info("The getFolder request returned a successful status, but no data. Assuming folder does not exist and attempting to create new folder.");
                    return createNewFolder(folderPath.value);
                }
            } else if (folderData.meta.status == 403) {
                //"Get folder" endpoint will return a 403 (Forbidden) if folder was not found, so assume folder does not exist. Create a new folder.
                logger.info("Folder does not exist. Attempting to create new folder.");
                return createNewFolder(folderPath.value);
            } else {
                throw new Error("The call to get folder returned with an unsuccessful status code.");
            }
        });
    })
        .then(function () {
            //Check the index fields defined on the folder and making sure we have all the index fields passed into the request accounted for. If any are missing, return an error and stop the process.
            logger.info("Retrieving folder index fields.");

            var getIndexFieldParams = {};
            return vvClient.library.getFolderIndexFields(getIndexFieldParams, folderId).then(function (indexFieldsResp) {
                var folderIndexFieldData = JSON.parse(indexFieldsResp);
                if (folderIndexFieldData.meta.errors) {
                    //Error returned
                    throw new Error("The call to retrieve folder index fields returned with an error: " + folderIndexFieldData.meta.errors[0].message);
                } else if (folderIndexFieldData.meta.status == 200) {
                    logger.info("Folder index fields retrieved successfully. Verifying passed in index fields exist on the folder.")
                    //Folder index fields retrieved successfully. Check to make sure each index field passed in with the request exists on the folder
                    indexFields.value.forEach(function (indexField) {
                        if (!folderIndexFieldData.data.find(function (folderIndexField) {
                            //We have a match if the passed in index field name matches a folder index field's label (case-insensitive)
                            return folderIndexField.label.toLowerCase() === indexField.name.toLowerCase();
                        })) {
                            throw new Error("The passed in index field '" + indexField.name + "' does not exist on the folder.");
                        }
                    });

                    //If the code reaches this point without throwing an error, all the passed in index fields exist on the folder
                    logger.info("All index fields exist on the folder.");
                    return true;
                } else {
                    throw new Error("The call to retrieve folder index field data returned with an unsuccessful status code.");
                }
            });
        })
        .then(function () {
            //Generate the PDF
            logger.info("Generating the pdf file data.");

            return vvClient.forms.getFormInstancePDF(formTemplateId.value, revisionId.value).then(function (bytes) {
                if (bytes && bytes.length > 0) {
                    logger.info("Pdf file data generated.")
                    fileBuffer = bytes;
                    return bytes;
                } else {
                    throw new Error("Call to get pdf of form returned with no data.");
                }
            })
                .catch(function (err) {
                    //This function will throw an exception if there's a problem getting the pdf data. Add a more meaningful message and throw the error.
                    throw new Error("The call to get pdf of form returned with an error. " + err.message);
                });
        })
        .then(function () {
            //Create the document that will contain the file
            logger.info("Creating new document.");

            //TODO: Consider making file/document name a passed in value?
            var docParams = {};
            docParams['folderId'] = folderId;
            docParams['documentState'] = 1;
            docParams['name'] = formId.value;
            docParams['description'] = formId.value;
            docParams['revision'] = '0';
            docParams['allowNoFile'] = true;
            docParams['fileLength'] = 0;
            docParams['fileName'] = formId.value + '.pdf';

            docParams['indexFields'] = '{}';
            if (indexFields.value && indexFields.value.length > 0) {
                //Convert the index fields array into object properties
                var indexFieldData = {};
                indexFields.value.forEach(function (indexField) {
                    indexFieldData[indexField.name] = indexField.value;
                })

                docParams['indexFields'] = JSON.stringify(indexFieldData);
            }

            return vvClient.documents.postDoc(docParams).then(function (docResp) {
                if (docResp.meta.errors) {
                    throw new Error("The call to create document returned with an error: " + docResp.meta.errors[0].message);
                } else if (docResp.meta.status == 200) {
                    if (docResp.data) {
                        logger.info("Document created successfully.");

                        newDocId = docResp.data.documentId;
                        return docResp.data.name;
                    } else {
                        //Ideally, this situation should not be hit, as the server would have to give a successful status code, but return no document object
                        throw new Error("The call to create document returned with a successful status code, but no document data.");
                    }
                } else {
                    throw new Error("The call to create document returned with an unsuccessful status code.");
                }
            });
        })
        .then(function (docName) {
            //Check in the pdf file to the new document that was created
            logger.info("Checking in pdf file to document '" + docName + "'.");



            //Check in file to document
            var fileParams = {};
            fileParams['documentId'] = newDocId;
            fileParams['name'] = docName;
            fileParams['revision'] = '1';
            fileParams['changeReason'] = 'Automatic PDF Generation and Upload';
            fileParams['checkInDocumentState'] = 'Released';
            fileParams['fileName'] = docName + '.pdf';

            fileParams['indexFields'] = '{}';
            if (indexFields.value && indexFields.value.length > 0) {
                //Convert the index fields array into object properties
                var indexFieldData = {};
                indexFields.value.forEach(function (indexField) {
                    indexFieldData[indexField.name] = indexField.value;
                })

                fileParams['indexFields'] = JSON.stringify(indexFieldData);
            }

            return vvClient.files.postFile(fileParams, fileBuffer).then(function (fileResp) {
                var fileData = JSON.parse(fileResp);

                if (fileData.meta.errors) {
                    throw new Error("The call to upload file returned with an error: " + fileData.meta.errors[0].message);
                } else if (fileData.meta.status == 200) {
                    if (fileData.data) {
                        logger.info("File uploaded successfully.");

                        newDocName = fileData.data.name;
                        return newDocName;
                    } else {
                        //Ideally, this situation should not be hit, as the server would have to give a successful status code, but return no document object
                        throw new Error("The call to upload file returned with a successful status code, but no document data.");
                    }
                } else {
                    throw new Error("The call to create document returned with an unsuccessful status code.");
                }
            });
        })
        .then(function (newDocName) {
            //Relate document to the form instance
            logger.info("Relating document to the form instance.");

            return vvClient.forms.relateDocumentByDocId(revisionId.value, newDocName).then(function (relateResp) {
                var relateData = JSON.parse(relateResp);

                //Do not throw errors if things go wrong at this point, since we need to return a successful status code regardless of relation status. Just record the error message here.
                if (relateData.meta.errors) {
                    errorMessage = "The call to relate document to the form instance returned with an error: " + relateData.meta.errors[0].message;
                    logger.info(errorMessage);
                } else if (relateData.meta.status == 200) {
                    logger.info("Document related to form successfully.");
                } else {
                    errorMessage = "The call to relate document to form returned with an unsuccessful status code.";
                    logger.info(errorMessage);
                }
            });
        })
        .then(function () {
            returnObj[0] = "Success";

            if (errorMessage) {
                returnObj[2] = true;
                returnObj[1] = "The pdf file was generated successfully, but there was an error. " + errorMessage;
            } else {
                returnObj[2] = false;
                returnObj[1] = "The pdf file was generated successfully.";
            }

            //Return the response object
            return response.json(returnObj);
        })
        .catch(function (err) {
            logger.info(JSON.stringify(err));

            returnObj[0] = "Error";
            //returnObj.hasError = true;

            if (err && err.message) {
                returnObj[1] = err.message;
            } else {
                returnObj[1] = "An error has occurred";
            }

            return response.json(returnObj);
        });


}   
