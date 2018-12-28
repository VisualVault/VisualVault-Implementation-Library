
/*
    Script Name:   MeasureArrayofFields
    Customer:      VisualVault
    Purpose:       The purpose of this function is to output the value and count of fields in a passed array of field names.
    Parameters:    The following represent variables passed into the function:  
                   fieldArray, fieldType
                   fieldArray is an array of field names.
                   fieldType can be DDText or DDValue if the drop-down text or value is what should be measured.
                        Otherwise, GetFieldValue() will be used. 
    Return Value:  The following represents the value being returned from this function:
                        measuredValues: An array of objects with Value and Count properties, representing the distinct values found
                                        in the array of fields and the count of how many of those values were found. 
    Date of Dev:   10/01/2018
    Last Rev Date: 
    Revision Notes:
    10/01/2018 - Kendra Austin: Initial creation of the business process. 
*/

//We'll need an array (of objects) to store the results
var measuredValues = [];

//Go through each item in the array
fieldArray.forEach(function(fieldName) {
    //declare an object to store the value of the field. This is the object.
    var fieldValue = { Value: '', Count: 1 };

    // Get the value of each field, depending on the field type
    if (fieldType = 'DDText') {
        fieldValue.Value = VV.Form.getDropDownListText(fieldName);
    }
    else if (fieldType = 'DDValue') {
        fieldValue.Value = VV.Form.GetDropDownListItemValue(fieldName);
    }
    else {
        fieldValue.Value = VV.Form.GetFieldValue(fieldName);
    }

    // If this is the first item in the fieldArray, just push it to the measuredValues array, making it the first object in that array
    if (fieldName == String(fieldArray[0])) {
        measuredValues.push(fieldValue);
    }
    //Otherwise, go through the logic to figure out whether the object should iterate the count of an object with equal "value" characteristic, or if it should be pushed to the end of the measuredValues array
    else {
        //Create a variable to track whether a similar value was found in the measuredValues array
        var valueFound = false;

        //check if the value is already an object in the measuredValues array
        measuredValues.forEach(function(fieldItem) {
            //if it is, increase the count of that object by one and track that you found the object
            if (fieldValue.Value == fieldItem.Value) {
                fieldItem.Count = fieldItem.Count + 1;
                valueFound = true; 
            }
        });

        //if the value was not found after going through the whole array, create a new object with a count of 1 and push it to the array
        if (valueFound == false) {
            measuredValues.push(fieldValue);
        }
    }
});

//When done, return the array of objects
return measuredValues;
