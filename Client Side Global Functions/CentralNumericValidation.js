/*
    Script Name:   CentralNumericValidation
    Customer:      VisualVault
    Purpose:       The purpose of this function is to allow the validation and comparison of numbers.
    Parameters:    The following represent variables passed into the function:  
                    Passed Values:  PassedControlValue, ComparisonValue, ValidationType
                    The purpose of this function is to make sure a value is a number and that it is within a certain comparable range.
                    The following are passed into this function in the following order:
                    PassedControlValue - the value of the control being compared.
                    ComparisonValue - the value that is being compared.  Can come in as a string.
                    ValidationType - this is a string passed for the type of validation that should occur.  Valid values are GreaterThan, LessThan, Equals, GreaterThanEqualTo, LessThanEqualTo
    Return Value:  The following represents the value being returned from this function:
                    True if required number are selected, false if not.        
    Date of Dev:   
    Last Rev Date: 06/01/2011
    Revision Notes:
    06/01/2011 - Jason Hatch: Initial creation of the business process. 
*/

// If 'PassedControlValue' or ComparisonValue are false values or equal to ' ' (string with space)...
if (!PassedControlValue || !ComparisonValue || PassedControlValue === ' ' || ComparisonValue === ' '
) {
    return false;
} else {
    PassedControlValue = Number(PassedControlValue);
    ComparisonValue = Number(ComparisonValue);

    switch (ValidationType) {
        case 'GreaterThan':
            return PassedControlValue > ComparisonValue;

        case 'LessThan':
            return PassedControlValue < ComparisonValue;

        case 'Equals':
            return PassedControlValue === ComparisonValue;

        case 'GreaterThanEqualTo':
            return PassedControlValue >= ComparisonValue;

        case 'LessThanEqualTo':
            return PassedControlValue <= ComparisonValue;

        default:
            alert('The right validation was not passed to the CentralNumericValidation Function');
    }
}
