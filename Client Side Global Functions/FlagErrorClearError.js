//The purpose of this function is to set or clear error messages on an etire array of fields.
//Passed Parameters: (fieldArray, flagType, errorMessage)
//flagType can be 'error' or 'clear'

fieldArray.forEach(function(fieldItem) {
    if (flagType == 'error') {
        VV.Form.SetValidationErrorMessageOnField(fieldItem, errorMessage);
    }
    else if (flagType == 'clear') {
        VV.Form.ClearValidationErrorOnField(fieldItem);
    }
    else {
        //do nothing
    }
});
