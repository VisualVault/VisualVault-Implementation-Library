/*
    Script Name:   FormatSSN
    Customer:      VisualVault
    Purpose:       Purpose of function is to take a Social Security Number entered in any format and format it into a standard of XXX-XX-XXXX
                    
    Parameters:    The following represent variables passed into the function:  
                    SocialSecurityNumber - Pass in a string that represents the Social Security Number.
                   
    Return Value:  The following represents the value being returned from this function:
                    Formatted string representing the Social Security Number.         
    Date of Dev:   
    First Rev Date: 06/01/2017
    Last Rev Date: 06/21/2022
    Revision Notes:
    06/01/2017 - Jason Hatch: Initial creation of the business process. 
    06/21/2022 - Facundo Cameto: -Renamed variables
                                 -Changed variable definitions
                                 -toString() added, removed the ""+SocialSecurityNumber
*/

//Remove everything that isn't a digit.
const SocialSecurityNumberStr = (SocialSecurityNumber.toString()).replace(/\D/g, '');

if (SocialSecurityNumberStr.length < 9) {   //Have not fully keyed in the number so just return what they have keyed in.
    return SocialSecurityNumber;
}
else if (SocialSecurityNumberStr.length > 9) {   //Have too many digits number so just return what they have keyed in.
    return SocialSecurityNumber;
}
else if (SocialSecurityNumberStr.length == 9) {  //Social Security Number starts with three digits.
    const dividedNums = SocialSecurityNumberStr.match(/^(\d{3})(\d{2})(\d{4})$/);
    return (!dividedNums) ? null : dividedNums[1] + "-" + dividedNums[2] + "-" + dividedNums[3];
}