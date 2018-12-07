// CopyField Global Function
// Purpose:  Copy a field to another field.  ForceUpdate used to determine if the field should overrite targetField or not.
// parameters:  sourceField, targetField, fieldTypeSource, fieldTypeTarget, forceUpdate (0 = no, 1 = yes)
//              fieldType will be DDText for drop down or DDValue for value.  Any other value will just get the field as is.

var sourceValue = '';
var targetValue = '';

//Get source field values
if (fieldTypeSource == 'DDValue') {
    sourceValue = VV.Form.GetDropDownListItemValue(sourceField);
}
else if (fieldTypeSource == 'DDText') {
    sourceValue = VV.Form.getDropDownListText(sourceField);
}
else {
    sourceValue = VV.Form.GetFieldValue(sourceField);
}

//Get target field values
if (fieldTypeTarget == 'DDValue') {
    targetValue = VV.Form.GetDropDownListItemValue(targetField);
}
else if (fieldTypeTarget == 'DDText') {
    targetValue = VV.Form.getDropDownListText(targetField);
}
else {
    targetValue = VV.Form.GetFieldValue(targetField);
}

//Determine how to copy.
//1 = update the value regardless.
if (forceUpdate == 1) {

    VV.Form.SetFieldValue(targetField, sourceValue);
}
else {
    //If a value exists in the field, do not update.
    if (targetValue == 'Select Item' && (fieldTypeTarget == 'DDValue' || fieldTypeTarget == 'DDText')) {
        VV.Form.SetFieldValue(targetField, sourceValue);
    }
    else if (targetValue == '' && fieldTypeTarget != 'DDValue' && fieldTypeTarget != 'DDText') {
        VV.Form.SetFieldValue(targetField, sourceValue);
    }
}

