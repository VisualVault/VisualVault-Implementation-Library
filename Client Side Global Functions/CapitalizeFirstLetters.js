/*
    Script Name:   CapitalizeFirstLetter
    Customer:      VisualVault
    Purpose:       This global function upper cases the first letter of each word in a string value
    Parameters:    The following represent variables passed into the function:  
                   -fieldName: The field name
    Return Value:  The following represents the value being returned from this function:
                        -newFieldValue (string)
                        or
                        -fieldValue (string)
    Notes:  This function does not modify the casing of the rest letters
    Date of Dev: 09/14/2019  
    Last Rev Date: 05/19/2022
    Revision Notes:
    09/14/2019 - Kendra Austin: Initial creation of the business process.
    05/19/2022 - Petosa Ayala Franco: Script updated to ES6. 
*/

const fieldValue = VV.Form.GetFieldValue(fieldName);

//check the passed string value is not a blank space
if ( fieldValue.trim().length > 0) {
    let newFieldValue = '';
    let newFieldValuesArr = [];
    const fieldValuesArray = fieldValue.trim().split(' ');

    //build up the new field value array
    fieldValuesArray.forEach( word => {
        if( word != '') {
            // only if the element is not a blank space, upper case the first letter and add it to the array
            const upperCaseLetter = word[0].toUpperCase();
            const newWord = upperCaseLetter + word.substring(1);
            newFieldValuesArr.push(newWord);
        }
    });
    
    //build up the new field value
    newFieldValue = newFieldValuesArr.join(' ')
    return newFieldValue;
}else {
    return fieldValue;
}
