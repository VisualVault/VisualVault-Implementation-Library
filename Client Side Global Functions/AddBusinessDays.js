/*
    Script Name:   AddBusinessDays
    Customer:      VisualVault
    Purpose:       This function takes in a specific date and a number.  Then it adds the number of business days to the date.  
    Parameters:    The following represent variables passed into the function:  
                   dDate:         date as a string from getfieldvalue.
                   passednumDays: number value.

    Return Value:  The following represents the value being returned from this function:
                        NDate:  Short Date of the new date.        


    Date of Dev:   06/01/2017
    Last Rev Date: 

    Revision Notes:
    06/01/2017 - Jason Hatch: Initial creation of the business process. 

*/



var passedDate = new Date(dDate);
var d = new Date(passedDate.getTime());
var n = new Number(passednumDays);

var day = d.getDay();


d.setDate(d.getDate() + n + (day === 6 ? 2 : +!day) + (Math.floor((n - 1 + (day % 6 || 1)) / 5) * 2));

var NMonth = d.getMonth();
NMonth = NMonth + 1;
var NDay = d.getDate();
var NYear = d.getFullYear();

var NDate = NMonth + '/' + NDay + '/' + NYear;
return NDate;
