/*
Function: RRCGetSelectedItemsfromFormButton
Purpose:  Get list of selected records from an RRC.  This is called from a form button instead of an RRC button.
Parameters: rrcName: Name of the RRC control
*/

var rrcControl = $('[VVFieldName="' + rrcName + '"]')[0];
var rrcRows = rrcControl.childNodes[0].childNodes[4].childNodes[2].childNodes[1].childNodes[0].childNodes[0].childNodes[1].childNodes;
var selectedRows = [];
var docIDs = [];
var context = null;
var keepLooking = false;

// Loop through all the rows
for (var row = 0; row < rrcRows.length; row++) {
    if (rrcRows[row].nodeName == 'TR') {
        // Check if the row is selected
        if (rrcRows[row].getAttribute('class').includes('selected')) {
            // Add the row to the selected rows array
            selectedRows.push(rrcRows[row]);
        }
    }
}

// Loop through all the selected rows
for (var selectedRow = 0; selectedRow < selectedRows.length; selectedRow++) {
    keepLooking = true;
    // Get data context
    context = selectedRows[selectedRow]['__ngContext__'];

    // Loop through all the data context for the selected row
    for (var key = 0; key < context.length && keepLooking; key++) {
        // Check if the key is the document ID
        if (context[key] && typeof context[key] === 'object') {
            if (context[key].docId) {
                // Add the document ID to the docIDs array
                docIDs.push(context[key].docId);
                // Stop looking in this row and move on to the next row
                keepLooking = false;
            }
        }
    }
}

return docIDs;
