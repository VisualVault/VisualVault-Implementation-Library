/*
    Script Name:   RRCGetSelectedItemsfromFormButton
    Customer:      VisualVault
    Purpose:       Get list of selected records from an RRC.  This is called from a form button instead of an RRC button.
    Parameters:    The following represent variables passed into the function:  
                   rrcName - Name of the RRC control

    Return Value:  The following represents the value being returned from this function:
                        docIDs:  Returns an array of doc IDs 


    Date of Dev: ???
    Last Rev Date: 22/06/2022

    Revision Notes:
    26/04/2022 - Facundo Cameto:    Added header
                                    Updated variable definitions
                                    Updated For loop
*/

const rrcControl = $('[VVFieldName="' + rrcName + '"]')[0];
const rrcRows = rrcControl.childNodes[3].childNodes[3].childNodes[0].childNodes[1].childNodes;
const selectedRows = [];
const docIDs = [];
let attributes;
let keepLooking = false;

// Loop through all the rows
for (let row = 0; row < rrcRows.length; row++) {
    if (rrcRows[row].nodeName == 'TR') {
        // Check if the row is selected by looking inside the checkbox
        if (rrcRows[row].childNodes[0].childNodes[0].checked == true) {
            // Add the row to the selected rows array
            selectedRows.push(rrcRows[row]);
        }
    }
}

// Loop through all the selected rows
for (let selectedRow = 0; selectedRow < selectedRows.length; selectedRow++) {
    keepLooking = true;
    // Get checkbox attributes
    attributes = selectedRows[selectedRow].childNodes[0].childNodes[0]['attributes'];

    // Loop through all the attributes for the selected row
    for (let attribute = 0; attribute < attributes.length && keepLooking; attribute++) {
        // Check if the attribute is the document ID
        if (attributes[attribute]) {
            if (attributes[attribute].name == 'data-dataid') {
                // Add the document ID to the docIDs array
                docIDs.push(attributes[attribute].value);
                // Stop looking in this row and move on to the next row
                keepLooking = false;
            }
        }
    }
}

return docIDs;