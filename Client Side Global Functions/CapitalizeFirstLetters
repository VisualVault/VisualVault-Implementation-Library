//parameters: fieldName

//Global Function to Capitalize the first letter of each word in a field.
//This function does not change the casing of other letters

var fieldValue = VV.Form.GetFieldValue(fieldName);
var newFieldValue = '';

if (fieldValue != '' && fieldValue != ' ') {
    var fieldValuesArray = fieldValue.trim().split(' ');

    fieldValuesArray.forEach(function (word) {
        var upperCaseLetter = word[0].toUpperCase();
        var newWord = upperCaseLetter + word.substring(1);

        if (newFieldValue == '') {
            newFieldValue = newWord;
        }
        else {
            newFieldValue += ' ' + newWord;
        }
    });

    return newFieldValue;
}
else {
    return fieldValue;
}
