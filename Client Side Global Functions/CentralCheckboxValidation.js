/*
    Script Name:   CentralCheckboxValidation
    Customer:      VisualVault
    Purpose:       The purpose of this function is to make sure a required number of checkboxes have been checked.
                   Validation errors will be handled outside of this script(e.g inside the FormValidation()).
    Parameters:    The following represent variables passed into the function:  
                    checkboxArray - An array with all the checkbox values that need to be checked. Values are 'true' or 'false'.
                    requiredNumber - The number of required checkboxes. Value must be greater than or equal to 1.
    Return Value:  The following represents the value being returned from this function:
                    True if the required number of check boxes are selected, false if not.
                    False if checkboxArray length is equal to zero.
                    False if the requiredNumber is greater than the checkboxArray length.
                    False if the requiredNumber is equal to zero.      
    Date of Dev:   06/01/2017
    Last Rev Date: 05/26/2022
    Revision Notes:
    06/01/2017 - Cesar Perez: Initial creation of the business process.
    05/26/2022 - Franco Petosa Ayala: Update to ES6.
                                      The second conditional structure was placed out of the loop structure.
                                      Some comments were removed or corrected
                                      The variable 'checked' was renamed to 'checkedBoxes' to make it is more descriptive.
*/

//The following are passed into this function in the following order:

// Check for empty array
if (checkboxArray.length === 0) {
    return false;
}

// Check for correct requiredNumber. Set default to 1.
if ( requiredNumber < 1 || requiredNumber > checkboxArray.length) {
    return false;
}

// count number of selected check boxes
let checkedBoxes = 0;

// iterates the array and counts the 'true' values
checkboxArray.forEach( checkbox => {
    if(checkbox === 'true' || checkbox === 'True') {
        checkedBoxes++;
    }
});

// if required number of boxes are checked, returns true otherwhise false
if(checkedBoxes === requiredNumber) {
    return true;
}else {
    return false;
}