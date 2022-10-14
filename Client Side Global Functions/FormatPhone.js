/*
    Script Name:   FormatPhone
    Customer:      VisualVault
    Purpose:       The purpose of this founction is to take a phone number entered in any format and format it into a 
                    standard of (XXX) XXX-XXXX or (XXX) XXX-XXXX x12345 with 1 to 5 characters in the extension.
                    
    Parameters:    The following represent variables passed into the function:  
                    phoneNumber - Pass in a string that represents the phone number.
                   
    Return Value:  The following represents the value being returned from this function:
                    Formatted string representing the phone number.         
    Date of Dev:   
    First Rev Date: 06/01/2017
    Last Rev Date: 06/21/2022
    Revision Notes:
    06/01/2017 - Jason Hatch: Initial creation of the business process. 
    06/21/2022 - Facundo Cameto: -Renamed variables
                                 -Changed variable definitions
                                 -toString() added, removed the ""+phoneNumber
*/

//Remove all characters
const phoneNumberStr = (phoneNumber.toString()).replace(/\D/g, '');

if (phoneNumberStr.length < 10) {   //Have not fully keyed in the phone number so just return what they have keyed in.
    return phoneNumber;
}
else if (phoneNumberStr.length > 15) {  //Have too many numbers for a US number, return phone number.
    return phoneNumber;
}
else if (phoneNumberStr.length == 10) {  //Phone number is a number without extension.
    const dividedNums = phoneNumberStr.match(/^(\d{3})(\d{3})(\d{4})$/);
    return (!dividedNums) ? null : "(" + dividedNums[1] + ") " + dividedNums[2] + "-" + dividedNums[3];
}
else {      //Phone number has an extenstion, format it into the 4 groups.
    const dividedNums = phoneNumberStr.match(/^(\d{3})(\d{3})(\d{4})(\d{1,5})?$/);
    return (!dividedNums) ? null : "(" + dividedNums[1] + ") " + dividedNums[2] + "-" + dividedNums[3] + " x" + dividedNums[4];
}
