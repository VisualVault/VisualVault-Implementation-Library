//pass in ControlName to validate a single item or nothing to validate everything.
var ErrorReporting = true;
var RunAll = false;
if (ControlName == null) {
    RunAll = true;
}


if (ControlName == 'First Name' || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('First Name'), 'Blank') == false) {
        VV.Form.SetValidationErrorMessageOnField('First Name', 'A value needs to be entered for the First Name.');
        ErrorReporting = false;
    }
    else {
        VV.Form.ClearValidationErrorOnField('First Name');
    }
}

if (ControlName == 'Last Name' || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('Last Name'), 'Blank') == false) {
        VV.Form.SetValidationErrorMessageOnField('Last Name', 'A value needs to be entered for the Last Name.');
        ErrorReporting = false;
    }
    else {
        VV.Form.ClearValidationErrorOnField('Last Name');
    }
}

if (ControlName == 'Email' || RunAll) {
    if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('Email'), 'Blank') == false) {
        VV.Form.SetValidationErrorMessageOnField('Email', 'Please enter the Email in the form of a valid Email.');
        ErrorReporting = false;
    }
    else {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('Email'), 'Email') == false) {
            VV.Form.SetValidationErrorMessageOnField('Email', 'Please enter the Email in the form of a valid Email.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('Email');
        }
    }
}

//Add other validation as appropriate to the implementation.

if (ErrorReporting == false) {
    return false;
} else {
    return true;
}
