let logger = require('../log');

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
    /*Script Name:  LibFormGeneratePDFandFile
     Customer:      VisualVault
     Purpose:       This process will create a pdf of a form, upload the pdf to a folder (creating the folder structure if it does not exist) and update index fields
     Special Note:  Please note that if the Folder Path does not exist, do NOT create a root folder using this API call.
                    For example, if creating path 'Main/Documents/Items/', the 'Main' folder must already be
                    created in the system. This is due to the nature of the create folder API call, as there is no place to create index fields.
                    Please create the parent/root folders and set up index fields and security prior to calling this process. The child folders under the parent
                    folder will inherit the index fields and security properties of the parent form.
     Parameters:    The following represent variables passed into the function:
                    Form ID - (string, Required) form ID of the record to print to PDF.
                    Form Template ID - (string, Required) guid of the template that should be printed. Can be the actual GUID of the template or the template name (i.e. 'My Template')
                    Revision ID - (string, Required) revision ID of the record to print to PDF.
                    Folder Path - (string, Required) folder path in the document library where the PDF will be stored.
                    Index Fields - (array of objects, Optional) index fields that should be populated.
                    Document Name - (string, Required) file name of the PDF that will be created in the system (.pdf is automatically appended to this name).
                    Sample params:
                    let paramObject = [
                        { name: 'Form ID', value: 'FORMID-00000012' },
                        { name: 'Form Template ID', value: 'Form' }, (can also be GUID instead)
                        { name: 'Revision ID', value: 'f4b78690-230b-4949-9e0d-484bdc664f7c' },
                        { name: 'Document Name', value: 'Title Of My Document' },
                        { name: 'Folder Path', value: '/Custom/Folder/Path' },
                        { name: 'Index Fields', value: [
                            { name: 'Index Field 1', value: 'Some stuff' },
                            { name: 'Sample Index', value: 'More stuff' }
                        ]}
                    ];
                    // Call script here
     Pseudo Code:
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
                     0 - Status: 'Success', 'Error', or 'Minor Errors'
                     1 - Message
                     2 - Error array of minor errors if they are present, otherwise an empty array object
                     3 - Object housing the id, fileid, and docid of the generated PDF
     Date of Dev:   11/12/2017
     Last Rev Date: 07/30/2020
     
     Revision Notes:
     11/12/2017 - Austin Noel: Initial creation of the business process.
     02/07/2018 - Austin Noel: Added hasError property on the return object to more easily distinguish when the PDF may have been generated successfully, but an error still occurred during the process
     12/10/2019 - Kendra Austin: Update header info. 
     07/24/2020 - Miroslav Sanader: Update the script to be async and also handle the form template ID to be a string instead of a GUID
     07/29/2020 - Miroslav Sanader: Update parameters, fix up some of the comments at the top of the script, and also relocate the helper function
     07/30/2020 - Miroslav Sanader: Update return parameters to be an object instead of simply array items
     */

    logger.info('Start of the process LibFormGeneratePDFandFile at ' + Date());

    // Configurable variable
    const regex = RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);    // GUID regex
    let automatedChangeReason = 'Automated PDF update upon creation.';                                      // Automated message for PDF revision
    let releasedState = 'Released';                                                                         // Released State for documents

    //Script variables
    let outputCollection = [];                                                                              // Response array
    let aggregateErrors = [];                                                                               // Final error array
    let errorArray = [];                                                                                    // Error array for reporting
    let folderID = '';                                                                                      // The folder ID path if it was created
    let createdDocID = '';                                                                                  // The document ID that will house the PDF
    let createdDocName = '';                                                                                // Created document name
    let CurrentRevisionGUID = '';                                                                           // GUID for IFSP Form
    let createdfolderID = '';                                                                               // Folder ID that the PDF is created in
    let indexData = {};                                                                                     // Index fields to stringify
    let hasIndexFields = false;                                                                             // Flag indicating if there are index fields
    let createdPDFDocId = '';                                                                               // PDF Document ID
    let createdPDFId = '';                                                                                  // PDF ID
    let createdPDFFileId = '';                                                                              // PDF File ID

    //Create variables for the values on the form record
    let FormID = ffCollection.getFormFieldByName('Form ID');
    let RevisionID = ffCollection.getFormFieldByName('Revision ID');
    let FormTemplateID = ffCollection.getFormFieldByName('Form Template ID');
    let FolderPath = ffCollection.getFormFieldByName('Folder Path');
    let IndexFields = ffCollection.getFormFieldByName('Index Fields');
    let DocName = ffCollection.getFormFieldByName('Document Name');

    try {
        // Async helper function to create a folder
        let createFolder = async function () {
            // Define an empty description until demo is updated with a bug fix (Changeset 15770)
            let createFolderParam = {
                description: ""
            };

            // Call the post folder function
            let postFolderCall = await vvClient.library.postFolderByPath(null, createFolderParam, FolderPath.value);
            let createFolderData = postFolderCall.hasOwnProperty('data') ? postFolderCall.data : null;

            // Do as many checks as possible prior to pulling out the folder information
            if (postFolderCall.meta.errors) { throw new Error(`There was an error when attempting to create the folder. ${postFolderCall.meta.errors[0].message}`) }
            if (postFolderCall.meta.status != 200) { throw new Error(`Invalid status of ${postFolderCall.meta.status} returned when attempting to create the folder.`) }
            if (!createFolderData) { throw new Error(`A folder with the path of ${FolderPath.value} was unable to be created.`) }

            logger.info(`Folder ${FolderPath.value} created successfully. ID: ${postFolderCall.data.id}`);

            createdfolderID = postFolderCall.data.id;
            return createdfolderID;
        };

        // Validate parameters
        if (!FormID || !FormID.value) { errorArray.push('Form ID'); }
        if (!RevisionID || !RevisionID.value) { errorArray.push('Revision ID'); }
        if (!FormTemplateID || !FormTemplateID.value) { errorArray.push('Form Template ID'); }
        if (!FolderPath || !FolderPath.value) { errorArray.push('Folder Path'); }
        if (!DocName || !DocName.value) { errorArray.push('Document Name'); };

        // Check to see if index fields is an array
        if (IndexFields && IndexFields.value) {
            if (Array.isArray(IndexFields.value)) {
                if (IndexFields.value.length) { hasIndexFields = true; }
            }
            else {
                errorArray.push('Index Fields')
            }
        }

        // If any fields are invalid, throw an error
        if (errorArray.length > 0) { throw new Error(`The following parameters are either missing or invalid: ${errorArray.join(', ')}`); }

        // Get the folder path if it exists
        let folderParams = {
            folderpath: FolderPath.value
        };
        let getFolders = await vvClient.library.getFolders(folderParams);
        getFolders = JSON.parse(getFolders);
        let folderData = getFolders.hasOwnProperty('data') ? getFolders.data : null;

        if (getFolders.meta.status == 200) {
            // Ensure that data is present, and if not, create the folder
            if (folderData) { folderID = folderData.id; }
            else { folderID = await createFolder(); }
        }
        else if (getFolders.meta.status == 403) {
            // Folder doesn't exist, so we must create it
            folderID = await createFolder();
        }
        else { throw new Error(`An error occurred when attempting to create or get the folder with the file path of ${FolderPath.value}.`) }

        if (hasIndexFields) {
            // Check the index fields defined on the folder and making sure we have all the index fields passed into the request accounted for. If any are missing, return an error and stop the process.
            logger.info("Retrieving folder index fields.");
            let getIndexFieldParams = {};
            let getIndexFields = await vvClient.library.getFolderIndexFields(getIndexFieldParams, folderID);
            getIndexFields = JSON.parse(getIndexFields);

            if (getIndexFields.meta.errors) { throw new Error(`The call to retrieve folder index fields returned with an error: ${folderIndexFieldData.meta.errors[0].message}`); }
            if (getIndexFields.meta.status != 200) { throw new Error(`The call to retrieve folder index field data returned with an unsuccessful status code.`) }
            if (!getIndexFields.hasOwnProperty('data')) { throw new Error(`No data was returned when attempting to retrieve index fields`); }


            logger.info("Folder index fields retrieved successfully. Verifying passed in index fields exist on the folder.")
            //Folder index fields retrieved successfully. Check to make sure each index field passed in with the request exists on the folder
            IndexFields.value.forEach(function (indexField) {
                if (!getIndexFields.data.find(function (folderIndexField) {
                    //We have a match if the passed in index field name matches a folder index field's label (case-insensitive)
                    return folderIndexField.label.toLowerCase() === indexField.name.toLowerCase();
                })) {
                    aggregateErrors.push(`The passed in index field ${indexField.name} does not exist on the folder.`);
                }
            });

            if (aggregateErrors.length) {
                throw new Error(aggregateErrors);
            }
        }

        // Test to see if the passed in template ID was a GUID
        // If not, pull the latest GUID of the most recent template revision, otherwise proceed
        if (!regex.test(FormTemplateID.value)) {
            logger.info('Retrieving latest revision ID of the current form template.')
            // Now get the current GUID of the latest released form
            let getTemplateId = await vvClient.forms.getFormTemplateIdByName(FormTemplateID.value);
            CurrentRevisionGUID = getTemplateId.hasOwnProperty('templateIdGuid') ? getTemplateId.templateIdGuid : null;

            if (!CurrentRevisionGUID) { throw new Error(`Unable to find template name ${FormTemplateID.value} in the system.`) }
        }
        else
            CurrentRevisionGUID = FormTemplateID.value;

        // Make the call to generate a PDF version of the current form revision    
        let pdfBuffer = await vvClient.forms.getFormInstancePDF(CurrentRevisionGUID, RevisionID.value);

        if (!pdfBuffer || !pdfBuffer.length) { throw new Error(`Unable to generate a PDF version of this template.`) }
        logger.info(`${FormID.value} PDF generated.`);

        logger.info('Creating the document.');
        let docParams = {
            'documentState': 1,
            'name': DocName.value,
            'description': DocName.value,
            'revision': '0',
            'allowNoFile': true,
            'fileLength': 0,
            'fileName': `${DocName.value}.pdf`,
            'indexFields': '{}',
            'folderId': `${folderID}`
        };

        // Stringify the Index fields if they exist
        if (hasIndexFields) {
            IndexFields.value.forEach(function (item) {
                indexData[item.name] = item.value;
            });

            docParams['indexFields'] = JSON.stringify(indexData);
        }

        logger.info('Posting the document.');
        // Post a document first to ensure that the PDF has a location to be in
        let postDoc = await vvClient.documents.postDoc(docParams);
        let postData = postDoc.hasOwnProperty('data') ? postDoc.data : null;

        if (postDoc.meta.errors) { throw new Error(`The call to create the document returned with an error: ${docResp.meta.errors[0].message}`) }
        if (postDoc.meta.status != 200) { throw new Error(`An error occurred when attempting to create the document that houses this PDF.`) }
        if (!postData) { throw new Error(`No data was returned when attempting to create the document location to house the PDF.`) }

        createdDocID = postData.documentId;
        createdDocName = postData.name;

        logger.info(`Checking in pdf file to document ${createdDocName}.`);
        // Now we can check in the PDF into the document
        //Check in file to document
        let fileParams = {
            'documentId': createdDocID,
            'name': createdDocName,
            'revision': '1',
            'changeReason': automatedChangeReason,
            'checkInDocumentState': releasedState,
            'fileName': `${DocName.value}.pdf`,
            'indexFields': JSON.stringify(indexData)
        };

        let postPDF = await vvClient.files.postFile(fileParams, pdfBuffer);
        postPDF = JSON.parse(postPDF);
        let postPDFData = postPDF.hasOwnProperty('data') ? postPDF.data : null;

        if (postPDF.meta.errors) { throw new Error(`The call to update the PDF returned with an error: ${postPDF.meta.errors[0].message}`) }
        if (postPDF.meta.status != 200) { throw new Error(`An error occurred when attempting to update the ${DocName.value} PDF.`) }
        if (!postPDFData) { throw new Error(`No data was returned when attempting to update the created PDF with the name ${DocName.value}.`) }

        logger.info("File uploaded successfully.");
        createdDocName = postPDFData.name;
        createdPDFDocId = postPDFData.documentId;
        createdPDFId = postPDFData.id;
        createdPDFFileId = postPDFData.fileId;

        logger.info("Relating document to the form instance.");
        // Relate created document
        let relatePDF = await vvClient.forms.relateDocumentByDocId(RevisionID.value, createdDocName);
        relatePDF = JSON.parse(relatePDF);

        // No need to throw errors
        if (relatePDF.meta.errors) { aggregateErrors.push(`The call to relate the PDF to ${FormId.value} returned with an error: ${relatePDF.meta.errors[0].message}`) }
        if (relatePDF.meta.status != 200) { aggregateErrors.push(`An error occurred when attempting to relate the created PDF to ${FormId.value}.`) }
        logger.info("Document related to form successfully.");

        if (!aggregateErrors.length) {
            outputCollection[0] = 'Success';
            outputCollection[1] = 'The PDF file was generated successfully.';
            outputCollection[2] = [];
        }
        else {
            logger.info(JSON.stringify(aggregateErrors))
            outputCollection[0] = 'Minor Errors';
            outputCollection[1] = 'PDF was successfully generated, but errors occurred along the way.';
            outputCollection[2] = aggregateErrors;
        }

        outputCollection[3] = {
            id: createdPDFId,
            fileid: createdPDFFileId,
            docid: createdPDFDocId
        };
    }
    catch (exception) {
        // Log errors captured.
        logger.info(JSON.stringify(exception))
        outputCollection[0] = 'Error'
        outputCollection[1] = exception.message
        outputCollection[2] = []
    }
    finally {
        response.json(200, outputCollection);
    }
}
