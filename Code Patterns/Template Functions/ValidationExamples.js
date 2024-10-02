//pass in ControlName to validate a single item or nothing to validate everything.
let ErrorReporting = true;
let RunAll = false;
let FieldName = "";

if (ControlName == null) {
    RunAll = true;
}

//Drop-down must be selected
if ( ControlName = FieldName || RunAll){
    if (!VV.Form.IsFieldReadOnly('DropDownFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('DropDownFieldName'), 'DDSelect') == false) {
            VV.Form.SetValidationErrorMessageOnField('DropDownFieldName', 'A value needs to be selected.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('DropDownFieldName');
        }
    }
}

//Text Box that must be filled out
if (ControlName == 'TextBoxFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('TextBoxFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('TextBoxFieldName'), 'Blank') == false) {
            VV.Form.SetValidationErrorMessageOnField('TextBoxFieldName', 'A value needs to be entered.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('TextBoxFieldName');
        }
    }
}

//Cell (number) field must have a number entered.
if (ControlName == 'NumberFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('NumberFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('NumberFieldName'), 'NumberOnly') == false) {
            VV.Form.SetValidationErrorMessageOnField('NumberFieldName', 'A number needs to be entered.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('NumberFieldName');
        }
    }
}


//Only validate zip code format if something is entered. If field is blank, it is not required.
if (ControlName == 'ZipCodeFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('ZipCodeFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('ZipCodeFieldName'), 'Blank') == true) {
            if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('ZipCodeFieldName'), 'Zip') == false) {
                VV.Form.SetValidationErrorMessageOnField('ZipCodeFieldName', 'When a zip code is entered, it should be in the format of XXXXX or XXXXX-XXXX.');
                ErrorReporting = false;
            }
            else {
                VV.Form.ClearValidationErrorOnField('ZipCodeFieldName');
            }
        }
        else {
            VV.Form.ClearValidationErrorOnField('ZipCodeFieldName');
        }
    }
}

//Zip code is required and must be in a zip code format.
if (ControlName == 'ZipCodeFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('ZipCodeFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('ZipCodeFieldName'), 'Zip') == false) {
            VV.Form.SetValidationErrorMessageOnField('ZipCodeFieldName', 'A zip code needs to be entered, and it must be in the format of XXXXX or XXXXX-XXXX.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('ZipCodeFieldName');
        }
    }
}

//Only validate FEIN format if something is entered. If field is blank, it is not required. 
if (ControlName == 'FEINFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('FEINFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('FEINFieldName'), 'Blank') == true) {
            if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('FEINFieldName'), 'EIN') == false) {
                VV.Form.SetValidationErrorMessageOnField('FEINFieldName', 'When an FEIN is entered, it should be in the format of XX-XXXXXXX.');
                ErrorReporting = false;
            }
            else {
                VV.Form.ClearValidationErrorOnField('FEINFieldName');
            }
        }
        else {
            VV.Form.ClearValidationErrorOnField('FEINFieldName');
        }
    }
}

//Validate FEIN format. FEIN is required. 
if (ControlName == 'FEINFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('FEINFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('FEINFieldName'), 'EIN') == false) {
            VV.Form.SetValidationErrorMessageOnField('FEINFieldName', 'A value needs to be entered for the FEIN and it needs to be in the format of XX-XXXXXXX.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('FEINFieldName');
        }
    }
}

//Phone number is optional, but must be a phone number format when entered. 
if (ControlName == 'PhoneFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('PhoneFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('PhoneFieldName'), 'Blank') == true) {
            if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('PhoneFieldName'), 'Phone') == false) {
                VV.Form.SetValidationErrorMessageOnField('PhoneFieldName', 'When a phone number is entered, it must be in the format of (XXX) XXX-XXXX.');
                ErrorReporting = false;
            }
            else {
                VV.Form.ClearValidationErrorOnField('PhoneFieldName');
            }
        }
        else {
            VV.Form.ClearValidationErrorOnField('PhoneFieldName');
        }
    }
}

//Phone Number is required and must be a phone number format when entered. 
if (ControlName == 'PhoneFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('PhoneFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('PhoneFieldName'), 'Phone') == false) {
            VV.Form.SetValidationErrorMessageOnField('PhoneFieldName', 'A phone number must be entered in the format of (XXX) XXX-XXXX.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('PhoneFieldName');
        }
    }
}

//Website is optional, but when it is entered it must be in a valid URL format.
if (ControlName == 'WebsiteFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('WebsiteFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('WebsiteFieldName'), 'Blank') == true) {
            if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('WebsiteFieldName'), 'URL') == false) {
                VV.Form.SetValidationErrorMessageOnField('WebsiteFieldName', 'When a website is entered, it must be in the form of a valid URL.');
                ErrorReporting = false;
            }
            else {
                VV.Form.ClearValidationErrorOnField('WebsiteFieldName');
            }
        }
        else {
            VV.Form.ClearValidationErrorOnField('WebsiteFieldName');
        }
    }
}

//Website is required and must be entered in a valid URL format. 
if (ControlName == 'WebsiteFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('WebsiteFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('WebsiteFieldName'), 'URL') == false) {
            VV.Form.SetValidationErrorMessageOnField('WebsiteFieldName', 'Please enter the website in the form of a valid URL.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('WebsiteFieldName');
        }
    }
}

//Email Address is optional, but when entered, it must be in a valid email address format.
if (ControlName == 'EmailFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('EmailFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('EmailFieldName'), 'Blank') == true) {
            if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('EmailFieldName'), 'Email') == false) {
                VV.Form.SetValidationErrorMessageOnField('EmailFieldName', 'When an email address is entered, it must be in the form of a valid Email Address.');
                ErrorReporting = false;
            }
            else {
                VV.Form.ClearValidationErrorOnField('EmailFieldName');
            }
        }
        else {
            VV.Form.ClearValidationErrorOnField('EmailFieldName');
        }
    }
}

//Email Address is required and must be entered as a valid email address format.
if (ControlName == 'EmailFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('EmailFieldName')) {
        if (VV.Form.Global.CentralValidation(VV.Form.GetFieldValue('EmailFieldName'), 'Email') == false) {
            VV.Form.SetValidationErrorMessageOnField('EmailFieldName', 'Please enter the Email in the form of a valid Email Address.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('EmailFieldName');
        }
    }
}

//Date must be before today
if (ControlName == 'DateFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('DateFieldName')) {
        if (VV.Form.Global.CentralDateValidation(VV.Form.GetFieldValue('DateFieldName'), 'BeforeToday') == false) {
            VV.Form.SetValidationErrorMessageOnField('DateFieldName', 'The date must be before today.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('DateFieldName');
        }
    }
}

//Date must be today or before today
if (ControlName == 'DateFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('DateFieldName')) {
        if (VV.Form.Global.CentralDateValidation(VV.Form.GetFieldValue('DateFieldName'), 'TodayorBefore') == false) {
            VV.Form.SetValidationErrorMessageOnField('DateFieldName', 'The date must be today or before today.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('DateFieldName');
        }
    }
}

//Date must be after today
if (ControlName == 'DateFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('DateFieldName')) {
        if (VV.Form.Global.CentralDateValidation(VV.Form.GetFieldValue('DateFieldName'), 'AfterToday') == false) {
            VV.Form.SetValidationErrorMessageOnField('DateFieldName', 'The date must be after today.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('DateFieldName');
        }
    }
}

//Date must be today or after today
if (ControlName == 'DateFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('DateFieldName')) {
        if (VV.Form.Global.CentralDateValidation(VV.Form.GetFieldValue('DateFieldName'), 'TodayorAfter') == false) {
            VV.Form.SetValidationErrorMessageOnField('DateFieldName', 'The date must be today or after today.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('DateFieldName');
        }
    }
}

//Date must be before another date field
if (ControlName == 'DateFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('DateFieldName')) {
        if (VV.Form.Global.CentralDateValidation(VV.Form.GetFieldValue('DateFieldName'), 'DateBefore', VV.Form.GetFieldValue('SecondDateFieldName')) == false) {
            VV.Form.SetValidationErrorMessageOnField('DateFieldName', 'The date must be before the second date.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('DateFieldName');
        }
    }
}

//Date must be after another date field
if (ControlName == 'DateFieldName' || RunAll) {
    if (!VV.Form.IsFieldReadOnly('DateFieldName')) {
        if (VV.Form.Global.CentralDateValidation(VV.Form.GetFieldValue('DateFieldName'), 'DateAfter', VV.Form.GetFieldValue('SecondDateFieldName')) == false) {
            VV.Form.SetValidationErrorMessageOnField('DateFieldName', 'The date must be after the second date.');
            ErrorReporting = false;
        }
        else {
            VV.Form.ClearValidationErrorOnField('DateFieldName');
        }
    }
}

return ErrorReporting;
