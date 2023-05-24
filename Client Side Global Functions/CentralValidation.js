/*
    Script Name:   CentralValidation
    Customer:      VisualVault
    Purpose:       The purpose of this function is to validate the format and type of data for various data types.
    Parameters:    The following represent variables passed into the function:  
                    Passed Parameters:  PassedValue, ValidationType
                    PassedValue - this is a string of the value that is being checked.
                    ValidationType - this is the type of validation that will occur.  Value values are as follows:
                          Phone, Email, URL, Blank, Zip, DDSelect, SSN, EIN, NPI, Currency, Percent, NumberOnly, MedicaidRecipientID, MedicaidProviderID
                    These work in conjunction with the SetupReg file where all the regular expressions are stored.
    Return Value:  The following represents the value being returned from this function:
                    True if required number are selected, false if not.        
    Date of Dev:   06/01/2011
    Last Rev Date: 05/24/2022
    Revision Notes:
    06/01/2011 - Jason Hatch:         Initial creation of the business process. 
    04/15/2019 - Maxwell Rehbein:     NumberOnly created. 
    07/22/2020 - Kendra Austin:       Two medicaid ID types created.
    05/24/2022 - Franco Petosa Ayala: Update function to ES6.
                                      Replace the conditional argument typeof VV.Form.Global.EmailReg === 'undefined' for !VV.Form.Global.EmailReg
                                      The alert function from the default case of the switch conditional structure was replaced for the global function DisplayMessaging
*/

let PassedControlValue = '';

//check if the regular expression are already created
if (!VV.Form.Global.EmailReg) VV.Form.Global.SetupReg();

// if PassedValue returns actual value
if (PassedValue) {
    PassedControlValue = PassedValue.trim();
} else {
    return false;
}

// Case's return true only if passed value is not empty and passes RegEx test.
switch (ValidationType) {
    case 'Phone':
        return VV.Form.Global.PhoneReg.test(PassedControlValue);

    case 'Email':
        return VV.Form.Global.EmailReg.test(PassedControlValue);

    case 'URL':
        return VV.Form.Global.URLReg.test(PassedControlValue);

    case 'Blank':
        return VV.Form.Global.BlankReg.test(PassedControlValue);

    case 'Zip':
        return VV.Form.Global.ZipReg.test(PassedControlValue);

    case 'DDSelect':
        return VV.Form.Global.DDSelectReg.test(PassedControlValue);

    case 'SSN':
        return VV.Form.Global.SSN.test(PassedControlValue);

    case 'EIN':
        return VV.Form.Global.EIN.test(PassedControlValue);

    case 'NPI':
        return VV.Form.Global.NPI.test(PassedControlValue);

    case 'Currency':
        return VV.Form.Global.Currency.test(PassedControlValue);

    case 'Percent':
        return VV.Form.Global.Percent.test(PassedControlValue);

    case 'NumberOnly':
        return VV.Form.Global.NumberOnly.test(PassedControlValue);

    case 'MedicaidRecipientID':
        return VV.Form.Global.MedicaidIDRecipient.test(PassedControlValue);

    case 'MedicaidProviderID':
        return VV.Form.Global.MedicaidIDProvider.test(PassedControlValue);

    default:
        VV.Form.Global.DisplayMessaging(`The right validation was not passed to the CentralValidation Function: <b>${ValidationType}</b>`, 'CentralValidation');
        return false;
}
